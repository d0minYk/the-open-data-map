const Keys = require('../config/Keys.js');
const User = require('../models/User.js');
const ActivityLog = require('../models/ActivityLog.js');
const { Client } = require('pg');

class RequestModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "requestorId",
            "asigneeId",
            "status",
            "datasetId",
            "name",
            "description",
            "cityId",
            "countryId",
            "cityName",
            "countryName",
            "createdat",
            "updatedat"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Returns a list of requests by keyswords and entity type
    static async getByEntityId(entityType, userType, entityId, page, keywords) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            if (userType === "org") {
                entityType = "asignee"
            } else if (userType === "user") {
                entityType = "requestor"
            }

            let query = `
                SELECT *
                FROM requests
                WHERE
                    "${entityType}Id" = $2
                    ${ (keywords) ? "AND ( (LOWER(\"name\") LIKE '%' || $3 || '%'  ) OR (LOWER(\"description\") LIKE '%' || $3 || '%'  ) )" : '' }
                ORDER BY updatedat DESC
                LIMIT 25 OFFSET $1
            `

            let params = [(page*25), entityId];

            if (keywords) {
                params.push(keywords.toLowerCase());
            }

            client
                .query(query, params)
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a list of requests by their ids
    static async getByIds(ids, start, limit) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT *
                FROM requests
                WHERE (id IN (${ids.join(",")}))
                LIMIT $2 OFFSET $1
            `

            let params = [start, limit];

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a request by its id
    static getById(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`SELECT * from requests WHERE id = $1`, [id])
                .then(res => { client.end(); resolve(res.rows[0]); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all open requests of an organization
    static async getAllOpenByAssigneeId(id) {

        const client = this.getClient(); client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT *
                    FROM requests
                    WHERE "asigneeId" = $1
                    AND (
                        status = 'Collecting data' OR
                        status = 'Needs more information' OR
                        status = 'Closed' OR
                        status = 'Assigned'
                    )
                `,
                [id])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a list of requests by keyswords and entity type
    static async get(filterField, filterFieldId, keywords, page) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT *
                FROM requests
                WHERE
                    "${filterField}" = $2
                    ${ (keywords) ? "AND ( (LOWER(name) LIKE '%' || $3 || '%'  ) OR (LOWER(description) LIKE '%' || $3 || '%'  ) )" : '' }
                ORDER BY updatedat DESC
                LIMIT 12 OFFSET $1
            `

            let params = [(page*12), filterFieldId];

            if (keywords) {
                params.push(keywords.toLowerCase());
            }

            console.log(query, params)

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Searches for a request
    static async search(keywords) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let query = `
                SELECT *
                FROM requests
                ${ (keywords) ? "WHERE ( (LOWER(name) LIKE '%' || $1 || '%'  ) OR (LOWER(description) LIKE '%' || $1 || '%'  ) )" : '' }
                ORDER BY updatedat DESC
            `

            let params = [];

            if (keywords) {
                params.push(keywords.toLowerCase());
            }

            console.log(query, params)

            client
                .query(query, params )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Creates a request
    static create(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        INSERT INTO requests ("requestorId", "asigneeId", "status", "datasetId", "name", "description", "cityId", "countryId", "cityName", "countryName")
                        VALUES ($1, null, 'Waiting for assignment', null, $2, $3, $4, $5, $6, $7)
                        RETURNING *
                    `,
                    [args.requestorId, args.name, args.details, args.cityId, args.countryId, args.cityName, args.countryName]
                )
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "REQUEST",
                        action: "CREATE",
                        entityId: res.rows[0].id,
                        userId: args.requestorId,
                        entityUserId: args.requestorId,
                        entityCityId: args.cityId,
                        entityCountryId: args.countryId,
                    })
                    resolve(res.rows[0])
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates the details of a request
    static update(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        UPDATE requests
                        SET
                            name = $3,
                            description = $4
                        WHERE id = $1 AND "requestorId" = $2
                    `,
                    [args.id, args.requestorId, args.name, args.details]
                )
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "REQUEST",
                        action: "UPDATE",
                        entityId: args.id,
                        userId: args.requestorId,
                        cityId: args.cityId,
                        countryId: args.countryId,
                    })
                    resolve()
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Updates the status of a request
    static updateStatus(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`UPDATE requests SET status = $2 WHERE id = $1`, [args.id, args.status])
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "REQUEST",
                        action: "UPDATE",
                        entityId: args.id,
                        userId: args.requestorId,
                        cityId: args.cityId,
                        countryId: args.countryId,
                    })
                    resolve()
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Unassigns a request from a user
    static unassign(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`UPDATE requests SET "asigneeId" = null, status = 'Waiting for assignment' WHERE id = $1`, [args.id])
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "REQUEST",
                        action: "UPDATE",
                        entityId: args.id,
                        userId: args.requestorId,
                        cityId: args.cityId,
                        countryId: args.countryId,
                    })
                    resolve()
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Fulfills a dataset request
    static fulfill(args) {

        const client = this.getClient(); client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    UPDATE requests
                    SET
                        "datasetId" = $2,
                        status = 'Released'
                    WHERE id = $1
                `, [args.id, args.datasetId])
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "REQUEST",
                        action: "UPDATE",
                        entityId: args.id,
                        userId: args.requestorId,
                        cityId: args.cityId,
                        countryId: args.countryId,
                    })
                    resolve()
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Assigns a request to the user
    static assign(args) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`UPDATE requests SET "asigneeId" = $2, status = 'Assigned' WHERE id = $1`, [args.id, args.asigneeId])
                .then(async res => {
                    client.end();
                    await ActivityLog.log({
                        type: "REQUEST",
                        action: "UPDATE",
                        entityId: args.id,
                        userId: args.requestorId,
                        cityId: args.cityId,
                        countryId: args.countryId,
                    })
                    resolve()
                })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

}

module.exports = RequestModel;
