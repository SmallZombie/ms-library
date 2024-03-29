const allDia = []; // 所有存在的弹出框
/**
 * 弹出一个信息框
 * @param {string} message 消息文本
 * @param {int} type 消息类型，0：info(默认) 1：success 2：warning 3：error
 * @param {int} stayTime 停留时间(毫秒)，默认为 7 秒，0 为永远停留(不自动消失)
 */
function info(message, type = 0, stayTime = 7000) {
    if (!message) return;
    if (type === 3) console.error(message);

    // 创建元素
    const temp = document.createElement('div');
    const iconStyle = 'style="min-width: 20px; min-height: 20px; width: 1.3em; height: 1.3em; user-select: none; -webkit-user-drag: none;"'
    temp.innerHTML = `
        ${
                type === 0 && `<svg ${iconStyle} width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="none" stroke="#909399" stroke-width="4" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 11C25.3807 11 26.5 12.1193 26.5 13.5C26.5 14.8807 25.3807 16 24 16C22.6193 16 21.5 14.8807 21.5 13.5C21.5 12.1193 22.6193 11 24 11Z" fill="#909399"/><path d="M24.5 34V20H23.5H22.5" stroke="#909399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 34H28" stroke="#909399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
            || type === 1 && `<svg ${iconStyle} width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="none" stroke="#67c23a" stroke-width="4" stroke-linejoin="round"/><path d="M16 24L22 30L34 18" stroke="#67c23a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
            || type === 2 && `<svg ${iconStyle} width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="none" stroke="#e6a23c" stroke-width="4" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24 37C25.3807 37 26.5 35.8807 26.5 34.5C26.5 33.1193 25.3807 32 24 32C22.6193 32 21.5 33.1193 21.5 34.5C21.5 35.8807 22.6193 37 24 37Z" fill="#e6a23c"/><path d="M24 12V28" stroke="#e6a23c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
            || type === 3 && `<svg ${iconStyle} width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="none" stroke="#f56c6c" stroke-width="4" stroke-linejoin="round"/><path d="M29.6567 18.3432L18.343 29.6569" stroke="#f56c6c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.3433 18.3432L29.657 29.6569" stroke="#f56c6c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        }
        <p style="flex: 1;">${message}</p>
        <svg class="close" style="min-width: 20px; min-height: 20px; width: 1.3em; height: 1.3em; user-select: none; -webkit-user-drag: none; cursor: pointer;" width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 14L34 34" stroke="#909399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 34L34 14" stroke="#909399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `
    temp.classList.add('dialog');
    temp.style.zIndex = 114514;
    temp.style.position = 'fixed';
    temp.style.display = 'flex';
    temp.style.alignItems = 'center';
    temp.style.gap = '8px';
    temp.style.margin = '0 15px';
    temp.style.padding = '10px';
    temp.style.borderRadius = '5px';
    temp.style.border = 'transparent 1px solid';
    // temp.style.boxShadow = 'rgba(136, 165, 191, 0.48) 6px 2px 16px 0px, rgba(255, 255, 255, 0.8) -6px -2px 16px 0px';
    temp.style.boxShadow = '#00000010 3px 3px 17px 1px';
    temp.style.transition = 'top .2s cubic-bezier(0.23, 0.97, 0.51, 0.98)';
    switch (type) {
        case 0: { // info
            temp.style.color = '#909399';
            temp.style.backgroundColor = '#f4f4f5';
            temp.style.borderColor = '#e9e9eb';
            break;
        }
        case 1: { // success
            temp.style.color = '#67c23a';
            temp.style.backgroundColor = '#f0f9eb';
            temp.style.borderColor = '#e1f3d8';
            break;
        }
        case 2: { // warning
            temp.style.color = '#e6a23c';
            temp.style.backgroundColor = '#fdf6ec';
            temp.style.borderColor = '#faecd8';
            break;
        }
        case 3: { // error
            temp.style.color = '#f56c6c';
            temp.style.backgroundColor = '#fef0f0';
            temp.style.borderColor = '#fde2e2';
            break;
        }
    }

    // 关闭
    temp.querySelector('.close').addEventListener('click', () => {
        info_close(temp);
    })

    // 弹出
    document.body.appendChild(temp);
    allDia.push(temp);
    temp.style.left = (window.innerWidth - temp.clientWidth - parseFloat(window.getComputedStyle(temp).marginLeft) * 2) / 2 + 'px'; // 只有在弹出后才能拿到宽度
    temp.style.top = '-' + (temp.clientHeight + 30) + 'px'; // 只有在弹出后才能拿到高度
    setTimeout(() => temp.style.top = '20px');

    // 自动关闭
    if (stayTime !== 0) setTimeout(() => info_close(temp), stayTime);
}

function info_close(el) {
    if (el) {
        allDia.splice(allDia.indexOf(el), 1);
        el.style.top = '-100px';
        setTimeout(() => el.remove(), 230);
    }
}

/**
 * 弹出一个确认框
 * @param {string} title 标题(不可空)
 * @param {text} text 正文(可空)
 */
function confirm(title, text) {
    return new Promise((resolve, reject) => {
        let el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.top = '50%';
        el.style.left = '50%';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.zIndex = 113;
        el.style.backgroundColor = '#fff';
        el.style.borderRadius = '5px';
        el.style.padding = '10px';
        // el.style.boxShadow = 'rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px';
        el.style.boxShadow = '#00000010 3px 3px 17px 1px';
        el.style.minWidth = '20vw';

        let p1 = document.createElement('p');
        p1.innerText = title;
        p1.style.width = '100%';
        p1.style.textAlign = 'left';
        p1.style.fontSize = '1.2rem';
        el.appendChild(p1);

        let p2 = document.createElement('p');
        p2.innerText = text;
        p2.style.width = '100%';
        p2.style.textAlign = 'left';
        p2.style.fontSize = '.9rem';
        p2.style.color = '#777777';
        p2.style.padding = '2px 0 12px 0';
        el.appendChild(p2);

        let div = document.createElement('div');
        div.style.marginLeft = 'auto';

        let div_button1 = document.createElement('button');
        div_button1.style.fontSize = '.92rem';
        div_button1.style.padding = '6px 18px';
        div_button1.style.borderRadius = '5px';
        // div_button1.style.boxShadow = 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px';
        div_button1.style.boxShadow = '#00000010 3px 3px 17px 1px';
        div_button1.style.border = '#eeeeee 1px solid';
        div_button1.style.transition = 'background-color .1s';

        let div_button2 = div_button1.cloneNode(true);

        div_button1.innerText = '取消';
        div_button1.style.backgroundColor = '#fff';
        div_button1.addEventListener('mouseenter', () => {
            div_button1.style.backgroundColor = '#eeeeee';
        });
        div_button1.addEventListener('mouseleave', () => {
            div_button1.style.backgroundColor = '#fff';
        });
        div_button1.addEventListener('mousedown', () => {
            div_button1.style.backgroundColor = '#e6e6e6';
        });
        div_button1.addEventListener('mouseup', () => {
            div_button1.style.backgroundColor = '#fff';
        });

        div_button2.innerText = '确定';
        div_button2.style.marginLeft = '5px';
        div_button2.style.color = '#fff';
        div_button2.style.backgroundColor = '#4a90e2';
        div_button2.addEventListener('mouseenter', () => {
            div_button2.style.backgroundColor = '#5199eb';
        });
        div_button2.addEventListener('mouseleave', () => {
            div_button2.style.backgroundColor = '#4a90e2';
        });
        div_button2.addEventListener('mousedown', () => {
            div_button2.style.backgroundColor = '#448ee2';
        });
        div_button2.addEventListener('mouseup', () => {
            div_button2.style.backgroundColor = '#4a90e2';
        });

        div_button1.addEventListener('click', () => {
            el.remove();
            // callback && callback(false);
            resolve(false);
        });
        div_button2.addEventListener('click', () => {
            el.remove();
            // callback && callback(true);
            resolve(true);
        });

        div.appendChild(div_button1);
        div.appendChild(div_button2);
        el.appendChild(div);
        document.body.appendChild(el);
    });
}


window.addEventListener('resize', debounce(() => {
    for (el of allDia) {
        el.style.left = (window.innerWidth - el.clientWidth - parseFloat(window.getComputedStyle(el).marginLeft) * 2) / 2 + 'px';
    }
}, 300));


/** 防抖，内部使用 */
function debounce(func, delay) {
    let timeout = null;

    return function (...args) {
        if (!timeout) {
            timeout = setTimeout(() => {
                timeout = null;
                func.apply(this, args);
            }, delay);
        }
    }
}

export {
    info,
    info_close,
    confirm
}
