'use client';

import { useState, useEffect, useCallback } from 'react';
import { CapeCard } from '@/components/cape-card';
import { FilterBar } from '@/components/filter-bar';
import { Pagination } from '@/components/pagination';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 20;

interface CapeItem {
  id: number;
  name: string | null;
  type: string | null;
  tags: string[];
  filePath: string;
}

export default function CapesPage() {
  const [capes, setCapes] = useState<CapeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [order, setOrder] = useState('1');
  const [loading, setLoading] = useState(true);

  const fetchCapes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (type) params.set('type', type);
    for (const tag of selectedTags) params.append('tags', tag);
    params.set('order', order);
    params.set('offset', String((page - 1) * PAGE_SIZE));
    params.set('limit', String(PAGE_SIZE));

    const res = await fetch(`/api/capes?${params}`);
    const data = await res.json();
    setCapes(data.list);
    setTotal(data.total);
    setLoading(false);
  }, [keyword, type, selectedTags, order, page]);

  useEffect(() => {
    const timer = setTimeout(fetchCapes, 300);
    return () => clearTimeout(timer);
  }, [fetchCapes]);

  useEffect(() => {
    setPage(1);
  }, [keyword, type, selectedTags, order]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>披风库</h1>
        <span className='text-sm text-muted-foreground'>共 {total} 个披风</span>
      </div>

      <FilterBar
        section='capes'
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
      ) : capes.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
          <p className='text-lg'>暂无披风</p>
          <p className='text-sm mt-1'>点击左侧 &quot;添加披风&quot; 开始收集</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
          {capes.map((cape) => (
            <CapeCard
              key={cape.id}
              id={cape.id}
              name={cape.name}
              type={cape.type}
              tags={cape.tags}
              filePath={cape.filePath}
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
