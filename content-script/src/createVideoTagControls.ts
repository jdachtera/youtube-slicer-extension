import { onCleanup, onMount } from "solid-js";

const createVideoTagControls = (videoTag: HTMLVideoElement) => {
  let videoIsPlaying = false;
  const handleVideoPlaying = () => {
    videoIsPlaying = true;
  };
  const handleVideoPause = () => {
    videoIsPlaying = false;
  };

  onMount(() => {
    videoTag.addEventListener("playing", handleVideoPlaying);
    videoTag.addEventListener("pause", handleVideoPause);
  });
  onCleanup(() => {
    videoTag.removeEventListener("playing", handleVideoPlaying);
    videoTag.removeEventListener("pause", handleVideoPause);
  });

  function play() {
    if (videoTag.paused && !videoIsPlaying) {
      return videoTag.play();
    }
  }

  function pause() {
    if (!videoTag.paused && videoIsPlaying) {
      videoTag.pause();
    }
  }
  return { play, pause };
};

export default createVideoTagControls;
