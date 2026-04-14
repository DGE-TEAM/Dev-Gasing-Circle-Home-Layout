import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { service } from "@ember/service";
import { action } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import getURL from "discourse-common/lib/get-url";
import {
  ENDPOINTS,
  extractTopics,
  mapTopics,
  mapNews,
} from "../lib/homepage-api";

export default class GasingHomepage extends Component {
  @service currentUser;
  @service router;
  @service siteSettings;

  @tracked trendingTopics = [];
  @tracked latestTopics = [];
  @tracked newsTopics = [];
  @tracked materiTopics = [];
  @tracked meetupTopics = [];
  @tracked exclusiveTopic = null;
  @tracked minigameTopic = null;
  @tracked heroRegisteredCount = 0;
  @tracked activeTab = "trending";
  @tracked isLoading = true;

  constructor() {
    super(...arguments);
    document.body.classList.add("gasing-home-active");
    this.fetchAllData();
  }

  willDestroy() {
    super.willDestroy(...arguments);
    document.body.classList.remove("gasing-home-active");
  }

  // ─── Theme asset URLs ──────────────────────────────────────────────────────
  //
  // Asset yang didaftarkan di about.json diekspos oleh Discourse saat runtime
  // via `__theme_upload_url(key)`. Fallback `settings.theme_uploads` untuk
  // versi Discourse yang lebih lama.

  get mascotCreativityUrl()    { return this._themeAssetUrl("mascot_creativity"); }
  get mascotLogicUrl()         { return this._themeAssetUrl("mascot_logic"); }
  get mascotCommunicationUrl() { return this._themeAssetUrl("mascot_communication"); }
  get heroBgUrl()              { return this._themeAssetUrl("hero_bg"); }

  _themeAssetUrl(key) {
    // eslint-disable-next-line no-undef
    if (typeof __theme_upload_url === "function") { return __theme_upload_url(key); }
    if (typeof settings !== "undefined" && settings.theme_uploads?.[key]) {
      return getURL(settings.theme_uploads[key]);
    }
    return "";
  }

  // ─── User ─────────────────────────────────────────────────────────────────

  get displayName() {
    return this.currentUser?.name ?? this.currentUser?.username ?? "Pengunjung";
  }

  get isLoggedIn() {
    return !!this.currentUser;
  }

  get visibleTopics() {
    return this.activeTab === "trending" ? this.trendingTopics : this.latestTopics;
  }

  @action
  switchTab(tab) {
    this.activeTab = tab;
  }

  // ─── Data fetching ────────────────────────────────────────────────────────

  async fetchAllData() {
    try {
      // Jalankan section topics dan hero count secara paralel
      await Promise.all([
        this._fetchTopicSections(),
        this._fetchHeroCount(),
      ]);
    } catch (e) {
      console.error("GasingHomepage: fetchAllData failed", e);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch semua section topic homepage secara paralel.
   * Setiap request bersifat independen — kegagalan satu tidak memblokir lainnya.
   */
  async _fetchTopicSections() {
    const results = await Promise.allSettled([
      ajax(ENDPOINTS.trending),
      ajax(ENDPOINTS.latest),
      ajax(ENDPOINTS.news),
      ajax(ENDPOINTS.materi),
      ajax(ENDPOINTS.meetup),
      ajax(ENDPOINTS.exclusive),
      ajax(ENDPOINTS.minigame),
    ]);

    const [
      trendingRes,
      latestRes,
      newsRes,
      materiRes,
      meetupRes,
      exclusiveRes,
      minigameRes,
    ] = results;

    if (extractTopics(trendingRes).length) {
      this.trendingTopics = mapTopics(extractTopics(trendingRes).slice(0, 5));
    }
    if (extractTopics(latestRes).length) {
      this.latestTopics = mapTopics(extractTopics(latestRes).slice(0, 5));
    }
    if (extractTopics(newsRes).length) {
      this.newsTopics = mapNews(extractTopics(newsRes).slice(0, 3));
    }
    if (extractTopics(materiRes).length) {
      this.materiTopics = mapTopics(extractTopics(materiRes).slice(0, 5));
    }
    if (extractTopics(meetupRes).length) {
      this.meetupTopics = mapNews(extractTopics(meetupRes).slice(0, 2));
    }

    const exclusiveAll = mapNews(extractTopics(exclusiveRes));
    this.exclusiveTopic = exclusiveAll[0] ?? null;

    const minigameAll = mapTopics(extractTopics(minigameRes));
    this.minigameTopic = minigameAll[0] ?? null;
  }

  /**
   * Fetch jumlah pendaftar dari topic hero CTA (jika link mengarah ke topic).
   * Non-critical — kegagalan diabaikan agar tidak memblokir loading utama.
   */
  async _fetchHeroCount() {
    const heroLink = this.siteSettings.hero_cta_link;
    if (!heroLink?.startsWith("/t/")) return;
    try {
      const path = heroLink.split(/[?#]/)[0];
      const res = await ajax(`${path}.json`);
      this.heroRegisteredCount = res?.posts_count ? res.posts_count - 1 : 0;
    } catch {
      // Biarkan heroRegisteredCount tetap 0
    }
  }
}
