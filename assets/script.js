const apiKey = '2979455bd01e1f80e64ecca49250faff';
const symbol = 'weather';
const interval = '5min';

const requestUrl = `https://www.api.openweathermap.org/data/2.5/weather?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${apiKey}`;

fetch(requestUrl)
  .then(function (response) {
    console.log(response.status)
    return response.json();
  })
  .then(function (data) {
    console.log(data);
  })
  .catch(function (error) {
    console.error('Error:', error);
  })

  //Store the searched fo locations
  var searchedForLocations = [];
		
  function IsLocationAlreadyInList(city,state){
    var foundLocation = false;
    //Check to make sure that the array is not empty that is being searched through
    if(searchedForLocations && searchedForLocations.length > 0)
    {
      //Check to see if the city is in the array of cities
      searchedForLocations.forEach((location)=>
      {
        var cityLC = location.City.toLowerCase().trim();
        var stateLC = location.State.toLowerCase().trim();
        
        //Do some lower case checks on the city name, state to see if they match the input city and state.
        if(cityLC == city.toLowerCase().trim() && stateLC == state.toLowerCase().trim()) foundLocation = true;
      });
    }
    
    return foundLocation;
  }
  
  function toTitleCase(str) {
    //This is some regex (regular Expressions) used to find the first letter of every word and uppercase it
    //What I use to create regex pattern matching queries
    //https://regex101.com/
    //Documentation on the replace statement
    //https://www.w3schools.com/jsref/jsref_replace.asp
    
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  function renderSearchedCityList(){
    //Clear the unordered list with the ID #searchMenu
    $("#searchMenu").html("");
    
    //Set the pending html to be rendered as empty
    var pendingHtml = "";
    
    //Build a list of list items (li) by looping through each item in the searchedForLocations array
    for(var idx = 0; idx < searchedForLocations.length; idx++)
    {
      var location = searchedForLocations[idx];
    
      //Concatinate together the cities location and state into a listitem equal to <li>City, State</li>
      pendingHtml+= "<button type=\"button\" class=\"btn btn-secondary mt-1 mb-1 w-100\" id=\"location-" + idx + "\">" + location.City + ", " + location.State + "</button>";			
    }
    
    //Update the html found in the unordered list <ul> to equal the html just generated for the searchedForLocations array.
    $("#searchMenu").html(pendingHtml);
    
    //Add click handlers for buttons representing locations
    $("[id^=location-]").click((item)=>{
      //For some reason $(this) is not working in this instance... maybe I am just to tired and am not realizing I am doing something stupid here.
      //However this will work for now.				
      var id = item.target.id;		

      //Split the location ID to acquire the index of the item loading
      var splitID = id.split("-");
      var index = parseInt(splitID[1])
      
      //Acquire the location data from the array associated with the given button.
      var location = searchedForLocations[index];
      
      //Create an object containing the location data required to pull in the 5 day forecast and the current forecast
      var locationData = [{lat: location.Lattitude, lon: location.Longitude}];
      
      //Acquire the 5 day forecast.
      var fiveDayForecast = Acquire5DayForeCast(locationData);

      //Acquire the current forecast
      var currentForecast = AcquireCurrentForecast(locationData);
      
      //Render the 5 day forecast section.
      RenderFiveDayForecast(fiveDayForecast);
      
      //Render the current forecast section.
      RenderCurrentForecast(currentForecast);
    });
  }
  
  function AcquireLocationData(city, state)
  {
    //Use the API to pull locations that are matching the input city, State
    //I limited this to the USA for right now, so you will need to disable the ,us if you want to change this.
    var matchingLocationData = null;
    $.getJSON("http://api.openweathermap.org/geo/1.0/direct?q=" + city + "," + state + ",us&limit=5&appid=" + apiKey,(data)=>
    { 
      matchingLocationData = data;
    });
    
    //Returns an array of json data representing matching locations.
    return matchingLocationData;
  }
  
  function Acquire5DayForeCast(matchingLocationData)
  {
    var weatherDataForCity = null;
    if(matchingLocationData && matchingLocationData.length > 0)
    {
      //Grab the first item in the array
      var locationData = matchingLocationData[0];
            
      //Get its lattitude and longitude
      var lattitude = locationData.lat;
      var longitude = locationData.lon;
      
      //Run the api enpoint used to pull the 5 day forecast
      //The data returned by this has more than 1 entry per each day (3 hr increments for a 5 day period)
      $.getJSON("https://api.openweathermap.org/data/2.5/forecast?lat=" + lattitude + "&lon=" + longitude + "&units=imperial&appid=" + apiKey,(data)=>{ weatherDataForCity = data;});
    }
    
    //Return the acquired weather data.
    return weatherDataForCity;
  }
  
  function AcquireCurrentForecast(matchingLocationData)
  {
    var weatherDataForCity = null;
    if(matchingLocationData && matchingLocationData.length > 0)
    {
      //Grab the first item in the array
      var locationData = matchingLocationData[0];
            
      //Get its lattitude and longitude
      var lattitude = locationData.lat;
      var longitude = locationData.lon;
      
      //Acquire the current days forecast using the api.
      $.getJSON("https://api.openweathermap.org/data/2.5/weather?lat=" + lattitude + "&lon=" + longitude + "&units=imperial&appid=" + apiKey,(data)=>{ weatherDataForCity = data;});
    }
    
    //Return the current days forecast.
    return weatherDataForCity;
  }
  

  function RenderFiveDayForecast(weatherDataForCity)
  {
    //Clear out prior existing html used to represent the 5 day forecast
    $("#fiveDayForecast").html("");
    
    //HTML representing a card used to display the weather data.
    var weatherCardTemplateHtmlStr = 
    "<div class=\"card align-items-center m-1\" style=\"width: 180px; height: 350px\"><h4>WEATHERDATE</h4><img class=\"card-img-top\" src=\"WEATHERIMAGE\" alt=\"WEATHERIMAGEDESC\"><div class=\"card-body\">WEATHERDATA</div></div>";
    
    //Get the current date time
    var dtNow = new Date();
    
    //Get a string representing the current date time in the localized date format. (MM/DD/YYYY)
    var dtNowStr = dtNow.toLocaleDateString();
    
    //Create a temp variable that we will used to prevent creating more than 5 weather entries.
    var lastEncounteredDate = null;
    
    //Loop through the list of weather data acquired for the city (5 day forecast, entries for every 3 hrs for theses 5 days)
    weatherDataForCity.list.forEach((item)=>{
      //Get the weather entries date and date/time
      var curDate = new Date(item.dt_txt);
      var curDateStr = curDate.toLocaleDateString();
      
      //Use the weather entry for 12 pm to represent the weather for a given day.
      //For the weather for the current day, I am using the 12 pm entry as this makes the most sense to me, and I cannot find any information on what is considered standard For
      //what temperature is used for a given day in forecasting.
      if(curDate.getHours() == 12)
      {
        //Acquire the path for the image representing the weather from open weather API.
        var weatherImgPath = "https://openweathermap.org/img/wn/" + item.weather[0].icon + "@2x.png";
        var htmlCardStr = weatherCardTemplateHtmlStr;
        htmlCardStr = htmlCardStr.replace("WEATHERIMAGE", weatherImgPath).replace("WEATHERDATE", curDateStr).replace("WEATHERIMAGEDESC", item.weather[0].description);
        htmlCardStr = htmlCardStr.replace("WEATHERDATA", "<p>Temp: " + item.main.temp + "°F</p>" + "<p>Wind: " + item.wind.speed + " mph</p>"+ "<p>Humidity: " + item.main.humidity + "%<p>");
        
        //Do not show the current days weather as part of the 5 day forecast.
        if(curDateStr != dtNowStr)
        {
          //Check to see if we have set the last encountered date.
          if(lastEncounteredDate == null) {
            //If we have not the set the last encountered date and add a card representing the weather for the given date.
            lastEncounteredDate = curDate;
            
            //Add a weather card representing the weather for the current date.
            $("#fiveDayForecast").append(htmlCardStr);
          }
          else
          {
            //If the current entry being processed
            //Has a date of the last processed entry then do not process it.
            //Note: I assummed that the data being returned by the API was ordered by date/time here... but that may not always be the case.
            if(curDateStr != lastEncounteredDate.toLocaleDateString())
            {
              //If the current entry being processed does not have a weather card representing it.
              //...
              
              //Set the last encountered date to the given entrie date.
              lastEncounteredDate = curDate;
              
              //Render the weather for the current entry/date.
              $("#fiveDayForecast").append(htmlCardStr);
            }
          }
        }
      }
    });
  }
  
  function RenderCurrentForecast(weatherDataForCity)
  {
    //Generate the html used to render the current day forecast.
    var html = "<h4>Current Weather</h4><h2>"+ weatherDataForCity.name + "</h2>" + "<p>Temp: " + weatherDataForCity.main.temp +"°F</p>" + "<p>Wind: " + weatherDataForCity.wind.speed + " mph</p>" + "<p>Humidity: "+ weatherDataForCity.main.humidity + "%</p>"
    
    //Clear out prior existing html used to represent the current forecast
    $("#currentWeatherForecast").html("");
    
    //Set the contents of the currentWeatherForecast div to be the html data representing the current weather.
    $("#currentWeatherForecast").html(html);
  }
  
  $(document).ready(()=>{
    //To reduce the complexity of things, I am disabling async operations.
    //This makes it so that we do not have to nest the api calls inside each other and reduces the overal complexity of the rendering code.
    $.ajaxSetup({
       async: false
     });
     
    //Todo: Add loading here from local storage as presumably this assignment will probably require this.
    
    //Render the current city list.
    renderSearchedCityList();
  
    //Set up the on click even of the button whose ID is searchBtn
    $("#searchBtn").click(()=>{
      //Acquire the potential city that may or may not be added.
      var potentialCity = $("#searchForMe").val().trim();
      
      //Split the string acquired (potentialCity) into 2 different pieces using the comma as a delimiter.
      //So an array with value like so is created. locationArr[0]= City, locationArry[1] = State
      var locationArr = potentialCity.split(",");
      if(locationArr.length == 2)
      {
        //Acquire the city (Lower case it for now as we will use a regex expression to case it correctly later)
        var city = locationArr[0].trim().toLowerCase();
        
        //Acquire the state and uppercase it
        var state = locationArr[1].trim().toUpperCase();
        
        //Check to make sure that a city with a at least one character was entered.
        //Also check to make sure that the length of the input state is exactly 2 characters long (So 2 letter state abbreviation like UT, CA, etc)
        //Note: You can modify this as desired, since presumably you will probably be pulling the weather using an external API.
        if(city.length > 0 && state.length == 2)
        {
          //Change the input cities casing so it uppercases the beginning of every word.
          city = toTitleCase(city);
          
          //Todo verify city validity by calling api used to pull weather data. (You would pull the weather data and process it here as well)
          //Once verified allow adding the city to the list of searched for locations
          var matchingLocationData = null;
          $.getJSON("http://api.openweathermap.org/geo/1.0/direct?q=" + city + "," + state + ",us&limit=5&appid=" + apiKey,(data)=>
          { 
            matchingLocationData = data;
          });
          
          console.log(matchingLocationData);
          if(matchingLocationData && matchingLocationData.length > 0)
          {
            //Grab the first item in the array
            var locationData = matchingLocationData[0];
            
            //Get its lattitude and longitude
            var lattitude = locationData.lat;
            var longitude = locationData.lon;
            
            //Acquire current weather and the 5 day forecast
            var weatherDataForCity = null;
            var currentWeatherForCity = null;
            $.getJSON("https://api.openweathermap.org/data/2.5/weather?lat=" + lattitude + "&lon=" + longitude + "&units=imperial&appid=" + apiKey,(data)=>{ currentWeatherForCity = data;});
            $.getJSON("https://api.openweathermap.org/data/2.5/forecast?lat=" + lattitude + "&lon=" + longitude + "&units=imperial&appid=" + apiKey,(data)=>{ weatherDataForCity = data;});						
            
            if(weatherDataForCity)
            {
              //Check to see if the location is already in the list
              //If it is not add the location.
              if(!IsLocationAlreadyInList(city,state))
              {
                //If the location can be added, add the location to the array containing a list of successfully searched for cities (Valid cities)
                searchedForLocations.push({City: city , State:state, Lattitude: lattitude, Longitude: longitude});
                
                //Render the updated city list. (By changing the html in the unordered list of searched for data)
                renderSearchedCityList();
                
                //Todo : Save as needed.
              }
              
              RenderCurrentForecast(currentWeatherForCity);
              RenderFiveDayForecast(weatherDataForCity);
            }
          }
        }
        else alert("Please enter in a valid location in the following format City, State Abbr. Example: New York, NY"); //Alerts for invalid data.
      }
      else alert("Please enter in a location in the following format City, State Abbr. Example: New York, NY"); //Alerts for invalid data.
    });
  });
  
</script>