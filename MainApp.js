if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const morgan = require('morgan');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const helper = require('./helper/HelperService');
const openWeatherApiKey = process.env.CURRENT_WEATHER_KEY;
const weatherBitApiKey = process.env.WEATHERBIT_API_KEY;
const { v4: uuidv4 } = require('uuid');


app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan('dev'));
app.use(session({secret:'***ilovedogs***',resave: false,saveUninitialized: false}));
app.use(flash());


app.get("/GlobeStatus/currentWeatherByName",function(req,res){
    res.render("inputForms.ejs",{cityNameError:req.flash("cityNameError")});
})
app.get("/GlobeStatus/currentWeatherByCoordinates",function(req,res){
    res.render("inputFormByCoordinates.ejs",{ cityCoordError: req.flash("cityCoordError"), 
        dataFetchingError: req.flash("dataFetchingError")
    })
})

app.get("/GlobeStatus/homePage",function(req,res){
    const delhiCoordinates = {'latitude': '28.7041', 'longitude': '77.1025'};
    res.render("homePage.ejs", { delhiCoordinates });
})

//*************************CURRENT WEATHER BY CITY NAME*************************

app.post("/GlobeStatus/currentWeatherByName", function(req,res) {
    let { cityName, alertMsg } = req.body;
    cityName = cityName.trim();
    let imgUrl=null;
    let cityNameDisplay = cityName.charAt(0).toUpperCase() + cityName.slice(1);
    const xhr2 = new XMLHttpRequest();
    const pageNum = Math.floor(Math.random()*(6-1)+1);
    const pageNumString = pageNum.toString();
    xhr2.open('GET',`https://api.unsplash.com/search/photos?page=${pageNumString}&query=${cityName}&client_id=M0IBer-h3noOVG3lX2vZRBerGBGWCfCLCHshPvz4X9M`,false);
    xhr2.onload = function(){
        if(this.status==200)
        {
            const imageData = JSON.parse(this.responseText);
            if(imageData.results.length==0)
            {
                console.log("ERROR WHILE FETCHING IMAGE FOR THE GIVEN CITY.");
            }
            else
            {
                const length = imageData.results.length;
                const random = Math.floor(Math.random()*(length-1)+1);
                imgUrl = imageData.results[random].urls.small;
            } 
        }
        else
        {
            console.log("ERROR WHILE FETCHING IMAGE FOR THE GIVEN CITY.");
        }
    }
    xhr2.send();
    const xhr = new XMLHttpRequest(); 
    xhr.open('GET',`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${openWeatherApiKey}`,false);
    xhr.onload = function() {
        if(this.status == 200) {
            const data = JSON.parse(this.responseText);
            console.log(data);
            const lon = data.coord.lon;
            const lat = data.coord.lat;   
            const minTemp = data.main.temp_min;
            const maxTemp = data.main.temp_max;
            const temp = data.main.temp;
            const windSpeed = data.wind.speed;
            const windDir = data.wind.deg;
            const windGust = data.wind.gust;
            const desc = data.weather[0].description;
            const humidity = data.main.humidity;
            const pressure = data.main.pressure;  
            const datesArr = getNextFiveDays();
            res.render("showCurrentWeather.ejs",{ alertMsg, lon, lat, cityNameDisplay, imgUrl, minTemp, maxTemp
            , temp, pressure, humidity, desc, windSpeed, windDir, windGust, datesArr,
            infoMessage: 'The weather forecast we provide comes with a 3 hour step size',
         });
        } else {
            req.flash("cityNameError", "Please enter the name of the city correctly.")
            res.redirect("/GlobeStatus/currentWeatherByName");
            console.log("Error while fetching the data.");
        }
    }
    xhr.send();
})

function getNextFiveDays() {
    let datesArr = [helper.transformDate(new Date())];
    for(let i = 1; i <= 5; i++) {
        let nextDate =  new Date(new Date().getTime() + (24 * 60 * 60 * 1000) * i);
        datesArr.push(helper.transformDate(nextDate));
    }
    return datesArr;
}

app.post("/GlobeStatus/currentAirPollutionByName/:lon/:lat/:cityName", function(req,res){
    const {lon,lat,cityName} = req.params;
    let imgUrl = null;
    const pageNum = Math.floor(Math.random()*(6-1)+1);
    const pageNumString = pageNum.toString();
    const xhr2 = new XMLHttpRequest();
    xhr2.open('GET',`https://api.unsplash.com/search/photos?page=${pageNumString}&query=${cityName}&client_id=M0IBer-h3noOVG3lX2vZRBerGBGWCfCLCHshPvz4X9M`,false);
    xhr2.onload = function(){
        if(this.status==200)
        {
            const imageData = JSON.parse(this.responseText);
            const length = imageData.results.length;
            const random = Math.floor(Math.random()*(length-1)+1);
            imgUrl = imageData.results[random].urls.small; 
        }
        else
        {
            console.log("Error while fetching image for the given city.");
        }
    }
    xhr2.send();
    const xhr = new XMLHttpRequest();
    xhr.open('GET',`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}`,false);
    xhr.onload = function(){
        if(this.status==200){
            const data = JSON.parse(this.responseText);
            
            const co = data.list[0].components.co;
            const no = data.list[0].components.no;
            const no2 = data.list[0].components.no2;
            const o3 = data.list[0].components.o3;
            const so2 = data.list[0].components.so2;
            const pm2_5 = data.list[0].components.pm2_5;
            const pm10 = data.list[0].components.pm10;
            const nh3 = data.list[0].components.nh3;
            const aqi = data.list[0].main.aqi;
            let qualityDesc = null;
            switch(aqi)
            {
                case 1 : qualityDesc = 'Good';
                break;
                case 2 : qualityDesc = 'Fair';
                break;
                case 3 : qualityDesc = 'Moderate';
                break;
                case 4 : qualityDesc = 'Poor';
                break;
                case 5 : qualityDesc = 'Very Poor';
                break;
            }
            res.render("showCurrentAirPollution",{co,no,no2,o3,so2,pm2_5,pm10,nh3,lon,lat,cityName,aqi,qualityDesc,imgUrl});
        }
        else
        {
            console.log("Error while fetching air pollution data.");
        }
    }
    xhr.send();
})




//*************************CURRENT WEATHER BY COORDINATES*************************

app.post("/GlobeStatus/currentWeatherByCoordinates", function(req,res){
    const {lattitude,longitude,lonDir,latDir} = req.body;
    let minTemp,maxTemp,temp,windSpeed,windDir,desc,humidity,pressure,cityName;
    let lat,lon;

    if(latDir == 'north')
    lat = parseFloat(lattitude);
    else
    lat = -parseFloat(lattitude);
    if(lonDir == 'east')
    lon = parseFloat(longitude);
    else
    lon = -parseFloat(longitude);

    lat = lat.toString();
    lon = lon.toString();
    console.log("lattitue in req body :: " + lat);
    console.log("longitude in req body :: " + lon);
    const xhr = new XMLHttpRequest();
    xhr.open('GET',`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}`, false);
    xhr.onload =  function(){
        if(this.status==200)
        {
            const data = JSON.parse(this.responseText);
            temp = data.main.temp;
            minTemp = data.main.temp_min;
            maxTemp = data.main.temp_max;
            pressure = data.main.pressure;
            humidity = data.main.humidity;
            windSpeed = data.wind.speed;
            windDir = data.wind.deg;
            windGust = data.wind.gust;
            desc = data.weather[0].description;
            cityName = data.name;
        }
        else
        {
            req.flash("cityCoordError", "Please enter the coordinates of the city correctly.")
            res.redirect("/GlobeStatus/currentWeatherByCoordinates");
        }
    }

    xhr.send();
    const pageNum = Math.floor(Math.random()*(6-1)+1);
    const pageNumString = pageNum.toString();
    const xhr2 = new XMLHttpRequest();
    console.log("city name :: " + cityName);
    xhr2.open('GET',`https://api.unsplash.com/search/photos?page=${pageNumString}&query=${cityName}&client_id=M0IBer-h3noOVG3lX2vZRBerGBGWCfCLCHshPvz4X9M`,false)
    xhr2.onload = function(){
        if(this.status==200)
        {
            const imageData = JSON.parse(this.responseText);
            if(imageData.results.length==0)
            {
                console.log("ERROR WHILE FETCHING IMAGE FOR THE GIVEN CITY.");
            }
            else
            {
                const length = imageData.results.length;
                const random = Math.floor(Math.random()*(length-1)+1);
                imgUrl = imageData.results[random].urls.small;
                const datesArr = getNextFiveDays();
                res.render("showCurrentWeatherByCoordinates",{ lon, lat, cityName, windSpeed, windDir, windGust,
                    datesArr, humidity, pressure, desc, minTemp, maxTemp, temp, 
                    infoMessage: 'The weather forecast we provide comes with a 3 hour step size' 
                });
            } 
        }
        else
        {
            console.log("ERROR WHILE FETCHING IMAGE FOR THE GIVEN CITY.");
            req.flash("dataFetchingError", "Error while fetching data, please try again later.");
            res.redirect("/GlobeStatus/currentWeatherByCoordinates");   
        }
    }
    xhr2.send();
})


//****************************************Weather Alerts*****************************

app.post("/GlobeStatus/alerts/:cityName/:lat/:lon", async function(req, res) {
    const { cityName, lat, lon } = req.params;
    const pageNum = Math.floor(Math.random()*(6-1)+1);
    const pageNumString = pageNum.toString();
    const xhr2 = new XMLHttpRequest();
    xhr2.open('GET',`https://api.unsplash.com/search/photos?page=${pageNumString}&query=${cityName}&client_id=M0IBer-h3noOVG3lX2vZRBerGBGWCfCLCHshPvz4X9M`, false);
    xhr2.onload = function() {
        if(this.status == 200) {
            const imageData = JSON.parse(this.responseText);
            const length = imageData.results.length;
            const random = Math.floor(Math.random()*(length-1)+1);
            imgUrl = imageData.results[random].urls.small; 
        } else {
            console.log("Error while fetching image for the given city.");
        }
    }
    xhr2.send();
    const xhr = new XMLHttpRequest();
    xhr.open(`GET`, `https://api.weatherbit.io/v2.0/alerts?lat=${lat}&lon=${lon}&key=${weatherBitApiKey}`, false);
    xhr.onload = async function() {
        if(this.status == 200) {
            const data = JSON.parse(this.responseText);
            if(data.alerts && data.alerts.length > 0) {
                let alertData = [];
                const timeZone = data.timezone;
                for(let alert of data.alerts) {
                    alertData.push({
                       id: uuidv4(),
                       descriptions : alert.description,
                       title : alert.title,
                       severity : alert.severity,
                       regions : alert.regions,
                       effectiveLocal : alert["effective_local"].replace("T", " "),
                       endsLocal : alert["ends_local"].replace("T", " "),
                       source : alert.uri
                    });
                }
                const locations = await helper.getLocationCoordinatesArrayByName(alertData);
                const infoMsg = "Weather alerts are generally provided in the local language";
                res.render("weatherAlertPage", { alertData, timeZone, cityName, lat, lon, infoMsg, locations });
            } else {
                const alertMsg = "No current weather alerts are available for this location";
                res.send(`
                    <form id="redir" action="/GlobeStatus/currentWeatherByName" method="POST">
                        <input type="hidden" name="cityName" value="${cityName}">
                        <input type="hidden" name="alertMsg" value="${alertMsg}">
                    </form>
                    <script>document.getElementById('redir').submit();</script>`);
            }
        } else {
            const alertMsg = "Internal server error, please try again later";
            res.send(`
                <form id="redir" action="/GlobeStatus/currentWeatherByName" method="POST">
                    <input type="hidden" name="cityName" value="${cityName}">
                    <input type="hidden" name="alertMsg" value="${alertMsg}">
                </form>
                <script>document.getElementById('redir').submit();</script>`);
        }
    }
    xhr.send();
})

app.post("/GlobeStatus/forecast/:cityName/:lat/:lon/:date", function(req,res) {
    const { cityName, lat, lon, date } = req.params;
    const pageNum = Math.floor(Math.random()*(6-1)+1);
    const pageNumString = pageNum.toString();
    const xhr2 = new XMLHttpRequest();
    xhr2.open('GET',`https://api.unsplash.com/search/photos?page=${pageNumString}&query=${cityName}&client_id=M0IBer-h3noOVG3lX2vZRBerGBGWCfCLCHshPvz4X9M`, false);
    xhr2.onload = function(){
        if(this.status == 200)
        {
            const imageData = JSON.parse(this.responseText);
            const length = imageData.results.length;
            const random = Math.floor(Math.random()*(length-1)+1);
            imgUrl = imageData.results[random].urls.small; 
        }
        else
        {
            console.log("Error while fetching image for the given city.");
        }
    }
    xhr2.send();
    const xhr = new XMLHttpRequest();
    xhr.open(`GET`, `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}`, false);
    xhr.onload = function(){
        if(this.status == 200) {
            const data = JSON.parse(this.responseText);
            if(data && data.list) {
                const dataList = data.list;
                let dateSpecificData = [];
                let pagesPerDate = 0;
                for(let singleData of dataList) {
                    if(singleData.dt_txt.substring(0, 10) == date) {
                        dateSpecificData.push(singleData);
                        pagesPerDate += pagesPerDate;
                    }
                }
                res.render("showWeatherAlerts", { dateSpecificData, pagesPerDate, lat, lon, cityName });
            }
        } else {
            console.log("Error while fetching weather alerts for the given city.");
        }
    }
    xhr.send();
})


app.listen(2000,function(req,res){
    console.log("Local machine server created.")
})