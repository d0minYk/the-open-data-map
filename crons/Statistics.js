const cron = require('node-cron');
const Keys = require('../config/Keys.js');
const Statistics = require('../models/Statistics.js');
const { Client } = require('pg');

// Cron running every 4 hours
cron.schedule('1 */4 * * *', () => {
    setTimeout(async function() {

        // Only running on prod
        if (process.env.ENV !== "PROD") {
            return;
        }

        console.log("CRON = compiling statistics")

        const client = new Client(Keys.postgres);
        client.connect();

        let featuresOfCategories = {}

        // Getting all cities' location count
        let locationFeaturesCategories = await client
            .query(
                `
                SELECT "cityId", "countryId", "features", "categories"
                FROM locations
                WHERE "isApproved" = true AND "error" IS NULL AND ("isDeleted" IS NULL OR "isDeleted" <> true)
                `, []
            ).catch(e => { console.error("Failed to get cityLocationCount", e) })

        if (!locationFeaturesCategories) {
            return;
        }

        locationFeaturesCategories = locationFeaturesCategories.rows;

        let cities = {};

        // Enumerating all categories and features across all cities and countries
        for (let i = 0; i < locationFeaturesCategories.length; i++) {

            let row = locationFeaturesCategories[i];

            if (!cities[row.cityId]) cities[row.cityId] = {
                features: {},
                categories: {},
                countryId: row.countryId
            };

            if (row.categories) {

                for (let j = 0; j < row.categories.length; j++) {
                    let category = row.categories[j].toLowerCase();
                    if (!cities[row.cityId].categories[category])
                        cities[row.cityId].categories[category] = 0;
                    cities[row.cityId].categories[category]++
                }

            }

            if (row.features) {

                for (let key in row.features) {
                    let feature = key.toLowerCase();
                    if (!cities[row.cityId].features[feature])
                        cities[row.cityId].features[feature] = 0;
                    cities[row.cityId].features[feature]++

                    for (let j = 0; j < row.categories.length; j++) {
                        let categoryName = row.categories[j];
                        if (!featuresOfCategories[categoryName])
                            featuresOfCategories[categoryName] = [];
                        if (featuresOfCategories[categoryName].indexOf(feature) === -1)
                            featuresOfCategories[categoryName].push(feature);
                    }

                }

            }

        }

        // Removing all tags
        await client.query(`DELETE FROM tags`).catch(e => { console.error("Failed to delete tags", e) })

        // Repopulating the database with the newly compiled category and feature counts across cities and countries
        for (let cityId in cities) {

            let city = cities[cityId]

            let countryId = city.countryId;
            let features = city.features;
            let categories = city.categories;

            if (features) {
                for (let featureName in features) {
                    let count = features[featureName];
                    if (cityId === null || cityId === "null")
                        cityId = 1
                    if (cityId && countryId && count && cityId !== "null")
                        await client.query(`INSERT INTO tags (name, "cityId", "countryId", type, count) VALUES ($1, $2, $3, $4, $5)`, [featureName, cityId, countryId, "feature", count || 0]).catch(e => { console.error("Failed to add feature", e) })
                }
            }

            if (categories) {
                for (let categoryName in categories) {
                    let count = categories[categoryName];
                    let featuresUsed = featuresOfCategories[categoryName];
                    if (cityId === null || cityId === "null")
                        cityId = 1
                    if (cityId && countryId && count && cityId !== "null") {
                        if (featuresUsed) {
                            await client.query(`INSERT INTO tags (name, "cityId", "countryId", type, count, features) VALUES ($1, $2, $3, $4, $5, $6)`, [categoryName, cityId, countryId, "category", count, featuresUsed]).catch(e => { console.error("Failed to add category", e) })
                        } else {
                            await client.query(`INSERT INTO tags (name, "cityId", "countryId", type, count) VALUES ($1, $2, $3, $4, $5)`, [categoryName, cityId, countryId, "category", count]).catch(e => { console.error("Failed to add category", e) })
                        }
                    }
                }
            }

        }

        // Getting all cities' location count
        let cityLocationCount = await client
            .query(
                `
                SELECT cities.id as "cityId", count(locations.id) as "locationCount"
                FROM cities
                INNER JOIN locations
                ON cities.id = locations."cityId"
                WHERE "isApproved" = true AND "error" IS NULL AND ("isDeleted" IS NULL OR "isDeleted" <> true)
                GROUP BY cities.id
                ORDER BY "locationCount" DESC
                `, []
            ).catch(e => { console.error("Failed to get cityLocationCount", e) })

        if (!cityLocationCount) {
            return;
        } else {
            cityLocationCount = cityLocationCount.rows
        }

        // Getting all countries' location count
        let countryLocationCount = await client
            .query(
                `
                SELECT countries.id as "countryId", count(locations.id) as "locationCount"
                FROM countries
                INNER JOIN locations
                ON countries.id = locations."countryId"
                WHERE "isApproved" = true AND "error" IS NULL AND ("isDeleted" IS NULL OR "isDeleted" <> true)
                GROUP BY countries.id
                ORDER BY "locationCount" DESC
                `, []
            ).catch(e => { console.error("Failed to get countryLocationCount", e) })

        if (!countryLocationCount) {
            return;
        } else {
            countryLocationCount = countryLocationCount.rows
        }

        // Reseting city ranks and locations
        let cityRankAndCountReset = await client
            .query(
                `
                UPDATE cities
                SET
                     rank = 0,
                    "locationCount" = 0
                `, []
            ).catch(e => { console.error("Failed to reset city stats ", e) })

        // Reseting country ranks and locations
        let countryRankAndCountReset = await client
            .query(
                `
                UPDATE countries
                SET
                     rank = 0,
                    "locationCount" = 0
                `, []
            ).catch(e => { console.error("Failed to reset country stats ", e) })

        // Updating new city ranks and locationCounts
        for (let i = 0; i < cityLocationCount.length; i++) {
            let city = cityLocationCount[i];
            let update = await client
                .query(
                    `
                    UPDATE cities
                    SET
                        rank = $2,
                        "locationCount" = $3
                    WHERE id = $1
                    `, [city.cityId, i+1, parseInt(city.locationCount)]
                ).catch(e => { console.error("Failed to update city", e) })
        }

        // Updating new country ranks and locationCounts
        for (let i = 0; i < countryLocationCount.length; i++) {
            let country = countryLocationCount[i];
            let update = await client
                .query(
                    `
                    UPDATE countries
                    SET
                        rank = $2,
                        "locationCount" = $3
                    WHERE id = $1
                    `, [country.countryId, i+1, parseInt(country.locationCount)]
                ).catch(e => { console.error("Failed to update country", e) })
        }

        let userCount = await client.query(`SELECT count(id) FROM users WHERE type='user'`, []).catch(e => { console.error("Failed to get user count ", e) })
        await Statistics.update("users", userCount ? userCount.rows[0].count : 0)

        let organizationCount = await client.query(`SELECT count(id) FROM users WHERE type='org'`, []).catch(e => { console.error("Failed to get user count ", e) })
        await Statistics.update("organizations", organizationCount ? organizationCount.rows[0].count : 0)

        let tagCount = await client.query(`SELECT COUNT(DISTINCT "name") FROM tags GROUP BY type ORDER BY type ASC`, []).catch(e => { console.error("Failed to get location count ", e) })
        await Statistics.update("categories", (tagCount && tagCount.rows && tagCount.rows[0]) ? tagCount.rows[0].count : 0)
        await Statistics.update("features", (tagCount && tagCount.rows && tagCount.rows[1]) ? tagCount.rows[1].count : 0)

        let locationCount = await client.query(`SELECT COUNT(id) as "locations", COUNT(DISTINCT "cityId") as "cities", COUNT(DISTINCT "countryId") as "countries" FROM locations WHERE "isApproved" = true AND "error" IS NULL AND ("isDeleted" IS NULL OR "isDeleted" <> true)`, []).catch(e => { console.error("Failed to get location count ", e) })
        await Statistics.update("locations", (locationCount && locationCount.rows && locationCount.rows[0]) ? locationCount.rows[0].locations : 0)
        await Statistics.update("cities", (locationCount && locationCount.rows && locationCount.rows[0]) ? locationCount.rows[0].cities : 0)
        await Statistics.update("countries", (locationCount && locationCount.rows && locationCount.rows[0]) ? locationCount.rows[0].countries : 0)

        let datasetCount = await client.query(`SELECT count(id) FROM datasets`, []).catch(e => { console.error("Failed to get dataset count ", e) })
        await Statistics.update("datasets", datasetCount ? datasetCount.rows[0].count : 0)

        let likeCount = await client.query(`SELECT count(id) FROM likes`, []).catch(e => { console.error("Failed to get like count ", e) })
        await Statistics.update("likes", likeCount ? likeCount.rows[0].count : 0)

        let commentCount = await client.query(`SELECT count(id) FROM comments`, []).catch(e => { console.error("Failed to get comment count ", e) })
        await Statistics.update("comments", commentCount ? commentCount.rows[0].count : 0)

        let ratingCount = await client.query(`SELECT count(id) FROM ratings`, []).catch(e => { console.error("Failed to get rating count ", e) })
        await Statistics.update("ratings", ratingCount ? ratingCount.rows[0].count : 0)

        let reportCount = await client.query(`SELECT count(id) FROM reports`, []).catch(e => { console.error("Failed to get report count ", e) })
        await Statistics.update("reports", reportCount ? reportCount.rows[0].count : 0)

        let shareCount = await client.query(`SELECT count(id) FROM shares`, []).catch(e => { console.error("Failed to get share count ", e) })
        await Statistics.update("shares", shareCount ? shareCount.rows[0].count : 0)

        client.end();

        console.log("CRON ENDED = compiling statistics")

    }, 1000)
});
