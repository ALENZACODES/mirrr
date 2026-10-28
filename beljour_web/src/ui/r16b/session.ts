/** Revision-safe R16B studio session. Author: John Khan. */
import { card } from "./catalogue.js";
export interface ImageDataLike {
    width: number;
    height: number;
    channels: 4;
    data: Uint8ClampedArray;
}
export interface Job {
    id: number;
    image: ImageDataLike;
    feature: string;
    amount: number;
    style: string;
    adult: boolean;
    landmarks: readonly (readonly [
        number,
        number
    ])[] | null;
    regions: readonly {
        name: string;
        points: readonly (readonly [
            number,
            number
        ])[];
    }[];
    diary_values: readonly number[];
    health_consent: boolean;
}
export interface Result {
    pixels: Uint8ClampedArray;
    label: string;
    warnings: string[];
    metrics: Record<string, unknown>;
    elapsedMs: number;
}
export class Session {
    private imageValue: ImageDataLike | null = null;
    private rev = 0;
    private active: number | null = null;
    private resultValue: Result | null = null;
    feature = "W45";
    amount = .35;
    style = card("W45").styles[0] ?? "";
    adult = false;
    landmarks: readonly (readonly [
        number,
        number
    ])[] | null = null;
    regions: {
        name: string;
        points: (readonly [
            number,
            number
        ])[];
    }[] = [];
    diary_values = [.25, .3, .4, .35, .28];
    health_consent = false;
    get image() { return this.imageValue ? { ...this.imageValue, data: this.imageValue.data.slice() } : null; }
    get result() { return this.resultValue ? { ...this.resultValue, pixels: this.resultValue.pixels.slice(), warnings: [...this.resultValue.warnings], metrics: structuredClone(this.resultValue.metrics) } : null; }
    get version() { return this.rev; }
    load(i: ImageDataLike, landmarks: readonly (readonly [
        number,
        number
    ])[] | null = null) {
        if (i.channels !== 4 || i.data.length !== i.width * i.height * 4)
            throw new RangeError("invalid image");
        this.imageValue = { ...i, data: i.data.slice() };
        this.landmarks = landmarks?.map(p => [p[0], p[1]] as const) ?? null;
        this.regions = [];
        this.adult = false;
        this.health_consent = false;
        this.invalidate();
    }
    select(id: string) { const c = card(id); this.feature = id; this.style = c.styles[0] ?? ""; this.regions = []; this.invalidate(); }
    setRegion(name: string, points: readonly (readonly [
        number,
        number
    ])[]) {
        if (points.length < 3)
            throw new RangeError("region needs at least 3 points");
        this.regions = [...this.regions.filter(r => r.name !== name), { name, points: points.map(p => [p[0], p[1]] as const) }];
        this.invalidate();
    }
    clearRegions() { this.regions = []; this.invalidate(); }
    invalidate() { this.rev++; this.active = null; this.resultValue = null; }
    reasons() {
        const c = card(this.feature), r: string[] = [];
        if (!this.imageValue)
            r.push("Open a local photo or fixture.");
        if (c.mesh && !this.landmarks)
            r.push("Checked face points are required.");
        if (c.region && this.regions.length === 0)
            r.push("Mark a local region for this feature.");
        if (c.adult && !this.adult)
            r.push("Confirm 18+ for this consultation simulation.");
        if (this.feature === "W83" && !this.health_consent)
            r.push("Confirm local health-data diary consent.");
        return r;
    }
    job(): Job {
        const reasons = this.reasons();
        if (reasons.length || !this.imageValue)
            throw new RangeError(reasons.join(" "));
        const id = ++this.rev;
        this.active = id;
        return { id, image: { ...this.imageValue, data: this.imageValue.data.slice() }, feature: this.feature, amount: this.amount, style: this.style, adult: this.adult, landmarks: this.landmarks, regions: structuredClone(this.regions), diary_values: [...this.diary_values], health_consent: this.health_consent };
    }
    complete(id: number, r: Result) {
        if (this.active !== id || this.rev !== id || !this.imageValue)
            return false;
        if (r.pixels.length !== this.imageValue.data.length || !/simulation|preview|consultation|cosmetic/i.test(r.label))
            throw new RangeError("invalid labelled result");
        for (let i = 3; i < r.pixels.length; i += 4)
            if (r.pixels[i] !== this.imageValue.data[i])
                throw new RangeError("alpha changed");
        this.resultValue = { ...r, pixels: r.pixels.slice(), warnings: [...r.warnings], metrics: structuredClone(r.metrics) };
        this.active = null;
        return true;
    }
    fail(id: number) {
        if (this.active !== id)
            return false;
        this.active = null;
        return true;
    }
}

