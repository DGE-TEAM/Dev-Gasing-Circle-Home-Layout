// ─────────────────────────────────────────────────────────────
// gc-state.js — Shared mutable state & Discourse API reference
// ─────────────────────────────────────────────────────────────

export const STATE = {
  // Filters
  activeFilter: "latest",
  filterOpen: false,
  dateOpen: false,
  selectedFilters: [],
  searchQuery: "",
  dateRange: { start: null, end: null },
  // UI
  activeTopicId: null,
  calendarMonth: { left: null, right: null },
  expandedReplies: {},
  // Pagination
  allTopics: [],
  moreTopicsUrl: null,
  isLoadingMore: false,
  // Dynamic category
  categorySlug: null,
  categoryInfo: null,
  availableTags: [],
  currentBodyClass: null,
  preventNextRoute: false,
};

// Wrapped in object so consuming modules always read the live reference.
export const API = { instance: null };
