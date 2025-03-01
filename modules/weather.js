// modules/weather.js (天气模块)

import { showMessage, showLoading, hideLoading, on, off } from '../utils.js';

let weatherData = null;
let weatherLastUpdate = null;

function initializeWeather() {
    const weatherBtn = document.getElementById('weatherBtn');
    const closeWeatherBtn = document.getElementById('closeWeatherBtn');
    const weatherModal = document.getElementById('weatherModal');
    const weatherVoiceBtn = document.getElementById('weatherVoiceBtn');
    const refreshWeatherBtn = document.getElementById('refreshWeatherBtn');

    on(weatherBtn, 'click', async () => {
        weatherModal.style.display = 'block';
        await updateWeather();
    });

     on(closeWeatherBtn, 'click', () => {
        weatherModal.style.display = 'none';
    });

    on(weatherVoiceBtn, 'click', () => {
        if (weatherData) {
            speakWeather(weatherData);
        }
    });

     on(refreshWeatherBtn, 'click', updateWeather);
}

async function updateWeather() {
    showLoading();
    try {
        const now = Date.now();
        if (weatherLastUpdate && (now - weatherLastUpdate < 300000)) {
            // 5分钟内不再更新
            return;
        }

        // 通过 Cloudflare Worker 获取天气数据
        const response = await fetch('/api/weather'); // 使用相对路径

        if (!response.ok) {

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.code && data.code !== "200") {
            throw new Error(`Weather API error! code: ${data.code}, msg: ${data.msg}`);
        }
        weatherData = {
            now: data.now,
            forecast: data.daily
        };

        weatherLastUpdate = now;
        displayWeather(weatherData);
        showMessage('天气信息已更新', 'success');

    } catch (error) {
        console.error('获取天气失败:', error);
        showMessage('获取天气失败: ' + error.message, 'error');

    } finally {
        hideLoading();
    }
}

function displayWeather(data) {
    const weatherInfo = document.getElementById('weatherInfo');
    const now = data.now;
    const forecast = data.forecast;

    let html = `
        <div class="current-weather">
            <h3>当前天气</h3>
            <p>温度: ${now.temp}°C</p>
            <p>体感温度: ${now.feelsLike}°C</p>
            <p>天气: ${now.text}</p>
            <p>风向: ${now.windDir}</p>
            <p>风力: ${now.windScale}级</p>
            <p>湿度: ${now.humidity}%</p>
        </div>
        <div class="weather-forecast">
            <h3>未来三天预报</h3>
    `;

    forecast.forEach(day => {
        html += `
            <div class="forecast-day">
                <h4>${new Date(day.fxDate).toLocaleDateString()}</h4>
                <p>白天: ${day.textDay} ${day.tempMax}°C</p>
                <p>夜间: ${day.textNight} ${day.tempMin}°C</p>
                <p>风向: ${day.windDirDay}</p>
                <p>风力: ${day.windScaleDay}级</p>
            </div>
        `;
    });

    html += '</div>';
    weatherInfo.innerHTML = html;
}

function speakWeather(data) {
    const now = data.now;
    const text = `当前温度${now.temp}度，天气${now.text}，风力${now.windScale}级，湿度${now.humidity}%`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
}

export { initializeWeather, updateWeather };