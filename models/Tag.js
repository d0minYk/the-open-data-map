const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class TagModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "name",
            "id",
            "type",
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Inserts a tag
    save() {

        return new Promise(function(resolve, reject) {

            if (!this.name) {
                return resolve();
            }

            const client = this.getClient();
            client.connect();

            console.log("INSERTING Tag: " + this.name, this.type);
            this.name = this.name.toLowerCase();

            client.query(
                `
                    SELECT id FROM tags
                    WHERE LOWER(name) = $1 AND type = $2
                    LIMIT 1
                `,
                [this.name, this.type]
            ).then(res => {

                if (res.rows[0]) {

                    client.end()
                    resolve(res.rows[0])

                } else {

                    client
                        .query(
                            `
                                INSERT INTO tags ("name", "type")
                                VALUES ($1, $2)
                                RETURNING *
                            `,
                            [this.name, this.type]
                        )
                        .then(res => {
                            client.end()
                            console.log("NEw cat saved at " + res.rows[0].id)
                            resolve(res.rows[0])
                        })
                        .catch(e => {
                            client.end()
                            reject(e.stack)
                        })

                }


            })
            .catch(e => {
                client.end()
                reject(e.stack)
            })

        }.bind(this))

    }

    // Returns all tags
    static get() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                    SELECT name, type, sum(count), max(features) as features from tags
                    GROUP BY name, type
                    `,
                    []
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

    // Returns all tags in a city
    static getByCityId(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`SELECT * FROM tags WHERE "cityId" = $1 ORDER BY type ASC, count DESC`, [id] )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all tags in a country
    static getByCountryId(id) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT tags.name, tags.type, sum(count) as "count"
                    FROM tags
                    WHERE "countryId" = $1
                    GROUP BY tags.name, tags.type, tags."countryId"
                    ORDER BY type ASC, "count" DESC
                `, [id])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns the top categories across all countries
    static getTopCategories() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT tags.name, tags.type, sum(count) as "count"
                    FROM tags
                    GROUP BY tags.name, tags.type
                    ORDER BY type ASC, "count" DESC
                    LIMIT 50
                `, [])
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

}

module.exports = TagModel;
