const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class TopicModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "key",
            "value"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Updates a statistic by its key
    static update(key, value) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`UPDATE statistics SET "value" = $2 WHERE key = $1`, [key, value] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Returns all statistics
    static get() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`SELECT key, value FROM statistics`, [] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

}

module.exports = TopicModel;
