// ─────────────────────────────────────────────────────────────
// gc-render.js — Master render & cleanup
// ─────────────────────────────────────────────────────────────

import { STATE } from "./gc-state";
import { SVG } from "./gc-icons";
import { isTargetRoute, getCategorySlugFromPath, addBodyClass, cleanupBodyClass, isTrending } from "./gc-utils";
import { extractTagsFromTopics } from "./gc-tags";
import { buildHeroBanner, buildActionBar, buildLoadMoreButton, buildTopicCard } from "./gc-builders";
import { fetchCategoryTopics, getCategoryInfoFromSite } from "./gc-fetch";
import { bindTopicCardClicks, bindLoadMore, bindActionBar, bindSearch } from "./gc-bindings";

export async function renderLayout() {
  if (!isTargetRoute()) return;

  STATE.categorySlug = getCategorySlugFromPath();
  if (!STATE.categorySlug) return;

  addBodyClass();

  const outlet = document.getElementById("main-outlet");
  if (!outlet || document.getElementById("gc-category-wrapper")) return;

  // Try synchronous lookup from Discourse site service first
  STATE.categoryInfo = getCategoryInfoFromSite(STATE.categorySlug);

  outlet.style.opacity = "0";

  const wrapper = document.createElement("div");
  wrapper.id = "gc-category-wrapper";
  wrapper.innerHTML = `
    ${buildHeroBanner()}
    ${buildActionBar()}
    <div id="gc-master-detail">
      <div id="gc-topic-feed">
        ${[1, 2, 3, 4, 5]
          .map(
            () => `<div class="gc-topic-card" style="pointer-events:none"><div class="gc-card-body">
          <div class="gc-skeleton" style="height:14px;width:60%;margin-bottom:6px"></div>
          <div class="gc-skeleton" style="height:11px;width:90%;margin-bottom:4px"></div>
          <div class="gc-skeleton" style="height:11px;width:70%"></div>
        </div></div>`,
          )
          .join("")}
      </div>
      <div id="gc-topic-detail">
        <div id="gc-empty-detail">${SVG.newspaper}<p>Pilih artikel untuk membaca</p></div>
      </div>
    </div>`;

  (outlet.querySelector(".container") || outlet).prepend(wrapper);
  outlet.style.opacity = "1";

  const { topics, moreUrl, categoryData } = await fetchCategoryTopics();

  if (!STATE.categoryInfo && categoryData) {
    STATE.categoryInfo = categoryData;
  }

  STATE.allTopics = topics;
  STATE.moreTopicsUrl = moreUrl;
  STATE.availableTags = extractTagsFromTopics(topics);

  const feed = document.getElementById("gc-topic-feed");
  const latestBadge = document.getElementById("gc-badge-latest");
  const trendingBadge = document.getElementById("gc-badge-trending");

  if (latestBadge) latestBadge.textContent = topics.length;
  if (trendingBadge)
    trendingBadge.textContent = topics.filter(isTrending).length;

  if (feed) {
    if (!topics.length) {
      feed.innerHTML = `<div style="padding:20px;text-align:center;color:var(--gc-text-muted);font-size:0.82rem">Tidak ada artikel ditemukan.</div>`;
    } else {
      feed.innerHTML = topics.map((t) => buildTopicCard(t)).join("");

      if (STATE.moreTopicsUrl) {
        const wrap = document.createElement("div");
        wrap.innerHTML = buildLoadMoreButton();
        feed.appendChild(wrap.firstElementChild);
      }

      bindTopicCardClicks();
      bindLoadMore();
      feed.querySelector(".gc-topic-card")?.click();
    }
  }

  bindActionBar();
  bindSearch();
}

export function cleanupLayout() {
  document.getElementById("gc-category-wrapper")?.remove();
  cleanupBodyClass();
  // Reset all state for a fresh render on the next route
  STATE.allTopics = [];
  STATE.moreTopicsUrl = null;
  STATE.isLoadingMore = false;
  STATE.categorySlug = null;
  STATE.categoryInfo = null;
  STATE.availableTags = [];
  STATE.selectedFilters = [];
  STATE.searchQuery = "";
  STATE.dateRange = { start: null, end: null };
  STATE.activeFilter = "latest";
  STATE.calendarMonth = { left: null, right: null };
}
