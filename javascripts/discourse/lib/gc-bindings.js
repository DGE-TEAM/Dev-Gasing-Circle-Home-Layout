// ─────────────────────────────────────────────────────────────
// gc-bindings.js — All DOM event bindings & action handlers
// ─────────────────────────────────────────────────────────────

import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { STATE, API } from "./gc-state";
import { SVG } from "./gc-icons";
import { buildFilterPopup, buildDatePopup, buildLoadMoreButton, buildTopicCard } from "./gc-builders";
import { buildCommentHTML, buildTopicDetail } from "./gc-comments";
import { fetchTopicPosts, fetchPostReplies, fetchCategoryTopics } from "./gc-fetch";
import { extractTagsFromTopics } from "./gc-tags";
import { applyAllFilters } from "./gc-filters";
import { isTrending } from "./gc-utils";
import Topic from "discourse/models/topic";
import Post from "discourse/models/post";

// ─── Composer ────────────────────────────────────────────────

export function openComposer(opts) {
  const composerService = API.instance.container?.lookup("service:composer");
  if (composerService) return composerService.open(opts);

  const composerController = API.instance.container?.lookup("controller:composer");
  if (composerController) return composerController.open(opts);
}

// ─── Bookmark ────────────────────────────────────────────────

export async function toggleBookmark(btn, bookmarkableType, bookmarkableId) {
  const isBookmarked = btn.classList.contains("is-bookmarked");
  try {
    if (isBookmarked) {
      // Already bookmarked → show Edit / Delete menu
      showBookmarkManageMenu(btn, btn.dataset.bookmarkId);
    } else {
      // Not yet bookmarked → create bookmark, then show reminder menu
      btn.classList.add("gc-bookmark-animating");
      const result = await ajax("/bookmarks", {
        type: "POST",
        data: { bookmarkable_type: bookmarkableType, bookmarkable_id: bookmarkableId },
      });
      const bookmarkId = result?.id || null;
      if (bookmarkId) btn.dataset.bookmarkId = bookmarkId;
      btn.classList.add("is-bookmarked");
      setTimeout(() => btn.classList.remove("gc-bookmark-animating"), 400);
      // Show reminder menu after creating bookmark (native Discourse behavior)
      showBookmarkReminderMenu(btn, bookmarkId);
    }
  } catch (err) {
    popupAjaxError(err);
  }
}

// Menu shown immediately after creating a bookmark — "Also set a reminder?"
function showBookmarkReminderMenu(btn, bookmarkId) {
  document.querySelectorAll(".gc-bookmark-menu").forEach((m) => m.remove());

  const menu = document.createElement("div");
  menu.className = "gc-bookmark-menu";
  menu.innerHTML = `
    <div class="gc-bm-header">
      ${SVG.checkCircle} Bookmarked!
    </div>
    <div class="gc-bm-title">Also set a reminder?</div>
    <button class="gc-bm-option" data-rem="2">In two hours</button>
    <button class="gc-bm-option" data-rem="24">Tomorrow</button>
    <button class="gc-bm-option" data-rem="72">In three days</button>
    <div class="gc-bm-divider"></div>
    <button class="gc-bm-option gc-bm-muted" data-action="dismiss">No reminder</button>
  `;

  positionMenu(menu, btn);

  menu.querySelectorAll(".gc-bm-option").forEach((opt) => {
    opt.addEventListener("click", async (e) => {
      e.stopPropagation();
      const rem = opt.dataset.rem;
      const action = opt.dataset.action;
      try {
        if (rem && bookmarkId) {
          const date = new Date(Date.now() + parseInt(rem) * 60 * 60 * 1000).toISOString();
          await ajax(`/bookmarks/${bookmarkId}`, {
            type: "PUT",
            data: { reminder_at: date },
          });
        }
        // "dismiss" just closes without setting reminder
      } catch (err) {
        popupAjaxError(err);
      }
      menu.remove();
    });
  });

  autoCloseMenu(menu, btn);
}

// Menu shown when clicking an already-bookmarked button — Edit / Delete
function showBookmarkManageMenu(btn, bookmarkId) {
  document.querySelectorAll(".gc-bookmark-menu").forEach((m) => m.remove());

  const menu = document.createElement("div");
  menu.className = "gc-bookmark-menu";
  menu.innerHTML = `
    <div class="gc-bm-header">
      ${SVG.bookmark} Bookmark ini
    </div>
    <button class="gc-bm-option" data-action="edit-2h">${SVG.calendar} Set reminder: 2 jam lagi</button>
    <button class="gc-bm-option" data-action="edit-24h">${SVG.calendar} Set reminder: Besok</button>
    <div class="gc-bm-divider"></div>
    <button class="gc-bm-option gc-bm-danger" data-action="delete">${SVG.report} Hapus Bookmark</button>
  `;

  positionMenu(menu, btn);

  menu.querySelectorAll(".gc-bm-option").forEach((opt) => {
    opt.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = opt.dataset.action;
      try {
        if (action === "delete") {
          if (bookmarkId) await ajax(`/bookmarks/${bookmarkId}`, { type: "DELETE" });
          btn.classList.remove("is-bookmarked");
          delete btn.dataset.bookmarkId;
          // Sync sibling buttons
          document.querySelectorAll(".gc-topic-bookmark-btn").forEach((b) => {
            if (b === btn) return;
            b.classList.remove("is-bookmarked");
            delete b.dataset.bookmarkId;
          });
        } else if (action === "edit-2h" && bookmarkId) {
          const date = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
          await ajax(`/bookmarks/${bookmarkId}`, { type: "PUT", data: { reminder_at: date } });
        } else if (action === "edit-24h" && bookmarkId) {
          const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await ajax(`/bookmarks/${bookmarkId}`, { type: "PUT", data: { reminder_at: date } });
        }
      } catch (err) {
        popupAjaxError(err);
      }
      menu.remove();
    });
  });

  autoCloseMenu(menu, btn);
}

function positionMenu(menu, btn) {
  document.body.appendChild(menu);
  const rect = btn.getBoundingClientRect();
  menu.style.position = "absolute";
  menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
  let left = rect.left + window.scrollX + rect.width / 2 - 100;
  if (left < 10) left = 10;
  if (left + 200 > window.innerWidth) left = window.innerWidth - 210;
  menu.style.left = `${left}px`;
}

function autoCloseMenu(menu, btn) {
  setTimeout(() => {
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && e.target !== btn) menu.remove();
    }, { once: true });
  }, 0);
}

// ─── Flag / Report ───────────────────────────────────────────

export function openFlagModal(post) {
  const modalService = API.instance.container?.lookup("service:modal");
  if (modalService?.show) {
    import("discourse/components/modal/flag-post")
      .then((module) => {
        modalService.show(module.default, {
          model: { flagTarget: post, flagTopic: false },
        });
      })
      .catch(() => flagPostFallback(post.id));
    return;
  }
  const modalsController = API.instance.container?.lookup("controller:modals");
  if (modalsController?.show) {
    modalsController.show("flag", { post, flagTopic: false });
    return;
  }
  flagPostFallback(post.id);
}

async function flagPostFallback(postId) {
  if (!window.confirm("Laporkan komentar ini sebagai tidak pantas?")) return;
  try {
    await ajax("/post_actions", {
      type: "POST",
      data: { id: postId, post_action_type_id: 4, flag_topic: false },
    });
  } catch (err) {
    popupAjaxError(err);
  }
}

// ─── Edit Post ───────────────────────────────────────────────

export async function openEditComposer(postId, topicModel) {
  try {
    const res = await ajax(`/posts/${postId}`, { type: "GET" });
    const postData = res?.post || res;
    
    let postModel = postData;
    if (Post && Post.create && postData?.id) {
      postModel = Post.create(postData);
      if (topicModel) {
        postModel.set("topic", topicModel);
      }
    }

    openComposer({
      action: "edit",
      post: postModel,
      draftKey: postData.draft_key || `post_${postId}`,
    });
  } catch (err) {
    popupAjaxError(err);
  }
}

// ─── Topic Card Clicks ───────────────────────────────────────

export function bindTopicCardClicks() {
  const feed = document.getElementById("gc-topic-feed");
  if (!feed || feed._clickBound) return;
  feed._clickBound = true;

  feed.addEventListener("click", async (e) => {
    const card = e.target.closest(".gc-topic-card");
    if (!card) return;
    const topicId = parseInt(card.dataset.topicId);
    const topicSlug = card.dataset.topicSlug;
    if (!topicId) return;

    feed.querySelectorAll(".gc-topic-card").forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    STATE.activeTopicId = topicId;
    STATE.expandedReplies = {};

    const detail = document.getElementById("gc-topic-detail");
    if (detail) {
      detail.innerHTML = `<div class="gc-detail-inner">${[1, 2, 3]
        .map(
          () => `
        <div class="gc-skeleton" style="height:18px;width:80%;margin-bottom:10px"></div>
        <div class="gc-skeleton" style="height:12px;width:95%;margin-bottom:6px"></div>
        <div class="gc-skeleton" style="height:200px;width:100%;margin-bottom:10px;border-radius:10px"></div>
      `,
        )
        .join("")}</div>`;
    }

    const { topic, posts } = await fetchTopicPosts(topicId, topicSlug);
    const fallbackTopic = STATE.allTopics.find((t) => t.id === topicId);
    if (detail) {
      detail.innerHTML = buildTopicDetail(topic || fallbackTopic, posts);
      detail.scrollTop = 0;
      bindDetailActions(detail, topic || fallbackTopic, posts);
    }
  });
}

// ─── Load More ───────────────────────────────────────────────

export function bindLoadMore() {
  document.getElementById("gc-load-more-btn")?.addEventListener("click", async () => {
    if (STATE.isLoadingMore || !STATE.moreTopicsUrl) return;
    STATE.isLoadingMore = true;

    const btn = document.getElementById("gc-load-more-btn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Memuat...";
    }

    const { topics: newTopics, moreUrl } = await fetchCategoryTopics(STATE.moreTopicsUrl);
    STATE.moreTopicsUrl = moreUrl;
    STATE.allTopics = [...STATE.allTopics, ...newTopics];
    STATE.availableTags = extractTagsFromTopics(STATE.allTopics);

    document.getElementById("gc-load-more-wrap")?.remove();

    const feed = document.getElementById("gc-topic-feed");
    if (feed && newTopics.length) {
      const frag = document.createDocumentFragment();
      newTopics.forEach((t) => {
        const div = document.createElement("div");
        div.innerHTML = buildTopicCard(t);
        if (div.firstElementChild) frag.appendChild(div.firstElementChild);
      });
      feed.appendChild(frag);

      if (STATE.moreTopicsUrl) {
        const wrap = document.createElement("div");
        wrap.innerHTML = buildLoadMoreButton();
        feed.appendChild(wrap.firstElementChild);
        bindLoadMore();
      }

      const latestBadge = document.getElementById("gc-badge-latest");
      const trendingBadge = document.getElementById("gc-badge-trending");
      if (latestBadge) latestBadge.textContent = STATE.allTopics.length;
      if (trendingBadge)
        trendingBadge.textContent = STATE.allTopics.filter(isTrending).length;

      applyAllFilters();
    }

    STATE.isLoadingMore = false;
  });
}

// ─── Detail Actions ──────────────────────────────────────────

export function bindDetailActions(container, topic, posts) {
  const currentUser = API.instance?.getCurrentUser?.();

  const requireLogin = () => {
    if (!currentUser) {
      API.instance?.container?.lookup("route:application")?._router?.transitionTo("login");
      return false;
    }
    return true;
  };

  // Main reply
  container.querySelectorAll(".gc-main-reply-btn, .gc-topic-reply-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (btn.dataset.scroll === "true") {
        const detailWrap = document.getElementById("gc-topic-detail");
        const commentsHeader = document.querySelector(".gc-comments-header");
        if (detailWrap && commentsHeader) {
          const wrapRect = detailWrap.getBoundingClientRect();
          const headerRect = commentsHeader.getBoundingClientRect();
          detailWrap.scrollBy({ top: headerRect.top - wrapRect.top - 20, behavior: "smooth" });
        }
      }

      if (!requireLogin()) return;
      
      let topicModel = topic;
      if (Topic && Topic.create && topic?.id) {
        topicModel = Topic.create(topic);
      }

      openComposer({ action: "reply", topic: topicModel, draftKey: topicModel?.draft_key });
    });
  });

  // Like / Unlike for topic (first post)
  container.querySelectorAll(".gc-topic-like-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled || btn.hasAttribute("disabled") || btn.style.cursor === "not-allowed") return;
      if (!requireLogin()) return;
      
      const postId = btn.dataset.postId;
      if (!postId) return;

      const isLiked = btn.classList.contains("is-liked");
      const currentCount = parseInt(btn.querySelector(".gc-like-count")?.textContent || "0") || 0;
      const optimisticCount = currentCount + (isLiked ? -1 : 1);

      const updateButtons = (liked, count) => {
        document.querySelectorAll(".gc-topic-like-btn").forEach((b) => {
          b.classList.toggle("is-liked", liked);
          const existingSvg = b.querySelector("svg");
          if (existingSvg) existingSvg.outerHTML = liked ? SVG.heartFilled : SVG.heartOutline;
          const countEl = b.querySelector(".gc-like-count");
          if (countEl) countEl.textContent = count > 0 ? count : "0"; 
        });
      };

      updateButtons(!isLiked, optimisticCount);

      try {
        if (isLiked) {
          await ajax(`/post_actions/${postId}`, {
            type: "DELETE",
            data: { post_action_type_id: 2 },
          });
        } else {
          const result = await ajax("/post_actions", {
            type: "POST",
            data: { id: postId, post_action_type_id: 2, flag_topic: false },
          });
          const serverCount = result?.post?.actions_summary?.find((a) => a.id === 2)?.count;
          if (serverCount !== undefined) {
             updateButtons(true, serverCount);
          }
        }
      } catch (err) {
        updateButtons(isLiked, currentCount);
        popupAjaxError(err);
      }
    });
  });

  // Bookmark topic
  container.querySelectorAll(".gc-topic-bookmark-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!requireLogin() || !topic) return;
      await toggleBookmark(btn, "Topic", topic.id);
      // Sync all other bookmark buttons in the same detail view
      const isNowBookmarked = btn.classList.contains("is-bookmarked");
      const newBookmarkId = btn.dataset.bookmarkId;
      container.querySelectorAll(".gc-topic-bookmark-btn").forEach((b) => {
        if (b === btn) return;
        if (isNowBookmarked) {
          b.classList.add("is-bookmarked");
          if (newBookmarkId) b.dataset.bookmarkId = newBookmarkId;
        } else {
          b.classList.remove("is-bookmarked");
          delete b.dataset.bookmarkId;
        }
      });
    });
  });

  // Share topic
  container.querySelectorAll(".gc-topic-share-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!topic) return;
      const url = `${window.location.origin}/t/${topic.slug || topic.id}/${topic.id}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: topic.title, url });
        } catch (_) {}
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        btn.classList.add("is-copied");
        setTimeout(() => btn.classList.remove("is-copied"), 1500);
      }
    });
  });

  // Like / Unlike per comment
  container.querySelectorAll(".gc-comment-like").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled || btn.hasAttribute("disabled")) return;
      if (!requireLogin()) return;
      const postId = btn.dataset.postId;
      const isLiked = btn.classList.contains("is-liked");
      const countEl = btn.querySelector(".gc-like-count");
      const currentCount = parseInt(countEl?.textContent || "0") || 0;
      const optimisticCount = currentCount + (isLiked ? -1 : 1);

      btn.classList.toggle("is-liked");
      const nowLiked = btn.classList.contains("is-liked");
      btn.innerHTML = `${nowLiked ? SVG.heartFilled : SVG.heartOutline}<span class="gc-like-count">${optimisticCount > 0 ? optimisticCount : ""}</span>`;

      try {
        if (isLiked) {
          await ajax(`/post_actions/${postId}`, {
            type: "DELETE",
            data: { post_action_type_id: 2 },
          });
        } else {
          const result = await ajax("/post_actions", {
            type: "POST",
            data: { id: postId, post_action_type_id: 2, flag_topic: false },
          });
          const serverCount = result?.post?.actions_summary?.find((a) => a.id === 2)?.count;
          if (serverCount !== undefined) {
            btn.querySelector(".gc-like-count").textContent =
              serverCount > 0 ? serverCount : "";
          }
        }
      } catch (err) {
        btn.classList.toggle("is-liked");
        const rolledBack = btn.classList.contains("is-liked");
        btn.innerHTML = `${rolledBack ? SVG.heartFilled : SVG.heartOutline}<span class="gc-like-count">${currentCount > 0 ? currentCount : ""}</span>`;
        popupAjaxError(err);
      }
    });
  });

  // More (...) dropdown
  container.querySelectorAll(".gc-comment-more").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll(".gc-more-menu").forEach((m) => m.remove());

      const postId = btn.dataset.postId;
      const post = posts.find((p) => String(p.id) === String(postId));
      const canEdit =
        post && (post.yours || currentUser?.staff || currentUser?.moderator);

      const menu = document.createElement("div");
      menu.className = "gc-more-menu";
      menu.innerHTML = `
        ${canEdit ? `<button class="gc-more-item" data-action="edit">${SVG.save} Edit</button>` : ""}
        ${currentUser ? `<button class="gc-more-item gc-more-item--danger" data-action="report">${SVG.report} Laporkan</button>` : ""}
        ${canEdit ? `<button class="gc-more-item gc-more-item--danger" data-action="delete">${SVG.report} Hapus</button>` : ""}
      `;

      btn.style.position = "relative";
      btn.appendChild(menu);

      menu.querySelector('[data-action="edit"]')?.addEventListener("click", () => {
        let topicModel = topic;
        if (Topic && Topic.create && topic?.id) {
          topicModel = Topic.create(topic);
        }
        openEditComposer(postId, topicModel);
        menu.remove();
      });



      menu.querySelector('[data-action="report"]')?.addEventListener("click", () => {
        if (post) openFlagModal(post);
        menu.remove();
      });

      menu.querySelector('[data-action="delete"]')?.addEventListener("click", async () => {
        if (!window.confirm("Hapus komentar ini?")) {
          menu.remove();
          return;
        }
        try {
          await ajax(`/posts/${postId}`, { type: "DELETE" });
          btn.closest(".gc-comment")?.remove();
        } catch (err) {
          popupAjaxError(err);
        }
        menu.remove();
      });

      setTimeout(() => {
        document.addEventListener("click", () => menu.remove(), { once: true });
      }, 0);
    });
  });

  // Per-comment "Balas"
  container.querySelectorAll(".gc-comment-reply-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!requireLogin()) return;
      
      const postNumber = btn.dataset.postNumber;
      const targetPost = posts.find(
        (p) => String(p.post_number) === String(postNumber),
      );
      if (!targetPost || !topic) return;

      let topicModel = topic;
      if (Topic && Topic.create && topic?.id) {
        topicModel = Topic.create(topic);
      }

      let postModel = targetPost;
      if (Post && Post.create && targetPost?.id) {
        postModel = Post.create(targetPost);
        // Discourse composer expects the topic relation to be present on the post
        postModel.set("topic", topicModel);
      } else {
        postModel.topic = topicModel;
      }

      openComposer({
        action: "reply",
        topic: topicModel,
        post: postModel,
        draftKey: targetPost.draft_key || `post_${targetPost.id}`,
      });
    });
  });

  // Replies pill — expand / collapse nested comments
  container.querySelectorAll(".gc-replies-pill").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postId = btn.dataset.postId;
      const isExpanded = btn.dataset.expanded === "true";
      const commentEl = btn.closest(".gc-comment");
      const nestedContainer = commentEl?.querySelector(".gc-nested-replies");
      if (!nestedContainer) return;

      const replyCount = btn.textContent.trim().match(/\d+/)?.[0] || "0";
      const countText = `${replyCount} Balasan`;

      if (isExpanded) {
        nestedContainer.style.display = "none";
        btn.dataset.expanded = "false";
        STATE.expandedReplies[postId] = false;
        btn.innerHTML = `${SVG.chevronDown} ${countText}`;
      } else {
        if (!nestedContainer.innerHTML.trim()) {
          btn.classList.add("is-loading");
          btn.disabled = true;
          const post = posts.find((p) => String(p.id) === String(postId));
          const topicId = topic?.id || STATE.activeTopicId;
          if (post && topicId) {
            const replies = await fetchPostReplies(topicId, post.post_number);
            if (replies.length > 0) {
              nestedContainer.innerHTML = replies
                .map((r) => buildCommentHTML(r, true))
                .join("");
              bindDetailActions(nestedContainer, topic, [...posts, ...replies]);
            } else {
              nestedContainer.innerHTML = `<p class="gc-no-replies">Belum ada balasan.</p>`;
            }
          }
          btn.classList.remove("is-loading");
          btn.disabled = false;
        }
        nestedContainer.style.display = "";
        btn.dataset.expanded = "true";
        STATE.expandedReplies[postId] = true;
        btn.innerHTML = `${SVG.chevronUp} ${countText}`;
      }
    });
  });
}

// ─── Action Bar ──────────────────────────────────────────────

export function bindActionBar() {
  document.addEventListener("click", (e) => {
    const pill = e.target.closest(".gc-pill");
    if (!pill) return;
    document.querySelectorAll(".gc-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    STATE.activeFilter = pill.dataset.pill;
    applyAllFilters();
  });

  document.getElementById("gc-filter-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllPopups();
    STATE.filterOpen = true;
    document.getElementById("gc-filter-btn")?.classList.add("active");
    const el = document.createElement("div");
    el.innerHTML = buildFilterPopup();
    document.querySelector(".gc-icon-buttons").appendChild(el.firstElementChild);
    bindFilterPopup();
  });

  document.getElementById("gc-date-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllPopups();
    STATE.dateOpen = true;
    document.getElementById("gc-date-btn")?.classList.add("active");
    const el = document.createElement("div");
    el.innerHTML = buildDatePopup();
    document.querySelector(".gc-icon-buttons").appendChild(el.firstElementChild);
    bindDatePopup();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#gc-filter-popup,#gc-filter-btn,#gc-date-popup,#gc-date-btn")) {
      closeAllPopups();
    }
  });
}

export function closeAllPopups() {
  document.getElementById("gc-filter-popup")?.remove();
  document.getElementById("gc-date-popup")?.remove();
  document.getElementById("gc-filter-btn")?.classList.remove("active");
  document.getElementById("gc-date-btn")?.classList.remove("active");
  STATE.filterOpen = false;
  STATE.dateOpen = false;
}

export function bindFilterPopup() {
  document
    .getElementById("gc-filter-popup")
    ?.querySelectorAll("input[type='checkbox']")
    .forEach((cb) => {
      cb.addEventListener("change", () => {
        const val = cb.dataset.filter;
        if (cb.checked) {
          if (!STATE.selectedFilters.includes(val)) STATE.selectedFilters.push(val);
        } else {
          STATE.selectedFilters = STATE.selectedFilters.filter((f) => f !== val);
        }
        applyAllFilters();
      });
    });
}

export function bindDatePopup() {
  const popup = document.getElementById("gc-date-popup");
  if (!popup) return;

  popup.querySelector("#gc-date-prev")?.addEventListener("click", () => navigateCalendar(-1));
  popup.querySelector("#gc-date-next")?.addEventListener("click", () => navigateCalendar(1));

  popup.querySelector("#gc-date-clear")?.addEventListener("click", () => {
    STATE.dateRange = { start: null, end: null };
    applyAllFilters();
    refreshDatePopup();
  });

  popup.querySelectorAll(".gc-cal-day").forEach((day) => {
    const ts = parseInt(day.dataset.ts);
    if (!ts) return;
    day.addEventListener("click", () => {
      if (!STATE.dateRange.start || (STATE.dateRange.start && STATE.dateRange.end)) {
        STATE.dateRange = { start: ts, end: null };
      } else {
        STATE.dateRange =
          ts < STATE.dateRange.start
            ? { start: ts, end: STATE.dateRange.start }
            : { start: STATE.dateRange.start, end: ts };
      }
      applyAllFilters();
      refreshDatePopup();
    });
  });
}

function navigateCalendar(dir) {
  const adj = (y, m) => {
    m += dir;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    return { year: y, month: m };
  };
  STATE.calendarMonth = {
    left: adj(STATE.calendarMonth.left.year, STATE.calendarMonth.left.month),
    right: adj(STATE.calendarMonth.right.year, STATE.calendarMonth.right.month),
  };
  refreshDatePopup();
}

function refreshDatePopup() {
  const old = document.getElementById("gc-date-popup");
  if (!old) return;
  const iconBtns = document.querySelector(".gc-icon-buttons");
  old.remove();
  const el = document.createElement("div");
  el.innerHTML = buildDatePopup();
  iconBtns.appendChild(el.firstElementChild);
  bindDatePopup();
}

export function bindSearch() {
  document.getElementById("gc-search-input")?.addEventListener("input", (e) => {
    STATE.searchQuery = e.target.value;
    applyAllFilters();
  });
}
