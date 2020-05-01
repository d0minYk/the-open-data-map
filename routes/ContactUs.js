const router = require('express').Router();
const ContactUs = require('../models/ContactUs');
const Keys = require('../config/Keys.js');
const Email = require('../models/Email.js');
const auth = require('./Auth');

router.post('/', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let reason = req.body.reason;
        let body = req.body.body;
        let email = req.body.email
        let userId;

        if (req.payload) {
            userId = req.payload.id;
            email = req.payload.email
        }

        if (!reason || !reason.trim()) {
            return reject({ code: 400, msg: "Please select a reason" });
        }

        if (!body || !body.trim()) {
            return reject({ code: 400, msg: "Please describe the issue in more detail" });
        }

        await ContactUs.save({
            reason: reason,
            body: body,
            email: email
        }).catch(e => { reject({ code: 500, msg: "Failed to save contact us form" }); })

        resolve("Submitted");

        Email.send({
            to: Keys.adminEmail,
            subject: "Contact us form " + reason,
            content: `
                ${email && "<strong>Email: </strong> " + email + "<br />"}
                ${userId && "<strong>User Id: </strong> " + userId + "<br />"}
                ${ (body) ? "<br />More info: " + body : "" }
            `,
        })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
