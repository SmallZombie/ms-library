import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Sidebar } from '@/components/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';
import './font.css';

export const metadata: Metadata = {
  title: 'Minecraft Skin Library',
  description: 'Collect and organize Minecraft skins and capes',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
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
          <AuthProvider>
            <TooltipProvider>
              <Sidebar />
              <main className='md:ml-56 h-dvh pt-14 md:pt-0'>
                {children}
              </main>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
