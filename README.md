# Gasing Circle — Academy News Theme Component

A Discourse Theme Component implementing a **Master-Detail split-pane layout**
for the `gasing-academy-news` category, matching the Figma redesign.

---

## File Structure

```
gasing-circle-theme/
├── about.json                          # Component metadata
├── settings.yml                        # Admin-configurable settings
├── common/
│   └── common.scss                     # All CSS variables, layout, components
├── mobile.scss                         # Responsive & dark mode overrides
└── javascripts/
    └── discourse/
        ├── api-initializers/
        │   └── custom-layout.js        # Main JS entry — layout engine
        └── templates/
            └── discovery/
                └── topics.hbs          # Template override with mount anchor
```

---

## Installation

### Method A — Admin UI (Recommended)

1. Go to **Admin → Customize → Themes**
2. Click **Install** → **From a git repository**
3. Enter your repo URL (or use **Upload** if you have a zip)
4. Once installed, click the component and toggle **Enabled**
5. Add it as a component to your active theme

### Method B — Direct ZIP Upload

1. Zip the entire `gasing-circle-theme/` folder
2. Go to **Admin → Customize → Themes → Install → From ZIP file**
3. Upload the ZIP, then enable and associate with your theme

---

## Configuration (settings.yml)

| Key | Default | Description |
|-----|---------|-------------|
| `hero_title` | `Gasing Academy News` | Hero banner heading |
| `hero_subtitle` | `Ikuti berita…` | Subtitle below heading |
| `target_category_slug` | `gasing-academy-news` | Category to activate on |
| `filter_labels` | `Pendidikan\|Pelatihan\|Dunia\|Lainnya` | Pipe-separated filter tags |

---

## Architecture Decisions

### Why JS injection instead of full Ember override?

Discourse's topic list is rendered by complex Ember components
(`Discovery::Layout`, `TopicList`, etc.) with router-managed state.
A full Ember override requires either a full plugin (Ruby + JS) or
risks breaking on Discourse updates.

**The chosen approach:**

1. The `topics.hbs` template override inserts a `#gc-discovery-anchor` mount point
   **before** the standard `<Discovery::Layout>` component.
2. The CSS hides the standard layout for the target category.
3. The JS `GasingNewsLayout` class mounts into that anchor, fetches topics
   via Discourse's public JSON API (`/c/slug.json`, `/t/id.json`), and
   renders the full Master-Detail UI imperatively.
4. `api.onPageChange()` handles SPA navigation (unmounts on other pages,
   remounts on return).
5. A `MutationObserver` catches async Ember renders as a fallback.

This is the **most stable** approach — zero Ember internals touched,
survives Discourse upgrades cleanly.

### Master-Detail "split pane"

- Left: scrollable topic card list (`gc-topic-feed`)
- Right: inline reading pane (`gc-reading-pane`) populated via `/t/:id.json`
- Clicking a card fetches the full post stream and renders it in the pane
- **No page navigation** — URL stays at the category page (tradeoff: no deep-linking per topic)
- For mobile: right pane overlays full screen with a back button

### Filter & Date Popup

Both are pure HTML/CSS dropdowns positioned relatively to their trigger buttons.
They close on any outside `document` click via a single delegated listener.
No external libraries needed — lightweight and compatible with all Discourse versions.

---

## Known Limitations & Workarounds

| Limitation | Workaround |
|------------|-----------|
| URL doesn't update per-topic (no deep link) | Acceptable tradeoff for SPA-style pane; can add `history.pushState` if needed |
| Discourse updates may change outlet structure | MutationObserver + `onPageChange` provides resilience |
| Topic images require `image_url` in API response | Enabled via `serialize_topic_excerpts: true` in about.json |
| Very long post streams (200+ replies) | Pane only loads first page; add paginator if needed |

---

## Extending

### Add topic image thumbnails
Enable in site settings: **Admin → Settings → search "crawl images"**
→ enable `crawl_images` and `embed_thumbnails`.

### Custom tag color mapping
Edit `getTagClass()` in `custom-layout.js` and add CSS classes in `common.scss`.

### Enable deep-linking per topic
After `this.fetchPostsForTopic(topic.id)`, add:
```js
history.pushState(null, "", `/t/${topic.slug}/${topic.id}`);
```

---

## Browser Support
Chrome 88+, Firefox 85+, Safari 14+, Edge 88+

## Discourse Version
Minimum: 3.1.0.beta (Plugin API 0.8+)
Tested on: 3.2.x, 3.3.x
