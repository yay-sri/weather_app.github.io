$( "#city" ).change(function(){
  //when you choose a different city
  weatherModule.setCity($(this).val());
  weatherModule.refreshDataView();
});

//gets the data and calls callback
function getWeatherData(callback) {
  /*
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
          callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", weatherModule.getQuery(), true);
  xmlHttp.send(null);
  */
  $.get(weatherModule.getQuery(),
  function(data){
    callback(data)
  })
  .fail(function(){
    UpdateView.showError();
  });
}
//class with static methods to update the view
class UpdateView {
    static getWeatherCSSClass (code) {
      //this gives the css class (weather image) to use depending on the weather code
      let weatherClass = ["cloudywtr","snowwtr","normalwtr","thunderwtr"];
      let weather = 3;
      if ((code >= 26 && code <= 30) || code == 44) weather = 0;
      else if ((code >= 13 && code <= 16) || code == 25 || code == 35 || (code >= 41 && code <= 43)) weather = 1;
      else if ((code >= 17 && code <= 24) || (code >= 31 && code <= 34) || code == 36) weather = 2;
      return weatherClass[weather];
    }
    static showError () {
      $('#error').show();
      $('#today').hide();
      $('#forecast').hide();
    }
    static updateTodayWeather (weatherData) {
      if (!weatherData) {
        self.showError();
      }
      let weatherClass = UpdateView.getWeatherCSSClass(weatherData.todayWCode);
      let dateObj = new Date();
      let dateInfo = dateObj.toDateString().split(" "); //"Sun Aug 20 2017"
      let time = dateObj.toLocaleString('en-US',
        { hour: 'numeric',minute:'numeric', hour12: true });

      let viewHTML = `
        <div class="todayDate">${dateInfo[1]} ${dateInfo[2]}, ${time}</div>
        <div>
          <div class="${weatherClass} icnwtrlarge floatleft"></div>
          <div class="weathertemp">${weatherData.todayTemp || ""} F</div>
        </div>
        <div class="clearboth">
          <div class="todaydesc">${weatherData.todayDesc || ""}</div>
        </div>
      `;
      $('#error').hide();
      $('#today').empty().append(viewHTML).show();
    }
    static updateForecast (forecastList) {
        let itemsHTML = "";
        for (let ctr = 1; ctr < forecastList.length -2; ctr++) {
          itemsHTML += `<div class="forecastitems">
            <div class="poscenter lightertext">${forecastList[ctr].day || ""}</div>
            <div class="icnwtrsmall ${UpdateView.getWeatherCSSClass(forecastList[ctr].code)}"></div>
            <div class="poscenter lightertext">${forecastList[ctr].text || ""}</div>
            <div class="poscenter">${forecastList[ctr].high || "" }&nbsp;&nbsp;${forecastList[ctr].low || ""}</div>
            <div class="poscenter lightertext">${(forecastList[ctr].date || "").replace(" 2017","")}</div>
          </div>`;
        }
        if (itemsHTML == "") {
          //no forecast data received
          $('#forecast').hide();
          return;
        }
        let viewHTML = `<div class="forecastbox">${itemsHTML}</div>`;
        $('#error').hide();
        $('#forecast').empty().append(viewHTML).show();
    }
    static changeBackdrop(cityCode) {
      var imgMap = {
        "2502265": "https://adc3ef35f321fe6e725a-fb8aac3b3bf42afe824f73b606f0aa4c.ssl.cf1.rackcdn.com/propertyimages/1214/hamilton-town-center-01.jpg", //Sunnyvale
        "2459115": "https://www.gentlegiant.com/wp-content/uploads/2015/06/New-York.jpg", //NYC
        "2487889": "https://upload.wikimedia.org/wikipedia/commons/2/26/San_Diego_panoramic_skyline_at_night.jpg", //San Diego
        "2423945" : "https://1bo9y82e76el2rf8ms1m5i0r-wpengine.netdna-ssl.com/wp-content/uploads/2017/05/1489452380_Disney-Aluni-resort-beach-edited-1.jpg", //"Honolulu, HI
        "2391279" : "http://www.thegalatynlodge.com/resourcefiles/homeimages/vail-colorado-hotel-home2-top.jpg", //"Denver, CO
        "2487796" : "http://az616578.vo.msecnd.net/files/2016/04/11/63595946212850882926287113_san-antonio-river-walk.jpg", //"San Antonio, TX
        "2411084" : "http://www.glendaleaz.com/airport/images/VisitRegionSlide_Airport_lg.jpg", //"Glendale, AZ
        "2450022" : "https://1.cdnkic.com/sites/default/files/styles/585x390/public/desti-miami-gall-01.jpg?itok=Y97V2hKO" //"Miami, FL
      };
      $('body').css('background-image',"url(" + imgMap[cityCode] + ")");
    }
};

//main module controller to getdata and update views
var weatherModule = (function() {
    var city = 2502265;
    var map = {"2502265": "Sunnyvale, CA",
      "2487889" : "San Diego, CA",
      "2423945" : "Honolulu, HI",
      "2391279" : "Denver, CO",
      "2487796" : "San Antonio, TX",
      "2411084" : "Glendale, AZ",
      "2450022" : "Miami, FL",
      "2459115" : "New York, NY"
    };
    var weatherData = {};
    var queryString = `https://query.yahooapis.com/v1/public/yql?q=`;
    var queryParams = `&format=json`;
    var queryCity = `select%20item%20from%20weather.forecast%20where%20woeid%20%3D%20`;

    var filterData = function (todayWeather) {
      try{
        let todayData = todayWeather.query.results.channel.item;
        let weatherObj = {
          "cityName" : weatherModule.getCityName(),
          "todayDate" : todayData.condition.date,
          "todayWCode": todayData.condition.code,
          "todayTemp" : todayData.condition.temp,
          "todayDesc" : todayData.condition.text,
          "forecast"  : todayData.forecast
        };
        return weatherObj;
      } catch(e) {
        //data is not in the format intended
        return null;
      }
    }
    return { //exposed to public
        getCityName : function (){
          return (map[city]);
        },
        setCity : function(value) {
            city = value;
        },
        getQuery : function(){
          return queryString + queryCity + city + queryParams;
        },
        refreshDataView : function() {
          //gets data and callsback to update
          getWeatherData(weatherModule.updateDataView);
        },
        updateDataView : function(data){
          weatherData = filterData(data);
          if (!weatherData) {
            UpdateView.showError();
            return;
          }
          UpdateView.updateTodayWeather(weatherData);
          UpdateView.updateForecast(weatherData.forecast);
          UpdateView.changeBackdrop(city);
        }
    }
}());

//onready
$(function() {
    $('#error').hide();
    weatherModule.refreshDataView();
});
