const API_KEY = 'c320dfb4e2ec4d9a805170232260207';
const BASE_URL = 'https://api.weatherapi.com/v1';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const weatherCard = document.getElementById('weatherCard');
const errorMsg = document.getElementById('errorMsg');
const forecastContainer = document.getElementById('forecast');

// Load last searched city from localStorage
window.addEventListener('load', () => {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        cityInput.value = lastCity;
        getWeather(lastCity);
    }
});

// Search by city name
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) getWeather(city);
    }
});

// Get weather by current location
locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }

    locationBtn.textContent = '📍 Getting Location...';
    locationBtn.classList.add('loading');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoords(latitude, longitude);
            locationBtn.textContent = '📍 Use My Location';
            locationBtn.classList.remove('loading');
        },
        () => {
            showError('Unable to retrieve your location. Please allow location access.');
            locationBtn.textContent = '📍 Use My Location';
            locationBtn.classList.remove('loading');
        }
    );
});

// Fetch weather and forecast by city name
async function getWeather(city) {
    try {
        hideError();
        const response = await fetch(
            `${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=5&aqi=no&alerts=no`
        );

        if (!response.ok) throw new Error('City not found');

        const data = await response.json();
        await displayWeather(data);
        displayForecast(data);
        localStorage.setItem('lastCity', city);

    } catch (error) {
        showError('City not found. Please try again.');
        weatherCard.classList.add('hidden');
        forecastContainer.innerHTML = '';
    }
}

// Fetch weather and forecast by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        hideError();
        const response = await fetch(
            `${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=5&aqi=no&alerts=no`
        );

        if (!response.ok) throw new Error('Location not found');

        const data = await response.json();

        // Get accurate location name
        let accurateLocation = null;
        try {
            accurateLocation = await getReverseGeocode(lat, lon);
        } catch (geoError) {
            console.warn('Reverse geocoding failed:', geoError);
        }

        await displayWeather(data, accurateLocation);
        displayForecast(data);
        localStorage.setItem('lastCity', data.location.name);
        cityInput.value = accurateLocation || data.location.name;

    } catch (error) {
        showError('Could not get weather for your location.');
        weatherCard.classList.add('hidden');
        forecastContainer.innerHTML = '';
    }
}

// Fetch altitude from Open-Meteo
async function getAltitude(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`
        );
        const data = await response.json();
        return Math.round(data.elevation[0]);
    } catch (error) {
        return null;
    }
}

// Reverse geocode using WeatherAPI geocoding
async function getReverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `${BASE_URL}/search.json?key=${API_KEY}&q=${lat},${lon}`
        );
        const data = await response.json();

        if (!data || data.length === 0) return null;

        const location = data[0];
        const parts = [
            location.name,
            location.region,
            location.country
        ].filter(Boolean);

        return parts.join(', ');
    } catch (error) {
        return null;
    }
}

// Convert wind degrees to compass direction
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

// Display current weather
async function displayWeather(data, accurateLocation = null) {
    const loc = data.location;
    const current = data.current;
    const astro = data.forecast.forecastday[0].astro;
    const today = data.forecast.forecastday[0].day;

    const locationName = accurateLocation || `${loc.name}, ${loc.country}`;
    document.getElementById('cityName').textContent = locationName;
    document.getElementById('date').textContent = new Date().toDateString();
    document.getElementById('temperature').textContent = `${Math.round(current.temp_c)}°C`;
    document.getElementById('description').textContent = current.condition.text;
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    document.getElementById('wind').textContent = `${current.wind_kph} km/h`;
    document.getElementById('windDirection').textContent = getWindDirection(current.wind_degree);
    document.getElementById('feelsLike').textContent = `${Math.round(current.feelslike_c)}°C`;
    document.getElementById('airPressure').textContent = `${current.pressure_mb} hPa`;
    document.getElementById('rainChance').textContent = `${today.daily_chance_of_rain}%`;
    document.getElementById('weatherIcon').src = `https:${current.condition.icon}`;
    document.getElementById('sunrise').textContent = astro.sunrise;
    document.getElementById('sunset').textContent = astro.sunset;

    // Altitude from Open-Meteo
    const altitudeEl = document.getElementById('altitude');
    altitudeEl.textContent = '...';
    const altitude = await getAltitude(loc.lat, loc.lon);
    altitudeEl.textContent = altitude !== null ? `${altitude}m` : 'N/A';

    weatherCard.classList.remove('hidden');
}

// Display 5-day forecast
function displayForecast(data) {
    const forecastDays = data.forecast.forecastday;

    forecastContainer.innerHTML = forecastDays.map(day => `
        <div class="forecast-day">
            <p>${new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</p>
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
            <p>${Math.round(day.day.avgtemp_c)}°C</p>
            <p>${day.day.condition.text}</p>
            <p>🌧 ${day.day.daily_chance_of_rain}%</p>
        </div>
    `).join('');
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
}

function hideError() {
    errorMsg.classList.add('hidden');
}