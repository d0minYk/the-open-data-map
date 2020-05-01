const router = require('express').Router();
const auth = require('./Auth');
const Dataset = require('../models/Dataset');
const Social = require('../models/Social');
const CKANMatch = require('../models/CKANMatch');
const Tag = require('../models/Tag');
const crypto = require('crypto');
const multer = require('multer');
const Utilities = require('../Utilities')
const FileParser = require('../models/FileParser');
const Location = require('../models/Location');
const Subscription = require('../models/Subscription');
const ActivityLog = require('../models/ActivityLog');
const Like = require('../models/Like');
const Request = require('../models/Request');
const Comment = require('../models/Comment');
const Share = require('../models/Share');
const Rating = require('../models/Rating');
const Report = require('../models/Report');
const Email = require('../models/Email');
const User = require('../models/User');
const keys = require('../config/Keys');
const fs = require('fs');
const mime = require('mime-types');

const DEFAULT_MARKERS_FIELD = {
    default: {
        color: '#4a69bb',
        name: "Default"
    }
}

const DEFAULT_PATHS_FIELD = {
    default: {
        name: "Default",
        borderColor: '#333',
        borderWeight: 5,
        borderOpacity: 1,
    }
}

const DEFAULT_POLYGONS_FIELD = {
    default: {
        name: "Default",
        borderColor: '#333',
        borderWeight: 5,
        borderOpacity: 1,
        fillOpacity: 1,
        fillColor: '#4a69bb'
    }
}

router.post('/', auth.required, auth.requiredCustom, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let userId = req.payload.id;

        if (!userId) {
            reject({ code: 401, msg: "Invalid token" });
            return;
        }

        let preparedFields = {
            "___DEFAULT_CITY___": {
                type: "default",
                name: null,
                id: null,
            },
            "uniqueId": {
                name: "uniqueId",
                visibleToUsers: false,
                type: []
            },
            "___DEFAULT_COUNTRY___": {
                type: "default",
                name: null,
                id: null,
            },
            "Website": { name: "Website", type: ['website'], id: null },
            "Name": { name: "Name", type: ['name'], id: null },
            "Telephone Number": { name: "Telephone Number", type: ['tel'], id: null },
            "Email address": { name: "Email address", type: ['email'], id: null },
        };

        let newDataset = new Dataset({
            type: 'internal',
            sourceURL: null,
            pathToFile: null,
            fields: preparedFields,
            markers: DEFAULT_MARKERS_FIELD,
            paths: DEFAULT_PATHS_FIELD,
            polygons: DEFAULT_POLYGONS_FIELD,
            pathToItems: null,
            format: null,
            userId: req.payload.id,
            locationCount: 0,
            updateFrequency: null,
            categories: {
                default: null,
                includeDefault: "all",
                filterRules: {}
            },
            features: {
                default: [],
                filterRules: {}
            },
            isPublished: false,
            topicId: 16 // Other default
        });

        newDataset.create().then(dataset => {
            resolve(dataset);
        }).catch(e => {
            console.error(e);
            reject({ code: 500 });
        })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.post('/parse', auth.required, auth.requiredCustom, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let url = req.body.url;
        let onlyImport = req.body.onlyImport;
        let uniqueId = req.body.uniqueId;
        let ckanMatchId = req.body.ckanMatchId;
        let ckanMatch

        if (!userId) {
            reject({ code: 401, msg: "Invalid token" });
            return;
        }

        if (!url) {
            reject({ code: 400, msg: "Missing URL" });
            return;
        }

        if (ckanMatchId) {
            ckanMatch = await CKANMatch.getById(ckanMatchId).catch(e => { console.error("Failed to get ckan match", e); });
            if (!ckanMatch || !ckanMatch[0]) {
                return reject({ code: 400, msg: "Failed to get match" });
            }
            ckanMatch = ckanMatch[0];
        }

        const isURL = await Utilities.isURL(url);

        if (!isURL) {
            reject({ code: 400, msg: "Invalid URL" });
            return;
        }

        let urlParts = url.split("/");
        let fileName = urlParts[urlParts.length-1];
        let extension

        if (fileName) {
            extension = fileName.split(".");
            extension = extension[extension.length-1];
        }

        if (extension === "json") {
            extension = "txt";
        }

        const axios = require('axios');

        let file = await axios.get(url);

        if (!file.data) {
            reject({ code: 400, msg: "Empty file" });
            return;
        }

        let fileOutname = crypto.randomBytes(16).toString("hex");
        fileOutname = fileOutname + (extension ? "." + extension : "");

        let dataToWrite = file.data;

        if (extension.toLowerCase() === "json" || extension.toLowerCase() === "txt" || extension.toLowerCase() === "geojson") {
            dataToWrite = JSON.stringify(dataToWrite);
        }

        if (extension.toLowerCase() === "kmz") {
            await axios({ method: "get", url: url, responseType: "stream" }).then(function (response) { return new Promise(async function(resolve, reject) { await response.data.pipe(fs.createWriteStream("./uploads/datasets/fix-" + fileOutname)).on("finish",function() {resolve(); });  }) })
        }

        fs.writeFile("./uploads/datasets/" + fileOutname, dataToWrite, async function(err) {

            if (err) {
                // console.error(err);
                reject({ code: 500, msg: "Failed to write file" });
                return;
            }

            let fileError = null;
            let file = await FileParser.parse(fileOutname, extension).catch(e => {
                fileError = e;
                console.error("Failed openning file", e);
            });
            let duplicatIds = false;

            if (fileError) {
                reject({ code: 400, msg: fileError });
                return;
            }

            if (!file) {
                reject({ code: 400, msg: "Invalid file, make sure that the url is directly points at the file." });
                return;
            }

            let suggestions = file.content ? FileParser.getRepeatingValues(file.content) : [];

            let preparedFields = {
                "___DEFAULT_CITY___": {
                    type: "default",
                    name: null,
                    id: null,
                },
                "uniqueId": {
                    name: "uniqueId",
                    visibleToUsers: false,
                    type: []
                },
                "___DEFAULT_COUNTRY___": {
                    type: "default",
                    name: null,
                    id: null,
                },
            };

            file.fields.map(item => {
                preparedFields[item] = {
                    name: item,
                    visibleToUsers: false,
                    type: []
                }
                return item;
            })

            let sources = [];

            if (ckanMatch) {
                sources = ckanMatch.meta.resources.map(item =>{
                    return {
                        name: item.name,
                        type: item.format,
                        url: item.url
                    }
                })
            }

            let newDataset = new Dataset({
                type: onlyImport ? 'internal' : 'external',
                sourceURL: url,
                pathToFile: fileOutname,
                fields: preparedFields,
                markers: DEFAULT_MARKERS_FIELD,
                paths: DEFAULT_PATHS_FIELD,
                polygons: DEFAULT_POLYGONS_FIELD,
                pathToItems: file.pathToItems,
                format: file.format,
                savedName: fileOutname,
                userId: req.payload.id,
                locationCount: file.content.length,
                updateFrequency: onlyImport ? null : 'manually',
                categories: {
                    default: null,
                    includeDefault: "all",
                    filterRules: {}
                },
                features: {
                    default: [],
                    filterRules: {}
                },
                repeatingValues: suggestions,
                topicId: 16, // Other default
                name: ckanMatch ? ckanMatch.meta.title : null,
                description: ckanMatch ? ckanMatch.meta.notes.replace( /[\r\n]+/gm, "" ).replace(/<[^>]*>?/gm, '') : null,
                sources: sources,
                // licenceId: (ckanMatch && ckanMatch.meta.) ? ckanMatch.meta.notes.replace( /[\r\n]+/gm, "" ).replace(/<[^>]*>?/gm, '') : null,
            });

            if (ckanMatch) {
                await CKANMatch.markAsAdded(ckanMatchId).catch(e => { console.error("Failed to mark ckan match as added", e); });
            }

            newDataset.create().then(dataset => {
                resolve(dataset);
            }).catch(e => {
                console.error(e);
                reject({ code: 500 });
            })

        });

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.post('/upload', auth.required, auth.requiredCustom, function(req, res, next) {
    next();
}, multer({

    storage: multer.diskStorage({

        destination: function(req, file, next){
            next(null, './uploads/datasets');
        },

        filename: function(req, file, next){
            let extension = file.originalname.split('.');
            extension = extension[extension.length-1];
            if (extension === "json")
                extension = "txt";
            let filename = crypto.randomBytes(16).toString("hex") + "." + extension;
            next(null, filename);
        },

    }),

    limits: { fileSize: 1024*1000*100 },

}).single('dataset'), function(req, res, next) {

    return new Promise(async function(resolve, reject) {

    	let fileName = req.file.filename;
        let extension = fileName.split(".");
        extension = extension[extension.length-1];

        let file = await FileParser.parse(fileName, extension).catch(function(err) {
            return reject({ code: 400, msg: err || "Invalid file. Make sure that the structure of the dataset conforms to standards" });
        })

        if (!file) {
            return reject({ code: 400, msg: "Invalid file. Make sure that the structure of the dataset conforms to standards" });
        }

        let preparedFields = {
            "___DEFAULT_CITY___": {
                type: "default",
                name: null,
                id: null,
            },
            "uniqueId": {
                name: "uniqueId",
                visibleToUsers: false,
                type: []
            },
            "___DEFAULT_COUNTRY___": {
                type: "default",
                name: null,
                id: null,
            },
        };

        file.fields.map(item => {
            preparedFields[item] = {
                name: item,
                visibleToUsers: false,
                type: []
            }
            return item;
        })

        let suggestions = file.content ? FileParser.getRepeatingValues(file.content) : [];

        let newDataset = new Dataset({
            type: 'internal',
            sourceURL: null,
            pathToFile: fileName,
            fields: preparedFields,
            markers: DEFAULT_MARKERS_FIELD,
            paths: DEFAULT_PATHS_FIELD,
            polygons: DEFAULT_POLYGONS_FIELD,
            pathToItems: file.pathToItems,
            format: file.format,
            savedName: fileName,
            userId: req.payload.id,
            locationCount: file.content.length,
            categories: {
                default: [],
                includeDefault: "all",
                filterRules: {}
            },
            features: {
                default: [],
                filterRules: {}
            },
            repeatingValues: suggestions,
            topicId: 16
        });

        let dataset = await newDataset.create().catch(e => {
            console.error("FAiled to create dataset", e);
            reject({ code: 500 });
        })

        if (dataset) {
            resolve(dataset)
        } else {
            reject({ code: 500 });
        }

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.get('/:id/progress', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;

        if ( (!id) || (!userId) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(function(dataset) {

                if (!dataset) {
                    return reject({ code: 404, msg: "Dataset cannot be found" });
                }

                Location
                    .getAllFromDataset(id, `id, name, error, "errorRowI"`)
                    .then(function(locations) {

                        if (!locations) {
                            locations = []
                        }

                        resolve({
                            dataset: dataset,
                            locations: locations
                        });

                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err);
                return reject({ code: 500, msg: "Failed to get Dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.get('/:entity/:id/:page/:keywords', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.params.id;
        let page = req.params.page;
        let keywords = req.params.keywords;
        let entity = req.params.entity;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        if (!entity || (entity !== "city" && entity !== "organization" && entity !== "country")) {
            return reject({ code: 400, msg: "Invalid entity " + entity });
        }

        if (!page) {
            page = 0;
        }

        if ( (!keywords) || (keywords === "null") ) {
            keywords = "";
        }

        let datasets = [];

        if (entity === "city") {
            datasets = await Dataset.getByCityId(id, page, keywords, req.payload ? req.payload.id === parseInt(id) : false).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get Dataset" }); })
        } else if (entity === "country") {
            datasets = await Dataset.getByCountryId(id, page, keywords, req.payload ? req.payload.id === parseInt(id) : false).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get Dataset" }); })
        } else if (entity === "organization") {
            datasets = await Dataset.getByUserId(id, page, keywords, req.payload ? req.payload.id === parseInt(id) : false).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get Dataset" }); })
        }

        let datasetActions = [];

        if (datasets && datasets.length !== 0) {
            datasetActions = await Social.getStats("dataset", datasets.map(item => item.id)).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get Dataset stats" }); })
            if (datasetActions && datasetActions.length !== 0) {
                datasets = Social.mergeEntitiesWithStats(datasets, datasetActions)
            }
            return resolve(datasets);
        } else {
            return resolve(datasets)
        }

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.get('/:id/:page/:keywords', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let page = req.params.page;
        let keywords = req.params.keywords;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        if (!page) {
            page = 0;
        }

        if ( (!keywords) || (keywords === "null") ) {
            keywords = [];
        } else {
            keywords = keywords.split(",").map(item => item.trim());
        }

        Dataset
            .getLocationsById(id, page, keywords)
            .then(function(data) {

                resolve(data);

            }).catch(function(err) {
                console.error(err);
                return reject({ code: 500, msg: "Failed to get Dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.get('/:id/locations', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let page = req.params.page;
        let keywords = req.params.keywords;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        if (!page) {
            page = 0;
        }

        if ( (!keywords) || (keywords === "null") ) {
            keywords = "";
        }

        Dataset
            .getLocationsById(id)
            .then(function(data) {

                resolve(data);

            }).catch(function(err) {
                console.error(err);
                return reject({ code: 500, msg: "Failed to get Dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/schedule', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        Dataset
            .getByIdAndUserId(id, req.payload.id)
            .then(async function(data) {

                if (!data) {
                    return reject({ code: 404, msg: "Dataset is not found" });
                }

                await Dataset.queuedForNextScheduledWave(id).catch(function(e) { console.error("Failed to schedule dataset", e); return reject("Failed to schdule dataset") })

                return resolve();

            }).catch(function(err) {
                console.error(err);
                return reject({ code: 500, msg: "Failed to get Dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/published', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        Dataset
            .getByIdAndUserId(id, req.payload.id)
            .then(async function(data) {

                if (!data) {
                    return reject({ code: 404, msg: "Dataset is not found" });
                }

                await Dataset.publish(id).catch(function(e) { console.error("Failed to mark dataset as published", e); return reject("Failed to mark dataset as published") })

                await ActivityLog.log({
                    type: "DATASET",
                    action: "PUBLISH",
                    entityId: id,
                    userId: req.payload.id,
                })

                let requestId = data.requestId;

                if (requestId) {

                    let request = await Request.getById(requestId).catch(e => { console.error("Failed to get request", e) });

                    if (request) {

                        request.datasetId = id;
                        await Request.fulfill(request).catch(function(e) { console.error("Failed to mark request as fulfilled", e); return reject("Failed to mark request as fulfilled") })

                        let requestor = await User.getById(request.requestorId, "email, managed").catch(function(e) { console.error("Failed to get requestor", e); return reject("Failed to get requestor"); });
                        if (requestor && requestor.email) {

                            Email.send({
                                to: requestor.managed ? keys.adminEmail : requestor.email,
                                subject: "Your request has been fulfiled",
                                content: `
                                    Your request <strong>${request.name}</strong> has been fulfiled by <strong>${req.payload.username}</strong>
                                `,
                                actionButton: {
                                    title: "Open Dataset",
                                    link: keys.domainName + "dataset/" + request.datasetId
                                }
                            })

                        }

                    }

                }

                return resolve();

            }).catch(function(err) {
                console.error(err);
                return reject({ code: 500, msg: "Failed to get Dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/updated', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.params.id;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        let dataset = Dataset.getByIdAndUserId(id, req.payload.id).catch(e => { console.error("Failed to get dataset", e) });

        if (!dataset) {
            return reject({ code: 404, msg: "Dataset is not found" });
        }

        await ActivityLog.log({
            type: "DATASET",
            action: "LOCATION_UPDATE",
            entityId: id,
            userId: req.payload.id,
        })

        let datasetUpdate = new Dataset({
            locationupdatedat: new Date(),
            id: id,
            userId: req.payload.id,
        })

        await datasetUpdate.update().catch(e => { console.error("Failed to get dataset", e) });

        resolve();

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.delete('/:id', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;

        if ( (!id) || (!userId) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        await Dataset.delete(id, userId).catch(function(e) { console.error("Failed to mark dataset as deleted", e); return reject({ code: 500, msg: "Failed to delete dataset" }); })

        return resolve();

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.get('/:id', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        Dataset
            .getById(id, req.query.source)
            .then(async function(data) {

                if (!data) {
                    return reject({ code: 404, msg: "Dataset cannot be found" });
                }

                if (req.query.source !== "schemaeditor") {

                    delete data.repeatingValues;

                    let statFields = await Dataset.getStatFieldsById(id).catch(function(e) { console.error("Failed to get dataset stats", e) })

                    let cityIds = [];
                    let countryIds = [];
                    let cities = {};
                    let countries = {};
                    let points = 0;
                    let paths = 0;
                    let polygons = 0;
                    let features = {};
                    let categories = {};

                    for (let i = 0; i < statFields.length; i++) {

                        let row = statFields[i];

                        if (cityIds.indexOf(row.cityId) === -1) {

                            if (row.cityName && row.cityId) {
                                cityIds.push(row.cityId);
                                cities[row.cityId] = {
                                    name: row.cityName,
                                    count: 1
                                }
                            }

                        } else {
                            cities[row.cityId].count++;
                        }

                        if (countryIds.indexOf(row.countryId) === -1) {
                            if (row.countryId && row.countryName) {
                                countryIds.push(row.countryId);
                                countries[row.countryId] = {
                                    name: row.countryName,
                                    count: 1
                                }
                            }
                        } else {
                            countries[statFields[i].countryId].count++;
                        }

                        if (row.locationPoint) {
                            points++;
                        } else if (row.locationPath) {
                            paths++;
                        } else if (row.locationPolygon) {
                            polygons++;
                        }

                        if (row.categories && row.categories.length !== 0) {

                            for (let j = 0; j < row.categories.length; j++) {
                                let category = row.categories[j];
                                if (!categories[category]) {
                                    categories[category] = {
                                        count: 0
                                    }
                                }
                                categories[category].count++;
                            }

                        }

                        if (row.features && Object.keys(row.features).length !== 0) {

                            for (let key in row.features) {
                                if (!features[key]) {
                                    features[key] = {
                                        count: 0
                                    }
                                }
                                features[key].count++;
                            }

                        }

                    }

                    cities = Object.keys(cities).map(key => { obj = cities[key]; obj.id = key; return obj; })
                    cities.sort((a, b) => { return (a.count < b.count) ? 1 : -1 })
                    countries = Object.keys(countries).map(key => { obj = countries[key]; obj.id = key; return obj; })
                    countries.sort((a, b) => { return (a.count < b.count) ? 1 : -1 })

                    data.statistics = {
                        locations: statFields.length,
                        cities: cities,
                        countries: countries,
                        points: points,
                        paths: paths,
                        polygons: polygons,
                        categories: categories,
                        features: features
                    }

                    data.lastUpdated = statFields[0] ? statFields[0].updatedat : data.updatedat,

                    data.likes = await Like.get({
                        entityId: id,
                        entityType: "dataset",
                    }).catch(function(e) { console.error("Failed to get likes", e) })

                    data.shares = await Share.get({
                        entityId: id,
                        entityType: "dataset",
                    }).catch(function(e) { console.error("Failed to get shares", e) })

                    data.comments = await Comment.get({
                        entityId: id,
                        entityType: "dataset",
                    }).catch(function(e) { console.error("Failed to get comments", e) })

                    data.reports = await Report.get({
                        entityId: id,
                        entityType: "dataset",
                    }).catch(function(e) { console.error("Failed to get reports", e) })

                    data.ratings = await Rating.get({
                        entityId: id,
                        entityType: "dataset",
                    }).catch(function(e) { console.error("Failed to get ratings", e) })

                    data.owner = await User.getById(data.userId, "id, username, picture").catch(function(e) { console.error("Failed to get owner", e) })

                    if (req.payload && req.payload.id) {
                        let subscribed = await Subscription.getByTypeEntityUser("DATASET_UPDATE", id, req.payload.id);
                        if (subscribed) {
                            data.userSubscribed = true
                        }
                    }

                }

                resolve(data);

            }).catch(function(err) {
                console.error(err);
                return reject({ code: 500, msg: "Failed to get Dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/fields', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let newFields = req.body;

        if ( (!id) || (!userId) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        if (!newFields) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let newMappedProperties = Dataset.getMappedFields(newFields);
                let oldMappedProperties = Dataset.getMappedFields(dataset.fields);

                if (!newMappedProperties.name) {
                    return reject({ code: 400, msg: "You have to chose at least one field containing the name of the entity" });
                }

                if ( (dataset.type === "external") && (!newMappedProperties.uniqueId) ) {
                    return reject({ code: 400, msg: "You have to chose at least one field containing the unique id of the entity" });
                }

                let file;

                if (dataset.pathToFile) {
                    file = await FileParser.parse(dataset.savedName, dataset.format, dataset.pathToItems)
                }


                if (!dataset.pathToFile) {

                    // Cannot know if lat longs are ok because empty...

                } else if (["shape", "geojson", "kml", "kmz"].indexOf(dataset.format) === -1) {

                    // Check whether enough location data is supplied, if used geospatial fieltypes than we assume the location is given

                    let enoughLocationInfo = false;
                    // let needsGeocoding = false;

                    let latitudeField = newMappedProperties["latitude"];
                    let longitudeField = newMappedProperties["longitude"];

                    if ( ( (latitudeField) && (!longitudeField) ) || ( (!latitudeField) && (longitudeField) ) ) {
                        // Only latitude or only latitude field is entered
                        return reject({ code: 400, msg: "You need to specify both the latitudes and longitudes or leave them empty. If the latitude and longitude is contained in the same field then select that field for both the latitude and longitude field" })
                    } else if (latitudeField && longitudeField) {
                        // Both supplied

                        latitudeField = latitudeField[0];
                        longitudeField = longitudeField[0];

                        if (latitudeField === longitudeField) {

                            // Check one field containing lat long
                            let latLong = file.content[0][latitudeField];
                            let match = latLong.match(/[+-]?([0-9]*[.])?[0-9]+[,][+-]?([0-9]*[.])?[0-9]+/g);

                            if (!match) {
                                match = latLong.match(/[+-]?([0-9]*[.])?[0-9]+[ ][+-]?([0-9]*[.])?[0-9]+/g);
                            }

                            if (!match) {
                                match = latLong.match(/[+-]?([0-9]*[.])?[0-9][;][+-]?([0-9]*[.])?[0-9]+/g);
                            }

                            if (!match) {
                                return reject({ code: 400, msg: "Latitude and longitude values are not detected in the given field" })
                            }

                        } else {

                            // TODO check all or cap a maximum error rate?
                            let firstRow = file.content[0];

                            if (!Utilities.isLatitude(FileParser.resolveNestedObjectField(firstRow, latitudeField))) {
                                return reject({ code: 400, msg: "The first entity of your dataset doesn't contain a valid latitude value" })
                            }

                            if (!Utilities.isLongitude(FileParser.resolveNestedObjectField(firstRow, longitudeField))) {
                                return reject({ code: 400, msg: "The first entity of your dataset doesn't contain a valid longitude value" })
                            }

                        }

                        enoughLocationInfo = true;

                    }

                    let streetHouseFields = newMappedProperties["street"];
                    let cityField = newMappedProperties["city"] ? newMappedProperties["city"][0] : null;
                    let defaultCity = newFields["___DEFAULT_CITY___"]
                    let countryField = newMappedProperties["country"] ? newMappedProperties["country"][0] : null;
                    let defaultCountry = newFields["___DEFAULT_COUNTRY___"]

                    if (
                        streetHouseFields &&
                        ( cityField || defaultCity ) &&
                        ( countryField || defaultCountry )
                    ) {
                        enoughLocationInfo = true;
                    }

                    if (!enoughLocationInfo) {
                        return reject({ code: 400, msg: "The provided location information is not sufficient." });
                    }

                } else {

                    // TODO validate that kml and other files have corrent geo info

                }

                let datesetUpdate = new Dataset({
                    id: id,
                    userId: userId,
                    fields: newFields,
                })

                datesetUpdate
                    .update()
                    .then(function(data) {

                        resolve("Details updated");

                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

                // resolve("Fields updated");

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/geocoding', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;

        if ( (!id) || (!userId) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let datesetUpdate = new Dataset({
                    id: id,
                    userId: userId,
                    noGeocode: req.body.noGeocode,
                    noReverseGeocode: req.body.noReverseGeocode,
                    acceptNoAddress: req.body.acceptNoAddress
                })

                datesetUpdate
                    .update()
                    .then(function(data) {
                        resolve("Geocoding options updated");
                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/details', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let details = req.body;

        if ( (!id) || (!userId) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        if (!details) {
            return reject({ code: 400, msg: "Missing details" });
        }

        if (!details.name) {
            return reject({ code: 400, msg: "Name is required" });
        }

        if (!details.description) {
            return reject({ code: 400, msg: "Description is required" });
        }

        if (!details.licenceId) {
            return reject({ code: 400, msg: "Licence type if required" });
        }

        if (!details.updateFrequency) {
            details.updateFrequency = "manually"
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let datesetUpdate = new Dataset({
                    id: id,
                    userId: userId,
                    description: details.description,
                    name: details.name,
                    topicId: details.topicId,
                    licenceId: details.licenceId,
                    updateFrequency: details.updateFrequency,
                    maintainerEmail: details.maintainerEmail,
                    maintainerName: details.maintainerName,
                })

                datesetUpdate
                    .update()
                    .then(function(data) {
                        resolve("Details updated");
                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/request', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let requestId = req.body.id;

        if ( (!id) || (!userId) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        if (!requestId) {
            return reject({ code: 400, msg: "Missing request id" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let datesetUpdate = new Dataset({
                    id: id,
                    requestId: requestId,
                    userId: userId,
                })

                datesetUpdate
                    .update()
                    .then(function(data) {
                        resolve("Request added");
                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/categories', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let categories = req.body;

        if ( (!id) || (!userId) || (!categories) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                if ( (!categories || !categories.default || categories.default.length === 0) && (dataset.pathToFile) ) {
                    return reject({ code: 400, msg: "Default category is needed" });
                }

                let datesetUpdate = new Dataset({
                    id: id,
                    userId: userId,
                    categories: categories || { default: [] },
                })

                datesetUpdate
                    .updateCategories()
                    .then(function(data) {
                        resolve("Categories updated");
                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/polygons', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let polygons = req.body;

        if ( (!id) || (!userId) || (!polygons) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let datesetUpdate = new Dataset({
                    id: id,
                    userId: userId,
                    polygons: polygons,
                })

                datesetUpdate
                    .update()
                    .then(function(data) {
                        resolve("Polygons updated");
                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/sources', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let sources = req.body;

        if ( (!id) || (!userId) || (!sources) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let datesetUpdate = new Dataset({
                    id: id,
                    userId: userId,
                    sources: sources,
                })

                datesetUpdate
                    .update()
                    .then(function(data) {
                        resolve("Sources updated");
                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/paths', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let paths = req.body;

        if ( (!id) || (!userId) || (!paths) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let datesetUpdate = new Dataset({
                    id: id,
                    userId: userId,
                    paths: paths,
                })

                datesetUpdate
                    .update()
                    .then(function(data) {
                        resolve("Paths updated");
                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/markers', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let markers = req.body;

        if ( (!id) || (!userId) || (!markers) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let datesetUpdate = new Dataset({
                    id: id,
                    userId: userId,
                    markers: markers,
                })

                datesetUpdate
                    .update()
                    .then(function(data) {
                        resolve("Markers updated");
                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id/features', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let features = req.body;

        if ( (!id) || (!userId) || (!features) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let datesetUpdate = new Dataset({
                    id: id,
                    userId: userId,
                    features: features,
                })

                datesetUpdate
                    .updateFeatures()
                    .then(function(data) {
                        resolve("features updated");
                    }).catch(function(err) {
                        console.error(err);
                        return reject({ code: 500, msg: "Failed to get Dataset" });
                    })

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

// At saving markers set to status = Confirm processing

router.put('/:id/parse', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let fetchLatestFromUrl = req.body.fetchLatestFromUrl;

        if ( (!id) || (!userId) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid fields" });
        }

        Dataset
            .getByIdAndUserId(id, userId)
            .then(async function(dataset) {

                let fieldMappings = Dataset.getMappedFields(dataset.fields);

                if ( (!fieldMappings.name) || (fieldMappings.name.length === 0) ) {
                    return reject({ code: 400, msg: "Field mapping is not completed" });
                }

                if (!dataset.name) {
                    return reject({ code: 400, msg: "Dataset details are not completed" });
                }

                if ( (dataset.savedName) && ( (!dataset.categories) || (!dataset.categories.default) || (dataset.categories.default.length === 0) ) ) {
                    return reject({ code: 400, msg: "Default category is needed" });
                }

                if (fetchLatestFromUrl && dataset.sourceURL) {

                    let extension = dataset.sourceURL.split(".");
                    extension = extension[extension.length-1];

                    if (extension && extension.toLowerCase() === "json") {
                        extension = "txt"
                    }

                    const axios = require('axios');

                    let file = await axios.get(dataset.sourceURL);

                    if (!file.data) {
                        return reject({ code: 400, msg: "Empty file" });
                    }

                    let fileOutname = crypto.randomBytes(16).toString("hex");
                    fileOutname = fileOutname + (extension ? "." + extension : "");

                    let dataToWrite = file.data;

                    if (extension.toLowerCase() === "json" || extension.toLowerCase() === "txt" || extension.toLowerCase() === "geojson") {
                        dataToWrite = JSON.stringify(dataToWrite);
                    }

                    if (extension.toLowerCase() === "kmz") {
                        await axios({ method: "get", url: dataset.sourceURL, responseType: "stream" }).then(function (response) { return new Promise(async function(resolve, reject) { await response.data.pipe(fs.createWriteStream("./uploads/datasets/fix-" + fileOutname)); resolve(); }) })
                    }

                    try {
                        fs.writeFileSync("./uploads/datasets/" + fileOutname, dataToWrite)
                    } catch (e) {
                        console.error("Failed to write file", e)
                        return reject({ code: 400, msg: "Failed to write file" });
                    }

                    let datesetUpdate = new Dataset({
                        id: dataset.id,
                        userId: dataset.userId,
                        savedName: fileOutname,
                        pathToFile: fileOutname,
                    })

                    let res = datesetUpdate.update().catch(function(err) { console.error("Failed to update saved name", err); })

                    if (!res) {
                        return reject({ code: 500, msg: "Failed to update Dataset." });
                    }

                    res = Dataset.hardDeleteLocation(dataset.id, dataset.userId).catch(function(err) { console.error("Failed to remove locations", err); })

                    if (!res) {
                        return reject({ code: 500, msg: "Failed to delete locations." });
                    }

                }

                // return reject({ code: 500, msg: "OK" });

                let res = await Dataset.queueForParsing(id).catch(function(e) { console.error("Failed to queue dataset"); });

                if (!res) {
                    return reject({ code: 500, msg: "Failed to queue dataset" });
                }

                return resolve("Dataset has been queued for processing, you will receive an email once this is completed.");

            }).catch(function(err) {
                console.error(err)
                return reject({ code: 500, msg: "Failed to get dataset" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

module.exports = router;
