/**
 * 移除字符串后面的文件扩展名
 * @param {String} filename 文件路径或文件名
 * @returns 移除扩展名后的字符串
 */
function removeFileExtensionUtil(filename) {
    // 使用 lastIndexOf 方法查找最后一个点（.）的位置
    const lastDotIndex = filename.lastIndexOf('.');

    // 如果找到了点，并且点不在字符串的开头，则截取字符串到点之前的部分
    if (lastDotIndex !== -1 && lastDotIndex > 0) {
        return filename.slice(0, lastDotIndex);
    } else {
        // 如果没有找到点，或者点在字符串的开头，则返回原始字符串
        return filename;
    }
}

/**
 * 格式化时间戳为"20230101 - 1:00PM"
 * @param {int} timestamp 时间戳
 * @returns 格式化后的字符串
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    let formattedHours = hours % 12 || 12; // 转换为12小时制
    return `${year}/${month}/${day} - ${String(formattedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}${ampm}`;
}

/**
 * 下载传入的base64图片，下载的格式为png
 * @param {String} dataUrl 图像的dataUrl，需要包含前缀
 * @param {String} filename 文件名，不含后缀名
 */
function downloadImgUseBase64(dataUrl, filename) {
    if (!filename) filename = 'temp';
    const tempEl = document.createElement('a');
    tempEl.href = dataUrl;
    tempEl.download = filename + '.png';
    document.body.appendChild(tempEl);
    tempEl.click();
    document.body.removeChild(tempEl);
}

/**
 * 移除字符串首尾空格，*nodejs中的字符串没有自带这个方法*
 * @param {String} str 待处理字符串
 * @returns 处理好的字符串
 */
function trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

/**
 * 去除字符串头部空格
 * @param {String} str 待处理字符串
 * @returns 处理好的字符串
 */
function trimStart(str) {
    return str.replace(/^\s+/, '');
}

/**
 * 去除字符串所有空格
 * @param {String} str 带处理字符串
 * @returns 处理好的字符串
 */
function trimAll(str) {
    return str.replace(/\s+/g, '');
}

/**
 * 防抖
 * @param {Function} func 回调函数
 * @param {*} delay 延迟
 * @returns 防抖后的新函数
 */
function debounce(func, delay) {
    let timeout = null;

    return function (...args) {
        if (!timeout) {
            timeout = setTimeout(() => {
                timeout = null;
                func.apply(this, args);
            }, delay);
        }
    };
}