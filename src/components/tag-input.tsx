'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = '输入标签后按回车' }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = input.trim();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  return (
    <div className='flex flex-wrap gap-1.5 p-2 border rounded-md bg-background min-h-10 focus-within:ring-1 focus-within:ring-ring'>
      {value.map((tag) => (
        <Badge key={tag} variant='secondary' className='gap-1'>
          {tag}
          <X
            className='h-3 w-3 cursor-pointer'
            onClick={() => removeTag(tag)}
          />
        </Badge>
      ))}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className='flex-1 min-w-20 border-0 p-0 h-6 shadow-none focus-visible:ring-0'
      />
    </div>
  );
}
