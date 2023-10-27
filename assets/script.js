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
