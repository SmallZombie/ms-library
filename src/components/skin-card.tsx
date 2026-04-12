'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface SkinCardProps {
  id: number;
  cover?: string;
  name: string;
  type?: string;
  tags: string[];
  asLink?: boolean;
}

export function SkinCard({
  id,
  cover,
  name,
  type,
  tags,
  asLink = true,
}: SkinCardProps) {
  const card = (
    <Card className='group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 gap-0'>
      <div className='flex justify-center bg-muted/30'>
        {cover ? (
          <Image
            src={cover}
            alt={name}
            width={180}
            height={320}
            className='pointer-events-none rounded-lg max-w-full h-auto'
          />
        ) : (
          <div className='h-[320px]'></div>
        )}
      </div>
      <CardContent className='px-3 py-2.5 space-y-1.5'>
        <p className='font-medium text-sm truncate'>
          {name}
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
