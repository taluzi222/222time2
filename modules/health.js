// modules/health.js (健康记录模块)

import { showMessage, showLoading, hideLoading, formatDate, on, off, getCalibratedTimestamp } from '../utils.js';
import { syncHealthDataToCloudflareWorker } from '../script.js';

function initializeHealth() {
    const bloodPressureHigh = document.getElementById('bloodPressureHigh');
    const bloodPressureLow = document.getElementById('bloodPressureLow');
    const sleepQuality = document.getElementById('sleepQuality');
    const mood = document.getElementById('mood');

    loadTodayHealth();

    // 防抖函数 (简单实现)
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // 使用防抖保存健康记录
    const debouncedSaveHealthRecord = debounce(saveHealthRecord, 500); // 500ms 防抖

    [bloodPressureHigh, bloodPressureLow, sleepQuality, mood].forEach(element => {
        on(element, 'change', debouncedSaveHealthRecord)
    });
}

function generateHealthAdvice(record) {
    let advice = [];

    // 血压建议
    if (record.bloodPressureHigh && record.bloodPressureLow) {
        const high = parseInt(record.bloodPressureHigh);
        const low = parseInt(record.bloodPressureLow);

        if (high >= 140 || low >= 90) {
            advice.push('您的血压偏高，建议：\n1. 限制盐分摄入\n2. 保持心情舒畅\n3. 适量运动\n4. 规律作息');
        } else if (high <= 90 || low <= 60) {
            advice.push('您的血压偏低，建议：\n1. 适当补充盐分\n2. 多食用含铁食物\n3. 避免剧烈运动\n4. 注意保暖');
        } else {
            advice.push('您的血压正常，继续保持良好的生活习惯！');
        }
    }

    // 睡眠建议
    const sleepAdvice = {
        'very-good': '睡眠质量很好，继续保持！',
        'good': '睡眠质量不错，建议保持当前作息时间。',
        'normal': '睡眠质量一般，建议：\n1. 睡前1小时不要看手机\n2. 保持房间安静黑暗\n3. 适当运动有助于睡眠',
        'bad': '睡眠质量较差，建议：\n1. 固定作息时间\n2. 睡前避免咖啡因\n3. 睡前可以喝杯温牛奶\n4. 做些放松运动',
        'very-bad': '睡眠质量很差，建议：\n1. 考虑看医生咨询\n2. 检查睡眠环境\n3. 避免午后饮茶\n4. 晚上不要过度劳累'
    };
    if (record.sleepQuality) {
        advice.push(sleepAdvice[record.sleepQuality]);
    }

    // 心情建议
    const moodAdvice = {
        'very-happy': '心情非常好，祝您保持好心情！',
        'happy': '心情不错，继续保持积极乐观的态度！',
        'normal': '心情平静，这是很好的状态。',
        'sad': '心情不太好，建议：\n1. 听听喜欢的音乐\n2. 和家人聊聊天\n3. 出去散散步\n4. 做些自己喜欢的事',
        'very-sad': '心情很差，建议：\n1. 找人倾诉\n2. 做些放松的活动\n3. 适当运动\n4. 保持规律作息\n5. 如果持续心情低落，建议咨询医生'
    };
    if (record.mood) {
        advice.push(moodAdvice[record.mood]);
    }

    return advice;
}

// 显示健康建议 (修改为在页面中间弹出)
function showHealthAdvice(advice) {
    if (!advice || advice.length === 0) return;

    const modal = document.createElement('div');
    modal.className = 'health-advice-modal';
    modal.innerHTML = `
        <div class="health-advice-content">
            <h3>今日健康建议</h3>
            ${advice.map(item => `<p>${item}</p>`).join('')}
            <button onclick="this.parentElement.parentElement.remove()">知道了</button>
        </div>
    `;
    document.body.appendChild(modal);
}


async function loadTodayHealth() {
    // const today = formatDate(); //原始时间
    const timestamp = await getCalibratedTimestamp(); //使用校准后的时间
    const today = formatDate(timestamp);
    const healthData = JSON.parse(localStorage.getItem('healthRecords') || '{}');
    const todayRecord = healthData[today] || {};

    document.getElementById('bloodPressureHigh').value = todayRecord.bloodPressureHigh || '';
    document.getElementById('bloodPressureLow').value = todayRecord.bloodPressureLow || '';
    document.getElementById('sleepQuality').value = todayRecord.sleepQuality || '';
    document.getElementById('mood').value = todayRecord.mood || '';
}

async function saveHealthRecord() {
    // const today = formatDate(); //原始时间
    const timestamp = await getCalibratedTimestamp(); //使用校准后的时间
    const today = formatDate(timestamp);
    const healthData = JSON.parse(localStorage.getItem('healthRecords') || '{}');

    const record = {
        bloodPressureHigh: document.getElementById('bloodPressureHigh').value,
        bloodPressureLow: document.getElementById('bloodPressureLow').value,
        sleepQuality: document.getElementById('sleepQuality').value,
        mood: document.getElementById('mood').value,
        timestamp: timestamp, // 使用校准后的时间戳
    };

    // 添加健康建议
    record.advice = generateHealthAdvice(record);

    healthData[today] = record;
    localStorage.setItem('healthRecords', JSON.stringify(healthData));

    // 通过 Cloudflare Worker 同步
    try {
        await syncHealthDataToCloudflareWorker(healthData);
        showMessage('健康记录已保存', 'success');
    } catch (error) {
        console.error('同步健康记录失败:', error);
        showMessage('健康记录已本地保存，但同步失败', 'warning');
    }
    // 显示健康建议
    showHealthAdvice(record.advice);
}

export { initializeHealth };async function saveHealthRecord() {
    // const today = formatDate(); //原始时间
    const timestamp = await getCalibratedTimestamp(); //使用校准后的时间
    const today = formatDate(timestamp);
    const healthData = JSON.parse(localStorage.getItem('healthRecords') || '{}');

    const record = {
        bloodPressureHigh: document.getElementById('bloodPressureHigh').value,
        bloodPressureLow: document.getElementById('bloodPressureLow').value,
        sleepQuality: document.getElementById('sleepQuality').value,
        mood: document.getElementById('mood').value,
        timestamp: timestamp, // 使用校准后的时间戳
    };

    // 添加健康建议
    record.advice = generateHealthAdvice(record);

    healthData[today] = record;
    localStorage.setItem('healthRecords', JSON.stringify(healthData));

    // 通过 Cloudflare Worker 同步
    try {
        await syncHealthDataToCloudflareWorker(healthData);
        showMessage('健康记录已保存', 'success');
    } catch (error) {
        console.error('同步健康记录失败:', error);
        showMessage('健康记录已本地保存，但同步失败', 'warning');
    }
    // 显示健康建议
    showHealthAdvice(record.advice);
}

export { initializeHealth };