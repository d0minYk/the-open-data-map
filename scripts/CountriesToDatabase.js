const Country = require('../models/Country');
const City = require('../models/City');

const fs = require('fs');

let raw = fs.readFileSync('./scripts/countries.json');
let collection = JSON.parse(raw);

// console.log(collection)

init();

async function init() {

    for (country in collection) {

        // let newCountryId = await insertCountry(country);
        // console.log("Country inserted: " + country + "(" + newCountryId + ")");

        // collection[country] = [...new Set(collection[country])]
        // console.log( country + " " + collection[country].length, "==============")

        // for (i in collection[country]) {
        //     let city = collection[country][i];
        //     console.log(country + " " + city);
        //     let newCityId =  await insertCity(city, newCountryId);
        //     //console.log("City inserted: " + city + "(" + newCityId + ")");
        // }

        // console.log("=============")

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
