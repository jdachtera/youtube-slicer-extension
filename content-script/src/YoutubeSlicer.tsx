/// <reference types="chrome" />

import {
  createEffect,
  createResource,
  createSignal,
  Index,
  onCleanup,
  onMount,
  Show,
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
import { context, Player, ToneAudioBuffer, Gain } from "tone";
import useYoutubeVideoId from "./useYoutubeVideoId";
import useYoutubeVideoBuffer from "./useYoutubeVideo";
import createVideoTagControls from "./createVideoTagControls";

function YoutubeSlicer() {
  const videoId = useYoutubeVideoId();
  const { audioBuffer, videoData } = useYoutubeVideoBuffer(videoId);
  const player = new Player();
  player.toDestination();

  player.onstop = () => videoControls.pause();

  createEffect(() => {
    player.buffer = new ToneAudioBuffer();
    player.stop();
    setRegions(
      JSON.parse(localStorage.getItem(`regions-${videoId()}`) || "[]") ?? []
    );
  });

  createEffect(() => {
    localStorage.setItem(`regions-${videoId()}`, JSON.stringify(regions()));
  });

  createEffect(() => {
    player.buffer = new ToneAudioBuffer(audioBuffer());
  });

  const videoTag = document.querySelector("video") as HTMLVideoElement;
  const videoControls = createVideoTagControls(videoTag);

  // mute the video tag
  const gainNode = new Gain();
  gainNode.gain.value = 0;
  gainNode.toDestination();
  const sourceNode = context.createMediaElementSource(videoTag);
  sourceNode.connect(gainNode.input);

  const [playHeadPosition, setPlayHeadPosition] = createSignal(0);
  const [syncPlayHead, setSyncPlayHead] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(false);

  const play = (start: number = 0, duration?: number) => {
    videoTag.currentTime = start;
    videoControls.play();

    player.start(0, start, duration);

    setIsPlaying(true);
  };

  const stop = () => {
    player.stop();
    setIsPlaying(false);
    videoControls.pause();
    setPlayHeadPosition(player.toSeconds());
  };

  createEffect(() => {
    if (audioBuffer()) stop();
  });

  const playRegion = (region: Region) =>
    play(region.start, region.end - region.start);

  const handleKeyDown = (event: KeyboardEvent) => {
    const index = keys.indexOf(event.key);

    const region = regions()[index];
    if (region) {
      playRegion(region);
    }
  };

  let animationFrame: number;

  createEffect(() => {
    if (isPlaying()) {
      const updatePlayHead = () => {
        animationFrame = requestAnimationFrame(updatePlayHead);
        setPlayHeadPosition(player.toSeconds());
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

  const handleMidiMessage = (midiEvent: WebMidi.MIDIMessageEvent) => {
    let data: Uint8Array = midiEvent.data;
    if (data.length === 3) {
      // status is the first byte.
      let status = data[0];
      // command is the four most significant bits of the status byte.
      let command = status >>> 4;
      // channel 0-15 is the lower four bits.
      let channel = status & 0xf;

      // just look at note on and note off messages.
      if (command === 0x9 || command === 0x8) {
        // note number is the second byte.
        let note = data[1];
        // velocity is the thrid byte.
        let velocity = data[2];
        let isNoteOn = command === 0x9;

        if (isNoteOn) {
          const regionIndex = note - 36;
          const region = regions()[regionIndex];
          if (region) {
            playRegion(region);
          }
        }
      }
    }
  };

  onMount(async () => {
    videoTag.addEventListener("play", () => {
      if (player.state === "started") return;
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
    const midi = await window.navigator.requestMIDIAccess();

    midi.inputs.forEach((input) => {
      input.addEventListener("midimessage", handleMidiMessage);
    });

    midi.addEventListener("statechange", (event) => {
      midi.inputs.forEach((input) => {
        input.removeEventListener("midimessage", handleMidiMessage as any);
        input.addEventListener("midimessage", handleMidiMessage);
      });
    });
  });

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
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

    const slicedAudioBuffer = context.createBuffer(
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
    <Show when={audioBuffer()}>
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
    </Show>
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
