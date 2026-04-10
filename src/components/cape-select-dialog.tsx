'use client';

import { useState, useEffect, useCallback } from 'react';
import { CapeTile } from '@/components/cape-tile';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export interface CapeSelectItem {
  id: number;
  name: string | null;
  filePath: string;
  type?: string | null;
  tags?: string[];
}

export function CapeSelectDialog({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (cape: CapeSelectItem) => void;
}) {
  const [capes, setCapes] = useState<CapeSelectItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCapes = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/capes?limit=1000');
    const data = await res.json();
    setCapes(data.list || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadCapes(); }, [loadCapes]);

  return (
    <DialogContent className='max-w-md'>
      <DialogHeader>
        <DialogTitle>选择披风</DialogTitle>
      </DialogHeader>
      <ScrollArea className='max-h-96'>
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : capes.length === 0 ? (
          <p className='text-center text-muted-foreground py-8'>
            暂无披风，请先添加披风
          </p>
        ) : (
          <div className='space-y-2 pr-4'>
            {capes.map((cape) => (
              <CapeTile
                key={cape.id}
                id={cape.id}
                name={cape.name}
                type={cape.type}
                tags={cape.tags}
                filePath={cape.filePath}
                selected={cape.id === selectedId}
                onClick={() => onSelect(cape)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </DialogContent>
  );
}
