const API_KEY = 'cd4d8bafda629dbcb26154439759acd1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherCard = document.getElementById('weatherCard');
const errorMsg = document.getElementById('errorMsg');
const forecastContainer = document.getElementById('foreccast');

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
        getWeather(city);
        localStorage.setItem('lastCity', city);

    } catch (error) {
        showError('City not found. PLease try again.');
        weatherCard.classList.add('hidden');
        forecastContainer.innerHTML = '';
    }
}