/** Local, explicit downloads. Object URLs are short lived and never persisted.
 * Author: John Khan.
 */
export type DownloadFile = (name: string, type: string, bytes: Uint8Array) => void;
export const downloadFile: DownloadFile = (name, type, bytes) => {
  const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes)], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name;
  document.body.append(anchor);
  try { anchor.click(); } finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 0); }
};
