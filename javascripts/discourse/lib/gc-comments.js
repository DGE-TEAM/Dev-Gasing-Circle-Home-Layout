// ─────────────────────────────────────────────────────────────
// gc-comments.js — Comment & topic detail HTML builders
// ─────────────────────────────────────────────────────────────

import moment from "moment";
import { STATE } from "./gc-state";
import { SVG } from "./gc-icons";
import { renderTag, getTopicTag } from "./gc-tags";

export function getLikeData(post) {
  const a = post.actions_summary?.find((x) => x.id === 2);
  let canAct = a?.can_act;
  if (post.yours) canAct = false;
  return { count: a?.count || 0, liked: a?.acted || false, canAct };
}

export function getUserRole(post) {
  if (post.user_title) return post.user_title;
  if (post.primary_group_name) return post.primary_group_name;
  if (post.staff) return "Trainer Utama";
  if ((post.trust_level || 0) >= 3) return "Trainer Kelas";
  return "";
}

export function buildCommentHTML(post, isNested) {
  const av = (post.avatar_template || "").replace("{size}", "40");
  const role = getUserRole(post);
  const timeAgo = moment(post.created_at).fromNow();
  const { count: likeCount, liked, canAct } = getLikeData(post);
  const hasReplies = (post.reply_count || 0) > 0;
  const isExpanded = STATE.expandedReplies[post.id] || false;

  return `
    <div class="gc-comment${isNested ? " gc-comment--nested" : ""}" data-post-id="${post.id}" data-post-number="${post.post_number}">
      <div class="gc-comment-avatar-wrap">
        <img class="gc-comment-avatar" src="${av}" alt="${post.name || post.username}" loading="lazy" />
      </div>
      <div class="gc-comment-body">
        <div class="gc-comment-header">
          <span class="gc-comment-author">${post.name || post.username}</span>
          ${role ? `<span class="gc-comment-role">${role}</span>` : ""}
          <span class="gc-comment-time">${timeAgo}</span>
        </div>
        <div class="gc-comment-text">${post.cooked}</div>
        <div class="gc-comment-actions">
          ${
            hasReplies
              ? `<button class="gc-replies-pill" data-post-id="${post.id}" data-expanded="${isExpanded}">
              ${isExpanded ? SVG.chevronUp : SVG.chevronDown}
              ${post.reply_count} Balasan
            </button>`
              : ""
          }
          <div class="gc-comment-actions-right">
            <button class="gc-comment-like${liked ? " is-liked" : ""}" data-post-id="${post.id}" ${canAct === false ? 'disabled style="cursor: not-allowed; opacity: 0.5;" title="Anda tidak dapat menyukai komentar ini."' : ""}>
              ${liked ? SVG.heartFilled : SVG.heartOutline}
              <span class="gc-like-count">${likeCount > 0 ? likeCount : ""}</span>
            </button>
            <button class="gc-comment-more" data-post-id="${post.id}">${SVG.more}</button>
            <button class="gc-comment-reply-btn" data-post-id="${post.id}" data-post-number="${post.post_number}" data-username="${post.username}">
              ${SVG.reply} Balas
            </button>
          </div>
        </div>
        ${hasReplies ? `<div class="gc-nested-replies" data-parent-post-id="${post.id}"${isExpanded ? "" : ` style="display:none"`}></div>` : ""}
      </div>
    </div>`;
}

export function buildTopicDetail(topic, posts) {
  if (!topic) {
    return `<div id="gc-empty-detail">${SVG.newspaper}<p>Pilih artikel untuk membaca</p></div>`;
  }

  const tag = getTopicTag(topic);
  const tagHtml = tag ? renderTag(tag) : "";
  const likes = topic.like_count || 0;
  const replies =
    topic.reply_count || (topic.posts_count ? topic.posts_count - 1 : 0);
  const views = topic.views || 0;
  const isBookmarked = topic.bookmarked || false;
  const bookmarkId = topic.bookmark_id || "";
  const bookmarkAttrs = `${isBookmarked ? " is-bookmarked" : ""}` ;
  const bookmarkData = bookmarkId ? ` data-bookmark-id="${bookmarkId}"` : "";

  const firstPost = posts?.[0];
  const fpLike = firstPost ? getLikeData(firstPost) : null;
  const topicLikeCount = fpLike ? fpLike.count : likes;
  const topicLiked = fpLike ? fpLike.liked : false;
  const topicCanAct = fpLike ? fpLike.canAct : true;

  let bodyText = (firstPost?.cooked || `<p>${topic.excerpt || ""}</p>`).trim();

  const subtitleText = topic.excerpt
    ? topic.excerpt.replace(/<[^>]*>/g, "").trim()
    : "";

  if (subtitleText) {
    const norm = (s) =>
      s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    const ns = norm(subtitleText).substring(0, 80);
    bodyText = bodyText
      .replace(/^(<p>)([\s\S]*?)(<\/p>)/, (m, o, inner, c) =>
        norm(inner).substring(0, 80).startsWith(ns) ? "" : m,
      )
      .trim();
  }

  const topLevelPosts =
    posts
      ?.slice(1)
      .filter((p) => !p.reply_to_post_number && p.post_type === 1) || [];
  const commentsHtml = topLevelPosts
    .map((p) => buildCommentHTML(p, false))
    .join("");

  return `
    <div class="gc-detail-inner">
      <div class="gc-detail-date">${moment(topic.created_at).format("D MMM YYYY")} ${tagHtml}</div>
      <h2 class="gc-detail-title">${topic.title}</h2>
      ${subtitleText ? `<p class="gc-detail-subtitle">${subtitleText}</p>` : ""}
      ${firstPost?.name || firstPost?.username ? `<p class="gc-detail-author">By <strong>${firstPost.name || firstPost.username}</strong></p>` : ""}
      <hr class="gc-detail-sep" />
      <div class="gc-stats-row gc-stats-top">
        <div class="gc-stats-left">
          <span class="gc-stat gc-topic-like-btn${topicLiked ? " is-liked" : ""}" data-post-id="${firstPost?.id || ""}" ${topicCanAct === false ? 'style="cursor: not-allowed; opacity: 0.5;" title="Anda tidak dapat menyukai postingan ini."' : 'style="cursor: pointer;"'}>
            ${topicLiked ? SVG.heartFilled : SVG.heartOutline}<span class="gc-stat-value gc-like-count">${topicLikeCount}</span>
          </span>
          <span class="gc-stat gc-topic-reply-btn" data-scroll="true" style="cursor: pointer;">
            ${SVG.chat}<span class="gc-stat-value">${replies}</span>
          </span>
          <span class="gc-stat">${SVG.eye}<span class="gc-stat-value">${views}</span></span>
        </div>
        <div class="gc-stats-right">
          <button class="gc-action-icon gc-topic-bookmark-btn${bookmarkAttrs}"${bookmarkData}>${SVG.bookmark}</button>
          <button class="gc-action-icon gc-topic-share-btn">${SVG.share}</button>
        </div>
      </div>
      <div class="gc-detail-body">${bodyText}</div>

      <div class="gc-comments-header">
        <div class="gc-main-reply-wrap">
          <button class="gc-main-reply-btn" data-topic-id="${topic.id}">
            ${SVG.reply} Balas
          </button>
        </div>
        <div class="gc-comments-stats-row">
          <div class="gc-cstat-left">
            <span class="gc-cstat gc-topic-like-btn${topicLiked ? " is-liked" : ""}" data-post-id="${firstPost?.id || ""}" ${topicCanAct === false ? 'style="cursor: not-allowed; opacity: 0.5;" title="Anda tidak dapat menyukai postingan ini."' : 'style="cursor: pointer;"'}>
              ${topicLiked ? SVG.heartFilled : SVG.heartOutline}<span class="gc-like-count">${topicLikeCount}</span>
            </span>
            <span class="gc-cstat gc-topic-reply-btn" style="cursor: pointer;">
              ${SVG.chat}<span>${replies}</span>
            </span>
            <span class="gc-cstat">${SVG.eye}<span>${views}</span></span>
          </div>
          <div class="gc-cstat-right">
            <button class="gc-action-icon gc-topic-bookmark-btn${bookmarkAttrs}"${bookmarkData}>${SVG.bookmark}</button>
            <button class="gc-action-icon gc-topic-share-btn">${SVG.share}</button>
          </div>
        </div>
      </div>

      <hr class="gc-detail-sep-bottom" />

      ${topLevelPosts.length > 0 ? `<div class="gc-comments" id="gc-comments-list">${commentsHtml}</div>` : ""}
    </div>`;
}
