'use client';

import { useRef, useEffect, useCallback } from 'react';
import { SkinViewerCore, type SkinViewerOptions } from '@/lib/skin-viewer/skin-viewer-core';

export function useSkinViewer(options: SkinViewerOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewerCore | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewer = new SkinViewerCore(canvas, options);
    viewerRef.current = viewer;

    viewer.setAnimationTime(1200);
    viewer.startAnimation(true);

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateViewer = useCallback(async (newOptions: SkinViewerOptions) => {
    if (viewerRef.current) {
      await viewerRef.current.update(newOptions);
    }
  }, []);

  return { canvasRef, viewerRef, updateViewer };
}
