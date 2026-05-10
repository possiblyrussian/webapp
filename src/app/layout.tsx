import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Recipe Tracker',
  description: 'Save and organize your favorite recipes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-amber-50 min-h-screen`}>
        <header className="bg-white border-b border-amber-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
            <span className="text-3xl">🍳</span>
            <div>
              <h1 className="text-xl font-bold text-amber-900">Recipe Tracker</h1>
              <p className="text-xs text-amber-600">Paste a URL. We'll handle the rest.</p>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
