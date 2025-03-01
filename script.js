// script.js (主程序入口)

import { initializeRecording } from './modules/recording.js';
import { initializePhotoUpload } from './modules/photo.js';
import { initializeWeather } from './modules/weather.js';
import { initializeHealth } from './modules/health.js';
import { initializeSettings } from './modules/settings.js';
import { showMessage, showLoading, hideLoading, formatDate, blobToBase64, checkNetwork, tryParseJSONObject } from './utils.js';


// Cloudflare Worker 的 URL (已设置为您的 Worker URL)
const WORKER_URL = 'https://time.zhangchiguojing.workers.dev';

// Cloudflare Worker 上传函数 (通用)
async function uploadToCloudflareWorker(blob, path, type) {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('path', path);
    formData.append('type', type);

    const response = await fetch(`${WORKER_URL}/upload`, {
        method: 'POST',
        body: formData,
    });
     if (!response.ok) {
        let errorText = await response.text();
        let errorData = tryParseJSONObject(errorText);
        throw new Error(`上传失败: ${response.status} - ${errorData && errorData.message ? errorData.message  : errorText}`);
    }
    return await response.json();
}

// 通过 Cloudflare Worker 同步健康数据
async function syncHealthDataToCloudflareWorker(healthData) {
    const response = await fetch(`${WORKER_URL}/sync-health`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData),
    });
    if (!response.ok) {
        let errorText = await response.text();
        let errorData = tryParseJSONObject(errorText);
        throw new Error(`同步健康数据失败: ${response.status} - ${errorData && errorData.message? errorData.message : errorText}`);
    }
    return await response.json();
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {

    try {
        await initializeRecording();
        initializePhotoUpload();
        initializeWeather();
        initializeHealth();
        initializeSettings();

        showMessage('应用初始化成功', 'success');
    } catch (error) {
        console.error('初始化失败:', error);
        showMessage('应用初始化失败，请刷新页面重试', 'error');
    }

    // 注册全局错误处理
    window.onerror = function (message, source, lineno, colno, error) {
        console.error("全局捕获错误:", error);
        showMessage('发生未知错误，请稍后重试', 'error');
    };

    // 监听网络状态变化
    window.addEventListener('online', () => {
        showMessage('网络已连接', 'success');
    });

    window.addEventListener('offline', () => {
        showMessage('网络已断开，数据将在恢复连接后同步', 'warning');
    });
});