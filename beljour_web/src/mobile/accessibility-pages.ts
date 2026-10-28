/** Named, public client routes for a genuine multi-page accessibility review.
 * This never marks a destination checked merely because it could be opened.
 */
export const REVIEW_PAGES = [
  { id: "home", title: "Home", href: "home.html", objective: "Reach Judge Mode and My Looks by keyboard." },
  { id: "studio", title: "Studio", href: "studio.html", objective: "Inspect editor controls, compare and export." },
  { id: "classic", title: "Photo flow", href: "index.html", objective: "Check local upload, consent and recovery." },
  { id: "trust", title: "Trust Centre", href: "trust.html", objective: "Check privacy choices and deletion controls." },
] as const;

export type ReviewPageId = (typeof REVIEW_PAGES)[number]["id"];
export type PageDecision = "not-reviewed" | "checked-manually" | "issue-observed" | "unable-to-check";

export interface PageReviewRow {
  readonly id: ReviewPageId;
  readonly decision: PageDecision;
}

export interface PageReviewSnapshot {
  readonly rows: readonly PageReviewRow[];
  readonly reviewed: number;
  readonly issues: number;
  readonly complete: boolean;
  readonly certified: false;
}

const PAGE_DECISIONS: readonly PageDecision[] = [
  "not-reviewed", "checked-manually", "issue-observed", "unable-to-check",
];

function validPage(value: string): value is ReviewPageId {
  return REVIEW_PAGES.some((item) => item.id === value);
}

function validDecision(value: string): value is PageDecision {
  return PAGE_DECISIONS.some((item) => item === value);
}

export function reviewedPageHref(page: ReviewPageId): string {
  const target = REVIEW_PAGES.find((item) => item.id === page);
  if (!target) throw new RangeError("Unregistered review destination");
  return target.href;
}

/** Counts require a deliberate recorded choice for each route; never infer from page load. */
export class AccessibilityPageReview {
  private readonly entries = new Map<ReviewPageId, PageDecision>();
  private readonly subscribers = new Set<(value: PageReviewSnapshot) => void>();

  constructor() {
    for (const page of REVIEW_PAGES) this.entries.set(page.id, "not-reviewed");
  }

  get snapshot(): PageReviewSnapshot {
    const rows = REVIEW_PAGES.map((page) => ({
      id: page.id,
      decision: this.entries.get(page.id) ?? "not-reviewed",
    }));
    const reviewed = rows.filter((row) => row.decision !== "not-reviewed").length;
    return {
      rows,
      reviewed,
      issues: rows.filter((row) => row.decision === "issue-observed").length,
      complete: reviewed === REVIEW_PAGES.length,
      certified: false,
    };
  }

  record(id: ReviewPageId, decision: PageDecision): PageReviewSnapshot {
    if (!validPage(id) || !validDecision(decision)) throw new RangeError("Unknown route review choice");
    this.entries.set(id, decision);
    const snapshot = this.snapshot;
    for (const subscriber of this.subscribers) subscriber(snapshot);
    return snapshot;
  }

  subscribe(subscriber: (value: PageReviewSnapshot) => void): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.snapshot);
    return () => this.subscribers.delete(subscriber);
  }

  reset(): void {
    for (const page of REVIEW_PAGES) this.entries.set(page.id, "not-reviewed");
    const snapshot = this.snapshot;
    for (const subscriber of this.subscribers) subscriber(snapshot);
  }

  dispose(): void {
    this.entries.clear();
    this.subscribers.clear();
  }
}
