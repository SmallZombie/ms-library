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
