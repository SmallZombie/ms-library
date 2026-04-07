'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowUpDown, X } from 'lucide-react';

interface FilterBarProps {
  section: 'skins' | 'capes';
  keyword: string;
  type: string;
  selectedTags: string[];
  order: string;
  onKeywordChange: (keyword: string) => void;
  onTypeChange: (type: string) => void;
  onTagsChange: (tags: string[]) => void;
  onOrderChange: (order: string) => void;
}

export function FilterBar({
  section,
  keyword,
  type,
  selectedTags,
  order,
  onKeywordChange,
  onTypeChange,
  onTagsChange,
  onOrderChange,
}: FilterBarProps) {
  const [types, setTypes] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/${section}/filters`)
      .then(res => res.json())
      .then(data => {
        setTypes(data.types || []);
        setAllTags(data.tags || []);
      });
  }, [section]);

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <div className='relative flex-1 min-w-48'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='搜索名称...'
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className='pl-8'
          />
        </div>

        <Select value={type || '_all'} onValueChange={(v) => onTypeChange(v === '_all' ? '' : v)}>
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='全部分类' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='_all'>全部分类</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant='outline'
          size='icon'
          onClick={() => onOrderChange(order === '1' ? '0' : '1')}
          title={order === '1' ? '最新优先' : '最早优先'}
        >
          <ArrowUpDown className='h-4 w-4' />
        </Button>
      </div>

      {allTags.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {allTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Badge
                key={tag}
                variant={isSelected ? 'default' : 'outline'}
                className='cursor-pointer'
                onClick={() => {
                  if (isSelected) {
                    onTagsChange(selectedTags.filter(t => t !== tag));
                  } else {
                    onTagsChange([...selectedTags, tag]);
                  }
                }}
              >
                {tag}
                {isSelected && <X className='ml-1 h-3 w-3' />}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
