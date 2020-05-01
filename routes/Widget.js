const router = require('express').Router();
const auth = require('./Auth');
const Location = require('../models/Location');
const Dataset = require('../models/Dataset');
const Utilities = require('../Utilities')
const keys = require('../config/Keys');

router.get('/:entity/:id', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let link = keys.serverIp;

        if (req.params.entity === "location") {
            link += "location/" + req.params.id
        } else if (req.params.entity === "dataset") {
            link += "dataset/" + req.params.id
        } else if (req.params.entity === "location") {
            link += "request/" + req.params.id
        }

        // <label style="font-weight: 700;margin-right:8px">OPEN ON</label>

        resolve(`
            <body style="margin:0">
                <a href="${link}" target="_blank" style="border-radius:4px;overflow:hidden;white-space:nowrap;display:inline-block;background-color:#5F6CAF;padding:4px 8px;color:white;text-decoration:none;font-family:-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Roboto', Arial, sans-serif;display: flex;align-items: center; justify-content: center">
                    <img style="height:22px;margin: 4px 0;" src="${keys.serverIp}logo.png" />
                </a>
            </body>
        `)

    }).then(function(data) {
        res.send(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
