// modules/photo.js (图片模块)

import { showMessage, showLoading, hideLoading, formatDate, on, off } from '../utils.js';
import { uploadToCloudflareWorker } from '../script.js';

function initializePhotoUpload() {
    const photoInput = document.getElementById('photoInput');
    const photoGrid = document.getElementById('photoGrid');

    on(photoInput, 'change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 9) {
            showMessage('一次最多只能上传9张图片', 'warning');
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
    const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const date = formatDate();
    const path = `photos/${date}/${fileName}`;    // 使用 Cloudflare Worker 上传
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
        div.appendChild(img);
        photoGrid.appendChild(div);
    };

    reader.readAsDataURL(file);
}

export { initializePhotoUpload };