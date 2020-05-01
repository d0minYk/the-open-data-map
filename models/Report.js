const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class CommentModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "entityId",
            "userId",
            "entityType",
            "body",
            "createdAt",
            "updatedAt",
            "cause"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Posts a report
    static post(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            INSERT INTO reports
                ("entityId", "entityType", "userId", "body", "cause", "entityUserId", "entityCityId", "entityCountryId")
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8)
        `
        let params = [args.entityId, args.entityType, args.userId, args.body, args.cause, args.entityUserId, args.entityCityId, args.entityCountryId];

        return new Promise(function(resolve, reject) {

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates a report
    static update(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    UPDATE reports
                    SET
                        body = $2,
                        cause = $3
                    WHERE id = $1
                `, [args.id, args.body, args.cause])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a report by its id
    static getById(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT *
                    FROM reports
                    WHERE id = $1
                `, [id])
                .then(res => { client.end(); resolve(res.rows[0]); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Deletes a report
    static delete(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`DELETE FROM reports WHERE id = $1`, [id])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all reports of an entity
    static get(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            SELECT
                reports.id AS id,
                reports.body AS body,
                reports.cause AS cause,
                reports."createdAt" AS "createdAt",
                users.id AS "userId",
                users.username AS "userName",
                users.picture AS "userPhoto"
            FROM reports
            INNER JOIN users
                ON reports."userId" = users.id
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

module.exports = CommentModel;
