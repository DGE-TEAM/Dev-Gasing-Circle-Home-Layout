// ─────────────────────────────────────────────────────────────
// gc-tags.js — Tag rendering & extraction helpers
// ─────────────────────────────────────────────────────────────

export function renderTag(tagName) {
  if (!tagName) return "";
  // CSS class is derived dynamically from tag name
  const cls = `gc-tag--${tagName.toLowerCase().replace(/[\s/]+/g, "-")}`;
  const label = tagName.charAt(0).toUpperCase() + tagName.slice(1);
  return `<span class="gc-tag ${cls}">${label}</span>`;
}

export function getTopicTag(topic) {
  if (!topic) return null;
  const tags = topic.tags || [];
  const first = tags[0];
  if (!first) return null;
  return typeof first === "string"
    ? first
    : first?.name || first?.id || String(first);
}

/**
 * Extracts unique tag names from an array of topics.
 */
export function extractTagsFromTopics(topics) {
  const seen = new Set();
  topics.forEach((t) => {
    (t.tags || []).forEach((tag) => {
      const name = typeof tag === "string" ? tag : tag?.name || tag?.id || "";
      if (name) seen.add(name);
    });
  });
  return [...seen];
}
