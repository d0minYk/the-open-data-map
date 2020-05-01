const router = require('express').Router();
const auth = require('./Auth');
const FavoriteLocation = require('../models/FavoriteLocation');

router.get('/', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        FavoriteLocation
            .getByUserId(req.payload.id)
            .then(function(data) { resolve(data); })
            .catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get places" }); })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.post('/:id', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let existing = await FavoriteLocation.getByUserIdAndLocationId(req.payload.id, req.params.id).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get place" }); })

        if (existing && existing.length > 0) { } else {
            FavoriteLocation.post(req.payload.id, req.params.id).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to post place" }); })
        }

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
        await FavoriteLocation.deleteByUserIdAndLocationId(req.payload.id, req.params.id).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to delete location" }); })
        resolve();
    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

module.exports = router;
