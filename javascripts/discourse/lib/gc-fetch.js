// ─────────────────────────────────────────────────────────────
// gc-fetch.js — Data fetching functions for topics & posts
// ─────────────────────────────────────────────────────────────

import { STATE, API } from "./gc-state";

const JSON_HEADERS = {
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

/**
 * Fetches topics for the current category (or a pagination URL).
 * Returns { topics, moreUrl, categoryData }.
 */
export async function fetchCategoryTopics(url) {
  const slug = STATE.categorySlug;
  if (!slug && !url) return { topics: [], moreUrl: null, categoryData: null };
  const fetchUrl = url || `/c/${slug}.json?no_definitions=true`;
  try {
    const res = await fetch(fetchUrl, { headers: JSON_HEADERS });
    if (!res.ok) return { topics: [], moreUrl: null, categoryData: null };
    const data = await res.json();
    return {
      topics: data.topic_list?.topics || [],
      moreUrl: data.topic_list?.more_topics_url || null,
      categoryData: data.category || null,
    };
  } catch (e) {
    return { topics: [], moreUrl: null, categoryData: null };
  }
}

/**
 * Looks up category metadata from the Discourse site service (synchronous).
 */
export function getCategoryInfoFromSite(slug) {
  if (!slug || !API.instance) return null;
  try {
    const site = API.instance.container?.lookup("service:site");
    const categories = site?.categories || [];
    const slugParts = slug.split("/");
    const lastSlug = slugParts[slugParts.length - 1];
    return (
      categories.find((c) => c.slug === lastSlug || c.slug === slug) || null
    );
  } catch (e) {
    return null;
  }
}

export async function fetchTopicPosts(topicId, topicSlug) {
  try {
    const res = await fetch(`/t/${topicSlug}/${topicId}.json`, {
      headers: JSON_HEADERS,
    });
    if (!res.ok) return { topic: null, posts: [] };
    const data = await res.json();
    return { topic: data, posts: data.post_stream?.posts || [] };
  } catch (e) {
    return { topic: null, posts: [] };
  }
}

export async function fetchPostReplies(topicId, postNumber) {
  try {
    const res = await fetch(
      `/t/${topicId}/posts.json?post_number=${postNumber}&asc=true`,
      { headers: JSON_HEADERS },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.post_stream?.posts || []).filter(
      (p) => p.reply_to_post_number === postNumber && p.post_type === 1,
    );
  } catch (e) {
    return [];
  }
}
