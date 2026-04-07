import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Sidebar } from '@/components/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minecraft Skin Library',
  description: 'Collect and organize Minecraft skins and capes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <body className='antialiased'>
        <ThemeProvider>
          <TooltipProvider>
            <Sidebar />
            <main className='md:ml-56 min-h-screen pt-14 md:pt-0'>
              {children}
            </main>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
