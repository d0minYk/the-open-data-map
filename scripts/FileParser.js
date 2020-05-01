const fs = require('fs');

// parseCSV();
// parseXLSX();
// parseXML();
// parseKML();
// TODO ///////////////////////parseKMZ();
// parseGML(); ////////////////////// maybe not
/// parseShape();
// parseGeoJSON();
// PARSEJSON();

function parseGeoJSON() {

    console.log("Pasing GeoJSON");

    let raw = fs.readFileSync('./scripts/files/litter201501.geojson');
    let collection = JSON.parse(raw);

    console.log(collection.features[0].geometry)

}

function parseCSV() {

    console.log("Pasing CSV");

    const csv = require('csv-parser');
    let content = [];

    fs.createReadStream('./scripts/files/bottlebanksdata.csv')
        .pipe(csv())
        .on('data', (row) => {
            content.push(row);
        })
        .on('end', () => {
            console.log('CSV file successfully processed', content.length);
        });

}

function parseXLSX() {

    console.log("Pasing XLSX");

    const readXlsxFile = require('read-excel-file/node');

    readXlsxFile('./scripts/files/community_asset_register_v1_2-1.xlsx').then((content) => {
      console.log(content[0], content.length-1)
    })

}

function parseXML() {

    console.log("Pasing XML");
    // npm config set python python2.7 && npm install

    const xmlParser = require('xml2json');

    fs.readFile( './scripts/files/currentincidents.xml', function(err, data) {
        let content = xmlParser.toJson(data, {
            object: true,
        });
        // console.log(content.rss.channel.item);
        // console.log(content);
     });

     fs.readFile( './scripts/files/FHRS508en-GB.xml', function(err, data) {
         let content = xmlParser.toJson(data, {
             object: true,
         });
         let path = ["FHRSEstablishment", "EstablishmentCollection"];
         let items = content[path[0]][path[1]];
         console.log(items);
      });

}

function parseKML() {

    console.log("Pasing KML");

    const parseKML = require('parse-kml');

    parseKML
        .toJson('./scripts/files/recycling_centres.kml')
        .then((d) => {
            // console.log(d.features[0].properties)
            // console.log(d.features[0].geometry.type) // Point
            // console.log(d.features[0].geometry.coordinates) // [ -2.49614215894259, 57.053161863665, 0 ]
        })
        .catch(console.error);

}

function parseKMZ() {

    console.log("Pasing KMX");

    const parseKMZ = require('parse-kmz');

    // parseKMZ
    //     .toJson('./scripts/files/grit_bins.kmz')
    //     .then((d) => {
    //         // console.log(d.features[0].geometry.type) // Point
    //         console.log(d.features[0].geometry.coordinates) // [ -2.49614215894259, 57.053161863665, 0 ]
    //     })
    //     .catch(console.error);
    //
    // parseKMZ
    //     .toJson('./scripts/files/aberdeenshire_cycle_routes.kmz')
    //     .then((d) => {
    //         // console.log(d.features[0].geometry.type) //  GeometryCollection
    //         // console.log(d.features[0].geometry.geometries[0].type); // LineString
    //         console.log(d.features[0].geometry.geometries[0].coordinates); // [ [ -2.18715024538001, 57.0874997109, 0 ],
    //     })
    //     .catch(console.error);

    parseKMZ
        .toJson('./scripts/files/c52995ddeebb7db7b8f8a433387f4a33.aberdeenshire_LDP17_greenbelt.kmz')
        .then((d) => {
            // console.log(d.features[0].geometry.type) //  GeometryCollection
            // console.log(d.features[0].geometry.geometries[0].type); // Polygon
            console.log(d); // [ [ [ -2.0924667962768, 57.0719505633707, 0 ],
        })
        .catch(console.error);

}

function parseShape() {

    console.log("Pasing Shape");

    const shapefile = require("shapefile");

    let content = [];

    shapefile
        .open("./scripts/files/WFD_London/WFD_London.shp", "./scripts/files/WFD_London/WFD_London.dbf")
        .then(source => source.read()
        .then(function log(result) {
          if (result.done) return;
          // console.log(result.value, "+=======");
          content.push(result.value)
          return source.read().then(log);
        })).then(function log() {
         console.log(content[0])
        })
        .catch(error => console.error(error.stack));

}
