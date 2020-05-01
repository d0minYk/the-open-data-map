const Geocoder = require('../models/Geocoder.js');

init();

/*

Issues

Including the name in the geocoding might return united states even if united kingdom is in the query -> remove name
Lat and lng are not correct many times -> onyl use it if not enough to geocode
Postcode, street address might be missing
There could be multiple cities, countries - > geocodoe with street
What if different country is returned => use lat lng
Sometimes address and postcode, city in same => just sent to Google

*/


async function init() {

    console.log("=========GEOCODER=========");

    // let res = await Geocoder.geocode({name: "", streetHouse: "160-170 Cannon St Road", postcode: "", city: "", country: "United Kingdom", }, "51.51375166", "-0.061501165");
    // { streetHouse: '160 Cannon Street Road',
    //  postcode: 'E1 2LH',
    //  city: 'London',
    //  country: 'United Kingdom',
    //  lat: 51.51427899999999,
    //  lng: -0.06155339999999999 },
    //  source: 'Google Maps' }

    // let res = await Geocoder.geocode({name: "", streetHouse: "Europa House, Ironmonger Row", postcode: "", city: "", country: "United Kingdom", }, "51.52680388", "-0.094638452");
    // { streetHouse: '13-17 Ironmonger Row',
    //  postcode: 'EC1V 3QG',
    //  city: 'London',
    //  country: 'United Kingdom',
    //  lat: 51.52682919999999,
    //  lng: -0.0946535 },
    //  source: 'Google Maps' }

     // let res = await Geocoder.geocode({name: "", streetHouse: "66 Stoke Newington Road", postcode: "", city: "London", country: "United Kingdom", }, "51.55256417", "-0.07462241");
    //  { streetHouse: '66 Stoke Newington Road',
    // postcode: 'N16 7XB',
    // city: 'London',
    // country: 'United Kingdom',
    // lat: '51.5524694',
    // lng: '-0.0746995' },
    // source: 'Nominatim' }Maps' }

    // let res = await Geocoder.geocode({name: "", streetHouse: "Studio 306, Cockpit Arts, 18-22 Creekside", postcode: "", city: "London", country: "United Kingdom", }, "51.47862647", "-0.020651415");
  //   { streetHouse: '18-22 Creekside',
  //    postcode: 'SE8 3DZ',
  //    city: 'London',
  //    country: 'United Kingdom',
  //    lat: 51.4786221,
  //    lng: -0.0207401 },
  // source: 'Google Maps' }

    // let res = await Geocoder.geocode({name: "", streetHouse: "Portobello Promenade, Figgate Street", postcode: "EH15 1HH", city: "", country: "United Kingdom", }, "55.935789045405365", "-3.27667236328125")
    let res = await Geocoder.reverseGeocode("55.954709", "-3.183294");

    console.log(res);


}
