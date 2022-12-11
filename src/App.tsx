/// <reference types="chrome" />

import logo from "./logo.svg";
import "./App.css";

function getLogo() {
  if (window.chrome) {
    return window.chrome.runtime.getURL(logo.toString());
  }

  return logo;
}

function App() {
  return (
    <div class="App">
      <header class="App-header">
        <img src={`${getLogo()}`} class="App-logo" alt="logo" />
        <p>Hello, World!</p>
        <p>I'm a Chrome Extension Popup bla!</p>
      </header>
    </div>
  );
}

export default App;
