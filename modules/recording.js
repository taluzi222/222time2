// modules/recording.js (录音模块)

import { showMessage, showLoading, hideLoading, formatDate, on, off } from '../utils.js';
import { uploadToCloudflareWorker } from '../script.js';

let mediaRecorder;
let audioChunks = [];
let recordingTimer;
let isRecording = false;

async function initializeRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await saveRecording(audioBlob);
            audioChunks = [];
        };

        mediaRecorder.onerror = (event) => {
            console.error("MediaRecorder error:", event.error);
            showMessage('录音出错：' + event.error.message, 'error');
        };

        const recordBtn = document.getElementById('recordBtn');
        on(recordBtn, 'click', toggleRecording);

    } catch (error) {
        console.error('无法访问麦克风:', error);
        showMessage('无法访问麦克风: ' + error.message, 'error');
    }
}

function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    mediaRecorder.start();
    isRecording = true;
    document.getElementById('recordBtn').classList.add('recording');
    document.getElementById('recordIcon').textContent = '⏹';
    document.getElementById('recordingStatus').textContent = '正在录音...';

    let seconds = 0;
    recordingTimer = setInterval(() => {
        seconds++;
        document.getElementById('recordingTime').textContent = formatTime(seconds);
    }, 1000);
}

function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('recordIcon').textContent = '⏺';
    document.getElementById('recordingStatus').textContent = '';
    clearInterval(recordingTimer);
    document.getElementById('recordingTime').textContent = '00:00';
}

async function saveRecording(audioBlob) {
    showLoading();
    try {
        const fileName = `audio_${Date.now()}.wav`;
        const date = formatDate();
        const path = `recordings/${date}/${fileName}`;

                // 使用 Cloudflare Worker 上传
        await uploadToCloudflareWorker(audioBlob, path, 'audio');
        showMessage('录音保存成功', 'success');

    } catch (error) {
        console.error('保存录音失败:', error);
        showMessage('录音保存失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// 格式化时间 (秒 -> mm:ss)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export { initializeRecording, toggleRecording };