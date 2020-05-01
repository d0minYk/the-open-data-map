const Keys = require('../config/Keys.js');
const { Client } = require('pg');

class SubscriptionModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "type", // DATASET_CHANGE
            "userId",
            "entityId",
            "createdat"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Subscribes the user to a dataset's updates
    static insert(type, userId, entityId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`INSERT INTO subscriptions ("type", "userId", "entityId") VALUES($1, $2, $3)`, [type, userId, entityId] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Unsubscribes the user from a dataset's updates
    static delete(type, userId, entityId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`DELETE FROM subscriptions WHERE type= $1 AND "userId"= $2 AND "entityId" = $3`, [type, userId, entityId] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Returns whether a user is susbcribed to a dataset's updates
    static getByTypeEntityUser(type, entityId, userId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`SELECT id FROM subscriptions WHERE type= $1 AND "userId"= $2 AND "entityId" = $3`, [type, userId, entityId] )
                .then(res => { client.end(); resolve(res.rows ? res.rows[0] : null) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

    // Returns all users subscribed to a dataset's updates
    static getUsersByTypeEntity(type, entityId) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(`
                    SELECT users.email as email
                    FROM subscriptions
                    INNER JOIN users
                    ON subscriptions."userId" = users.id
                    WHERE subscriptions.type= $1
                    AND subscriptions."entityId" = $2
                `, [type, entityId] )
                .then(res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack) })

        }.bind(this))

    }

}

module.exports = SubscriptionModel;
