import { PlayerApp } from "@vbirukov/player";
import { LibraryHero } from "./components/LibraryHero";
import { MainHeader } from "./components/MainHeader";
import { StyleToggle } from "./components/StyleToggle";

export function App() {
  return (
    <>
      <PlayerApp
        renderHeader={(props) => <MainHeader {...props} />}
        renderHero={(props) => <LibraryHero {...props} />}
      />
      <StyleToggle />
    </>
  );
}
