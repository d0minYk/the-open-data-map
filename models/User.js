const Keys = require('../config/Keys.js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Client } = require('pg');

class UserModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "email",
            "username",
            "salt",
            "hash",
            "id",
            "type",
            "picture",
            "rank",
            "points",
            "ckanUrl",
            "ckanCheckedSlugs",
            "lastProfileVisit",
            "createdat",
            "managed"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Validates the password of the user
    validatePassword(password) {
        const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
        return this.hash === hash;
    };

    // Generates a JWT for the current user
    generateJWT() {

        let today = new Date();
        let expirationDate = new Date(today);
        expirationDate.setDate(today.getDate() + 90);

        return jwt.sign({
            email: this.email,
            username: this.username,
            id: this.id,
            exp: parseInt(expirationDate.getTime() / 1000, 10),
            type: this.type
        }, Keys.jwtSecret);

    }

    // Generates user info object with JWT included
    toAuthJSON() {

        return {
            id: this.id,
            email: this.email,
            username: this.username,
            token: this.generateJWT(),
            type: this.type,
        };

    };

    // Returns whether a username or email exists
    doesExists() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        SELECT id
                        FROM users
                        WHERE
                            username=$1
                            OR
                            email=$2
                    `,
                    [
                        this.username,
                        this.email,
                    ]
                )
                .then(res => {
                    client.end()
                    resolve(res.rowCount > 0)
                })
                .catch(e => {
                    client.end()
                    reject(e.stack)
                })

        }.bind(this))

    }

    // Searches between users  by keywords
    static search(keywords) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            let query = `
                SELECT *
                FROM users
            `

            let params = [];

            if (keywords) {
                keywords = keywords.toLowerCase();
                query += `
                    WHERE LOWER(username) LIKE '%' || $1 || '%'
                    OR LOWER(email) LIKE '%' || $1 || '%'
                `
                params.push(keywords)
            }

            query += `
                LIMIT 100
            `

            client
                .query(query, params)
                .then(res => {
                    client.end()
                    resolve(res.rows)
                })
                .catch(e => {
                    client.end()
                    reject(e.stack)
                })

        }.bind(this))

    }

    // Logs the last time the current user has visited his own profile
    static logProfileVisit(id) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(`UPDATE users SET "lastProfileVisit" = $2 WHERE id = $1`, [id, new Date()])
                .then(res => { client.end(); resolve(); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Blocks or unblocks a user
    static toggleBlock(id) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(`UPDATE users SET locked = NOT locked WHERE id = $1`, [id])
                .then(res => { client.end(); resolve(); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates the profile picture of a user
    static updateProfilePicture(id, picture) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(`UPDATE users SET picture = $2 WHERE id = $1`, [id, picture])
                .then(res => { client.end(); resolve(); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates a user with the given fields and values
    static updateById(id, updates) {

        console.log("UPdating user " + id, updates);

        let query = `
            UPDATE users
            SET
        `;

        let updatesQuery = "";
        let params = [];

        for (let key in updates) {

            if (key !== "id") {
                params.push(updates[key]);
                updatesQuery += "\"" + key + "\" = $" + params.length + ", ";
            }

        }

        updatesQuery = updatesQuery.replace(/, $/, '');

        if (!id) {
            return reject("Missing id")
        }

        if (params.length === 0) {
            return reject("Nothing to update")
        }

        query += updatesQuery;
        params.push(id);
        query += " WHERE id = $" + params.length;

        console.log("++++++", query, "++++++", params, "======================");

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(query, params)
                .then(res => { client.end(); resolve(); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all users with a ckan api url added
    static getCkanUsers() {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(`SELECT id, email, "ckanUrl", "ckanCheckedSlugs" FROM users WHERE "ckanUrl" IS NOT NULL AND LENGTH("ckanUrl") <> 0`, [])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Retuns a user by its id
    static getById(id, fields) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(
                    `
                        SELECT ${fields ? fields : "*"}
                        FROM users
                        WHERE id=$1
                        LIMIT 1
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(res.rows[0]); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns multiple users by the given ids
    static getByIds(ids, fields, orderBy) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(
                    `
                        SELECT ${fields}
                        FROM users
                        WHERE id IN (${ids.join(",")})
                        ${ orderBy ? "ORDER BY " + orderBy : "" }
                    `, []
                )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Returns a user by id or email
    get() {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let whereField, fieldValue;

            if (this.id) {
                whereField = "id";
                fieldValue = this.id;
            } else if (this.email) {
                whereField = "email";
                fieldValue = this.email;
            } else {
                reject({ code: 400, msg: "No filters" })
                return;
            }

            client
                .query(
                    `
                        SELECT *
                        FROM users
                        WHERE ${whereField}=$1
                    `,
                    [
                        fieldValue
                    ]
                )
                .then(res => {
                    client.end()
                    resolve(res.rows[0])
                })
                .catch(e => {
                    client.end()
                    reject(e.stack)
                })

        }.bind(this))

    }

    // Updates the hometown of a user
    static updateHome(id, home) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(`UPDATE users SET home = $2 WHERE id = $1`, [id, home ] )
                .then(res => { client.end(); resolve(); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates the CKAN url of a organization
    static updateCkanUrl(id, url) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(`UPDATE users SET "ckanUrl" = $2 WHERE id = $1`, [id, url ] )
                .then(res => { client.end(); resolve(); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates the parsed ckan package list
    static updateCheckedCkanSlugs(id, slugs) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            client
                .query(`UPDATE users SET "ckanCheckedSlugs" = $2 WHERE id = $1`, [id, slugs ] )
                .then(res => { client.end(); resolve(); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates the users password
    updatePassword() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        UPDATE users
                        SET
                            salt = $1,
                            hash = $2
                        WHERE
                            id = $3
                    `,
                    [
                        this.salt,
                        this.hash,
                        this.id
                    ]
                )
                .then(res => {
                    client.end()
                    resolve()
                })
                .catch(e => {
                    client.end()
                    reject(e.stack)
                })

        }.bind(this))

    }

    // Returns social action counts of the user
    static async getActionCountsByUserId(userId) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            client
                .query(`
                        SELECT count(id), "entityType" as "type", 'like' as "action", 'sent' as direction FROM likes
                        WHERE "userId"=${userId}
                        GROUP BY "entityType"
                    UNION
                        SELECT count(id), "entityType" as "type", 'comment' as "action", 'sent' as direction FROM comments
                        WHERE "userId"=${userId}
                        GROUP BY "entityType"
                    UNION
                        SELECT count(id), "entityType" as "type", 'share' as "action", 'sent' as direction FROM shares
                        WHERE "userId"=${userId}
                        GROUP BY "entityType"
                    UNION
                        SELECT count(id), "entityType" as "type", 'rating' as "action", 'sent' as direction FROM ratings
                        WHERE "userId"=${userId}
                        GROUP BY "entityType"
                    UNION
                        SELECT count(id), "entityType" as "type", 'report' as "action", 'sent' as direction FROM reports
                        WHERE "userId"=${userId}
                        GROUP BY "entityType"
                    UNION
                        SELECT count(id), 'location' as "type", 'post' as "action", "cityId"::text as direction FROM locations
                        WHERE "userId"=${userId}
                        GROUP BY "cityId"
                    UNION
                        SELECT count(id), 'country' as "type", 'post' as "action", "countryId"::text as direction FROM locations
                        WHERE "userId"=${userId}
                        GROUP BY "countryId"
                    UNION
                        SELECT count(id), 'dataset' as "type", 'post' as "action", '-' as "cityId" FROM datasets
                        WHERE "userId"=${userId}
                    UNION
                        SELECT count(likes.id) as "count", "entityType" as "entity", 'like' as "action", 'received' as direction FROM likes
                        WHERE "entityUserId" = ${userId}
                        GROUP BY "entityType"
                        HAVING "entityType" IS NOT NULL
                    UNION
                        SELECT count(comments.id) as "count", "entityType" as "entity", 'comment' as "action", 'received' as direction FROM comments
                        WHERE "entityUserId" = ${userId}
                        GROUP BY "entityType"
                        HAVING "entityType" IS NOT NULL
                    UNION
                        SELECT count(ratings.id) as "count", "entityType" as "entity", 'rating' as "action", 'received' as direction FROM ratings
                        WHERE "entityUserId" = ${userId}
                        GROUP BY "entityType"
                        HAVING "entityType" IS NOT NULL
                    UNION
                        SELECT count(shares.id) as "count", "entityType" as "entity", 'share' as "action", 'received' as direction FROM shares
                        WHERE "entityUserId" = ${userId}
                        GROUP BY "entityType"
                        HAVING "entityType" IS NOT NULL
                    UNION
                        SELECT count(reports.id) as "count", "entityType" as "entity", 'report' as "action", 'received' as direction FROM reports
                        WHERE "entityUserId" = ${userId}
                        GROUP BY "entityType"
                        HAVING "entityType" IS NOT NULL
                `
                , [] )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Creates a user
    create() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        INSERT INTO users (username, email, salt, hash, type)
                        VALUES ($1, $2, $3, $4, 'user')
                        RETURNING id
                    `,
                    [
                        this.username,
                        this.email,
                        this.salt,
                        this.hash
                    ]
                )
                .then(res => {
                    client.end()
                    resolve(res.rows[0].id)
                })
                .catch(e => {
                    client.end()
                    reject(e.stack)
                })

        }.bind(this))

    }

}

module.exports = UserModel;
