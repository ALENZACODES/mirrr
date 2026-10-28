# Browser check for the reel colour pass

`gltest.html` renders a flat colour through the WebGL shader in `src/reel/gl.ts`, compares it with the CPU version in `src/reel/colour.ts`, and draws the three region masks from a made up face. It needs a real browser, so it isn't part of `npm test`.

```bash
npm run build
cp test/browser/gltest.html dist/
npm run serve &                       # http://localhost:8080
node test/browser/run-gltest.mjs      # needs Playwright with Chromium installed
```

Expect `gpuLeft` to equal `cpu`, `gpuRight` to be unchanged (180,140,120), skin 1 on the forehead, lips about 1 on the lip and near 0 in the mouth opening, and 0 outside the face.
