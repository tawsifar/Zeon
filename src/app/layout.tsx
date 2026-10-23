import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Zeon — Unified Media Downloader & Client-Side AI Metadata Stripper',
  description:
    'Ultra-fast direct media downloader for YouTube, TikTok, Instagram, Facebook, and LinkedIn with client-side AI provenance metadata remover and private video link modifier.',
  icons: {
    icon: [
      { url: '/zeon-icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/zeon-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`light h-full antialiased ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="icon" href="/zeon-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/zeon-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('zeon_theme');
                if (saved === 'light' || saved === 'dark') {
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(saved);
                } else {
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="h-full min-h-screen overflow-hidden flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
