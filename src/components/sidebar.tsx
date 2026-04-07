'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { User, Flag, Plus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { href: '/skins', label: '皮肤', icon: User },
  { href: '/capes', label: '披风', icon: Flag },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentSection = pathname.startsWith('/capes') ? 'capes' : 'skins';

  return (
    <>
      {/* Mobile header */}
      <div className='md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14'>
        <Link href='/' className='font-bold text-lg'>MSLibrary</Link>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className='md:hidden fixed inset-0 z-40 bg-black/50'
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-56 border-r bg-background flex flex-col transition-transform duration-200',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex items-center justify-between px-4 h-14 border-b'>
          <Link href='/' className='font-bold text-lg tracking-tight'>
            MSLibrary
          </Link>
          <ThemeToggle />
        </div>

        <nav className='flex-1 px-3 py-4 space-y-1'>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className='h-4 w-4' />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className='px-3 pb-4'>
          <Link
            href={`/${currentSection}/add`}
            onClick={() => setMobileOpen(false)}
          >
            <Button className='w-full gap-2' size='sm'>
              <Plus className='h-4 w-4' />
              添加{currentSection === 'skins' ? '皮肤' : '披风'}
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}
