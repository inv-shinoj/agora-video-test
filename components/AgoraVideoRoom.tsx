'use client';

import { useRef, useEffect, useMemo } from 'react';
import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteAudioTracks,
  useRemoteUsers,
  useRemoteVideoTracks,
} from 'agora-rtc-react';
import { useVideoPiP } from '@/hooks/useVideoPiP';

function getAgoraToken() {
  const token = process.env.NEXT_PUBLIC_AGORA_TEMP_TOKEN?.trim();
  return token && token !== 'null' ? token : null;
}

interface VideoRoomProps {
  appId: string;
  channelName: string;
  onLeave: () => void;
}

export default function AgoraVideoRoom({ appId, channelName, onLeave }: VideoRoomProps) {
  const client = useMemo(
    () => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }),
    [],
  );

  return (
    <AgoraRTCProvider client={client}>
      <ActiveCallInterface appId={appId} channelName={channelName} onLeave={onLeave} />
    </AgoraRTCProvider>
  );
}

function ActiveCallInterface({ appId, channelName, onLeave }: VideoRoomProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const uid = useMemo(
    () => Math.floor(Math.random() * 900_000) + 100_000,
    [],
  );

  const joinOptions = useMemo(
    () => ({
      appid: appId,
      channel: channelName,
      token: getAgoraToken(),
      uid,
    }),
    [appId, channelName, uid],
  );

  const { isConnected, error: joinError } = useJoin(joinOptions, true);

  const remoteUsers = useRemoteUsers();
  const { videoTracks: remoteVideoTracks, error: subscribeError } =
    useRemoteVideoTracks(remoteUsers);
  const { audioTracks: remoteAudioTracks } = useRemoteAudioTracks(remoteUsers);

  const activeRemoteVideoTrack = remoteVideoTracks[0] ?? null;
  const hasRemoteStream = Boolean(activeRemoteVideoTrack);

  const { togglePiP, isPiPActive, isVideoReady } = useVideoPiP(
    remoteVideoRef,
    hasRemoteStream,
  );

  const { localCameraTrack, error: cameraError } = useLocalCameraTrack(isConnected);
  const { localMicrophoneTrack, error: micError } = useLocalMicrophoneTrack(isConnected);

  const readyToPublish =
    isConnected && Boolean(localMicrophoneTrack || localCameraTrack);

  const { error: publishError } = usePublish(
    [localMicrophoneTrack, localCameraTrack],
    readyToPublish,
  );

  useEffect(() => {
    if (localCameraTrack && localVideoRef.current) {
      localCameraTrack.play(localVideoRef.current);
    }
  }, [localCameraTrack]);

  useEffect(() => {
    if (activeRemoteVideoTrack && remoteVideoRef.current) {
      activeRemoteVideoTrack.play(remoteVideoRef.current);
    }
  }, [activeRemoteVideoTrack]);

  useEffect(() => {
    remoteAudioTracks.forEach((track) => track.play());
  }, [remoteAudioTracks]);

  const pipButtonLabel = !isConnected
    ? 'Joining channel...'
    : joinError
      ? 'Connection failed'
      : !hasRemoteStream
        ? 'Waiting for participant...'
        : !isVideoReady
          ? 'Preparing video...'
          : isPiPActive
            ? 'Exit Picture-in-Picture'
            : 'Float Video (PiP)';

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-neutral-900 text-white p-6">
      <header className="w-full max-w-5xl flex flex-col gap-3 py-4 border-b border-neutral-800">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold tracking-wide">
            Room: <span className="text-blue-400 font-mono">{channelName}</span>
          </h1>
          <button
            onClick={onLeave}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
          >
            Disconnect Call
          </button>
        </div>

        {joinError && (
          <p className="text-sm text-red-300 bg-red-950/50 border border-red-800 rounded-lg px-4 py-2">
            Could not join the channel: {joinError.message}.{' '}
            {getAgoraToken()
              ? 'Your Agora token may be expired or does not match this room. Generate a new token or remove NEXT_PUBLIC_AGORA_TEMP_TOKEN if App Certificate is disabled.'
              : 'Check NEXT_PUBLIC_AGORA_APP_ID and your network connection.'}
          </p>
        )}

        {isConnected && !joinError && (
          <p className="text-sm text-emerald-200 bg-emerald-950/40 border border-emerald-800 rounded-lg px-4 py-2">
            Connected as UID {uid}. Remote participants in channel: {remoteUsers.length}.
            {remoteUsers.length > 0 && !hasRemoteStream
              ? ' Subscribing to their video...'
              : remoteUsers.length === 0
                ? ' Open the same room in Chrome and Firefox to test.'
                : ''}
          </p>
        )}

        {subscribeError && (
          <p className="text-sm text-red-300 bg-red-950/50 border border-red-800 rounded-lg px-4 py-2">
            Could not subscribe to remote media: {subscribeError.message}
          </p>
        )}

        {publishError && (
          <p className="text-sm text-red-300 bg-red-950/50 border border-red-800 rounded-lg px-4 py-2">
            Could not publish your media: {publishError.message}
          </p>
        )}

        {cameraError && (
          <p className="text-sm text-orange-200 bg-orange-950/40 border border-orange-800 rounded-lg px-4 py-2">
            Camera unavailable: {cameraError.message}. You can still receive remote video and use PiP.
            Close other tabs or apps using the camera, then refresh.
          </p>
        )}

        {micError && (
          <p className="text-sm text-orange-200 bg-orange-950/40 border border-orange-800 rounded-lg px-4 py-2">
            Microphone unavailable: {micError.message}.
          </p>
        )}
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl my-auto py-8">
        {/* Local Feed */}
        <div className="relative bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-xl aspect-video">
          <span className="absolute top-3 left-3 bg-neutral-900/70 backdrop-blur-md px-3 py-1 text-xs rounded-md z-10 border border-neutral-700">
            You (Local Preview)
          </span>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        </div>

        {/* Remote Feed */}
        <div className="relative bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-xl aspect-video flex items-center justify-center">
          <span className="absolute top-3 left-3 bg-neutral-900/70 backdrop-blur-md px-3 py-1 text-xs rounded-md z-10 border border-neutral-700">
            Remote Participant
          </span>

          {!hasRemoteStream && (
            <p className="text-neutral-400 text-sm px-6 text-center">
              No remote participant yet
            </p>
          )}

          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />

          <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={togglePiP}
              disabled={!isVideoReady || Boolean(joinError)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-lg transition ${
                isVideoReady && !joinError
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 cursor-pointer'
                  : 'bg-neutral-700 text-neutral-400 cursor-not-allowed shadow-none'
              }`}
            >
              {pipButtonLabel}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
