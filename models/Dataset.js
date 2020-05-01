const Keys = require('../config/Keys.js');
const FileParser = require('../models/FileParser.js');
const QueryParser = require('../models/QueryParser.js');
const User = require('../models/User.js');
const Licence = require('../models/Licence.js');
const ActivityLog = require('../models/ActivityLog.js');
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Client } = require('pg');

const DATASET_PRIVATE_FIELDS = [
    "id",
    "isPublished",
    "name",
    "description",
    "updateFrequency",
    "sourceURL",
    "pathToFile",
    "fields",
    "fieldMappings",
    "features",
    "categories",
    "topicId",
    "licenceId",
    "exclusionInclusionFilter",
    "userId",
    "type",
    "pathToItems",
    "uniqueIdCompositeKey",
    "format",
    "savedName",
    "latestSourceDateModified",
    "markers",
    "paths",
    "polygons",
    "hasChangedSinceLastParse",
    "maintainerEmail",
    "maintainerName",
    "isQueued",
    "isDeleted",
    "createdAt",
    "updatedAt",
    "sources",
    "requestId",
    "locationupdatedat",
    "repeatingValues",
    "lastCheckForUpdates",
    "queuedForNextScheduledWave",
    "noReverseGeocode",
    "noGeocode",
    "acceptNoAddress"
];

const API_DATABASE_MAPPING_FIELDS = {
    'name': 'name',
    'description': 'description',
    'id': 'id',
    'features': 'features',
    'categories': 'categories',
    'author': 'userId',
    'fields': 'fields',
    'sources': 'sources'
}

const API_DATABASE_MAPPING_QUERY = {
    'name': 'name',
    'description': 'description',
    'id': 'id',
    'features': 'features',
    'categories': 'categories',
    'fields': 'fields',
    'id': 'id'
}

class DatasetModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        if (args) {

            DATASET_PRIVATE_FIELDS.forEach((paramName, i) => {
                if (args[paramName] !== undefined) {
                    this[paramName] = args[paramName];
                }
            });

        }

    }

    // Converts tag editor objects to list of strings
    beforeInsert() {

        if ( (this.categories) && (this.categories.default) && (this.categories.default.length !== 0) ) {
            this.categories.default = this.categories.default.map(item => {
                return item.id;
            })
        }

        if ( (this.features) && (this.features.default) && (this.features.default.length !== 0) ) {
            this.features.default = this.features.default.map(item => {
                return item.id;
            })
        }

    }

    // Saves a file from the url
    static async saveFromURL(url, fileOutname, ext) {

        return new Promise(async function(resolve, reject) {

            let file = await axios.get(url).catch(e => { console.error("Failed to get file", e); return reject("Failed to get file") });

            if (!file || !file.data) {
                return reject("Empty File");
            }

            // JSON files fails to be saved for some reason
            if (ext === "json") {
                ext = "txt"
            }

            let dataToWrite = file.data;

            if (ext.toLowerCase() === "json" || ext.toLowerCase() === "txt" || ext.toLowerCase() === "geojson") {
                dataToWrite = JSON.stringify(dataToWrite);
            }

            // KMZ files has be written as stream for some reason
            if (ext.toLowerCase() === "kmz") {
                await axios({ method: "get", url: url, responseType: "stream" }).then(function (response) { return new Promise(async function(resolve, reject) { await response.data.pipe(fs.createWriteStream("./uploads/datasets/fix-" + fileOutname)); resolve(); }) })
            }

            fs.writeFile("./uploads/datasets/" + fileOutname + "." + ext, dataToWrite, async function(err) {

                if (err) {
                    return reject("Failed to save file");
                }

                return resolve(FileParser.parse(fileOutname + "." + ext, ext));

            })

        }) //.bind(this)).catch(e => { console.error("Failed to get file", e); return null })

    }

    // Maps fields requested from the api to the database's fields
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

    // Converts the public api query to database query
    static publicAPIQueryToDatabaseQuery(query) {

        const PROHIBITED_FIELDS = []

        const ALLOWED_OPERATORS = {
            "!=" : ["name", "description", "id"],
            "=": ["name", "description", "id"],
            "contains": ["name", "description", "id", "categories", "features"],
            "!contains": ["name", "description", "id", "categories", "features"],
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

        return QueryParser.publicAPIQueryToDatabaseQuery(query, false, PROHIBITED_FIELDS, ALLOWED_OPERATORS, OPERATORS_WITH_VALUE, ARRAY_FIELDS, API_DATABASE_MAPPING_QUERY)

    }

    // Formats the output fields of all results to conform the documentation
    static async formatDatabaseToPublicAPI(rows) {

        return new Promise(async function(resolve, reject) {

            let userIds = [];
            let licenceIds = [];
            let userResults = {};
            let licenceResults = {};

            // Need additional db queries
            if (rows[0].userId || rows[0].licenceId) {

                for (let i = 0; i < rows.length; i++) {

                    let userId = rows[i].userId;
                    let licenceId = rows[i].licenceId;

                    if ( (userId) && (userIds.indexOf(userId) === -1) ) {
                        userIds.push(userId)
                    }

                    if ( (licenceId) && (licenceIds.indexOf(userId) === -1) ) {
                        licenceIds.push(licenceId)
                    }

                }

            }

            if (licenceIds.length !== 0) {

                // Getting licence information separately instead of a join
                let licences = await Licence.get().catch(function(e) { console.error("Failed to get licences", e); });

                if (!licences) {
                    return reject("Failed to get licences");
                }

                for (let i = 0; i < licences.length; i++) {
                    let licence = licences[i];
                    licenceResults[licence.id] = licence;
                }

            }

            if (userIds.length !== 0) {

                // Getting user information separately instead of a join
                let users = await User.getByIds(userIds, "id,email,username").catch(function(e) { console.error("Failed to get users", e); });

                if (!users) {
                    return reject("Failed to get users");
                }

                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                    userResults[user.id] = user;
                }

            }

            for (let i = 0; i < rows.length; i++) {

                let row = rows[i];

                delete row.total;

                if (row.isDeleted !== undefined) {
                    row.deleted = row.isDeleted;
                    delete row.isDeleted;
                }

                if (row.features) {
                    let formattedFeatures = [];
                    if (row.features.default)
                        formattedFeatures = formattedFeatures.concat(row.features.default)
                    if (row.features.filterRules) {
                        for (let key in row.features.filterRules) {
                            formattedFeatures.push(row.features.filterRules[key].name)
                        }
                    }
                    row.features = [...new Set(formattedFeatures)]
                }

                if (row.categories) {
                    let formattedFeatures = [];
                    if (row.categories.default)
                        formattedFeatures = formattedFeatures.concat(row.categories.default)
                    if (row.categories.filterRules) {
                        for (let key in row.categories.filterRules) {
                            formattedFeatures.push(row.categories.filterRules[key].name)
                        }
                    }
                    row.categories = [...new Set(formattedFeatures)]
                }

                if (row.userId) {
                    let user = userResults[row.userId];
                    if (user) {
                        row.author = user;
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

                if (row.fields) {
                    let formattedFields = [];
                    for (let key in row.fields) {
                        if (key.startsWith("___") && key.endsWith("___")) continue;
                        formattedFields.push(key);
                    }
                    row.fields = formattedFields
                }

                delete row.maintainerEmail;
                delete row.maintainerName;
                delete row.sourceURL;
                delete row.exclusionInclusionFilter;
                delete row.type;
                delete row.pathToItems;
                delete row.uniqueIdCompositeKey;
                delete row.savedName;
                delete row.topicId;
                delete row.updateFrequency;
                delete row.pathToFile;
                delete row.latestSourceDateModified;
                delete row.hasChangedSinceLastParse;
                delete row.isPublished;
                delete row.markers;
                delete row.paths;
                delete row.polygons;
                delete row.isQueued;
                delete row.deleted;
                delete row.format;
                delete row.status;
                delete row.requestId;
                delete row.lastCheckForUpdates;
                delete row.queuedForNextScheduledWave;
                delete row.noReverseGeocode;
                delete row.noGeocode;
                delete row.acceptNoAddress;
                delete row.repeatingValues

                row.updatedat = row.locationupdatedat;
                delete row.locationupdatedat;

                rows[i] = row;

            }

            return resolve(rows);

        })

    }

    // Performs Public API search
    static apiSearch(fields, userQuery, start, limit) {

        return new Promise(function(resolve, reject) {

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

            // Skeleton Query
            let query = `
                SELECT ${fieldsQuery}, count(*) OVER() AS total
                FROM datasets
                ${ userQuery ? "WHERE " + userQuery : "" } AND "isPublished" = true AND ("isDeleted" <> true OR "isDeleted" IS NULL)
                ORDER BY id DESC
                LIMIT ${limit} OFFSET ${start}
            `
            let params = [];

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
                            data: await this.formatDatabaseToPublicAPI(res.rows),
                            total: total
                        });
                    }
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all scheduled parses for the given intervals
    static getScheduledExternalParses(intervals) {

        return new Promise(function(resolve, reject) {

            let whereIntervals = "";

            for (let i = 0; i < intervals.length; i++) {
                whereIntervals += `"updateFrequency" = '${intervals[i]}'`
                if (i !== intervals.length - 1) {
                    whereIntervals += " OR ";
                }
            }

            const client = this.getClient();
            client.connect();

            client
                .query(
                    `
                        SELECT
                            *
                        FROM
                            datasets
                        WHERE ("isPublished" = true)
                        AND (
                            (${whereIntervals}) OR ("queuedForNextScheduledWave" = true)
                        )
                        AND "type" = 'external'
                        AND "isPublished" = true
                        AND ("isDeleted" = false OR "isDeleted" IS NULL)
                    `,
                    []
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all unique ids for the given entries
    static getUniqueIds(entities, uniqueIdFields) {

        let ids = [];

        for (let i = 0; i < entities.length; i++) {

            let entity = entities[i];
            let id = "";

            for (let j = 0; j < uniqueIdFields.length; j++) {

                let fieldValue = FileParser.resolveNestedObjectField(entity, uniqueIdFields[j])

                if (!fieldValue) {
                    return false;
                }

                id += fieldValue + " ";

            }

            id = id.trim();

            if (ids.indexOf(id) > -1) {
                return {
                    success: false,
                    data: "Duplicate Id: " + id
                };
            }

            ids.push(id);

        }

        return {
            success: true,
            data: ids
        };

    }

    // Returns all mapped fields of a dataset
    static getMappedFields(fields) {

        let mappedProperties = {};

        for (let key in fields) {
            if (!key.startsWith("___")) {
                for (let i = 0; i < fields[key].type.length; i++) {
                    let mappedProp = fields[key].type[i];
                    if (!mappedProperties[mappedProp])
                        mappedProperties[mappedProp] = [];
                    mappedProperties[mappedProp].push(key);
                }
            }
        }

        return mappedProperties;

    }

    // Returns the latest changes in a dataset
    static async getLatestDatasetChanges(field, id, page) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT id
                FROM "datasets"
                WHERE id
                    IN (
                        SELECT DISTINCT "datasetId"
                        FROM locations
                        WHERE "${field}"=$1
                    )
                AND ("isPublished" = true)
                AND ("isDeleted" = false OR "isDeleted" IS NULL)
                ORDER BY "locationupdatedat" DESC
                LIMIT 12 OFFSET $2
            `

            let params = [id, (page*12)];

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns latest dataset by city id (searchable)
    static async getByCityId(cityId, page, keywords) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT datasets.id, datasets.name, datasets."isQueued", datasets.locationupdatedat,  datasets.description, datasets."userId",
                users.username AS username, users.picture as "userPhoto", topics.name as "topicName"
                FROM datasets
                LEFT JOIN topics
                    ON topics.id = datasets."topicId"
                LEFT JOIN users
                    ON users.id = datasets."userId"
                WHERE
                    datasets.id IN (
                        SELECT DISTINCT "datasetId"
                        FROM "locations"
                        WHERE "cityId" = $2
                            AND ("isDeleted" = false OR "isDeleted" IS NULL)
                            AND "isApproved" = true
                        GROUP BY "datasetId"
                        HAVING "datasetId" IS NOT NULL
                    )
                    AND ( (datasets."isDeleted" <> true) OR (datasets."isDeleted" IS NULL) )
                    ${ (keywords) ? "AND ( (LOWER(datasets.name) LIKE '%' || $3 || '%'  ) OR (LOWER(datasets.description) LIKE '%' || $3 || '%'  ) )" : '' }
                GROUP BY 1, users.username, users.picture, topics.name
                ORDER BY datasets.locationupdatedat DESC
                LIMIT 10 OFFSET $1
            `

            let params = [(page*10), cityId];

            if (keywords) {
                params.push(keywords.toLowerCase());
            }

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns latest dataset by country id (searchable)
    static async getByCountryId(countryId, page, keywords) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT datasets.id, datasets.name, datasets."isQueued", datasets.locationupdatedat,  datasets.description,
                users.username AS username, users.picture as "userPhoto", topics.name as "topicName"
                FROM datasets
                LEFT JOIN topics
                    ON topics.id = datasets."topicId"
                LEFT JOIN users
                    ON users.id = datasets."userId"
                WHERE
                    datasets.id IN (
                        SELECT DISTINCT "datasetId"
                        FROM "locations"
                        WHERE "countryId" = $2
                            AND ("isDeleted" = false OR "isDeleted" IS NULL)
                            AND "isApproved" = true
                        GROUP BY "datasetId"
                        HAVING "datasetId" IS NOT NULL
                    )
                    AND ( (datasets."isDeleted" <> true) OR (datasets."isDeleted" IS NULL) )
                    ${ (keywords) ? "AND ( (LOWER(datasets.name) LIKE '%' || $3 || '%'  ) OR (LOWER(datasets.description) LIKE '%' || $3 || '%'  ) )" : '' }
                GROUP BY 1, users.username, users.picture, topics.name
                ORDER BY datasets.locationupdatedat DESC
                LIMIT 10 OFFSET $1
            `

            let params = [(page*10), countryId];

            if (keywords) {
                params.push(keywords.toLowerCase());
            }

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns datasets that match the given internal ids
    static async getByIds(ids, start, limit) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT datasets.id, datasets.name, datasets."isQueued", datasets.locationupdatedat,  datasets.description,
                users.username AS username, users.picture as "userPhoto", topics.name as "topicName"
                FROM datasets
                LEFT JOIN topics
                    ON topics.id = datasets."topicId"
                LEFT JOIN users
                    ON users.id = datasets."userId"
                WHERE
                    (datasets.id IN (${ids.join(",")}))
                    AND ( (datasets."isDeleted" <> true) OR (datasets."isDeleted" IS NULL) )
                GROUP BY 1, users.username, users.picture, topics.name
                LIMIT $2 OFFSET $1
            `

            let params = [start, limit];

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns add datasets that match the given internal ids
    static async getAllByIds(ids, fields) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT ${fields}
                FROM datasets
                WHERE (id IN (${ids.join(",")}))
            `

            let params = [];

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns datasets with the given user id (searchalbe)
    static async getByUserId(userId, page, keywords, isCurrentUser) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT datasets.id, datasets.name, datasets."isQueued", datasets.locationupdatedat,  datasets.description, datasets."userId",
                users.username AS username, users.picture as "userPhoto", topics.name as "topicName"
                FROM datasets
                LEFT JOIN topics
                    ON topics.id = datasets."topicId"
                LEFT JOIN users
                    ON users.id = datasets."userId"
                WHERE
                    (datasets."userId" = $2)
                    AND ( (datasets."isDeleted" <> true) OR (datasets."isDeleted" IS NULL) )
                    ${ (!isCurrentUser) ? 'AND (datasets."isPublished" = true)' : '' }
                    ${ (keywords) ? "AND ( (LOWER(datasets.name) LIKE '%' || $3 || '%'  ) OR (LOWER(datasets.description) LIKE '%' || $3 || '%'  ) )" : '' }
                GROUP BY 1, users.username, users.picture, topics.name
                ORDER BY datasets.locationupdatedat DESC
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

    // Returns all locations of a dataset
    static async getLocationsById(id, page, keywords) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            let query = `
                SELECT *
                FROM locations
                WHERE ("datasetId" = $1)
                AND ( ("isDeleted" <> true) OR ("isDeleted" IS NULL) )
                AND ( error IS NULL AND "isApproved" = true )
            `;

            let params = [id];

            if (keywords && keywords.length !== 0) {

                query += " AND ( "

                for (let i = 0; i < keywords.length; i++) {

                    let keyword = keywords[i].toLowerCase();

                    if (keyword.startsWith("category:")) {
                        keyword = keyword.split(":")[1];
                        params.push(keyword);
                        query += `LOWER("categories"::text) LIKE '%' || $${params.length} || '%'`
                    } else if (keyword.startsWith("feature:")) {
                        keyword = keyword.split(":")[1];
                        params.push(keyword);
                        query += `LOWER("features"::text) LIKE '%' || $${params.length} || '%'`
                    } else if (keyword.startsWith("city:")) {
                        keyword = keyword.split(":")[1];
                        params.push(keyword);
                        query += `LOWER("cityName") = $${params.length}`
                    } else if (keyword.startsWith("country:")) {
                        keyword = keyword.split(":")[1];
                        params.push(keyword);
                        query += `LOWER("countryName") = $${params.length}`
                    } else {
                        params.push(keyword);
                        query += `"quickSearchStr" LIKE '%' || $${params.length} || '%'`
                    }

                    if (keywords.length - 1 !== i) {
                        query += " AND "
                    }
                }

                query += " )"

            }

            if (page !== undefined && keywords !== undefined) {
                params.push((page*20))
                query += `
                    ORDER BY updatedat DESC
                    LIMIT 20 OFFSET $${params.length}
                `
            }

            client.query(query, params).then(res => { client.end(); resolve(res.rows); }).catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a dataset by its id and owner user id (authenticate)
    static async getByIdAndUserId(id, userId) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            let query = `
                SELECT *
                FROM datasets
                WHERE id = $1 AND "userId" = $2
            `

            let params = [id, userId];

            client.query(query, params).then(res => { client.end(); resolve(res.rows[0]); }).catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns the number of datasets a user owns
    static async getCountByUserId(userId) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(`SELECT COUNT(id) as count FROM datasets WHERE "userId" = $1`, [userId] )
                .then(res => { client.end(); resolve(res.rows[0].count); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all locations with the required field to compile statisitcs for the dataset
    static async getStatFieldsById(id) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(
                    `
                        SELECT id, updatedat, "locationPath", "locationPoint", "locationPolygon", categories, features, "cityId", "countryId", "cityName", "countryName"
                        FROM locations
                        WHERE "datasetId" = $1 AND "isApproved" = true AND "error" IS NULL AND ("isDeleted" IS NULL OR "isDeleted" <> true)
                        ORDER BY updatedat DESC
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a dataset by its internal id
    static async getById(id) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(
                    `
                        SELECT
                            datasets.*,
                            users.username as "authorUsername",
                            licences.name as "licenceType", licences.description as "licenceDescription",
                            topics.name as "topicName"
                        FROM datasets
                            LEFT JOIN users
                                ON datasets."userId" = users.id
                            LEFT JOIN licences
                                ON datasets."licenceId" = licences.id
                            LEFT JOIN topics
                                ON datasets."topicId" = topics.id
                        WHERE datasets.id = $1
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(res.rows[0]); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates a dataset categories
    updateCategories() {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            this.beforeInsert();

            client
                .query(
                    `
                        UPDATE datasets
                        SET categories = $1
                        WHERE id = $2 AND "userId" = $3
                    `,
                    [this.categories, this.id, this.userId]
                )
                .then(res => { client.end(); resolve(); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all queued (for manual parse) datasets
    static getQueued() {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(
                    `
                        SELECT datasets.*, users.email as email, users.managed as managed
                        FROM datasets
                        INNER JOIN users
                        ON datasets."userId" = users.id
                        WHERE "isQueued" = true
                    `,
                    []
                )
                .then(res => { client.end(); resolve(res.rows ? res.rows[0] : null); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Makes a dataset and all its (valid) locations public
    static publish(id) {

        return new Promise(async function(resolve, reject) {

            const client = this.getClient(); client.connect();

            await client
                .query(
                    `
                        UPDATE datasets
                        SET "isPublished" = true,
                            "locationupdatedat" = $2
                        WHERE id = $1
                    `,
                    [id, new Date()]
                )
                .then(res => { console.log("Dataset marked as published") })
                .catch(e => { reject(e.stack); })

            await client
                .query(
                    `
                        UPDATE locations
                        SET "isApproved" = true
                        WHERE "datasetId" = $1 AND "error" IS NULL
                    `,
                    [id]
                )
                .then(res => { console.log("Locations marked as published") })
                .catch(e => { reject(e.stack); })

            client.end();
            resolve();

        }.bind(this))

    }

    // Hard deletes a location (full reparse from new source) from the database
    static hardDeleteLocation(id, userId) {

        return new Promise(async function(resolve, reject) {

            const client = this.getClient(); client.connect();

            await client.query(`DELETE FROM locations WHERE "datasetId" = $1 AND "userId" = $2`, [id, userId]).catch(e => { console.error(e.stack); })
            await client.query(`DELETE FROM "activityLog" WHERE "relatedEntityId" = $1 AND "type" = "LOCATION"`, [id]).catch(e => { console.error(e.stack); })

            client.end();
            resolve();

        }.bind(this))

    }

    // Removes a dataset and all its locations
    static delete(id, userId) {

        return new Promise(async function(resolve, reject) {

            const client = this.getClient(); client.connect();

            await client
                .query(
                    `
                        UPDATE datasets
                        SET "isDeleted" = true
                        WHERE id = $1 AND "userId" = $2
                    `,
                    [id, userId]
                )
                .then(res => { console.log("Dataset marked as deleted") })
                .catch(e => { reject(e.stack); })

            await client
                .query(
                    `
                        UPDATE locations
                        SET "isDeleted" = true
                        WHERE "datasetId" = $1 AND "userId" = $2
                    `,
                    [id, userId]
                )
                .then(res => { console.log("Locations marked as deleted"); })
                .catch(e => { reject(e.stack); })

            await ActivityLog.log({
                type: "DATASET",
                action: "DELETE",
                entityId: id,
                userId: userId,
            })

            client.end();
            resolve();

        }.bind(this))

    }

    // Queued a dataset to be parsed (manual)
    static queueForParsing(id) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(
                    `
                        UPDATE datasets
                        SET "isQueued" = true
                        WHERE id = $1
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(true); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Removed a dataset from the queue list
    static dequeue(id) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(
                    `
                        UPDATE datasets
                        SET "isQueued" = false
                        WHERE id = $1
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(true); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Schedules the dataset to be reparsed for content in the next wave of scheduled parses (might take 5 mintues)
    static queuedForNextScheduledWave(id) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(
                    `
                        UPDATE datasets
                        SET "queuedForNextScheduledWave" = true
                        WHERE id = $1
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(true); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates the features of the dataset
    updateFeatures() {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            this.beforeInsert();

            client
                .query(
                    `
                        UPDATE datasets
                        SET features = $1
                        WHERE id = $2 AND "userId" = $3
                    `,
                    [this.features, this.id, this.userId]
                )
                .then(res => { client.end(); resolve(); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates the given fields of the dataset
    update() {

        this.beforeInsert();

        let query = `
            UPDATE datasets
            SET
        `;

        let updatesQuery = "";
        let params = [];

        for (let key in this) {

            if ( (key !== "id") && (key !== "userId") && (key !== "updatedAt") || (key !== "createdAt") ) {
                params.push(this[key]);
                updatesQuery += "\"" + key + "\" = $" + params.length + ", ";
            }

        }

        updatesQuery = updatesQuery.replace(/, $/, '');

        query += updatesQuery;
        params.push(this.id);
        query += " WHERE id = $" + params.length;

        return new Promise(function(resolve, reject) {

            if (!this['id']) {
                return reject("Missing id")
            }

            if (params.length === 0) {
                return reject("Nothing to update")
            }

            const client = this.getClient();
            client.connect();

            this.beforeInsert();

            client
                .query(query, params)
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "DATASET",
                        action: "CREATE",
                        entityId: this.id,
                        userId: this.userId,
                    })
                    resolve();
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Inserts a new dataset
    create() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        INSERT INTO datasets ("isQueued", "userId", "type", "sourceURL", "fields", "pathToItems", "format", "savedName", "topicId", "categories", "features", "pathToFile", "isPublished", "markers", "paths", "polygons", "hasChangedSinceLastParse", "licenceId", "sources", "repeatingValues")
                        VALUES (false, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false, $16, $17, $18)
                        RETURNING *
                    `,
                    [this.userId, this.type, this.sourceURL, this.fields, this.pathToItems, this.format, this.savedName, this.topicId, this.categories, this.features, this.pathToFile, this.isPublished, this.markers, this.paths, this.polygons, this.licenceId, this.sources, this.repeatingValues]
                )
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "DATASET",
                        action: "CREATE",
                        entityId: res.rows[0].id,
                        userId: this.userId,
                    })
                    resolve(res.rows[0])
                })
                .catch(e => {
                    console.log("ERRORE", e)
                    client.end()
                    reject(e.stack)
                })

        }.bind(this))

    }

}

module.exports = DatasetModel;
