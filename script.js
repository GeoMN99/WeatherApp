const API_KEY = 'cd4d8bafda629dbcb26154439759acd1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

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

// Fetch weather by city name
async function getWeather(city) {
    try {
        hideError();
        const response = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) throw new Error('City not found');

        const data = await response.json();
        await displayWeather(data);
        getForecast(city);
        localStorage.setItem('lastCity', city);

    } catch (error) {
        showError('City not found. Please try again.');
        weatherCard.classList.add('hidden');
        forecastContainer.innerHTML = '';
    }
}

// Fetch weather by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        hideError();
        const response = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) throw new Error('Location not found');

        const data = await response.json();

        // Get accurate location name from Nominatim
        const accurateLocation = await getReverseGeocode(lat, lon);

        await displayWeather(data, accurateLocation);
        getForecastByCoords(lat, lon);
        localStorage.setItem('lastCity', data.name);
        cityInput.value = accurateLocation || data.name;

    } catch (error) {
        showError('Could not get weather for your location.');
        weatherCard.classList.add('hidden');
        forecastContainer.innerHTML = '';
    }
}

// Fetch forecast by city name
async function getForecast(city) {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();

        const rainChance = Math.round((data.list[0].pop || 0) * 100);
        document.getElementById('rainChance').textContent = `${rainChance}%`;

        displayForecast(data);
    } catch (error) {
        console.error('Forecast error:', error);
    }
}

// Fetch forecast by coordinates
async function getForecastByCoords(lat, lon) {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();

        const rainChance = Math.round((data.list[0].pop || 0) * 100);
        document.getElementById('rainChance').textContent = `${rainChance}%`;

        displayForecast(data);
    } catch (error) {
        console.error('Forecast error:', error);
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

// Reverse geocode coordinates to get accurate location name
async function getReverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'WeatherApp/1.0'
                }
            }
        );
        const data = await response.json();
        const address = data.address;

        // Build location string from most specific to least specific
        const parts = [
            address.road,
            address.suburb || address.neighbourhood || address.city_district,
            address.city || address.town || address.village,
            address.country_code ? address.country_code.toUpperCase() : null
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
    const locationName = accurateLocation || `${data.name}, ${data.sys.country}`;
    document.getElementById('cityName').textContent = locationName;
    document.getElementById('date').textContent = new Date().toDateString();
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind').textContent = `${data.wind.speed} m/s`;
    document.getElementById('windDirection').textContent = getWindDirection(data.wind.deg);
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('airPressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('weatherIcon').src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    // Sunrise & Sunset
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;

    // Altitude from Open-Meteo
    const altitudeEl = document.getElementById('altitude');
    altitudeEl.textContent = '...';
    const altitude = await getAltitude(data.coord.lat, data.coord.lon);
    altitudeEl.textContent = altitude !== null ? `${altitude}m` : 'N/A';

    weatherCard.classList.remove('hidden');
}

// Display 5-day forecast
function displayForecast(data) {
    const daily = data.list.filter((_, index) => index % 8 === 0).slice(0, 5);

    forecastContainer.innerHTML = daily.map(day => `
        <div class="forecast-day">
            <p>${new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' })}</p>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}" />
            <p>${Math.round(day.main.temp)}°C</p>
            <p>${day.weather[0].main}</p>
            <p>🌧 ${Math.round((day.pop || 0) * 100)}%</p>
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