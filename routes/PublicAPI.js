const router = require('express').Router();
const auth = require('./Auth');
const Location = require('../models/Location');
const Dataset = require('../models/Dataset');
const Utilities = require('../Utilities')
const keys = require('../config/Keys');

router.get('/:entity', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let fields = req.query.fields || "all";
        let query = req.query.query;
        let limit = req.query.limit || 10000000;
        let start = req.query.start || 0;
        let entity = req.params.entity;
        let preserveFields = req.query.preservefields ? true : false;

        if ( (!start) || (isNaN(parseInt(start))) ) {
            start = 0;
        }

        if ( (!limit) || (isNaN(parseInt(limit))) ) {
            limit = 10000000;
        }

        if (!entity) {
            return reject({ code: 400, msg: "Entity not defined, possible entities: location, dataset" });
        }

        if (["dataset", "location"].indexOf(entity) === -1) {
            return reject({ code: 400, msg: "Unknown entity " + entity });
        }

        if ( (!query) && (entity === "location") ) {
            return reject({ code: 400, msg: "Query paramterer is required" });
        }

        let result;

        if (entity === "location") {

            result = await Location.apiSearch(fields, query, start, limit, preserveFields).catch(function(e) {
                console.error("Failed to get locations", e);
                return reject({ code: 500, msg: e });
            });

        } else {

            result = await Dataset.apiSearch(fields, query, start, limit, preserveFields).catch(function(e) {
                console.error("Failed to get datasets", e);
                return reject({ code: 500, msg: e });
            });

        }

        if ( (!result) || (!result.data) ) {
            return reject({ code: 500, msg: "Failed to get locations" });
        }

        return resolve({
            total: result.total,
            start: start,
            limit: limit,
            data: result.data,
        })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
