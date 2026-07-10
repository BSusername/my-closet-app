import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Geeokie — Daily Oklahoma Trivia',
  description: 'www.geeokie.ok — a daily 5-question Oklahoma history & geography guessing game. Tap the map, score points by distance.',
};

export default function OKHistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
