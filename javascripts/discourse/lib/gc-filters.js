// ─────────────────────────────────────────────────────────────
// gc-filters.js — Unified filter logic applied to topic cards
// ─────────────────────────────────────────────────────────────

import { STATE } from "./gc-state";
import { isTrending } from "./gc-utils";

/**
 * Applies all active filters (trending, tag, date range, search) to every
 * rendered topic card, showing or hiding each one accordingly.
 */
export function applyAllFilters() {
  const topics = STATE.allTopics;
  const { start, end } = STATE.dateRange;
  const q = STATE.searchQuery.toLowerCase().trim();

  document.querySelectorAll("#gc-topic-feed .gc-topic-card").forEach((card) => {
    const topicId = parseInt(card.dataset.topicId);
    const t = topics.find((x) => x.id === topicId);
    if (!t) {
      card.style.display = "none";
      return;
    }

    // 1. Trending filter
    if (STATE.activeFilter === "trending") {
      if (!isTrending(t)) {
        card.style.display = "none";
        return;
      }
    }

    // 2. Tag filter
    if (STATE.selectedFilters.length) {
      const topicTags = (t.tags || []).map((tag) =>
        (typeof tag === "string" ? tag : tag?.name || "").toLowerCase(),
      );
      if (!STATE.selectedFilters.some((f) => topicTags.includes(f))) {
        card.style.display = "none";
        return;
      }
    }

    // 3. Date range filter
    if (start || end) {
      const created = new Date(t.created_at).getTime();
      if (start && created < start) {
        card.style.display = "none";
        return;
      }
      // Include the full end day (add 23:59:59 ms)
      if (end && created > end + 86399999) {
        card.style.display = "none";
        return;
      }
    }

    // 4. Search filter
    if (q) {
      const title = (t.title || "").toLowerCase();
      const excerpt = (t.excerpt || "").replace(/<[^>]*>/g, "").toLowerCase();
      if (!title.includes(q) && !excerpt.includes(q)) {
        card.style.display = "none";
        return;
      }
    }

    card.style.display = "";
  });
}
