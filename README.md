# Gasing Circle — Homepage Dashboard Theme Component

Replaces the standard Discourse discovery (topic list) homepage with a **multi-column, widget-based dashboard** styled after the Gasing design system.

---

## File Structure

```
gasing-home-layout/
├── about.json                  ← Metadata, asset definitions & connector modifiers
├── settings.yml                ← Admin-editable configuration
├── common/
│   └── common.scss             ← Global variables and layout resets
├── stylesheets/
│   └── gasing-homepage.scss    ← Component-specific SCSS (cards, hero, grids)
└── javascripts/
    └── discourse/
        ├── components/
        │   ├── gasing-homepage.js   ← Component logic (Glimmer)
        │   └── gasing-homepage.hbs  ← Component template
        └── connectors/
            └── custom-homepage/
                └── gasing-homepage-connector.hbs ← Injection point
```

---

## Installation

1. **Admin → Customize → Themes → Install → From ZIP file**
2. Upload the repository ZIP or install via Git.
3. Enable and associate with your active theme.
4. Ensure the `custom_homepage` modifier is active (handled by `about.json`).

---

## Architecture

This component uses modern Discourse theme patterns:

- **Glimmer Components**: The entire dashboard is a standalone `<GasingHomepage />` component.
- **Connectors**: The component is injected into the homepage using the `custom-homepage` connector (activated by `"custom_homepage": true` in `about.json`).
- **Data Fetching**: Uses Discourse's internal `ajax` helper to fetch topic lists asynchronously.
- **Scoped Styling**: Uses a `gasing-home-active` body class to manage layout overrides and hide standard Discourse elements when the dashboard is visible.

---

## Dashboard Layout

The dashboard is organized into a hero section and a two-column grid:

| Section | Content Type | Source |
|---|---|---|
| **Hero Banner** | Greeting & CTA | `settings.yml` + Hardcoded |
| **Eksklusif Konten** | Promo Card | Static (in template) |
| **Komunitas Gasing** | Trending / Latest Tabs | `/top/weekly.json` & `/latest.json` |
| **Gasing Library** | Latest Materials | `/c/gasing-library/l/latest.json` |
| **Virtual Meet-Up** | Event Tiles | Static (in template) |
| **Academy News** | News List | `/c/ga-update/l/latest.json` |
| **Mini Game** | Promo Card | Static (in template) |

---

## Data Fetching

All data is fetched via Discourse's **public JSON API** using `Promise.allSettled` for performance:

| Widget | Endpoint | Count |
|---|---|---|
| Komunitas (Trending) | `/top/weekly.json` | 5 topics |
| Komunitas (Latest) | `/latest.json` | 5 topics |
| Academy News | `/c/ga-update/l/latest.json` | 3 topics |
| Gasing Library | `/c/gasing-library/l/latest.json` | 5 topics |

---

## Configuration & Assets

### Theme Settings (`settings.yml`)

The following settings can be configured via the Discourse Admin UI:
- `hero_greeting`: Custom welcome text.
- `hero_cta_text`: Main call-to-action description.
- `hero_cta_button_text`: Label for the CTA button.
- `hero_cta_link`: Destination URL for the CTA button.
- `hero_cta_count_text`: Social proof/counter text (e.g., "50 guru mendaftar").

### Theme Assets (`about.json`)

Assets are defined in `about.json` and can be accessed in the JS component via `settings.theme_uploads`:
- `mascot_logic`: SVG illustration for logic mascot.
- `mascot_communication`: SVG illustration for communication mascot.
- `mascot_creativity`: SVG illustration for creativity mascot.
- `hero_bg`: Background image for the hero section.

---

## Discourse Version Compatibility

- Minimum: **3.1.0** (Required for Glimmer components in themes)
- Tested on: 3.2.x, 3.3.x
- **Requirement**: Must have the `custom_homepage` plugin or core support for the modifier enabled.
