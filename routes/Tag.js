const router = require('express').Router();
const Tag = require('../models/Tag');

router.get('/', (req, res, next) => {

    return new Promise(function(resolve, reject) {

        Tag.get().then(results => {
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

router.get('/city/:id', (req, res, next) => {

    return new Promise(function(resolve, reject) {
        Tag.getByCityId(req.params.id).then(results => { resolve(results); }).catch(e => {
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

router.get('/country/:id', (req, res, next) => {

    return new Promise(function(resolve, reject) {
        Tag.getByCountryId(req.params.id).then(results => { resolve(results); }).catch(e => {
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

router.get('/everywhere', (req, res, next) => {

    return new Promise(function(resolve, reject) {
        Tag.getTopCategories().then(results => { resolve(results); }).catch(e => {
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
