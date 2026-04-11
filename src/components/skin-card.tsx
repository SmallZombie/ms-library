'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkinViewer } from './skin-viewer';

interface SkinCardProps {
  id: number;
  name?: string | null;
  type?: string | null;
  tags: string[];
  filePath: string;
  slim: boolean;
  cape?: { filePath: string } | null;
  asLink?: boolean;
}

export function SkinCard({ id, name, type, tags, filePath, slim, cape, asLink = true }: SkinCardProps) {
  const skinUrl = `/api/files/${filePath}`;
  const capeUrl = cape ? `/api/files/${cape.filePath}` : void 0;

  const card = (
    <Card className='group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 gap-0'>
      <div className='flex justify-center bg-muted/30'>
        <SkinViewer
          className='pointer-events-none'
          skinUrl={skinUrl}
          capeUrl={capeUrl}
          slim={slim}
          width={180}
          height={320}
          animate={false}
        />
      </div>
      <CardContent className='px-3 py-2.5 space-y-1.5'>
        <p className='font-medium text-sm truncate'>
          {name || `皮肤 #${id}`}
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

  return <Link href={`/skins/${id}`}>{card}</Link>;
}
