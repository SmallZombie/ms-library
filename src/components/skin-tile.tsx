'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SkinTileProps {
  id: number;
  name?: string | null;
  type?: string | null;
  tags?: string[];
  filePath: string;
  slim?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function SkinTile({
  id,
  name,
  type,
  tags = [],
  filePath,
  slim = false,
  selected = false,
  onClick,
}: SkinTileProps) {
  const imgUrl = `/api/files/${filePath}`;

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent',
        selected && 'border-primary bg-primary/5'
      )}
    >
      <div className='flex-shrink-0 w-12 h-12 rounded bg-muted/50 flex items-center justify-center overflow-hidden'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          alt={name || `Skin #${id}`}
          className='w-full h-full object-contain'
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='font-medium text-sm truncate'>
          {name || `皮肤 #${id}`}
        </p>
        <div className='flex flex-wrap gap-1 mt-1'>
          {slim && (
            <Badge variant='secondary' className='text-xs'>纤细</Badge>
          )}
          {type && (
            <Badge variant='secondary' className='text-xs'>{type}</Badge>
          )}
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant='outline' className='text-xs'>{tag}</Badge>
          ))}
        </div>
      </div>
      <span className='text-xs text-muted-foreground flex-shrink-0'>#{id}</span>
    </button>
  );
}
