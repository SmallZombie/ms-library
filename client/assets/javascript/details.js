import { formatTimestamp, downloadImgUseBase64, getQueryString, trim } from "./global.js";
import { info } from "../lib/popup.js";


const EPS = 1e-3;
/**
 * 这个数组类似UV，是用来存储玩家各个面对应的材质位置的
 * 例 SKIN[0] 为头部的数组，里面有两个元素
 *    SKIN[0][0] 0为头
 *    SKIN[0][1] 1为头的外侧皮肤
 *
 * 左右臂是个例外，因为他们有粗细两个版本，所以想取到手臂需要：
 * 例 左手细手版本`SKIN[3][0][1]`
 *    右手粗手双层皮肤`SKIN[2][1][0]`
 */
const SKIN = [
    [ // 0. 头
        [[16, 8, 8, 8], [0, 8, 8, 8], [8, 0, 8, 8], [16, 7, 8, -8], [8, 8, 8, 8], [24, 8, 8, 8]],
        [[48, 8, 8, 8], [32, 8, 8, 8], [40, 0, 8, 8], [48, 7, 8, -8], [40, 8, 8, 8], [56, 8, 8, 8]]
    ],
    [ // 1. 身体
        [[28, 20, 4, 12], [16, 20, 4, 12], [20, 16, 8, 4], [28, 19, 8, -4], [20, 20, 8, 12], [32, 20, 8, 12]],
        [[28, 36, 4, 12], [16, 36, 4, 12], [20, 32, 8, 4], [28, 35, 8, -4], [20, 36, 8, 12], [32, 36, 8, 12]]
    ],
    [ // 2. 右手+粗细+双层
        [ // 右手
            // 粗
            [[48, 20, 4, 12], [40, 20, 4, 12], [44, 16, 4, 4], [48, 19, 4, -4], [44, 20, 4, 12], [52, 20, 4, 12]],
            // 细
            [[47, 20, 4, 12], [40, 20, 4, 12], [44, 16, 3, 4], [47, 19, 3, -4], [44, 20, 3, 12], [51, 20, 3, 12]]
        ],
        [ // 双层
            // 粗
            [[48, 36, 4, 12], [40, 36, 4, 12], [44, 32, 4, 4], [48, 35, 4, -4], [44, 36, 4, 12], [52, 36, 4, 12]],
            // 细
            [[47, 36, 4, 12], [40, 36, 4, 12], [44, 32, 3, 4], [47, 35, 3, -4], [44, 36, 3, 12], [51, 36, 3, 12]]
        ]
    ],
    [ // 3. 左臂+粗细+双层
        [
            [[40, 52, 4, 12], [32, 52, 4, 12], [36, 48, 4, 4], [40, 51, 4, -4], [36, 52, 4, 12], [44, 52, 4, 12]],
            [[39, 52, 4, 12], [32, 52, 4, 12], [36, 48, 3, 4], [39, 51, 3, -4], [36, 52, 3, 12], [43, 52, 3, 12]]
        ],
        [
            [[56, 52, 4, 12], [48, 52, 4, 12], [52, 48, 4, 4], [56, 51, 4, -4], [52, 52, 4, 12], [60, 52, 4, 12]],
            [[55, 52, 4, 12], [48, 52, 4, 12], [52, 48, 3, 4], [55, 51, 3, -4], [52, 52, 3, 12], [59, 52, 3, 12]]
        ]
    ],
    [ // 4. 右腿
        [[8, 20, 4, 12], [0, 20, 4, 12], [4, 16, 4, 4], [8, 19, 4, -4], [4, 20, 4, 12], [12, 20, 4, 12]],
        [[8, 36, 4, 12], [0, 36, 4, 12], [4, 32, 4, 4], [8, 35, 4, -4], [4, 36, 4, 12], [12, 36, 4, 12]]
    ],
    [ // 5. 左腿
        [[24, 52, 4, 12], [16, 52, 4, 12], [20, 48, 4, 4], [24, 51, 4, -4], [20, 52, 4, 12], [28, 52, 4, 12]],
        [[8, 52, 4, 12], [0, 52, 4, 12], [4, 48, 4, 4], [8, 51, 4, -4], [4, 52, 4, 12], [12, 52, 4, 12]]
    ]
];
/** 弧度 */
function radians(d) {
    return d * (2 * Math.PI / 360); // TAU = `2 * Math.PI`
}
/**
 * 将image对象绘制到canvas
 * @param {HTMLImageElement} image image对象
 * @param {Number} x 起始点X
 * @param {Number} y 起始点Y
 * @param {Number} w 宽
 * @param {Number} h 高
 * @returns 返回新的canvas对象
 */
function toCanvas(image, x, y, w, h) {
    if (!image) return null; // 判断传入的image是否为空，为空直接返回
    x = typeof x === "undefined" ? 0 : x; // 如果没有传入x，就给一个默认值0
    y = typeof y === "undefined" ? 0 : y; // ...        y，...            0
    w = typeof w === "undefined" ? image.width : w; // ...w，...默认值image对象的宽
    h = typeof h === "undefined" ? image.height : h; // ...h，...                高
    let canvas = document.createElement("canvas"); // 创建一个canvasDOM对象
    canvas.width = w; // 设置宽高为上面初始化完的值
    canvas.height = h;
    canvas.getContext("2d").drawImage(image, x, y, w, h, 0, 0, w, h); // 以2d形式将image对象的起始点(x,y)和宽高，绘制到起点坐标(0,0)大小为(w,h)
    //                                image,startX,StartY,width,height,x,y,width,height // 上面这句话有点绕，但意思是对的，详见MDN
    // let test = document.getElementById('testCanvas');
    // console.log(test);
    // test.width = w;
    // test.height = h;
    // test.getContext('2d').drawImage(canvas, 0, 0);
    // debugger;
    return canvas; // 将画好的canvas返回
}
/**
 * 获取位图
 * @param {HTMLCanvasElement} canvas Canvas对象
 * @param {Number} x 起始点X
 * @param {Number} y 起始点Y
 * @param {Number} w 宽
 * @param {Number} h 高
 * @returns 返回一个ImageData，包含指定区域的数据
 */
function getBitmap(canvas, x, y, w, h) {
    if (!canvas) return null; // 传入的canvas不能为空
    x = typeof x === "undefined" ? 0 : x; // 如果没有传x就使用默认值0
    y = typeof y === "undefined" ? 0 : y; // ...       y...
    w = typeof w === "undefined" ? canvas.width : w; // w...  canvas的宽度
    h = typeof h === "undefined" ? canvas.height : h; // h...         高
    return canvas.getContext("2d").getImageData(x, y, w, h); // 将传入的canvas，根据起始点(x,y)和宽高(w,h)测绘出一个矩形区域并返回(ImageData)
}
/**
 * 有Alpha层
 * @param {ImageData} bitmap 传入一个位图(ImageData)
 * @returns 返回一个是否有Alpha层
 */
function hasAlphaLayer(bitmap) {
    for (let p = 3; p < bitmap.data.length; p += 4) { // 从3开始(因为数组按照红绿蓝和Alpha进行排列，所以第一个像素点的透明度信息在3的位置)，
        // 每4个索引遍历一次(+=4，只遍历透明度的部分)
        if (bitmap.data[p] < 255) // 如果透明度低于255就说明该bitmap(图像)中包含透明度信息
            return true; // 直接返回true
    }
    return false; // 如果遍历到最后都没有透明度255的，就说明图像中没有透明度信息
}
/**
 * 设为不透明
 * @param {ImageData} bitmap 传入ImageData
 * @returns 返回去除透明度信息后的ImageData
 */
function makeOpaque(bitmap) {
    if (!bitmap) return null; // 传入数据不能为空
    for (let p = 3; p < bitmap.data.length; p += 4) { // 遍历每一个透明度信息
        bitmap.data[p] = 255; // 并将其设置为255(不透明)
    }
    return bitmap; // 返回处理后的ImageData
}
function capeScale(height) {
    if (height % 22 === 0) {
        return height / 22;
    } else if (height % 17 === 0) {
        return height / 17;
    } else if (height >= 32 && (height & (height - 1)) === 0) {
        return height / 32;
    } else {
        return Math.max(1, Math.floor(height / 22));
    }
}
/**
 * 为每一面着色
 * @param {BoxGeometry} geometry 几何体，传入一个Three里的BoxGeometry对象
 * @param {ImageData} bitmap 位图，传入一个ImageData
 * @param {Array} rectangles 矩形列表，传入SKIN数组对应的部分(比较难理解log一下就知道了)
 * @returns 返回一个由立方体和材质的THREE.Mech网路
 */
function colorFaces(geometry, bitmap, rectangles) {
    if (!rectangles) return null; // 如果`rectangles`不存在或为空，函数会立即返回null
    // 函数内部定义了一些变量，包括`faces`数组，`materials`数组，和`materialIndexMap`数组
    const faces = [];
    const materials = [];
    const materialIndexMap = [];
    let f = 0;
    let side = THREE.FrontSide;
    // 遍历`rectangles`数组，其中每个矩形`r`是一个包含`[起始点X, 起始点Y, width, height]`数据的数组
    rectangles.forEach((r) => {
        // 计算`dh`和`dv`，这些值在后面的循环中用于计算像素索引的增量
        // `Math.sign()`函数返回一个数字的符号，指示数字是正数，负数还是零。
        // `Math.sign()`固定有5种返回值： 1(正数), -1(负数), 0(正零), -0(负零), NaN
        const dh = 4 * Math.sign(r[2]); // 水平方向步长
        const dv = 4 * Math.sign(r[3]) * bitmap.width; // 垂直方向步长
        // 计算`r1`和`r2`，这些值代表当前矩形的像素范围
        const r1 = 4 * (r[1] * bitmap.width + r[0]);   // 表示矩形内第一个像素的索引值
        const r2 = 4 * (r[3] * bitmap.width) + r1; // 表示矩形内最后一个像素的索引值
        for (let p1 = r1, p2 = r1 + 4 * r[2]; p1 !== r2; p1 += dv, p2 += dv) {
            // 遍历从`r1`到`r2`的像素范围，以`dh`增量为步长，为每个像素创建两个面
            for (let p = p1; p !== p2; p += dh, f += 2) {
                const a = bitmap.data[p + 3];
                // 检查每个像素的透明度值`a`，如果小于 255，则将面的`side`设置为`THREE.DoubleSide`
                if (a < 255) side = THREE.DoubleSide;
                if (a === 0) continue; // 如果`a`等于0，则跳过当前像素
                let materialIndex = materialIndexMap[a];
                // 根据透明度值`a`检查是否已经存在相应的材质，如果不存在，就创建一个新的`THREE.MeshLambertMaterial`材质，
                // 将其加入`materials`数组，并将索引存入`materialIndexMap`数组
                if (typeof materialIndex === "undefined") {
                    materials.push(
                        new THREE.MeshLambertMaterial({
                            vertexColors: THREE.FaceColors,
                            opacity: a / 255,
                            transparent: a < 255,
                        })
                    );
                    materialIndex = materials.length - 1;
                    materialIndexMap[a] = materialIndex;
                }
                // 函数将像素的颜色信息赋给相应的面，设置面的材质索引，并将面添加到`faces`数组中
                const face1 = geometry.faces[f];
                const face2 = geometry.faces[f + 1];
                face1.color.r = bitmap.data[p] / 255;
                face1.color.g = bitmap.data[p + 1] / 255;
                face1.color.b = bitmap.data[p + 2] / 255;
                face2.color = face1.color;
                face1.materialIndex = materialIndex;
                face2.materialIndex = materialIndex;
                faces.push(face1);
                faces.push(face2);
            }
        }
    });
    // 如果没有添加任何面，返回null
    if (faces.length === 0) return null;
    // 如果有面被添加，函数更新`geometry`对象的`faces`属性，并将`geometry`转换为`THREE.BufferGeometry`实例
    geometry.faces = faces;
    // 最后，函数为每个材质设置 side 属性，然后创建一个新的 THREE.Mesh 实例，将更新后的 geometry 和 materials 传入，并返回这个实例
    geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    materials.forEach((m) => (m.side = side));
    return new THREE.Mesh(geometry, materials);
    // 总之，这段代码的主要功能是为一个给定的几何体的每个面设置颜色。根据提供的位图数据和矩形列表，
    // 它将不同透明度的像素分配到不同的材质，并将像素的颜色信息赋给对应的面。
    // 最终，它创建一个带有颜色的网格对象并返回。注意，该代码依赖于 THREE.js 库，该库用于处理三维图形渲染
}
/**
 * 构建皮肤模型，据我所知这个方法只被调用了一次
 * @param {HTMLCanvasElement} skin 绘制好的皮肤canvas对象
 * @param {HTMLCanvasElement} cape 绘制好的披风canvas对象
 * @param {Number} slim 是否为苗条的(0/1)
 * @param {Boolean} flip 是否翻转
 */
function buildSkinModel(skin, cape, slim, flip) {
    // 这里注意处理一下，要不然就会像今天(20240319)，找了两个小时bug，最后发现这个 slim 必须是 0/1，要不然后面会拿不到 UV 里的值
    // 如果是布尔值，后面的就会变成 `SKIN[0][0][true]` 就会取到大便
    if (typeof slim === "boolean") slim = +slim;

    if (skin.width < 64 || skin.height < 32) // 判断皮肤大小是否>=64x64
        return null; // 如果不是直接返回
    let armW = slim ? 3 : 4; // 手臂的宽度，如果传入了slim，就返回3(格/像素)，否则4(...)
    let bitmap = getBitmap(skin); // 获取到canvas的位图，返回一个ImageData数据
    let hasAlpha = hasAlphaLayer(bitmap); // 判断图像(skin)中是否有透明度信息，返回一个布尔值
    let opaque = hasAlpha ? makeOpaque(getBitmap(skin)) : bitmap; // 如果上面判断了，有透明度信息，就将他转为没有，返回一个处理后的新ImageData对象
    // 下面开始创建模型了，复杂起来了哦
    let headGroup = new THREE.Object3D(); // 创建一个Three中的3D对象
    headGroup.position.x = 0; // 将其三维中的位置设置为(0, 12, 0) (向上移动一些)
    headGroup.position.y = 12;
    headGroup.position.z = 0;
    let headBox = new THREE.BoxGeometry(8, 8, 8, 8, 8, 8); // 新建一个几何
    let headMesh = colorFaces(headBox, opaque, SKIN[0][0]); // 并给这个几何添加材质
    headGroup.add(headMesh);
    if (hasAlpha) {
        let hatBox = new THREE.BoxGeometry(9, 9, 9, 8, 8, 8);
        let hatMesh = colorFaces(hatBox, bitmap, SKIN[0][1]);
        if (hatMesh) headGroup.add(hatMesh);
    }
    let torsoGroup = new THREE.Object3D();
    torsoGroup.position.x = 0;
    torsoGroup.position.y = 2;
    torsoGroup.position.z = 0;
    let torsoBox = new THREE.BoxGeometry(8 + EPS, 12 + EPS, 4 + EPS, 8, 12, 4);
    let torsoMesh = colorFaces(torsoBox, opaque, SKIN[1][0]);
    torsoGroup.add(torsoMesh);
    if (hasAlpha) {
        let jacketBox = new THREE.BoxGeometry(
            8.5 + EPS,
            12.5 + EPS,
            4.5 + EPS,
            8,
            12,
            4
        );
        let jacketMesh = colorFaces(jacketBox, bitmap, SKIN[1][1]);
        if (jacketMesh) torsoGroup.add(jacketMesh);
    }
    let rightArmGroup = new THREE.Object3D();
    rightArmGroup.position.x = slim ? -5.5 : -6;
    rightArmGroup.position.y = 6;
    rightArmGroup.position.z = 0;
    let rightArmBox = new THREE.BoxGeometry(armW, 12, 4, armW, 12, 4).translate(
        0,
        -4,
        0
    );
    let rightArmMesh = colorFaces(rightArmBox, opaque, SKIN[2][0][slim]);
    rightArmGroup.add(rightArmMesh);
    if (hasAlpha) {
        let rightSleeveBox = new THREE.BoxGeometry(
            armW + 0.5 + EPS * 4,
            12.5 + EPS * 4,
            4.5 + EPS * 4,
            armW,
            12,
            4
        ).translate(0, -4, 0);
        let rightSleeveMesh = colorFaces(
            rightSleeveBox,
            bitmap,
            SKIN[2][1][slim]
        );
        if (rightSleeveMesh) rightArmGroup.add(rightSleeveMesh);
    }
    let leftArmGroup = new THREE.Object3D();
    leftArmGroup.position.x = slim ? 5.5 : 6;
    leftArmGroup.position.y = 6;
    leftArmGroup.position.z = 0;
    let leftArmBox = new THREE.BoxGeometry(armW, 12, 4, armW, 12, 4).translate(
        0,
        -4,
        0
    );
    let leftArmMesh = colorFaces(leftArmBox, opaque, SKIN[3][0][slim]);
    leftArmGroup.add(leftArmMesh);
    if (hasAlpha) {
        let leftSleeveBox = new THREE.BoxGeometry(
            armW + 0.5 + EPS * 4,
            12.5 + EPS * 4,
            4.5 + EPS * 4,
            armW,
            12,
            4
        ).translate(0, -4, 0);
        let leftSleeveMesh = colorFaces(leftSleeveBox, bitmap, SKIN[3][1][slim]);
        if (leftSleeveMesh) leftArmGroup.add(leftSleeveMesh);
    }
    let rightLegGroup = new THREE.Object3D();
    rightLegGroup.position.x = -2;
    rightLegGroup.position.y = -4;
    rightLegGroup.position.z = 0;
    let rightLegBox = new THREE.BoxGeometry(4, 12, 4, 4, 12, 4).translate(
        0,
        -6,
        0
    );
    let rightLegMesh = colorFaces(rightLegBox, opaque, SKIN[4][0]);
    rightLegGroup.add(rightLegMesh);
    if (hasAlpha) {
        let rightPantBox = new THREE.BoxGeometry(
            4.5 + EPS * 2,
            12.5 + EPS * 2,
            4.5 + EPS * 2,
            4,
            12,
            4
        ).translate(0, -6, 0);
        let rightPantMesh = colorFaces(rightPantBox, bitmap, SKIN[4][1]);
        if (rightPantMesh) rightLegGroup.add(rightPantMesh);
    }
    let leftLegGroup = new THREE.Object3D();
    leftLegGroup.position.x = 2;
    leftLegGroup.position.y = -4;
    leftLegGroup.position.z = 0;
    let leftLegBox = new THREE.BoxGeometry(4, 12, 4, 4, 12, 4).translate(
        0,
        -6,
        0
    );
    let leftLegMesh = colorFaces(leftLegBox, opaque, SKIN[5][0]);
    leftLegGroup.add(leftLegMesh);
    if (hasAlpha) {
        let leftPantBox = new THREE.BoxGeometry(
            4.5 + EPS * 3,
            12.5 + EPS * 3,
            4.5 + EPS * 3,
            4,
            12,
            4
        ).translate(0, -6, 0);
        let leftPantMesh = colorFaces(leftPantBox, bitmap, SKIN[5][1]);
        if (leftPantMesh) leftLegGroup.add(leftPantMesh);
    }
    let model = new THREE.Object3D();
    model.add(headGroup);
    model.add(torsoGroup);
    model.add(rightArmGroup);
    model.add(leftArmGroup);
    model.add(rightLegGroup);
    model.add(leftLegGroup);
    if (cape) {
        let cs = capeScale(cape.height);
        let capeGroup = new THREE.Object3D();
        capeGroup.position.x = 0;
        capeGroup.position.y = 8;
        capeGroup.position.z = -2;
        capeGroup.rotation.y += radians(180);
        let capeBox = new THREE.BoxGeometry(
            10,
            16,
            1,
            10 * cs,
            16 * cs,
            cs
        ).translate(0, -8, 0.5);
        let capeMesh = colorFaces(capeBox, getBitmap(cape), [
            [11 * cs, cs, cs, 16 * cs],
            [0, cs, cs, 16 * cs],
            [cs, 0, 10 * cs, cs],
            [11 * cs, cs - 1, 10 * cs, -cs],
            [cs, cs, 10 * cs, 16 * cs],
            [12 * cs, cs, 10 * cs, 16 * cs],
        ]);
        capeGroup.add(capeMesh);
        model.add(capeGroup);
    }
    if (flip) {
        model.rotation.z += radians(180);
    }
    return model;
}
const skin3d = {
    theta: 30,
    phi: 21,
    /** 动画已播放时间(0~1500) */
    time: 90,
    /** 构建好的玩家模型，包括披风，在 initScene 中初始化 */
    model: null,
    /** 场景，在 initScene 中初始化 */
    scene: null,
    /** 摄像头，在 initScene 中初始化 */
    camera: null,
    /** 渲染器，在 initScene 中初始化 */
    renderer: null,
    /** 动画播放状态 */
    animate: false,
    animationId: null
}
/**
 * 切换皮肤动画播放状态
 */
function toggleSkinAnimate() {
    skin3d.animate = !skin3d.animate;
    if (skin3d.animate) { // 播放
        els.playBtn_playIcon.hidden = true;
        els.playBtn_pauseIcon.hidden = false;

        els.playBtn.querySelector('span').innerText = '暂停';
        els.playBtn.title = '暂停预览动画';
        if (!skin3d.animationId) {
            render(); // 渲染皮肤
            skin3d.startTime = performance.now() - skin3d.time * (1500 / 360);
            skin3d.animationId = window.requestAnimationFrame(renderSkinLoop);
        }
    } else { // 暂停
        els.playBtn_playIcon.hidden = false;
        els.playBtn_pauseIcon.hidden = true;

        els.playBtn.querySelector('span').innerText = '播放';
        els.playBtn.title = '播放预览动画';
        if (skin3d.animationId) { // 如果有这个id，那就说明动画在播放
            window.cancelAnimationFrame(skin3d.animationId); // 根据开始播放动画时存储的id取消动画
            skin3d.animationId = null;
        }
    }
}
function enableSkinRotation() {
    /** 用于缓存拖动时的事件，用于稍后的拖动位置计算，在 enableSkinRotation 中初始化和移除 */
    let dragEvent = null;
    /** drag 移动端的手指 id，详细介绍见 enableSkinRotation，在 enableSkinRotation 中初始化和移除 */
    let dragId = null;

    function rotate(e) {
        if (!dragEvent) return false;

        let canKeepMove = true; // 当旋转到头顶或脚底时，是否可以继续旋转
        skin3d.theta += e.screenX - dragEvent.screenX;
        skin3d.phi += e.screenY - dragEvent.screenY;
        els.preview_canvas.setAttribute(
            "data-theta",
            (skin3d.theta % 360).toFixed(2).replace(/\.?0+$/, "")
        );
        els.preview_canvas.setAttribute(
            "data-phi",
            (skin3d.phi % 360).toFixed(2).replace(/\.?0+$/, "")
        );

        // 如果转动到达头顶或脚底，返回不可以继续旋转
        if (skin3d.phi < -90) {
            skin3d.phi = -90;
            canKeepMove = false;
        } else if (skin3d.phi > 90) {
            skin3d.phi = 90;
            canKeepMove = false;
        }

        dragEvent = e;
        skin3d.model.rotation.x = radians(skin3d.phi);
        skin3d.model.rotation.y = radians(skin3d.theta);
        if (!skin3d.animationId) render();
        return canKeepMove;
    }

    els.preview_canvas.addEventListener("mousedown", e => {
        e.preventDefault();
        dragEvent = e;
    });
    window.addEventListener("mousemove", e => rotate(e, "mouse"));
    window.addEventListener("mouseup", () => dragEvent = null);

    // 移动端适配
    els.preview_canvas.addEventListener("touchstart", e => {
        // 保存第一根手指的 id，如果不保存，多根手指一起触摸时，会鬼畜
        // 所以这里存一下第一根手指的 id，后面的处理都只按照一根手指为准
        dragId = e.changedTouches[0].identifier;
        dragEvent = e.changedTouches[0];
    });
    els.preview_canvas.addEventListener("touchmove", e => {
        e.preventDefault();

        if (e.changedTouches[0].identifier !== dragId) return;
        let canKeepMove = rotate(e.changedTouches[0]);
        if (!canKeepMove) skin3d.dragStat = null;
    });
    els.preview_canvas.addEventListener("touchend", e => {
        if (e.changedTouches[0].identifier !== dragId) return;
        dragEvent = null;
    });
    els.preview_canvas.addEventListener("touchcancel", () => {
        if (e.changedTouches[0].identifier !== dragId) return;
        dragEvent = null;
    });
}
function renderSkinLoop() {
    skin3d.time = ((performance.now() - skin3d.startTime) * (360 / 1500)) % 1440;
    els.preview_canvas.setAttribute("data-time", skin3d.time.toFixed(2).replace(/\.?0+$/, ""));
    skin3d.animationId = window.requestAnimationFrame(renderSkinLoop);
    render();
}
/** 渲染一次 */
function render() {
    skin3d.model.rotation.x = radians(skin3d.phi);
    skin3d.model.rotation.y = radians(skin3d.theta);
    let angle = Math.sin(radians(skin3d.time));
    skin3d.model.children[2].rotation.x = -radians(18) * angle;
    skin3d.model.children[3].rotation.x = radians(18) * angle;
    skin3d.model.children[4].rotation.x = radians(20) * angle;
    skin3d.model.children[5].rotation.x = -radians(20) * angle;
    if (skin3d.model.children[6]) {
        let capeAngle = Math.sin(radians(skin3d.time / 4));
        skin3d.model.children[6].rotation.x = radians(18) - radians(6) * capeAngle;
    }
    skin3d.renderer.render(skin3d.scene, skin3d.camera);
}
/** 初始化模型、场景、摄像机、渲染器和灯光，也就是初始化一切，但不会渲染 */
function initScene() {
    if (skin3d.scene) return;

    // 构建模型
    skin3d.model = buildSkinModel(
        toCanvas(data.skin_image),
        toCanvas(data.cape_image),
        data.slim,
        false
    );

    // 准备场景
    skin3d.scene = new THREE.Scene();
    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight.position.set(0.678, 0.284, 0.678);
    skin3d.scene.add(ambLight);
    skin3d.scene.add(dirLight);
    skin3d.scene.add(skin3d.model);

    // 准备相机
    skin3d.camera = new THREE.PerspectiveCamera(
        38,
        els.preview_canvas.width / els.preview_canvas.height,
        60 - 20,
        60 + 20
    );
    skin3d.camera.position.x = 0;
    skin3d.camera.position.y = 0;
    skin3d.camera.position.z = 60;
    skin3d.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // 准备渲染器
    skin3d.renderer = new THREE.WebGLRenderer({
        canvas: els.preview_canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true // 保留图形缓冲区用于截图
    });
}


const els = {}
const data = {}


window.addEventListener('load', async () => {
    // 准备要使用的元素
    els.backBtn = document.querySelector('.header .backBtn');
    els.title = document.querySelector('.header .title');

    els.preview_canvas = document.querySelector('.content .preview canvas');
    els.preview_img = document.querySelector('.content .preview img');

    els.playBtn = document.querySelector('.content .right .btnBox .play');
    els.playBtn_playIcon = document.querySelector('.content .right .btnBox .play .playIcon');
    els.playBtn_pauseIcon = document.querySelector('.content .right .btnBox .play .pauseIcon');
    els.downloadSkinImgBtn = document.querySelector('.content .right .btnBox .downloadSkinImg');
    els.downloadViewImgBtn = document.querySelector('.content .right .btnBox .downloadViewImg');
    els.renameBtn = document.querySelector('.content .right .btnBox .rename');
    els.switchArmStyleBtn = document.querySelector('.content .right .btnBox .switchArmStyle');
    els.switchArmStyleBtn_span = els.switchArmStyleBtn.querySelector('span span');
    els.deleteBtn = document.querySelector('.content .right .btnBox .delete');

    els.uploadDate = document.querySelector('.content .right .meta .uploadDate .text');
    els.source = document.querySelector('.content .right .meta .source .text span');


    els.tempCanvas = document.createElement('canvas');
    els.tempCanvas.width = 300;
    els.tempCanvas.height = 400;


    // 返回
    els.backBtn.addEventListener('click', () => window.history.back());

    // 播放暂停
    els.playBtn.addEventListener('click', () => toggleSkinAnimate());
    // 下载皮肤原图
    els.downloadSkinImgBtn.addEventListener('click', () => {
        downloadImgUseBase64(data.file.data, data.name);
    });
    // 下载当前预览图
    els.downloadViewImgBtn.addEventListener('click', () => {
        downloadImgUseBase64(els.preview_canvas.toDataURL('image/png'), data.name + '_preview');
    });
    // 重命名
    els.renameBtn.addEventListener('click', () => {
        const newName = trim(prompt(`为 ${data.name} 重命名：`));
        if (!newName || newName === data.name) return;

        fetch('/renameById?id=' + data.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                newName
            }
        }).then(res => {
            if (res.code === 200) {
                els.title.innerText = newName;
            } else info('重命名失败：' + res.message, 3);
        });
    });
    // 切换手臂样式(经典/纤细)
    els.switchArmStyleBtn.addEventListener('click', async () => {
        // 重新生成预览图
        const newSlim = !data.slim;

        const newPreview = await spawn(
            data.file.data,
            els.tempCanvas,
            newSlim
        );

        fetch('/setArmStyle?id=' + data.id, {
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
                window.location.reload();
            } else throw new Error('切换失败：' + res.message);
        }).catch(e => info(e, 3));
    });
    // 删除
    els.deleteBtn.addEventListener('click', () => {
        if (!confirm(`确定要删除 ${data.name}(${data.id})？`)) return;

        fetch('/deleteSkinById?id=' + data.id, {
            method: 'DELETE'
        }).then(res => {
            if (res.code !== 200) {
                info('删除失败：' + res.message, 3);
                return;
            }

            window.history.back();
        });
    });


    // 加载元信息
    Object.assign(data, (await fetch('/get?id=' + getQueryString('id')).catch(e => info('加载失败：' + e, 3))).data);

    // 皮肤名
    els.title.innerText = data.name;

    // 上传日期
    els.uploadDate.innerText = data.upload_date ? formatTimestamp(data.upload_date) : '...';

    // 来源
    if (data.source) {
        if (data.source.url) {
            const siteName = /^(?:https?:\/\/)?(?:www\.)?([^/]+)/.exec(data.source.url)[1];
            els.source.innerHTML = `<a href="${data.source.url}" title="${data.source.url}">${siteName}</a>`;
        }
    } else els.source.innerText = '本地文件';


    // 如果是支持的皮肤
    if (data.slim !== null) {
        // 显示元素
        els.playBtn.hidden = false;
        els.downloadViewImgBtn.hidden = false;
        els.switchArmStyleBtn.hidden = false;
        els.switchArmStyleBtn_span.innerText = data.slim ? '经典' : '纤细';


        // 生成并设置网页图标
        spawnAvatar(data.file.data).then(res => {
            document.querySelector('head link[rel="shortcut icon"]').href = res;
        });

        // file base64 to image
        await new Promise((resolve, reject) => {
            const image = new Image();
            data.skin_image = image;

            image.onload = resolve;
            image.onerror = reject;
            image.src = `${data.file.data}`;
        }).catch(e => {
            info('环境初始化错误：' + e, 3);
            return;
        });

        // 初始化场景
        initScene();
        // 渲染一次
        render();
        // 启用拖动旋转
        enableSkinRotation();
    } else { // 否则
        els.preview_canvas.hidden = true;
        els.preview_img.hidden = false;
        els.preview_img.src = data.file.data;
    }
});

/**
 * 使用皮肤图片生成网页图标
 * @param {String} base64 皮肤图片base64(不包含data前缀)
 */
function spawnAvatar(base64) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 8;
            tempCanvas.height = 8;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(image, 8, 8, 8, 8, 0, 0, 8, 8);
            tempCtx.drawImage(image, 40, 8, 8, 8, 0, 0, 8, 8);
            resolve(tempCanvas.toDataURL('image/png'));
        }
        image.src = base64;
    });
}
