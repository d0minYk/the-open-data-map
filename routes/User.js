const router = require('express').Router();
const auth = require('./Auth');
const User = require('../models/User');
const Email = require('../models/Email');
const Dataset = require('../models/Dataset');
const Location = require('../models/Location');
const City = require('../models/City');
const Country = require('../models/Country');
const Entity = require('../models/Entity');
const Request = require('../models/Request');
const Like = require('../models/Like');
const Social = require('../models/Social');
const CKANMatch = require('../models/CKANMatch');
const Comment = require('../models/Comment');
const Share = require('../models/Share');
const Rating = require('../models/Rating');
const Report = require('../models/Report');
const PasswordRestore = require('../models/PasswordRestore');
const RequestAutoAssign = require('../models/RequestAutoAssign');
const crypto = require('crypto');
const axios = require('axios');
const Utilities = require('../Utilities')
const keys = require('../config/Keys');
const fs = require('fs');
const mime = require('mime-types');
const multer = require('multer');

// router.get('/:admin', auth.optional, (req, res, next) => {
//
// })

router.get('/:id/ckan/:page/:keywords', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.params.id;
        let page = req.params.page;
        let keywords = req.params.keywords;
        let entity = req.params.entity;

        if (!id) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        if ( (!page) || (isNaN(parseInt(page))) ) {
            page = 0;
        }

        if ( (!keywords) || (keywords === "null") ) {
            keywords = "";
        }

        let matches = await CKANMatch.get(req.payload.id, page, keywords).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get matches" }); })

        resolve(matches)

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.get('/:type/:entity/:id/:page', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.params.id;
        let entity = req.params.entity;
        let userType = req.params.type;
        let page = req.params.page;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        if (!page) {
            page = 0;
        }

        if (!userType || (userType !== "user" && userType !== "org")) {
            return reject({ code: 400, msg: "Invalid user type " + userType });
        }

        if (!entity || (entity !== "city" && entity !== "country")) {
            return reject({ code: 400, msg: "Invalid entity " + entity });
        }

        let mostActiveUsers = [];

        if (entity === "city") {
            mostActiveUsers = await City.getMostActiveUserIds(id, userType, page).catch(function(e) { console.error("Failed to get most active users " + req.params.id, e); });
        } else {
            mostActiveUsers = await Country.getMostActiveUserIds(id, userType, page).catch(function(e) { console.error("Failed to get most active users " + req.params.id, e); });
        }

        if (!mostActiveUsers || mostActiveUsers.length === 0) {
            return resolve([]);
        }

        mostActiveUserIds = mostActiveUsers.map(item => item.id)

        User
            .getByIds(mostActiveUserIds, `id, username, points, "picture" AS "userPhoto"`, "points DESC")
            .then(function(data) {

                if (!data) {
                    return reject({ code: 404, msg: "Not user found" });
                }

                let sortedByPointsInEntityUser = [];

                for (let i = 0; i < mostActiveUsers.length; i++) {
                    let user = mostActiveUsers[i];
                    for (let j = 0; j < data.length; j++) {
                        let user2 = data[j];
                        if (user.id === user2.id) {
                            let user3 = user2;
                            user3.pointsInEntity = user.pointsEarnt;
                            sortedByPointsInEntityUser.push(user3);
                            data.splice(j, 1);
                            break;
                        }
                    }
                }

                return resolve(sortedByPointsInEntityUser);

            }).catch(function(err) {
                console.error(err);
                return reject({ code: 500, msg: "Failed to get Users" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})


router.get('/current', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        if (!req.payload.email) {
            return reject({ code: 500 });
        }

        let user = new User({
            email: req.payload.email
        });

        user
            .get()
            .then(userExtended => {

                if (!userExtended) {
                    return reject({ code: 500 });
                }

                user.salt = userExtended.salt;
                user.hash = userExtended.hash;
                user.type = userExtended.type;
                user.id = userExtended.id;
                user.username = userExtended.username;

                return resolve(user.toAuthJSON());

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

router.post('/login', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let email = req.body.email;
        let password = req.body.password;

        if (!email) {
            reject({ code: 400, msg: "Email address is required" });
            return;
        }

        if (!Utilities.isEmail(email)) {
            reject({ code: 400, msg: "Email address is invalid" });
            return;
        }

        email = email.toLowerCase().trim();

        if (!password) {
            reject({ code: 400, msg: "Password is required" });
            return;
        }

        let user = new User({
            email: email
        });

        user
            .get()
            .then(userExtended => {

                if (!userExtended) {
                    reject({ code: 404, msg: "Account is not found with the given information" });
                    return;
                }

                user.salt = userExtended.salt;
                user.hash = userExtended.hash;
                user.type = userExtended.type;

                if (!user.validatePassword(password)) {
                    reject({ code: 404, msg: "Account is not found with the given information" });
                    return;
                }

                user.id = userExtended.id;
                user.username = userExtended.username;

                res.json(user.toAuthJSON());

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

router.post('/restore/email', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let email = req.body.email;

        if (!email) {
            reject({ code: 400, msg: "Email address is required" });
            return;
        }

        if (!Utilities.isEmail(email)) {
            reject({ code: 400, msg: "Email address is invalid" });
            return;
        }

        email = email.toLowerCase().trim();

        let user = new User({
            email: email
        });

        user
            .get()
            .then(user => {

                if (!user) {
                    return resolve("Password restore link sent");
                }

                let newPasswordRestore = new PasswordRestore({
                    token: crypto.randomBytes(48).toString('hex'),
                    expiry: (new Date(new Date().getTime() + 60000*1000)),
                    userId: user.id
                })

                newPasswordRestore
                    .save()
                    .then(function() {

                        Email.send({
                            to: user.managed ? keys.adminEmail : user.email,
                            subject: "Restore Password",
                            content: "Someone, hopefully you requested a password restore for your account on the Open Data Map",
                            actionButton: {
                                title: "Restore Password",
                                link: keys.domainName + "restore/" + newPasswordRestore.token
                            }
                        })

                        return resolve("Password restore link sent");

                    }).catch(e => {
                        console.error("Failed to save restore reference", e)
                        reject({ code: 500, msg: "Failed to save restore reference" });
                    })

            }).catch(e => {
                console.error(e)
                reject({ code: 500, msg: "Failed to restore password" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.post('/restore/password', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let token = req.body.token;
        let password = req.body.password;
        let passwordAgain = req.body.passwordAgain;

        if (!token) {
            return reject({ code: 400, msg: "Missing token" });
        }

        if ( (!password) || (!passwordAgain) ) {
            return reject({ code: 400, msg: "Password is required" });
        }

        if (password !== passwordAgain) {
            return reject({ code: 400, msg: "The two password do not match" });
        }

        if (!password.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)) {
            reject({ code: 400, msg: "The password has to be at least 8 characters long, must contain one number, one special character, one lower-case and one upper-case letter" });
            return;
        }

        PasswordRestore
            .getByToken(token)
            .then(function(passwordRestore) {

                if (!passwordRestore) {
                    return reject({ code: 404, msg: "Could not find token" });
                }

                if (passwordRestore.isUsed) {
                    return reject({ code: 400, msg: "Token already used" });
                }

                if (passwordRestore.expiry < new Date()) {
                    return reject({ code: 400, msg: "Token has expired" });
                }

                let user = new User({
                    id: passwordRestore.userId
                })

                let salt = crypto.randomBytes(16).toString('hex');
                let hash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');

                user
                    .get()
                    .then(function(user) {

                        user = new User({
                            id: user.id,
                            hash: hash,
                            salt: salt
                        })

                        user
                            .updatePassword()
                            .then(async function() {

                                await PasswordRestore.markUsed(token);
                                return resolve("Password updated");

                            }).catch(function() {
                                return reject({ code: 500, msg: "Failed to update password" });
                            })

                    }).catch(function() {
                        return reject({ code: 404, msg: "Could not find user" });
                    })

            }).catch(function(err) {
                return reject({ code: 404, msg: "Could not find token" });
            })

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/current/password', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let userId = req.payload.id;
        let oldPassword = req.body.oldPassword;
        let newPassword = req.body.newPassword;
        let newPasswordAgain = req.body.newPasswordAgain;

        if ( (!oldPassword) || (!newPassword) || (!newPasswordAgain) ) {
            return reject({ code: 400, msg: "Password is required" });
        }

        if (!userId) {
            return reject({ code: 403, msg: "Forbidden" });
        }

        if (newPassword !== newPasswordAgain) {
            return reject({ code: 400, msg: "The two password do not match" });
        }

        if (newPassword.length < 6) {
            return reject({ code: 400, msg: "The minimum password length is 6 characters" });
        }

        let user = await User.getById(userId).catch(e => console.error("Failed to get user", e));

        if (!user) {
            return reject({ code: 404, msg: "Failed to get user" });
        }

        user = new User({
            id: user.id,
            hash: user.hash,
            salt: user.salt
        })

        if (!user.validatePassword(oldPassword)) {
            return reject({ code: 400, msg: "Old password is incorrect" });
        }

        let salt = crypto.randomBytes(16).toString('hex');
        let hash = crypto.pbkdf2Sync(newPassword, salt, 10000, 512, 'sha512').toString('hex');

        await User.updateById(userId, {
            salt: salt,
            hash: hash
        }).catch(e => { console.error("Failed to update passwor"); return reject({ code: 400, msg: "Failed to update password" }); } )

        return resolve("Password updated");

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.put('/current/home', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.payload.id
        let home = req.body;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        await User.updateHome(id, home).catch(function(e) { console.error("Failed to update user", e) })

        resolve()

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.put('/current/ckan', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.payload.id;
        let url = req.body.url;

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        // If URL entered the check if valid ckan repo, if empty then disable

        if (url) {
            if (url[url.length-1] !== "/") url += "/";
            let res = await axios.get(url + "api/3/action/package_list").catch(function(e) { console.error("Failed to get packages", e) });
            if (res && res.data && res.data.result && res.data.result.length !== 0) { } else {
                return reject({ code: 400, msg: "Invalid CKAN URL, make sure you entered a correct address with at least one public dataset" });
            }
        }

        // TODO clear matches
        // TODO clear checked slugs

        await User.updateCkanUrl(id, url).catch(function(e) { console.error("Failed to update user", e) });

        let user = await User.getById(id, `*`).catch(function(e) { console.error("Failed to get user", e) })
        CKANMatch.crawl(user, true);

        resolve()

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.get('/:id', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let id = req.params.id;
        let own = false;

        if (req.payload && req.payload.id) {
            if (req.payload.id === parseInt(id)) {
                own = true;
            }
        }

        if ( (!id) || isNaN(parseInt(id)) ) {
            return reject({ code: 400, msg: "Missing or invalid id" });
        }

        let user = await User.getById(id, `id, username, locked, picture, type, rank, points, home, email, "ckanUrl"`).catch(function(e) { console.error("Failed to get datasets", e) })

        if ( (!user) || (user.locked) ) {
            return reject({ code: 404, msg: "User not found" });
        }

        let actions = await User.getActionCountsByUserId(id).catch(function(e) { console.error("Failed to get actions sent", e) });

        if (!actions || actions.length === 0) {
            return reject({ code: 500, msg: "Failed to get actions" });
        }

        user.statistics = {
            home: user.home,
            points: user.points ? Utilities.nFormatter(user.points, 1) : 0,
            rank: user.rank || "rookie",
            cities: 0,
            countries: 0,
            datasets: 0,
            locations: 0,
            like: {
                sent: 0,
                received: 0
            },
            comment: {
                sent: 0,
                received: 0
            },
            share: {
                sent: 0,
                received: 0
            },
            rating: {
                sent: 0,
                received: 0
            },
            report: {
                sent: 0,
                received: 0
            }
        }

        for (var i = 0; i < actions.length; i++) {

            let row = actions[i];

            if ( (row.action === "post") && (row.type === "location") ) {
                // Groupped by cityId, so this is another city
                user.statistics.cities++;
                // Total locations in this city
                user.statistics.locations += parseInt(row.count);
            } else if ( (row.action === "post") && (row.type === "dataset") ) {
                // Datasets are not groupped so only one row containing all counts
                user.statistics.datasets = parseInt(row.count);
            } else if (row.type === "country") {
                user.statistics.countries++
            } else {
                user.statistics[row.action][row.direction] += parseInt(row.count);
            }

            // if (row.action === "like") {
            //     if (row.direction === "sent") likes.sent = parseInt(row.count);
            //     if (row.direction === "received") likes.received = parseInt(row.count);
            // }

        }

        user.statistics.locations = Utilities.nFormatter(user.statistics.locations, 1);

        if (user.type !== "org") {
            delete user.email;
            delete user.statistics.datasets;
        }

        if (!own) {
            delete user.ckanUrl
        }

        if (own && user.type === "org") {
            user.requestAutoAssigns = await RequestAutoAssign.getByUserId(user.id).catch(function(e) { console.error("Failed to get autosiggsnt ", e) });
        }

        resolve(user)

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.post('/', auth.optional, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        let email = req.body.email;
        let username = req.body.username;
        let password = req.body.password;
        let passwordAgain = req.body.passwordAgain;

        if (!email) {
            reject({ code: 400, msg: "Email address is required" });
            return;
        }

        if (!Utilities.isEmail(email)) {
            reject({ code: 400, msg: "Email address is invalid" });
            return;
        }

        email = email.toLowerCase().trim();

        if (!username) {
            reject({ code: 400, msg: "Username is required" });
            return;
        }

        username = username.trim();

        if (!password) {
            reject({ code: 400, msg: "Password is required" });
            return;
        }

        // if (password !== passwordAgain) {
        //     reject({ code: 400, msg: "The two password do not match" });
        //     return;
        // }

        if (!password.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)) {
            reject({ code: 400, msg: "The password has to be at least 8 characters long, must contain one number, one special character, one lower-case and one upper-case letter" });
            return;
        }

        let salt = crypto.randomBytes(16).toString('hex');
        let hash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');

        let newUser = new User({
            email: email,
            username: username,
            salt: salt,
            hash: hash,
            type: 'user',
            points: 0,
            rank: "rookie"
        });

        newUser.doesExists().then(exists => {

            if (exists) {
                reject({ code: 400, msg: "The given username or email already exists" });
                return;
            }

            newUser.create().then(id => {

                newUser.id = id;
                resolve(newUser.toAuthJSON());

            }).catch(e => {
                console.error(e);
                reject({ code: 500 });
            })

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

router.get('/', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        if (req.payload.type !== "admin") {
            return reject({ code: 403, msg: "Forbidden" });
        }

        let keywords = req.query.keywords;

        User.search(keywords).then(results => {
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

router.put('/:id/block', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        if (req.payload.type !== "admin") {
            return reject({ code: 403, msg: "Forbidden" });
        }

        if (!req.params.id) {
            return reject({ code: 400, msg: "No id provided" });
        }

        User.toggleBlock(req.params.id).then(result => { resolve(result); }).catch(e => {
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

router.delete('/current/picture', auth.required, (req, res, next) => {

    return new Promise(function(resolve, reject) {

        if (!req.payload.id) {
            return reject({ code: 400, msg: "No id provided" });
        }

        User.updateProfilePicture(req.payload.id, null).then(result => { resolve(result); }).catch(e => {
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

router.put('/:id/picture', auth.required, function(req, res, next) {
    next();
}, multer({

    storage: multer.diskStorage({

        destination: function(req, file, next){
            next(null, './uploads/profilepictures');
        },

        filename: function(req, file, next){
            const ext = file.mimetype.split('/')[1];
            next(null, crypto.randomBytes(16).toString("hex") + '.' + ext);
        },

    }),

    limits: { fileSize: 1024*1000*100 }

}).single('picture'), async function(req, res) {

    return new Promise(async function(resolve, reject) {

    	let fileName = req.file.filename;
        let extension = fileName.split(".");
        extension = extension[extension.length-1];

        if (!fileName) {
            reject({ code: 400, msg: "Invalid file." });
            return;
        }

        User.updateProfilePicture(req.params.id, fileName).then(result => { resolve(result); }).catch(e => {
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

router.get('/:id/login-as', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        if (req.payload.type !== "admin") {
            return reject({ code: 403, msg: "Forbidden" });
        }

        if (!req.params.id) {
            return reject({ code: 400, msg: "No id provided" });
        }

        let user = await User.getById(req.params.id, "id, email, username, type").catch(function(e) { console.error("Failed to get user", e) })

        if (!user) {
            return reject({ code: 404, msg: "User not found" });
        }

        user = new User({
            id: user.id,
            email: user.email,
            username: user.username,
            type: user.type,
        })

        res.json(user.toAuthJSON());

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.get('/:id/timeline/:direction/:section/:page', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let data = {
            likes: [],
            comments: [],
            reports: [],
            ratings: [],
            shares: [],
        };
        let direction = req.params.direction;
        let userId = req.params.id;
        let section = req.params.section;
        let page = req.params.page;

        if (!userId) {
            return reject({ code: 400, msg: "No id provided" });
        }

        if (!direction) {
            return reject({ code: 400, msg: "No direction" });
        }

        if (!section) {
            return reject({ code: 400, msg: "No section" });
        }

        if (["likes", "comments", "ratings", "shares", "reports"].indexOf(section) === -1) {
            return reject({ code: 400, msg: "Invalid section" });
        }

        data[section] = (await Social.getByUserId(section, userId, direction, page))

        // Getting all entities (location, dataset, request) related to the social action
        let entities = await Entity.getBulk(data[section]);

        let allSocialActionsForEntity = await Social.getByEntityIds(direction, data[section]);

        // Loop over action type (likes, comments, shares, ratings, reports) and entities (datasets, locations, ckan matches)
        for (let actionType in data) {
            // Loop over all entities, fill out action types

            for (let i = 0; i < data[actionType].length; i++) {

                let action = data[actionType][i];

                if (entities[action.entityType]) {
                    action.entity = entities[action.entityType].filter(item => parseInt(item.id) === action.entityId)[0] || {};
                }

                let hash = action.entityType + "-" + action.entityId
                if (allSocialActionsForEntity[hash] && allSocialActionsForEntity[hash][actionType]) {
                    action.entity[actionType] = allSocialActionsForEntity[hash][actionType];
                }

            }

        }

        res.json(data[section]);

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

router.get('/:id/timeline/:direction', auth.optional, (req, res, next) => {

    return new Promise(async function(resolve, reject) {

        let data = {
            likes: [],
            comments: [],
            ratings: [],
            shares: [],
            reports: [],
            requests: [],
        }
        let direction = req.params.direction;
        let userId = req.params.id;

        if (!userId) {
            return reject({ code: 400, msg: "No id provided" });
        }

        if (!direction) {
            return reject({ code: 400, msg: "No section" });
        }

        let own = false;

        if (req.payload && req.payload.id === parseInt(userId)) {
            own = true;
        }

        let user = await User.getById(userId, `id, email, username, type, "lastProfileVisit"`).catch(function(e) { console.error("Failed to get user", e) })

        if (!user) {
            return reject({ code: 404, msg: "User not found" });
        }

        // User recieved ones
        if (direction === "inbox") {

            if (own) {
                data.ckan = (await CKANMatch.get(userId, 0)).slice(0, 3);
            }

            // Getting assgined to organization
            if (user.type === "org") {
                data.requests = (await Request.getByEntityId("user", "org", userId, 0, null).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get assigned requests" }); })).slice(0, 3);
            } else {
                delete data.requests;
            }

        } else {

            if (user.type === "org") {
                data.datasets = (await Dataset.getByUserId(userId, 0, null, own).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get Datasets" }); })).slice(0, 3);
            } else {
                delete data.datasets
            }
            data.locations = (await Location.getByUserId(userId, 0, null, own).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get Locations" }); })).slice(0, 3);

            // Getting requested by user
            if (user.type === "user") {
                data.requests = (await Request.getByEntityId("user", "user", userId, 0, null).catch(function(err) { console.error(err); return reject({ code: 500, msg: "Failed to get assigned requests" }); })).slice(0, 3);
            } else {
                delete data.requests;
            }

        }

        data.likes = (await Social.getByUserId("likes", userId, direction, 0)).slice(0, 3);
        data.comments = (await Social.getByUserId("comments", userId, direction, 0)).slice(0, 3);
        data.ratings = (await Social.getByUserId("ratings", userId, direction, 0)).slice(0, 3);
        data.shares = (await Social.getByUserId("shares", userId, direction, 0)).slice(0, 3);
        data.reports = (await Social.getByUserId("reports", userId, direction, 0)).slice(0, 3);

        // Getting all entities (location, dataset, request) related to the social action
        let entities = await Entity.getBulk(data.likes, data.comments, data.ratings, data.shares, data.reports);

        let allSocialActionsForEntity = await Social.getByEntityIds(
            direction,
            data.likes,
            data.comments,
            data.ratings,
            data.shares,
            data.reports,
            data.datasets ? data.datasets.map(item => { return { entityType: "dataset", entityId: item.id } }) : [],
            data.locations ? data.locations.map(item => { return { entityType: "location", entityId: item.id } }) : [],
            data.requests ? data.requests.map(item => { return { entityType: "request", entityId: item.id } }) : [],
        );

        // Loop over action type (likes, comments, shares, ratings, reports) and entities (datasets, locations, ckan matches)
        for (let actionType in data) {
            // Loop over all entities, fill out action types

            for (let i = 0; i < data[actionType].length; i++) {

                let action = data[actionType][i];

                if (actionType === "datasets" || actionType === "locations" || actionType === "requests") {

                    let hash = actionType.replace("datasets", "dataset").replace("requests", "request").replace("locations", "location") + "-" + action.id;
                    action.likes = allSocialActionsForEntity[hash] ? allSocialActionsForEntity[hash]["likes"] : [];
                    action.comments = allSocialActionsForEntity[hash] ? allSocialActionsForEntity[hash]["comments"] : [];
                    action.shares = allSocialActionsForEntity[hash] ? allSocialActionsForEntity[hash]["shares"] : [];
                    action.ratings = allSocialActionsForEntity[hash] ? allSocialActionsForEntity[hash]["ratings"] : [];
                    action.reports = allSocialActionsForEntity[hash] ? allSocialActionsForEntity[hash]["reports"] : [];

                } else {

                    if (entities[action.entityType]) {
                        action.entity = entities[action.entityType].filter(item => parseInt(item.id) === action.entityId)[0] || {};
                    }

                    let hash = action.entityType + "-" + action.entityId
                    if (allSocialActionsForEntity[hash] && allSocialActionsForEntity[hash][actionType]) {
                        action.entity[actionType] = allSocialActionsForEntity[hash][actionType];
                    }

                    if (own && (user.lastProfileVisit === null || user.lastProfileVisit < action.createdAt || user.lastProfileVisit < action.createdat || user.lastProfileVisit < action.updatedAt || user.lastProfileVisit < action.updatedat || user.lastProfileVisit < action.date) ) {
                        action.new = true;
                    }

                }

            }

        }

        if (data.requests) {
            data.requests.map(item => {
                item.entityType = "request";
                item.actionType = "request";
                return item;
            })
        }

        if (own) {
            await User.logProfileVisit(userId).catch(function(e) { console.error("Failed to update user", e) })
        }

        res.json(data);

    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

});

router.get('/current/request/open', auth.required, (req, res, next) => {

    return new Promise(async function(resolve, reject) {
        let requests = await Request.getAllOpenByAssigneeId(req.payload.id).catch(e => { console.error("Failed to get reuqests", e); });
        resolve(requests || []);
    }).then(function(data) {
        res.json(data)
    }).catch(function(error) {
        if ( (error) && (!error.code) ) console.error("Unexpected Error", error);
        res.status((error && error.code) ? error.code : 500).json({ error: (error && error.msg) ? error.msg : "Unexpected Error" })
    })

})

module.exports = router;
