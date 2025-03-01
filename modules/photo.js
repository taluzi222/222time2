// modules/photo.js (图片模块)

import { showMessage, showLoading, hideLoading, formatDate, on, off, getCalibratedTimestamp } from '../utils.js';
import { uploadToCloudflareWorker } from '../script.js';

function initializePhotoUpload() {
    const photoInput = document.getElementById('photoInput');
    const photoGrid = document.getElementById('photoGrid');

    on(photoInput, 'change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 18) { //修改为18张
            showMessage('一次最多只能上传18张图片', 'warning');
            return;
        }

        showLoading();
        try {
                        for (const file of files) {
                await handleImageUpload(file);
            }
            showMessage('图片上传成功', 'success');
        } catch (error) {
            console.error('图片上传失败:', error);
            showMessage('图片上传失败', 'error');
        } finally {
            hideLoading();
            photoInput.value = ''; // 重置输入
        }
    });
}

async function handleImageUpload(file) {
    const compressedFile = await compressImage(file);
    // const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`; //原始文件名
    const timestamp = await getCalibratedTimestamp(); // 使用校准后的时间戳
    const fileName = `photo_${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`; //修改文件名
    const date = formatDate(timestamp);
    const path = `photos/${date}/${fileName}`;

    // 使用 Cloudflare Worker 上传, 图片不需要和文字一起, 直接上传。
    await uploadToCloudflareWorker(compressedFile, path, 'image');
    displayPhotoPreview(compressedFile);
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        new Compressor(file, {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1920,
            success: resolve,
            error: reject,
        });
    });
}

function displayPhotoPreview(file) {
    const photoGrid = document.getElementById('photoGrid');
    const reader = new FileReader();

    reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'photo-item';
        const img = document.createElement('img');
        img.src = e.target.result;
         // 新增：添加文字描述输入框
        const textarea = document.createElement('textarea');
        textarea.placeholder = '写下照片里的故事';
        div.appendChild(img);
        div.appendChild(textarea); // 将输入框添加到 photo-item
        photoGrid.appendChild(div);
    };

    reader.readAsDataURL(file);
}

export { initializePhotoUpload };