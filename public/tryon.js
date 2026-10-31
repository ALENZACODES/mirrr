/**
 * MIRRR live try-on: makeup, lashes and wigs on her own face, through the camera or a photo,
 * entirely in this browser tab. Frames never leave the device: the face tracker runs here (its
 * files download once), and MIRRR's server never sees the camera or the photo.
 *
 * Nothing starts on its own: the camera starts only when she taps "Start camera", every control
 * opens on "Choose…", and leaving the view switches the camera off.
 */
import {
  LIPS_OUTER, LIPS_INNER, EYE, toPixels, bbox, smoothClosed, smoothOpen, eyeOpenness, headPose,
  lashLine, wingTip, lidPolygon, browPolygon, blushEllipse, wigAffine, wigMesh, WIG_RINGS, LandmarkSmoother, FACE_OVAL,
  hexToRgb, tintPixel, browPixel, maskedMeanL, lightnessDetail,
} from './tryon-geometry.js';
import { MODEL_FACES } from './model-faces.js';

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
// Hair/background segmenter, loaded only when she picks a wig, so her own hair can be hidden where the wig does not cover it.
const SEG_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

// Colour words the MIRRR guides use (the same swatches as the Colour & Lip Studio). Swatches, not product shades.
const LIP = [['Nude-pink', '#d9a3a0'], ['Dusty rose', '#c48b8b'], ['Mauve', '#b07a8c'], ['Caramel', '#b5733c'], ['Toffee', '#9a5b2e'], ['Mocha', '#7a4e36'], ['Terracotta', '#c0603d'], ['Coral', '#f07c5f'], ['Classic red', '#c0202a'], ['Blue-red', '#b0213f'], ['Brick red', '#9c3426'], ['Berry', '#8e2f5a'], ['Fuchsia', '#c8227a'], ['Plum', '#6e2f55'], ['Wine', '#62182f'], ['Oxblood', '#5a1a1f'], ['Chocolate', '#5a3020']];
const LIP_FINISH = [['creme', 'Creme'], ['gloss', 'Gloss'], ['matte', 'Matte']];
const LINER = [['#141414', 'Black kohl'], ['#3b2016', 'Dark chocolate'], ['#1d2a5b', 'Navy'], ['#1f4d2b', 'Forest green'], ['#6e2f55', 'Plum']];
const LINER_STYLE = [['tight', 'Upper lash line'], ['kohl', 'Kohl, upper and lower'], ['wing', 'Winged']];
const LASHES = [['natural', 'Natural'], ['wispy', 'Wispy'], ['dramatic', 'Dramatic']];
const BROW = [['#141414', 'Soft black'], ['#3b2016', 'Dark brown'], ['#6b4030', 'Warm brown'], ['#8d7b6d', 'Taupe']];
const BLUSH = [['#f4ae86', 'Peach'], ['#f07c5f', 'Coral'], ['#d9798a', 'Rose'], ['#8e2f5a', 'Berry'], ['#c0603d', 'Terracotta'], ['#a8432a', 'Brick']];
const SHADOW = [['#a8743a', 'Bronze'], ['#d9aa4c', 'Gold'], ['#b8693a', 'Copper'], ['#6e2f55', 'Plum'], ['#8d7b6d', 'Taupe'], ['#1f8a5b', 'Emerald']];
// Hair-only cutouts made from MIRRR's Wig Match portraits; the model's outer eye corners, forehead and chin in cutout pixels.
export const WIGS = [{"id":"blunt_lob","name":"Blunt Lob (Long Bob)","forehead":[217.9,126.5],"chin":[224.1,431.5],"right":[134.6,223.9],"left":[305.9,220.3],"oval":[[217.9,126.5],[251.8,126.7],[280.0,130.9],[305.0,139.9],[321.5,154.0],[332.3,173.2],[338.6,195.3],[341.8,223.0],[342.5,249.3],[341.8,276.8],[338.4,306.1],[331.7,337.5],[321.5,363.4],[308.8,382.6],[292.0,399.5],[278.0,411.0],[263.2,421.2],[246.1,428.9],[224.2,431.6],[202.3,429.8],[184.9,422.9],[169.5,413.4],[154.6,402.8],[136.4,386.8],[122.1,368.4],[109.8,343.3],[100.8,312.2],[95.1,283.0],[92.5,255.8],[91.5,229.7],[94.0,202.2],[99.9,179.4],[111.0,159.3],[128.3,143.8],[154.3,133.3],[183.3,128.1]]},{"id":"silk_press_natural","name":"Silk Press (Natural Hair)","forehead":[173.4,132.9],"chin":[196.3,390.7],"right":[119.7,218.0],"left":[263.8,210.0],"oval":[[173.4,132.9],[201.0,130.2],[228.4,130.1],[255.8,133.3],[279.0,142.5],[298.6,158.4],[312.0,177.9],[320.8,202.6],[324.3,226.4],[325.7,251.4],[323.8,278.0],[316.5,306.3],[303.1,330.0],[286.5,347.9],[266.3,363.3],[249.9,373.5],[232.9,382.3],[215.4,388.9],[196.3,390.7],[181.1,388.4],[171.1,381.7],[163.8,373.0],[157.0,363.5],[147.9,349.8],[141.1,333.8],[133.6,312.7],[125.8,287.3],[120.1,263.4],[117.3,240.8],[113.5,219.2],[108.8,196.4],[108.5,177.2],[112.2,160.8],[118.7,149.7],[130.2,141.9],[148.9,136.5]]},{"id":"bone_straight_long","name":"Bone Straight (Long)","forehead":[102.0,102.1],"chin":[164.4,279.1],"right":[87.9,172.0],"left":[177.8,138.0],"oval":[[102.0,102.1],[120.6,93.9],[140.4,87.4],[162.8,83.8],[183.1,85.9],[201.4,93.3],[215.9,104.4],[228.3,120.0],[236.3,136.1],[242.8,153.7],[247.4,173.5],[248.0,196.1],[242.2,216.2],[231.5,232.3],[217.1,246.9],[204.9,257.0],[192.0,266.2],[178.8,274.1],[164.5,279.1],[153.9,279.9],[147.1,277.0],[142.4,272.6],[138.1,267.4],[132.1,259.5],[127.3,249.2],[120.7,235.2],[112.2,218.5],[104.7,202.9],[98.8,187.8],[91.4,173.9],[82.1,160.1],[76.0,147.3],[73.2,134.8],[73.4,125.0],[77.7,116.8],[86.9,109.7]]},{"id":"curtain_bang_layers","name":"Curtain-Bang Silk Layers","forehead":[124.1,82.6],"chin":[176.5,240.9],"right":[111.3,146.4],"left":[189.6,117.3],"oval":[[124.1,82.6],[141.5,75.5],[159.8,70.3],[181.0,67.9],[199.6,70.5],[216.1,77.5],[228.3,87.4],[238.3,101.5],[244.0,116.4],[248.3,132.5],[250.8,150.4],[250.1,170.6],[244.2,188.3],[234.2,202.2],[221.5,214.8],[210.9,223.1],[199.8,230.5],[188.7,236.9],[176.5,240.8],[167.2,241.3],[161.3,238.7],[157.3,234.9],[153.8,230.6],[148.8,224.1],[145.1,215.4],[139.9,203.1],[133.1,188.0],[126.6,173.8],[121.4,160.1],[114.9,147.4],[106.4,135.0],[100.7,123.7],[98.0,112.4],[98.5,103.0],[102.8,95.1],[110.9,88.9]]},{"id":"loose_deep_wave","name":"Loose Deep Wave","forehead":[134.0,85.6],"chin":[180.8,235.1],"right":[121.1,143.2],"left":[194.4,118.6],"oval":[[134.0,85.6],[150.2,79.1],[167.2,74.5],[186.9,72.6],[203.7,75.6],[218.6,82.7],[229.9,92.5],[239.5,105.9],[245.5,119.6],[250.1,134.4],[253.0,151.0],[252.4,169.7],[246.8,186.3],[237.3,199.2],[224.9,210.8],[214.5,218.6],[203.7,225.6],[192.6,231.5],[180.8,235.0],[172.3,235.3],[166.8,232.8],[163.1,229.2],[160.0,225.1],[155.7,218.8],[152.7,210.5],[148.4,199.0],[142.3,184.8],[136.7,171.5],[132.0,158.7],[125.9,146.9],[117.9,135.3],[112.2,124.5],[109.3,113.8],[109.5,104.8],[113.6,97.3],[121.3,91.5]]},{"id":"water_wave","name":"Water Wave","forehead":[163.9,84.2],"chin":[208.5,234.2],"right":[150.9,142.8],"left":[223.8,117.0],"oval":[[163.9,84.2],[180.4,77.5],[197.9,72.7],[218.4,70.9],[236.2,74.1],[251.5,81.3],[262.8,90.9],[272.0,104.3],[277.2,118.1],[281.0,133.0],[283.3,149.5],[282.4,168.2],[276.5,184.7],[266.7,197.7],[254.1,209.3],[243.5,217.3],[232.3,224.5],[220.9,230.6],[208.6,234.3],[199.5,234.5],[193.8,231.8],[190.1,228.0],[187.0,223.8],[183.2,217.3],[180.9,208.8],[177.4,197.1],[172.0,183.0],[166.7,169.9],[162.3,157.4],[156.2,145.9],[148.2,134.5],[142.6,124.0],[139.6,113.4],[139.9,104.2],[143.9,96.3],[151.4,90.3]]},{"id":"highlighted_balayage","name":"Balayage / Highlighted","forehead":[227.6,68.6],"chin":[175.1,227.9],"right":[175.5,110.6],"left":[263.0,134.0],"oval":[[227.6,68.6],[246.2,73.0],[263.8,79.7],[281.2,90.6],[293.4,104.6],[301.4,121.0],[304.8,137.5],[304.5,156.0],[300.7,172.0],[295.2,187.5],[286.9,203.3],[274.8,218.9],[260.4,229.1],[245.5,233.8],[229.0,235.9],[215.9,235.9],[202.5,234.5],[188.9,232.2],[175.1,227.9],[164.9,223.2],[159.3,218.5],[155.8,214.3],[153.1,209.7],[151.4,202.9],[152.7,194.9],[155.5,182.4],[158.7,165.9],[161.7,150.3],[165.5,135.9],[168.5,121.2],[171.6,105.2],[175.6,91.6],[181.8,79.7],[189.8,71.4],[200.0,66.9],[212.0,66.3]]},{"id":"kinky_coily_afro","name":"Kinky Coily Afro","forehead":[221.0,246.4],"chin":[235.3,517.5],"right":[150.4,337.1],"left":[306.3,329.1],"oval":[[221.0,246.4],[253.5,245.5],[281.5,248.3],[307.8,256.5],[325.0,270.4],[336.3,289.0],[343.1,309.2],[347.1,333.7],[348.3,357.0],[348.5,381.1],[346.3,406.8],[340.6,434.1],[331.0,456.4],[318.9,472.6],[302.9,487.2],[289.3,497.5],[274.4,507.0],[257.0,514.6],[235.2,517.5],[214.6,515.7],[199.3,509.0],[186.6,500.3],[175.0,490.9],[161.2,477.7],[150.9,462.7],[141.7,441.8],[134.2,415.6],[129.5,390.9],[127.1,367.6],[124.6,344.9],[123.6,320.7],[125.7,300.1],[131.7,280.9],[143.6,265.8],[164.6,255.0],[189.7,249.2]]},{"id":"big_chop_fro","name":"Big Chop Fro","forehead":[202.4,139.5],"chin":[207.6,426.9],"right":[114.3,236.1],"left":[282.9,231.1],"oval":[[202.4,139.5],[235.2,140.1],[261.4,144.5],[283.1,154.5],[295.6,170.0],[302.0,190.3],[304.2,212.1],[303.0,238.2],[301.3,262.9],[300.0,288.1],[296.7,314.2],[290.2,342.1],[282.5,364.5],[274.0,380.5],[262.8,395.1],[253.2,405.7],[242.4,415.3],[228.0,423.1],[207.7,426.9],[184.3,426.7],[164.7,421.2],[147.0,413.2],[130.5,404.0],[110.7,390.3],[94.0,374.3],[79.4,351.8],[69.3,323.0],[63.6,295.7],[60.8,269.8],[59.3,244.6],[61.8,217.8],[68.5,195.2],[81.9,173.7],[102.6,156.8],[133.5,145.7],[166.0,140.7]]},{"id":"twist_out_natural","name":"Twist-Out Natural","forehead":[161.8,141.0],"chin":[215.0,386.4],"right":[122.5,233.5],"left":[255.9,204.3],"oval":[[161.8,141.0],[190.4,134.4],[218.0,131.5],[247.1,133.1],[270.1,141.5],[288.8,155.8],[301.9,172.8],[311.6,195.0],[316.7,216.8],[320.3,239.9],[321.2,264.9],[317.5,292.2],[308.4,315.9],[295.5,334.6],[278.8,351.6],[264.7,363.5],[249.7,374.0],[233.7,382.4],[215.1,386.4],[199.6,386.0],[188.7,380.6],[180.4,372.9],[172.8,364.4],[162.8,352.5],[154.9,338.8],[145.9,320.4],[135.9,298.0],[128.1,276.8],[122.9,256.4],[116.1,236.9],[108.2,216.4],[104.7,198.4],[105.1,181.1],[109.7,167.3],[120.8,156.2],[137.8,148.0]]},{"id":"butterfly_locs","name":"Butterfly Locs","forehead":[183.2,105.6],"chin":[193.6,345.4],"right":[131.0,188.9],"left":[262.7,179.2],"oval":[[183.2,105.6],[211.5,102.9],[239.0,103.5],[267.9,109.5],[289.4,121.6],[305.3,138.8],[315.0,157.6],[320.5,180.7],[322.0,202.5],[321.7,225.3],[318.7,249.4],[311.0,275.2],[298.0,296.6],[281.9,311.9],[262.6,324.6],[246.8,332.8],[230.0,339.6],[212.6,344.5],[193.6,345.4],[178.5,343.0],[169.1,337.2],[162.9,330.2],[157.4,322.8],[151.1,311.7],[147.7,298.3],[144.2,279.2],[139.6,256.0],[136.2,234.6],[134.9,214.4],[131.6,194.7],[126.4,173.9],[124.5,155.9],[126.4,138.7],[132.1,125.2],[143.5,115.2],[159.8,109.4]]},{"id":"faux_locs","name":"Faux Locs (Long)","forehead":[217.7,85.4],"chin":[224.4,298.8],"right":[166.5,159.9],"left":[286.3,152.5],"oval":[[217.7,85.4],[243.3,83.9],[266.6,85.6],[290.2,92.0],[307.1,103.5],[319.4,119.1],[326.7,135.9],[330.7,156.4],[331.2,175.5],[330.2,195.3],[326.8,216.1],[319.8,238.2],[309.3,256.1],[296.8,268.9],[281.7,279.9],[269.2,287.0],[255.7,293.1],[241.2,297.6],[224.4,298.8],[209.7,297.3],[199.6,292.6],[191.9,286.8],[185.1,280.4],[177.1,270.9],[171.9,259.6],[167.1,243.3],[161.9,222.8],[158.1,203.5],[156.2,185.3],[154.0,167.3],[152.2,147.8],[153.1,131.1],[156.8,115.2],[164.5,102.7],[178.0,93.5],[195.1,88.3]]},{"id":"sister_locs","name":"Sisterlocks / Micro Locs","forehead":[153.2,139.2],"chin":[233.8,355.0],"right":[135.2,225.2],"left":[248.8,186.0],"oval":[[153.2,139.2],[176.9,129.7],[201.3,122.6],[228.8,118.4],[254.0,120.9],[277.2,129.8],[295.2,143.2],[309.5,162.7],[318.0,182.7],[324.9,204.3],[329.3,228.0],[328.9,254.5],[321.6,278.4],[309.5,297.7],[293.6,315.6],[280.2,328.1],[265.9,339.6],[250.9,349.4],[233.8,355.0],[220.0,355.8],[210.5,351.6],[203.6,345.4],[197.1,338.4],[188.0,328.4],[180.7,315.6],[171.4,298.8],[160.1,278.9],[150.8,260.4],[143.6,242.4],[133.9,226.1],[122.1,209.5],[115.1,194.2],[112.0,179.2],[113.0,167.4],[119.8,157.4],[133.1,148.4]]},{"id":"senegalese_twists","name":"Senegalese Twists","forehead":[199.1,95.5],"chin":[206.5,341.1],"right":[141.0,178.0],"left":[277.7,174.2],"oval":[[199.1,95.5],[228.3,94.3],[255.1,96.5],[282.2,103.7],[301.8,116.5],[316.2,134.2],[324.9,153.5],[329.8,177.0],[331.0,199.0],[330.7,221.8],[327.3,246.0],[319.0,271.7],[306.2,292.8],[291.0,308.0],[272.6,320.7],[257.7,328.8],[242.0,335.5],[225.3,340.3],[206.5,341.1],[190.9,338.5],[180.4,332.4],[172.7,324.8],[165.9,316.5],[157.3,304.5],[151.5,290.4],[145.8,271.0],[139.8,247.1],[135.7,225.1],[134.0,204.5],[131.4,184.3],[128.3,162.6],[128.4,143.9],[132.3,126.4],[140.2,113.0],[154.5,103.4],[173.5,98.2]]},{"id":"passion_twists","name":"Passion Twists","forehead":[152.1,99.6],"chin":[203.4,251.2],"right":[140.4,159.8],"left":[214.9,131.0],"oval":[[152.1,99.6],[168.5,92.5],[185.9,87.3],[205.7,84.5],[223.6,86.6],[240.0,92.8],[252.7,102.0],[263.1,115.2],[269.0,129.4],[273.2,145.0],[275.6,162.6],[274.7,182.4],[268.9,199.6],[259.7,213.1],[247.8,225.3],[237.7,233.6],[226.9,241.0],[215.7,247.3],[203.4,251.2],[194.0,251.6],[187.9,248.9],[183.7,244.9],[179.8,240.4],[174.6,233.7],[170.8,225.1],[165.8,213.4],[159.3,199.2],[153.6,185.9],[149.1,173.0],[142.9,161.2],[135.0,149.6],[129.9,138.8],[127.6,128.1],[127.9,119.3],[131.8,112.0],[139.4,105.9]]},{"id":"jumbo_box_braids","name":"Jumbo Box Braids","forehead":[167.0,119.6],"chin":[229.8,324.9],"right":[148.5,199.7],"left":[248.8,162.6],"oval":[[167.0,119.6],[189.2,110.5],[212.6,104.2],[239.9,101.9],[263.8,106.4],[284.7,116.4],[300.3,129.6],[313.3,147.8],[321.0,166.7],[326.7,186.9],[329.9,209.7],[328.5,235.4],[320.2,257.7],[307.0,274.9],[290.5,290.5],[276.6,301.3],[261.9,311.0],[246.6,319.5],[229.8,324.9],[217.2,325.6],[209.2,322.3],[204.1,317.4],[199.6,311.9],[193.8,303.7],[189.7,293.0],[183.7,277.8],[175.2,258.8],[167.6,240.9],[161.7,223.6],[154.2,207.2],[144.7,190.6],[138.0,175.5],[134.4,160.5],[134.6,147.5],[139.8,136.5],[150.0,128.1]]},{"id":"fulani_braids","name":"Fulani Braids","forehead":[121.4,125.8],"chin":[195.0,330.0],"right":[102.4,205.9],"left":[211.0,167.8],"oval":[[121.4,125.8],[143.6,116.5],[166.8,109.2],[192.5,104.7],[216.5,106.7],[238.7,114.8],[256.0,127.4],[270.0,145.7],[278.3,164.8],[284.8,185.5],[289.1,208.6],[288.7,234.5],[281.5,257.5],[269.6,276.1],[253.8,293.1],[240.5,305.0],[226.3,315.7],[211.5,324.6],[195.0,330.0],[182.1,330.8],[173.5,327.2],[167.2,321.7],[161.2,315.3],[153.1,306.1],[146.6,294.1],[138.0,278.0],[127.3,258.9],[118.3,241.0],[111.3,223.8],[102.4,207.9],[91.6,191.9],[85.2,177.0],[82.8,162.8],[83.9,151.9],[90.3,142.8],[102.7,134.5]]},{"id":"goddess_braids","name":"Goddess Braids","forehead":[88.9,123.4],"chin":[159.6,326.8],"right":[71.4,203.8],"left":[176.3,164.4],"oval":[[88.9,123.4],[111.6,113.6],[135.6,106.0],[162.9,101.8],[187.0,104.6],[208.5,113.3],[224.7,125.9],[238.1,143.8],[246.1,162.8],[252.0,183.5],[255.7,206.9],[254.9,233.2],[247.7,256.4],[235.7,274.6],[220.0,291.1],[206.4,302.5],[191.7,312.7],[176.4,321.4],[159.6,326.8],[146.8,327.5],[138.7,324.0],[133.2,318.5],[128.3,312.3],[121.6,303.1],[116.3,291.3],[108.8,275.6],[98.9,256.9],[90.4,239.2],[83.6,222.1],[74.9,206.3],[63.7,190.8],[56.5,176.4],[53.1,162.1],[53.7,150.4],[59.6,140.5],[70.9,132.2]]}];

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = {
  landmarker: null, mode: null, stream: null, video: null, photo: null, running: false, raf: 0,
  smoother: new LandmarkSmoother({ minCutoff: 1.0, beta: 0.03 }), lastTs: -1, frames: 0, fpsT: 0, fps: 0,
  scale: 1, wigImgs: {}, landmarks: null, mirrored: false, choice: {},
  segmenter: null, segLoading: null, segMode: null, hair: null, segFrame: 0,
};
const segIn = document.createElement('canvas'); const segInCtx = segIn.getContext('2d');
const work = document.createElement('canvas');
const wctx = work.getContext('2d', { willReadFrequently: true });
const layer = document.createElement('canvas');
const lctx = layer.getContext('2d');
const mask = document.createElement('canvas');
const mctx = mask.getContext('2d', { willReadFrequently: true });
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function select(id, label, values) {
  return `<label class="to-field" for="${id}"><span>${esc(label)}</span><select id="${id}"><option value="" disabled selected>Choose…</option><option value="none">None</option>${values.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>`;
}

function controls() {
  return `
    <fieldset class="to-group"><legend>Lips</legend>
      ${select('toLip', 'Lip colour', LIP.map(([l, h]) => [h, l]))}${select('toLipFinish', 'Lip finish', LIP_FINISH)}</fieldset>
    <fieldset class="to-group"><legend>Eyes</legend>
      ${select('toLiner', 'Liner / kohl colour', LINER)}${select('toLinerStyle', 'Liner style', LINER_STYLE)}
      ${select('toLashes', 'Lashes', LASHES)}${select('toShadow', 'Eyeshadow', SHADOW)}</fieldset>
    <fieldset class="to-group"><legend>Brows &amp; cheeks</legend>
      ${select('toBrow', 'Brow tint', BROW)}${select('toBlush', 'Blush', BLUSH)}</fieldset>
    <fieldset class="to-group"><legend>Wig</legend>
      ${select('toWig', 'Wig style', WIGS.map(w => [w.id, w.name]))}
      <p class="lib-note to-wig-note">Preview: placement follows your head; for an exact look see <a href="#" data-to-view="wig">Wig Match</a>. Wig shapes are cut from MIRRR's own wig photos. Your own hair outside the wig is softly painted over with the background behind you, on this device; some may still show.</p></fieldset>`;
}

function readChoice() {
  const v = id => { const x = $(id)?.value; return x && x !== 'none' ? x : null; };
  t.choice = {
    lip: v('toLip'), lipFinish: v('toLipFinish') ?? 'creme', liner: v('toLiner'), linerStyle: v('toLinerStyle') ?? 'tight',
    lashes: v('toLashes'), shadow: v('toShadow'), brow: v('toBrow'), blush: v('toBlush'), wig: v('toWig'),
  };
  if (t.choice.wig && !t.wigImgs[t.choice.wig]) {
    const img = new Image(); img.onload = () => { if (!t.running && t.photo) drawPhoto(); };
    img.src = `/tryon/wigs/${t.choice.wig}.webp`; t.wigImgs[t.choice.wig] = img;
  }
  if (t.choice.wig) {
    ensureSegmenter(t.running ? 'VIDEO' : 'IMAGE').then(sg => { if (sg && !t.running && t.photo && !t.hair) drawPhoto(); });
  }
  if (!t.running && t.photo) drawPhoto();
  renderShop();
}

function status(msg) { const s = $('toStatus'); if (s) s.textContent = msg; }

async function ensureLandmarker(mode) {
  if (!t.landmarker) {
    status('Loading the face tracker (about 4 MB, once). It runs on this device.');
    const vision = await import(`${VISION}/vision_bundle.mjs`);
    const files = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
    t.vision = vision; t.files = files;
    const make = delegate => vision.FaceLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: mode, numFaces: 1,
      outputFaceBlendshapes: false, outputFacialTransformationMatrixes: false,
    });
    try { t.landmarker = await make('GPU'); } catch { t.landmarker = await make('CPU'); }
    t.mode = mode;
  }
  if (t.mode !== mode) { await t.landmarker.setOptions({ runningMode: mode }); t.mode = mode; }
  return t.landmarker;
}

async function startCamera() {
  stopCamera();
  if (!navigator.mediaDevices?.getUserMedia) { status('This browser cannot open a camera here. Use a photo instead.'); return; }
  try {
    status('Asking for your camera…');
    t.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
  } catch (e) { status('The camera did not start (' + (e?.name || 'blocked') + '). You can use a photo instead.'); return; }
  try { await ensureLandmarker('VIDEO'); } catch { status('The face tracker could not load. Check your connection and try again.'); stopCamera(); return; }
  t.video = t.video || document.createElement('video');
  Object.assign(t.video, { muted: true, playsInline: true, autoplay: true });
  t.video.setAttribute('playsinline', '');
  t.video.srcObject = t.stream; await t.video.play();
  t.photo = null; t.hair = null; t.mirrored = true; t.smoother.reset(); t.scale = 1;
  if (t.choice.wig) ensureSegmenter('VIDEO');
  $('toCanvas').classList.add('to-mirror');
  $('toStop').hidden = false; $('toSnap').disabled = false;
  t.running = true; status('Camera on. Everything is processed on this device; nothing is uploaded.');
  loop();
}

function stopCamera() {
  t.running = false; cancelAnimationFrame(t.raf);
  if (t.stream) { t.stream.getTracks().forEach(tr => tr.stop()); t.stream = null; }
  if (t.video) t.video.srcObject = null;
  const st = $('toStop'); if (st) st.hidden = true;
}

function sizeTo(w, h) {
  if (work.width !== w || work.height !== h) { work.width = layer.width = w; work.height = layer.height = h; const c = $('toCanvas'); c.width = w; c.height = h; }
}

function loop() {
  if (!t.running) return;
  const v = t.video;
  if (v.readyState >= 2 && v.videoWidth) {
    const w = Math.round(Math.min(960, v.videoWidth) * t.scale), h = Math.round(w * v.videoHeight / v.videoWidth);
    sizeTo(w, h);
    wctx.drawImage(v, 0, 0, w, h);
    const now = performance.now();
    if (now > t.lastTs) {
      t.lastTs = now;
      const r = t.landmarker.detectForVideo(v, now);
      const raw = r.faceLandmarks?.[0];
      t.landmarks = raw ? t.smoother.apply(raw, now / 1000) : null;
      if (!raw) t.smoother.reset();
      // Her own hair, a few times a second (less on a slow device), only while a wig is on.
      if (t.choice.wig && t.segmenter && t.segMode === 'VIDEO' && now - t.segFrame > Math.max(180, (t.segCost || 0) * 6)) {
        // A small copy of the frame is enough for a 256×256 model, and keeps the camera smooth.
        t.segFrame = now; segIn.width = 256; segIn.height = Math.round(256 * v.videoHeight / v.videoWidth);
        segInCtx.drawImage(v, 0, 0, segIn.width, segIn.height);
        const a0 = performance.now(); segmentHair(segIn, now); t.segCost = performance.now() - a0;
      }
    }
    paint(w, h);
    $('toCanvas').getContext('2d').drawImage(work, 0, 0);
    // Frame rate, and a lighter working size if this device is struggling.
    t.frames++;
    if (now - t.fpsT > 1000) {
      t.fps = Math.round(t.frames * 1000 / (now - t.fpsT)); t.frames = 0; t.fpsT = now;
      if (t.fps < 18 && t.scale > 0.55) t.scale = Math.max(0.55, t.scale - 0.15);
      $('toFps').textContent = `${t.fps} fps · ${w}×${h}${t.landmarks ? '' : ' · looking for a face'}`;
    }
  }
  t.raf = requestAnimationFrame(loop);
}

async function usePhoto(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  await useImage(url, 'Photo loaded on this device. Nothing is uploaded.');
}

/** A sample photo (MIRRR's own model faces), for trying it with no camera and no upload. */
async function useSample(id) {
  const f = MODEL_FACES.find(x => x.id === id); if (!f) return;
  await useImage(f.src, 'Sample photo loaded. The makeup is drawn in this browser tab.');
}

async function useImage(src, okMsg) {
  stopCamera();
  const img = new Image(); img.src = src;
  try { await img.decode(); } catch { status('That file could not be opened as a photo.'); return; }
  try { await ensureLandmarker('IMAGE'); } catch { status('The face tracker could not load. Check your connection and try again.'); return; }
  const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
  sizeTo(w, h);
  wctx.drawImage(img, 0, 0, w, h);
  const r = t.landmarker.detect(work);
  t.photo = img; t.hair = null; fillKey = ''; t.mirrored = false; $('toCanvas').classList.remove('to-mirror');
  t.landmarks = r.faceLandmarks?.[0] ?? null;
  if (t.choice.wig) await ensureSegmenter('IMAGE');
  status(t.landmarks ? okMsg : 'No face found in that photo. Try a front-facing photo in good light.');
  $('toSnap').disabled = false;
  drawPhoto();
}

function drawPhoto() {
  const w = work.width, h = work.height;
  wctx.drawImage(t.photo, 0, 0, w, h);
  if (t.choice.wig && t.segmenter && !t.hair) segmentHair(work, 0);
  paint(w, h);
  $('toCanvas').getContext('2d').drawImage(work, 0, 0);
}


/** The hair segmenter (about 16 MB, once), loaded only after she picks a wig. Runs on this device. */
function ensureSegmenter(mode) {
  if (t.segmenter) {
    if (t.segMode !== mode) { t.segMode = mode; return t.segmenter.setOptions({ runningMode: mode }).then(() => t.segmenter); }
    return Promise.resolve(t.segmenter);
  }
  if (!t.segLoading) {
    t.segLoading = (async () => {
      if (!t.vision) return null;
      const make = delegate => t.vision.ImageSegmenter.createFromOptions(t.files, {
        baseOptions: { modelAssetPath: SEG_MODEL, delegate }, runningMode: mode, outputConfidenceMasks: true, outputCategoryMask: false,
      });
      t.segmenter = await make('CPU'); // a 256×256 model: CPU is quick and avoids GPU read-back stalls
      t.segMode = mode; return t.segmenter;
    })().catch(() => null);
  }
  return t.segLoading;
}

/**
 * Her own hair, as a small mask (hair confidence 0..1) plus a background estimate at the same size,
 * so hair the wig does not cover can be painted over with the background behind her.
 */
function segmentHair(source, now) {
  const seg = t.segmenter; if (!seg) return;
  if ((t.running ? 'VIDEO' : 'IMAGE') !== t.segMode) return;
  const r = t.running ? seg.segmentForVideo(source, now) : seg.segment(source);
  const masks = r.confidenceMasks; if (!masks?.length) return;
  const W0 = masks[0].width, H0 = masks[0].height;
  const k = Math.min(1, 192 / Math.max(W0, H0)); const mw = Math.max(2, Math.round(W0 * k)), mh = Math.max(2, Math.round(H0 * k));
  const B = masks[0].getAsFloat32Array(), Hm = masks[1].getAsFloat32Array();
  const bg = new Float32Array(mw * mh), hair = new Float32Array(mw * mh);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    const j = Math.min(H0 - 1, Math.floor((y + 0.5) * H0 / mh)) * W0 + Math.min(W0 - 1, Math.floor((x + 0.5) * W0 / mw));
    bg[y * mw + x] = B[j]; hair[y * mw + x] = Hm[j];
  }
  masks.forEach(m => m.close?.());
  t.hair = { mw, mh, bg, hair, ver: (t.hair?.ver ?? 0) + 1 };
}

// Small scratch canvases for the hair hiding.
const small = document.createElement('canvas'); const sctx = small.getContext('2d', { willReadFrequently: true });
const fillC = document.createElement('canvas'); const fctx = fillC.getContext('2d');

/** Paint over her own hair (outside the face) with a smooth estimate of the background, before the wig goes on. */
let fillKey = '';
function hideOwnHair(L, w, h) {
  const H = t.hair; if (!H) return;
  // The fill is rebuilt only when a new hair mask arrives; frames in between reuse it.
  const key = `${H.ver}:${w}x${h}`;
  if (key === fillKey) { wctx.drawImage(fillC, 0, 0); return; }
  fillKey = key;
  const { mw, mh, bg, hair } = H;
  small.width = mw; small.height = mh;
  sctx.drawImage(work, 0, 0, mw, mh);
  const px = sctx.getImageData(0, 0, mw, mh); const d = px.data;
  // Normalised blur of the background pixels fills the whole frame with "what is behind her".
  const n = mw * mh; const acc = new Float32Array(n * 4);
  const box = (src, r) => {
    const out = new Float32Array(src.length); const tmp = new Float32Array(src.length);
    for (let y = 0; y < mh; y++) for (let c = 0; c < 4; c++) { let s = 0; for (let x = -r; x <= r; x++) s += src[(y * mw + Math.min(mw - 1, Math.max(0, x))) * 4 + c]; for (let x = 0; x < mw; x++) { tmp[(y * mw + x) * 4 + c] = s; s += src[(y * mw + Math.min(mw - 1, x + r + 1)) * 4 + c] - src[(y * mw + Math.max(0, x - r)) * 4 + c]; } }
    for (let x = 0; x < mw; x++) for (let c = 0; c < 4; c++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[(Math.min(mh - 1, Math.max(0, y)) * mw + x) * 4 + c]; for (let y = 0; y < mh; y++) { out[(y * mw + x) * 4 + c] = s; s += tmp[(Math.min(mh - 1, y + r + 1) * mw + x) * 4 + c] - tmp[(Math.max(0, y - r) * mw + x) * 4 + c]; } }
    return out;
  };
  // Sample the background only well away from her hair (no fringe or soft shadow of it).
  const near = new Float32Array(n * 4); for (let i = 0; i < n; i++) near[i * 4 + 3] = hair[i] > 0.05 ? 1 : 0;
  const nb = box(near, Math.max(2, Math.round(mw / 40)));
  for (let i = 0; i < n; i++) { const m = bg[i] > 0.85 && nb[i * 4 + 3] === 0 ? 1 : 0; acc[i * 4] = d[i * 4] * m; acc[i * 4 + 1] = d[i * 4 + 1] * m; acc[i * 4 + 2] = d[i * 4 + 2] * m; acc[i * 4 + 3] = m; }
  for (const r of [3, 8, 20, 48]) {
    const b = box(acc, r);
    for (let i = 0; i < n; i++) if (acc[i * 4 + 3] < 0.5 && b[i * 4 + 3] > 0) { const k = b[i * 4 + 3]; acc[i * 4] = b[i * 4] / k; acc[i * 4 + 1] = b[i * 4 + 1] / k; acc[i * 4 + 2] = b[i * 4 + 2] / k; acc[i * 4 + 3] = 1; }
  }
  // The face itself is never painted over (hair on the forehead and cheeks stays; the wig covers it).
  // A slightly grown face outline, so her own hairline stays under the wig's edge (it reads as hair,
  // where a painted-over band would read as a bald strip).
  const raw0 = toPixels(L, FACE_OVAL, mw, mh);
  const cx = raw0.reduce((a, p) => a + p[0], 0) / raw0.length, cy = raw0.reduce((a, p) => a + p[1], 0) / raw0.length;
  // Above the eyes the sides stay tight (her temple hair is replaced; the wig hugs her face there).
  const oval = raw0.map(([x, y]) => [cx + (x - cx) * (y < cy ? 1.0 : 1.15), cy + (y - cy) * (y < cy ? 1.24 : 1.04)]);
  const faceMask = document.createElement('canvas'); faceMask.width = mw; faceMask.height = mh;
  const fm = faceMask.getContext('2d'); fm.fillStyle = '#fff'; fm.beginPath(); tracePath(fm, oval); fm.fill();
  const fd = fm.getImageData(0, 0, mw, mh).data;
  // Just above the forehead, hair is replaced with her own forehead skin, not the background, so a wig
  // with a higher hairline shows a forehead, not a grey band.
  fm.clearRect(0, 0, mw, mh); fm.beginPath(); tracePath(fm, raw0.map(([x, y]) => [cx + (x - cx) * (y < cy ? 1.1 : 1.08), cy + (y - cy) * (y < cy ? 1.3 : 1)])); fm.fill();
  const zd = fm.getImageData(0, 0, mw, mh).data;
  const [fx, fy] = toPixels(L, [151], w, h)[0]; const sk = wctx.getImageData(Math.max(0, Math.round(fx) - 4), Math.max(0, Math.round(fy) - 4), 9, 9).data;
  let sr = 0, sg = 0, sb = 0; for (let i = 0; i < sk.length; i += 4) { sr += sk[i]; sg += sk[i + 1]; sb += sk[i + 2]; }
  const skin = [sr / (sk.length / 4), sg / (sk.length / 4), sb / (sk.length / 4)];
  for (let i = 0; i < n; i++) { const z = zd[i * 4 + 3] / 255; if (z > 0) { acc[i * 4] += (skin[0] - acc[i * 4]) * z; acc[i * 4 + 1] += (skin[1] - acc[i * 4 + 1]) * z; acc[i * 4 + 2] += (skin[2] - acc[i * 4 + 2]) * z; } }
  // Hair strength, grown by three mask pixels so no dark fringe of her own hair is left at the edge.
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = Math.max(0, Math.min(1, (hair[i] - 0.08) / 0.22));
  // Her own hair at the temples, inside her face outline beside the eyes and above them, is replaced
  // with her skin colour so no strands of it show between the wig's hairline and her face.
  fm.clearRect(0, 0, mw, mh); fm.beginPath(); tracePath(fm, raw0); fm.fill();
  const rd = fm.getImageData(0, 0, mw, mh).data;
  const [e1, e2] = toPixels(L, [33, 263], mw, mh);
  const ec = [(e1[0] + e2[0]) / 2, (e1[1] + e2[1]) / 2], ed = Math.hypot(e2[0] - e1[0], e2[1] - e1[1]) || 1;
  const ux = (e2[0] - e1[0]) / ed, uy = (e2[1] - e1[1]) / ed;
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    let a = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < mh && xx >= 0 && xx < mw) { const v = raw[yy * mw + xx]; if (v > a) a = v; } }
    const i = y * mw + x; const f = fd[i * 4 + 3] / 255;
    let k = 0;
    if (rd[i * 4 + 3] > 0) {
      const sx = Math.abs((x - ec[0]) * ux + (y - ec[1]) * uy), ty = (x - ec[0]) * -uy + (y - ec[1]) * ux;
      if (ty < ed * 0.25) k = (rd[i * 4 + 3] / 255) * Math.max(0, Math.min(1, (sx - ed * 0.56) / (ed * 0.1)));
    }
    a *= Math.max(1 - f, k);
    d[i * 4] = acc[i * 4] + (skin[0] - acc[i * 4]) * k; d[i * 4 + 1] = acc[i * 4 + 1] + (skin[1] - acc[i * 4 + 1]) * k; d[i * 4 + 2] = acc[i * 4 + 2] + (skin[2] - acc[i * 4 + 2]) * k; d[i * 4 + 3] = Math.round(a * 255);
  }
  sctx.putImageData(px, 0, 0);
  fillC.width = w; fillC.height = h;
  fctx.clearRect(0, 0, w, h); fctx.imageSmoothingQuality = 'high';
  if ('filter' in fctx) fctx.filter = `blur(${Math.max(1, w / mw).toFixed(1)}px)`;
  fctx.drawImage(small, 0, 0, w, h); fctx.filter = 'none';
  wctx.drawImage(fillC, 0, 0);
}

// ---- painting ----------------------------------------------------------------------------------
function tracePath(ctx, pts, closed = true) {
  const seg = closed ? smoothClosed(pts) : smoothOpen(pts);
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const s of seg) ctx.bezierCurveTo(s[0], s[1], s[2], s[3], s[4], s[5]);
  if (closed) ctx.closePath();
}

/** Recolour pixels under a feathered mask, pixel by pixel, so the skin's own light and texture stay. */
function pixelPass(region, drawMask, feather, perPixel) {
  const x = Math.max(0, Math.floor(region.x)), y = Math.max(0, Math.floor(region.y));
  const w = Math.min(work.width - x, Math.ceil(region.w)), h = Math.min(work.height - y, Math.ceil(region.h));
  if (w < 2 || h < 2) return;
  mask.width = w; mask.height = h;
  mctx.clearRect(0, 0, w, h);
  mctx.save(); mctx.translate(-x, -y);
  if ('filter' in mctx) mctx.filter = `blur(${Math.max(0.6, feather).toFixed(1)}px)`;
  mctx.fillStyle = '#fff'; drawMask(mctx);
  mctx.restore(); mctx.filter = 'none';
  const m = mctx.getImageData(0, 0, w, h).data;
  const img = wctx.getImageData(x, y, w, h); const d = img.data;
  perPixel(d, m, w * h, w, h);
  wctx.putImageData(img, x, y);
}

function paintLips(L, w, h) {
  const outer = toPixels(L, LIPS_OUTER, w, h), inner = toPixels(L, LIPS_INNER, w, h);
  const mw = Math.hypot(outer[10][0] - outer[0][0], outer[10][1] - outer[0][1]);
  const shade = hexToRgb(t.choice.lip); const fin = t.choice.lipFinish;
  pixelPass(bbox(outer, mw * 0.08), c => {
    c.beginPath(); tracePath(c, outer); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); tracePath(c, inner); c.fill(); c.globalCompositeOperation = 'source-over';
  }, mw * 0.025, (d, m, n, pw, ph) => {
    const mean = maskedMeanL(d, m, n);
    const det = lightnessDetail(d, pw, ph, Math.max(1, Math.round(mw * 0.012)));
    for (let i = 0; i < n; i++) {
      const a = m[i * 4 + 3] / 255; if (a < 0.01) continue;
      const o = tintPixel(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], shade, mean, fin, a, 0.94, det[i]);
      d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2];
    }
  });
  if (fin === 'gloss') {
    // A soft wet highlight on the centre of the lower lip and a small one on the upper lip.
    const ang = Math.atan2(outer[10][1] - outer[0][1], outer[10][0] - outer[0][0]);
    const [lo1, lo2] = toPixels(L, [14, 17], w, h); const [up1, up2] = toPixels(L, [13, 0], w, h);
    const g = (cx, cy, rx, ry, a) => { wctx.save(); wctx.globalCompositeOperation = 'screen'; if ('filter' in wctx) wctx.filter = `blur(${(mw * 0.02).toFixed(1)}px)`; wctx.fillStyle = `rgba(255,255,255,${a})`; wctx.beginPath(); wctx.ellipse(cx, cy, rx, ry, ang, 0, Math.PI * 2); wctx.fill(); wctx.restore(); };
    g((lo1[0] + lo2[0]) / 2, lo1[1] * 0.45 + lo2[1] * 0.55, mw * 0.13, mw * 0.03, 0.38);
    g((up1[0] + up2[0]) / 2 - mw * 0.1, (up1[1] + up2[1]) / 2, mw * 0.06, mw * 0.015, 0.25);
  }
}

function paintBrows(L, w, h) {
  const tint = hexToRgb(t.choice.brow);
  for (const side of ['right', 'left']) {
    const poly = browPolygon(L, side, w, h);
    const bw = Math.hypot(poly[0][0] - poly[4][0], poly[0][1] - poly[4][1]);
    pixelPass(bbox(poly, bw * 0.15), c => { c.beginPath(); tracePath(c, poly); c.fill(); }, bw * 0.05, (d, m, n) => {
      for (let i = 0; i < n; i++) {
        const a = m[i * 4 + 3] / 255; if (a < 0.01) continue;
        const o = browPixel(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], tint, a, 0.6);
        d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2];
      }
    });
  }
}

function overlay(draw, op, alpha) {
  lctx.clearRect(0, 0, layer.width, layer.height);
  lctx.save(); draw(lctx); lctx.restore(); lctx.filter = 'none';
  wctx.save(); wctx.globalCompositeOperation = op; wctx.globalAlpha = alpha; wctx.drawImage(layer, 0, 0); wctx.restore();
}

function eyeWidth(L, side, w, h) { const [o, i] = toPixels(L, [EYE[side].outer, EYE[side].inner], w, h); return Math.hypot(o[0] - i[0], o[1] - i[1]); }

function paintShadow(L, w, h) {
  const col = t.choice.shadow;
  const draw = c => {
    for (const side of ['right', 'left']) {
      const ew = eyeWidth(L, side, w, h);
      if ('filter' in c) c.filter = `blur(${(ew * 0.09).toFixed(1)}px)`;
      // Built up like a brush does: a soft wash to the crease, then more colour near the lash line.
      c.fillStyle = col; c.globalAlpha = 0.55; c.beginPath(); tracePath(c, lidPolygon(L, side, w, h, 0.6)); c.fill();
      c.globalAlpha = 0.45; c.beginPath(); tracePath(c, lidPolygon(L, side, w, h, 0.3)); c.fill(); c.globalAlpha = 1;
    }
  };
  overlay(draw, 'multiply', 0.4);
  overlay(draw, 'soft-light', 0.3);
}

function paintBlush(L, w, h) {
  const col = hexToRgb(t.choice.blush).join(',');
  const draw = c => {
    for (const side of ['right', 'left']) {
      const e = blushEllipse(L, side, w, h);
      c.save(); c.translate(e.cx, e.cy); c.rotate(e.angle); c.scale(1, e.ry / e.rx);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, e.rx);
      g.addColorStop(0, `rgba(${col},0.8)`); g.addColorStop(0.5, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, e.rx, 0, Math.PI * 2); c.fill(); c.restore();
    }
  };
  overlay(draw, 'soft-light', 0.4);
  overlay(draw, 'multiply', 0.1);
}

function paintLiner(L, w, h) {
  const col = t.choice.liner; const style = t.choice.linerStyle;
  const draw = c => {
    for (const side of ['right', 'left']) {
      const ew = eyeWidth(L, side, w, h);
      const line = lashLine(L, side, w, h); // inner -> outer, normals point up the lid
      // A band from the lash line up the lid, thin at the inner corner and fuller at the outer.
      const up = line.map(({ p, n, t: k }) => { const th = ew * (0.018 + 0.05 * k * k); return [p[0] + n[0] * th, p[1] + n[1] * th]; });
      const band = [...line.map(l => l.p), ...up.reverse()];
      if ('filter' in c) c.filter = `blur(${Math.max(0.5, ew * 0.012).toFixed(1)}px)`;
      c.fillStyle = col; c.beginPath(); tracePath(c, band); c.fill();
      if (style === 'wing') {
        const [base, tip] = wingTip(L, side, w, h, 0.38);
        const last = line[line.length - 1]; const th = ew * 0.068;
        const top = [last.p[0] + last.n[0] * th, last.p[1] + last.n[1] * th];
        const prev = line[line.length - 3].p;
        c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(top[0], top[1]); c.lineTo(tip[0], tip[1]); c.lineTo(base[0], base[1]); c.closePath(); c.fill();
      }
      if (style === 'kohl') {
        const lower = toPixels(L, EYE[side].lower, w, h);
        c.lineWidth = ew * 0.03; c.lineCap = 'round'; c.strokeStyle = col;
        if ('filter' in c) c.filter = `blur(${(ew * 0.02).toFixed(1)}px)`;
        c.beginPath(); tracePath(c, lower, false); c.stroke();
      }
    }
  };
  overlay(draw, 'source-over', style === 'kohl' ? 0.82 : 0.92);
}

const LASH_STYLE = { natural: { n: 30, len: 0.17, wid: 0.016, curl: 0.35, jitter: 0.2 }, wispy: { n: 38, len: 0.22, wid: 0.014, curl: 0.42, jitter: 0.6 }, dramatic: { n: 44, len: 0.27, wid: 0.02, curl: 0.45, jitter: 0.25 } };
// A fixed pseudo-random pattern per lash, so lashes do not shimmer frame to frame.
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

function paintLashes(L, w, h) {
  const st = LASH_STYLE[t.choice.lashes];
  wctx.save(); wctx.strokeStyle = 'rgba(12,10,10,0.85)'; wctx.fillStyle = 'rgb(14,11,11)'; wctx.lineCap = 'round';
  if ('filter' in wctx) wctx.filter = 'blur(0.35px)'; // hair is never razor-edged on camera
  for (const side of ['right', 'left']) {
    const open = eyeOpenness(L, side, w, h);
    if (open < 0.13) continue; // the eye is closed: hide the lashes
    const ew = eyeWidth(L, side, w, h);
    const line = lashLine(L, side, w, h);
    const seg = smoothOpen(line.map(l => l.p));
    const pts = [];
    for (let k = 0; k < st.n; k++) {
      const u = Math.min(0.995, Math.max(0.005, (k + 0.5 + (rnd(k + 31) - 0.5) * 0.8) / st.n)); const si = Math.min(seg.length - 1, Math.floor(u * seg.length)); const tt = u * seg.length - si;
      const p0 = si === 0 ? line[0].p : [seg[si - 1][4], seg[si - 1][5]]; const s = seg[si];
      const q = [0, 1].map(j => (1 - tt) ** 3 * p0[j] + 3 * (1 - tt) ** 2 * tt * s[j] + 3 * (1 - tt) * tt ** 2 * s[2 + j] + tt ** 3 * s[4 + j]);
      const li = Math.min(line.length - 1, Math.round(u * (line.length - 1)));
      pts.push({ p: q, n: line[li].n, u });
    }
    const outward = [line[line.length - 1].p[0] - line[0].p[0], line[line.length - 1].p[1] - line[0].p[1]];
    const ol = Math.hypot(...outward) || 1;
    pts.forEach(({ p, n, u }, k) => {
      const prof = 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, u * 0.85 + 0.12)); // short inner, longest past the middle
      const len = ew * st.len * prof * (1 - st.jitter * 0.5 + st.jitter * rnd(k + (side === 'left' ? 99 : 0)));
      const lean = (u - 0.3) * 0.9 + (rnd(k + 53) - 0.5) * 0.35; // inner lashes stand up, outer lashes sweep outward; each a little different
      const dir = [n[0] + (outward[0] / ol) * lean, n[1] + (outward[1] / ol) * lean]; const dl = Math.hypot(...dir) || 1;
      const tip = [p[0] + (dir[0] / dl) * len, p[1] + (dir[1] / dl) * len];
      const ctrl = [p[0] + n[0] * len * 0.55 - (outward[0] / ol) * len * st.curl * 0.2, p[1] + n[1] * len * 0.55 - (outward[1] / ol) * len * st.curl * 0.2];
      // Each lash is a tapered strand: full width at the root, a fine point at the tip, like real hair.
      const bw = Math.max(0.8, ew * st.wid * (1.1 - 0.4 * u)) / 2;
      const tx = -(dir[1] / dl), ty = dir[0] / dl;
      wctx.globalAlpha = 0.78 + 0.2 * rnd(k + 7);
      wctx.beginPath();
      wctx.moveTo(p[0] - tx * bw, p[1] - ty * bw);
      wctx.quadraticCurveTo(ctrl[0] - tx * bw * 0.6, ctrl[1] - ty * bw * 0.6, tip[0], tip[1]);
      wctx.quadraticCurveTo(ctrl[0] + tx * bw * 0.6, ctrl[1] + ty * bw * 0.6, p[0] + tx * bw, p[1] + ty * bw);
      wctx.closePath(); wctx.fill();
    });
    wctx.globalAlpha = 1;
    wctx.lineWidth = Math.max(1, ew * 0.025); wctx.beginPath(); tracePath(wctx, line.map(l => l.p), false); wctx.stroke();
  }
  wctx.restore();
}

// Seating: hair hugs her head (rings pulled in) and the hairline/crown sit lower, on her scalp.
const WIG_SEAT = { hug: 0.86, drop: 0.05 };
function paintWig(L, w, h) {
  const meta = WIGS.find(x => x.id === t.choice.wig); const img = t.wigImgs[t.choice.wig];
  if (!meta || !img?.complete || !img.naturalWidth) return;
  hideOwnHair(L, w, h);
  // Three anchors (both outer eye corners and the chin) fix scale, width, tilt and position, so the
  // wig's face opening is fitted to her face and follows her head as it tilts or moves.
  const dst = toPixels(L, [EYE.right.outer, EYE.left.outer, 152], w, h);
  if (!meta.oval) {
    const m = wigAffine([meta.right, meta.left, meta.chin], dst);
    wctx.save(); wctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); wctx.drawImage(img, 0, 0); wctx.restore();
    return;
  }
  // Mesh warp: the wig's face opening (the model's 36-point face outline) is mapped ring by ring onto
  // her face outline, so the hairline sits on her hairline and the sides hug her temples and cheeks
  // at any tilt. The last ring is wide enough to carry the full length of the hair.
  const tris = wigMesh(meta.oval, toPixels(L, FACE_OVAL, w, h), [...WIG_RINGS, 9], WIG_SEAT);
  for (const { s, d } of tris) {
    const m = wigAffine(s, d);
    const gx = (d[0][0] + d[1][0] + d[2][0]) / 3, gy = (d[0][1] + d[1][1] + d[2][1]) / 3;
    wctx.save(); wctx.beginPath();
    d.forEach(([x, y], i) => { const l = Math.hypot(x - gx, y - gy) || 1, g = 0.8 / l; const X = x + (x - gx) * g, Y = y + (y - gy) * g; if (i) wctx.lineTo(X, Y); else wctx.moveTo(X, Y); });
    wctx.closePath(); wctx.clip();
    wctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); wctx.drawImage(img, 0, 0); wctx.restore();
  }
}

function paint(w, h) {
  const L = t.landmarks; if (!L) return;
  const c = t.choice;
  if (c.brow) paintBrows(L, w, h);
  if (c.shadow) paintShadow(L, w, h);
  if (c.liner) paintLiner(L, w, h);
  if (c.lashes) paintLashes(L, w, h);
  if (c.lip) paintLips(L, w, h);
  if (c.blush) paintBlush(L, w, h);
  if (c.wig) paintWig(L, w, h);
}

// ---- snapshot and shop -------------------------------------------------------------------------
function snapshot() {
  const src = $('toCanvas'); if (!src.width) return;
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
  const c = out.getContext('2d');
  if (t.mirrored) { c.translate(out.width, 0); c.scale(-1, 1); }
  c.drawImage(src, 0, 0);
  out.toBlob(b => {
    if (!b) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'mirrr-try-on.png';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status('Snapshot saved to this device only.');
  }, 'image/png');
  window.MirrrMoney?.count?.('tryon_snapshot');
}

let shopKey = '';
async function renderShop() {
  const el = $('toShop'); if (!el) return;
  const c = t.choice; const routines = [];
  if (c.lip) routines.push(['lips', 'Lips']);
  if (c.liner || c.brow || c.lashes || c.shadow) routines.push(['brow_kohl', 'Eyes & brows']);
  const key = routines.map(r => r[0]).join(',');
  if (key === shopKey) return; shopKey = key;
  if (!routines.length) { el.innerHTML = ''; return; }
  const parts = [];
  for (const [id, title] of routines) {
    try {
      const d = await (await fetch(`/api/shop/routine/${id}`)).json();
      if (d.products?.length) parts.push(`<h4>${esc(title)}</h4><div class="earn-xs">${d.products.map(p => `<a class="shop-link earn-chip" href="${esc(String(p.shop_url).replace(/utm_content=[^&]*/, 'utm_content=tryon_' + id))}" target="_blank" rel="noopener"><strong>${esc(p.brand)}</strong> ${esc(p.name)}<span>${esc(String(p.category))} · ${esc(p.price_text)}${p.ownership ? ` · ${esc(p.ownership)}` : ''}</span></a>`).join('')}</div>`);
    } catch { /* offline: no shop strip */ }
  }
  el.innerHTML = parts.length ? `<h3 class="st-h">Shop this look</h3><p class="earn-meta">Real products from brands&rsquo; own stores in the categories you tried. They are not matched to the exact colour on screen. Pick any, or none.</p>${parts.join('')}<p class="lib-note">Prices as listed on each brand&rsquo;s store on Oct 30, 2026. No affiliate deal: MIRRR earns nothing from these links today. <a href="#money">How MIRRR makes money</a></p>` : '';
  el.querySelectorAll('a.shop-link').forEach(a => a.addEventListener('click', () => window.MirrrMoney?.count?.('product_click')));
}

// ---- view ---------------------------------------------------------------------------------------
function mount() {
  const root = $('toRoot'); if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  $('toControls').innerHTML = controls();
  $('toControls').addEventListener('change', readChoice);
  $('toStart').addEventListener('click', startCamera);
  $('toStop').addEventListener('click', () => { stopCamera(); status('Camera off.'); });
  $('toFile').addEventListener('change', e => usePhoto(e.target.files?.[0]));
  const samples = $('toSamples');
  if (samples) {
    samples.innerHTML = MODEL_FACES.map((f, i) => `<button type="button" class="to-sample" data-to-sample="${esc(f.id)}" aria-label="Sample photo ${i + 1}"><img src="${esc(f.src)}" alt="" width="54" height="72" loading="lazy" decoding="async"></button>`).join('');
    samples.addEventListener('click', e => {
      const b = e.target.closest('[data-to-sample]'); if (!b) return;
      samples.querySelectorAll('.to-sample').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      useSample(b.dataset.toSample);
    });
  }
  $('toSnap').addEventListener('click', snapshot);
  root.addEventListener('click', e => { const a = e.target.closest('[data-to-view]'); if (a) { e.preventDefault(); document.querySelector(`.nav-link[data-view="${a.dataset.toView}"]`)?.click(); } });
  // Leaving the view switches the camera off.
  const view = $('view-tryon');
  new MutationObserver(() => { if (view.classList.contains('hidden') && t.running) { stopCamera(); status('Camera off.'); } }).observe(view, { attributes: true, attributeFilter: ['class'] });
}

document.addEventListener('click', e => {
  const b = e.target.closest?.('[data-tryon-open]'); if (!b) return;
  e.preventDefault();
  document.querySelector('.nav-link[data-view="tryon"]')?.click();
  window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
// For the automated check: the current state, never frames.
window.__mirrrTryon = { state: () => ({ running: t.running, face: !!t.landmarks, roll: t.landmarks ? Math.round(headPose(t.landmarks, work.width, work.height).roll * 180 / Math.PI) : null, fps: t.fps, size: [work.width, work.height], choice: { ...t.choice } }) };
