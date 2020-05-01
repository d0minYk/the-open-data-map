const router = require('express').Router();
const auth = require('./Auth');
const Report = require('../models/Report');
const User = require('../models/User');
const Email = require('../models/Email');
const Dataset = require('../models/Dataset');
const Location = require('../models/Location');
const ActivityLog = require('../models/ActivityLog');
const Request = require('../models/Request');
const keys = require('../config/Keys');

const REASONS_LOCATION = [
    "Moved Permanently",
    "Closed Permanently",
    "Moved Temporarily",
    "Closed Temporarily",
    "Non-existent",
    "Suggest Edit",
    "Inappropriate",
    "Duplicate"
]

const REASONS_DATASET = [
    "Suggest Edit",
    "Inappropriate",
    "Duplicate",
    "Other Issue",
]

const REASONS_REQUEST = [
    "Suggest Edit",
    "Inappropriate",
    "Duplicate",
    "Other Issue"
]

router.delete('/:reportId', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let reportId = req.params.reportId;

        if ( (!userId) || (!reportId) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        let report = await Report.getById(reportId).catch(e => { console.error("failed to get report", e) });

        if (!report) {
            return reject({ code: 404, msg: "Report not found" });
        }

        if (report.userId !== userId) {
            return reject({ code: 403, msg: "Forbidden" });
        }

        await Report.delete(reportId).catch(function(e) {
            console.error("Failed to delete report", e)
            return reject({ code: 500, msg: "Failed to delete report" });
        })

        await ActivityLog.log({
            type: "REPORT",
            action: "DELETE",
            entityId: report.entityId,
            entityType: report.entityType,
            userId: userId,
            entityUserId: report.userId,
            entityCityId: report.entityCityId,
            entityCountryId: report.entityCountryId,
        })

        return resolve("Report posted")

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

        let reports = await Report.get({ entityId: entityId, entityType: entityType }).catch(function(e) { console.error("Failed to get reports", e) })

        if (!reports) {
            return reject({ code: 500, msg: "Failed to get reports" });
        }

        return resolve(reports)

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/:reportId', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let reportId = req.params.reportId;
        let body = req.body.body;
        let cause = req.body.cause;

        if ( (!userId) || (!reportId) || (!body) || (!cause) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        let report = await Report.getById(reportId).catch(e => { console.error("failed to get report", e) });

        if (!report) {
            return reject({ code: 404, msg: "Report not found" });
        }

        if (report.userId !== userId) {
            return reject({ code: 403, msg: "Forbidden" });
        }

        if (report.entityType === "location" && REASONS_LOCATION.indexOf(cause) === -1) {
            return reject({ code: 400, msg: "Invalid Reason" });
        }

        if (report.entityType === "dataset" && REASONS_DATASET.indexOf(cause) === -1) {
            return reject({ code: 400, msg: "Invalid Reason" });
        }

        if (report.entityType === "request" && REASONS_REQUEST.indexOf(cause) === -1) {
            return reject({ code: 400, msg: "Invalid Reason" });
        }

        await Report.update({
            id: reportId,
            body: body,
            cause: cause
        }).catch(function(e) {
            console.error("Failed to update report", e)
            return reject({ code: 500, msg: "Failed to post report" });
        })

        await ActivityLog.log({
            type: "REPORT",
            action: "UPDATE",
            entityId: report.entityId,
            entityType: report.entityType,
            userId: userId,
            entityUserId: report.userId,
            entityCityId: report.entityCityId,
            entityCountryId: report.entityCountryId,
        })

        let targetEntity;

        if (report.entityType === "location") {
            targetEntity = await Location.getById(report.entityId).catch(function(e) { console.error("Failed to get location") });
        } else if (report.entityType === "dataset") {
            targetEntity = await Dataset.getById(report.entityId).catch(function(e) { console.error("Failed to get dataset") });
        } else if (report.entityType === "request") {
            targetEntity = await Request.getById(report.entityId).catch(function(e) { console.error("Failed to get request") });
        }

        if (!targetEntity) {
            return reject({ code: 404, msg: "Couldn't find traget entity" });
        }

        let owner = await User.getById(targetEntity.userId, "email, managed").catch(function(e) {
            console.error("Failed get owner", e)
            return reject({ code: 500, msg: "Failed to get owner" });
        });

        if (report.entityType === "dataset") {

            let dataset = await Dataset.getByIdAndUserId(report.entityId, report.userId).catch(function(e) {
                return reject({ code: 500, msg: "Failed to get dataset" });
            });

            if (dataset) {

                Email.send({
                    to: owner.managed ? keys.adminEmail : owner.email,
                    subject: "Dataset reported as " + cause,
                    content: `
                        <strong>${req.payload.username}</strong> has reported
                        <strong>${dataset.name}</strong> as
                        <strong>${cause}</strong>
                        ${ (body) ? "<br />More info: " + body : "" }
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "dataset/" + dataset.id
                    }
                })

            }

        } else if (report.entityType === "request") {

            let requestor, assignee;

            requestor = await User.getById(targetEntity.requestorId, "email, managed").catch(function(e) { console.error("Failed to get requestor") });

            if (targetEntity.asigneeId) {
                assignee = await User.getById(targetEntity.asigneeId, "email, managed").catch(function(e) { console.error("Failed to get assignee") });
            }

            if (assignee && assignee.email) {

                Email.send({
                    to: assignee.managed ? keys.adminEmail : assignee.email,
                    subject: "Request reported as " + cause,
                    content: `
                        <strong>${req.payload.username}</strong> has reported
                        <strong>${targetEntity.name}</strong> as
                        <strong>${cause}</strong>
                        ${ (body) ? "<br />More info: " + body : "" }
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "request/" + targetEntity.id
                    }
                })

            }

            if (requestor && requestor.email) {

                Email.send({
                    to: requestor.managed ? keys.adminEmail : requestor.email,
                    subject: "Request reported as " + cause,
                    content: `
                        <strong>${req.payload.username}</strong> has reported
                        <strong>${targetEntity.name}</strong> as
                        <strong>${cause}</strong>
                        ${ (body) ? "<br />More info: " + body : "" }
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "request/" + targetEntity.id
                    }
                })

            }

        } else if (report.entityType === "location") {

            let location = await Location.getById(report.entityId).catch(function(e) {
                return reject({ code: 500, msg: "Failed to get location" });
            });

            if (location) {

                Email.send({
                    to: owner.managed ? keys.adminEmail : owner.email,
                    subject: "Location reported as " + cause,
                    content: `
                        <strong>${req.payload.username}</strong> has reported
                        <strong>${location.fields.name}</strong> as
                        <strong>${cause}</strong>
                        ${ (body) ? "<br />More info: " + body : "" }
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "map/" + location.id
                    }
                })

            }

        }

        return resolve("Report updated")

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
        let cause = req.body.cause;

        if ( (!userId) || (!entityType) || (!entityId) || (!body) || (!cause) ) {
            return reject({ code: 400, msg: "Missing fields" });
        }

        if (entityType === "location" && REASONS_LOCATION.indexOf(cause) === -1) {
            return reject({ code: 400, msg: "Invalid Reason" });
        }

        if (entityType === "dataset" && REASONS_DATASET.indexOf(cause) === -1) {
            return reject({ code: 400, msg: "Invalid Reason" });
        }

        if (entityType === "request" && REASONS_REQUEST.indexOf(cause) === -1) {
            return reject({ code: 400, msg: "Invalid Reason" });
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

        await Report.post({
            entityId: entityId,
            entityType: entityType,
            userId: userId,
            body: body,
            cause: cause,
            entityUserId: targetEntity.userId || targetEntity.requestorId,
            entityCityId: targetEntity.cityId,
            entityCountryId: targetEntity.countryId,
        }).catch(function(e) {
            console.error("Failed to post report", e)
            return reject({ code: 500, msg: "Failed to post report" });
        })

        await ActivityLog.log({
            type: "REPORT",
            action: "CREATE",
            entityId: entityId,
            entityType: entityType,
            userId: userId,
            entityUserId: targetEntity.userId || targetEntity.requestorId,
            entityCityId: targetEntity.cityId,
            entityCountryId: targetEntity.countryId,
        })

        let owner = await User.getById(targetEntity.userId, "email, managed").catch(function(e) {
            console.error("Failed get owner", e)
            return reject({ code: 500, msg: "Failed to get owner" });
        });

        if (entityType === "dataset") {

            let dataset = await Dataset.getByIdAndUserId(entityId, targetEntity.userId).catch(function(e) {
                return reject({ code: 500, msg: "Failed to get dataset" });
            });

            if (dataset) {

                Email.send({
                    to: owner.managed ? keys.adminEmail : owner.email,
                    subject: "Dataset reported as " + cause,
                    content: `
                        <strong>${req.payload.username}</strong> has reported
                        <strong>${dataset.name}</strong> as
                        <strong>${cause}</strong>
                        ${ (body) ? "<br />More info: " + body : "" }
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "dataset/" + dataset.id
                    }
                })

            }

        } else if (entityType === "request") {

            let requestor, assignee;

            requestor = await User.getById(targetEntity.requestorId, "email, managed").catch(function(e) { console.error("Failed to get requestor") });

            if (targetEntity.asigneeId) {
                assignee = await User.getById(targetEntity.asigneeId, "email, managed").catch(function(e) { console.error("Failed to get assignee") });
            }

            if (assignee && assignee.email) {

                Email.send({
                    to: assignee.managed ? keys.adminEmail : assignee.email,
                    subject: "Request reported as " + cause,
                    content: `
                        <strong>${req.payload.username}</strong> has reported
                        <strong>${targetEntity.name}</strong> as
                        <strong>${cause}</strong>
                        ${ (body) ? "<br />More info: " + body : "" }
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "request/" + targetEntity.id
                    }
                })

            }

            if (requestor && requestor.email) {

                Email.send({
                    to: requestor.managed ? keys.adminEmail : requestor.email,
                    subject: "Request reported as " + cause,
                    content: `
                        <strong>${req.payload.username}</strong> has reported
                        <strong>${targetEntity.name}</strong> as
                        <strong>${cause}</strong>
                        ${ (body) ? "<br />More info: " + body : "" }
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "request/" + targetEntity.id
                    }
                })

            }

        } else if (entityType === "location") {

            let location = await Location.getById(entityId).catch(function(e) {
                return reject({ code: 500, msg: "Failed to get location" });
            });

            if (location) {

                Email.send({
                    to: owner.managed ? keys.adminEmail : owner.email,
                    subject: "Location reported as " + cause,
                    content: `
                        <strong>${req.payload.username}</strong> has reported
                        <strong>${location.fields.name}</strong> as
                        <strong>${cause}</strong>
                        ${ (body) ? "<br />More info: " + body : "" }
                    `,
                    actionButton: {
                        title: "View",
                        link: keys.domainName + "map/" + location.id
                    }
                })

            }

        }

        return resolve("report posted")

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

module.exports = router;
