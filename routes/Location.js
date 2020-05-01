const router = require('express').Router();
const auth = require('./Auth');
const Location = require('../models/Location');
const Like = require('../models/Like');
const User = require('../models/User');
const Dataset = require('../models/Dataset');
const Comment = require('../models/Comment');
const Share = require('../models/Share');
const Rating = require('../models/Rating');
const Report = require('../models/Report');
const Social = require('../models/Social');
const Utilities = require('../Utilities')
const keys = require('../config/Keys');

router.get('/', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let keywords = [];
        let location = null;

        if (req.query.location) {
            location = JSON.parse(req.query.location)
        }

        if (req.query.keywords) {
            keywords = req.query.keywords.split(",").map(item => item.trim());
        } else {
            return reject({ code: 400, msg: "Missing keywords" });
        }

        Location.search({
            keywords: keywords,
            location: location,
            source: req.query.source
        }).then(results => {
            if (results) {
                // Reducing response size
                for (let i = 0; i < results.length; i++) {
                    if (results[i].email) { results[i].email = true } else { delete results[i].email }
                    if (results[i].website) { results[i].website = true } else { delete results[i].website }
                    if (results[i].tel) { results[i].tel = true } else { delete results[i].tel }
                    if (!results[i].marker) { delete results[i].marker }
                    if (!results[i].path) { delete results[i].path }
                    if (!results[i].polygon) { delete results[i].polygon }
                    if (!results[i].locationPath) { delete results[i].locationPath }
                    if (!results[i].locationPolygon) { delete results[i].locationPolygon }
                    if (!results[i].locationPoint) { delete results[i].locationPoint }
                }
            }
            resolve(results);
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

})

router.delete('/:id', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        Location
            .getById(id)
            .then(async function(data) {

                if (!data) {
                    return reject({ code: 404, msg: "Dataset cannot be found" });
                }

                if (data.userId !== req.payload.id) {
                    return reject({ code: 403, msg: "Forbidden" });
                }

                await Location.markDeleted(id, req.payload.id).catch(function(e) { console.error("Failed to delete lcoation", e); return reject({ code: 500, msg: "Failed to delete location" }); })

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

router.get('/:id', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        Location
            .getById(id)
            .then(async function(data) {

                if (!data) {
                    return reject({ code: 404, msg: "Location cannot be found" });
                }

                data.likes = await Like.get({entityId: id, entityType: "location" }).catch(function(e) { console.error("Failed to get likes", e) })
                data.shares = await Share.get({ entityId: id, entityType: "location" }).catch(function(e) { console.error("Failed to get shares", e) })
                data.comments = await Comment.get({ entityId: id, entityType: "location" }).catch(function(e) { console.error("Failed to get comments", e) })
                data.reports = await Report.get({ entityId: id, entityType: "location" }).catch(function(e) { console.error("Failed to get reports", e) })
                data.ratings = await Rating.get({ entityId: id, entityType: "location" }).catch(function(e) { console.error("Failed to get ratings", e) })
                data.owner = await User.getById(data.userId, "id, username, picture").catch(function(e) { console.error("Failed to get owner", e) })
                data.dataset = await Dataset.getByIdAndUserId(data.datasetId, data.userId).catch(function(e) { console.error("Failed to get dataset", e) })

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

        let locations = await Location.getByEntityId(entity === "organization" ? "user" : entity, id, page, keywords, req.payload ? parseInt(req.payload.id) === parseInt(id) : false).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get locations" }); })

        let locationActions = [];

        // if (locations && locations.length !== 0) {
        //     locationActions = await Social.getStats("location", locations.map(item => item.id)).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get location stats" }); })
        //     if (locationActions && locationActions.length !== 0) {
        //         locations = Social.mergeEntitiesWithStats(locations, locationActions)
        //     }
        //     return resolve(locations);
        // } else {
            return resolve(locations)
        // }

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.post('/', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let location = req.body;

        let dataset;
        let fieldMappings;

        if (location.dataset) {

            dataset = await Dataset.getByIdAndUserId(location.dataset.id, req.payload.id).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get Location" }); })

            if (!dataset) {
                return reject({ code: 404, msg: "Location cannot be found" });
            }

            if (dataset.userId !== req.payload.id) {
                return reject({ code: 403, msg: "Forbidden" });
            }

            fieldMappings = Dataset.getMappedFields(location.dataset.fields);

        }

        let newLocation = await Location.compileLocationObject(location.originalFields, location.dataset, fieldMappings, req.payload.id, location.dataset ? location.dataset.id : null, null, location.isApproved, null, true, location);

        if (newLocation.error) {
            return reject({ code: 400, msg: newLocation.error });
        }

        newLocation.userId = req.payload.id;

        if (dataset) {
            newLocation.datasetDefaultOverrides = location.datasetDefaultOverrides;
            newLocation.originalFields = location.originalFields;
        }

        let newLocationObj = new Location(newLocation);
        let categories = newLocation.categories || [];
        let newLocationId = await newLocationObj.create().catch(e => {
            console.error(e);
            return reject({ code: 500 });
        })

        resolve(newLocationId);

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:id', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;
        let location = req.body;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        Location
            .getById(id)
            .then(async function(data) {

                if (!data) {
                    return reject({ code: 404, msg: "Location cannot be found" });
                }

                if (data.userId !== req.payload.id) {
                    return reject({ code: 403, msg: "Forbidden" });
                }

                let fieldMappings;

                if (location.dataset) {
                    fieldMappings = Dataset.getMappedFields(location.dataset.fields);
                }

                let locationUpdate = await Location.compileLocationObject(location.originalFields, location.dataset, fieldMappings, req.payload.id, location.dataset ? location.dataset.id : null, null, location.isApproved, null, true, location);

                if (locationUpdate.error) {
                    return reject({ code: 400, msg: locationUpdate.error });
                }

                locationUpdate.id = id;
                locationUpdate.userId = req.payload.id;

                if (location.dataset) {
                    locationUpdate.datasetDefaultOverrides = location.datasetDefaultOverrides;
                    locationUpdate.originalFields = location.originalFields;
                }
                let locationUpdateObj = new Location(locationUpdate);
                let categories = locationUpdate.categories || [];
                let newLocationId = await locationUpdateObj.update().catch(e => {
                    console.error(e);
                    return reject({ code: 500 });
                })

                resolve();

            }).catch(function(err) {
                console.error(err);
                return reject({ code: 500, msg: "Failed to get Location" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

module.exports = router;
