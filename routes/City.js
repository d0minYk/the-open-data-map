const router = require('express').Router();
const auth = require('./Auth');
const City = require('../models/City');
const Social = require('../models/Social');
const Dataset = require('../models/Dataset');
const Request = require('../models/Request');
const Location = require('../models/Location');
const crypto = require('crypto');
const Utilities = require('../Utilities')
const keys = require('../config/Keys');

router.get('/', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        City.find().then(results => {
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

router.get('/search/:keyword', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let keyword = req.params.keyword;

        if (!keyword || !keyword.trim()) {
            return reject({ code: 400, msg: "Enter a keyword" });
        }

        City.find(keyword.toLowerCase()).then(results => {
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

});

router.get('/:id', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userIds = [];
        let orgIds = [];
        let datasetIds = [];
        let locationCount = 0;
        let requestCount = 0;
        let likeCount = 0;
        let commentCount = 0;
        let ratingCount = 0;
        let reportCount = 0;
        let shareCount = 0;
        let totalPoints = 0;

        let city = await City.getById(req.params.id).catch(function(e) { console.error("Failed to get city " + req.params.id, e); });

        if (!city) {
            return reject({ code: 404, msg: "City not found" });
        }

        city = city[0]

        let activityLog = await City.getActivityLog(req.params.id).catch(function(e) { console.error("Failed to get city " + req.params.id); });
        let mostActiveUsers = await City.getMostActiveUserIds(req.params.id, "user", 0).catch(function(e) { console.error("Failed to get most active users " + req.params.id, e); });
        let mostActiveOrganizations = await City.getMostActiveUserIds(req.params.id, "org", 0).catch(function(e) { console.error("Failed to get most active orgs " + req.params.id, e); });
        let lastActivity = await City.getLastActivityDate(req.params.id).catch(function(e) { console.error("Failed to get last activity " + req.params.id, e); });
        let latestDatasetChanges = await Dataset.getLatestDatasetChanges("cityId", req.params.id, 0).catch(function(e) { console.error("Failed to get last dataset changes " + req.params.id, e); });
        let latestLocations = await Location.getByEntityId("city", req.params.id, 0, null).catch(function(e) { console.error("Failed to get last locations " + req.params.id, e); });
        let latestDatasets = [];
        let latestDatasetsSorted = [];
        let latestRequestsSorted = await Request.get("cityId", req.params.id, null, 0).catch(function(e) { console.error("Failed to get last dataset requests " + req.params.id, e); });

        if (latestDatasetChanges && latestDatasetChanges.length !== 0) {
            let ids = latestDatasetChanges.map(item => item.id)
            latestDatasets = await Dataset.getByIds(ids, 0, 6).catch(function(e) { console.error("Failed to get last datasets " + req.params.id, e); });
            for (let i = 0; i < ids.length; i++) {
                let id = ids[i];
                for (let j = 0; j < latestDatasets.length; j++) {
                    if (latestDatasets[j].id === id) {
                        latestDatasetsSorted.push(latestDatasets.splice(j, 1)[0]);
                        break;
                    }
                }
            }
        }

        let datasetActions = [];

        if (latestDatasetsSorted && latestDatasetsSorted.length !== 0) {
            datasetActions = await Social.getStats("dataset", latestDatasetsSorted.map(item => item.id)).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get Dataset stats" }); })
            if (datasetActions && datasetActions.length !== 0) {
                latestDatasetsSorted = Social.mergeEntitiesWithStats(latestDatasetsSorted, datasetActions)
            }
        }

        if (latestRequestsSorted && latestRequestsSorted.length !== 0) {
            requestActions = await Social.getStats("request", latestRequestsSorted.map(item => item.id)).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get Request stats" }); })
            if (requestActions && requestActions.length !== 0) {
                latestRequestsSorted = Social.mergeEntitiesWithStats(latestRequestsSorted, requestActions)
            }
        }

        if (!lastActivity || !lastActivity[0]) {
            lastActivity = "N/A";
        } else {
            lastActivity = lastActivity[0].date
        }

        for (let i = 0; i < activityLog.length; i++) {

            let entry = activityLog[i];

            if (entry.sum) {
                totalPoints += parseInt(entry.sum)
            }

            if (entry.userType === "user" && userIds.indexOf(entry.userId) === -1) {
                userIds.push(entry.userId)
            } else if (entry.userType === "org" && orgIds.indexOf(entry.userId) === -1) {
                orgIds.push(entry.userId)
            }

            if (entry.type === "LOCATION") {

                // if (entry.action === "CREATE") {
                //     locationCount += parseInt(entry.count);
                // } else if (entry.action === "DELETE") {
                //     locationCount -= parseInt(entry.count);
                // }

                if (entry.relatedEntityId && datasetIds.indexOf(entry.relatedEntityId) === -1) {
                    datasetIds.push(entry.relatedEntityId)
                }

            }

            if (entry.action === "CREATE") {

                if (entry.type === "REQUEST") {
                    requestCount += parseInt(entry.count);
                } else if (entry.type === "LIKE") {
                    likeCount += parseInt(entry.count);
                } else if (entry.type === "COMMENT") {
                    commentCount += parseInt(entry.count);
                } else if (entry.type === "REPORT") {
                    reportCount += parseInt(entry.count);
                } else if (entry.type === "SHARE") {
                    shareCount += parseInt(entry.count);
                } else if (entry.type === "RATING") {
                    ratingCount += parseInt(entry.count);
                }

            }

        }

        if (!activityLog) {
            return reject({ code: 404, msg: "City not found" });
        }

        locationCount = await Location.getCountByEntityId("city", req.params.id).catch(e => { console.error("Failed to get location count", e) });

        return resolve({
            organizations: mostActiveOrganizations,
            users: mostActiveUsers,
            datasets: latestDatasetsSorted.slice(0, 6),
            locations: latestLocations.slice(0, 6),
            totalRequestCount: requestCount,
            totalLikeCount: likeCount,
            totalCommentCount: commentCount,
            totalRatingCount: ratingCount,
            totalReportCount: reportCount,
            totalShareCount: shareCount,
            requests: latestRequestsSorted.slice(0, 6),
            totalUserCount: userIds.length,
            totalOrganizationCount: orgIds.length,
            totalLocationCount: Utilities.nFormatter(locationCount, 1) || 0,
            totalDatasetCount: Utilities.nFormatter(datasetIds.length, 1),
            totalPointsEarnt: Utilities.nFormatter(totalPoints, 1),
            rank: (city.rank || "N/A"),
            lastActivity: lastActivity,
            locationInfo: {
                type: "city",
                cityName: city.cityName,
                cityId: city.id,
                countryName: city.countryName,
                countryId: city.countryId,
            }
        });

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
