const Keys = require('../config/Keys.js');
const FileParser = require('../models/FileParser.js');
const QueryParser = require('../models/QueryParser.js');
const User = require('../models/User.js');
const ActivityLog = require('../models/ActivityLog.js');
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Client } = require('pg');

class SocialModel {

    static getClient() { return new Client(Keys.postgres); }
    getClient() { return new Client(Keys.postgres); }

    // Merges entities (dataset, locations, requests) with social actions (like, comment, report, request, rating)
    static mergeEntitiesWithStats(entities, stats) {

        for (let i = 0; i < entities.length; i++) {
            for (let j = 0; j < stats.length; j++) {
                let action = stats[j];
                if (entities[i].id === action.id) {
                    let entityType = action.type + "s";
                    if (!entities[i][entityType]) {
                        entities[i][entityType] = [];
                    }
                    let actionRow = stats.splice(j, 1)[0]
                    entities[i][entityType].push({
                        userId: actionRow.userId,
                        rating: (entityType === "ratings") ?  actionRow.custom : null
                    })
                    j--;
                }
            }
        }

        return entities

    }

    // Returns social the social actions of the given user
    static getByUserId(table, userId, direction, page) {

        const client = this.getClient();
        client.connect();

        return new Promise(function(resolve, reject) {

            client
                .query(
                    `
                        SELECT ${table}.*, users.username AS username, users.picture as "userPhoto"
                        FROM "${table}"
                        INNER JOIN users
                        ON ${table}."userId" = users.id
                        WHERE ${(direction === "inbox") ? `"entityUserId"` : `"userId"`} = $1
                        GROUP BY 1, users.username, users.picture
                        ORDER BY id DESC
                        LIMIT ${12} OFFSET ${page*12}
                    `,
                    [userId]
                )
                .then(async res => { client.end(); resolve(res.rows) })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

    // Returns all social actions for the given (multiple) entites
    static async getByEntityIds(direction, type1, type2, type3, type4, type5, type6, type7, type8) {

        let all = [].concat(type1 || [], type2 || [], type3 || [], type4 || [], type5 || [], type6 || [], type7 || [], type8 || []);

        let res = {}
        let whereQuery = "";

        for (let i = 0; i < all.length; i++) {
            let allI = all[i];
            res[allI.entityType + "-" + allI.entityId] = { likes: [], comments: [], reports: [], ratings: [], shares: [] }
            whereQuery += ` ("entityType" = '${allI.entityType}' AND "entityId" = ${allI.entityId}) `
            if (all.length - 1 !== i)
                whereQuery += " OR "
        }

        const client = this.getClient();
        client.connect();

        let actions = {};

        if (whereQuery) {
            actions = {
                likes: (await client.query(`SELECT * FROM likes WHERE ${whereQuery} ORDER BY id DESC`, []).catch(e => { console.error("Failed to get likes", e) })),
                comments: (await client.query(`SELECT * FROM comments WHERE ${whereQuery} ORDER BY id DESC`, []).catch(e => { console.error("Failed to get comments", e) })),
                ratings: (await client.query(`SELECT * FROM ratings WHERE ${whereQuery} ORDER BY id DESC`, []).catch(e => { console.error("Failed to get ratings", e) })),
                reports: (await client.query(`SELECT * FROM reports WHERE ${whereQuery} ORDER BY id DESC`, []).catch(e => { console.error("Failed to get reports", e) })),
                shares: (await client.query(`SELECT * FROM shares WHERE ${whereQuery} ORDER BY id DESC`, []).catch(e => { console.error("Failed to get shares", e) })),
            }
        }

        actions.likes = (actions.likes && actions.likes.rows) ? actions.likes.rows : [];
        actions.comments = (actions.comments && actions.comments.rows) ? actions.comments.rows : [];
        actions.ratings = (actions.ratings && actions.ratings.rows) ? actions.ratings.rows : [];
        actions.reports = (actions.reports && actions.reports.rows) ? actions.reports.rows : [];
        actions.shares = (actions.shares && actions.shares.rows) ? actions.shares.rows : [];

        for (let entityTypeIdHash in res) {
            for (let actionType in actions) {
                let parts = entityTypeIdHash.split("-");
                res[entityTypeIdHash][actionType] = actions[actionType].filter(item => item.entityId === parseInt(parts[1]) && item.entityType === parts[0]);
            }
        }

        client.end();

        return res;

    }

    // Returns all social media stats if the given entities
    static getStats(type, ids) {

        return new Promise(function(resolve, reject) {

            const client = this.getClient(); client.connect();

            let singular = type;
            let plural = type + "s"

            client
                .query(
                    `
                            SELECT ${plural}.id as "id", comments."userId" as "userId", 'comment' as "type", 0 as "custom"
                            FROM ${plural}
                            LEFT JOIN comments  ON comments."entityId" = ${plural}.id
                            WHERE (comments."entityType" = '${singular}')
                            AND (${plural}.id IN (${ids.join(",")}))
                        UNION
                            SELECT ${plural}.id as "id", likes."userId" as "userId", 'like' as "type", 0 as "custom"
                            FROM ${plural}
                            LEFT JOIN likes  ON likes."entityId" = ${plural}.id
                            WHERE (likes."entityType" = '${singular}')
                            AND (${plural}.id IN (${ids.join(",")}))
                        UNION
                            SELECT ${plural}.id as "id", shares."userId" as "userId", 'share' as "type", 0 as "custom"
                            FROM ${plural}
                            LEFT JOIN shares  ON shares."entityId" = ${plural}.id
                            WHERE (shares."entityType" = '${singular}')
                            AND (${plural}.id IN (${ids.join(",")}))
                        UNION
                            SELECT ${plural}.id as "id", ratings."userId" as "userId", 'rating' as "type", ratings.rating as "custom"
                            FROM ${plural}
                            LEFT JOIN ratings  ON ratings."entityId" = ${plural}.id
                            WHERE (ratings."entityType" = '${singular}')
                            AND (${plural}.id IN (${ids.join(",")}))
                        UNION
                            SELECT ${plural}.id as "id", reports."userId" as "userId", 'report' as "type", 0 as "custom"
                            FROM ${plural}
                            LEFT JOIN reports  ON reports."entityId" = ${plural}.id
                            WHERE (reports."entityType" = '${singular}')
                            AND (${plural}.id IN (${ids.join(",")}))
                    `,
                    []
                )
                .then(res => { client.end(); resolve(res.rows); })
                .catch(e => { client.end(); reject(e.stack); })

        }.bind(this))

    }

}

module.exports = SocialModel;
