/// <reference types="chrome" />

import {
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { Region, Waveform } from "solid-waveform";

import JSZip from "jszip";
import FileSaver from "file-saver";
// @ts-ignore
import "./App.css";
import { encodeWav } from "./encodeWav";
import ytdlr from "./ytdlr";

const loadVideoData = async (videoId: string) => {
  console.log({ videoId });
  const videoData = await ytdlr(videoId);

  return videoData;
};

function App() {
  const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

  const [videoId, setVideoId] = createSignal(
    new URL(location.href).searchParams.get("v")!
  );

  onMount(() => {
    setInterval(() => {
      setVideoId(new URL(location.href).searchParams.get("v")!);
    }, 50);
  });

  createEffect(() => {
    console.log(videoId());
  });
  const videoTag = document.querySelector("video") as HTMLVideoElement;
  const [videoData, { refetch: refetchVideoData }] = createResource(
    videoId,
    loadVideoData
  );
  const [audioBuffer] = createResource(videoData, async (data) => {
    if (!data) return;

    const sortedFormats = [...data.formats];
    sortedFormats.sort((a, b) => {
      return a.bitrate > b.bitrate ? -1 : b.bitrate > a.bitrate ? 1 : 0;
    });

    const tracks = sortedFormats.filter((format) => !format.fps);

    const { url } = tracks[0];

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    const context = new AudioContext();
    const audioBuffer = await context.decodeAudioData(buffer);
    return audioBuffer;
  });

  const mutationObserver = new MutationObserver(refetchVideoData);

  onMount(() => {
    mutationObserver.observe(videoTag, {
      attributeFilter: ["src"],
    });
  });

  onCleanup(() => {
    mutationObserver.disconnect();
  });

  const [position, setPosition] = createSignal(0);
  const [zoom, setZoom] = createSignal(1);
  const [scale, setScale] = createSignal(1);
  const [logScale, setLogScale] = createSignal(false);
  const [regions, setRegions] = createSignal<Region[]>([]);

  const playRegion = (region: Region) => {
    videoTag.currentTime = region.start;
    videoTag.play();
  };

  const downloadRegions = async () => {
    const buffer = audioBuffer();
    if (!buffer || !regions().length) return;
    console.log("downloadRegions");

    const { author, title, videoId } = videoData()?.details ?? {};
    const zip = new JSZip();

    await Promise.all(
      regions().map(async (region, index) => {
        var startOffset = buffer.sampleRate * region.start;
        var endOffset = buffer.sampleRate * region.end;
        var frameCount = endOffset - startOffset;

        const slicedAudioBuffer = audioCtx.createBuffer(
          buffer.numberOfChannels,
          endOffset - startOffset,
          buffer.sampleRate
        );

        const copyArray = new Float32Array(frameCount);
        const offset = 0;

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          buffer.copyFromChannel(copyArray, channel, startOffset);
          slicedAudioBuffer.copyToChannel(copyArray, channel, offset);
        }

        zip.file(
          `${author}-${title}(${videoId}) [${region.start}-${region.end}].wav`,
          await encodeWav(slicedAudioBuffer)
        );
      })
    );

    zip.generateAsync({ type: "blob" }).then(function (content) {
      FileSaver.saveAs(content, `${author}-${title}(${videoId}) regions.zip`);
    });
  };

  return (
    <div class="App" hidden={!videoId()}>
      <Waveform
        style={{ height: "250px" }}
        buffer={audioBuffer()}
        position={position()}
        regions={regions()}
        zoom={zoom()}
        scale={scale()}
        logScale={logScale()}
        onPositionChange={setPosition}
        onZoomChange={setZoom}
        onScaleChange={setScale}
        onUpdateRegion={(region) => {
          const index = regions().findIndex(({ id }) => id === region.id);
          setRegions([
            ...regions().slice(0, index),
            region,
            ...regions().slice(index + 1),
          ]);
        }}
        onCreateRegion={(region) => {
          setRegions([...regions(), region]);
        }}
        onClickRegion={playRegion}
        strokeStyle="#fff"
      />
      <div>
        <button onClick={downloadRegions}>Download regions</button>
      </div>
    </div>
  );
}

export default App;
