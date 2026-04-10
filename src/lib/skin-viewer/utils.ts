import {
  MeshBasicMaterial,
  Mesh,
  NearestFilter,
  BufferAttribute,
  BoxGeometry,
  SRGBColorSpace,
  DoubleSide,
  Texture,
} from 'three';

export function texturePainting(
  geometry: BoxGeometry,
  uv: Float32Array,
  texture: Texture,
  options: { alpha?: boolean; doubleSide?: boolean } = {}
): Mesh {
  texture.magFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;

  const material = new MeshBasicMaterial({ map: texture });
  geometry.setAttribute('uv', new BufferAttribute(uv, 2));

  if (options.alpha) material.alphaHash = true;
  if (options.doubleSide) material.side = DoubleSide;

  return new Mesh(geometry, material);
}

export function radians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Generate UV for the cape */
export function generateCapeUV() {
  const _pxX = (num: number) => num / 64;
  const _pxY = (num: number) => (32 - num) / 32;
  return new Float32Array([
    _pxX(0), _pxY(1), _pxX(1), _pxY(1), _pxX(0), _pxY(17), _pxX(1), _pxY(17),
    _pxX(11), _pxY(1), _pxX(12), _pxY(1), _pxX(11), _pxY(17), _pxX(12), _pxY(17),
    _pxX(1), _pxY(0), _pxX(11), _pxY(0), _pxX(1), _pxY(1), _pxX(11), _pxY(1),
    _pxX(11), _pxY(0), _pxX(21), _pxY(0), _pxX(11), _pxY(1), _pxX(21), _pxY(1),
    _pxX(12), _pxY(1), _pxX(22), _pxY(1), _pxX(12), _pxY(17), _pxX(22), _pxY(17),
    _pxX(1), _pxY(1), _pxX(11), _pxY(1), _pxX(1), _pxY(17), _pxX(11), _pxY(17),
  ]);
}

export function generateElytraUV() {}
