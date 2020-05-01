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
            "updatedAt"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Posting a comment
    static post(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            INSERT INTO comments
                ("entityId", "entityType", "userId", "body", "entityUserId", "entityCityId", "entityCountryId")
            VALUES
                ($1, $2, $3, $4, $5, $6, $7)
        `
        let params = [args.entityId, args.entityType, args.userId, args.body, args.entityUserId, args.entityCityId, args.entityCountryId];

        return new Promise(function(resolve, reject) {

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updating a comment
    static update(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    UPDATE comments
                    SET body = $2
                    WHERE id = $1
                `, [args.id, args.body])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Deleting a comment
    static delete(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`DELETE FROM comments WHERE id = $1`, [id])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returning a comment by its id
    static getById(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT *
                    FROM comments
                    WHERE id = $1
                `, [id])
                .then(res => { client.end(); resolve(res.rows[0]); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Retuning comments of an entity id and type
    static get(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            SELECT
                comments.id AS id,
                comments.body AS body,
                comments."createdAt" AS "createdAt",
                users.id AS "userId",
                users.username AS "userName",
                users.picture AS "userPhoto"
            FROM comments
            INNER JOIN users
                ON comments."userId" = users.id
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
