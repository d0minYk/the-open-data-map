const cron = require('node-cron');
const Keys = require('../config/Keys.js');
const User = require('../models/User.js');
const CKANMatch = require('../models/CKANMatch.js');
const { Client } = require('pg');

// Cron running after midnight to scan CKAN API
// cron.schedule('30 * * * *', () => {
    setTimeout(async function() {

        return;

        let ckanUsers = await User.getCkanUsers().catch(function(e) { console.error("Failed to get ckan users", e) });

        if (ckanUsers && ckanUsers.length !== 0) {

            console.log("Got ckan urls", ckanUsers)

            for (let i = 0; i < ckanUsers.length; i++) {
                await CKANMatch.crawl(ckanUsers[i], false);
            }

        }

        console.log("CKAN EXP done")

    }, 1000)
// });
