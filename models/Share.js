const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class ShareModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "entityId",
            "userId",
            "entityType",
            "platform",
            "createdAt"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Saves a share
    static log(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            INSERT INTO shares
                ("entityId", "entityType", "userId", "platform", "entityUserId", "entityCityId", "entityCountryId")
            VALUES
                ($1, $2, $3, $4, $5, $6, $7)
        `
        let params = [args.entityId, args.entityType, args.userId, args.platform, args.entityUserId, args.entityCityId, args.entityCountryId];

        return new Promise(function(resolve, reject) {

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all share infromation of an entity
    static get(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            SELECT id, "userId"
            FROM shares
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

        if (args.platform) {
            query += ` AND "platform" = $4`
            params.push(args.platform)
        }

        return new Promise(function(resolve, reject) {

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

}

module.exports = ShareModel;
