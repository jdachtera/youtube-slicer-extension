import "./main.css";
import { render } from "solid-js/web";
import App from "./App";

const body = document.querySelector("body");
const appContainer = document.createElement("div");
appContainer.id = "slicer-app-container";

const ytdApp = document.querySelector("ytd-app");

body?.insertBefore(appContainer, ytdApp);

render(() => <App />, appContainer);

const interval = setInterval(() => {
  const videoTag = document.querySelector("video") as
    | HTMLVideoElement
    | undefined;

  if (!videoTag) return;

  videoTag.autoplay = false;
  videoTag.pause();

  clearInterval(interval);
}, 0);
