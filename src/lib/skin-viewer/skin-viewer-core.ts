import {
  BoxGeometry,
  Group,
  PerspectiveCamera,
  Scene,
  TextureLoader,
  WebGLRenderer,
  Texture,
  CanvasTexture,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { radians, texturePainting } from './utils';

const GLOBAL_ANIM_ORIGIN = typeof performance !== 'undefined' ? performance.now() : Date.now();

function globalNow(): number {
  return (typeof performance !== 'undefined' ? performance.now() : Date.now()) - GLOBAL_ANIM_ORIGIN;
}

export interface SkinViewerOptions {
  skinDataURL?: string;
  capeDataURL?: string;
  slim?: boolean;
  elytra?: boolean;
  cameraPosition?: { x?: number; y?: number; z?: number };
}

export class SkinViewerCore {
  ready: Promise<void> | null = null;

  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private controls: OrbitControls;

  private skinModel: Group | null = null;
  private capeModel: Group | null = null;

  options: SkinViewerOptions = {};

  private disposed = false;
  private playAnim: boolean | number = false;
  private animTimeOffset: number = 0;
  private animPausedElapsed: number | null = null;
  private isDragging = false;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, options: SkinViewerOptions = {}) {
    this.scene = new Scene();

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.camera = new PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );

    const defX = -13;
    const defY = 5;
    const defZ = 27;
    if (options.cameraPosition) {
      this.camera.position.set(
        options.cameraPosition.x ?? defX,
        options.cameraPosition.y ?? defY,
        options.cameraPosition.z ?? defZ
      );
    } else {
      this.camera.position.set(defX, defY, defZ);
    }
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 1.3;

    this.canvas = canvas;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);

    this.ready = this.update(options);
  }

  private getAnimElapsed(): number {
    if (this.animPausedElapsed !== null) return this.animPausedElapsed;
    return globalNow() + this.animTimeOffset;
  }

  render(): void {
    function calcSkinRotationAngle(
      timeElapsed: number,
      cycleDuration: number,
      maxAngle: number
    ): number {
      return maxAngle * Math.sin((2 * Math.PI * timeElapsed) / cycleDuration);
    }

    function calcCapeRotationAngle(
      timeElapsed: number,
      cycleDuration: number,
      maxAngle: number
    ): number {
      return (
        15 +
        ((maxAngle - 15) *
          (1 - Math.cos((Math.PI * timeElapsed) / cycleDuration))) /
          2
      );
    }

    this.controls.update();

    if (
      this.playAnim === true ||
      (typeof this.playAnim === 'number' && this.playAnim > 0)
    ) {
      const elapsed = this.getAnimElapsed();
      const angle = radians(calcSkinRotationAngle(elapsed, 1800, 30));

      if (this.skinModel) {
        const children = this.skinModel.children;
        if (children[2]) children[2].rotation.x = -angle;
        if (children[3]) children[3].rotation.x = angle;
        if (children[4]) children[4].rotation.x = angle;
        if (children[5]) children[5].rotation.x = -angle;
      }

      if (this.capeModel) {
        const capeAngle = radians(
          calcCapeRotationAngle(elapsed, 2000, 30)
        );
        this.capeModel.rotation.x = capeAngle;
      }

      if (this.playAnim !== true && typeof this.playAnim === 'number') {
        this.playAnim--;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private onPointerDown = () => {
    this.isDragging = true;
    this.startRenderLoop();
  };

  private onPointerUp = () => {
    this.isDragging = false;
    this.tryStopRenderLoop();
  };

  startRenderLoop(): void {
    this.stopRenderLoop();
    this.renderer.setAnimationLoop(() => this.render());
  }

  stopRenderLoop(): void {
    this.renderer.setAnimationLoop(null);
  }

  private tryStopRenderLoop(): void {
    if (this.isDragging || this.playAnim) return;
    this.render();
    this.stopRenderLoop();
  }

  private loadTexture(url: string): Promise<Texture> {
    return new Promise((resolve) => {
      new TextureLoader().load(url, resolve);
    });
  }

  private async buildSkinModel(skinURL: string): Promise<Group> {
    const texture = await this.loadTexture(skinURL);
    if (texture.source.data.height === 32) {
      return this._buildSkinModel32(texture);
    } else {
      return this._buildSkinModel64(texture);
    }
  }

  private _buildSkinModel64(texture: Texture): Group {
    const OutsideExtraSize = 0.8;
    const _px = (num: number) => num / 64;

    const model = new Group();


    const headGroup = new Group();
    headGroup.position.y = 12;

    const headGeo = texturePainting(
      new BoxGeometry(8, 8, 8),
      new Float32Array([
        _px(16), _px(56), _px(24), _px(56), _px(16), _px(48), _px(24), _px(48),
        _px(0), _px(56), _px(8), _px(56), _px(0), _px(48), _px(8), _px(48),
        _px(8), _px(64), _px(16), _px(64), _px(8), _px(56), _px(16), _px(56),
        _px(16), _px(56), _px(24), _px(56), _px(16), _px(64), _px(24), _px(64),
        _px(8), _px(56), _px(16), _px(56), _px(8), _px(48), _px(16), _px(48),
        _px(24), _px(56), _px(32), _px(56), _px(24), _px(48), _px(32), _px(48),
      ]),
      texture
    );
    headGroup.add(headGeo);

    const head2Geo = texturePainting(
      new BoxGeometry(8 + OutsideExtraSize, 8 + OutsideExtraSize, 8 + OutsideExtraSize),
      new Float32Array([
        _px(48), _px(56), _px(56), _px(56), _px(48), _px(48), _px(56), _px(48),
        _px(32), _px(56), _px(40), _px(56), _px(32), _px(48), _px(40), _px(48),
        _px(40), _px(64), _px(48), _px(64), _px(40), _px(56), _px(48), _px(56),
        _px(48), _px(56), _px(56), _px(56), _px(48), _px(64), _px(56), _px(64),
        _px(40), _px(56), _px(48), _px(56), _px(40), _px(48), _px(48), _px(48),
        _px(56), _px(56), _px(64), _px(56), _px(56), _px(48), _px(64), _px(48),
      ]),
      texture,
      { alpha: true, doubleSide: true }
    );
    headGroup.add(head2Geo);


    const bodyGroup = new Group();
    bodyGroup.position.y = 2;

    const bodyGeo = texturePainting(
      new BoxGeometry(8, 12, 4),
      new Float32Array([
        _px(28), _px(44), _px(32), _px(44), _px(28), _px(32), _px(32), _px(32),
        _px(16), _px(44), _px(20), _px(44), _px(16), _px(32), _px(20), _px(32),
        _px(20), _px(48), _px(28), _px(48), _px(20), _px(44), _px(28), _px(44),
        _px(28), _px(44), _px(36), _px(44), _px(28), _px(48), _px(36), _px(48),
        _px(20), _px(44), _px(28), _px(44), _px(20), _px(32), _px(28), _px(32),
        _px(32), _px(44), _px(40), _px(44), _px(32), _px(32), _px(40), _px(32),
      ]),
      texture
    );
    bodyGroup.add(bodyGeo);

    const body2Geo = texturePainting(
      new BoxGeometry(8 + OutsideExtraSize, 12 + OutsideExtraSize, 4 + OutsideExtraSize),
      new Float32Array([
        _px(28), _px(28), _px(32), _px(28), _px(28), _px(16), _px(32), _px(16),
        _px(16), _px(28), _px(20), _px(28), _px(16), _px(16), _px(20), _px(16),
        _px(20), _px(32), _px(28), _px(32), _px(20), _px(28), _px(28), _px(28),
        _px(28), _px(28), _px(36), _px(28), _px(28), _px(32), _px(36), _px(32),
        _px(20), _px(28), _px(28), _px(28), _px(20), _px(16), _px(28), _px(16),
        _px(32), _px(28), _px(40), _px(28), _px(32), _px(16), _px(40), _px(16),
      ]),
      texture,
      { alpha: true, doubleSide: true }
    );
    bodyGroup.add(body2Geo);


    const slim = this.options.slim;
    const armWidth = slim ? 3 : 4;

    const leftArmGroup = new Group();
    leftArmGroup.position.set(slim ? 5 : 6, 2 + 4, 0);
    leftArmGroup.rotateZ(radians(1));
    leftArmGroup.scale.set(0.999, 0.999, 0.999);

    const leftArmUV = slim
      ? new Float32Array([
          _px(39), _px(12), _px(43), _px(12), _px(39), _px(0), _px(43), _px(0),
          _px(32), _px(12), _px(36), _px(12), _px(32), _px(0), _px(36), _px(0),
          _px(36), _px(16), _px(39), _px(16), _px(36), _px(12), _px(39), _px(12),
          _px(39), _px(12), _px(42), _px(12), _px(39), _px(16), _px(42), _px(16),
          _px(36), _px(12), _px(39), _px(12), _px(36), _px(0), _px(39), _px(0),
          _px(43), _px(12), _px(46), _px(12), _px(43), _px(0), _px(46), _px(0),
        ])
      : new Float32Array([
          _px(40), _px(12), _px(44), _px(12), _px(40), _px(0), _px(44), _px(0),
          _px(32), _px(12), _px(36), _px(12), _px(32), _px(0), _px(36), _px(0),
          _px(36), _px(16), _px(40), _px(16), _px(36), _px(12), _px(40), _px(12),
          _px(40), _px(12), _px(44), _px(12), _px(40), _px(16), _px(44), _px(16),
          _px(36), _px(12), _px(40), _px(12), _px(36), _px(0), _px(40), _px(0),
          _px(44), _px(12), _px(48), _px(12), _px(44), _px(0), _px(48), _px(0),
        ]);

    const leftArmGeo = texturePainting(
      new BoxGeometry(armWidth, 12, 4),
      leftArmUV,
      texture
    );
    leftArmGeo.position.y -= 4;
    leftArmGroup.add(leftArmGeo);

    const leftArm2UV = slim
      ? new Float32Array([
          _px(55), _px(12), _px(59), _px(12), _px(55), _px(0), _px(59), _px(0),
          _px(48), _px(12), _px(52), _px(12), _px(48), _px(0), _px(52), _px(0),
          _px(52), _px(16), _px(55), _px(16), _px(52), _px(12), _px(55), _px(12),
          _px(55), _px(12), _px(58), _px(12), _px(55), _px(16), _px(58), _px(16),
          _px(52), _px(12), _px(55), _px(12), _px(52), _px(0), _px(55), _px(0),
          _px(59), _px(12), _px(62), _px(12), _px(59), _px(0), _px(62), _px(0),
        ])
      : new Float32Array([
          _px(56), _px(12), _px(60), _px(12), _px(56), _px(0), _px(60), _px(0),
          _px(48), _px(12), _px(52), _px(12), _px(48), _px(0), _px(52), _px(0),
          _px(52), _px(16), _px(56), _px(16), _px(52), _px(12), _px(56), _px(12),
          _px(56), _px(12), _px(60), _px(12), _px(56), _px(16), _px(60), _px(16),
          _px(52), _px(12), _px(56), _px(12), _px(52), _px(0), _px(56), _px(0),
          _px(60), _px(12), _px(64), _px(12), _px(60), _px(0), _px(64), _px(0),
        ]);

    const leftArm2Geo = texturePainting(
      new BoxGeometry(armWidth + OutsideExtraSize, 12 + OutsideExtraSize, 4 + OutsideExtraSize),
      leftArm2UV,
      texture,
      { alpha: true, doubleSide: true }
    );
    leftArm2Geo.position.y -= 4;
    leftArmGroup.add(leftArm2Geo);


    const rightArmGroup = new Group();
    rightArmGroup.position.set(slim ? -5 : -6, 2 + 4, 0);
    rightArmGroup.rotateZ(radians(-1));
    rightArmGroup.scale.set(0.999, 0.999, 0.999);

    const rightArmUV = slim
      ? new Float32Array([
          _px(47), _px(44), _px(51), _px(44), _px(47), _px(32), _px(51), _px(32),
          _px(40), _px(44), _px(44), _px(44), _px(40), _px(32), _px(44), _px(32),
          _px(44), _px(48), _px(47), _px(48), _px(44), _px(44), _px(47), _px(44),
          _px(47), _px(44), _px(50), _px(44), _px(47), _px(48), _px(50), _px(48),
          _px(44), _px(44), _px(47), _px(44), _px(44), _px(32), _px(47), _px(32),
          _px(51), _px(44), _px(54), _px(44), _px(51), _px(32), _px(54), _px(32),
        ])
      : new Float32Array([
          _px(48), _px(44), _px(52), _px(44), _px(48), _px(32), _px(52), _px(32),
          _px(40), _px(44), _px(44), _px(44), _px(40), _px(32), _px(44), _px(32),
          _px(44), _px(48), _px(48), _px(48), _px(44), _px(44), _px(48), _px(44),
          _px(48), _px(44), _px(52), _px(44), _px(48), _px(48), _px(52), _px(48),
          _px(44), _px(44), _px(48), _px(44), _px(44), _px(32), _px(48), _px(32),
          _px(52), _px(44), _px(56), _px(44), _px(52), _px(32), _px(56), _px(32),
        ]);

    const rightArmGeo = texturePainting(
      new BoxGeometry(armWidth, 12, 4),
      rightArmUV,
      texture
    );
    rightArmGeo.position.y -= 4;
    rightArmGroup.add(rightArmGeo);

    const rightArm2UV = slim
      ? new Float32Array([
          _px(47), _px(28), _px(51), _px(28), _px(47), _px(16), _px(51), _px(16),
          _px(40), _px(28), _px(44), _px(28), _px(40), _px(16), _px(44), _px(16),
          _px(44), _px(32), _px(47), _px(32), _px(44), _px(28), _px(47), _px(28),
          _px(47), _px(28), _px(50), _px(28), _px(47), _px(32), _px(50), _px(32),
          _px(44), _px(28), _px(47), _px(28), _px(44), _px(16), _px(47), _px(16),
          _px(51), _px(28), _px(54), _px(28), _px(51), _px(16), _px(54), _px(16),
        ])
      : new Float32Array([
          _px(48), _px(28), _px(52), _px(28), _px(48), _px(16), _px(52), _px(16),
          _px(40), _px(28), _px(44), _px(28), _px(40), _px(16), _px(44), _px(16),
          _px(44), _px(32), _px(48), _px(32), _px(44), _px(28), _px(48), _px(28),
          _px(48), _px(28), _px(52), _px(28), _px(48), _px(32), _px(52), _px(32),
          _px(44), _px(28), _px(48), _px(28), _px(44), _px(16), _px(48), _px(16),
          _px(52), _px(28), _px(56), _px(28), _px(52), _px(16), _px(56), _px(16),
        ]);

    const rightArm2Geo = texturePainting(
      new BoxGeometry(armWidth + OutsideExtraSize, 12 + OutsideExtraSize, 4 + OutsideExtraSize),
      rightArm2UV,
      texture,
      { alpha: true, doubleSide: true }
    );
    rightArm2Geo.position.y -= 4;
    rightArmGroup.add(rightArm2Geo);


    const leftLegGroup = new Group();
    leftLegGroup.position.set(1.96, -10 + 4, 0);
    leftLegGroup.scale.set(0.98, 0.98, 0.98);

    const leftLegGeo = texturePainting(
      new BoxGeometry(4, 12, 4),
      new Float32Array([
        _px(24), _px(12), _px(28), _px(12), _px(24), _px(0), _px(28), _px(0),
        _px(16), _px(12), _px(20), _px(12), _px(16), _px(0), _px(20), _px(0),
        _px(20), _px(16), _px(24), _px(16), _px(20), _px(12), _px(24), _px(12),
        _px(24), _px(12), _px(28), _px(12), _px(24), _px(16), _px(28), _px(16),
        _px(20), _px(12), _px(24), _px(12), _px(20), _px(0), _px(24), _px(0),
        _px(28), _px(12), _px(32), _px(12), _px(28), _px(0), _px(32), _px(0),
      ]),
      texture
    );
    leftLegGeo.position.y -= 4;
    leftLegGroup.add(leftLegGeo);

    const leftLeg2Geo = texturePainting(
      new BoxGeometry(4 + OutsideExtraSize, 12 + OutsideExtraSize, 4 + OutsideExtraSize),
      new Float32Array([
        _px(8), _px(12), _px(12), _px(12), _px(8), _px(0), _px(12), _px(0),
        _px(0), _px(12), _px(4), _px(12), _px(0), _px(0), _px(4), _px(0),
        _px(4), _px(16), _px(8), _px(16), _px(4), _px(12), _px(8), _px(12),
        _px(8), _px(12), _px(12), _px(12), _px(8), _px(16), _px(12), _px(16),
        _px(4), _px(12), _px(8), _px(12), _px(4), _px(0), _px(8), _px(0),
        _px(12), _px(12), _px(16), _px(12), _px(12), _px(0), _px(16), _px(0),
      ]),
      texture,
      { alpha: true, doubleSide: true }
    );
    leftLeg2Geo.position.y -= 4;
    leftLegGroup.add(leftLeg2Geo);


    const rightLegGroup = new Group();
    rightLegGroup.position.set(-1.96, -10 + 4, 0);
    rightLegGroup.scale.set(0.98, 0.98, 0.98);

    const rightLegGeo = texturePainting(
      new BoxGeometry(4, 12, 4),
      new Float32Array([
        _px(8), _px(44), _px(12), _px(44), _px(8), _px(32), _px(12), _px(32),
        _px(0), _px(44), _px(4), _px(44), _px(0), _px(32), _px(4), _px(32),
        _px(4), _px(48), _px(8), _px(48), _px(4), _px(44), _px(8), _px(44),
        _px(8), _px(44), _px(12), _px(44), _px(8), _px(48), _px(12), _px(48),
        _px(4), _px(44), _px(8), _px(44), _px(4), _px(32), _px(8), _px(32),
        _px(12), _px(44), _px(16), _px(44), _px(12), _px(32), _px(16), _px(32),
      ]),
      texture
    );
    rightLegGeo.position.y -= 4;
    rightLegGroup.add(rightLegGeo);

    const rightLeg2Geo = texturePainting(
      new BoxGeometry(4 + OutsideExtraSize, 12 + OutsideExtraSize, 4 + OutsideExtraSize),
      new Float32Array([
        _px(8), _px(28), _px(12), _px(28), _px(8), _px(16), _px(12), _px(16),
        _px(0), _px(28), _px(4), _px(28), _px(0), _px(16), _px(4), _px(16),
        _px(4), _px(32), _px(8), _px(32), _px(4), _px(28), _px(8), _px(28),
        _px(8), _px(28), _px(12), _px(28), _px(8), _px(32), _px(12), _px(32),
        _px(4), _px(28), _px(8), _px(28), _px(4), _px(16), _px(8), _px(16),
        _px(12), _px(28), _px(16), _px(28), _px(12), _px(16), _px(16), _px(16),
      ]),
      texture,
      { alpha: true, doubleSide: true }
    );
    rightLeg2Geo.position.y -= 4;
    rightLegGroup.add(rightLeg2Geo);

    model.add(headGroup);
    model.add(bodyGroup);
    model.add(leftArmGroup);
    model.add(rightArmGroup);
    model.add(leftLegGroup);
    model.add(rightLegGroup);

    return model;
  }

  private _buildSkinModel32(texture: Texture): Group {
    const _pxX = (num: number) => num / 64;
    const _pxY = (num: number) => num / 32;

    const model = new Group();


    const headGroup = new Group();
    headGroup.position.y = 12;

    const headGeo = texturePainting(
      new BoxGeometry(8, 8, 8),
      new Float32Array([
        _pxX(16), _pxY(24), _pxX(24), _pxY(24), _pxX(16), _pxY(16), _pxX(24), _pxY(16),
        _pxX(0), _pxY(24), _pxX(8), _pxY(24), _pxX(0), _pxY(16), _pxX(8), _pxY(16),
        _pxX(8), _pxY(32), _pxX(16), _pxY(32), _pxX(8), _pxY(24), _pxX(16), _pxY(24),
        _pxX(16), _pxY(24), _pxX(24), _pxY(24), _pxX(16), _pxY(32), _pxX(24), _pxY(32),
        _pxX(8), _pxY(24), _pxX(16), _pxY(24), _pxX(8), _pxY(16), _pxX(16), _pxY(16),
        _pxX(24), _pxY(24), _pxX(32), _pxY(24), _pxX(24), _pxY(16), _pxX(32), _pxY(16),
      ]),
      texture
    );
    headGroup.add(headGeo);

    const OutsideExtraSize = 0.8;
    const head2Geo = texturePainting(
      new BoxGeometry(8 + OutsideExtraSize, 8 + OutsideExtraSize, 8 + OutsideExtraSize),
      new Float32Array([
        _pxX(48), _pxY(24), _pxX(56), _pxY(24), _pxX(48), _pxY(16), _pxX(56), _pxY(16),
        _pxX(32), _pxY(24), _pxX(40), _pxY(24), _pxX(32), _pxY(16), _pxX(40), _pxY(16),
        _pxX(40), _pxY(32), _pxX(48), _pxY(32), _pxX(40), _pxY(24), _pxX(48), _pxY(24),
        _pxX(48), _pxY(24), _pxX(56), _pxY(24), _pxX(48), _pxY(32), _pxX(56), _pxY(32),
        _pxX(40), _pxY(24), _pxX(48), _pxY(24), _pxX(40), _pxY(16), _pxX(48), _pxY(16),
        _pxX(56), _pxY(24), _pxX(64), _pxY(24), _pxX(56), _pxY(16), _pxX(64), _pxY(16),
      ]),
      texture,
      { alpha: true, doubleSide: true }
    );
    headGroup.add(head2Geo);


    const bodyGroup = new Group();
    bodyGroup.position.y = 2;

    const bodyGeo = texturePainting(
      new BoxGeometry(8, 12, 4),
      new Float32Array([
        _pxX(28), _pxY(12), _pxX(32), _pxY(12), _pxX(28), _pxY(0), _pxX(32), _pxY(0),
        _pxX(16), _pxY(12), _pxX(20), _pxY(12), _pxX(16), _pxY(0), _pxX(20), _pxY(0),
        _pxX(20), _pxY(16), _pxX(28), _pxY(16), _pxX(20), _pxY(12), _pxX(28), _pxY(12),
        _pxX(28), _pxY(12), _pxX(36), _pxY(12), _pxX(28), _pxY(16), _pxX(36), _pxY(16),
        _pxX(20), _pxY(12), _pxX(28), _pxY(12), _pxX(20), _pxY(0), _pxX(28), _pxY(0),
        _pxX(32), _pxY(12), _pxX(40), _pxY(12), _pxX(32), _pxY(0), _pxX(40), _pxY(0),
      ]),
      texture
    );
    bodyGroup.add(bodyGeo);


    const leftArmGroup = new Group();
    leftArmGroup.position.set(6, 2 + 4, 0);

    const leftArmGeo = texturePainting(
      new BoxGeometry(4, 12, 4),
      new Float32Array([
        _pxX(44), _pxY(12), _pxX(40), _pxY(12), _pxX(44), _pxY(0), _pxX(40), _pxY(0),
        _pxX(52), _pxY(12), _pxX(48), _pxY(12), _pxX(52), _pxY(0), _pxX(48), _pxY(0),
        _pxX(48), _pxY(16), _pxX(44), _pxY(16), _pxX(48), _pxY(12), _pxX(44), _pxY(12),
        _pxX(52), _pxY(12), _pxX(48), _pxY(12), _pxX(52), _pxY(16), _pxX(48), _pxY(16),
        _pxX(48), _pxY(12), _pxX(44), _pxY(12), _pxX(48), _pxY(0), _pxX(44), _pxY(0),
        _pxX(56), _pxY(12), _pxX(52), _pxY(12), _pxX(56), _pxY(0), _pxX(52), _pxY(0),
      ]),
      texture
    );
    leftArmGeo.position.y -= 4;
    leftArmGroup.add(leftArmGeo);


    const rightArmGroup = new Group();
    rightArmGroup.position.set(-6, 2 + 4, 0);

    const rightArmGeo = texturePainting(
      new BoxGeometry(4, 12, 4),
      new Float32Array([
        _pxX(48), _pxY(12), _pxX(52), _pxY(12), _pxX(48), _pxY(0), _pxX(52), _pxY(0),
        _pxX(40), _pxY(12), _pxX(44), _pxY(12), _pxX(40), _pxY(0), _pxX(44), _pxY(0),
        _pxX(44), _pxY(16), _pxX(48), _pxY(16), _pxX(44), _pxY(12), _pxX(48), _pxY(12),
        _pxX(48), _pxY(12), _pxX(52), _pxY(12), _pxX(48), _pxY(16), _pxX(52), _pxY(16),
        _pxX(44), _pxY(12), _pxX(48), _pxY(12), _pxX(44), _pxY(0), _pxX(48), _pxY(0),
        _pxX(52), _pxY(12), _pxX(56), _pxY(12), _pxX(52), _pxY(0), _pxX(56), _pxY(0),
      ]),
      texture
    );
    rightArmGeo.position.y -= 4;
    rightArmGroup.add(rightArmGeo);


    const leftLegGroup = new Group();
    leftLegGroup.position.set(2, -10 + 4, 0);

    const leftLegGeo = texturePainting(
      new BoxGeometry(4, 12, 4),
      new Float32Array([
        _pxX(4), _pxY(12), _pxX(0), _pxY(12), _pxX(4), _pxY(0), _pxX(0), _pxY(0),
        _pxX(12), _pxY(12), _pxX(8), _pxY(12), _pxX(12), _pxY(0), _pxX(8), _pxY(0),
        _pxX(8), _pxY(16), _pxX(4), _pxY(16), _pxX(8), _pxY(12), _pxX(4), _pxY(12),
        _pxX(12), _pxY(12), _pxX(8), _pxY(12), _pxX(12), _pxY(16), _pxX(8), _pxY(16),
        _pxX(8), _pxY(12), _pxX(4), _pxY(12), _pxX(8), _pxY(0), _pxX(4), _pxY(0),
        _pxX(16), _pxY(12), _pxX(12), _pxY(12), _pxX(16), _pxY(0), _pxX(12), _pxY(0),
      ]),
      texture
    );
    leftLegGeo.position.y -= 4;
    leftLegGroup.add(leftLegGeo);


    const rightLegGroup = new Group();
    rightLegGroup.position.set(-2, -10 + 4, 0);

    const rightLegGeo = texturePainting(
      new BoxGeometry(4, 12, 4),
      new Float32Array([
        _pxX(8), _pxY(12), _pxX(12), _pxY(12), _pxX(8), _pxY(0), _pxX(12), _pxY(0),
        _pxX(0), _pxY(12), _pxX(4), _pxY(12), _pxX(0), _pxY(0), _pxX(4), _pxY(0),
        _pxX(4), _pxY(16), _pxX(8), _pxY(16), _pxX(4), _pxY(12), _pxX(8), _pxY(12),
        _pxX(8), _pxY(12), _pxX(12), _pxY(12), _pxX(8), _pxY(16), _pxX(12), _pxY(16),
        _pxX(4), _pxY(12), _pxX(8), _pxY(12), _pxX(4), _pxY(0), _pxX(8), _pxY(0),
        _pxX(12), _pxY(12), _pxX(16), _pxY(12), _pxX(12), _pxY(0), _pxX(16), _pxY(0),
      ]),
      texture
    );
    rightLegGeo.position.y -= 4;
    rightLegGroup.add(rightLegGeo);

    model.add(headGroup);
    model.add(bodyGroup);
    model.add(leftArmGroup);
    model.add(rightArmGroup);
    model.add(leftLegGroup);
    model.add(rightLegGroup);

    return model;
  }

  private async getCapeTexture(capeUrl: string): Promise<Texture> {
    const texture = await this.loadTexture(capeUrl);

    if (texture.source.data.width === 64) {
      return texture;
    }

    const width = Math.ceil(texture.source.data.width / 64) * 64;
    const height = Math.ceil(texture.source.data.height / 32) * 32;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get context');
    }

    ctx.drawImage(texture.source.data, 0, 0);
    return new CanvasTexture(canvas);
  }

  private async buildCapeModel(capeURL: string): Promise<Group> {
    const texture = await this.getCapeTexture(capeURL);

    const capeGroup = new Group();
    capeGroup.position.set(0, 8, -2);

    const capeGeo = texturePainting(
      new BoxGeometry(10, 16, 1),
      new Float32Array([
        0, 0.96875, 0.015625, 0.96875,
        0, 0.46875, 0.015625, 0.46875,
        0.171875, 0.96875, 0.1875, 0.96875,
        0.171875, 0.46875, 0.1875, 0.46875,
        0.015625, 1, 0.171875, 1,
        0.015625, 0.96875, 0.171875, 0.96875,
        0.171875, 1, 0.328125, 1,
        0.171875, 0.96875, 0.328125, 0.96875,
        0.1875, 0.96875, 0.34375, 0.96875,
        0.1875, 0.46875, 0.34375, 0.46875,
        0.015625, 0.96875, 0.171875, 0.96875,
        0.015625, 0.46875, 0.171875, 0.46875
      ]),
      texture
    );
    capeGeo.position.y -= 8;
    capeGroup.add(capeGeo);

    return capeGroup;
  }

  private async buildElytraModel(capeURL: string): Promise<Group> {
    const texture = await this.loadTexture(capeURL);
    const _pxX = (num: number) => num / 64;
    const _pxY = (num: number) => (32 - num) / 32;

    const elytraGroup = new Group();
    elytraGroup.rotation.set(radians(15), 0, 0);
    elytraGroup.position.set(0, -3, -5);
    elytraGroup.scale.set(1.2, 1.2, 1.2);

    const leftGeo = texturePainting(
      new BoxGeometry(9, 20, 3),
      new Float32Array([
        _pxX(24), _pxY(2), _pxX(22), _pxY(2), _pxX(24), _pxY(22), _pxX(22), _pxY(22),
        _pxX(36), _pxY(2), _pxX(34), _pxY(2), _pxX(36), _pxY(22), _pxX(34), _pxY(22),
        _pxX(34), _pxY(0), _pxX(24), _pxY(0), _pxX(34), _pxY(2), _pxX(24), _pxY(2),
        _pxX(44), _pxY(2), _pxX(34), _pxY(2), _pxX(44), _pxY(0), _pxX(34), _pxY(0),
        _pxX(34), _pxY(2), _pxX(24), _pxY(2), _pxX(34), _pxY(22), _pxX(24), _pxY(22),
        _pxX(46), _pxY(2), _pxX(36), _pxY(2), _pxX(46), _pxY(22), _pxX(36), _pxY(22),
      ]),
      texture,
      { alpha: true, doubleSide: true }
    );
    leftGeo.position.x -= 1.8;
    leftGeo.rotation.set(0, radians(-5), radians(-10));

    const rightGeo = texturePainting(
      new BoxGeometry(9, 20, 3),
      new Float32Array([
        _pxX(34), _pxY(2), _pxX(36), _pxY(2), _pxX(34), _pxY(22), _pxX(36), _pxY(22),
        _pxX(22), _pxY(2), _pxX(24), _pxY(2), _pxX(22), _pxY(22), _pxX(24), _pxY(22),
        _pxX(24), _pxY(0), _pxX(34), _pxY(0), _pxX(24), _pxY(2), _pxX(34), _pxY(2),
        _pxX(34), _pxY(2), _pxX(44), _pxY(2), _pxX(34), _pxY(0), _pxX(44), _pxY(0),
        _pxX(24), _pxY(2), _pxX(34), _pxY(2), _pxX(24), _pxY(22), _pxX(34), _pxY(22),
        _pxX(36), _pxY(2), _pxX(46), _pxY(2), _pxX(36), _pxY(22), _pxX(46), _pxY(22),
      ]),
      texture,
      { alpha: true, doubleSide: true }
    );
    rightGeo.position.x += 1.8;
    rightGeo.rotation.set(0, radians(5), radians(10));

    elytraGroup.add(leftGeo);
    elytraGroup.add(rightGeo);

    return elytraGroup;
  }

  startAnimation(replay?: boolean): void {
    if (replay) {
      this.animTimeOffset = -globalNow();
      this.animPausedElapsed = null;
    } else if (this.animPausedElapsed !== null) {
      this.animTimeOffset = this.animPausedElapsed - globalNow();
      this.animPausedElapsed = null;
    }
    this.playAnim = true;
    this.startRenderLoop();
  }

  pauseAnimation(): void {
    this.animPausedElapsed = this.getAnimElapsed();
    this.playAnim = false;
    this.tryStopRenderLoop();
  }

  setAnimationTime(time: number): void {
    this.animPausedElapsed = time;
    if (this.options.skinDataURL || this.options.capeDataURL) {
      this.playAnim = 1;
    }
  }

  async update(options: SkinViewerOptions = {}): Promise<void> {
    let needReBuildSkin = false;

    if (options.slim !== void 0) {
      needReBuildSkin = options.slim !== this.options.slim;
      this.options.slim = options.slim;
    }

    if (options.skinDataURL && options.skinDataURL !== this.options.skinDataURL) {
      this.options.skinDataURL = options.skinDataURL;
      needReBuildSkin = true;
    }

    if (needReBuildSkin && this.options.skinDataURL) {
      if (this.skinModel) this.scene.remove(this.skinModel);

      const model = await this.buildSkinModel(this.options.skinDataURL);
      if (this.disposed) return;
      this.skinModel = model;
      this.scene.add(model);
      this.playAnim = 1;
    }

    let needReBuildCape = false;
    if (options.capeDataURL && options.capeDataURL !== this.options.capeDataURL) {
      this.options.capeDataURL = options.capeDataURL;
      needReBuildCape = true;
    }
    if (options.elytra !== void 0 && options.elytra !== this.options.elytra) {
      this.options.elytra = options.elytra;
      needReBuildCape = true;
    }
    if (needReBuildCape && this.options.capeDataURL) {
      if (this.capeModel) this.scene.remove(this.capeModel);

      const model = this.options.elytra
        ? await this.buildElytraModel(this.options.capeDataURL)
        : await this.buildCapeModel(this.options.capeDataURL);
      if (this.disposed) return;

      this.capeModel = model;
      this.scene.add(model);
      this.playAnim = 1;
      this.render();
    }

    if (options.cameraPosition) {
      if (options.cameraPosition.x !== void 0)
        this.camera.position.x = options.cameraPosition.x;
      if (options.cameraPosition.y !== void 0)
        this.camera.position.y = options.cameraPosition.y;
      if (options.cameraPosition.z !== void 0)
        this.camera.position.z = options.cameraPosition.z;
    }

    this.render();
  }

  removeCape(): void {
    if (!this.options.capeDataURL) return;
    this.options.capeDataURL = void 0;
    if (this.capeModel) {
      this.scene.remove(this.capeModel);
      this.capeModel = null;
    }
    this.render();
  }

  dispose(): void {
    this.disposed = true;
    this.stopRenderLoop();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.controls.dispose();
    this.renderer.dispose();

    const disposeGroup = (group: Group | null) => {
      if (!group) return;
      group.traverse((child) => {
        if ('geometry' in child && child.geometry) {
          (child.geometry as { dispose: () => void }).dispose();
        }
        if ('material' in child && child.material) {
          const mat = child.material as { map?: { dispose: () => void }; dispose: () => void };
          mat.map?.dispose();
          mat.dispose();
        }
      });
    };

    disposeGroup(this.skinModel);
    disposeGroup(this.capeModel);
  }
}
