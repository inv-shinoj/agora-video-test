'use client';

import { useState } from 'react';
import AgoraVideoRoom from './AgoraVideoRoom';

export default function VideoCallManager() {
  const [inCall, setInCall] = useState(false);
  const [channelName, setChannelName] = useState('demo-room');
  
  // NOTE: Insert your actual Agora ID copied from the App Console
  const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  if (!AGORA_APP_ID) {
    throw new Error('NEXT_PUBLIC_AGORA_APP_ID is not set');
  }

  if (inCall) {
    return (
      <AgoraVideoRoom 
        appId={AGORA_APP_ID} 
        channelName={channelName.trim().toLowerCase()} 
        onLeave={() => setInCall(false)} 
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white px-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-center">Join Video Chat</h2>
        <p className="text-neutral-400 text-sm text-center mb-6">Enter a room name to connect instantly.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Room Identifier
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. testing-room"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-blue-500 text-white transition font-mono"
            />
          </div>

          <button
            onClick={() => setInCall(true)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl font-semibold tracking-wide shadow-lg shadow-emerald-950 transition"
          >
            Enter Call Channel
          </button>
        </div>
      </div>
    </div>
  );
}
