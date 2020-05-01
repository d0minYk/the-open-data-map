const axios = require('axios');

init();

async function init() {

    console.log("CKAN Parser");

    let packageList = await axios.get('https://data.glasgow.gov.uk/api/action/package_list');
    console.log(packageList.data.result);

    for (let i = 0; i < packageList.data.result.length; i++) {

        let datasetId = packageList.data.result[i];
        console.log("Getting " + (i+1) + " of " + (packageList.data.result.length-1) + " (" + datasetId + ")");
        let packageDetails = await axios.get('https://data.glasgow.gov.uk/api/action/package_show?id=' + datasetId).catch(e => { console.error(e) });

        console.log(packageDetails.data.result.notes)

        let resources = packageDetails.data.result.resources;

        if (resources) {

            for (let j = 0; j < resources.length; j++) {
                console.log(resources[j].format + " " + resources[j].name + " " + resources[j].description)
            }

        }

        console.log("-----------")

    }

}

async function insertCountry(name) {

    let newCountry = new Country({
        name: country
    });

    return newCountry.create().then(id => {
        return id;
    }).catch(e => { console.error(e) })

}

async function insertCity(name, countryId) {

    let newCity = new City({
        name: name,
        countryId: countryId
    });

    return newCity.create().then(id => {
        return id;
    }).catch(e => { console.error(e) })

}
