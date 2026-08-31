import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Neon Syndicate',
  description: 'A full-stack mastery campaign',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
