const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class FavoriteLocation {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "userId",
            "locationId"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Returns a user's favorite locations
    static getByUserId(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                     SELECT locations.*
                     FROM locations
                     INNER JOIN "favoriteLocations"
                     ON locations.id = "favoriteLocations"."locationId"
                     WHERE "favoriteLocations"."userId" = $1
                `, [id] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Return's a user's favorite location by its id
    static getByUserIdAndLocationId(userId, locationId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                     SELECT id
                     FROM "favoriteLocations"
                     WHERE "userId" = $1 AND "locationId" = $2
                `, [userId, locationId] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Removes a favorite location of the user
    static deleteByUserIdAndLocationId(userId, locationId) {

        const client = this.getClient(); client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                     DELETE
                     FROM "favoriteLocations"
                     WHERE "userId" = $1 AND "locationId" = $2
                `, [userId, locationId] )
                .then(res => { client.end(); resolve() })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Saves a location as favorite to a user
    static post(userId, locationId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    INSERT INTO "favoriteLocations"
                    ("userId", "locationId")
                    VALUES ($1, $2)
                `, [userId, locationId] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

}

module.exports = FavoriteLocation;
