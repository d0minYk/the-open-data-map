const router = require('express').Router();
const auth = require('./Auth');
const Location = require('../models/Location');
const Dataset = require('../models/Dataset');
const Utilities = require('../Utilities')
const { Client } = require('pg');
const Keys = require('../config/Keys');

router.get('/', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        const client = new Client(Keys.postgres);
        client.connect();

        let urls = [
            "legal",
            "statistics",
            "search",
            "faq",
            "statistics",
            "contact-us",
            "credits",
            "search/guidee",
            "about",
            "map",
            "splash",
            "login"
        ]

        // Datasets
        let datasets = await client.query(`SELECT id FROM datasets WHERE ("isDeleted" IS NULL OR "isDeleted" = false) AND "isPublished" = true`, []).catch(e => { console.error("Failed to locations ", e) })
        if (datasets && datasets.rows) {
            datasets.rows.map(item => { urls.push("dataset/" + item.id) });
        }

        // Org profiles
        let orgs = await client.query(`SELECT id FROM users where type='org'`, []).catch(e => { console.error("Failed to locations ", e) })
        if (orgs && orgs.rows) {
            orgs.rows.map(item => { urls.push("profile/" + item.id) });
        }

        // Directoryies with loctions
        let cities = await client.query(`SELECT id FROM cities WHERE "locationCount" <> 0`, []).catch(e => { console.error("Failed to locations ", e) })
        if (cities && cities.rows) {
            cities.rows.map(item => { urls.push("directory/city/" + item.id) });
        }

        let countries = await client.query(`SELECT id FROM countries WHERE "locationCount" <> 0`, []).catch(e => { console.error("Failed to locations ", e) })
        if (countries && countries.rows) {
            countries.rows.map(item => { urls.push("directory/country/" + item.id) });
        }

        // Locations
        let locations = await client.query(`SELECT id FROM locations WHERE ("isDeleted" IS NULL OR "isDeleted" = false) AND "isApproved" = true`, []).catch(e => { console.error("Failed to locations ", e) })
        if (locations && locations.rows) {
            locations.rows.map(item => { urls.push("location/" + item.id) });
        }

        client.end();

        res.setHeader('content-type', 'text/plain');
        res.send(urls.map(item => Keys.domainName + item).join("\n"))

    }).then(function(data) {
        res.send(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
