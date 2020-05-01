const Keys = require('../config/Keys.js');
const axios = require('axios');
const { Client } = require('pg');

// setTimeout(async function() {
//
//     const Geocoder = require('./Geocoder.js');
//
//     let res = await Geocoder.geocode({
//         name: "ISTD2 Dance Studios",
//         streetHouse: "346 Old St",
//         postcode: "",
//         city: "London",
//         country: "United Kingdom",
//     }, "51.526","-0.08096771212121111").catch(e => { console.error(e) })
//
//     let res = await Geocoder.reverseGeocode("51.54213483", "-0.024976221").catch(e => { console.error(e) })
//
//     console.log('===============', res);
//
// }, 500);

class Geocoder {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    // Returns a previous geocoding results from the database
    static get(query, type) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`SELECT id, query, source, type, "formattedResult" FROM "geocodingResults" WHERE query = $1 AND type = $2 LIMIT 1`, [query, type])
                .then(res => { client.end(); resolve(res.rows ? res.rows[0] : null); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
    static getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
        var dLon = this.deg2rad(lon2-lon1);
        var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d;
    }

    // Returns rad from deg
    static deg2rad(deg) {
        return deg * (Math.PI/180)
    }

    // Caches a geocoding result
    static cache(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        INSERT INTO "geocodingResults" (query, type, source, "formattedResult", "rawResults", date)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `,
                    [args.query, args.type, args.source, args.formattedResult, args.rawResults, new Date()]
                )
                .then(res => {
                    client.end()
                    resolve()
                })
                .catch(e => {
                    client.end()
                    reject(e.stack)
                })

        }.bind(this))

    }

    // Reverse geocodes a latitude and longitude
    static async reverseGeocode(latitude, longitude) {

        return new Promise(async function(resolve, reject) {

            const GeocoderModel = require('./Geocoder.js');

            let googleQuery = "";
            let nominatimQuery = "";
            let appropriateResult = false;

            if (latitude && longitude) {

            } else {
                return resolve({
                    success: false,
                    error: "Not enough information to reverse geocode"
                })
            }

            // console.log("Query:  " + latitude + "," + longitude);

            let cache = await GeocoderModel.get(latitude + "," + longitude, "reverse-geocode").catch(e => { console.error("Failed to get from cache", e) });

            // Loading result from cache
            if (cache) {
                if (cache.formattedResult !== null) {
                    return resolve({
                        success: true,
                        data: cache.formattedResult,
                        source: cache.source
                    })
                } else {
                    return resolve({
                        success: false,
                        data: "No appropriate results found"
                    })
                }
            }

            // Trying with Noinatim first
            let nominatimResult = await axios.get('https://nominatim.openstreetmap.org/reverse?lat=' + latitude + '&lon=' + longitude + '&format=json&addressdetails=1&limit=50&email=' + Keys.adminEmail).catch(e => { console.error("Failed to get nominatim res", e) } );

            if (nominatimResult && nominatimResult.statusText === "OK" && nominatimResult.data) {

                let bestRes = nominatimResult.data;

                // Accepting Nominatim's result if all street number, street, city, postcode and country is defined.
                if (bestRes.address && bestRes.address.house_number && bestRes.address.road && bestRes.address.city && bestRes.address.country && bestRes.address.postcode) {
                    appropriateResult = GeocoderModel.formatNominatim(bestRes)
                } else {
                    // console.log("Not all components of the address are detected with nominatim")
                }

            }

            // Respecting nominatim's 1 request / sec policy
            await (new Promise((resolve) => { setTimeout(resolve, 1000); }))

            if (appropriateResult) {
                await GeocoderModel.cache({
                    query: latitude + "," + longitude,
                    type: "reverse-geocode",
                    source: "Nominatim",
                    formattedResult: appropriateResult,
                    rawResults: [nominatimResult.data],
                }).catch(e => { console.error("Failed to cache", e) })
                // Returning Nominatim's results
                return resolve({
                    success: true,
                    data: appropriateResult,
                    source: "Nominatim"
                })
            }

            let googleResult = await axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&sensor=true&key=' + Keys.googleMaps.apiKey + '&language=en&region=US');

            if (googleResult && googleResult.data && googleResult.data.status === "OK" && googleResult.data.results && googleResult.data.results.length !== 0) {
                appropriateResult = GeocoderModel.formatGoogle(googleResult.data.results[0])
                // if ( (!appropriateResult || !appropriateResult.city || !appropriateResult.country) && (googleResult.data.results[1]) ) {
                //     console.log("++ NO FIRST CITY WIN< FALLBACK TO SECOND BEST !!");
                //     appropriateResult = GeocoderModel.formatGoogle(googleResult.data.results[1])
                // }
            }

            // If any result with at least the country is defined we will accept it as it is the best we can get (it might still be rejected later if no-city allowed is not enabled)
            if (appropriateResult && /* appropriateResult.city && */ appropriateResult.country) {
                await GeocoderModel.cache({
                    query: latitude + "," + longitude,
                    type: "reverse-geocode",
                    source: "Google Maps",
                    formattedResult: appropriateResult,
                    rawResults: googleResult.data.results,
                }).catch(e => { console.error("Failed to cache", e) })
                return resolve({
                    success: true,
                    data: appropriateResult,
                    source: "Google Maps"
                })
            } else {
                // Saving the failed geocoding result, it will probably not change in the near future, no reaosn to keep asking when the dataset is being reparsed
                await GeocoderModel.cache({
                    query: latitude + "," + longitude,
                    type: "reverse-geocode",
                    source: "Google Maps",
                    formattedResult: null,
                    rawResults: googleResult.data.results,
                }).catch(e => { console.error("Failed to cache", e) })
                return resolve({
                    success: false,
                    data: "No appropriate results found"
                })
            }

        })

    }

    // Geocoding from text-based address
    static async geocode(address, latitude, longitude) {

        return new Promise(async function(resolve, reject) {

            const GeocoderModel = require('./Geocoder.js');

            let googleQuery = "";
            let nominatimQuery = "";
            let appropriateResult = false;

            // For geocoding we need the street name or postcode and city and country
            if ( (address.streetHouse || address.postcode) && (address.city || address.country) ) {
                // Has enough to geocode
            } else {
                return resolve({
                    success: false,
                    error: "Not enough information to geocode"
                })
            }

            // if (address.name) {
            //     googleQuery += address.name + ", "
            // }

            if (address.streetHouse) {
                googleQuery += address.streetHouse + ", "
                nominatimQuery += address.streetHouse + ", "
            }

            if (address.postcode) {
                googleQuery += address.postcode + ", "
                nominatimQuery += address.postcode + ", "
            }

            if (address.city) {
                googleQuery += address.city + ", "
                nominatimQuery += address.city + ", "
            }

            if (address.country) {
                googleQuery += address.country + ", "
                nominatimQuery += address.country + ", "
            }

            googleQuery = googleQuery.substr(0, googleQuery.length-2);
            nominatimQuery = nominatimQuery.substr(0, nominatimQuery.length-2);

            // console.log("Query:  " + googleQuery);

            let cache = await GeocoderModel.get(googleQuery, "geocode").catch(e => { console.error("Failed to get from cache", e) });

            // Returning results from cache
            if (cache) {

                if (cache.formattedResult !== null) {
                    return resolve({
                        success: true,
                        data: cache.formattedResult,
                        source: cache.source
                    })
                } else {
                    return resolve({
                        success: false,
                        data: "No appropriate results found"
                    })
                }

            }

            // Trying with Nominatim frist
            let nominatimResult;

            if (nominatimQuery)
                nominatimResult = await axios.get('https://nominatim.openstreetmap.org/search/' + nominatimQuery + '?format=json&addressdetails=1&limit=1&email=' + Keys.adminEmail).catch(e => { console.error("Failed to get nominatim res", e) } );

            if (nominatimResult && nominatimResult.statusText === "OK" && nominatimResult.data && nominatimResult.data.length !== 0) {

                let bestRes = nominatimResult.data[0];

                // Accepting Nominatim's result if all street number, street, city, postcode and country is defined.
                if (bestRes.address && bestRes.address.house_number && bestRes.address.road && bestRes.address.city && bestRes.address.country && bestRes.address.postcode) {

                    appropriateResult = GeocoderModel.formatNominatim(bestRes)

                    if (latitude && longitude) {

                        appropriateResult = null;

                        for (let i = 0; i < nominatimResult.data.length; i++) {
                            let res = nominatimResult.data[i];
                            // Distance between given and geocoded coordinates are below 1km
                            if (GeocoderModel.getDistanceFromLatLonInKm(latitude, longitude, res.lat, res.lon) < 1){
                                appropriateResult = GeocoderModel.formatNominatim(res)
                                continue;
                            } else {
                                // This res is not withing 1km bound limit
                            }
                        }
                    }

                } else {
                    // Not all components of the address are detected with nominatim", bestRes)
                }

            }

            // Respecting nominatim's 1 request / sec policy
            await (new Promise((resolve) => { setTimeout(resolve, 1000); }))

            if (appropriateResult) {
                await GeocoderModel.cache({
                    query: googleQuery,
                    type: "geocode",
                    source: "Nominatim",
                    formattedResult: appropriateResult,
                    rawResults: nominatimResult.data,
                }).catch(e => { console.error("Failed to cache", e) })
                return resolve({
                    success: true,
                    data: appropriateResult,
                    source: "Nominatim"
                })
            } else {
                // console.log("Not enoug ingo from nominatim")
            }

            // Geocoding with Google
            let googleResult = await axios.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + googleQuery + '&sensor=true&key=' + Keys.googleMaps.apiKey + '&language=en&region=US');

            if (googleResult && googleResult.data && googleResult.data.status === "OK" && googleResult.data.results && googleResult.data.results.length !== 0) {

                appropriateResult = GeocoderModel.formatGoogle(googleResult.data.results[0])

                if (latitude && longitude) {

                    appropriateResult = null;

                    for (let i = 0; i < googleResult.data.results.length; i++) {
                        let res = googleResult.data.results[i];
                        // Distance between given and geocoded coordinates are below 1km
                        if (res.geometry && res.geometry.location && res.geometry.location.lat && GeocoderModel.getDistanceFromLatLonInKm(latitude, longitude, res.geometry.location.lat, res.geometry.location.lng) < 1){
                            appropriateResult = GeocoderModel.formatGoogle(res)
                            continue;
                        } else {
                            // console.log("This res is not withing 1km bound limit")
                        }
                    }
                }

            }

            // Accepting if there is at least a city and country found
            if (appropriateResult && appropriateResult.city && appropriateResult.country) {
                await GeocoderModel.cache({
                    query: googleQuery,
                    type: "geocode",
                    source: "Google Maps",
                    formattedResult: appropriateResult,
                    rawResults: googleResult.data.results,
                }).catch(e => { console.error("Failed to cache", e) })
                return resolve({
                    success: true,
                    data: appropriateResult,
                    source: "Google Maps"
                })
            } else {
                await GeocoderModel.cache({
                    query: googleQuery,
                    type: "geocode",
                    source: "Google Maps",
                    formattedResult: null,
                    rawResults: googleResult.data.results,
                }).catch(e => { console.error("Failed to cache", e) })
                return resolve({
                    success: false,
                    data: "No appropriate results found"
                })
            }

        })

    }

    // Formats Nominatim's result to the internal format
    static formatNominatim(bestRes) {

        let appropriateResult = {
            streetHouse: "",
            postcode: "",
            city: "",
            country: "",
        };

        if (bestRes.lat && bestRes.lon) {
            appropriateResult.lat = bestRes.lat
            appropriateResult.lng = bestRes.lon
        }

        if (bestRes.address.house_number) {
            appropriateResult.streetHouse += bestRes.address.house_number + " ";
        }

        if (bestRes.address.road) {
            appropriateResult.streetHouse += bestRes.address.road;
        }

        if (bestRes.address.postcode) {
            appropriateResult.postcode += bestRes.address.postcode;
        }

        if (bestRes.address.city) {
            appropriateResult.city += bestRes.address.city
        } else if (bestRes.address.locality) {
            appropriateResult.locality += bestRes.address.locality
        }

        if (bestRes.address.country) {
            appropriateResult.country += bestRes.address.country
        }

        return appropriateResult;

    }

    // Formats Google's result to the internal format
    static formatGoogle(bestRes) {

        let formattedRes = {};
        bestRes.address_components.forEach(function(value) {
            formattedRes[value.types[0]] = value.long_name
        });

        let appropriateResult = {
            streetHouse: "",
            postcode: "",
            city: "",
            country: "",
        };

        if (bestRes.geometry && bestRes.geometry.location && bestRes.geometry.location.lat && bestRes.geometry.location.lng) {
            appropriateResult.lat = bestRes.geometry.location.lat
            appropriateResult.lng = bestRes.geometry.location.lng
        }

        if (formattedRes.street_number) {
            appropriateResult.streetHouse += formattedRes.street_number + " ";
        }

        if (formattedRes.route) {
            appropriateResult.streetHouse += formattedRes.route;
        }

        if (formattedRes.postal_code) {
            appropriateResult.postcode += formattedRes.postal_code;
        } else if (formattedRes.postal_code_prefix) {
            appropriateResult.postcode += formattedRes.postal_code_prefix;
        }

        if (formattedRes.postal_town) {
            appropriateResult.city += formattedRes.postal_town;
        } else if (formattedRes.locality) {
            appropriateResult.city += formattedRes.locality;
        } else if (formattedRes.administrative_area_level_3) {
            appropriateResult.city += formattedRes.administrative_area_level_3;
        } else if (formattedRes.administrative_area_level_2) {
            appropriateResult.city += formattedRes.administrative_area_level_2;
        }

        if (formattedRes.country) {
            appropriateResult.country += formattedRes.country;
        }

        return appropriateResult;

    }

}

module.exports = Geocoder;
