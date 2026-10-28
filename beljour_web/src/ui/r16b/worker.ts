/** Dedicated local R16B CPU worker. Author: John Khan. */
import { renderJob } from "./render.js";
import type { Job } from "./session.js";
const scope = globalThis as unknown as {
    onmessage: ((e: MessageEvent<Job>) => void) | null;
    postMessage(v: unknown, t?: Transferable[]): void;
};
scope.onmessage = e => { try {
    const result = renderJob(e.data);
    scope.postMessage({ id: e.data.id, ok: true, result }, [result.pixels.buffer]);
}
catch (error) {
    scope.postMessage({ id: e.data?.id, ok: false, message: error instanceof Error ? error.message : "Local preview failed." });
} };

