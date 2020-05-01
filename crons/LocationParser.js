const Geocoder = require('../models/Geocoder');
const Location = require('../models/Location');
const Tag = require('../models/Tag');
const Dataset = require('../models/Dataset');
const Email = require('../models/Email');
const Keys = require('../config/Keys');
const FileParser = require('../models/FileParser');

setTimeout(function() {
    startLocationParser();
}, 2000);

async function startLocationParser() {

    // Getting all queued parses
    let dataset = await Dataset.getQueued();

    if (dataset) {

        await parseDataset(dataset);
        startLocationParser();

    } else {

        setTimeout(function() {
            startLocationParser();
        }, 10000)

    }

}

// Parses a dataset
async function parseDataset(dataset) {

    // return;

    return new Promise(async function(resolve, reject) {

        console.log("==========processing parses==========", dataset.id);

        let fieldMappings = Dataset.getMappedFields(dataset.fields);
        let userId = dataset.userId;
        let id = dataset.id

        let parsedLocations = await Location.getAllFromDataset(id).catch(e => { reject(e) })

        let uniqueIds = []

        // First time parse, inserting all to database
        if (parsedLocations.length === 0) {

            console.log("First time parse or complete reparse - getting from file")

            if (dataset.pathToFile) {

                let file = await FileParser.parse(dataset.pathToFile, dataset.format, dataset.pathToItems);

                for (let i = 0; i < file.content.length; i++) {

                    // console.log(file.content[i]);

                    let newLocation = await Location.compileLocationObject(file.content[i], dataset, fieldMappings, userId, id, null, false, uniqueIds, null, null, i);
                    // First time add, cannot be approved
                    newLocation.isApproved = false;

                    // Adding to uniqueIds so cannot use this again
                    if (newLocation.uniqueId) uniqueIds.push(newLocation.uniqueId);

                    let newLocationObj = new Location(newLocation);
                    let newLocationId = await newLocationObj.create().catch(e => { console.log("Dataset parsing error", e); })
                    console.log(i + " inserted at " + newLocationId)

                }

            }

        } else {
        // Not first time, use the record's originalFields for reference

            for (let i = 0; i < parsedLocations.length; i++) {

                let entityFull = null;

                if (parsedLocations[i].datasetDefaultOverrides) {
                    entityFull = {}
                    entityFull.datasetDefaultOverrides = parsedLocations[i].datasetDefaultOverrides
                    entityFull.originalFields = parsedLocations[i].originalFields
                }

                let newLocation = await Location.compileLocationObject(parsedLocations[i].originalFields, dataset, fieldMappings, userId, id, null, false, uniqueIds, null, entityFull, i);
                newLocation.id = parsedLocations[i].id;
                // Reparsing, might be already approved
                newLocation.isApproved = parsedLocations[i].isApproved;
                // Cannot be approved if error occured TODO report this is already approved
                if (newLocation.error) newLocation.isApproved = false;

                if (newLocation.uniqueId) uniqueIds.push(newLocation.uniqueId);

                if (entityFull) {
                    newLocation.datasetDefaultOverrides = entityFull.datasetDefaultOverrides;
                    newLocation.originalFields = entityFull.originalFields;
                }

                let newLocationObj = new Location(newLocation);
                let newLocationId = await newLocationObj.update().catch(e => { console.log(e); reject(e) })
                console.log(i + " updated at " + newLocation.id)

            }

        }

        // Sending email about the first parse
        Email.send({
            to: dataset.managed ? Keys.adminEmail : dataset.email,
            subject: "The parsing of " + dataset.name + " has finished.",
            content: `
                The parsing of ${dataset.name} has finished and is now ready to be published.
            `,
            actionButton: {
                title: "Review",
                link: Keys.domainName + "dataset/progress/" + dataset.id
            }
        })

        console.log("FINISHED PROCESSING")
        await Dataset.dequeue(id);
        startLocationParser();

    })

}
