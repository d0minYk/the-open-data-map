const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class TopicModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "userId",
            "cityId",
            "id",
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Returns all cities for which the user accepted auto-assigns to
    static getByUserId(userId) {

        const client = this.getClient();
        client.connect();

        console.log("Getting _ ", userId)

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT "requestAutoAssigns".id, "requestAutoAssigns"."userId", "requestAutoAssigns"."cityId", cities.name
                    FROM "requestAutoAssigns"
                    INNER JOIN cities ON "requestAutoAssigns"."cityId" = cities.id
                    WHERE "requestAutoAssigns"."userId" = $1
                `, [userId] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Returns the auto-assign "owner" of a city
    static getByCityId(cityId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT "requestAutoAssigns".*, users.email as email, users.managed as managed
                    FROM "requestAutoAssigns"
                    INNER JOIN users on "requestAutoAssigns"."userId" = users.id
                    WHERE "requestAutoAssigns"."cityId" = $1
                `, [cityId] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Unsubscribes the user to be assigned request automatically in a city
    static delete(id, userId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    DELETE FROM "requestAutoAssigns"
                    WHERE "userId" = $1 AND id = $2
                `, [userId, id] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Subscribes the user to be assigned request automatically in a city
    static assign(userId, cityId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    INSERT INTO "requestAutoAssigns"
                    ("userId", "cityId")
                    VALUES ($1, $2)
                    RETURNING id
                `, [userId, cityId] )
                .then(res => { client.end(); resolve(res.rows[0].id) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

}

module.exports = TopicModel;
