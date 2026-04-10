'use client';

import { type ReactNode } from 'react';
import { Check } from 'lucide-react';

interface SelectableProps {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}

export function Selectable({ selected, onToggle, children, className = '' }: SelectableProps) {
  return (
    <div
      className={`relative cursor-pointer rounded-xl transition-shadow ${selected ? 'ring-2 ring-primary' : ''} ${className}`}
      onClick={onToggle}
    >
      <button
        type='button'
        className={`absolute top-2 left-2 z-10 h-5 w-5 rounded border flex items-center justify-center transition-colors ${
          selected
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-background/80 border-muted-foreground/40 hover:border-primary'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {selected && <Check className='h-3 w-3' />}
      </button>
      {children}
    </div>
  );
}
