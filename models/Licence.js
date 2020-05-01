const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class LicenceModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "name",
            "id",
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Returns all licences
    static get() {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`SELECT id, name, description FROM licences`, [] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

}

module.exports = LicenceModel;
