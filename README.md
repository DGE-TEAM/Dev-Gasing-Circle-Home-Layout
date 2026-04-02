# Gasing Circle — Homepage Dashboard Theme Component

Replaces the standard Discourse discovery (topic list) homepage with a
**multi-column, widget-based dashboard** styled after the target Figma design.

---

## File Structure

```
gasing-homepage/
├── about.json
├── settings.yml                          ← Admin-editable config
├── common/
│   ├── common.scss                       ← All CSS variables, layout, cards
│   └── dashboard-overrides.scss          ← Body-class hides for default list
└── javascripts/
    └── discourse/
        └── api-initializers/
            └── homepage-dashboard.js     ← Full dashboard engine
```

---

## Installation

Same process as the Academy News component:

1. **Admin → Customize → Themes → Install → From ZIP file**
2. Upload `gasing-homepage.zip`
3. Enable and associate with your active theme

> Both this component and `gasing-circle-theme` (for the Academy News category)
> can be active at the same time — they target different routes and don't conflict.

---

## Architecture Q&A (from the brief)

### "Should I override `discovery.hbs` or use `registerConnector`?"

**Neither — we use pure DOM injection.**

| Approach | Pros | Cons |
|---|---|---|
| `discovery.hbs` override | Clean Ember way | Breaks on Discourse updates; hard to scope to homepage only |
| `api.registerConnector` | Supported API | Connectors add content *alongside* the existing list, not *replacing* it; CSS removal is still needed |
| **DOM injection via `onPageChange`** (chosen) | Zero Ember internals; scoped to homepage only; auto-cleans on navigate away | Requires body-class CSS trick to hide original list |

The chosen approach:
1. `api.onPageChange(url)` fires on every SPA navigation
2. If `url` is the homepage, we prepend `#gh-dashboard-wrapper` to `#main-outlet`
3. A `body.gh-dashboard-active` class is added → CSS hides the standard topic list
4. On navigating *away*, `unmountDashboard()` removes the element and the class

### "Why not `api.registerConnector`?"

`registerConnector("discovery-list-container-top", ...)` would inject content
*above* the topic list — but we need to *replace* the list entirely. We'd still
need the body-class CSS trick. The DOM injection approach is simpler and gives
us full control over the render lifecycle.

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HERO BANNER (full width, gradient blue→teal)               │
│  "Selamat Datang, [Username]!"  CTA button  Illustrations   │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────┬──────────────────────────────────┐
│  Eksklusif Konten (promo)│  Virtual Meet-Up Selanjutnya     │
│  (static card + badge)   │  (2 event tiles, fetched API)    │
└──────────────────────────┴──────────────────────────────────┘
┌────────────────────────────────────┬────────────────────────┐
│  Ada Apa di Komunitas Gasing?      │  Gasing Academy News   │
│  (Trending / Latest tabs)          │  (thumbnailed list)    │
│  ← fetched from /c/forum           │  ← /c/gasing-academy…  │
└────────────────────────────────────┴────────────────────────┘
┌────────────────────────────────────┬────────────────────────┐
│  Ayo Belajar Gasing Bersama!       │  Game Card             │
│  (Latest only, no tabs)            │  Katak dan Daun Teratai│
│  ← fetched from /c/materi-gasing   │  (static promo card)   │
└────────────────────────────────────┴────────────────────────┘
```

---

## Data Fetching

All topic data is fetched via Discourse's **public JSON API** — no custom
endpoints, no Ruby, no plugin needed:

| Widget | Endpoint | Sort |
|---|---|---|
| Komunitas Gasing (Trending) | `/c/forum.json?order=activity` | activity |
| Komunitas Gasing (Latest) | `/c/forum.json` | latest |
| Gasing Academy News | `/c/gasing-academy-news.json` | latest |
| Belajar Gasing | `/c/materi-gasing.json` | latest |
| Virtual Meet-Up | `/c/virtual-meet-up.json` | latest |

All fetches run **concurrently** via `Promise.all` — the dashboard renders
in one paint after all data arrives.

---

## Adding Illustrations to the Hero

1. Upload your illustration PNGs via **Admin → Customize → Themes → [this theme] → Assets**
2. In `homepage-dashboard.js`, find `buildHero()` and replace the placeholder comment:

```js
// FROM:
<!-- <img src="{{theme_asset 'hero-char-1.png'}}" /> -->

// TO (in the JS string):
<img src="${settings.theme_uploads_local.hero_char_1}" alt="" />
```

Or, use Discourse theme settings of type `upload` in `settings.yml`:
```yaml
hero_character_1:
  type: upload
  default: ""
```
Then reference in JS as `settings.theme_uploads.hero_character_1`.

---

## Adding a Custom Eksklusif Konten Image

Same approach — upload via theme assets and reference in `buildEksklusifCard()`.

---

## Extending Category Slugs

Edit the `CAT` constant at the top of `homepage-dashboard.js`:

```js
const CAT = {
  komunitas: "your-forum-slug",
  news: "your-news-slug",
  belajar: "your-materials-slug",
  meetup: "your-meetup-slug",
};
```

---

## Category Pill Colors

Add new entries to the `catDataKey()` function and corresponding CSS classes
in `common.scss` under section 12 (CATEGORY PILL COLORS).

---

## Discourse Version Compatibility
- Minimum: **3.1.0.beta** (Plugin API 0.8+)
- Tested on: 3.2.x, 3.3.x
- Not compatible with: Discourse versions < 2.9 (no `apiInitializer`)
