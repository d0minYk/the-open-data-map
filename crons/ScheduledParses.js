const cron = require('node-cron');
const hash = require('object-hash');
const Dataset = require('../models/Dataset');
const User = require('../models/User');
const Email = require('../models/Email');
const Location = require('../models/Location');
const Subscription = require('../models/Subscription');
const FileParser = require('../models/FileParser');
const Keys = require('../config/Keys.js');

let intervalSets = [];
let isScheduledParsesInProgress = false;

async function processScheduledParses() {

    // return;

    console.log("processScheduledParses()")

    if (isScheduledParsesInProgress) {
        return;
    }

    isScheduledParsesInProgress = true;

    console.log("==========SCHEDULED", intervalSets)

    let datasets = await Dataset.getScheduledExternalParses(intervalSets);

    if (datasets) {

        // Going over all scheduled parses
        for (let i = 0; i < datasets.length; i++) {

            try {

                let dataset = datasets[i];
                let errors = [];
                let fieldMappings = Dataset.getMappedFields(dataset.fields);
                let fileOutname = dataset.savedName
                let extension = fileOutname.split(".");
                extension = extension[extension.length-1];
                fileOutname = fileOutname.replace("." + extension, "");
                fileOutname += "-" + Math.round((new Date()).getTime()/1000);

                let user = await User.getById(dataset.userId).catch(function(e) { console.error("Failed get dataset owner", e); return reject({ code: 500, msg: "Failed to get owner" }); })

                if (!user) {
                    continue;
                }

                let changes = {
                    updated: [],
                    removed: [],
                    new: [],
                }

                console.log("Parsing " + (i+1) + " of " + (datasets.length) + " (" + dataset.id + ")" + extension, "Dataset name: " + dataset.name);

                let fileError = null;
                let file = await Dataset.saveFromURL(dataset.sourceURL, fileOutname, extension).catch(e => { fileError = e; console.error("failed to get file", e) });

                if (fileError && (fileError === "Couldn't find items in the provided XML file, make sure that the file follows standards" || fileError === "No discovered rows")) {
                    // Might be just a live data being empty... Next one
                    continue
                }

                // Missing file
                if (!file || !file.content) {
                    Email.send({
                        to: user.managed ? Keys.adminEmail : user.email,
                        subject: "Failed to parse dataset " + dataset.name,
                        content: `
                            We have failed to download your latest copy of <strong>${dataset.name}</strong> from <strong>${dataset.sourceURL}</strong>. <br />
                            Please make sure that the file exsists and publicly readable.
                        `,
                    })
                    continue
                }

                let uniqueIds = Dataset.getUniqueIds(file.content, fieldMappings.uniqueId);

                // Unique id collision, cannot proceed with certainity -> Email and abort
                if (!uniqueIds.success) {

                    console.error("Duplicate ids here, email and skip t next dataset: ", uniqueIds.data);

                    if (user && user.email) {

                        Email.send({
                            to: user.managed ? Keys.adminEmail : user.email,
                            subject: "Failed to parse dataset " + dataset.name,
                            content: `
                                ${uniqueIds.data} <br/>
                                In order to complete processing data please make sure the selected unique id fields are unique.
                            `,
                        })

                    }

                    continue;

                }

                uniqueIds = uniqueIds.data;

                let dbContent = await Location.getByDatasetId(dataset.id, false);

                let changeCount = 0;

                // Going over all the content we currently have in the database
                for (let j = 0; j < dbContent.length; j++) {

                    let dbLocation = dbContent[j];
                    let dbLocationUniqueId = dbLocation.uniqueId;

                    let urlLocationI = uniqueIds.indexOf(dbLocationUniqueId);

                    // Instance not found in the new document -> Must be deleted
                    if (urlLocationI === -1) {

                        console.log("-- Deleted: " + dbLocation.id);
                        changeCount++;
                        let deleteLocation = await Location.compileLocationObject(dbLocation.originalFields, dataset, fieldMappings, dataset.userId, dataset.id, dbLocationUniqueId, undefined, null)
                        let res = await Location.markDeleted(dbLocation.id, dbLocation.userId);

                        changes.removed.push(deleteLocation);

                    } else {

                        let urlLocation = file.content[urlLocationI];
                        let urlLocationHash = hash(urlLocation);
                        let dbLocationHash = hash(dbLocation.originalFields);

                        // Unique id match between the database and new file with different hash -> Must have changed
                        if (urlLocationHash !== dbLocationHash) {
                            console.log("-- Changed: " + dbLocation.id);
                            changeCount++;

                            let newLocation = await Location.compileLocationObject(urlLocation, dataset, fieldMappings, dataset.userId, dataset.id, dbLocationUniqueId, undefined, null)
                            if (newLocation.error) {
                                newLocation.isApproved = false;
                                errors.push({
                                    locationId: dbLocation.id,
                                    name: newLocation.name,
                                    datasetId: dataset.id,
                                    error: newLocation.error
                                })
                            } else {
                                changes.updated.push(newLocation);
                                newLocation.isApproved = true;
                                uniqueIds.push(newLocation.uniqueId)
                            }
                            let newLocationObj = new Location(newLocation);
                            newLocationObj.id = dbLocation.id;
                            let newLocationId = await newLocationObj.update().catch(e => { console.log(e); reject(e) })
                            console.log("Updated at " + newLocationId.id)
                        }

                    }

                    dbContent.splice(j, 1);
                    j--;

                    if (urlLocationI !== -1) {
                        // Removing as these have been processed
                        file.content.splice(urlLocationI, 1);
                        uniqueIds.splice(urlLocationI, 1);
                    }

                }

                // Any leftover file content are new insteances
                for (let j = 0; j < file.content.length; j++) {
                    let newLocation = await Location.compileLocationObject(file.content[j], dataset, fieldMappings, dataset.userId, dataset.id, undefined, true, null)
                    if (newLocation.error) {
                        newLocation.isApproved = false;
                        errors.push({
                            locationId: newLocation.uniqueId,
                            name: newLocation.name,
                            datasetId: dataset.id,
                            datasetName: dataset.name,
                            error: newLocation.error
                        })
                    } else {
                        newLocation.isApproved = true;
                    }
                    let newLocationObj = new Location(newLocation);
                    let newLocationId = await newLocationObj.create().catch(e => { console.log(e); reject(e) })
                    console.log("-- New: inserted at " + newLocationId)
                    changes.new.push(newLocationObj);
                    changeCount++;
                }

                // Some errors occursed, but these are minor, just an email about them
                if (errors.length !== 0) {

                    console.log("THERE were errors", errors);

                    let errorsDOM = "";

                    for (let j = 0; j < errors.length; j++) {
                        let error = errors[j]
                        errorsDOM += error.datasetName + " (" + error.datasetId + "): " + error.name + " - Error: " + error.error + "<br />";
                    }

                    let user = await User.getById(dataset.userId).catch(function(e) { console.error("Failed get dataset owner", e); return reject({ code: 500, msg: "Failed to get owner" }); });

                    if (user && user.email) {

                        Email.send({
                            to: user.managed ? Keys.adminEmail : user.email,
                            subject: "Failed to parse locations in " + errors[0].datasetName,
                            content: `
                                <strong>We have identified the following problem(s) in your dataset:</strong><br />
                                ${errorsDOM}
                                These location has been hidden on the Open Data Map, and will be visible again once the problems has been solved.
                            `,
                        })

                    }

                }

                let datasetUpdateObj = {
                    lastCheckForUpdates: new Date(),
                    id: dataset.id,
                    userId: dataset.userId,
                    queuedForNextScheduledWave: false,
                }

                // Updating the last updated dataset content because there was at least one change
                if (changeCount !== 0) {

                    datasetUpdateObj.locationupdatedat = new Date();

                    let users = await Subscription.getUsersByTypeEntity("DATASET_UPDATE", dataset.id);

                    if (users && users.length !== 0) {

                        for (let j = 0; j < users.length; j++) {
                            let email = users[j].email;
                            if (email) {
                                Email.sendDatasetUpdate(email, dataset, changes)
                            }
                        }

                    }

                    // console.log(changes, "END========!!!!!!!!!!!");

                }

                let datasetUpdate = new Dataset(datasetUpdateObj)
                // console.log(datasetUpdate, "UPDATE", datasetUpdateObj);
                await datasetUpdate.update().catch(e => { console.error("Failed to update dataset", e) });

            } catch(e) {
                console.error("Failed to parse", e);
            }

        }

    }

    console.log("END")

    isScheduledParsesInProgress = false;

    intervalSets = [];

}

// Every 5 mins
cron.schedule('*/5 * * * *', () => {

    // intervalSets = [];

    console.log("Parser Cron = Every 5 minutes");
    intervalSets.push("every 5 minutes")

    // return;

    // Let other crons populate the intervalSets
    setTimeout(function() {
        try {
            processScheduledParses();
        } catch (e) {
            console.log("Parser Cron = Failed", e);
        }
    }, 5000)

});

// intervalSets = ["every 5 minutes", "daily"]
// processScheduledParses();

// Every 10 mins
cron.schedule('*/10 * * * *', () => {
    console.log("Parser Cron = Every 10 minutes");
    intervalSets.push("every 10 minutes")
});

// Every 15 mins
cron.schedule('*/15 * * * *', () => {
    console.log("Parser Cron = Every 15 minutes");
    intervalSets.push("every 15 minutes")
});

// Every 30 mins
cron.schedule('*/30 * * * *', () => {
    console.log("Parser Cron = Every 30 minutes");
    intervalSets.push("every 30 minutes")
});

// Every 1 hour
cron.schedule('0 * * * *', () => {
    console.log("Parser Cron = Every 1 hour");
    intervalSets.push("every 1 hour")
});

// Every 2 hours
cron.schedule('0 */2 * * *', () => {
    console.log("Parser Cron = Every 2 hours");
    intervalSets.push("every 2 hours")
});

// Every 4 hours
cron.schedule('0 */4 * * *', () => {
    console.log("Parser Cron = Every 4 hours");
    intervalSets.push("every 4 hours")
});

// Every 8 hours
cron.schedule('0 */8 * * *', () => {
    console.log("Parser Cron = Every 8 hours");
    intervalSets.push("every 8 hours")
});

// Daily
cron.schedule('0 0 * * *', () => {
    console.log("Parser Cron = Daily");
    intervalSets.push("daily")
});

// Weekly (on Sunday 00:00) or bi-weekly
cron.schedule('0 0 * * 0', () => {
    console.log("Parser Cron = Weekly");
    intervalSets.push("weekly");
    // Bi-weekly todo
});

// Monthly (First day of month)
cron.schedule('0 0 1 * *', () => {
    console.log("Parser Cron = Monthly");
    intervalSets.push("monthly");
});
