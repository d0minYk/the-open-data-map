const router = require('express').Router();
const auth = require('./Auth');
const RequestAutoAssign = require('../models/RequestAutoAssign');
const crypto = require('crypto');
const Utilities = require('../Utilities')
const keys = require('../config/Keys');

router.delete('/:id', auth.required, (req, res, next) => {

    let id = req.params.id;
    let userId = req.payload.id;

    return new Promise(async function(resolve, reject) {

        await RequestAutoAssign.delete(id, userId).catch(e => { console.error("Failed to delete", e) })
        resolve("Deleted");

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.post('/:cityId', auth.required, (req, res, next) => {

    let cityId = req.params.cityId;
    let userId = req.payload.id;

    return new Promise(async function(resolve, reject) {

        if (req.payload.type !== "org") {
            return reject({ code: 403, msg: "Forbidden" });
        }

        let existing = await RequestAutoAssign.getByCityId(cityId);

        if (existing && existing.length !== 0) {
            return reject({ code: 400, msg: "This city is already chosen by someone else" });
        }

        let id = await RequestAutoAssign.assign(userId, cityId).catch(e => { console.error("Failed to add city", e) });

        if (!id) {
            return reject({ code: 500, msg: "Failed to add city" });
        }

        return resolve(id);

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
