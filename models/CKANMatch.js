const Keys = require('../config/Keys.js');
const User = require('../models/User.js');
const Email = require('../models/Email.js');
const FileParser = require('../models/FileParser.js');
const axios = require('axios');
const fs = require('fs');
const { Client } = require('pg');

const FILE_TYPE_PRIORITIES = [
    "geojson", // Definitely geo-location -> no scan needed just save ref
    "kmz", // Definitely geo-location -> no scan needed just save ref
    "kml", // Definitely geo-location -> no scan needed just save ref
    "zip", // Might contain shape file, checking metadata to make sure
    "csv", // Might contain coordinates, scanning field names
    "json", // Might contain coordinates, scanning field names
    "xml", // Might contain coordinates, scanning field names
    "xlsx", // Might contain coordinates, scanning field names
]

// If any of these are a field in file being scanned then it will be logged as a suggestion
const POSSIBLE_LOCATION_FIELDS = [
    "coordinates",
    "coordinate",
    "lat",
    "latitude",
    "long",
    "lng",
    "longitude",
    "address",
    "location",
    "addr",
    "loc",
    "street",
    "streetname",
    "street_name",
    "postcode",
    "zip",
    "zipcode",
    "zip_code",
    "postal_code",
    "postalcode",
]

class CKANMatch {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "userId",
            "meta",
            "date",
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Inserts a new suggestion for a user
    static create(userId, meta) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        INSERT INTO "CKANMatch" ("userId", "meta", "slug", "added")
                        VALUES ($1, $2, $3, false)
                        RETURNING id
                    `,
                    [userId, meta, meta.slug]
                )
                .then(async res => { client.end(); resolve(res.rows[0].id) })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns the CKAN suggestions of a user, searchable
    static get(userId, page, keywords) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            let query = `
                SELECT *
                FROM "CKANMatch"
                WHERE "userId" = $1
                AND added <> true
                ${ (keywords) ? "AND (LOWER(\"slug\") LIKE '%' || $2 || '%'  )" : '' }
                ORDER BY id DESC
                LIMIT ${12} OFFSET ${page*12}
            `

            let params = [userId];

            if (keywords) {
                params.push(keywords.toLowerCase());
            }

            client
                .query(query, params)
                .then(async res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a CKAN suggestion by id
    static getById(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        SELECT *
                        FROM "CKANMatch"
                        WHERE "id" = $1
                    `,
                    [id]
                )
                .then(async res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Marks a suggestion as added
    static markAsAdded(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        UPDATE "CKANMatch"
                        SET added = true
                        WHERE "id" = $1
                    `,
                    [id]
                )
                .then(async res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Checks for CKAN portal updates on the given user
    static crawl(user, firstTime) {

        return new Promise(async function(resolve, reject) {

            const CKANMatch = require('../models/CKANMatch.js');

            let parsedEntities = user.ckanCheckedSlugs || [];
            let matchedEntities = [];
            let url = user.ckanUrl;
            let matchCount = 0;

            // Getting the package list (array of slug of all pacakges)
            let res = await axios.get(url + "api/3/action/package_list", { timeout: 45000 }).catch(function(e) { console.error("Failed to fetch package list", e) });;

            if (res && res.data && res.data.result && res.data.result.length !== 0) {

                let packages = res.data.result;

                for (let j = 0; j < packages.length; j++) {

                    let datasetId = packages[j];

                    if (parsedEntities.indexOf(datasetId) !== -1) {
                        // Package already parsed
                        continue;
                    }

                    // Marking as parsed
                    parsedEntities.push(datasetId)

                    // Getting more information about the package (name, licence, files...)
                    let res = await axios.get(url + "api/3/action/package_show?id=" + datasetId).catch(function(e) { console.error("Failed to fetch dataset", e) });

                    if (res && res.data && res.data.result) {

                        let dataset = res.data.result;

                        // Meta to be saved to the database as a reference
                        let meta = {
                            id: dataset.id,
                            slug: datasetId,
                            title: dataset.title,
                        };

                        if (dataset.license_title) meta.licence = dataset.license_title;
                        if (dataset.maintainer) meta.maintainer = dataset.maintainer;
                        if (dataset.maintainer_email) meta.maintainerEmail = dataset.maintainer_email;
                        if (dataset.tags && dataset.tags.length !== 0) meta.tags = dataset.tags.map(item => item.display_name);
                        if (dataset.groups) meta.groups = dataset.groups;
                        if (dataset.notes) meta.notes = dataset.notes;
                        if (dataset.license_title) meta.licence = dataset.license_title;
                        if (dataset.resources) meta.resources = dataset.resources;

                        if (dataset.resources && dataset.resources.length !== 0) {

                            let bestPriorityI = null;
                            let bestPriorityValue = 100;

                            // Going over all attached resources (files) of the package and determining the one with the best possibility to be a location-based dataset
                            for (let k = 0; k < dataset.resources.length; k++) {

                                let file = dataset.resources[k];
                                let ext = file.url.split(".").pop().toLowerCase();

                                // If a supported extension is found
                                if (FILE_TYPE_PRIORITIES.indexOf(ext) > -1) {
                                    let currentPriority = FILE_TYPE_PRIORITIES.indexOf(ext);
                                    if (currentPriority < bestPriorityValue) {
                                        // A better prioirty file is found
                                        bestPriorityI = k;
                                        bestPriorityValue = currentPriority;
                                    }
                                }

                            }

                            // If any file is found with the possbility of scanning for location-based file
                            if (bestPriorityValue !== 100) {

                                let fileToCheck = dataset.resources[bestPriorityI];
                                meta.file = fileToCheck;

                                // "geojson", "kmz", "kml", "shape" as zip, no need to check anything
                                if (bestPriorityValue < 4) {

                                    // zipped file, but format is not Shape, no check just discard
                                    if ( (bestPriorityValue === 3) && (fileToCheck.format !== "Shape") ) {
                                        continue
                                    }

                                    // Saving reference
                                    await CKANMatch.create(user.id, meta).catch(function(e) { console.error("Failed to insert match", e) });

                                } else {

                                    // Download the file to scan in
                                    let file = await axios.get(fileToCheck.url).catch(function(e) { console.error("Failed to fetch file", e) });;

                                    if (file && file.data) {

                                        let fileName = fileToCheck.url.split("/").pop();
                                        let extension = fileName.split(".");
                                        extension = extension[extension.length-1];

                                        let dataToWrite = file.data;

                                        if (extension.toLowerCase() === "json" || extension.toLowerCase() === "geojson") {
                                            dataToWrite = JSON.stringify(dataToWrite);
                                        }

                                        fs.writeFileSync("./uploads/datasets/" + fileName, dataToWrite);

                                        let fileContent;

                                        try {
                                            fileContent = await FileParser.parse(fileName, fileName.split(".").pop().toLowerCase());
                                        } catch(e) {
                                            console.error(e);
                                            fs.unlinkSync("./uploads/datasets/" + fileName);
                                            continue;
                                        }

                                        if (fileContent && fileContent.fields && fileContent.fields.length !== 0) {
                                            for (let l = 0; l < fileContent.fields.length; l++) {
                                                let fieldName = fileContent.fields[l];
                                                // Possibly location contianed
                                                if (POSSIBLE_LOCATION_FIELDS.indexOf(fieldName) !== -1) {
                                                    await CKANMatch.create(user.id, meta).catch(function(e) { console.error("Failed to insert match", e) });
                                                    break;
                                                }
                                            }
                                        }

                                        fs.unlinkSync("./uploads/datasets/" + fileName);

                                    }

                                }

                                matchCount++;

                            }

                        }

                    }

                }

                await User.updateCheckedCkanSlugs(user.id, parsedEntities).catch(function(e) { console.error("Failed to update users", e) });

                // First scan for the user so sending email
                if (firstTime) {

                    Email.send({
                        to: user.email,
                        subject: "CKAN parsing completed",
                        content: `
                            The parsing of your CKAN portal has finished, ${matchCount} possible location-based datasets were found. <br />
                            New datasets will be checked daily but you will not receive notifications of these. You can review the matches on your profile
                        `,
                        actionButton: {
                            title: "Review",
                            link: Keys.domainName + "profile"
                        }
                    })

                }

            }

        }.bind(this))

    }

}

module.exports = CKANMatch;
