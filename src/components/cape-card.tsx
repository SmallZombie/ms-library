'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkinViewer } from './skin-viewer';

interface CapeCardProps {
  id: number;
  name?: string | null;
  type?: string | null;
  tags: string[];
  filePath: string;
  asLink?: boolean;
}

export function CapeCard({ id, name, type, tags, filePath, asLink = true }: CapeCardProps) {
  const capeUrl = `/api/files/${filePath}`;

  const card = (
    <Card className='group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 gap-0'>
      <div className='flex justify-center bg-muted/30'>
        <SkinViewer className='pointer-events-none'
          capeUrl={capeUrl}
          width={180}
          height={220}
          animate={false}
          cameraPosition={{ x: 0, y: 5, z: -30 }}
        />
      </div>
      <CardContent className='px-3 py-2.5 space-y-1.5'>
        <p className='font-medium text-sm truncate'>
          {name || `披风 #${id}`}
        </p>
        <div className='flex flex-wrap gap-1'>
          {type && (
            <Badge variant='secondary' className='text-xs'>{type}</Badge>
          )}
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant='outline' className='text-xs'>{tag}</Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant='outline' className='text-xs'>+{tags.length - 3}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!asLink) return card;

  return <Link href={`/capes/${id}`}>{card}</Link>;
}
