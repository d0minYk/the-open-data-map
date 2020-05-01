const Keys = require('../config/Keys.js');
const { Client } = require('pg');
const Dataset = require('../models/Dataset.js');
const Request = require('../models/Request.js');
const Location = require('../models/Location.js');

class EntityModel {

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

    // Return all dataset, locations and requests referenced from social actions
    static async getBulk(type1, type2, type3, type4, type5) {

        let all = [].concat(type1 || [], type2 || [], type3 || [], type4 || [], type5 || []);

        let locationIds = [];
        let requestIds = [];
        let datasetIds = [];

        for (let i = 0; i < all.length; i++) {
            if (all[i].entityType === "location") {
                locationIds.push(all[i].entityId);
            } else if (all[i].entityType === "dataset") {
                datasetIds.push(all[i].entityId);
            } else if (all[i].entityType === "request") {
                requestIds.push(all[i].entityId);
            }
        }

        let results = {
            location: [],
            dataset: [],
            request: [],
        }

        if (datasetIds.length !== 0) {
            results.dataset = await Dataset.getByIds(datasetIds, 0, 100);
        }

        if (locationIds.length !== 0) {
            results.location = await Location.getByIds(locationIds, 0, 100);
        }

        if (requestIds.length !== 0) {
            results.request = await Request.getByIds(requestIds, 0, 100);
        }

        return results

    }

}

module.exports = EntityModel;
