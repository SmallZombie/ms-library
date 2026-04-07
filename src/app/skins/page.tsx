'use client';

import { useState, useEffect, useCallback } from 'react';
import { SkinCard } from '@/components/skin-card';
import { FilterBar } from '@/components/filter-bar';
import { Pagination } from '@/components/pagination';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 20;

interface SkinItem {
  id: number;
  name: string | null;
  slim: boolean;
  type: string | null;
  tags: string[];
  filePath: string;
  cape?: { filePath: string } | null;
}

export default function SkinsPage() {
  const [skins, setSkins] = useState<SkinItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [order, setOrder] = useState('1');
  const [loading, setLoading] = useState(true);

  const fetchSkins = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (type) params.set('type', type);
    for (const tag of selectedTags) params.append('tags', tag);
    params.set('order', order);
    params.set('offset', String((page - 1) * PAGE_SIZE));
    params.set('limit', String(PAGE_SIZE));

    const res = await fetch(`/api/skins?${params}`);
    const data = await res.json();
    setSkins(data.list);
    setTotal(data.total);
    setLoading(false);
  }, [keyword, type, selectedTags, order, page]);

  useEffect(() => {
    const timer = setTimeout(fetchSkins, 300);
    return () => clearTimeout(timer);
  }, [fetchSkins]);

  useEffect(() => {
    setPage(1);
  }, [keyword, type, selectedTags, order]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>皮肤库</h1>
        <span className='text-sm text-muted-foreground'>共 {total} 个皮肤</span>
      </div>

      <FilterBar
        section='skins'
        keyword={keyword}
        type={type}
        selectedTags={selectedTags}
        order={order}
        onKeywordChange={setKeyword}
        onTypeChange={setType}
        onTagsChange={setSelectedTags}
        onOrderChange={setOrder}
      />

      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <Skeleton className='h-56 w-full rounded-lg' />
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
            </div>
          ))}
        </div>
      ) : skins.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
          <p className='text-lg'>暂无皮肤</p>
          <p className='text-sm mt-1'>点击左侧 &quot;添加皮肤&quot; 开始收集</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
          {skins.map((skin) => (
            <SkinCard
              key={skin.id}
              id={skin.id}
              name={skin.name}
              type={skin.type}
              tags={skin.tags}
              filePath={skin.filePath}
              slim={skin.slim}
              cape={skin.cape}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
