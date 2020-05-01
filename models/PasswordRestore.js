const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class IconModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "userId",
            "token",
            "expiry",
            "isUsed"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Saves a password restore request
    save() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        INSERT INTO "passwordRestores" ("userId", "token", "expiry", "isUsed")
                        VALUES ($1, $2, $3, false)
                        RETURNING id
                    `,
                    [this.userId, this.token, this.expiry]
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

    // Expires a password restore request
    static markUsed(token) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        UPDATE "passwordRestores"
                        SET "isUsed" = true
                        WHERE token = $1
                    `,
                    [token]
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

    // Returns a password restor request by its token
    static getByToken(token) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        SELECT *
                        FROM "passwordRestores"
                        WHERE token = $1
                    `,
                    [token]
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

}

module.exports = IconModel;
