// ─────────────────────────────────────────────────────────────
// gc-utils.js — Route detection & body-class management
// ─────────────────────────────────────────────────────────────

import { STATE } from "./gc-state";

/**
 * Returns the target category slug from theme settings.
 * Discourse injects theme settings as a global `settings` object into theme JS.
 * Falls back to "ga-updates" if the setting is not configured.
 */
export function getTargetCategorySlug() {
  try {
    // `settings` is the global theme settings object injected by Discourse.
    // It reads from settings.yml — NOT from window.Discourse.SiteSettings.
    // eslint-disable-next-line no-undef
    if (typeof settings !== "undefined" && settings.gc_category_slug) {
      return String(settings.gc_category_slug).trim().toLowerCase();
    }
  } catch (_) {}
  return "ga-updates";
}

/**
 * Extracts the category slug from the current URL.
 * Handles: /c/slug, /c/slug/123, /c/parent/child, /c/parent/child/123, /c/slug/l/latest
 */
export function getCategorySlugFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const cIdx = parts.indexOf("c");
  if (cIdx === -1) return null;
  // Take parts after "c", strip page numbers and filter keywords
  const slugParts = parts
    .slice(cIdx + 1)
    .filter(
      (p) =>
        !/^\d+$/.test(p) &&
        p !== "l" &&
        !["latest", "top", "new", "unread", "hot"].includes(p),
    );
  return slugParts.join("/") || null;
}

/**
 * Returns true ONLY when the current URL is the target category
 * (e.g. /c/ga-updates, /c/ga-updates/123, /c/ga-updates/l/latest).
 * Does NOT activate on other categories like /c/general or /c/support.
 */
export function isTargetRoute() {
  const target = getTargetCategorySlug();
  const pathname = window.location.pathname;
  // Match exactly /c/<target> or /c/<target>/ followed by anything
  const re = new RegExp(`^/c/${target}(/|$)`, "i");
  return re.test(pathname);
}

export function addBodyClass() {
  const slug = getCategorySlugFromPath();
  if (!slug) return;
  const cls = `gc-category-${slug.replace(/\//g, "-")}`;
  document.body.classList.add(cls);
  STATE.currentBodyClass = cls;
}

export function cleanupBodyClass() {
  if (STATE.currentBodyClass) {
    document.body.classList.remove(STATE.currentBodyClass);
    STATE.currentBodyClass = null;
  }
}

export function isTrending(topic) {
  return (topic.views || 0) >= 5 || (topic.like_count || 0) >= 1;
}
