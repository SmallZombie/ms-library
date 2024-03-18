const menu = {
    viewDefaultMenu: false,
    open: (event) => {
        const temp = document.getElementById('menu');

        if (menu.viewDefaultMenu == true) { // 是否打开原版菜单
            menu.viewDefaultMenu = false;
            return;
        } else event.preventDefault();

        const pageX = event.pageX || (event.clientX + document.body.scrollLeft);
        const pageY = event.pageY || (event.clientY + document.body.scrollTop);

        // 如果宽度超出视口宽度
        if (pageX + temp.clientWidth + 20 > window.innerWidth) {
            temp.style.left = `${window.innerWidth - temp.clientWidth - 20}px`;
        } else {
            temp.style.left = `${pageX}px`;
        }
        temp.style.top = `${pageY}px`;
        temp.classList.add('active'); // 显示菜单
    },
    close: () => {
        setTimeout(() => {
            const temp = document.getElementById('menu');
            temp.classList.remove('active');
        }, 20);
    },

    // 功能
    data: {
        name: void 0,
        id: void 0,
        slim: void 0
    },
    copySkinname: (text) => {
        navigator.clipboard.writeText(text);
    },
    downloadSkinImg: () => {document.execCommand('copy')},
    downloadViewImg: () => {document.execCommand('cut')},
    deleteSkin: () => {},
    text_default: () => {
        menu.viewDefaultMenu = true;
    }
};