export default class SkinMenu {
    el = null;
    /** 如果为 true，下次将打开默认右键菜单 */
    showDefaultMenu = false;

    constructor(el) {
        this.el = el;
    }


    open(e) {
        if (this.showDefaultMenu == true) {
            this.showDefaultMenu = false;
            return;
        } else e.preventDefault();

        const body = document.body;
        const pageX = e.pageX || (e.clientX + body.scrollLeft);
        const pageY = e.pageY || (e.clientY + window.scrollY);

        // 这里要先显示出来，要不然第一遍获取不到大小
        this.el.hidden = false;

        const elWidth = this.el.clientWidth;
        const elHeight = this.el.clientHeight;
        const margin = 20;

        const rightEdge = pageX + elWidth + margin;
        const bottomEdge = pageY + elHeight + margin;

        this.el.style.left = (rightEdge > window.innerWidth)
            ? `${window.innerWidth - elWidth - margin}px`
            : `${pageX}px`;

        this.el.style.top = (bottomEdge > window.innerHeight + window.scrollY)
            ? `${window.innerHeight - elHeight - margin + window.scrollY}px`
            : `${pageY}px`;
    }

    close() {
        this.el.hidden = true;
    }
}
