import { Suspense } from "solid-js";
import YoutubeSlicer from "./YoutubeSlicer";

const App = () => {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <YoutubeSlicer />
    </Suspense>
  );
};

export default App;
