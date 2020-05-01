const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class CountryModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "name",
            "id",
            "locationCount",
            "rank"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Returns a countries by its internal id
    static getById(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        SELECT *
                        FROM countries
                        WHERE id = $1
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a total of 50 countries that are exactly as the input (from all countries)
    static findExact(keyword) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT "locationCount", name, id FROM countries
                    WHERE LOWER(name) = $1
                    ORDER BY "locationCount" desc
                    LIMIT 50
                `, [keyword.toLowerCase()])
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

    // Returns a total of 50 countries that contains the given input
    static find(keyword) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            let query = `
                SELECT "locationCount", name, id FROM countries
                ORDER BY "locationCount" desc
                LIMIT 50
            `

            let queryParams = []

            if (keyword) {

                query = `
                    SELECT "locationCount", name, id FROM countries
                    WHERE LOWER(name) LIKE '%' || $1 || '%'
                    ORDER BY "locationCount" desc
                    LIMIT 50
                `

                queryParams = [
                    keyword
                ]

            }

            client
                .query(
                    query,
                    queryParams
                )
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

    // Inserts a new country into the database
    create() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        INSERT INTO countries (name)
                        VALUES ($1)
                        RETURNING id
                    `,
                    [
                        this.name
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

    // Returns the whole activity log of a country
    static getActivityLog(id) {

        const client = this.getClient(); client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                    SELECT "activityLog"."userId", "activityLog"."relatedEntityId", users.type AS "userType", "activityLog"."type", "activityLog"."action", count("activityLog"."id"), sum("pointsEarnt")
                    FROM "activityLog"
                    INNER JOIN USERS
                        ON "activityLog"."userId" = users.id
                    WHERE "activityLog"."entityCountryId" = $1
                    GROUP BY "activityLog"."userId", "activityLog"."relatedEntityId", users.type, "activityLog"."type", "activityLog"."action"
                    ORDER BY sum DESC
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns the last action's date in the given country
    static getLastActivityDate(id) {

        const client = this.getClient(); client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                    SELECT date
                    FROM "activityLog"
                    WHERE "activityLog"."entityCountryId" = $1
                    ORDER BY id
                    LIMIT 1
                    `,
                    [id]
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns a list of contributors / organizations in a country ordered by the total number of points earnt
    static getMostActiveUserIds(id, userType, page) {

        const client = this.getClient(); client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                    SELECT users.username as "username", users.picture as "userPhoto", "activityLog"."userId" as id, sum("activityLog"."pointsEarnt") as "pointsEarnt"
                    FROM "activityLog"
                    INNER JOIN USERS
                        ON "activityLog"."userId" = users.id
                    WHERE "activityLog"."entityCountryId" = $1
                        AND "users".type = $2
                    GROUP BY "activityLog"."userId", users.username, users.picture
                    ORDER BY "pointsEarnt" DESC
                    LIMIT 12 OFFSET $3
                    `,
                    [id, userType, page*12]
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

}

module.exports = CountryModel;
