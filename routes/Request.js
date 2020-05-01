const router = require('express').Router();
const auth = require('./Auth');
const Request = require('../models/Request');
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const Share = require('../models/Share');
const Email = require('../models/Email');
const Social = require('../models/Social');
const Report = require('../models/Report');
const Dataset = require('../models/Dataset');
const RequestAutoAssign = require('../models/RequestAutoAssign');
const keys = require('../config/Keys');

router.get('/:entity/:id/:page/:keywords', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.params.id;
        let page = req.params.page;
        let keywords = req.params.keywords;
        let entity = req.params.entity;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        if (!entity || (entity !== "city" && entity !== "user" && entity !== "country")) {
            return reject({ code: 400, msg: "Invalid entity " + entity });
        }

        if (!page) {
            page = 0;
        }

        if ( (!keywords) || (keywords === "null") ) {
            keywords = "";
        }

        let user;

        if (entity === "user") {
            user = await User.getById(id, `type`).catch(e => console.error("Failed to asignee user", e));
            if (!user) {
                return reject({ code: 404, msg: "User not found" });
            }
        }

        let requests = await Request.getByEntityId(entity, user ? user.type : null, id, page, keywords, req.payload ? req.payload.id === parseInt(id) : false, req.payload.id).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get locations" }); })

        let locationActions = [];

        if (requests && requests.length !== 0) {
            locationActions = await Social.getStats("request", requests.map(item => item.id)).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get request stats" }); })
            if (locationActions && locationActions.length !== 0) {
                requests = Social.mergeEntitiesWithStats(requests, locationActions)
            }
            return resolve(requests);
        } else {
            return resolve(requests)
        }

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.get('/', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        if (req.payload.type !== "admin") {
            return reject({ code: 403, msg: "Forbidden" });
        }

        let keywords = req.query.keywords;

        Request.search(keywords).then(results => {
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

router.get('/:id', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let id = req.params.id;

        Request.getById(id).then(async result => {
            if (!result) return reject({ code: 404, msg: "Request not found" });
            if (result && result.asigneeId) result.asignee = await User.getById(result.asigneeId, `username, picture`).catch(e => console.error("Failed to asignee user", e));
            if (result && result.requestorId) result.requestor = await User.getById(result.requestorId, `username, picture`).catch(e => console.error("Failed to requestor user", e));
            if (result && result.datasetId) result.dataset = await Dataset.getById(result.datasetId, `username, picture`).catch(e => console.error("Failed to dataset", e));
            result.likes = await Like.get({entityId: id, entityType: "request" }).catch(function(e) { console.error("Failed to get likes", e) })
            result.shares = await Share.get({ entityId: id, entityType: "request" }).catch(function(e) { console.error("Failed to get shares", e) })
            result.comments = await Comment.get({ entityId: id, entityType: "request" }).catch(function(e) { console.error("Failed to get comments", e) })
            result.reports = await Report.get({ entityId: id, entityType: "request" }).catch(function(e) { console.error("Failed to get reports", e) })
            result.ratings = await Rating.get({ entityId: id, entityType: "request" }).catch(function(e) { console.error("Failed to get ratings", e) })
            return resolve(result);
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

router.patch('/:id', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let requestUpdate = req.body;

        if (!requestUpdate.name || !requestUpdate.name.trim()) {
            return reject({ code: 400, msg: "Request name is required" });
        }

        if (!requestUpdate.details || !requestUpdate.details.trim()) {
            return reject({ code: 400, msg: "Please add some details for your request" });
        }

        let request = await Request.getById(req.params.id).catch(e => { console.error("Failed to get request", e) });

        if (!request) {
            return reject({ code: 404, msg: "Request not found" });
        }

        if (request.requestorId !== req.payload.id) {
            return reject({ code: 403, msg: "Forbidden" });
        }

        request.name = requestUpdate.name;
        request.details = requestUpdate.details;

        Request.update(request).catch(e => { console.error("Failed to update request", e); });

        if (request.asigneeId) {

            userToBeNotified = await User.getById(request.asigneeId, `email, managed`).catch(e => console.error("Failed to asignee user", e))

            if (userToBeNotified && userToBeNotified.email) {

                Email.send({
                    to: userToBeNotified.managed ? keys.adminEmail : userToBeNotified.email,
                    subject: "A requested assigned to you has been updated",
                    content: `
                        Requestor: <strong>${req.payload.username}</strong> </br />
                        Request name: <strong>${request.name}</strong> <br />
                        Details: ${request.details}
                    `,
                    actionButton: {
                        title: "Open Request",
                        link: keys.domainName + "request/" + request.id
                    }
                })

            }

        }

        return resolve()

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.put('/:id/status', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let newStatus = req.body.status;

        if (!newStatus || ["Waiting for assignment", "Collecting data", "Needs more information", "Closed", "Assigned"].indexOf(newStatus) === -1) {
            return reject({ code: 400, msg: "Invalid status " + newStatus });
        }

        let request = await Request.getById(req.params.id).catch(e => { console.error("Failed to get request", e) });

        if (!request) {
            return reject({ code: 404, msg: "Request not found" });
        }

        /* Allowed status changes
            Requestor
                Waiting for assignn -> Closed
                Collecting data -> Closed
                Needs more information -> Closed
            Asignee
                --- Waiting for assignn -> Collecting data ===== But not from here
                --- Anything -> Released ======= But not from here
                Collecting data -> Closed, Needs more information
                Needs more information -> Closed , Collecting more information
                Closed -> Collecting data, Needs more information
        */

        let userToBeNotified = null;
        let emailContent = null;
        let emailSubject = null;

        if (request.requestorId === req.payload.id) {

            // Can only close
            if (newStatus !== "Closed") {
                return reject({ code: 403, msg: "You cannot change the status of this request to " + newStatus });
            }

            // If not yet completed
            // if (["Waiting for assignment", "Collecting data", "Needs more information"].indexOf(request.status) === -1) {
            //     return reject({ code: 403, msg: "You cannot change the status of this request to " + newStatus });
            // }

            userToBeNotified = await User.getById(request.asigneeId, `email, managed`).catch(e => console.error("Failed to asignee user", e))

            emailContent = `
                <strong>${req.payload.username}</strong> has updated the status of a request <strong>${request.name}</strong> assigned to you.
                New Status: ${newStatus}
            `

            emailSubject = "Status change on request"

        } else if (request.asigneeId === req.payload.id) {

            if (
                ( request.status === "Closed" && (newStatus === "Needs more information" || newStatus === "Collecting data") ) ||
                ( request.status === "Needs more information" && (newStatus === "Closed" || newStatus === "Collecting data") ) ||
                ( request.status === "Collecting data" && (newStatus === "Needs more information" || newStatus === "Closed") ) ||
                ( request.status === "Assigned" && (newStatus === "Needs more information" || newStatus === "Collecting data" || newStatus === "Closed") )
            ) {  } else {
                return reject({ code: 403, msg: "You cannot change the status of this request to " + newStatus });
            }

            userToBeNotified = await User.getById(request.requestorId, `email, managed`).catch(e => console.error("Failed to reqeustor user", e))

            emailContent = `
                <strong>${req.payload.username}</strong> has updated the status of your request <strong>${request.name}</strong> posted by you.
                New Status: <strong>${newStatus}</strong>
            `

            emailSubject = "Status change on your request"

        } else {

            return reject({ code: 403, msg: "Forbidden" });

        }

        if (userToBeNotified && userToBeNotified.email) {

            Email.send({
                to: userToBeNotified.managed ? keys.adminEmail : userToBeNotified.email,
                subject: emailSubject,
                content: emailContent,
                actionButton: {
                    title: "Open Request",
                    link: keys.domainName + "request/" + request.id
                }
            })

        }

        request.status = newStatus;
        await Request.updateStatus(request).catch(e => { console.error("Failed to update status of request", e); })
        return resolve()

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.delete('/:id/assignment', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let request = await Request.getById(id).catch(e => { console.error("Failed to get request", e) });

        if (request.asigneeId !== userId) {
            return reject({ code: 403, msg: "Forbidden" });
        }

        await Request.unassign(request).catch(e => { console.error("Failed to unassign from request", e); })

        return resolve()

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.put('/:id/assignment', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.params.id;
        let userId = req.payload.id;
        let request = await Request.getById(id).catch(e => { console.error("Failed to get request", e) });

        if (req.payload.type !== "org") {
            return reject({ code: 403, msg: "Forbidden" });
        }

        if (request.asigneeId) {
            return reject({ code: 400, msg: "There is already an assigned user on this request" });
        }

        request.asigneeId = userId
        await Request.assign(request).catch(e => { console.error("Failed to assign to request", e); })

        return resolve()

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.post('/', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let request = req.body;

        if (!request.name || !request.name.trim()) {
            return reject({ code: 400, msg: "Request name is required" });
        }

        if (!request.details || !request.details.trim()) {
            return reject({ code: 400, msg: "Please add some details for your request" });
        }

        if (!request.cityId || !request.countryName || !request.countryId || !request.cityName) {
            return reject({ code: 400, msg: "Please select a city for your request" });
        }

        request.requestorId = req.payload.id
        let res = await Request.create(request).catch(e => { console.error("Failed to save request", e); })
        let autoAcceptUser = await RequestAutoAssign.getByCityId(request.cityId).catch(e => { console.error("Failed to get auto accept user", e); })

        if (autoAcceptUser && autoAcceptUser[0]) {

            request.asigneeId = autoAcceptUser[0].userId;
            request.requestorId = req.payload.id
            request.entityId = res.id
            request.id = res.id

            await Request.assign(request).catch(e => { console.error("Failed to assign to request", e); })

            Email.send({
                to: autoAcceptUser[0].managed ? keys.adminEmail : autoAcceptUser[0].email,
                subject: "A new request has been auto-assigned to you",
                content: `
                    <strong>${req.payload.username}</strong> has requested
                    <strong>${request.name}</strong> <br />
                    Details: ${request.details}
                `,
                actionButton: {
                    title: "Open Request",
                    link: keys.domainName + "request/" + request.id
                }
            })

        }

        if (!res || !res.id) {
            return reject({ code: 500, msg: "Failed to save request" });
        }

        return resolve(res.id)

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
