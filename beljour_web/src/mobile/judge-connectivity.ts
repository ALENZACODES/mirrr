/** Mobile offline notice for Judge Mode: no provider availability claims. */
export interface JudgeConnectivityHost {
  readonly navigator?: { readonly onLine?: boolean };
  addEventListener(type: "online" | "offline", listener: EventListener): void;
  removeEventListener(type: "online" | "offline", listener: EventListener): void;
}

export interface JudgeConnectionState {
  readonly online: boolean | null;
  readonly message: string;
  readonly liveProviderAvailable: "not-checked";
  readonly localDemoAvailable: true;
}

export function judgeConnectionState(online: boolean | null): JudgeConnectionState {
  if (online === false) {
    return {
      online,
      message: "Offline: local illustration can still work; live provider tools need a connection.",
      liveProviderAvailable: "not-checked",
      localDemoAvailable: true,
    };
  }
  if (online === true) {
    return {
      online,
      message: "This walkthrough is local even while connected. Live provider access is not tested here.",
      liveProviderAvailable: "not-checked",
      localDemoAvailable: true,
    };
  }
  return {
    online,
    message: "Connection status unavailable. This walkthrough never sends an image.",
    liveProviderAvailable: "not-checked",
    localDemoAvailable: true,
  };
}

export function readJudgeOnline(host: JudgeConnectivityHost): boolean | null {
  const value = host.navigator?.onLine;
  return typeof value === "boolean" ? value : null;
}

export function observeJudgeConnection(
  browser: JudgeConnectivityHost,
  onChange: (state: JudgeConnectionState) => void,
): () => void {
  let removed = false;
  const emit = (): void => {
    if (!removed) onChange(judgeConnectionState(readJudgeOnline(browser)));
  };
  browser.addEventListener("online", emit);
  browser.addEventListener("offline", emit);
  emit();
  return () => {
    if (removed) return;
    removed = true;
    browser.removeEventListener("online", emit);
    browser.removeEventListener("offline", emit);
  };
}
