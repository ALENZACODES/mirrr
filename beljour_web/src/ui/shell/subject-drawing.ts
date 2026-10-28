/** Original diagram of two adults. Neither figure represents an actual person. */
export const PAIR_WIDTH = 512;
export const PAIR_HEIGHT = 640;

interface FigurePosition {
  readonly cx: number;
  readonly cy: number;
  readonly factor: number;
  readonly skin: string;
  readonly hair: string;
  readonly coat: string;
}

function portrait(ctx: CanvasRenderingContext2D, position: FigurePosition): void {
  const { cx, cy, factor, skin, hair, coat } = position;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(factor, factor);
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(0, 238, 150, 118, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.fillRect(-30, 123, 60, 78);
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(0, 0, 102, 158, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 15, 83, 114, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(0, -94, 88, 62, -0.05, Math.PI, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = "#1B1B35";
  ctx.beginPath();
  ctx.ellipse(-32, 11, 7, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(32, 11, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#724F48";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, 21);
  ctx.lineTo(-10, 49);
  ctx.lineTo(9, 52);
  ctx.moveTo(-26, 81);
  ctx.quadraticCurveTo(0, 95, 26, 81);
  ctx.stroke();
  ctx.restore();
}

export function drawTwoPersonSample(target: HTMLCanvasElement): void {
  target.width = PAIR_WIDTH;
  target.height = PAIR_HEIGHT;
  const ctx = target.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("This browser cannot draw the local sample");
  ctx.fillStyle = "#F5F5FA";
  ctx.fillRect(0, 0, PAIR_WIDTH, PAIR_HEIGHT);
  ctx.fillStyle = "#E2E8F4";
  ctx.fillRect(16, 16, 480, 600);
  ctx.fillStyle = "#000091";
  ctx.fillRect(16, 16, 480, 6);
  portrait(ctx, { cx: 157, cy: 301, factor: 0.77, skin: "#B9836B", hair: "#342938", coat: "#42557A" });
  portrait(ctx, { cx: 365, cy: 310, factor: 0.70, skin: "#75513E", hair: "#272C34", coat: "#596274" });
  ctx.fillStyle = "#1B1B35";
  ctx.font = "600 16px system-ui";
  ctx.fillText("TWO DRAWN ADULTS · NO REAL FACES", 38, 592);
}
