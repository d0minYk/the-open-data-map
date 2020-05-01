const router = require('express').Router();
const auth = require('./Auth');
const Licence = require('../models/Licence');
const crypto = require('crypto');
const Utilities = require('../Utilities')
const keys = require('../config/Keys');

router.get('/', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        Licence.get().then(results => {
            resolve(results);
        }).catch(e => {
            console.error("Failed to get licences", e);
            reject("Failed to get licences");
        })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
