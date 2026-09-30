'use client';
import dynamic from 'next/dynamic';

// Mount completely safely outside Node server contexts
const VideoCallManager = dynamic(
  () => import('@/components/VideoCallManager'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="bg-neutral-950 selection:bg-blue-500/30">
      <VideoCallManager />
    </main>
  );
}
