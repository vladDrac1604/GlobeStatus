const NodeGeocoder = require('node-geocoder');
const options = {
  provider: 'openstreetmap'
};
const geocoder = NodeGeocoder(options);

function transformDate(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1);
    let day = String(date.getDate());
    if (month.length == 1) {
        month = "0" + month;
    }
    if (day.length == 1) {
        day = "0" + day;
    }
    let finalDate = year + "-" + month + "-" + day;
    return finalDate;
}

async function getLocationCoordinatesArrayByName(alertData) {
    let locations = [];
    if (alertData.length > 0) {
        for (let x of alertData) {
            if (x.regions && x.regions.length > 0) {
                for (let region of x.regions) {
                    try {
                        const geoCodeResp = await geocoder.geocode(region);
                        locations.push({ name: region, lat: geoCodeResp[0].latitude, lng: geoCodeResp[0].longitude });
                    } catch (err) {
                        console.log("error occured while fetching coordinates for :: " + region);
                    }
                }
            }
        }
    }
    return locations;
}

module.exports.getLocationCoordinatesArrayByName = getLocationCoordinatesArrayByName;
module.exports.transformDate = transformDate;