const router = require('express').Router();
const auth = require('./Auth');
const Subscription = require('../models/Subscription');
const Utilities = require('../Utilities')
const keys = require('../config/Keys');

router.put('/:type/:entityId', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        Subscription.insert(req.params.type, req.payload.id, req.params.entityId).then(results => {
            resolve();
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

router.delete('/:type/:entityId', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        Subscription.delete(req.params.type, req.payload.id, req.params.entityId).then(results => {
            resolve();
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

module.exports = router;
