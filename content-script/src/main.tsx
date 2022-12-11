import "./main.css";
import { render } from "solid-js/web";
import YoutubeSlicer from "./YoutubeSlicer";
import lodash from "lodash";
import App from "./App";

const body = document.querySelector("body");
const appContainer = document.createElement("div");
appContainer.id = "slicer-app-container";

const interval = setInterval(() => {
  const columnsDiv = document.getElementById("columns");

  const videoTag = document.querySelector("video") as
    | HTMLVideoElement
    | undefined;
  if (!videoTag || !columnsDiv) return;

  clearInterval(interval);

  videoTag.autoplay = false;
  videoTag.pause();

  body?.appendChild(appContainer);

  const placeApp = () => {
    const { top } = columnsDiv.getBoundingClientRect();
    appContainer.setAttribute("style", `top: ${top - 300}px`);
  };

  placeApp();

  window.addEventListener("resize", placeApp);

  render(() => <App />, appContainer);
}, 50);
