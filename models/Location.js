const Keys = require('../config/Keys.js');
const Utilities = require('../Utilities.js');
const QueryParser = require('../models/QueryParser.js');
const FileParser = require('../models/FileParser.js');
const Location = require('../models/Location.js');
const User = require('../models/User.js');
const Licence = require('../models/Licence.js');
const City = require('../models/City.js');
const Country = require('../models/Country.js');
const Geocoder = require('../models/Geocoder.js');
const ActivityLog = require('../models/ActivityLog.js');
const Dataset = require('../models/Dataset.js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Client } = require('pg');

const API_DATABASE_MAPPING_FIELDS = {
    'any': 'quickSearchStr',
    'originals': 'originalFields',
    'name': 'name',
    'address': 'streetHouse","postcode","cityName","countryName',
    'features': 'features',
    'categories': 'categories',
    'licence': 'licenceId',
    'dataset': 'datasetId',
    'author': 'userId',
    'id': 'id',
    'email': 'email',
    'tel': 'tel',
    'website': 'website',
    'coordinates': 'locationPoint","locationPath","locationPolygon'
}

const API_DATABASE_MAPPING_QUERY = {
    'any': 'quickSearchStr',
    'name': 'name',
    'postcode': 'postcode',
    'streetHouse': 'streetHouse',
    'city': 'cityName',
    'country': 'countryName',
    'features': 'features',
    'categories': 'categories',
    'authorId': 'userId',
    'id': 'id',
    'datasetId': 'datasetId',
    'authorId': 'userId',
    'email': 'email',
    'tel': 'tel',
    'website': 'website',
}

const DATASET_PRIVATE_FIELDS = [
    "id",
    "userId",
    "marker",
    "path",
    "polygon",
    "datasetId",
    "uniqueId",
    "name",
    "locationPath",
    "locationPoint",
    "locationPolygon",
    "isApproved",
    "isDeleted",
    "formattedLocation",
    "quickSearchStr",
    "fields",
    "originalFields",
    "categories",
    "features",
    "website",
    "tel",
    "email",
    "name",
    "streetHouse",
    "cityName",
    "cityId",
    "countryName",
    "countryId",
    "postcode",
    "error",
    "datasetDefaultOverrides",
    "updatedAt",
    "createdAt",
    "licenceId",
    "errorRowI"
];

class LocationModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        if (args) {

            DATASET_PRIVATE_FIELDS.forEach((paramName, i) => {
                if (args[paramName]) {
                    this[paramName] = args[paramName];
                }
            });

        }

    }

    // Returns the number of locations in a city, country or dataset
    static async getCountByEntityId(entityType, entityId) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT count(id) as "count"
                FROM locations
                WHERE ( "isDeleted" <> true OR "isDeleted" IS NULL )
                AND ("isApproved" = true AND "isApproved" IS NOT NULL)
                AND "${entityType}Id" = $1
            `

            let params = [entityId];

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows ? res.rows[0].count : 0); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a list of locations in a city, country or dataset
    static async getByEntityId(entityType, entityId, page, keywords, isCurrentUser) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT *
                FROM locations
                WHERE
                    ( "isDeleted" <> true OR "isDeleted" IS NULL )
                ${ (!isCurrentUser) ? 'AND (locations."isApproved" = true AND locations."isApproved" IS NOT NULL)' : '' }
                AND
                    "${entityType}Id" = $2
                ${ (keywords) ? "AND (LOWER(\"quickSearchStr\") LIKE '%' || $3 || '%'  )" : '' }
                ORDER BY updatedat DESC
                LIMIT 25 OFFSET $1
            `

            let params = [(page*25), entityId];

            if (keywords) {
                params.push(keywords.toLowerCase());
            }

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Compiles a location object using the field mapping into a database object
    static async compileLocationObject(entity, dataset, fieldMappings, userId, id, uniqueId, isApproved, uniqueIds, individualEdit, entityFull, queueI) {

        let newLocation = {
            userId: userId,
            datasetId: id ? parseInt(id) : null,
            licenceId: (dataset && dataset.licenceId) ? dataset.licenceId : 2 // Inherit from dataset or CC0 (id = 2)
        }

        if (!individualEdit) {
            newLocation.originalFields = entity;
        }

        if (!dataset) {
            newLocation.originalFields = entityFull.originalFields
        }

        let latitudeField, longitudeField, locationName, locationToGeocode, latitude, longitude, locationWebsite;

        // For Locations in dataset
        if (dataset) {

            latitudeField = fieldMappings["latitude"] ? fieldMappings["latitude"][0] : null;
            longitudeField = fieldMappings["longitude"] ? fieldMappings["longitude"][0] : null;

            // Location name
            locationName = "";
            for (var j = 0; j < fieldMappings.name.length; j++) {
                let fieldName = fieldMappings.name[j];
                // console.log(entity, fieldName, "=====================")
                locationName += FileParser.resolveNestedObjectField(entity, fieldName) + " ";
            }
            newLocation.name = locationName.trim();

            // Location website
            if (fieldMappings.website && fieldMappings.website[0]) {

                let locationWebsiteFieldName = fieldMappings.website[0];
                locationWebsite = FileParser.resolveNestedObjectField(entity, locationWebsiteFieldName);
                locationWebsite = locationWebsite ? locationWebsite.trim() : "";

                if ( (locationWebsite) && (locationWebsite.indexOf("javascript:") === -1) ) {
                    let match = locationWebsite.match(/(https?:\/\/[^\s]+)/g)
                    if (match) newLocation.website = match[0];
                }

            }

            // Location tel
            if (fieldMappings.tel && fieldMappings.tel[0]) {
                let locationTelFieldName = fieldMappings.tel[0];
                let locationTel = FileParser.resolveNestedObjectField(entity, locationTelFieldName);
                locationTel = locationTel ? locationTel.trim() : "";
                if (locationTel) newLocation.tel =locationTel
            }

            // Email
            if (fieldMappings.email && fieldMappings.email[0]) {

                let locationEmailFieldName = fieldMappings.email[0];
                let locationEmail = FileParser.resolveNestedObjectField(entity, locationEmailFieldName);
                locationEmail = locationEmail ? locationEmail.trim() : "";

                if (locationEmail) {
                    if (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(locationEmail)) {
                        newLocation.email = locationEmail
                    }
                }

            }


            if (newLocation.name === "") {
                newLocation.error = "Empty Name Field";
                newLocation.name = "Untitled";
            }

        } else {

            newLocation.name = entity.name ? entity.name.trim() : "";
            newLocation.website = entity.website ? entity.website.trim() : "";
            newLocation.tel = entity.tel ? entity.tel.trim() : "";
            newLocation.email = entity.email ? entity.email.trim() : "";

            // Escaping js injection from href
            if ( (locationWebsite) && (locationWebsite.indexOf("javascript:") === -1) ) {
                let match = newLocation.website.match(/^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$/gm)
                if (!match) {
                    newLocation.error = "Invalid website";
                    return newLocation;
                }
            }

            if (newLocation.email) {
                if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(newLocation.email)) {
                    newLocation.error = "Invalid email address";
                    return newLocation;
                }
            }

            if (!newLocation.name) {
                newLocation.error = "Empty Name Field";
                return newLocation;
            }

        }

        // include https if not defined
        if (newLocation.website && !newLocation.website.startsWith("http")) {
            newLocation.website = "https://" + newLocation.website
        }

        // Location is overriden in dataset or individual location
        if ( (entityFull && entityFull.datasetDefaultOverrides && entityFull.datasetDefaultOverrides.location) || (!dataset) ) {

            let coordinates = dataset ? entityFull.datasetDefaultOverrides.location.data : entityFull.originalFields['___coordinates___'];
            let address = dataset ? entityFull.datasetDefaultOverrides.location.str : entityFull.originalFields;
            let locationType = dataset ? entityFull.datasetDefaultOverrides.location.type : entityFull.originalFields['___location_type___'];

            if (!coordinates || coordinates.length === 0) {
                newLocation.error = "No coordinates defined";
                return newLocation;
            }

            if (!address || !address.postcode || !address.streetHouse || !address.city || !address.country ) {
                newLocation.error = "Not all address components are filled out";
                return newLocation;
            }

            if (locationType === "point") {

                if (coordinates.length !== 1) {
                    newLocation.error = "A point can only have one coordinate.";
                    return newLocation;
                }

                newLocation.locationPoint = "(" + coordinates[0].lat + ',' + coordinates[0].lng + ")";

                // Overrdingin dataset defaults
                if (dataset && entityFull && entityFull.datasetDefaultOverrides && entityFull.datasetDefaultOverrides.style) {
                    newLocation.marker = entityFull.datasetDefaultOverrides.style.___marker_style___
                } else {
                    newLocation.marker = entity.___marker_style___;
                }

            } else if (locationType === "path") {

                if (coordinates.length < 2) {
                    newLocation.error = "At least two points are needed for paths";
                    return newLocation;
                }

                newLocation.locationPath = "[";

                for (let j = 0; j < coordinates.length; j++) {
                    newLocation.locationPath += "(" + coordinates[j].lat + ',' + coordinates[j].lng + "), ";
                }

                newLocation.locationPath = newLocation.locationPath.slice(0, -2);

                newLocation.locationPath += "]";

                // Overrdingin dataset defaults
                if (dataset && entityFull && entityFull.datasetDefaultOverrides && entityFull.datasetDefaultOverrides.style) {
                    newLocation.path = entityFull.datasetDefaultOverrides.style.___path_style___
                } else {
                    newLocation.path = entity.___path_style___;
                }

            } else if (locationType === "polygon") {

                if (coordinates.length < 3) {
                    newLocation.error = "At least three points are needed for polygons";
                    return newLocation;
                }

                newLocation.locationPolygon = "(";

                for (let j = 0; j < coordinates.length; j++) {
                    newLocation.locationPolygon += "(" + coordinates[j].lat + ',' + coordinates[j].lng + "), ";
                }

                newLocation.locationPolygon = newLocation.locationPolygon.slice(0, -2);

                newLocation.locationPolygon += ")";

                if (dataset && entityFull && entityFull.datasetDefaultOverrides && entityFull.datasetDefaultOverrides.style) {
                    newLocation.polygon = entityFull.datasetDefaultOverrides.style.___polygon_style___
                } else {
                    newLocation.polygon = entity.___polygon_style___;
                }

            } else {
                newLocation.error = locationType + " is not a valid location type";
                return newLocation
            }

            let cityPossibilities = await City.findExact(address.city.toLowerCase());
            let countryPossibilities = await Country.findExact(address.country.toLowerCase());

            if (!countryPossibilities[0]) {
                newLocation.error = "Country " + address.country + " is not found";
                return newLocation
            }

            if (!cityPossibilities[0]) {
                // console.log("================== CITY NOT FOUND CREATE NEW ===================", newLocation.formattedLocation);
                let newCity = new City({
                    countryId: countryPossibilities[0].id,
                    name: address.city,
                })
                let cityId = await newCity.create().catch(function(e) { console.error("Failed to create city", e) });
                cityPossibilities.push({
                    id: cityId,
                    cityName: address.city,
                    countryName: countryPossibilities[0].name
                })
            }

            let cityPossibilitiesIndex = null;

            for (let i = 0; i < cityPossibilities.length; i++) {
                if (countryPossibilities[0].name === cityPossibilities[i].countryName) {
                    cityPossibilitiesIndex = i;
                    break;
                }
            }

            if (cityPossibilitiesIndex === null) {
                newLocation.error = "Couldn't match city to country.";
                return newLocation
            }

            if (dataset) {
                newLocation.formattedLocation = this.generateFormattedLocationObject(entity, fieldMappings, dataset.fields);
            }

            newLocation.streetHouse = address.streetHouse;
            newLocation.cityName = cityPossibilities[cityPossibilitiesIndex].cityName;
            newLocation.cityId = cityPossibilities[cityPossibilitiesIndex].id;
            newLocation.countryName = countryPossibilities[0].name;
            newLocation.countryId = countryPossibilities[0].id;
            newLocation.postcode = address.postcode;

        } else {

            if (["kml", "kmz", "shp", "geojson"].indexOf(dataset.format) > -1) {

                if (entity.geometry.type === "GeometryCollection") {

                    // console.log("@@ GeometryCollection")

                    entity.geometry.coordinates = [];
                    for (let i = 0; i < entity.geometry.geometries.length; i++) {
                        entity.geometry.coordinates = entity.geometry.coordinates.concat(entity.geometry.geometries[i].coordinates)
                    }
                    entity.geometry.type = entity.geometry.geometries[0].type;

                    // console.log(entity.geometry.type, entity.geometry.coordinates, "=====ENDE======NDEND=====");
                    // entity.geometry.coordinates = entity.geometry.geometries;
                }

                if (entity.geometry.type === "Point") {

                    // console.log("@@ Point")

                    longitude = entity.geometry.coordinates[0];
                    latitude = entity.geometry.coordinates[1];
                    newLocation.locationPoint = "(" + latitude + ',' + longitude + ")";

                    locationToGeocode = {
                        lat: latitude,
                        lng: longitude,
                    }

                } else if (entity.geometry.type === "LineString") {

                    // console.log("@@ LineString")

                    // console.log("LineString", entity.geometry.coordinates);

                    newLocation.locationPath = "[";

                    locationToGeocode = {
                        lat: entity.geometry.coordinates[0][1],
                        lng: entity.geometry.coordinates[0][0],
                    }

                    for (let j = 0; j < entity.geometry.coordinates.length; j++) {
                        newLocation.locationPath += "(" + entity.geometry.coordinates[j][1] + ',' + entity.geometry.coordinates[j][0] + "), ";
                    }

                    newLocation.locationPath = newLocation.locationPath.slice(0, -2);

                    newLocation.locationPath += "]";

                } else if (entity.geometry.type === "Polygon") {

                    // console.log("@@ Polygon")

                    newLocation.locationPolygon = "(";

                    // console.log("==================================", entity.geometry, "==================================")

                    locationToGeocode = {
                        lat: entity.geometry.coordinates[0][0][1],
                        lng: entity.geometry.coordinates[0][0][0],
                    }

                    for (let j = 0; j < entity.geometry.coordinates.length; j++) {
                        let coordinateBunch = entity.geometry.coordinates[j];
                        for (let k = 0; k < coordinateBunch.length; k++) {
                            newLocation.locationPolygon += "(" + entity.geometry.coordinates[j][k][1] + ',' + entity.geometry.coordinates[j][k][0] + "), ";
                        }
                    }

                    newLocation.locationPolygon = newLocation.locationPolygon.slice(0, -2);

                    newLocation.locationPolygon += ")";
                    // console.log(newLocation.locationPolygon)
//
                } else {
                    // console.log("INVALID TYPE", entity.geometry.coordinates);
                    newLocation.error = "Unsupported geometry type " + entity.geometry.type;
                }

                // TODO maybe implement MultiPoint, MultiLineString, and MultiPolygon

            } else {

                if (latitudeField === longitudeField) {

                    // Check one field containing lat long
                    let latLong = FileParser.resolveNestedObjectField(entity, latitudeField);

                    if (latLong) {

                        let match = latLong.match(/[+-]?([0-9]*[.])?[0-9]+[,][+-]?([0-9]*[.])?[0-9]+/g);
                        let separator = ","

                        if (!match) {
                            match = latLong.match(/[+-]?([0-9]*[.])?[0-9]+[ ][+-]?([0-9]*[.])?[0-9]+/g);
                            separator = " "
                        }

                        if (!match) {
                            match = latLong.match(/[+-]?([0-9]*[.])?[0-9][;][+-]?([0-9]*[.])?[0-9]+/g);
                            separator = ";"
                        }

                        if (match) {

                            latLong = match[0];
                            latLong = latLong.split(separator);
                            if ( (latLong.length === 2) && Utilities.isLatitude(latLong[0]) && Utilities.isLongitude(latLong[1]) ) {
                                latitude = latLong[0];
                                longitude = latLong[1];
                            } else {
                                newLocation.error = "Couldn't parse Latitude-Longitude pair"
                            }
                        }

                    }

                } else {

                    if ( Utilities.isLatitude(FileParser.resolveNestedObjectField(entity, latitudeField)) && Utilities.isLongitude(FileParser.resolveNestedObjectField(entity, longitudeField)) ) {
                        latitude = FileParser.resolveNestedObjectField(entity, latitudeField);
                        longitude = FileParser.resolveNestedObjectField(entity, longitudeField);
                    } else {
                        newLocation.error = "Couldn't parse Latitude-Longitude pair"
                    }

                }

                /// console.log(FileParser.resolveNestedObjectField(entity, latitudeField), FileParser.resolveNestedObjectField(entity, longitudeField))

                if (longitude && latitude) {
                    newLocation.locationPoint = "(" + latitude + ',' + longitude + ")";
                    locationToGeocode = {
                        lat: latitude,
                        lng: longitude,
                    }
                }

            }

            // Formatted Location obj
            newLocation.formattedLocation = this.generateFormattedLocationObject(entity, fieldMappings, dataset.fields);

            newLocation.streetHouse = newLocation.formattedLocation.streetHouse;
            newLocation.cityName = newLocation.formattedLocation.cityName;
            newLocation.cityId = newLocation.formattedLocation.cityId;
            newLocation.countryName = newLocation.formattedLocation.countryName;
            newLocation.countryId = newLocation.formattedLocation.countryId;
            newLocation.postcode = newLocation.formattedLocation.postcode;

            // console.log("\n==============================================================================================")
            // console.log(
            //     "StreetHouse: " + newLocation.streetHouse,
            //     "Postcode: " + newLocation.postcode,
            //     "City Id: " + newLocation.cityId,
            //     "City Name: " + newLocation.cityName,
            //     "Country Id: " + newLocation.countryId,
            //     "Country Name: " + newLocation.countryName,
            // )

            // newLocation.error  = "OK"
            // return newLocation;

            if (dataset) {

                let shouldGeocode = !dataset.noGeocode;
                let shouldReverseGeocode = !dataset.noReverseGeocode;
                let hasEnoughDeails = false;

                if (!locationToGeocode) {
                    shouldGeocode = true;
                }

                if (shouldGeocode) {

                    console.log("@@ We should geocode")

                    let res = await Geocoder.geocode({
                        name: newLocation.name,
                        streetHouse: newLocation.streetHouse,
                        postcode: newLocation.postcode,
                        city: newLocation.cityName,
                        country: newLocation.countryName,
                    }, locationToGeocode ? locationToGeocode.lat : null, locationToGeocode ? locationToGeocode.lng : null);

                    if (res.success) {

                        console.log("YUP")

                        if (res.data.streetHouse) newLocation.streetHouse = res.data.streetHouse
                        if (res.data.postcode) newLocation.postcode = res.data.postcode
                        if (res.data.city) newLocation.cityName = res.data.city
                        if (res.data.country) newLocation.countryName = res.data.country
                        if (res.data.lat && res.data.lng) {
                            newLocation.locationPoint = "(" + res.data.lat + ',' + res.data.lng + ")";
                        }

                        let cityPossibilities = await City.findExact(newLocation.cityName.toLowerCase());
                        let countryPossibilities = await Country.findExact(newLocation.countryName.toLowerCase());

                        let countryId, countryName, cityId, cityName;

                        if (countryPossibilities[0]) {
                            countryId = countryPossibilities[0].id
                            countryName = countryPossibilities[0].name;
                        }

                        for (let i = 0; i < cityPossibilities.length; i++) {
                            if (cityPossibilities[i].countryName === countryName) {
                                cityId = cityPossibilities[i].id;
                                cityName = cityPossibilities[i].cityName;
                                break;
                            }
                        }

                        if ( (!cityId) && (countryId) ) {
                            let newCity = new City({ countryId: countryId, name: newLocation.cityName })
                            cityId = await newCity.create().catch(function(e) { console.error("Failed to create city", e) });
                            cityName = newLocation.cityName
                        }

                        if (cityId && countryId) {
                            newLocation.cityName = cityName;
                            newLocation.cityId = cityId;
                            newLocation.countryName = countryName;
                            newLocation.countryId = countryId;
                            shouldReverseGeocode = false;
                            hasEnoughDeails = true;
                            console.log("@@ Full success");
                            // console.log(
                            //     "StreetHouse: " + newLocation.streetHouse,
                            //     "Postcode: " + newLocation.postcode,
                            //     "City Id: " + newLocation.cityId,
                            //     "City Name: " + newLocation.cityName,
                            //     "Country Id: " + newLocation.countryId,
                            //     "Country Name: " + newLocation.countryName,
                            // )
                        } else {
                            newLocation.error = "The geocoded country is not in our database"
                            return newLocation;
                        }

                    }

                }

                if (!locationToGeocode) {
                    console.log("NO LOCATION TO GEOCODE", locationToGeocode);
                }

                if (shouldReverseGeocode && locationToGeocode && (!hasEnoughDeails)) {

                    console.log("@@ We should reverse geocode");

                    if ( (locationToGeocode) && Utilities.isLatitude(locationToGeocode.lat) && Utilities.isLongitude(locationToGeocode.lng) ) {

                        let res = await Geocoder.reverseGeocode(locationToGeocode.lat, locationToGeocode.lng);

                        if (res.success) {

                            console.log("YUP")

                            if (res.data.streetHouse) newLocation.streetHouse = res.data.streetHouse
                            if (res.data.postcode) newLocation.postcode = res.data.postcode
                            if (res.data.city) newLocation.cityName = res.data.city
                            if (res.data.country) newLocation.countryName = res.data.country
                            if (res.data.lat && res.data.lng && (!newLocation.locationPath) && (!newLocation.locationPolygon) ) {
                                newLocation.locationPoint = "(" + res.data.lat + ',' + res.data.lng + ")";
                            }

                            if (newLocation.cityName && newLocation.countryName) {

                                let cityPossibilities = await City.findExact(newLocation.cityName.toLowerCase());
                                let countryPossibilities = await Country.findExact(newLocation.countryName.toLowerCase());

                                let countryId, countryName, cityId, cityName;

                                if (countryPossibilities[0]) {
                                    countryId = countryPossibilities[0].id
                                    countryName = countryPossibilities[0].name;
                                }

                                for (let i = 0; i < cityPossibilities.length; i++) {
                                    if (cityPossibilities[i].countryName === countryName) {
                                        cityId = cityPossibilities[i].id;
                                        cityName = cityPossibilities[i].cityName;
                                        break;
                                    }
                                }

                                if ( (!cityId) && (countryId) ) {
                                    let newCity = new City({ countryId: countryId, name: newLocation.cityName })
                                    cityId = await newCity.create().catch(function(e) { console.error("Failed to create city", e) });
                                    cityName = newLocation.cityName
                                }

                                if (cityId && countryId) {
                                    newLocation.cityName = cityName;
                                    newLocation.cityId = cityId;
                                    newLocation.countryName = countryName;
                                    newLocation.countryId = countryId;
                                    hasEnoughDeails = true;
                                    console.log("@@ Full success");
                                    // console.log(
                                    //     "StreetHouse: " + newLocation.streetHouse,
                                    //     "Postcode: " + newLocation.postcode,
                                    //     "City Id: " + newLocation.cityId,
                                    //     "City Name: " + newLocation.cityName,
                                    //     "Country Id: " + newLocation.countryId,
                                    //     "Country Name: " + newLocation.countryName,
                                    // )
                                } else {
                                    console.log("NOPE")
                                    newLocation.error = "The geocoded country is not in our database"
                                    return newLocation;
                                }

                            }

                        } else {
                            // console.log("NOPE")
                            // newLocation.error = "Failed to geocode, invalid or missing latitude, longitude pair"
                            // return newLocation;
                        }

                    } else {
                        // console.log("NOPE")
                        // newLocation.error = "Failed to geocode, invalid or missing latitude, longitude pair"
                        // return newLocation;
                    }

                }

                if (!hasEnoughDeails) {

                    console.log("@@ Both geocode failed")

                    if (newLocation.locationPoint || newLocation.locationPath || newLocation.locationPolygon) { } else {
                        newLocation.error = "No coordinates detected";
                        return newLocation;
                    }

                    if (newLocation.formattedLocation.countryId && (!newLocation.formattedLocation.cityId) && newLocation.formattedLocation.city ) {

                        let cityPossibilities = await City.findExact(newLocation.formattedLocation.city.toLowerCase());

                        let cityId, cityName;

                        for (let i = 0; i < cityPossibilities.length; i++) {
                            if (cityPossibilities[i].countryName === newLocation.formattedLocation.countryName) {
                                cityId = cityPossibilities[i].id;
                                cityName = cityPossibilities[i].cityName;
                            }
                        }

                        if (!cityId) {
                            let newCity = new City({
                                countryId: newLocation.formattedLocation.countryId,
                                name: newLocation.formattedLocation.city,
                            })
                            cityId = await newCity.create().catch(function(e) { console.error("Failed to create city", e) });
                            cityName = newLocation.formattedLocation.city
                        }

                        newLocation.cityId = cityId;
                        newLocation.cityName = cityName;

                        // console.log("@@ Fallbacks");
                        // console.log(
                        //     "StreetHouse: " + newLocation.streetHouse,
                        //     "Postcode: " + newLocation.postcode,
                        //     "City Id: " + newLocation.cityId,
                        //     "City Name: " + newLocation.cityName,
                        //     "Country Id: " + newLocation.countryId,
                        //     "Country Name: " + newLocation.countryName,
                        // )

                    } else if (newLocation.formattedLocation.countryId && dataset.acceptNoAddress) {
                        console.log("++ Accepting no address ++");
                    } else {
                        newLocation.error = "No city detected";
                        return newLocation;
                    }

                }

            } else {

                // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!JUST LOCATION!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

            }

        }

        // Features obj
        if (entityFull && entityFull.datasetDefaultOverrides && entityFull.datasetDefaultOverrides.features) {
            newLocation.features = {};
            if (entityFull.datasetDefaultOverrides.features) {
                entityFull.datasetDefaultOverrides.features.map(item => {
                    newLocation.features[item.text] = { "type": "boolean" }
                    return item;
                })
            }
        } else if (!dataset) {
            newLocation.features = {};
            if (entity.features) {
                entity.features.map(item => {
                    newLocation.features[item.text] = { "type": "boolean" }
                    return item;
                })
            }
        } else {
            newLocation.features = this.generateFeatureFilters(entity, dataset.features);
        }

        if (entityFull && entityFull.datasetDefaultOverrides && entityFull.datasetDefaultOverrides.categories) {
            // Overriding categories
            newLocation.categories = entityFull.datasetDefaultOverrides.categories ? entityFull.datasetDefaultOverrides.categories.map(item => item.text) : [];
            // console.log("========= OVERRIDING CATS", newLocation.categories)
        } else if (!dataset) {
            // No dataset, getting entered categories
            newLocation.categories = entity.categories ? entity.categories.map(item => item.text) : [];
        } else {
            // Compiling from dataset rules
            newLocation.categories = this.generateCategories(entity, dataset.categories);
        }

        if (!newLocation.categories || newLocation.categories.length === 0) {
            newLocation.error = "No categories defined";
        }

        // Generating Visible fields
        if (!dataset) {
            newLocation.fields = {};
            for (let key in entityFull.originalFields) {
                if (!key.startsWith("___") && !key.endsWith("___") && key !== "streetHouse" && key !== "postcode" && key !== "city" && key !== "country") {
                    let value = entityFull.originalFields[key];
                    if (typeof value === "object") {
                        newLocation.fields[key] = JSON.stringify(value);
                    } else {
                        newLocation.fields[key] = value;
                    }
                }
            }
        } else {
            newLocation.fields = this.generateVisibleFields(entity, dataset.fields, fieldMappings);
        }

        if (newLocation.locationPoint) {

            // No markers defined yet - means it is not overriden in dataset
            if (!newLocation.marker) {
                // console.log("Default Compiling marker");
                newLocation.marker = this.generateMarkerField(entity, dataset.markers, fieldMappings);
            }

        } else if (newLocation.locationPath) {

            if (!newLocation.path) {
                // console.log("Default Compiling path styles");
                newLocation.path = this.generatePathPolygonField(entity, dataset.paths, fieldMappings);
            }

        } else if (newLocation.locationPolygon) {

            if (!newLocation.polygon) {
                // console.log("Default Compiling polygon styles");
                newLocation.polygon = this.generatePathPolygonField(entity, dataset.polygons, fieldMappings);
            }

        }

        // throw Error("OK")

        // Generating Quick search

        // if (dataset) {
        //     newLocation.quickSearchStr = this.generateQuickSearchField(individualEdit ? entity.originalFields : entity, dataset.fields, fieldMappings, newLocation.features, newLocation.categories);
        // } else {
        //     newLocation.quickSearchStr = ""
        //     // delete newLocation.fields.features;
        //     // delete newLocation.fields.tags;
        //     // delete newLocation.fields.categories;
        //     // for (let key in newLocation.fields) {
        //     //     newLocation.quickSearchStr += newLocation.fields[key] + ", ";
        //     // }
        //     // newLocation.quickSearchStr = newLocation.quickSearchStr.trim();
        //     // TODO
        // }

        // QUick search field
        newLocation.quickSearchStr = newLocation.name + " _ ";
        if (newLocation.streetHouse) newLocation.quickSearchStr += newLocation.streetHouse + " _ ";
        if (newLocation.cityName) newLocation.quickSearchStr += newLocation.cityName + " _ ";
        if (newLocation.countryName) newLocation.quickSearchStr += newLocation.countryName + " _ ";
        if (newLocation.postcode) newLocation.quickSearchStr += newLocation.postcode + " _ ";

        let quickSearchFieldsObj = entityFull ? entityFull.originalFields : (entity.originalFields ? entity.originalFields : entity);

        // console.log("@@@@@@@@ HERE", dataset ? dataset.fields: "NO fields", entity, "====================")

        for (let key in quickSearchFieldsObj) {

            if ( !key.startsWith("___") && !key.endsWith("___") ) {

                if (dataset && dataset.fields[key] && !dataset.fields[key].searchableByUser) {
                    continue
                }

                let value = FileParser.resolveNestedObjectField(quickSearchFieldsObj, key)

                if (typeof value === "string") {
                    newLocation.quickSearchStr += value + " _ "
                } else { }

            }
        }

        //Categories
        for (let i = 0; i < newLocation.categories.length; i++) {
            if (newLocation.categories[i].text) {
                newLocation.quickSearchStr += newLocation.categories[i].text + " _ ";
            } else {
                newLocation.quickSearchStr += newLocation.categories[i] + " _ ";
            }
        }

        //Features
        for (let key in newLocation.features) {
            newLocation.quickSearchStr += key + " _ ";
        }

        console.log("================", newLocation.categories, newLocation.features, newLocation.quickSearchStr, "=============END===========")

        newLocation.quickSearchStr = newLocation.quickSearchStr.trim().toLowerCase();
        // console.log(newLocation.quickSearchStr, "==============");

        if (dataset && dataset.type === "external") {

            newLocation.uniqueId = this.generateUniqueId(entity, fieldMappings.uniqueId);
            console.log("@@@@ Unique id" + newLocation.uniqueId + ";", fieldMappings.uniqueId)

            if (!newLocation.uniqueId) {
                newLocation.error = "Empty Unique Id field"
            }

            if (uniqueIds && uniqueIds.indexOf(newLocation.uniqueId) > -1) {
                console.log("DUPE!!!!!!!!!!!!!!!!!!!!!")
                newLocation.error = "Duplicate Unique Id Value";
            }

        }

        if (isApproved) {
            newLocation.isApproved = true
        }

        if (!newLocation.error) {
            newLocation.error = null;
        }

        if (newLocation.error) {
            console.log("ERROR WHILE PARSING LOCATION " + newLocation.error)
            if (queueI) {
                newLocation.errorRowI = queueI;
            }
        }

        return newLocation;

    }

    // Resolves the unique id of an entity
    static generateUniqueId(entity, uniqueIdFields) {

        let id = "";

        for (let j = 0; j < uniqueIdFields.length; j++) {
            let fieldValue = FileParser.resolveNestedObjectField(entity, uniqueIdFields[j])
            id += fieldValue + " ";
        }

        id = id.trim();

        return id;

    }

    // Generates a quick search string that contains all searchable fields
    static generateQuickSearchField(entity, fields, mappedFields, features, categories) {

        console.log("FIELDS: ", entity);

        let quickSearchStr = "";

        for (let key in entity) {
            if (entity[key])
                quickSearchStr += entity[key] + " ";
        }

        quickSearchStr = quickSearchStr.trim();

        return quickSearchStr;



        // return;

        // console.log(mappedFields)

        let searchableFields = "";

        // Name
        if ( (mappedFields.name) && (mappedFields.name.length !== 0) ) {

            for (let i = 0; i < mappedFields.name.length; i++) {
                let fieldName = mappedFields.name[i];
                if (FileParser.resolveNestedObjectField(entity, fieldName))
                    searchableFields += entity[fieldName] + " ";
            }

        }

        // Description
        if ( (mappedFields.description) && (mappedFields.description.length !== 0) ) {

            for (let i = 0; i < mappedFields.description.length; i++) {
                let fieldName = mappedFields.description[i];
                if (FileParser.resolveNestedObjectField(entity, fieldName))
                    searchableFields += entity[fieldName] + " ";
            }

        }

        // Visible fields
        for (let key in fields) {

            let field = fields[key];

            if (field.searchableByUser) {
                searchableFields += FileParser.resolveNestedObjectField(entity, key) + " "
            }

        }

        //Categories
        for (let i = 0; i < categories.length; i++) {
            searchableFields += categories[i] + " ";
        }

        //Features
        for (let key in features) {
            searchableFields += key + " ";
        }

        searchableFields = searchableFields.trim()

        return searchableFields.toLowerCase();

    }

    // Generates a path or polygon field
    static generatePathPolygonField(entity, markers, mappedFields) {

        let marker = markers.default;

        for (let key in markers) {

            if (key !== "default") {
                if (QueryParser.compile(entity, markers[key].query)) {
                    marker = markers[key]
                    break;
                }
            }

        }

        return marker;

    }

    // Generates a marker field
    static generateMarkerField(entity, markers, mappedFields) {

        let marker = markers.default;

        for (let key in markers) {

            if (key !== "default") {
                if (QueryParser.compile(entity, markers[key].query)) {
                    marker = {
                        color: markers[key].color,
                        icon: markers[key].icon,
                        image: markers[key].image
                    };
                    break;
                }
            }

        }

        return marker;

    }

    // Returns the default visible fields of a location
    static generateVisibleFields(entity, fields, mappedFields) {

        let visibleFields = {};

        // Name
        if ( (mappedFields.name) && (mappedFields.name.length !== 0) ) {

            visibleFields.name = "";

            for (let i = 0; i < mappedFields.name.length; i++) {
                let fieldName = mappedFields.name[i];
                visibleFields.name += FileParser.resolveNestedObjectField(entity, fieldName) + " ";
            }

            if (visibleFields.name) {
                visibleFields.name = visibleFields.name.trim();
            } else {
                visibleFields.name = null;
            }

        }

        // Description
        if ( (mappedFields.description) && (mappedFields.description.length !== 0) ) {

            visibleFields.description = "";

            for (let i = 0; i < mappedFields.description.length; i++) {
                let fieldName = mappedFields.description[i];
                visibleFields.description += FileParser.resolveNestedObjectField(entity, fieldName) + " ";
            }

            if (visibleFields.description) {
                visibleFields.description = visibleFields.description.trim();
            } else {
                visibleFields.description = null;
            }

        }

        for (let key in fields) {

            let field = fields[key];

            if ( (field.visibleToUsers) && (["name", "description"].indexOf(key) === -1) ) {
                if (FileParser.resolveNestedObjectField(entity, key)) {
                    let visibleName = field.name;
                    visibleFields[visibleName] = FileParser.resolveNestedObjectField(entity, key)
                }
            }

        }

        return visibleFields;

    }

    // Generates the categories field
    static generateCategories(entity, definitions) {

        let matchedCategories = [];

        for (let key in definitions.filterRules) {

            let definition = definitions.filterRules[key];
            let name = definition.name;

            if (QueryParser.compile(entity, definition.query)) {
                matchedCategories.push(name);
            }

        }

        // Always include default categories or include if no matched Tag
        if ( (definitions.includeDefault === "all") || ( (definitions.includeDefault === "match") && (matchedCategories.length === 0) ) ) {
            if (definitions.default) {
                for (let i = 0; i < definitions.default.length; i++) {
                    matchedCategories.push(definitions.default[i])
                }
            }
        }

        return matchedCategories

    }

    // Generates the features field
    static generateFeatureFilters(entity, definitions) {

        let filters = {}

        for (let i = 0; i < definitions.default.length; i++) {
            let definition = definitions.default[i];
            filters[definition] = {
                type: "boolean"
            }
        }

        for (let key in definitions.filterRules) {

            let definition = definitions.filterRules[key];
            let name = definition.name;

            if (QueryParser.compile(entity, definition.query)) {
                // console.log("QUery matched");
                filters[name] = {
                    type: "boolean" // TODO update if more filter types, e.g. dates, numbers
                }
            }

        }

        return filters

    }

    // Generates the formatted location object
    static generateFormattedLocationObject(entity, mappedFields, fields) {

        let formattedLocatioObj = {
            // === user provided or parsed from dataset
            // streetHouse
            // postcode
            // cityId
            // cityName
            // countryId
            // countryName

            // === Defaults from Gooogle Maps
            // ___GEOCODED___premise
            // ___GEOCODED___postal_town
            // ___GEOCODED___country
            // ___GEOCODED___postal_code
            // ___GEOCODED___route
            // ___GEOCODED___formatted_address
        };

        let streetHouseFields = mappedFields["street"];
        let postCodeField =  mappedFields["postcode"] ? mappedFields["postcode"][0] : null;
        let cityField = mappedFields["city"] ? mappedFields["city"][0] : null;
        let defaultCity = fields["___DEFAULT_CITY___"]
        let countryField = mappedFields["country"] ? mappedFields["country"][0] : null;
        let defaultCountry = fields["___DEFAULT_COUNTRY___"];

        // console.log(streetHouseFields, cityField, defaultCity, countryField, defaultCountry);

        // Street address compilation
        if (streetHouseFields && streetHouseFields.length !== 0) {

            // console.log("==Parsing street name");

            let streetHouseName = "";

            // Adding all fields that were marked as house no or street
            for (let j = 0; j < streetHouseFields.length; j++) {
                let fieldName = streetHouseFields[j];
                streetHouseName += FileParser.resolveNestedObjectField(entity, fieldName) + " ";
            }

            streetHouseName = streetHouseName.trim();

            if (streetHouseName) {
                formattedLocatioObj.streetHouse = streetHouseName;
            }

            // TODO remove city, country, postcode if present

        }


        // Zip compilation
        if (postCodeField) {

            // console.log("==Parsing postcode");
            let postcode = FileParser.resolveNestedObjectField(entity, postCodeField);

            if (postcode) {
                postcode = postcode.trim();
            }

            if (postcode) {
                formattedLocatioObj.postcode = postcode;
            }

        }


        // City compilation
        if (cityField || defaultCity) {

            // console.log("==Parsing city");

            let city = FileParser.resolveNestedObjectField(entity, cityField);

            // Detected city in the specified dataset field of the entity
            if (city) {
                city = city.trim();
                formattedLocatioObj.city = city;
                // TODO createTempStore of city ids from db
                // Compile into formattedLocatioObj
            } else {
                // Trying to use default city given

                if (defaultCity && defaultCity.id && defaultCity.name) {
                    formattedLocatioObj.cityId = defaultCity.id;
                    formattedLocatioObj.cityName = defaultCity.name;
                } else {
                    // City could not have been determinded, must be geocoding
                }

            }

        }


        // Country compilation
        if (countryField || defaultCountry) {

            // console.log("==Parsing country");

            let country = FileParser.resolveNestedObjectField(entity, countryField);

            // Detected country in the specified dataset field of the entity
            if (country) {
                country = country.trim();
                // TODO createTempStore of country ids from db
                // Compile into formattedLocatioObj
            } else {
                // Trying to use default country given

                if (defaultCountry && defaultCountry.id && defaultCountry.name) {
                    formattedLocatioObj.countryId = defaultCountry.id;
                    formattedLocatioObj.countryName = defaultCountry.name;
                } else {
                    // Country could not have been determinded, must be geocoding
                }

            }

        }

        return formattedLocatioObj;

    }

    // Converts a public api query into a psotgresql query
    static publicAPIQueryToDatabaseQuery(query) {

        const PROHIBITED_FIELDS = [
            "dataset",
            "author",
            "coordinates",
        ]

        const ALLOWED_OPERATORS = {
            "!=" : ["deleted", "name", "streetHouse", "id", "email", "tel", "website", "city", "country", "postcode", "datasetId", "authorId"],
            "=": ["deleted", "name", "streetHouse", "location", "id", "email", "tel", "website", "city", "country", "postcode", "datasetId", "authorId"],
            "contains": ["name", "streetHouse", "id", "email", "tel", "website", "city", "country", "postcode", "categories", "features"  , "any"],
            "!contains": ["name", "streetHouse", "id", "email", "tel", "website", "city", "country", "postcode", "categories", "features"  , "any"],
            // "!null" : [],
            // "null"
        }

        const OPERATORS_WITH_VALUE = [
            "!=",
            "=",
            "contains",
            "!contains",
        ]

        const ARRAY_FIELDS = [
            "categories",
            "features"
        ]

        return QueryParser.publicAPIQueryToDatabaseQuery(query, true, PROHIBITED_FIELDS, ALLOWED_OPERATORS, OPERATORS_WITH_VALUE, ARRAY_FIELDS, API_DATABASE_MAPPING_QUERY)

    }

    static spliceSplit(str, index, count, add) {
        var ar = str.split('');
        ar.splice(index, count, add);
        return ar.join('');
    }

    // Converts public api fields into database fields
    static publicAPIFieldsToDatabaseFields(fields) {

        fields = fields.replace(/\s+/, "")
        let fieldsArr = fields.split(",")

        for (let i = 0; i < fieldsArr.length; i++) {
            let originalFieldName = fieldsArr[i];
            let newFieldName = API_DATABASE_MAPPING_FIELDS[originalFieldName];
            if (!newFieldName) {
                return {
                    success: false,
                    data: "Unknown field " + originalFieldName
                }
            }
            fieldsArr[i] = '"' + newFieldName + '"'
        }

        return {
            success: true,
            data: fieldsArr.join(",")
        }

    }

    // Returns locations by a user id
    static async getByUserId(userId, page, keywords, isCurrentUser) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT locations.*, users.username AS username, users.picture as "userPhoto"
                FROM locations
                LEFT JOIN users
                    ON users.id = locations."userId"
                WHERE
                    (locations."userId" = $2)
                    AND ( (locations."isDeleted" <> true) OR (locations."isDeleted" IS NULL) )
                    ${ (!isCurrentUser) ? 'AND (locations."isApproved" = true AND locations."isApproved" IS NOT NULL)' : '' }
                    ${ (keywords) ? "AND ( (LOWER(locations.\"quickSearchStr\") LIKE '%' || $3 || '%'  )" : '' }
                GROUP BY 1, users.username, users.picture
                ORDER BY locations.id DESC
                LIMIT 12 OFFSET $1
            `

            let params = [(page*12), userId];

            if (keywords) {
                params.push(keywords.toLowerCase());
            }

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a list of locations by their ids
    static async getByIds(ids, start, limit) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT locations.*, users.username AS username, users.picture as "userPhoto"
                FROM locations
                LEFT JOIN users
                    ON users.id = locations."userId"
                WHERE
                    (locations.id IN (${ids.join(",")}))
                GROUP BY 1, users.username, users.picture
                LIMIT $2 OFFSET $1
            `

            let params = [start, limit];

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Foramts database results into api results
    static async formatDatabaseToPublicAPI(rows, preserveFields) {

        return new Promise(async function(resolve, reject) {

            if (preserveFields) {
                return resolve(rows);
            }

            let userResults = {};
            let licenceResults = {};
            let datasetResults = {};
            let userIds = [];
            let datasetIds = [];
            let licenceIds = [];

            // Need additional db queries
            if (rows[0].userId || rows[0].datasetId || rows[0].licenceId) {

                for (let i = 0; i < rows.length; i++) {

                    let datasetId = rows[i].datasetId;
                    let userId = rows[i].userId;
                    let licenceId = rows[i].licenceId;

                    if ( (datasetId) && (datasetIds.indexOf(datasetId) === -1) ) {
                        datasetIds.push(datasetId)
                    }

                    if ( (userId) && (userIds.indexOf(userId) === -1) ) {
                        userIds.push(userId)
                    }

                    if ( (licenceId) && (licenceIds.indexOf(userId) === -1) ) {
                        licenceIds.push(licenceId)
                    }

                }

            }

            if (licenceIds.length !== 0) {

                let licences = await Licence.get().catch(function(e) { console.error("Failed to get licences", e); });

                if (!licences) {
                    return reject("Fauled to get licences");
                }

                for (let i = 0; i < licences.length; i++) {
                    let licence = licences[i];
                    licenceResults[licence.id] = licence;
                }

            }

            if (userIds.length !== 0) {

                let users = await User.getByIds(userIds, "id,email,username,type").catch(function(e) { console.error("Failed to get users", e); });

                if (!users) {
                    return reject("Fauled to get users");
                }

                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                    userResults[user.id] = user;
                }

            }

            if (datasetIds.length !== 0) {

                console.log("====================userId", datasetIds)

                let datasets = await Dataset.getAllByIds(datasetIds, `id,"userId",name,description,"maintainerName","maintainerEmail",format,sources`).catch(function(e) { console.error("Failed to get users", e); });

                if (!datasets) {
                    return reject("Failed to get datasets");
                }

                for (let i = 0; i < datasets.length; i++) {
                    let dataset = datasets[i];
                    datasetResults[dataset.id] = dataset;
                }

            }

            for (let i = 0; i < rows.length; i++) {

                let row = rows[i];

                delete row.total;

                if (row.isDeleted !== undefined) {
                    row.deleted = row.isDeleted;
                    delete row.isDeleted;
                }

                // if (row.fields) {
                //     row.name = row.fields.name;
                //     // TODO what if all?
                //     delete row.fields;
                // }

                if (row.locationPoint) {
                    row.coordinates = {
                        type: "point",
                        coordinates: { lat: row.locationPoint.x, lng: row.locationPoint.y }
                    }
                }

                if (row.locationPath) {
                    row.coordinates = {
                        type: "path",
                        coordinates: row.locationPath
                    }
                }

                if (row.locationPolygon) {
                    row.coordinates = {
                        type: "polygon",
                        coordinates: row.locationPolygon
                    }
                }

                if (row.features) {
                    let featuresArr = Object.keys(row.features);
                    if (featuresArr && featuresArr.length !== 0) {
                        row.features = featuresArr
                    } else {
                        row.features = []
                    }
                } else {
                    delete row.features;
                }

                if (row.userId) {
                    let user = JSON.parse(JSON.stringify(userResults[row.userId]));
                    if (user) {
                        row.author = user;
                        // remove email if not org
                        if (user.type !== "org") {
                            delete row.author.email
                        }
                        delete row.author.type
                    }
                    delete row.userId;
                }

                if (row.licenceId) {
                    let licence = JSON.parse(JSON.stringify(licenceResults[row.licenceId]));
                    if (licence) {
                        row.licence = licence;
                        delete row.licence.id
                    }
                    delete row.licenceId;
                }

                if (row.datasetId) {
                    let dataset = datasetResults[row.datasetId];
                    if (dataset) {
                        row.dataset = dataset;
                    }
                }

                delete row.datasetId;

                if (row.originalFields) {
                    row.fields = row.originalFields;
                    delete row.originalFields;
                }

                if (row.cityName) {
                    row.city = row.cityName;
                    delete row.cityName;
                }

                if (row.countryName) {
                    row.country = row.countryName;
                    delete row.countryName;
                }

                // delete row.fields
                delete row.quickSearchStr;
                delete row.isApproved;
                delete row.idInDataset;
                delete row.marker;
                delete row.uniqueId;
                delete row.error;
                delete row.datasetDefaultOverrides
                delete row.locationCount
                delete row.formattedLocation
                delete row.cityId
                delete row.countryId
                delete row.locationPolygon
                delete row.locationPath
                delete row.locationPoint
                delete row.polygon
                delete row.path
                delete row.errorRowI
                delete row.deleted
                delete row.tags

                row.address = {}

                if (row.postcode) {
                    row.address.postcode = row.postcode
                    delete row.postcode
                }

                if (row.streetHouse) {
                    row.address.streetHouse = row.streetHouse
                    delete row.streetHouse
                }

                if (row.city) {
                    row.address.city = row.city
                    delete row.city
                }

                if (row.country) {
                    row.address.country = row.country
                    delete row.country
                }

                if (row.address && Object.keys(row.address).length === 0) {
                    delete row.address;
                }

                rows[i] = row;

            }


            return resolve(rows);

        })

    }

    // Perfoms an API search
    static apiSearch(fields, userQuery, start, limit, preserveFields) {

        return new Promise(function(resolve, reject) {

            console.log("ABOUT TO SEARCH", fields, userQuery, start, limit, preserveFields, "!!!!!!!!!!!!!!!!!!");

            const client = this.getClient();
            client.connect();

            let fieldsQuery = fields;
            if (fields.indexOf("all") > -1) {
                fieldsQuery = "*"
            } else {
                fieldsQuery = this.publicAPIFieldsToDatabaseFields(fields);
                if (!fieldsQuery.success) {
                    return reject(fieldsQuery.data)
                }
                fieldsQuery = fieldsQuery.data;
            }

            userQuery = this.publicAPIQueryToDatabaseQuery(userQuery);

            if (!userQuery.success) {
                return reject(userQuery.data);
            }

            userQuery = userQuery.data;

            let query = `
                SELECT ${fieldsQuery}, count(*) OVER() AS total
                FROM locations
                WHERE (${userQuery}) AND "isApproved" = true AND "isDeleted" <> true
                ORDER BY id DESC
                LIMIT ${limit} OFFSET ${start}
            `
            let params = [];

            console.log(query);

            client
                .query(query, params)
                .then(async res => {
                    client.end();
                    if (res.rows.length === 0) {
                        resolve({
                            data: [],
                            total: 0
                        })
                    } else {
                        let total = res.rows[0].total;
                        resolve({
                            data: await this.formatDatabaseToPublicAPI(res.rows, preserveFields),
                            total: total
                        });
                    }
                })
                .catch(e => { client.end(); console.error("Malformed query", e.stack); reject("Malformed query"); })

        }.bind(this))

    }

    // Performs a search
    static search(userQuery) {

        let selectFields = "*";
        let extraWHERE = "";

        if (userQuery.source === "mapview") {
            selectFields = `id, name, "locationPoint", "locationPath", "locationPolygon", marker, path, polygon, features, categories, website, email, tel, "cityId", "countryId", "cityName", "countryName", "streetHouse", "postcode"`
            extraWHERE = " AND (error IS NULL)"
        }

        let query = `
            SELECT ${selectFields}
            FROM locations
        `
        let queryWhere = '';
        let params = [];

        query += ` WHERE "isDeleted" <> true AND "isApproved" = true `
        queryWhere += " "

        if (userQuery.location) {

            if (queryWhere) {
                queryWhere += " AND "
            }

            if (userQuery.location.type === "city") {
                params.push(userQuery.location.cityId);
                queryWhere += `"cityId" = $${params.length}`
            } else {
                params.push(userQuery.location.countryId);
                queryWhere += `"countryId" = $${params.length}`
            }

        }

        if (userQuery.keywords && userQuery.keywords.length !== 0) {

            if (queryWhere) {
                queryWhere += " AND "
            }

            let queryKeywords = "( "

            for (let i = 0; i < userQuery.keywords.length; i++) {

                let keyword = userQuery.keywords[i].trim().toLowerCase();

                // `LOWER("${condition.field}"::text) ${sqlConditionOperator} '%${condition.value}%'`
                // userQuery.keywords

                if (keyword) {

                    if (i !== 0) {
                        queryKeywords += " AND "
                    }

                    if (keyword.startsWith("category:")) {
                        keyword = keyword.split(":")[1];
                        params.push(keyword);
                        queryKeywords += `LOWER("categories"::text) LIKE '%' || $${params.length} || '%'`
                    } else if (keyword.startsWith("feature:")) {
                        keyword = keyword.split(":")[1];
                        params.push(keyword);
                        queryKeywords += `LOWER("features"::text) LIKE '%' || $${params.length} || '%'`
                    } else {
                        params.push(keyword);
                        queryKeywords += `"quickSearchStr" LIKE '%' || $${params.length} || '%'`
                    }

                }

            }

            queryKeywords += " )"

            queryWhere += queryKeywords;

        }

        queryWhere += extraWHERE;

        if (userQuery.source === "mapview") {
            selectFields = `id, name, "locationPoint", "locationPath", "locationPolygon", marker, path, polygon, features, categories, website, email, tel, "cityId", "countryId", "cityName", "countryName", "streetHouse", "postcode"`
            extraWHERE = " AND (error IS NULL)"
        }

        query += queryWhere

        if (userQuery.source === "mapview") {
            query += " LIMIT 10000";
        }

        console.log("LOcation search " + query + queryWhere, params);

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all locations
    static getAll() {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(
                    `
                        SELECT *
                        FROM locations
                    `,
                    []
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a location by its id
    static getById(id) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(
                    `
                        SELECT locations.*, licences.name as "licenceType", licences.description as "licenceDetails"
                        FROM locations
                        INNER JOIN licences
                            ON locations."licenceId" = licences.id
                        WHERE locations.id = $1
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(res.rows[0]); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all locations by its dataset id
    static getByDatasetId(datasetId, includeDeleted) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(
                    `
                        SELECT *
                        FROM locations
                        WHERE "datasetId" = $1
                        ${(includeDeleted) ? '' : ' AND "isDeleted" = false '}
                    `,
                    [datasetId]
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all locations in a dataset
    static getAllFromDataset(datasetId, fields) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            console.log("ONYL GETTING " + fields)

            client
                .query(
                    `
                        SELECT ${(fields ? fields : "*")}
                        FROM locations
                        WHERE "datasetId" = $1
                        ORDER by id ASC
                    `,
                    [datasetId]
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    //  Updates the location field of a location
    updateLocationFields() {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(
                    `
                        UPDATE
                            locations
                        SET
                            "formattedLocation" = $2,
                            "locationPoint" = $3,
                            "locationPath" = $4,
                            "locationPolygon" = $5
                        WHERE
                            id = $1
                    `,
                    [this.id, this.formattedLocation, this.locationPoint || null, this.locationPath || null, this.locationPolygon || null]
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Marks a location as deleted
    static markDeleted(id, userId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        UPDATE locations
                        SET "isDeleted" = true
                        where id = $1
                    `,
                    [id]
                )
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "LOCATION",
                        action: "DELETE",
                        entityId: id,
                        userId: userId,
                    })
                    resolve();
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Inserts a new location into the database
    create() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        INSERT INTO locations ("isDeleted", "isApproved", "userId", "datasetId", "locationPoint", "locationPath", "locationPolygon", "formattedLocation", "features", "categories", "fields", "quickSearchStr", "originalFields", "uniqueId", "marker", "path", "polygon", "website", "tel", "email", "name", "streetHouse", "cityName", "cityId", "countryName", "countryId", "postcode", "error", "datasetDefaultOverrides", "licenceId", "errorRowI")
                        VALUES (false, ${ (this.isApproved) ? true : false }, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
                        RETURNING id
                    `,
                    [this.userId, this.datasetId, this.locationPoint, this.locationPath, this.locationPolygon, this.formattedLocation, this.features, this.categories, this.fields, this.quickSearchStr, this.originalFields, this.uniqueId, this.marker, this.path, this.polygon, this.website, this.tel, this.email, this.name, this.streetHouse, this.cityName, this.cityId, this.countryName, this.countryId, this.postcode, this.error, this.datasetDefaultOverrides, this.licenceId, this.errorRowI]
                )
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "LOCATION",
                        action: "CREATE",
                        entityId: res.rows[0].id,
                        relatedEntityId: this.datasetId,
                        userId: this.userId,
                        entityUserId: this.userId,
                        entityCityId: this.cityId,
                        entityCountryId: this.countryId,
                    })
                    resolve(res.rows[0].id)
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates a location in the database
    update() {

        const client = this.getClient();
        client.connect();

        let query = `
            UPDATE
                locations
            SET
                "userId" = $3,
                "locationPoint" = $4,
                "locationPath" = $5,
                "locationPolygon" = $6,
                "formattedLocation" = $7,
                "features" = $8,
                "categories" = $9,
                "fields" = $10,
                "quickSearchStr" = $11,
                "originalFields" = $12,
                "uniqueId" = $13,
                "marker" = $14,
                "website" = $15,
                "tel" = $16,
                "email" = $17,
                "name" = $18,
                "streetHouse" = $19,
                "cityName" = $20,
                "cityId" = $21,
                "countryName" = $22,
                "countryId" = $23,
                "postcode" = $24,
                "error" = $25,
                "isApproved" = $26,
                "datasetDefaultOverrides" = $27,
                "path" = $28,
                "polygon" = $29,
                "licenceId" = $30,
                "errorRowI" = $31
            WHERE
                ${ (this.id) ? "id" : "\"uniqueId\"" } = $1 AND
                ("datasetId" = $2 ${!this.datasetId ? " OR 1=1" : ""})
            returning id
        `

        let params = [(this.id) ? this.id : this.uniqueId ,this.datasetId, this.userId, this.locationPoint, this.locationPath, this.locationPolygon, this.formattedLocation, this.features, this.categories, this.fields, this.quickSearchStr, this.originalFields, this.uniqueId, this.marker, this.website, this.tel, this.email, this.name, this.streetHouse, this.cityName, this.cityId, this.countryName, this.countryId, this.postcode, this.error, this.isApproved, this.datasetDefaultOverrides, this.path, this.polygon, this.licenceId, this.errorRowI];

        return new Promise(function(resolve, reject) {

            client
                .query(query, params)
                .then(async res => {
                    client.end()
                    await ActivityLog.log({
                        type: "LOCATION",
                        action: "UPDATE",
                        entityId: this.id,
                        userId: this.userId,
                        relatedEntityId: this.datasetId,
                        entityUserId: this.userId,
                        entityCityId: this.cityId,
                        entityCountryId: this.countryId,
                    })
                    resolve(res.rows[0])
                })
                .catch(e => {
                    client.end()
                    reject(e.stack)
                })

        }.bind(this))

    }

}

module.exports = LocationModel;
