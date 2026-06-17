import { PlayerApp } from "@vbonline/player";
import { LibraryHero } from "./components/LibraryHero";
import { MainHeader } from "./components/MainHeader";

export function App() {
  return (
    <PlayerApp
      renderHeader={(props) => <MainHeader {...props} />}
      renderHero={(props) => <LibraryHero {...props} />}
    />
  );
}
