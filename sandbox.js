// accuweather API trigger

// Shelly Script example: Turn on when temperature is below CONFIG.tempBelowTurnOn
// Turn off when temperature is above CONFIG.tempAboveTurnOff
// For getting an API-KEY from Accuweather follow the instructions on their site
// for registering a new application, copy the key and paste it here

let ZIP_CODE = 33467;

let CONFIG = {
    accuWeatherAPIKEY: "MCMVymXN6Poj1B5Ak7gZHNAAxqqaGBMw",
    weatherForecastEndpoint:
      "http://dataservice.accuweather.com/forecasts/v1/daily/1day/",
    weatherCurrentEndpoint:
      "http://dataservice.accuweather.com/currentconditions/v1/",

    //check every 60 seconds
    checkInterval: 60 * 1000,
    tempBelowTurnOn: -1,
    tempAboveTurnOff: 0,
  };
  
  function getWeatherURLForLocation(location) {
      let uri = 
      CONFIG.weatherForecastEndpoint +
      JSON.stringify(location) +
      "?apikey=" +
      CONFIG.accuWeatherAPIKEY;

    //  http://dataservice.accuweather.com/forecasts/v1/daily/1day/33467?apikey=MCMVymXN6Poj1B5Ak7gZHNAAxqqaGBMw
    //  print(uri);
    return uri
  }
  
  function activateSwitch(activate) {
    Shelly.call(
      "Switch.Set",
      { id: 0, on: activate },
      function (response, error_code, error_message) {}
    );
  }
  
  function TemperatureControlLocation(location) {
    Shelly.call(
      "http.get",
      { url: getWeatherURLForLocation(location) },
      function (response, error_code, error_message, location) {
        let weatherData = JSON.parse(response.body);

        // print(JSON.stringify(weatherData))
        // {   "DailyForecasts":[
        //         {   "Link":"http://www.accuweather.com/en/bo/luquisani/33467/daily-weather-forecast/33467?day=1&lang=en-us",
        //             "MobileLink":"http://www.accuweather.com/en/bo/luquisani/33467/daily-weather-forecast/33467?day=1&lang=en-us",
        //             "Sources":["AccuWeather"],
        //             "Night":{   "HasPrecipitation":false,
        //                         "IconPhrase":"Mostly clear",
        //                         "Icon":34
        //             },
        //             "Day":{ "PrecipitationIntensity":"Light",
        //                     "PrecipitationType":"Rain",
        //                     "HasPrecipitation":true,
        //                     "IconPhrase":"Partly sunny w/ showers",
        //                     "Icon":14
        //             },
        //             "Temperature":{
        //                 "Maximum":{"UnitType":18,"Unit":"F","Value":59},
        //                 "Minimum":{"UnitType":18,"Unit":"F","Value":41}},
        //                 "EpochDate":1692097200,
        //                 "Date":"2023-08-15T07:00:00-04:00"
        //         }
        //     ],
        //     "Headline":{
        //         "Link":"http://www.accuweather.com/en/bo/luquisani/33467/daily-weather-forecast/33467?lang=en-us",
        //         "MobileLink":"http://www.accuweather.com/en/bo/luquisani/33467/daily-weather-forecast/33467?lang=en-us",
        //         "EndEpochDate":1692140400,
        //         "EndDate":"2023-08-15T19:00:00-04:00",
        //         "Category":"rain",
        //         "Text":"Expect showers this afternoon",
        //         "Severity":3,
        //         "EffectiveEpochDate":1692118800,
        //         "EffectiveDate":"2023-08-15T13:00:00-04:00"
        //     }
        // }
        
        if (weatherData.DailyForecasts[0].Temperature.Minimum.Value <= CONFIG.tempBelowTurnOn) {
          activateSwitch(true);
        }
        if (weatherData.DailyForecasts[0].Temperature.Maximum.Value >= CONFIG.tempAboveTurnOff) {
          activateSwitch(false);
        }
        print(
          location,
          " Temperature Min/Max :",
          weatherData.DailyForecasts[0].Temperature.Minimum.Value,
          weatherData.DailyForecasts[0].Temperature.Maximum.Value,
          "deg F",
          weatherData.Headline.Text
        );
      },
      location
    );
  }
 
  Timer.set(CONFIG.checkInterval, true, function () {
    console.log("Checking weather");
    TemperatureControlLocation(ZIP_CODE);
  });