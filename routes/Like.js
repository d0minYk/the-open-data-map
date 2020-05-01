const router = require('express').Router();
const auth = require('./Auth');
const Like = require('../models/Like');
const Location = require('../models/Location');
const Dataset = require('../models/Dataset');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const keys = require('../config/Keys');

router.post('/:entityType/:entityId', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let entityType = req.params.entityType;
        let entityId = req.params.entityId;

        if ( (!userId) || (!entityType) || (!entityId) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        let targetEntity;

        if (entityType === "location") {
            targetEntity = await Location.getById(entityId).catch(function(e) { console.error("Failed to get location") });
        } else if (entityType === "dataset") {
            targetEntity = await Dataset.getById(entityId).catch(function(e) { console.error("Failed to get dataset") });
        } else if (entityType === "request") {
            targetEntity = await Request.getById(entityId).catch(function(e) { console.error("Failed to get request") });
        }

        if (!targetEntity) {
            return reject({ code: 404, msg: "Couldn't find traget entity" });
        }

        let like = await Like.get({
            entityId: entityId,
            entityType: entityType,
            userId: userId
        }).catch(function(e) {
            console.error("Failed to get likes", e)
            return reject({ code: 400, msg: "Failed to get like" });
        })

        if (like.length === 0) {

            await Like.like({
                entityId: entityId,
                entityType: entityType,
                userId: userId,
                entityUserId: targetEntity.userId || targetEntity.requestorId,
                entityCityId: targetEntity.cityId,
                entityCountryId: targetEntity.countryId,
            }).catch(function(e) {
                console.error("Failed to post like", e)
                return reject({ code: 500, msg: "Failed to post like" });
            })

            await ActivityLog.log({
                type: "LIKE",
                action: "CREATE",
                entityId: entityId,
                entityType: entityType,
                userId: userId,
                entityUserId: targetEntity.userId || targetEntity.requestorId,
                entityCityId: targetEntity.cityId,
                entityCountryId: targetEntity.countryId,
            })

            return resolve("Liked")

        } else {

            await Like.unlike({
                id: like[0].id,
                entityId: entityId,
                entityType: entityType,
                userId: userId,
                entityUserId: targetEntity.userId || targetEntity.requestorId,
                entityCityId: targetEntity.cityId,
                entityCountryId: targetEntity.countryId,
            }).catch(function(e) {
                console.error("Failed to remove like", e)
                return reject({ code: 500, msg: "Failed to remove like" });
            })

            await ActivityLog.log({
                type: "LIKE",
                action: "DELETE",
                entityId: entityId,
                entityType: entityType,
                userId: userId,
                entityUserId: targetEntity.userId || targetEntity.requestorId,
                entityCityId: targetEntity.cityId,
                entityCountryId: targetEntity.countryId,
            })

            return resolve("Unliked")

        }

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

module.exports = router;
