const router = require('express').Router();
const auth = require('./Auth');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const Location = require('../models/Location');
const Dataset = require('../models/Dataset');
const Request = require('../models/Request');
const User = require('../models/User');
const Email = require('../models/Email');
const keys = require('../config/Keys');

router.delete('/:commentId', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let commentId = req.params.commentId;

        if ( (!userId) || (!commentId) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        let comment = await Comment.getById(commentId).catch(e => { console.error("failed to get comment", e) });

        if (!comment) {
            return reject({ code: 404, msg: "Comment not found" });
        }

        if (comment.userId !== userId) {
            return reject({ code: 403, msg: "Forbidden" });
        }

        await Comment.delete(commentId).catch(function(e) {
            console.error("Failed to delete comment", e)
            return reject({ code: 500, msg: "Failed to delete comment" });
        })

        resolve("Comment deleted")

        await ActivityLog.log({
            type: "COMMENT",
            action: "DELETE",
            entityId: comment.entityId,
            entityType: comment.entityType,
            userId: userId,
            entityUserId: comment.userId,
            entityCityId: comment.entityCityId,
            entityCountryId: comment.entityCountryId,
        })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:commentId', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let commentId = req.params.commentId;
        let body = req.body.body;

        if ( (!userId) || (!commentId) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        if (!body || !body.trim()) {
            return reject({ code: 400, msg: "Comment field is required" });
        }

        let comment = await Comment.getById(commentId).catch(e => { console.error("failed to get comment", e) });

        if (!comment) {
            return reject({ code: 404, msg: "Comment not found" });
        }

        if (comment.userId !== userId) {
            return reject({ code: 403, msg: "Forbidden" });
        }

        await Comment.update({
            id: commentId,
            body: body,
        }).catch(function(e) {
            console.error("Failed to update comment", e)
            return reject({ code: 500, msg: "Failed to post comment" });
        })

        await ActivityLog.log({
            type: "COMMENT",
            action: "UPDATE",
            entityId: comment.entityId,
            entityType: comment.entityType,
            userId: userId,
            entityUserId: comment.userId,
            entityCityId: comment.entityCityId,
            entityCountryId: comment.entityCountryId,
        })

        return resolve("Comment updated")

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.get('/:entityType/:entityId', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let entityType = req.params.entityType;
        let entityId = req.params.entityId;

        let comments = await Comment.get({ entityId: entityId, entityType: entityType }).catch(function(e) { console.error("Failed to get comments", e) })

        if (!comments) {
            return reject({ code: 500, msg: "Failed to get comments" });
        }

        return resolve(comments)

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

        if ( (!userId) || (!entityType) || (!entityId) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        if (!body || !body.trim()) {
            return reject({ code: 400, msg: "Comment field is required" });
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

        await Comment.post({
            entityId: entityId,
            entityType: entityType,
            userId: userId,
            body: body,
            entityUserId: targetEntity.userId || targetEntity.requestorId,
            entityCityId: targetEntity.cityId,
            entityCountryId: targetEntity.countryId,
        }).catch(function(e) {
            console.error("Failed to post comment", e)
            return reject({ code: 500, msg: "Failed to post comment" });
        })

        resolve("Comment posted")

        await ActivityLog.log({
            type: "COMMENT",
            action: "CREATE",
            entityId: entityId,
            entityType: entityType,
            userId: userId,
            entityUserId: targetEntity.userId || targetEntity.requestorId,
            entityCityId: targetEntity.cityId,
            entityCountryId: targetEntity.countryId,
        })

        if (entityType === "request") {

            let requestor, assignee;

            requestor = await User.getById(targetEntity.requestorId, "email, managed").catch(function(e) { console.error("Failed to get requestor") });

            if (targetEntity.asigneeId) {
                assignee = await User.getById(targetEntity.asigneeId, "email, managed").catch(function(e) { console.error("Failed to get assignee") });
            }

            if (assignee && assignee.email && targetEntity.asigneeId !== req.payload.id) {

                Email.send({
                    to: assignee.managed ? keys.adminEmail : assignee.email,
                    subject: "Comment received for a report assigned to you",
                    content: `
                        <strong>${req.payload.username}</strong> has commented on
                        <strong>${targetEntity.name}</strong>: <br />
                        <strong>${body}</strong>
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "request/" + targetEntity.id
                    }
                })

            }

            if (requestor && requestor.email && targetEntity.requestorId !== req.payload.id) {

                Email.send({
                    to: requestor.managed ? keys.adminEmail : requestor.email,
                    subject: "Comment received for a report opened by you",
                    content: `
                        <strong>${req.payload.username}</strong> has commented on
                        <strong>${targetEntity.name}</strong>: <br />
                        <strong>${body}</strong>
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "request/" + targetEntity.id
                    }
                })

            }

        }

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

module.exports = router;
