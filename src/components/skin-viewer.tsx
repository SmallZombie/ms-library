'use client';

import { useEffect, useRef } from 'react';
import { SkinViewerCore, type SkinViewerOptions } from '@/lib/skin-viewer/skin-viewer-core';
import { cn } from '@/lib/utils';

interface SkinViewerProps {
  skinUrl?: string;
  capeUrl?: string;
  slim?: boolean;
  elytra?: boolean;
  className?: string;
  width?: number;
  height?: number;
  animate?: boolean;
  cameraPosition?: { x?: number; y?: number; z?: number };
}

export function SkinViewer({
  skinUrl,
  capeUrl,
  slim = false,
  elytra = false,
  className,
  width = 300,
  height = 400,
  animate = true,
  cameraPosition,
}: SkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewerCore | null>(null);
  const prevOptionsRef = useRef<SkinViewerOptions>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initialOptions: SkinViewerOptions = {
      skinDataURL: skinUrl,
      capeDataURL: capeUrl,
      slim,
      elytra,
      cameraPosition,
    };

    const viewer = new SkinViewerCore(canvas, initialOptions);
    viewerRef.current = viewer;
    prevOptionsRef.current = initialOptions;

    viewer.setAnimationTime(1200);
    if (animate) {
      viewer.startAnimation(true);
    }

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const prev = prevOptionsRef.current;
    const updates: SkinViewerOptions = {};
    let needUpdate = false;

    if (skinUrl !== prev.skinDataURL) {
      updates.skinDataURL = skinUrl;
      needUpdate = true;
    }
    if (capeUrl !== prev.capeDataURL) {
      updates.capeDataURL = capeUrl;
      needUpdate = true;
    }
    if (slim !== prev.slim) {
      updates.slim = slim;
      if (skinUrl) updates.skinDataURL = skinUrl;
      needUpdate = true;
    }
    if (elytra !== prev.elytra) {
      updates.elytra = elytra;
      needUpdate = true;
    }

    if (needUpdate) {
      viewer.update(updates);
      prevOptionsRef.current = { skinDataURL: skinUrl, capeDataURL: capeUrl, slim, elytra };
    }
  }, [skinUrl, capeUrl, slim, elytra]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height }}
      className={cn('rounded-lg', className)}
    />
  );
}
