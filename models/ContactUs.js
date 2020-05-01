const nodemailer = require('nodemailer');
const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class ContactUsModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "userId",
            "email",
            "reason",
            "email",
            "createdat"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Saving a contact us form information
    static save(args) {

        const client = this.getClient(); client.connect();

        let query = `
            INSERT INTO "contactUs"
                ("userId", "email", "reason", "body")
            VALUES
                ($1, $2, $3, $4)
        `
        let params = [args.userId, args.email, args.reason, args.body];

        return new Promise(function(resolve, reject) { client.query(query, params).then(res => { client.end(); resolve(res.rows); }).catch(e => { client.end(); reject(e.stack); }) }.bind(this))

    }

}

module.exports = ContactUsModel;
