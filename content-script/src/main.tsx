import "./main.css";
import { render } from "solid-js/web";
import YoutubeSlicer from "./YoutubeSlicer";
import lodash, { debounce } from "lodash";
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
    const { bottom } = getOffset(videoTag);
    appContainer.setAttribute("style", `top: ${bottom}px`);
  };

  placeApp();

  window.addEventListener("resize", placeApp);

  render(() => <App />, appContainer);
}, 50);

2;

function getOffset(el: HTMLElement) {
  var position = el.getBoundingClientRect();
  return {
    left: position.left + window.scrollX,
    top: position.top + window.scrollY,
    right: position.right + window.scrollX,
    bottom: position.bottom + window.scrollY,
  };
}
