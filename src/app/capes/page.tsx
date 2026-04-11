'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { CapeCard } from '@/components/cape-card';
import { Selectable } from '@/components/selectable';
import { FilterBar } from '@/components/filter-bar';
import { Pagination } from '@/components/pagination';
import { TagInput } from '@/components/tag-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CheckSquare, Square, ToggleLeft, MousePointerClick,
  Tags, FolderOpen, Link2, Trash2, Loader2, X, Plus,
} from 'lucide-react';

const PAGE_SIZE = 20;

interface CapeItem {
  id: number;
  name: string | null;
  type: string | null;
  tags: string[];
  filePath: string;
}

type BatchDialogType = 'tags' | 'type' | 'source' | null;

export default function CapesPage() {
  const [capes, setCapes] = useState<CapeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [order, setOrder] = useState('1');
  const [loading, setLoading] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDialog, setBatchDialog] = useState<BatchDialogType>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchTags, setBatchTags] = useState<string[]>([]);
  const [batchTagMode, setBatchTagMode] = useState<'override' | 'append'>('append');
  const [batchType, setBatchType] = useState('');
  const [batchSource, setBatchSource] = useState('');

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

  const exitBatchMode = () => {
    setBatchMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pageIds = capes.map((c) => c.id);

  const selectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) next.add(id);
      return next;
    });
  };

  const selectNonePage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) next.delete(id);
      return next;
    });
  };

  const selectInvertPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const selectNoneAll = () => setSelectedIds(new Set());

  const selectInvertAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const batchUpdate = async (updates: Record<string, unknown>, tagMode?: 'override' | 'append') => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    try {
      const res = await fetch('/api/capes/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          ids: Array.from(selectedIds),
          updates,
          tagMode,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchCapes();
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败');
    } finally {
      setBatchLoading(false);
      setBatchDialog(null);
    }
  };

  const batchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个披风吗？此操作不可撤销。`)) return;
    setBatchLoading(true);
    try {
      const res = await fetch('/api/capes/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          ids: Array.from(selectedIds),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSelectedIds(new Set());
      await fetchCapes();
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const applyBatchTags = () => batchUpdate({ tags: batchTags }, batchTagMode);
  const applyBatchType = () => batchUpdate({ type: batchType || null });
  const applyBatchSource = () => batchUpdate({ source: batchSource || null });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className='p-6 space-y-4 max-w-7xl mx-auto'>
      <div className='flex items-center justify-between flex-wrap whitespace-nowrap gap-2'>
        <h1 className='text-2xl font-bold'>披风库</h1>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-muted-foreground'>共 {total} 个披风</span>
          {!batchMode ? (
            <Button variant='outline' size='sm' onClick={() => setBatchMode(true)} className='gap-1.5'>
              <MousePointerClick className='h-3.5 w-3.5' />
              批量操作
            </Button>
          ) : (
            <Button variant='outline' size='sm' onClick={exitBatchMode} className='gap-1.5'>
              <X className='h-3.5 w-3.5' />
              退出批量
            </Button>
          )}
          <Link href='/capes/add'>
            <Button size='sm' className='gap-1.5'>
              <Plus className='h-3.5 w-3.5' />
              添加披风
            </Button>
          </Link>
        </div>
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

      {batchMode && (
        <div className='flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3'>
          <div className='flex items-center gap-1'>
            <Button variant='outline' size='sm' onClick={selectAllPage} className='gap-1.5 h-8'>
              <CheckSquare className='h-3.5 w-3.5' />
              全选本页
            </Button>
            <Button variant='outline' size='sm' onClick={selectNonePage} className='gap-1.5 h-8'>
              <Square className='h-3.5 w-3.5' />
              全不选本页
            </Button>
            <Button variant='outline' size='sm' onClick={selectInvertPage} className='gap-1.5 h-8'>
              <ToggleLeft className='h-3.5 w-3.5' />
              反选本页
            </Button>
          </div>

          <Separator orientation='vertical' className='h-6' />

          <div className='flex items-center gap-1'>
            <Button variant='outline' size='sm' onClick={selectNoneAll} className='gap-1.5 h-8'>
              <Square className='h-3.5 w-3.5' />
              全不选
            </Button>
            <Button variant='outline' size='sm' onClick={selectInvertAll} className='gap-1.5 h-8'>
              <ToggleLeft className='h-3.5 w-3.5' />
              反选
            </Button>
          </div>

          <Separator orientation='vertical' className='h-6' />

          <span className='text-sm text-muted-foreground'>
            已选 {selectedIds.size} 项（本页 {pageIds.filter((id) => selectedIds.has(id)).length} / {capes.length}）
          </span>

          {selectedIds.size > 0 && (
            <>
              <Separator orientation='vertical' className='h-6' />

              <div className='flex items-center gap-1'>
                <Button
                  variant='outline' size='sm' disabled={batchLoading}
                  onClick={() => { setBatchDialog('type'); setBatchType(''); }}
                  className='gap-1.5 h-8'
                >
                  <FolderOpen className='h-3.5 w-3.5' />
                  分类
                </Button>
                <Button
                  variant='outline' size='sm' disabled={batchLoading}
                  onClick={() => { setBatchDialog('tags'); setBatchTags([]); setBatchTagMode('append'); }}
                  className='gap-1.5 h-8'
                >
                  <Tags className='h-3.5 w-3.5' />
                  标签
                </Button>
                <Button
                  variant='outline' size='sm' disabled={batchLoading}
                  onClick={() => { setBatchDialog('source'); setBatchSource(''); }}
                  className='gap-1.5 h-8'
                >
                  <Link2 className='h-3.5 w-3.5' />
                  来源
                </Button>

                <Separator orientation='vertical' className='h-6' />

                <Button
                  variant='destructive' size='sm' disabled={batchLoading}
                  onClick={batchDelete}
                  className='gap-1.5 h-8'
                >
                  {batchLoading ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Trash2 className='h-3.5 w-3.5' />}
                  删除
                </Button>
              </div>
            </>
          )}
        </div>
      )}

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
          <p className='text-sm mt-1'>点击右上角 &quot;添加披风&quot; 开始添加你的第一个披风</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
          {capes.map((cape) =>
            batchMode ? (
              <Selectable
                key={cape.id}
                selected={selectedIds.has(cape.id)}
                onToggle={() => toggleSelect(cape.id)}
              >
                <CapeCard
                  id={cape.id}
                  name={cape.name}
                  type={cape.type}
                  tags={cape.tags}
                  filePath={cape.filePath}
                  asLink={false}
                />
              </Selectable>
            ) : (
              <CapeCard
                key={cape.id}
                id={cape.id}
                name={cape.name}
                type={cape.type}
                tags={cape.tags}
                filePath={cape.filePath}
              />
            )
          )}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Dialog open={batchDialog === 'tags'} onOpenChange={(open) => !open && setBatchDialog(null)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>批量设置标签（{selectedIds.size} 项）</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex gap-2'>
              <Button
                variant={batchTagMode === 'append' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setBatchTagMode('append')}
              >
                追加
              </Button>
              <Button
                variant={batchTagMode === 'override' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setBatchTagMode('override')}
              >
                覆盖
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              {batchTagMode === 'append'
                ? '将标签追加到已有标签中（不重复）'
                : '替换所有已有标签'}
            </p>
            <TagInput value={batchTags} onChange={setBatchTags} />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setBatchDialog(null)}>取消</Button>
              <Button onClick={applyBatchTags} disabled={batchLoading}>
                {batchLoading && <Loader2 className='h-4 w-4 animate-spin mr-2' />}
                应用
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchDialog === 'type'} onOpenChange={(open) => !open && setBatchDialog(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>批量设置分类（{selectedIds.size} 项）</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <Input
              value={batchType}
              onChange={(e) => setBatchType(e.target.value)}
              placeholder='分类名称（留空则清除分类）'
              autoFocus
            />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setBatchDialog(null)}>取消</Button>
              <Button onClick={applyBatchType} disabled={batchLoading}>
                {batchLoading && <Loader2 className='h-4 w-4 animate-spin mr-2' />}
                应用
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchDialog === 'source'} onOpenChange={(open) => !open && setBatchDialog(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>批量设置来源（{selectedIds.size} 项）</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <Input
              value={batchSource}
              onChange={(e) => setBatchSource(e.target.value)}
              placeholder='来源 URL（留空则清除来源）'
              autoFocus
            />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setBatchDialog(null)}>取消</Button>
              <Button onClick={applyBatchSource} disabled={batchLoading}>
                {batchLoading && <Loader2 className='h-4 w-4 animate-spin mr-2' />}
                应用
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
