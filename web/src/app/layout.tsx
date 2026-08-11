import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastContainer } from '@/components/toast/ToastContainer';
import { MockProvider } from '@/components/MockProvider';

// Inter is the design's body/heading typeface (digest §Palette & Typography).
// Loaded via next/font and exposed as the --font-inter CSS variable, which
// globals.css maps onto --font-sans (the Tailwind `font-sans` token).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TaskBoard',
  description:
    'A small team task board — create, assign, and track tasks across To do, In progress, and Done.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <ToastProvider>
          <AuthProvider>
            {/* A plain wrapper — each page/shell owns its own <main> landmark
                (the (app) shell's Board provides one), so this must not be a
                <main> or the page's main would nest inside it. */}
            <div className="min-h-screen">
              <MockProvider>{children}</MockProvider>
            </div>
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
