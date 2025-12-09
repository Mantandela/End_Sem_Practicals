//  document inputs
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const loading = document.getElementById("loading");
const weatherResult = document.getElementById("weatherResult");
const errorMsg = document.getElementById("errorMsg");
const cityNameEl = document.getElementById("cityName");
const tempEl = document.getElementById("temp");
const windEl = document.getElementById("wind");
const iconEl = document.getElementById("icon");

// utility functions
const cityCoordinates = {
    nairobi: { lat: -1.2864, lon: 36.8172 },
    mombasa: { lat: -4.0435, lon: 39.6682 },
    kisumu: { lat: -0.0917, lon: 34.7680 }
};

function resetUI() {
    errorMsg.classList.add("hidden");
    weatherResult.classList.add("hidden");
}



// fetch functions
async function fetchWeather() {
    resetUI();

    const city = cityInput.value.trim().toLowerCase();
    if (!city) {
    errorMsg.textContent = "Please enter a city name.";
    errorMsg.classList.remove("hidden");
    return;
    }

    const coords = cityCoordinates[city];
    if (!coords) {
    errorMsg.textContent = "Invalid city.";
    errorMsg.classList.remove("hidden");
    return;
    }

    try {
    loading.classList.remove("hidden");

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("API error");
    }

    const data = await response.json();

    const weather = data.current_weather;
    if (!weather) {
        throw new Error("Weather data missing");
    }

    cityNameEl.textContent = city.charAt(0).toUpperCase() + city.slice(1);
    tempEl.textContent = weather.temperature;
    windEl.textContent = weather.windspeed;
    iconEl.src = "https://icons.iconarchive.com/icons/icons-land/weather/256/Sunny-icon.png";
    iconEl.alt = "Weather icon representing current condition";

    weatherResult.classList.remove("hidden");
    } catch (err) {
    errorMsg.textContent = "Failed to fetch weather. Please try again.";
    errorMsg.classList.remove("hidden");
    } finally {
    loading.classList.add("hidden");
    }
}

searchBtn.addEventListener("click", fetchWeather);
