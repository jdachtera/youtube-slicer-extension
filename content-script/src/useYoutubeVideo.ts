import { Accessor, createResource } from "solid-js";
import * as Tone from "tone";
import fetchVideoData from "./fetchVideoData";

const useYoutubeVideo = (videoId: Accessor<string | undefined>) => {
  const [videoData, { refetch: refetchVideoData }] = createResource(
    videoId,
    loadVideoData
  );
  const [audioBuffer] = createResource(videoData, async (data) => {
    if (!data) return new Tone.ToneAudioBuffer().get();

    const sortedFormats = [...data.formats];
    sortedFormats.sort((a, b) => {
      return a.bitrate > b.bitrate ? 1 : b.bitrate > a.bitrate ? -1 : 0;
    });

    const tracks = sortedFormats.filter((format) => !format.fps);

    const { url } = tracks[0];

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    const audioBuffer = await Tone.context.decodeAudioData(buffer);
    return audioBuffer;
  });

  return { audioBuffer, videoData };
};
const loadVideoData = async (videoId?: string) => {
  if (!videoId) return null;
  const videoData = await fetchVideoData(videoId);
  return videoData;
};

export default useYoutubeVideo;
