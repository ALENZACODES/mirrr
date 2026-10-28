// A production rebuild must remove old experiments from an earlier dist tree.
// Author: John Khan.
import { rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
