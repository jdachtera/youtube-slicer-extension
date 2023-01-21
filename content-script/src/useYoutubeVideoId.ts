import { createSignal, onMount, onCleanup } from "solid-js";

const useYoutubeVideoId = () => {
  const getVideoid = () => new URL(location.href).searchParams.get("v")!;
  const [videoId, setVideoId] = createSignal<string | undefined>(getVideoid());

  let interval: number | undefined;
  onMount(() => {
    setInterval(() => {
      const newVideoId = getVideoid();

      setVideoId(newVideoId);
    }, 50);
  });

  onCleanup(() => {
    clearInterval(interval);
  });

  return videoId;
};

export default useYoutubeVideoId;
