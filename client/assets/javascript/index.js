import { info } from '../lib/popup.js';
import SkinMenu from '../lib/menu.js';
import { downloadImgUseBase64 } from './global.js';


const els = {}
const data = {
    /** 仅在初始获取时缓存，不会自动更新 */
    skins: null
}
const addList = [];


// 初始化皮肤右键菜单
const skinMenu = new SkinMenu(document.querySelector('body > .skinMenu'));


window.addEventListener('load', () => {
    // 准备元素
    els.filters = document.querySelector('.filters');
    els.filters_loading = document.querySelector('main .loading');

    els.itemBox = document.querySelector('main .main');

    els.addBtn = document.querySelector('header .right .addBtn');
    els.addMore_siteBtn = document.querySelector('header .right .popup .addFromSiteBtn');
    els.fileInput = document.querySelector('header .right input[type="file"]');
    els.dragMask = document.querySelector('.dragMask');

    els.skinMenu = document.querySelector('.skinMenu');
    els.skinMenu_title = els.skinMenu.querySelector('.title');
    els.skinMenu_copyName = els.skinMenu.querySelector('.itemBox .copyName');
    els.skinMenu_download = els.skinMenu.querySelector('.itemBox .download');
    els.skinMenu_downloadPreview = els.skinMenu.querySelector('.itemBox .downloadPreview');
    els.skinMenu_rename = els.skinMenu.querySelector('.itemBox .rename');
    els.skinMenu_switch = els.skinMenu.querySelector('.itemBox .switch');
    els.skinMenu_delete = els.skinMenu.querySelector('.itemBox .delete');
    els.skinMenu_cancel = els.skinMenu.querySelector('.itemBox .cancel');
    els.skinMenu_showDefMenu = els.skinMenu.querySelector('.itemBox .showDefMenu');
    els.skinMenu_renameDialog = document.querySelector('dialog.rename');
    els.skinMenu_renameDialog_skinName = els.skinMenu_renameDialog.querySelector('.skinName');
    els.skinMenu_renameDialog_form = els.skinMenu_renameDialog.querySelector('.content');
    els.skinMenu_renameDialog_input = els.skinMenu_renameDialog.querySelector('input');
    els.skinMenu_renameDialog_cancelBtn = els.skinMenu_renameDialog.querySelector('.btnBox .cancel');
    els.skinMenu_renameDialog_confirmBtn = els.skinMenu_renameDialog.querySelector('.btnBox .confirm');

    els.addDialog = document.querySelector('dialog.addDialog');
    els.addDialog_previewImg = els.addDialog.querySelector('.preview img');
    els.addDialog_closeBtn = els.addDialog.querySelector('.header .closeBtn');
    els.addDialog_list = els.addDialog.querySelector('.content .itemBox');
    els.addDialog_addMore = els.addDialog.querySelector('.content .addMore');
    els.addDialog_addFromSiteBtn = els.addDialog.querySelector('.content .btnBox .fromSite');
    els.addDialog_count = els.addDialog.querySelector('.content .bottomBar .count')
    els.addDialog_cancelBtn = els.addDialog.querySelector('.bottomBar .cancel');
    els.addDialog_startBtn = els.addDialog.querySelector('.content .bottomBar .btnBox .start');
    els.addDialog_cancelConfirmDialog = els.addDialog.querySelector('dialog.cancelConfirm');
    els.addDialog_cancelConfirmDialog_cancelBtn = els.addDialog_cancelConfirmDialog.querySelector('.btnBox .cancel');
    els.addDialog_cancelConfirmDialog_confirmBtn = els.addDialog_cancelConfirmDialog.querySelector('.btnBox .confirm');


    els.tempCanvas = document.createElement('canvas');
    els.tempCanvas.width = 300;
    els.tempCanvas.height = 400;


    reloadData().then(() => {
        // 初始化筛选器
        Filter.init();

        // 重载页面
        reloadDom();
    }).catch(e => {
        info('加载失败：' + e, 3);
        return;
    });


    // 皮肤菜单，复制皮肤名
    els.skinMenu_copyName.addEventListener('click', () => {
        navigator.clipboard.writeText(els.skinMenu.getAttribute('data-name'));
    });
    // 皮肤菜单，下载原图
    els.skinMenu_download.addEventListener('click', () => {
        const item = getSkin(els.skinMenu.getAttribute('data-id'));
        downloadImgUseBase64(item.file.data, item.name);
    });
    // 皮肤菜单，下载预览图
    els.skinMenu_downloadPreview.addEventListener('click', () => {
        const item = getSkin(els.skinMenu.getAttribute('data-id'));
        downloadImgUseBase64(item.preview.data, item.name + '_preview');
    });
    // 皮肤菜单，重命名
    els.skinMenu_rename.addEventListener('click', () => {
        els.skinMenu_renameDialog_skinName.innerText = els.skinMenu.getAttribute('data-name');
        els.skinMenu_renameDialog.showModal();
    });
    // 皮肤菜单，重命名弹出层
    els.skinMenu_renameDialog.addEventListener('cancel', e => e.preventDefault());
    // 皮肤菜单，重命名弹出层，取消
    els.skinMenu_renameDialog_cancelBtn.addEventListener('click', () => els.skinMenu_renameDialog.close());
    // 皮肤菜单，重命名弹出层，提交
    els.skinMenu_renameDialog_form.addEventListener('submit', () => {
        const confirmBtnTextBak = els.skinMenu_renameDialog_confirmBtn.innerText;
        els.skinMenu_renameDialog_confirmBtn.disabled = true;
        els.skinMenu_renameDialog_confirmBtn.innerText = '...';

        const input = els.skinMenu_renameDialog_input.value.trim();
        if (input === '') return;

        const currId = Number(els.skinMenu.getAttribute('data-id'));

        fetch('/renameById?id=' + currId, {
            method: 'PUT',
            body: {
                newName: input
            }
        }).then(res => {
            if (res.code === 200) {
                info('重命名成功', 1, 3000);
                setSkin(currId, {
                    name: input
                });

                els.skinMenu_renameDialog.close();
            } else throw new Error('重命名失败：' + res.message);
        }).catch(e => info(e, 3)).finally(() => {
            els.skinMenu_renameDialog_confirmBtn.disabled = false;
            els.skinMenu_renameDialog_confirmBtn.innerText = confirmBtnTextBak;
        });
    });
    // 皮肤菜单，切换样式(经典/纤细)
    els.skinMenu_switch.addEventListener('click', async () => {
        // 重新生成预览图
        const item = els.itemBox.querySelector(`li[data-id="${els.skinMenu.getAttribute('data-id')}"]`);
        const newSlim = !(item.getAttribute('data-slim') === 'true');
        const currId = Number(item.getAttribute('data-id'));

        item.classList.add('processing');

        item.setAttribute('data-slim', newSlim);

        const newPreview = await spawn(
            data.skins.find(v => v.id === currId).file.data,
            els.tempCanvas,
            newSlim
        );

        fetch('/setArmStyle?id=' + currId, {
            method: 'PUT',
            body: {
                newSlim,
                newPreview: {
                    data: newPreview
                }
            }
        }).then(res => {
            if (res.code === 200) {
                info('切换成功', 1, 3000);

                item.setAttribute('data-slim', newSlim);
                // BUG(202403280253) 这里貌似是因为浏览器缓存的问题
                // 切换一次皮肤后进入详情页再返回，预览图会变回去
                item.querySelector('img').src = newPreview;
                item.classList.remove('processing');
            } else throw new Error('切换失败：' + res.message);
        }).catch(e => info(e, 3)).finally(() => item.classList.remove('processing'));
    });
    // 皮肤菜单，删除
    els.skinMenu_delete.addEventListener('click', () => {
        const currId = Number(els.skinMenu.getAttribute('data-id'));

        fetch('/deleteSkinById?id=' + currId, { method: 'DELETE' }).then(res => {
            if (res.code === 200) {
                info('删除成功', 1, 3000);
                removeSkin(currId);
            } else throw new Error('删除失败：' + res.message);
        }).catch(e => info(e, 3));
    });
    // 皮肤菜单，取消 & 关闭
    window.addEventListener('click', () => skinMenu.close());
    // 皮肤菜单，显示原版菜单
    els.skinMenu_showDefMenu.addEventListener('click', () => skinMenu.showDefaultMenu = true);

    // 文件选择
    els.fileInput.addEventListener('change', () => {
        if (els.fileInput.files.length === 0) return;

        addFromFile(els.fileInput.files);
    });
    // 更多，从站点添加
    els.addMore_siteBtn.addEventListener('click', () => addFromSite());
    // 上传窗口，关闭 & 取消
    els.addDialog.addEventListener('cancel', e => {
        e.preventDefault();
        els.addDialog_closeBtn.click();
    });
    els.addDialog_closeBtn.addEventListener('click', () => {
        // 如果有没有完成的项目
        if (addList.findIndex(v => v.state !== State.SUCCESS) !== -1) {
            els.addDialog_cancelConfirmDialog.showModal(); // 显示提示 / 二次确认
        } else els.addDialog.close(); // 否则可以直接关
    });
    els.addDialog_cancelBtn.addEventListener('click', () => els.addDialog_closeBtn.click());
    // 上传窗口，继续添加，从站点添加
    els.addDialog_addFromSiteBtn.addEventListener('click', () => addFromSite());
    // 上传窗口，开始添加
    els.addDialog_startBtn.addEventListener('click', () => startAdd());
    // 上传窗口，取消确认弹出层，取消
    els.addDialog_cancelConfirmDialog_cancelBtn.addEventListener('click', () => {
        els.addDialog_cancelConfirmDialog.close();
    });
    // 上传窗口，取消确认弹出层，确认
    els.addDialog_cancelConfirmDialog_confirmBtn.addEventListener('click', () => {
        els.addDialog_cancelConfirmDialog.close();
        els.addDialog.close();

        // 清除待添加列表
        clearAddList();

        // 清除预览图
        els.addDialog_previewImg.src = '';
    });

    // 拖放上传，body 进入
    document.body.addEventListener('dragenter', e => {
        e.preventDefault();
        els.dragMask.classList.add('show');
    });
    // 拖放上传，mask 进入
    els.dragMask.addEventListener('dragenter', e => e.preventDefault());
    // 拖放上传，mask 离开
    els.dragMask.addEventListener('dragleave', e => {
        e.preventDefault();
        els.dragMask.classList.remove('show');
    });
    // 拖放上传，body 结束
    els.dragMask.addEventListener('dragover', e => e.preventDefault());
    function _dropHandle(e) {
        els.dragMask.classList.remove('show');
        if (e.dataTransfer.types.length !== 1 || e.dataTransfer.types[0] !== 'Files') {
            info('无效文件', 3, 3000);
        } else addFromFile(e.dataTransfer.files);
    }
    // 拖放上传，mask 放
    els.dragMask.addEventListener('drop', e => {
        e.preventDefault();
        _dropHandle(e);
    });
    // 拖放上传，弹出层 结束
    els.addDialog.addEventListener('dragover', e => e.preventDefault());
    // 拖放上传，弹出层 放
    els.addDialog.addEventListener('drop', e => {
        e.preventDefault();
        _dropHandle(e);
    });
});


class State {
    static WAITING = 'waiting';
    static READY = 'ready';
    static PROCESSING = 'processing';
    static SUCCESS = 'success';
    static ERROR = 'error';
}

/**
 * ops 需要可以包含的属性：
 * name: 初始名称，留空为默认
 * type: 类型，可以留空
 * slim: 是否为纤细
 */
class BaseAdd {
    name = '未命名皮肤';
    type = '';
    tags = [];
    /** 该字段将决定此项是否为支持的文件，默认为 `undefined`，如果为 `null` 就是不支持，`true`/`false` 为支持的文件 */
    slim = void 0;

    /** 原图 base64 缓存，在第一次调用 `getSkinBase64` 时初始化 */
    skinBase64 = null;
    /** 预览图 base64 缓存，在第一次调用 `getPreviewBase64` 时初始化 */
    previewBase64 = null;

    els = {}

    constructor(ops) {
        if (ops) {
            if (ops.name !== void 0) this.name = ops.name;
            if (ops.type !== void 0) this.type = ops.type;
            if (ops.slim !== void 0) this.slim = ops.slim;
        }


        const li = document.createElement('li');
        li.innerHTML = `
            <div class="_preview">
                <img alt="preview">
            </div>
            <div class="center">
                <div class="meta">
                    <input type="text" value="${this.name}" title="皮肤名" placeholder="皮肤名" class="nameInput">
                    <input type="text" value="${this.type}" title="分类" placeholder="分类" class="typeInput">
                    <label class="slim">
                        <input type="checkbox" ${this.slim ? 'checked' : '' } hidden>
                        <div class="cbx">
                            <svg width="24" height="24" viewBox="0 0 12 11">
                                <polyline points="1 6.29411765 4.5 10 11 1"></polyline>
                            </svg>
                        </div>
                        <span>纤细</span>
                    </label>
                </div>
                <ul class="tags">
                    <li class="add">
                        <form onsubmit="return false">
                            <input type="text" title="输入标签" placeholder="添加标签">
                            <button class="addBtn" title="添加">
                                <img src="assets/icon/add.svg" alt="add">
                            </button>
                        </form>
                    </li>
                </ul>
                <p class="errLens"></p>
            </div>
            <div class="_right">
                <span class="state waiting">准备中</span>
                <button class="removeBtn">
                    <img src="assets/icon/close.svg" alt="remove">
                </button>
            </div>

            <div class="mask">
                <span>准备中</span>
            </div>
        `;

        // els
        this.els.root = li;
        this.els.previewImg = this.els.root.querySelector('._preview img');
        this.els.center = this.els.root.querySelector('.center');
        this.els.center_meta = this.els.center.querySelector('.center .meta');
        this.els.center_meta_nameInput = this.els.center_meta.querySelector('.nameInput');
        this.els.center_meta_typeInput = this.els.center_meta.querySelector('.typeInput');
        this.els.center_meta_slim = this.els.center_meta.querySelector('.slim');
        this.els.center_meta_slimInput = this.els.center_meta.querySelector('.slim input');
        this.els.center_tags = this.els.center.querySelector('.tags');
        this.els.center_tags_add = this.els.center.querySelector('.tags .add');
        this.els.center_tags_add_input = this.els.center.querySelector('.tags .add input');
        this.els.center_tags_add_addBtn = this.els.center.querySelector('.tags .add button');
        this.els.center_errLens = this.els.center.querySelector('.errLens');
        this.els.state = this.els.root.querySelector('._right .state');
        this.els.removeBtn = this.els.root.querySelector('._right .removeBtn');
        this.els.mask = this.els.root.querySelector('.mask');

        // events
        // 点击预览
        this.els.previewImg.addEventListener('click', e => {
            if (this.slim === null) {
                els.addDialog_previewImg.src = e.target.src;
            } else {
                this.getPreviewBase64().then(res => {
                    if (res) els.addDialog_previewImg.src = res;
                });
            }
        });
        // 修改名字
        this.els.center_meta_nameInput.addEventListener('change', e => this.name = e.target.value);
        // 修改分类
        this.els.center_meta_typeInput.addEventListener('change', e => this.type = e.target.value);
        // 是否纤细
        this.els.center_meta_slimInput.addEventListener('change', e => {
            this.slim = e.target.checked;

            // 重新生成预览
            this.previewBase64 = null;
            this.getPreviewBase64().then(res => {
                els.addDialog_previewImg.src = res;
            });
        });
        // 添加标签
        this.els.center_tags_add_addBtn.addEventListener('click', () => {
            const value = this.els.center_tags_add_input.value.trim();
            if (value === '') return;

            this.addTag(value);
            this.els.center_tags_add_input.value = '';
            this.els.center_tags_add_input.focus();
        });
        // 移除
        this.els.removeBtn.addEventListener('click', () => this.remove());

        els.addDialog_list.appendChild(li);
        addList.push(this);
        els.addDialog_count.innerText = addList.length;

        // 为 `getSkinBase64` 和 `getPreviewBase64` 添加缓存
        if (this.getSkinBase64) {
            this._getSkinBase64 = this.getSkinBase64;

            this.getSkinBase64 = () => {
                return new Promise((resolve, reject) => {
                    if (this.skinBase64) resolve(this.skinBase64);

                    this._getSkinBase64().then(res => {
                        if (res) this.skinBase64 = res;
                        resolve(res);
                    }).catch(e => reject(e));
                });
            }
        }
        if (this.getPreviewBase64) {
            this._getPreviewBase64 = this.getPreviewBase64;

            this.getPreviewBase64 = () => {
                return new Promise((resolve, reject) => {
                    if (this.previewBase64) resolve(this.previewBase64);

                    this._getPreviewBase64().then(res => {
                        if (res) this.previewBase64 = res;
                        resolve(res);
                    }).catch(e => reject(e));
                });
            }
        }
    }


    remove() {
        this.els.root.remove();
        addList.splice(addList.indexOf(this), 1);
    }

    addTag(name) {
        if (this.tags.includes(name)) return;

        this.tags.push(name);

        const li = document.createElement('li');
        li.innerHTML = `
            <span>${name}</span>
            <button>
                <img src="assets/icon/close.svg" alt="remove">
            </button>
        `;

        // events
        li.querySelector('button').addEventListener('click', () => {
            li.remove();
            this.tags.splice(this.tags.indexOf(name), 1);
        });

        this.els.center_tags.insertBefore(li, this.els.center_tags_add);
    }

    /**
     * 更新条目状态，目前的状态更新只能：
     * 1. 准备中(waiting) -> 就绪(ready)
     * 2. 就绪(ready) -> 准备中(waiting)
     * 3. 就绪(ready) -> 进行中(processing)
     * 4. 进行中(processing) -> 成功(success)
     * 5. 进行中(processing) -> 失败(error)
     * @param {State} newState 新的状态
     */
    updateState(newState) {
        if (this.state === newState) return;

        this.state = newState;

        switch (newState) {
            case State.WAITING:
                this.els.state.classList.remove('ready');
                this.els.state.classList.add('waiting');
                this.els.state.innerText = '准备中';
                break;
            case State.READY:
                this.els.mask.classList.remove('show');
                this.els.state.innerText = '就绪';
                this.els.center_errLens.innerText = '';

                break;
            case State.PROCESSING:
                this.els.state.classList.remove('ready');
                this.els.state.classList.add('processing');
                this.els.state.innerText = '进行中';

                // 禁用所有输入框
                const inputs = this.els.root.querySelectorAll('input');
                inputs.forEach(v => v.disabled = true);

                break;
            case State.SUCCESS:
                this.els.state.classList.remove('processing');
                this.els.state.classList.add('success');
                this.els.state.innerText = '成功';

                break;
            case State.ERROR:
                this.els.state.classList.remove('processing');
                this.els.state.classList.add('error');
                this.els.state.innerText = '失败';
        }
    }

    showMask() {
        this.els.mask.classList.add('show');
    }

    hideMask() {
        this.els.mask.classList.remove('show');
    }
}
class AddFromFile extends BaseAdd {
    file = null;

    constructor(file) {
        super({
            name: file.name.split('.').shift()
        });

        // els
        this.file = file;

        // 显示原图
        this.getSkinBase64().then(res => {
            this.els.previewImg.src = res;
        });

        // 是否为支持的皮肤
        this.getPreviewBase64().then(() => {
            if (this.slim === null) {
                this.els.center_meta_slim.hidden = true;
            }
        });

        this.updateState(State.READY);
    }


    getSkinBase64() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(this.file);
        });
    }

    /**
     * 获取皮肤预览图，非标准皮肤无法生成将会返回 null
     * @returns {String} 皮肤预览图 base64
     */
    getPreviewBase64() {
        return new Promise(async (resolve, reject) => {
            // 如果还没有检查
            if (this.slim === void 0) {
                const img = new Image();
                const skinBase64 = await this.getSkinBase64();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = skinBase64;
                }).catch(e => reject(e));

                this.slim = (img.width === 64 && img.height === 64) ? false : null;
            }

            // 如果可以生成
            if (this.slim !== null) {
                resolve(await spawn(
                    await this.getSkinBase64(),
                    els.tempCanvas,
                    this.slim
                ));
            } else resolve(null);
        });
    }

    getData() {
        return new Promise(async (resolve, reject) => {
            const skinBase64 = await this.getSkinBase64();
            const previewBase64 = await this.getPreviewBase64();

            const data = {
                file: {
                    name: this.file.name,
                    modified_date: this.file.lastModified,
                    data: skinBase64,
                    md5: await this.#calculateMD5()
                }
            }

            if (previewBase64) data.preview = {
                data: previewBase64
            }

            resolve(data);
        });
    }

    #calculateMD5() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = e.target.result;
                const md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(data)).toString();
                resolve(md5);
            };
            reader.onerror = reject;
            reader.readAsBinaryString(this.file);
        });
    }
}
class AddFromSite extends BaseAdd {
    url = null;
    skinBase64 = null;

    constructor() {
        super({
            slim: false
        });

        const div = document.createElement('div');
        div.classList.add('link');
        div.innerHTML = `
            <img src="assets/icon/link.svg" alt="link" title="从链接添加的项目">
            <input type="text" title="链接" placeholder="链接">
        `;
        this.els.center.insertBefore(div, this.els.center_tags);

        // els
        this.els.center_link = div;
        this.els.center_linkInput = this.els.center.querySelector('.link input');

        // events
        this.els.center_linkInput.addEventListener('change', e => {
            this.url = e.target.value.trim();

            // 显示遮罩
            this.showMask();

            // 获取信息
            fetch('/getSkinFromUrl?url=' + this.url).then(res => {
                if (res.code === 200) {
                    this.name = res.data.name;
                    this.els.center_meta_nameInput.value = res.data.name;
                    this.skinBase64 = 'data:image/png;base64,' + res.data.skinBase64;

                    // 显示预览图
                    this.els.previewImg.src = this.skinBase64;

                    this.updateState(State.READY);
                } else {
                    this.els.center_errLens.innerText = '不支持的站点';
                    this.els.previewImg.src = '';

                    this.updateState(State.WAITING);
                }
                this.hideMask();
            });
        });
    }


    getSkinBase64() {
        return new Promise((resolve, reject) => {
            resolve(this.skinBase64);
        });
    }

    getPreviewBase64() {
        return new Promise(async (resolve, reject) => {
            spawn(
                await this.getSkinBase64(),
                els.tempCanvas,
                this.slim
            ).then(res => resolve(res)).catch(e => reject(e));
        });
    }

    async getData() {
        const skinBase64 = await this.getSkinBase64();

        return {
            source: {
                url: this.url
            },
            file: {
                data: skinBase64,
                md5: CryptoJS.MD5(skinBase64).toString()
            },
            preview: {
                data: await this.getPreviewBase64()
            }
        }
    }
}

function addFromFile(files) {
    for (const i of files) {
        if (i.size > 102400) { // 100kb
            info(`文件过大：${i.name}(${parseInt(i.size / 1024)}kb)`, 3);
        } else new AddFromFile(i);
    }
    if (addList.length > 0) els.addDialog.showModal();
}

function addFromSite() {
    els.addDialog.showModal();
    new AddFromSite(addList);
}

/** 开始添加 */
async function startAdd() {
    if (addList.length === 0) return;

    for (const i of addList) {
        // 如果弹出层关闭了就说明取消了
        if (!els.addDialog.open) continue;
        // 如果已经成功就跳过
        if (i.state === State.SUCCESS) continue;

        // 未准备好且不是已完成状态
        if (i.state !== State.READY && i.state !== State.SUCCESS) {
            info('无法开始：存在未就绪的项目', 3, 3000);
            return;
        }
    }

    // 隐藏继续添加
    els.addDialog_addMore.disabled = true;
    // 禁用开始添加按钮
    els.addDialog_startBtn.disabled = true;
    const startAddTextBak = els.addDialog_startBtn.innerText;
    els.addDialog_startBtn.innerText = '...';

    for (const i of addList) {
        if (i.state !== State.READY || !els.addDialog.open) continue;

        i.updateState(State.PROCESSING);

        // 开始上传
        const body = Object.assign({
            // 这几个属性是固定字段，可以直接获取
            name: i.name,
            type: i.type || null,
            slim: i.slim,
            tags: i.tags
        }, await i.getData());
        console.log(body);
        const data = await fetch('/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        });

        if (data.code === 200) i.updateState(State.SUCCESS);
        else i.updateState(State.ERROR);
    }

    info('添加完成', 1);

    // 显示继续添加
    els.addDialog_addMore.disabled = false;
    // 恢复开始添加按钮
    els.addDialog_startBtn.disabled = false;
    els.addDialog_startBtn.innerText = startAddTextBak;

    reloadData().then(() => {
        reloadDom();
    }).catch(e => info('网络错误：' + e, 3));
}

/** 清空待添加列表 */
function clearAddList() {
    els.fileInput.value = null;
    while (addList.length > 0) {
        addList[0].remove();
    }
}


/** 重新获取数据 */
function reloadData() {
    return new Promise((resolve, reject) => {
        fetch('/get').then(res => {
            if (res.code !== 200) throw new Error('加载失败：' + res.message);

            // 缓存
            data.skins = res.data.list;

            resolve();
        }).catch(e => reject(e));
    });
}

/** 根据 `data.skins` 重载页面，会自动重新运行筛选器 */
function reloadDom() {
    els.itemBox.innerHTML = '';

    for (const i of data.skins) {
        // 添加 item
        const li = document.createElement('li');
        li.innerHTML = `
            <p title="${i.name}">${i.name}</p>
            <img src="${i.preview ? i.preview.data : i.file.data}" alt="${i.name}">
        `;
        li.setAttribute('data-id', i.id);
        li.setAttribute('data-type', i.type);
        li.setAttribute('data-slim', i.slim);
        li.addEventListener('click', () => window.location.href = `./details.html?id=${i.id}`);

        // 右键菜单
        li.addEventListener('contextmenu', e => {
            const name = li.querySelector('p').innerText;
            const slim = li.getAttribute('data-slim');

            skinMenu.el.setAttribute('data-id', i.id);
            skinMenu.el.setAttribute('data-name', name);
            skinMenu.el.setAttribute('data-slim', slim);

            els.skinMenu_title.innerText = name;

            if (slim !== 'null') {
                // 下载预览
                els.skinMenu_downloadPreview.hidden = false;

                // 切换为...
                els.skinMenu_switch.hidden = false;
                els.skinMenu_switch.querySelector('span span').innerText = slim === 'true' ? '经典' : '纤细';
            } else {
                els.skinMenu_downloadPreview.hidden = true;
                els.skinMenu_switch.hidden = true;
            }


            skinMenu.open(e);
        });

        i.el = li;
        els.itemBox.appendChild(li);
    }

    Filter.start();
}

/**
 * 使用新的对象合并 & 覆盖缓存中的对象并同步更新 dom
 * @param {String} id id
 * @param {Object} newData 新数据
 */
function setSkin(id, newData) {
    const item = getSkin(id);
    Object.assign(item, newData);

    item.el.setAttribute('data-type', item.type);
    item.el.setAttribute('data-slim', item.slim);
    item.el.querySelector('p').innerText = item.name;
}

/**
 * 从缓存中删除对应皮肤并同步更新 dom
 * @param {Object} id id
 */
function removeSkin(id) {
    const item = getSkin(id);
    item.el.remove();
    data.skins.splice(data.skins.indexOf(item), 1);
    Filter.update();
}

/** 根据 id 获取缓存中的对象 */
function getSkin(id) {
    return data.skins.find(v => v.id === id);
}


/** [抽象，静态] 筛选模块 */
class Filter {
    static inited = false;
    static #nodes = [];


    /** 初始化筛选器及其所有节点 */
    static init() {
        if (Filter.inited) return;

        Filter.#nodes.forEach(v => v.onLoad());
    }

    /** 添加一个节点 */
    static addNode(node) {
        Filter.#nodes.push(node);
    }

    /** 开始筛选，依次经过所有节点 */
    static async start() {
        let items = data.skins;

        // 展示加载动画
        els.filters_loading.classList.add('show');

        // 先隐藏所有
        for (const i of data.skins) {
            i.el.hidden = true;
        }

        for (const i of Filter.#nodes) {
            items = await i.handle(items || []);
        }

        // 显示剩余
        for (const i of items || []) {
            i.el.hidden = false;
        }

        // 隐藏加载动画
        els.filters_loading.classList.remove('show');
    }

    /** 触发节点数据更新 */
    static update() {
        Filter.#nodes.forEach(v => v.onUpdate());
    }
}
/** [接口] 筛选器节点 */
class FilterNode {
    /** 生命周期，在筛选器初始化时被调用 */
    onLoad() {}
    /** 生命周期，在有元数据更新时被调用 */
    onUpdate() {}


    /**
     * 用于处理数据的方法
     * @param {*} items 上一个节点处理后的数据
     * @returns {Array} 必须返回一个 `Promise`，返回一个结构不变的数组
     */
    handle(items) {}
}

class searchNode extends FilterNode {
    els = {}


    onLoad() {
        const li = document.createElement('li');
        li.classList.add('filter');
        li.classList.add('search');
        li.innerHTML = `
            <p class="name">搜索：</p>
            <input type="search" placeholder="按皮肤名搜索..." class="style-def">
        `;

        this.els.input = li.querySelector('input');

        this.els.input.addEventListener('change', () => Filter.start());

        els.filters.appendChild(li);
    }


    handle(items) {
        return new Promise((resolve, reject) => {
            if (this.els.input.value.trim() === '') resolve(items);
            else {
                resolve(items.filter(v => {
                    return v.name.trim().includes(this.els.input.value.trim());
                }));
            }
        });
    }
}
class typeNode extends FilterNode {
    types = [];
    /** 当前选中的分类，为 null 就是全部 */
    currType = null;
    els = {}


    onLoad() {
        const li = document.createElement('li');
        li.classList.add('filter');
        li.classList.add('type');
        li.innerHTML = `
            <p class="name">筛选分类：</p>
            <form class="content">
                <label class="allBtn">
                    <input type="radio" name="type" checked hidden>
                    全部
                </label>
                <ul></ul>
            </form>
        `;

        this.els.form = li.querySelector('.content');
        this.els.allBtn = li.querySelector('.content .allBtn');
        this.els.itemBox = li.querySelector('.content ul');

        // 选中项改变
        this.els.form.addEventListener('change', e => {
            const selType = e.target.getAttribute('data-name');

            this.currType = this.types.includes(selType) ? selType : null;

            Filter.start();
        });

        // 手动触发一次
        this.onUpdate();

        els.filters.appendChild(li);
    }
    /** 加载所有分类 */
    onUpdate() {
        this.types = [];
        this.els.itemBox.innerHTML = '';

        for (const i of data.skins) {
            if (i.type === null || this.types.includes(i.type)) continue;

            this.types.push(i.type);

            const li = document.createElement('li');
            li.innerHTML = `
                <label>
                    <input type="radio" name="type" hidden data-name="${i.type}">
                    ${i.type}
                </label>
            `;
            this.els.itemBox.appendChild(li);
        }
    }


    handle(items) {
        return new Promise((resolve, reject) => {
            resolve(this.currType === null ? items : items.filter(v => v.type === this.currType));
        });
    }
}
Filter.addNode(new searchNode());
Filter.addNode(new typeNode());
