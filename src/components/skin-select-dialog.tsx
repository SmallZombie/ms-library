'use client';

import { useState, useEffect, useCallback } from 'react';
import { SkinTile } from '@/components/skin-tile';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export interface SkinSelectItem {
  id: number;
  name: string | null;
  filePath: string;
  type?: string | null;
  tags?: string[];
  slim?: boolean;
}

export function SkinSelectDialog({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (skin: SkinSelectItem) => void;
}) {
  const [skins, setSkins] = useState<SkinSelectItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSkins = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/skins?limit=1000');
    const data = await res.json();
    setSkins(data.list || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadSkins(); }, [loadSkins]);

  return (
    <DialogContent className='max-w-md'>
      <DialogHeader>
        <DialogTitle>选择皮肤</DialogTitle>
      </DialogHeader>
      <ScrollArea className='max-h-96'>
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : skins.length === 0 ? (
          <p className='text-center text-muted-foreground py-8'>
            暂无皮肤，请先添加皮肤
          </p>
        ) : (
          <div className='space-y-2 pr-4'>
            {skins.map((skin) => (
              <SkinTile
                key={skin.id}
                id={skin.id}
                name={skin.name}
                type={skin.type}
                tags={skin.tags}
                filePath={skin.filePath}
                slim={skin.slim}
                selected={skin.id === selectedId}
                onClick={() => onSelect(skin)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </DialogContent>
  );
}
