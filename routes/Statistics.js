const router = require('express').Router();
const auth = require('./Auth');
const Keys = require('../config/Keys.js');
const Statistics = require('../models/Statistics.js');
const Utilities = require('../Utilities.js');
const { Client } = require('pg');

router.get('/', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let stats = await Statistics.get().catch(e => { console.error("Failed to get stats", e) });
        let formatted = {};

        for (let key in stats) {
            let stat = stats[key];
            formatted[stat.key] = stat.value
        }

        resolve(formatted);

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.get('/leaderboards', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        const client = new Client(Keys.postgres);
        client.connect();

        let leaderboards = {
            cities: [],
            countries: [],
            users: [],
            organizations: [],
            tags: [],
            features: [],
        }

        let users = await client.query(`SELECT id, points, username, users.picture as "userPhoto" FROM USERS WHERE type='user' AND points > 0 ORDER BY points DESC LIMIT 15`, []).catch(e => { console.error("Failed to get like count ", e) })
        leaderboards.users = users && users.rows ? users.rows: [];
        leaderboards.users.map(item => {
            item.points = Utilities.nFormatter(item.points, 1);
            return item;
        })

        let organizations = await client.query(`SELECT id, points, username, users.picture as "userPhoto" FROM USERS WHERE type='org' AND points > 0 ORDER BY points DESC LIMIT 15`, []).catch(e => { console.error("Failed to get like count ", e) })
        leaderboards.organizations = organizations && organizations.rows ? organizations.rows: [];
        leaderboards.organizations.map(item => {
            item.points = Utilities.nFormatter(item.points, 1);
            return item;
        })

        let cities = await client.query(`
            SELECT cities.id as "cityId", cities.name as "cityName", countries.id as "countryId", countries.name as "countryName", SUM("activityLog"."pointsEarnt") as "totalPoints"
            FROM "activityLog"
            INNER JOIN "cities"
            ON "activityLog"."entityCityId" = cities.id
            INNER JOIN "countries"
            ON cities."countryId" = countries.id
            GROUP BY 1, 2, 3, "entityCityId"
            ORDER BY "totalPoints" DESC
            LIMIT 15
        `, []).catch(e => { console.error("Failed to get like count ", e) })
        leaderboards.cities = cities && cities.rows ? cities.rows: [];

        let countries = await client.query(`
            SELECT countries.id as "countryId", countries.name as "countryName", SUM("activityLog"."pointsEarnt") as "totalPoints"
            FROM "activityLog"
            INNER JOIN "countries"
            ON "activityLog"."entityCountryId" = countries.id
            GROUP BY 1, 2, "entityCountryId"
            ORDER BY "totalPoints" DESC
            LIMIT 15
        `, []).catch(e => { console.error("Failed to get like count ", e) })
        leaderboards.countries = countries && countries.rows ? countries.rows: [];

        let tags = await client.query(`
            SELECT type, name, SUM(count) as "totalCount"
            FROM tags
            GROUP BY name, type
            ORDER BY "totalCount" DESC
        `, []).catch(e => { console.error("Failed to get like count ", e) })

        if (tags && tags.rows) {
            leaderboards.features = tags.rows.filter(item => item.type === "feature");
            leaderboards.categories = tags.rows.filter(item => item.type === "category");
        }

        client.end();

        resolve(leaderboards);

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
