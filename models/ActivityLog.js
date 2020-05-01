const Keys = require('../config/Keys.js');
const User = require('../models/User.js');
const { Client } = require('pg');

// Points actions earn
const TYPE_ACTION_POINTS = {
    "LOCATION": {
        "CREATE": 20,
        "UPDATE": 0,
        "DELETE": 0,
    },
    "DATASET": {
        "CREATE": 0,
        "UPDATE": 0,
        "DELETE": 0,
        "LOCATION_UPDATE": 0,
        "PUBLISH": 0
    },
    "LIKE": {
        "CREATE": 0,
        "DELETE": 0,
    },
    "COMMENT": {
        "CREATE": 2,
        "UPDATE": 0,
        "DELETE": 0,
    },
    "REPORT": {
        "CREATE": 10,
        "UPDATE": 0,
        "DELETE": 0,
    },
    "RATING": {
        "CREATE": 5,
        "UPDATE": 0,
        "DELETE": 0,
    },
    "SHARE": {
        "CREATE": 2,
    },
    "REQUEST": {
        "CREATE": 0,
        "UPDATE": 0,
        "RELEASE": 500,
    },
}

// Ranks and minimum points needed for them
const RANKS = [
    {
        name: "rookie",
        minPoints: 0,
    },
    {
        name: "expert",
        minPoints: 200,
    },
    {
        name: "warrior",
        minPoints: 1000,
    },
    {
        name: "knight",
        minPoints: 5000,
    },
    {
        name: "royalty",
        minPoints: 10000,
    },

]

class ActivityModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    constructor(args) {

        const paramNames = [
            "id",
            "type",
            "action",
            "userId",
            "entityId",
            "entityCityId",
            "entityCountryId",
            "entityType",
            "pointsEarnt",
            "meta",
            "date",
            "relatedEntityId",
            "entityUserId"
        ];

        paramNames.forEach((paramName, i) => {
          if (args[paramName])
            this[paramName] = args[paramName];
        });

    }

    // Saving a new activity to the database
    static log(args) {

        return new Promise(async function(resolve, reject) {

            const client = this.getClient();
            client.connect();

            let actions = TYPE_ACTION_POINTS[args.type];

            if (!actions) {
                return resolve("Unknown Type");
            }

            let pointsEarnt = actions[args.action];

            if (pointsEarnt === undefined) {
                return resolve("Unknown Action");
            }

            let query = `
                INSERT INTO "activityLog"
                    ("type", "action", "userId", "entityId", "relatedEntityId", "entityUserId", "entityCityId", "entityCountryId", "entityType", "pointsEarnt", "meta")
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
            `
            let params = [args.type, args.action, args.userId, args.entityId, args.relatedEntityId || null, args.entityUserId || null, args.entityCityId, args.entityCountryId, args.entityType || null, pointsEarnt, args.meta || null];

            let res = await client.query(query, params).then(d => { client.end(); }).catch(e => { client.end(); console.error("Failed to log activity", e); return resolve(e); });

            if (pointsEarnt !== 0) {

                let user = await User.getById(args.userId, "points, rank").catch(function(e) { console.error("Failed to get user", e) })

                if (!user) {
                    return resolve();
                }

                let userRank = user.rank;
                let points = user.points || 0;
                points += pointsEarnt;

                for (let i = RANKS.length-1; i > 0; i--) {
                    let rank = RANKS[i];
                    if (rank.minPoints <= points) {
                        // Ranking up the user
                        if (userRank !== rank.name) {
                            userRank = rank.name
                        }
                        break;
                    }
                }

                res = await User.updateById(args.userId, {
                    points: points,
                    rank: userRank
                }).catch(function(e) { console.error("Failed to update user", e) })

                resolve();

            }

            return resolve();

        }.bind(this))

    }

}

module.exports = ActivityModel;
