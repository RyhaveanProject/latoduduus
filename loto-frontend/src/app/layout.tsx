import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Loto Online — Premium Live Lotto',
  description: 'A premium, real-time online lotto experience with multi-currency deposits, live rooms and global play.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
        style={{
          ['--font-display' as string]: "'Playfair Display', serif",
          ['--font-sans' as string]: "'Inter', sans-serif",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
