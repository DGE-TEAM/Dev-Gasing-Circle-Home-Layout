// =============================================================
// GASING CIRCLE — Sidebar Unread Indicator for Academy News
// Adds `.has-unread` class to the "Gasing Academy News" sidebar
// link when there are new/unread topics in the news category.
// =============================================================

import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.13.0", (api) => {
  const tts = api.container.lookup("service:topic-tracking-state");
  const site = api.container.lookup("service:site");
  if (!tts) return;

  const slug = (typeof settings !== "undefined" && settings.gc_category_slug) || "ga-updates";
  const configuredId = (typeof settings !== "undefined" && parseInt(settings.news_category_id, 10)) || 0;

  function resolveCategoryId() {
    if (configuredId > 0) return configuredId;
    const cat = site?.categories?.find((c) => c.slug === slug);
    return cat?.id ?? null;
  }

  function updateIndicator() {
    const categoryId = resolveCategoryId();
    if (!categoryId) return;

    const unread = tts.countUnread?.({ categoryId }) ?? 0;
    const newCount = tts.countNew?.({ categoryId }) ?? 0;
    const hasUnread = unread + newCount > 0;

    const selectors = [
      `.sidebar-section-link[href="/c/${slug}/${categoryId}"]`,
      `.sidebar-section-link[href^="/c/${slug}"]`,
      `.sidebar-section-link[data-category-id="${categoryId}"]`,
    ];
    document
      .querySelectorAll(selectors.join(","))
      .forEach((el) => el.classList.toggle("has-unread", hasUnread));
  }

  tts.onStateChange?.(updateIndicator);
  api.onPageChange(() => setTimeout(updateIndicator, 200));
  setTimeout(updateIndicator, 500);
});
