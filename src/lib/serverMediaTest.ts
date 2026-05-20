const STORAGE_KEY = "gayduk-server-media-test";

let runtimeEnabled = false;

export function readServerMediaTestStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeServerMediaTestStored(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* private mode */
  }
}

export function setRuntimeServerMediaTest(on: boolean): void {
  runtimeEnabled = on;
}

export function isRuntimeServerMediaTest(): boolean {
  return runtimeEnabled;
}
