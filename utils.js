// utils.js (工具函数)

// 显示消息提示
function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 显示加载动画
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

// 隐藏加载动画
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 格式化日期 (YYYY/MM/DD)
function formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// Blob 转 Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// 检查网络状态
function checkNetwork() {
    return navigator.onLine;
}
// 添加事件监听的通用函数
function on(element, event, handler) {
    if (element && event && handler) {
        element.addEventListener(event, handler, false);
    }
}

// 移除事件监听的通用函数
function off(element, event, handler) {
    if (element && event) {
        element.removeEventListener(event, handler, false);
    }
}

//尝试解析JSON字符串，如果失败返回null
function tryParseJSONObject(jsonString){
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }

    return null;
};

export { showMessage, showLoading, hideLoading, formatDate, blobToBase64, checkNetwork, on, off, tryParseJSONObject };