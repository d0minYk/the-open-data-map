const jwt = require('express-jwt');
const Keys = require('../config/Keys.js');

const getTokenFromHeaders = (req) => {

    const { headers: { authorization } } = req;

    if(authorization && authorization.split(' ')[0] === 'Token') {
        return authorization.split(' ')[1];
    }

    return null;

};

// Auth middleware
const auth = {

    required: jwt({
        secret: Keys.jwtSecret,
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
    }),

    optional: jwt({
        secret: Keys.jwtSecret,
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
        credentialsRequired: false,
    }),

    requiredCustom: function(req, res, next) {

        let route = req.originalUrl;
        let userId = req.payload.id;
        let userType = req.payload.type;
        let method = req.route.stack[0].method;

        if (
            (
                ( (route === "/a/dataset") || (route === "/a/dataset/parse") || (route === "/a/dataset/upload") ) &&
                (userType === "org") &&
                (method === "post")
            )
        ) {
            // console.log(route + " - " + userType + " - " + method + " authenticated");
            next();
        } else {
            // console.log(route + " - " + userType + " - " + method + " forbidden");
            res.send(401);
        }

    }

};

module.exports = auth;
