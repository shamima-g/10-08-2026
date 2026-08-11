import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastContainer } from '@/components/toast/ToastContainer';
import { MockProvider } from '@/components/MockProvider';

export const metadata: Metadata = {
  title: 'Next.js Application Template',
  description:
    'A template for building Next.js applications with external REST APIs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          <AuthProvider>
            <main className="min-h-screen">
              <MockProvider>{children}</MockProvider>
            </main>
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
