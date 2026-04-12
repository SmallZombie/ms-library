'use client';

import { useEffect, useRef, useState } from 'react';
import { SkinViewerCore } from '@/lib/skin-viewer/skin-viewer-core';

const PREVIEW_CSS_W = 180;
const PREVIEW_CSS_H = 320;

export type SkinSnapshotItem = {
  id: number;
  filePath: string;
  slim: boolean;
  cape?: { filePath: string } | null;
};

function revokeRecord(urls: Record<number, string | undefined>) {
  for (const u of Object.values(urls)) {
    if (u) URL.revokeObjectURL(u);
  }
}

export function useSkinViewerSnapshots(items: SkinSnapshotItem[] | null): Record<number, string | undefined> {
  const [urls, setUrls] = useState<Record<number, string | undefined>>({});
  const urlsRef = useRef(urls);
  urlsRef.current = urls;

  const sig =
    items === null
      ? '__null__'
      : items.length === 0
        ? '__empty__'
        : items.map((i) => `${i.id}:${i.filePath}:${i.slim}:${i.cape?.filePath ?? ''}`).join('|');

  useEffect(() => {
    const revokeCurrent = () => revokeRecord(urlsRef.current);

    if (items === null || items.length === 0) {
      revokeCurrent();
      setUrls({});
      return;
    }

    let cancelled = false;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `position:fixed;left:0;top:0;width:${PREVIEW_CSS_W}px;height:${PREVIEW_CSS_H}px;opacity:0;pointer-events:none;z-index:-1;`;
    document.body.appendChild(canvas);

    const core = new SkinViewerCore(canvas, { allowDrag: false });

    revokeCurrent();
    setUrls({});

    const run = async () => {
      for (const item of items) {
        if (cancelled) break;

        const skinDataURL = `/api/files/${item.filePath}`;
        const capeDataURL = item.cape ? `/api/files/${item.cape.filePath}` : undefined;

        if (!capeDataURL) {
          core.removeCape();
        }

        await core.update({
          skinDataURL,
          capeDataURL,
          slim: item.slim,
        });
        if (cancelled) break;

        core.setAnimationTime(1200);
        core.render();

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png');
        });
        if (cancelled || !blob) continue;

        const objectUrl = URL.createObjectURL(blob);
        setUrls((prev) => {
          const next = { ...prev, [item.id]: objectUrl };
          const old = prev[item.id];
          if (old) URL.revokeObjectURL(old);
          return next;
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
      revokeRecord(urlsRef.current);
      setUrls({});
      core.dispose();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return urls;
}

export type CapeSnapshotItem = {
  id: number;
  filePath: string;
};

const CAPE_PREVIEW_CAMERA = { x: 0, y: 5, z: -30 } as const;

export function useCapeViewerSnapshots(items: CapeSnapshotItem[] | null): Record<number, string | undefined> {
  const [urls, setUrls] = useState<Record<number, string | undefined>>({});
  const urlsRef = useRef(urls);
  urlsRef.current = urls;

  const sig =
    items === null
      ? '__null__'
      : items.length === 0
        ? '__empty__'
        : items.map((i) => `${i.id}:${i.filePath}`).join('|');

  useEffect(() => {
    const revokeCurrent = () => revokeRecord(urlsRef.current);

    if (items === null || items.length === 0) {
      revokeCurrent();
      setUrls({});
      return;
    }

    let cancelled = false;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `position:fixed;left:0;top:0;width:${PREVIEW_CSS_W}px;height:${PREVIEW_CSS_H}px;opacity:0;pointer-events:none;z-index:-1;`;
    document.body.appendChild(canvas);

    const core = new SkinViewerCore(canvas, {
      allowDrag: false,
      eventTarget: canvas,
      cameraPosition: { ...CAPE_PREVIEW_CAMERA },
    });

    revokeCurrent();
    setUrls({});

    const run = async () => {
      for (const item of items) {
        if (cancelled) break;

        const capeDataURL = `/api/files/${item.filePath}`;

        await core.update({
          capeDataURL,
          elytra: false,
          cameraPosition: { ...CAPE_PREVIEW_CAMERA },
        });
        if (cancelled) break;

        core.setAnimationTime(1200);
        core.render();

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png');
        });
        if (cancelled || !blob) continue;

        const objectUrl = URL.createObjectURL(blob);
        setUrls((prev) => {
          const next = { ...prev, [item.id]: objectUrl };
          const old = prev[item.id];
          if (old) URL.revokeObjectURL(old);
          return next;
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
      revokeRecord(urlsRef.current);
      setUrls({});
      core.dispose();
      canvas.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return urls;
}
