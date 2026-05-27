const API_KEY = 'cd4d8bafda629dbcb26154439759acd1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
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

async function getWeather(city) {
    try {
        hideError ();
        const response = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) throw new Error('City not found');

        const data = await response.json();
        displayWeather(data);
        getForecast(city);
        localStorage.setItem('lastCity', city);

    } catch (error) {
        showError('City not found. PLease try again.');
        weatherCard.classList.add('hidden');
        forecastContainer.innerHTML = '';
    }
}

async function getForecast(city) {
    try {
        const response = await fetch(
           `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric` 
        );
        const data = await response.json();

        // Show today's rain probability from first forecast entry
        const rainChance = Math.round((data.list[0].pop || 0) * 100);
        document.getElementById('rainChance').textContent = `${rainChance}%`;

        displayForecast(data);
    } catch (error) {
        console.error('Forecast error:', error);
    }
}

function displayWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('date').textContent = new Date().toDateString();
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind').textContent = `${data.wind.speed} m/s`;
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('weatherIcon').src = 
      `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    weatherCard.classList.remove('hidden');
}

function displayForecast(data) {
    //Get one forecast per day (every 8th item = 24hrs apart)
    const daily = data.list.filter((_, index) => index % 8 === 0).slice(0, 5);

    forecastContainer.innerHTML = daily.map(day => `
        <div class="forecast-day">
          <p>${new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' })}</p>
          <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}" />
          <p>${Math.round(day.main.temp)}°C</p>
          <p>${day.weather[0].main}</p>
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