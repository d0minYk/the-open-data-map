const router = require('express').Router();
const auth = require('./Auth');
const Rating = require('../models/Rating');
const Dataset = require('../models/Dataset');
const Location = require('../models/Location');
const ActivityLog = require('../models/ActivityLog');
const Request = require('../models/Request');
const keys = require('../config/Keys');

router.get('/:entityType/:entityId', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let entityType = req.params.entityType;
        let entityId = req.params.entityId;

        let ratings = await Rating.get({ entityId: entityId, entityType: entityType }).catch(function(e) { console.error("Failed to get ratings", e) })

        if (!ratings) {
            return reject({ code: 500, msg: "Failed to get ratings" });
        }

        return resolve(ratings)

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.delete('/:ratingId', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let ratingId = req.params.ratingId;

        if ( (!userId) || (!ratingId) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        let rating = await Rating.getById(ratingId).catch(e => { console.error("failed to get rating", e) });

        if (!rating) {
            return reject({ code: 404, msg: "Rating not found" });
        }

        if (rating.userId !== userId) {
            return reject({ code: 403, msg: "Forbidden" });
        }

        await Rating.delete(ratingId).catch(function(e) {
            console.error("Failed to delete rating", e)
            return reject({ code: 500, msg: "Failed to delete rating" });
        })

        await ActivityLog.log({
            type: "RATING",
            action: "DELETE",
            entityId: rating.entityId,
            entityType: rating.entityType,
            userId: userId,
            entityUserId: rating.userId,
            entityCityId: rating.entityCityId,
            entityCountryId: rating.entityCountryId,
        })

        return resolve("Rating posted")

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:ratingId', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let ratingId = req.params.ratingId;
        let body = req.body.body;
        let stars = req.body.rating;

        if ( (!userId) || (!ratingId) || (!body) || (!stars) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        let rating = await Rating.getById(ratingId).catch(e => { console.error("failed to get rating", e) });

        if (!rating) {
            return reject({ code: 404, msg: "Rating not found" });
        }

        if (rating.userId !== userId) {
            return reject({ code: 403, msg: "Forbidden" });
        }

        await Rating.update({
            id: ratingId,
            body: body,
            rating: stars,
        }).catch(function(e) {
            console.error("Failed to update rating", e)
            return reject({ code: 500, msg: "Failed to post rating" });
        })

        await ActivityLog.log({
            type: "RATING",
            action: "UPDATE",
            entityId: rating.entityId,
            entityType: rating.entityType,
            userId: userId,
            entityUserId: rating.userId,
            entityCityId: rating.entityCityId,
            entityCountryId: rating.entityCountryId,
        })

        return resolve("Rating updated")

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.post('/:entityType/:entityId', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let entityType = req.params.entityType;
        let entityId = req.params.entityId;
        let body = req.body.body;
        let rating = req.body.rating;

        if ( (!userId) || (!entityType) || (!entityId) || (!body) || (!rating) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        let existingRating = await Rating.getByEntityAndUserId({
            entityType: entityType,
            entityId: entityId,
            userId: userId
        }).catch(e => { console.error("failed to get rating", e) });

        if (existingRating) {
            return reject({ code: 404, msg: "You have already rated this " + entityType });
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

        await Rating.post({
            entityId: entityId,
            entityType: entityType,
            userId: userId,
            body: body,
            rating: rating,
            entityUserId: targetEntity.userId || targetEntity.requestorId,
            entityCityId: targetEntity.cityId,
            entityCountryId: targetEntity.countryId,
        }).catch(function(e) {
            console.error("Failed to post rating", e)
            return reject({ code: 500, msg: "Failed to post rating" });
        })

        await ActivityLog.log({
            type: "RATING",
            action: "CREATE",
            entityId: entityId,
            entityType: entityType,
            userId: userId,
            entityUserId: targetEntity.userId || targetEntity.requestorId,
            entityCityId: targetEntity.cityId,
            entityCountryId: targetEntity.countryId,
        })

        return resolve("rating posted")

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

module.exports = router;
