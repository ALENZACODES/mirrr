/** Module worker entry for the studio: pre-check, thumbnails and compare frames (worker-protocol.ts).
 * No network, no storage and no model download happen here. Author: John Khan.
 */
import type { Port } from "../../engines/core/jobs.js";
import { serveShell } from "./worker-protocol.js";

const scope = self as unknown as Port & { onmessage: ((event: { data: unknown }) => void) | null };
scope.onmessage = serveShell(scope);
