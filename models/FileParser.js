const fs = require('fs');
const Utilities = require('../Utilities')

class fileParser {

    // Parses a file basd on the extension
    static async parse(fileName, extension, pathToItems) {

        let file = {};
        let fields = [];

        if (extension) {
            extension = extension.toLowerCase();
        }

        switch (extension) {

            case "csv":
                file = await this.parseCSV(fileName)
                return file;
                break;

            case "xlsx":
                file = await this.parseXLSX(fileName);
                return file;
                break;

            case "kml":
                file = await this.parseKML(fileName);
                return file;
                break;

            case "kmz":
                file = await this.parseKMZ("fix-" + fileName);
                return file;
                break;

            case "geojson":
                file = await this.parseGeoJSON(fileName);
                return file;
                break;

            case "txt":
            case "json":
                file = await this.parseJSON(fileName);
                return file;
                break;

            // Only one file input is provided so need to upload in the general shape zip format
            case "shp":
            case "dbf":
            case "sbn":
            case "sbx":
            case "shx":
            case "prj":
                throw "Please upload a zip file containing both the .shp and .dbf file";
                return null;

            // Assume it's shape
            case "zip":
                file = await this.parseShape(fileName);
                return file;
                break;

            case "xml":
            // XML might be stored with different extensions or server scripting files, using this as fallback, like: https://trafficscotland.org/rss/feeds/currentincidents.aspx
            default:
                file = await this.parseXML(fileName, pathToItems);
                return file;
                break;

        }

    }

    // Returns repeating values of a dataset
    static getRepeatingValues(content) {

        let repeatingValues = {};

        if (content && content.rss && content.rss.channel && content.rss.channel.item && content.rss.channel.item[0]) {
            content = content.rss.channel.item;
        }

        if (content && content.length !== 0) {

            for (let i = 0; i < content.length; i++) {

                let row = content[i];

                for (let key in row) {

                    if (!repeatingValues[key]) {
                        repeatingValues[key] = {}
                    }

                    let fieldValueFull = row[key];

                    if (fieldValueFull && typeof fieldValueFull === "string" && fieldValueFull.trim() && fieldValueFull !== "null" && fieldValueFull !== "undefined" && fieldValueFull !== "-") {

                        let fieldValueFullArr = fieldValueFull.split(/\r\n|\r|\n/g);

                        for (let j = 0; j < fieldValueFullArr.length; j++) {
                            let fieldValueOption = fieldValueFullArr[j];
                            if (!repeatingValues[key][fieldValueOption]) {
                                repeatingValues[key][fieldValueOption] = 0
                            }
                            repeatingValues[key][fieldValueOption]++
                        }

                    }

                }

            }

        }

        let suggestions = [];

        for (let key in repeatingValues) {
            let field = repeatingValues[key];
            for (let option in field) {
                if (field[option] > 4 && option.length > 0) {
                    suggestions.push({
                        count: field[option],
                        value: option,
                        field: key,
                    })
                }
            }
        }

        return suggestions.sort((a, b) => {
            return (a.count < b.count) ? 1 : -1
        });

    }

    // Returns the root target elements of a file
    static reduceToTargetNestedObjects(pathToObjectsArray, allPaths) {
        if (Array.isArray(allPaths)) {
            for (let i = 0; i < allPaths.length; i++) {
                if (allPaths[i].indexOf(pathToObjectsArray) === -1) {
                    allPaths.splice(i, 1);
                    i--;
                } else {
                    allPaths[i] = allPaths[i].replace(pathToObjectsArray + ".", "").replace(pathToObjectsArray, "");
                }
            }
            return allPaths;
        }
        return [];
    }

    // Parses a shape file
    static async parseShape(fileName) {

        return new Promise(function(resolve, reject) {

            const shapefile = require("shapefile");
            const unzip = require("unzip")

            fs
                .createReadStream('./uploads/datasets/' + fileName)
                .pipe(unzip.Extract({ path: './uploads/datasets/' + fileName.replace(".zip", "") }))

            let MAX_ITERATIONS = 20;
            let i = 0;

            // Callback for unzip.Extract is not working, so must repeatedly check whether we have all the needed files extracted already, failing after MAX_ITERATIONS
            let interval = setInterval(function() {

                i++;

                fs.readdir('./uploads/datasets/' + fileName.replace(".zip", ""), function (err, files) {

                    if (err) {
                        clearInterval(interval);
                        return reject("Failed to parse files " + err)
                    }

                    let shpFile, dbfFile;

                    files.forEach(function (file) {

                        if (file.endsWith(".shp")) {
                            shpFile = file;
                        } else if (file.endsWith(".dbf")) {
                            dbfFile = file;
                        }

                    });

                    if (!shpFile) {
                        if (i > MAX_ITERATIONS) {
                            clearInterval(interval);
                            return reject("SHP file is not found.")
                        } else {
                            // SHP file not found, but keep trying
                            return;
                        }
                    }

                    if (!dbfFile) {
                        if (i > MAX_ITERATIONS) {
                            clearInterval(interval);
                            return reject("DBF file is not found.")
                        } else {
                            // DBF file not found, but keep trying
                            return;
                        }
                    }

                    let content = []

                    shapefile
                        .open('./uploads/datasets/' + fileName.replace(".zip", "") + "/" + shpFile, './uploads/datasets/' + fileName.replace(".zip", "") + "/" + dbfFile)
                        .then(source => source.read()
                        .then(function log(result) {
                            if (result.done) return;
                            content.push(result.value)
                            return source.read().then(log);
                        })).then(function log() {

                            let fields = ["geometry"];

                            for (let key in content[0].properties) {
                                fields.push(key);
                            }

                            for (var i = 0; i < content.length; i++) {
                                let row = content[i];
                                content[i] = row.properties;
                                content[i].geometry = row.geometry;
                            }

                            clearInterval(interval);

                            return resolve({
                                fields: fields,
                                content: content,
                                format: 'shp'
                            })

                        })
                        .catch(function(err) {
                            console.error(err);
                            clearInterval(interval);
                            return reject("Failed to parse Shape file")
                        });

                });

            }, 1000);

        })

    }

    // Parses an XML files
    static async parseXML(fileName, itemsWithPath) {

        return new Promise(function(resolve, reject) {

            let pathToItems = null;

            // https://stackoverflow.com/questions/47062922/how-to-get-all-keys-with-values-from-nested-objects
            const keyify = (obj, prefix = '') =>
                Object.keys(obj).reduce((res, el) => {
                if (Array.isArray(obj[el])) {

                    let arr = obj[el];

                    if (!pathToItems) {
                        pathToItems = prefix + el;
                    }

                    if (typeof arr[0] === 'object' && arr[0] !== null) {
                        return [...res, , prefix + el, ...keyify(obj[el][0], prefix + el + '.')];
                    } else {
                        return res;
                    }

                } else if (typeof obj[el] === 'object' && obj[el] !== null) {
                    return [...res, ...keyify(obj[el], prefix + el + '.')];
                } else {
                    return [...res, prefix + el];
                }
            }, []);

            const xmlParser = require('xml2json');

            fs.readFile('./uploads/datasets/' + fileName, function(err, data) {

                if (err) {
                    return reject(err);
                }

                let content;

                try {
                    content = xmlParser.toJson(data, { object: true, });
                } catch (e) {
                    return reject("Failed to parse file")
                }

                if (content && content.rss && content.rss.channel && content.rss.channel.item && !content.rss.channel.item[0]) {
                    content.rss.channel.item = [content.rss.channel.item]
                }

                let paths = Utilities.removeFalselyElements(keyify(content));

                if (!content) {
                    return reject("Empty file");
                }

                if (!pathToItems) {
                    return reject("Couldn't find items in the provided XML file, make sure that the file follows standards");
                }

                let nestedObjectPaths = Utilities.removeFalselyElements(this.reduceToTargetNestedObjects(pathToItems, paths));

                if ( (!nestedObjectPaths) || (nestedObjectPaths.length === 0) ) {
                    return reject("No discovered fields");
                }

                if (itemsWithPath) {
                    console.log("@@@@@@@ Return custom path's content")
                    content = this.resolveNestedObjectField(content, itemsWithPath);
                } else if (pathToItems) {
                    console.log("@@@@@@@ Return automatically found path's content")
                    content = this.resolveNestedObjectField(content, pathToItems);
                }

                resolve({
                    pathToItems: pathToItems,
                    fields: paths,
                    content: content,
                    format: 'xml'
                })

            }.bind(this));

        }.bind(this))

    }

    // Return the value of the given nested field
    static resolveNestedObjectField(obj, path) {

        obj = JSON.parse(JSON.stringify(obj))

        if (!path) {
            return null;
        }

        path = path.split(".");

        for (let i = 0; i < path.length; i++) {
            if (path[i] && obj)
                obj = obj[path[i]]
            else
                return "";
        }

        return obj;

    }

    // Parses a JSON file
    static async parseJSON(fileName) {

        return new Promise(function(resolve, reject) {

            // https://stackoverflow.com/questions/47062922/how-to-get-all-keys-with-values-from-nested-objects
            const keyify = (obj, prefix = '') =>
                Object.keys(obj).reduce((res, el) => {
                if (Array.isArray(obj[el])) {
                    if (typeof obj[el][0] === 'object' && obj[el][0] !== null) {
                        return [...res, , prefix + el, ...keyify(obj[el][0], prefix + el + '.')];
                    } else {
                        return res;
                    }
                } else if (typeof obj[el] === 'object' && obj[el] !== null) {
                    return [...res, ...keyify(obj[el], prefix + el + '.')];
                } else {
                    return [...res, prefix + el];
                }
            }, []);

            let raw = fs.readFileSync('./uploads/datasets/' + fileName);
            let content = JSON.parse(raw);

            if ( (!content) || (!content[0]) ) {
                return reject("No discovered fields, make sure that the entities are in root level");
            }

            let paths = Utilities.removeFalselyElements(keyify(content[0]));

            if ( (!paths) || (paths.length === 0) ) {
                return reject("No discovered fields");
            }

            resolve({
                fields: paths,
                content: content,
                format: 'json'
            })

        })

    }

    // Parses a GeoJSON file
    static async parseGeoJSON(fileName) {

        return new Promise(function(resolve, reject) {

            let raw = fs.readFileSync('./uploads/datasets/' + fileName);
            let content = JSON.parse(raw);

            let fields = ["geometry"];

            for (let key in content.features[0].properties) {
                fields.push(key);
            }

            for (var i = 0; i < content.features.length; i++) {
                let row = content.features[i];
                content.features[i] = row.properties;
                content.features[i].geometry = row.geometry;
            }

            resolve({
                fields: fields,
                content: content.features,
                format: 'geojson'
            })

        })

    }

    // Parses a KML file
    static async parseKML(fileName) {

        return new Promise(function(resolve, reject) {

            const parseKML = require('parse-kml');

            parseKML
                .toJson('./uploads/datasets/' + fileName)
                .then((content) => {

                    let fields = ["geometry"];

                    for (let key in content.features[0].properties) {
                        fields.push(key);
                    }

                    for (var i = 0; i < content.features.length; i++) {
                        let row = content.features[i];
                        content.features[i] = row.properties;
                        content.features[i].geometry = row.geometry;
                    }

                    resolve({
                        fields: fields,
                        content: content.features,
                        format: 'kml'
                    })

                })
                .catch(function(e) { console.error("Failed to parse KML", e); reject("Failed to parse KML") })

        })

    }

    // Parses a KMZ file
    static async parseKMZ(fileName) {

        const parseKMZ = require('parse-kmz');

        return new Promise(function(resolve, reject) {

            parseKMZ
                .toJson('./uploads/datasets/' + fileName)
                .then((content) => {
                    let fields = ["geometry"];
                    for (let key in content.features[0].properties) {
                        fields.push(key);
                    }
                    for (var i = 0; i < content.features.length; i++) {
                        let row = content.features[i];
                        content.features[i] = row.properties;
                        content.features[i].geometry = row.geometry;
                    }
                    resolve({
                        fields: fields,
                        content: content.features,
                        format: 'kmz'
                    })
                })
                .catch(function(e) { console.error("Failed to parse KMZ", e); reject("Failed to parse KMZ") })

        })

    }

    // Parses an XLSX file
    static async parseXLSX(fileName) {

        return new Promise(function(resolve, reject) {

            const readXlsxFile = require('read-excel-file/node');

            readXlsxFile('./uploads/datasets/' + fileName).then((content) => {

                if ( (!content) || (!content[1]) ) {
                    return reject("No discovered fields, make sure that your files contains at least one row of data");
                }

                let fields = content[0];

                for (let i = 1; i < content.length; i++) {
                    let row = content[i];
                    content[i] = {}
                    for (var j = 0; j < fields.length; j++) {
                        content[i][fields[j]] = row[j]
                    }
                }

                resolve({
                    content: content,
                    fields: fields,
                    format: 'xlsx'
                })

            }).catch(function(e) { console.error("Failed to parse XLSX", e); reject("Failed to parse XLSX") })

        })

    }

    // Parses a CSV file
    static async parseCSV(fileName) {

        return new Promise(function(resolve, reject) {

            const csv = require('csv-parser');
            let content = [];

            fs.createReadStream('./uploads/datasets/' + fileName)
                .pipe(csv())
                .on('data', (row) => {
                    content.push(row);
                })
                .on('end', () => {

                    if ( (!content) || (!content[0]) ) {
                        return reject("No discovered rows");
                    }

                    let fields = [];
                    for (let key in content[0]) {
                        fields.push(key);
                    }

                    if ( (!fields) || (fields.length === 0) ) {
                        return reject("No discovered fields");
                    }

                    resolve({
                        content: content,
                        fields: fields,
                        format: 'csv'
                    })

                })
                .on('error', (err) => {
                    console.error("Failed to parse CSV", e);
                    reject("Failed to parse CSV");
                });

        })

    }

}

module.exports = fileParser;
