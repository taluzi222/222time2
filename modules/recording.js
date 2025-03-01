// modules/recording.js (录音模块)

import { showMessage, showLoading, hideLoading, formatDate, on, off, getCalibratedTimestamp } from '../utils.js';
import { uploadToCloudflareWorker } from '../script.js';

let mediaRecorder;
let audioChunks = [];
let recordingTimer;
let isRecording = false;
let submitCount = 0; // 记录当天提交次数

async function initializeRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          //录音停止, 不直接保存, 等待用户点击"确认提交"
            // const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            // await saveRecording(audioBlob);
            // audioChunks = [];
        };

        mediaRecorder.onerror = (event) => {
            console.error("MediaRecorder error:", event.error);
            showMessage('录音出错：' + event.error.message, 'error');
        };

        const recordBtn = document.getElementById('recordBtn');
        on(recordBtn, 'click', toggleRecording);

        //新增： 提交按钮
        const submitRecordBtn = document.getElementById('submitRecordBtn');
        on(submitRecordBtn, 'click', submitRecording);


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
      // 使用校准后的时间来初始化计时器 (这里不直接影响文件名)
    getCalibratedTimestamp().then(timestamp => {
      recordingTimer = setInterval(() => {
          seconds++;
          document.getElementById('recordingTime').textContent = formatTime(seconds);
        }, 1000);
    })

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

// 新增: 提交录音和文字
async function submitRecording() {
  if (audioChunks.length === 0) {
        showMessage('请先录制一段音频', 'warning');
        return;
    }
  // 检查提交次数
  const today = formatDate(await getCalibratedTimestamp());
  const submitted = localStorage.getItem(`submitted_${today}`) || 0;
  if (parseInt(submitted) >= 10) {
    showMessage('今日录音/文字提交次数已达上限', 'warning');
     return;
  }

    showLoading();
    try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const timestamp = await getCalibratedTimestamp();  // 使用校准后的时间戳
        const fileName = `audio_${timestamp}.wav`; //修改文件名生成
        const date = formatDate(timestamp);
        const path = `recordings/${date}/${fileName}`;

        // 获取文本框内容
        const text = document.getElementById('recordText').value;

        // 将录音和文字一起发送到 Worker
        await uploadToCloudflareWorker(audioBlob, path, 'audio', text);

      // 更新提交次数
      localStorage.setItem(`submitted_${today}`, parseInt(submitted) + 1);

        showMessage('录音和文字已成功提交', 'success');
         // 清空录音数据和文本框
        audioChunks = [];
        document.getElementById('recordText').value = '';

    } catch (error) {
        console.error('提交录音和文字失败:', error);
        showMessage('提交失败: ' + error.message, 'error');
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