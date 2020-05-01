const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class LikeModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "entityId",
            "userId",
            "entityType",
            "createdat"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Removes a like from an entity
    static unlike(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            DELETE FROM likes
            WHERE id = $1
        `
        let params = [args.id];

        return new Promise(function(resolve, reject) {

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Posts a like to an entity
    static like(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            INSERT INTO likes
                ("entityId", "entityType", "userId", "entityUserId", "entityCityId", "entityCountryId")
            VALUES
                ($1, $2, $3, $4, $5, $6)
        `
        let params = [args.entityId, args.entityType, args.userId, args.entityUserId, args.entityCityId, args.entityCountryId];

        return new Promise(function(resolve, reject) {

            client
                .query(query, params)
                .then(async res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all likes received for an entity
    static get(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            SELECT id, "userId"
            FROM likes
            WHERE
                "entityId" = $1
            AND
                "entityType" = $2
        `
        let params = [args.entityId, args.entityType];

        if (args.userId) {
            query += ` AND "userId" = $3`
            params.push(args.userId)
        }

        return new Promise(function(resolve, reject) {

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

}

module.exports = LikeModel;
