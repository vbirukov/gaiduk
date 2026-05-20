import { useCallback, useEffect, useState } from "react";
import {
  readServerMediaTestStored,
  setRuntimeServerMediaTest,
  writeServerMediaTestStored,
} from "../lib/serverMediaTest";

export function useServerMediaTest() {
  const [enabled, setEnabled] = useState(() => {
    const on = readServerMediaTestStored();
    setRuntimeServerMediaTest(on);
    return on;
  });

  useEffect(() => {
    setRuntimeServerMediaTest(enabled);
    writeServerMediaTestStored(enabled);
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  return { serverMediaTest: enabled, setServerMediaTest: setEnabled, toggle };
}
