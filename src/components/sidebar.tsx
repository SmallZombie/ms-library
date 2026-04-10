'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { User, Shirt, Menu, X, Users, Settings, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { href: '/skins', label: '皮肤', icon: User },
  { href: '/capes', label: '披风', icon: Shirt },
  { href: '/profiles', label: '角色', icon: Users },
];

const adminItems = [
  { href: '/admin/users', label: '用户管理', icon: Shield },
  { href: '/admin/settings', label: '站点设置', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === '/login' || pathname === '/register') return null;

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <>
      {/* Mobile header */}
      <div className='md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14'>
        <Link href='/' className='flex items-center gap-2 font-bold text-lg'>
          <Image
            src='/logo.png'
            alt='MSLibrary Logo'
            width={20}
            height={20}
            className='rounded-sm'
          />
          <span>MSLibrary</span>
        </Link>
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
          <Link href='/' className='flex items-center gap-2 font-bold text-lg tracking-tight'>
            <Image
              src='/logo.png'
              alt='MSLibrary Logo'
              width={20}
              height={20}
              className='rounded-sm'
            />
            <span>MSLibrary</span>
          </Link>
        </div>

        <nav className='flex-1 px-3 py-4 space-y-1 overflow-y-auto'>
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

          {user?.isAdmin && (
            <>
              <div className='pt-4 pb-1 px-3'>
                <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  管理
                </span>
              </div>
              {adminItems.map((item) => {
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
            </>
          )}
        </nav>

        <div className='px-3 pb-4 space-y-2'>
          {user && (
            <div className='flex items-center justify-between px-1 pt-2 border-t'>
              <Link
                href='/settings'
                onClick={() => setMobileOpen(false)}
                className='text-sm text-muted-foreground truncate hover:text-foreground transition-colors'
                title='账户设置'
              >
                {user.username}
              </Link>
              <div className='flex items-center gap-0.5'>
                <Link href='/settings' onClick={() => setMobileOpen(false)}>
                  <Button variant='ghost' size='icon' title='账户设置'>
                    <Settings className='h-4 w-4' />
                  </Button>
                </Link>
                <Button variant='ghost' size='icon' onClick={handleLogout} title='退出登录'>
                  <LogOut className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
