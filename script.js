const API_KEY = 'cd4d8bafda629dbcb26154439759acd1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherCard = document.getElementById('weatherCard');
const errorMsg = document.getElementById('errorMsg');
const forecastContainer = document.getElementById('foreccast');

// Load last searched city from localStorage