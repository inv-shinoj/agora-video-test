'use client';

import { useCallback, useState, useEffect } from 'react';

function isVideoElementReady(video: HTMLVideoElement) {
  return video.readyState >= 1 && video.videoWidth > 0;
}

export function useVideoPiP(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  streamActive = false,
) {
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncReadyState = () => {
      setIsVideoReady(isVideoElementReady(video));
    };

    const handleEmptied = () => {
      setIsVideoReady(false);
      setIsPiPActive(false);
    };

    const handleLeavePiP = () => setIsPiPActive(false);

    const handleWebkitPresentationModeChanged = () => {
      const webkitVideo = video as HTMLVideoElement & {
        webkitPresentationMode?: string;
      };
      setIsPiPActive(webkitVideo.webkitPresentationMode === 'picture-in-picture');
    };

    syncReadyState();

    video.addEventListener('loadedmetadata', syncReadyState);
    video.addEventListener('loadeddata', syncReadyState);
    video.addEventListener('playing', syncReadyState);
    video.addEventListener('resize', syncReadyState);
    video.addEventListener('emptied', handleEmptied);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);
    video.addEventListener(
      'webkitpresentationmodechanged',
      handleWebkitPresentationModeChanged,
    );

    return () => {
      video.removeEventListener('loadedmetadata', syncReadyState);
      video.removeEventListener('loadeddata', syncReadyState);
      video.removeEventListener('playing', syncReadyState);
      video.removeEventListener('resize', syncReadyState);
      video.removeEventListener('emptied', handleEmptied);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
      video.removeEventListener(
        'webkitpresentationmodechanged',
        handleWebkitPresentationModeChanged,
      );
    };
  }, [videoRef, streamActive]);

  useEffect(() => {
    if (!streamActive) {
      setIsVideoReady(false);
      return;
    }

    const video = videoRef.current;
    if (video && isVideoElementReady(video)) {
      setIsVideoReady(true);
    }
  }, [streamActive, videoRef]);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 1) {
      console.warn("Cannot enter PiP: Video metadata hasn't loaded yet.");
      return;
    }

    try {
      if ('requestPictureInPicture' in video) {
        if (document.pictureInPictureElement === video) {
          await document.exitPictureInPicture();
          setIsPiPActive(false);
        } else {
          await video.requestPictureInPicture();
          setIsPiPActive(true);
        }
      } 
      else if ('webkitSetPresentationMode' in video) {
        const webkitVideo = video as any;
        if (webkitVideo.webkitPresentationMode === 'picture-in-picture') {
          webkitVideo.webkitSetPresentationMode('inline');
          setIsPiPActive(false);
        } else if (
          typeof webkitVideo.webkitSupportsPresentationMode === 'function' &&
          webkitVideo.webkitSupportsPresentationMode('picture-in-picture')
        ) {
          webkitVideo.webkitSetPresentationMode('picture-in-picture');
          setIsPiPActive(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle PiP mode:', error);
    }
  }, [videoRef]);

  return { togglePiP, isPiPActive, isVideoReady };
}
