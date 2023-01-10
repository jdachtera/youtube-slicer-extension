/// <reference types="chrome" />

import {
  createEffect,
  createResource,
  createSignal,
  Index,
  onCleanup,
  onMount,
} from "solid-js";
import { PlayHead, Region, Regions, Waveform } from "solid-waveform";

import JSZip from "jszip";
import FileSaver from "file-saver";
// @ts-ignore
import "./App.css";
import { encodeWav } from "./encodeWav";
import fetchVideoData from "./fetchVideoData";
import {
  Button,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@suid/material";
import Delete from "@suid/icons-material/Delete";
import Download from "@suid/icons-material/Download";
import PlayArrow from "@suid/icons-material/playArrow";

const loadVideoData = async (videoId: string) => {
  const videoData = await fetchVideoData(videoId);
  return videoData;
};

function YoutubeSlicer() {
  let audioSource: AudioBufferSourceNode | undefined;
  let audioSourcePlayStart = 0;

  const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

  const [videoId, setVideoId] = createSignal(
    new URL(location.href).searchParams.get("v")!
  );

  onMount(() => {
    setInterval(() => {
      const newVideoId = new URL(location.href).searchParams.get("v")!;
      if (videoId() !== newVideoId) {
        setRegions([]);
        setVideoId(newVideoId);
      }
    }, 50);
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
      return a.bitrate > b.bitrate ? 1 : b.bitrate > a.bitrate ? -1 : 0;
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

  const [playHeadPosition, setPlayHeadPosition] = createSignal(0);
  const [syncPlayHead, setSyncPlayHead] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(false);

  let ignorePlayEvent = false;

  const play = (start: number = 0, duration?: number) => {
    ignorePlayEvent = true;
    videoTag.currentTime = start;
    playVid();
    videoTag.volume = 0;

    audioSourcePlayStart = audioCtx.currentTime - start;
    audioSource?.removeEventListener("ended", stop);

    audioSource?.stop();
    audioSource?.addEventListener("ended", (event) => {
      (event.currentTarget as AudioBufferSourceNode)?.disconnect();
    });

    audioSource = new AudioBufferSourceNode(audioCtx, {
      buffer: audioBuffer(),
    });
    audioSource.connect(audioCtx.destination);
    audioSource.start(0, start, duration);
    audioSource.addEventListener("ended", stop);

    setIsPlaying(true);
  };

  const stop = () => {
    ignorePlayEvent = false;
    audioSource?.stop();
    setIsPlaying(false);
    pauseVid();
    setPlayHeadPosition(audioCtx.currentTime - audioSourcePlayStart);
  };

  const playRegion = (region: Region) =>
    play(region.start, region.end - region.start);

  const handleKeyDown = (event: KeyboardEvent) => {
    const index = keys.indexOf(event.key);

    const region = regions()[index];
    if (region) {
      playRegion(region);
    }
  };

  // Initializing values
  let videoIsPlaying = true;
  onMount(() => {
    // On video playing toggle values
    videoTag.onplaying = function () {
      videoIsPlaying = true;
    };

    // On video pause toggle values
    videoTag.onpause = function () {
      videoIsPlaying = false;
    };
  });

  // Play video function
  async function playVid() {
    if (videoTag.paused && !isPlaying) {
      return videoTag.play();
    }
  }

  // Pause video function
  function pauseVid() {
    if (!videoTag.paused && videoIsPlaying) {
      videoTag.pause();
    }
  }

  let animationFrame: number;

  createEffect(() => {
    if (isPlaying()) {
      const updatePlayHead = () => {
        animationFrame = requestAnimationFrame(updatePlayHead);

        setPlayHeadPosition(audioCtx.currentTime - audioSourcePlayStart);
      };
      updatePlayHead();
    } else {
      cancelAnimationFrame(animationFrame);
    }
  });

  createEffect(() => {
    if (isPlaying()) return;

    videoTag.currentTime = playHeadPosition();
  });

  onMount(() => {
    videoTag.addEventListener("play", () => {
      if (ignorePlayEvent) return;
      play(videoTag.currentTime);
    });
    videoTag.addEventListener("pause", () => {
      stop();
    });
    videoTag.addEventListener("seeking", () => {
      setPlayHeadPosition(videoTag.currentTime);
    });
    videoTag.addEventListener("seeked", () => {
      setPlayHeadPosition(videoTag.currentTime);
    });
  });

  onMount(() => {
    mutationObserver.observe(videoTag, {
      attributeFilter: ["src"],
    });

    window.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    mutationObserver.disconnect();
    window.removeEventListener("keydown", handleKeyDown);
  });

  const [position, setPosition] = createSignal(0);
  const [zoom, setZoom] = createSignal(1);
  const [scale, setScale] = createSignal(1);
  const [logScale, setLogScale] = createSignal(false);
  const [regions, setRegions] = createSignal<Region[]>([]);

  const encodeRegionWavefile = async (region: Region) => {
    const buffer = audioBuffer();
    if (!buffer || !regions().length) return;

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

    const waveFile = await encodeWav(slicedAudioBuffer);
    return waveFile;
  };

  const downloadRegions = async () => {
    const buffer = audioBuffer();
    if (!buffer || !regions().length) return;

    const { author, title, videoId } = videoData()?.details ?? {};
    const zip = new JSZip();

    await Promise.all(
      regions().map(async (region, index) => {
        const waveFile = await encodeRegionWavefile(region);
        if (waveFile) {
          zip.file(
            `${author}-${title}(${videoId}) [${region.start}-${region.end}].wav`,
            waveFile
          );
        }
      })
    );

    zip.generateAsync({ type: "blob" }).then(function (content) {
      FileSaver.saveAs(content, `${author}-${title}(${videoId}) regions.zip`);
    });
  };

  const downloadRegion = async (region: Region) => {
    const waveFile = await encodeRegionWavefile(region);
    const { author, title, videoId } = videoData()?.details ?? {};

    if (waveFile) {
      FileSaver.saveAs(
        waveFile,
        `${author}-${title}(${videoId}) [${region.start}-${region.end}].wav`
      );
    }
  };

  const deleteRegion = (region: Region) => {
    const index = regions().findIndex(({ id }) => id === region.id);

    setRegions([...regions().slice(0, index), ...regions().slice(index + 1)]);
  };

  return (
    <Grid container>
      <Grid item flex={1}>
        <Waveform
          style={{ height: "100px" }}
          buffer={audioBuffer()}
          position={position()}
          zoom={zoom()}
          scale={scale()}
          logScale={logScale()}
          onPositionChange={setPosition}
          onZoomChange={setZoom}
          onScaleChange={setScale}
          strokeStyle="#f1f1f1"
        >
          <Regions
            regions={regions()}
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
          />
          <PlayHead
            playHeadPosition={playHeadPosition()}
            onPlayHeadPositionChange={(newPlayheadPosition) => {
              setPlayHeadPosition(newPlayheadPosition);
              if (isPlaying()) {
                play(newPlayheadPosition);
                videoTag.currentTime = newPlayheadPosition;
              }
            }}
          />
        </Waveform>
      </Grid>
      <Grid
        item
        height="100px"
        width="10%"
        minWidth={"400px"}
        overflow={"auto"}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <Index each={regions()}>
              {(region, index) => (
                <TableRow sx={{ backgroundColor: region().color }}>
                  <TableCell>{keys[index]}</TableCell>
                  <TableCell>{region().start.toFixed(2)}</TableCell>
                  <TableCell>{region().end.toFixed(2)}</TableCell>

                  <TableCell>
                    {(region().end - region().start).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => deleteRegion(region())}>
                      <Delete />
                    </IconButton>
                    <IconButton onClick={() => downloadRegion(region())}>
                      <Download />
                    </IconButton>
                    <IconButton onClick={() => playRegion(region())}>
                      <PlayArrow />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
            </Index>
          </TableBody>
        </Table>
        <Button onClick={downloadRegions}>
          <Download /> Download all regions
        </Button>
      </Grid>
    </Grid>
  );
}

const keys = [
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p",
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
];

export default YoutubeSlicer;
