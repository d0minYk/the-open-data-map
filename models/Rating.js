const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class RatingModel {

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
            "rating"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Deletes a rating
    static delete(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`DELETE FROM ratings WHERE id = $1`, [id])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a rating by its id
    static getById(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT *
                    FROM ratings
                    WHERE id = $1
                `, [id])
                .then(res => { client.end(); resolve(res.rows[0]); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates a rating
    static update(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    UPDATE ratings
                    SET
                        body = $2,
                        rating = $3
                    WHERE id = $1
                `, [args.id, args.body, args.rating])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Creates a rating
    static post(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            INSERT INTO ratings
                ("entityId", "entityType", "userId", "body", "rating", "entityUserId", "entityCityId", "entityCountryId")
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8)
        `
        let params = [args.entityId, args.entityType, args.userId, args.body, args.rating, args.entityUserId, args.entityCityId, args.entityCountryId];

        return new Promise(function(resolve, reject) {

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns rating of a user and entity
    static getByEntityAndUserId(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT id
                    FROM ratings
                    WHERE "entityId" = $1
                    AND "entityType" = $2
                    AND "userId" = $3
                `, [args.entityId, args.entityType, args.userId])
                .then(res => { client.end(); resolve(res.rows[0]); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all ratings of an entity
    static get(args) {

        const client = this.getClient();
        client.connect();

        let query = `
            SELECT
                ratings.id AS id,
                ratings.body AS body,
                ratings.rating AS rating,
                ratings."createdAt" AS "createdAt",
                users.id AS "userId",
                users.username AS "userName",
                users.picture AS "userPhoto"
            FROM ratings
            INNER JOIN users
                ON ratings."userId" = users.id
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

module.exports = RatingModel;
