export default async function ytdlr(id: string, lang = "en-US") {
  const apiKey = await findInnertubeApiKey();

  const host = "https://www.youtube.com";
  const path = `/youtubei/v1/player?key=${apiKey}`;
  const langParts = lang.split("-");

  const response = await fetch(host + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: {
        client: {
          hl: langParts[0],
          gl: langParts[1],
          clientName: "3",
          clientVersion: "16.50",
          clientScreen: "EMBED",
        },
        thirdParty: { embedUrl: host },
      },
      videoId: id,
    }),
  });

  const body = (await response.json()) as YoutubeResponse;

  if (body.playabilityStatus.status !== "OK")
    throw Error(body.playabilityStatus.reason);

  return {
    details: body.videoDetails,
    formats: [
      ...(body.streamingData.formats || []),
      ...(body.streamingData.adaptiveFormats || []),
    ],
  };
}

const findInnertubeApiKey = async () => {
  return new Promise<string>((resolve) => {
    const handleEvent = (e: any) => {
      if (e.data.ytApiKey) {
        window.removeEventListener("message", handleEvent);
        resolve(e.data.ytApiKey);
      }
    };
    window.addEventListener("message", handleEvent);

    document.documentElement.setAttribute(
      "onreset",
      `window.postMessage({ ytApiKey: window.yt.config_.INNERTUBE_API_KEY }, '*')`
    );
    document.documentElement.dispatchEvent(new CustomEvent("reset"));
    document.documentElement.removeAttribute("onreset");
  });
};

interface YoutubeResponse {
  streamingData: StreamingData;
  videoDetails: VideoDetails;
  playabilityStatus: PlayabilityStatus;
}

interface VideoDetails {
  videoId: string;
  title: string;
  lengthSeconds: string;
  keywords: string[];
  channelId: string;
  isOwnerViewing: boolean;
  shortDescription: string;
  isCrawlable: boolean;
  thumbnail: Thumbnail2;
  allowRatings: boolean;
  viewCount: string;
  author: string;
  isPrivate: boolean;
  isUnpluggedCorpus: boolean;
  isLiveContent: boolean;
}

interface Thumbnail2 {
  thumbnails: Thumbnail[];
}

interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

interface StreamingData {
  formats: Format[];
  adaptiveFormats: AdaptiveFormat[];
}

interface AdaptiveFormat {
  itag: number;
  url: string;
  mimeType: string;
  bitrate: number;
  width?: number;
  height?: number;
  initRange: InitRange;
  indexRange: InitRange;
  lastModified: string;
  contentLength: string;
  quality: string;
  fps?: number;
  qualityLabel?: string;
  projectionType: string;
  averageBitrate: number;
  approxDurationMs: string;
  colorInfo?: ColorInfo;
  highReplication?: boolean;
  audioQuality?: string;
  audioSampleRate?: string;
  audioChannels?: number;
}

interface ColorInfo {
  primaries: string;
  transferCharacteristics: string;
  matrixCoefficients: string;
}

interface InitRange {
  start: string;
  end: string;
}

interface Format {
  itag: number;
  url: string;
  mimeType: string;
  bitrate: number;
  width: number;
  height: number;
  lastModified: string;
  contentLength?: string;
  quality: string;
  fps: number;
  qualityLabel: string;
  projectionType: string;
  averageBitrate?: number;
  audioQuality: string;
  approxDurationMs: string;
  audioSampleRate: string;
  audioChannels: number;
}

interface PlayabilityStatus {
  status: string;
  reason: string;
}
