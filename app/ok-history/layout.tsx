import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OK History — Daily Oklahoma Trivia',
  description: 'A daily 5-question Oklahoma history & geography guessing game. Tap the map, score points by distance.',
};

export default function OKHistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
