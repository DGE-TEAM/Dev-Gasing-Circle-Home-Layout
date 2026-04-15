// =============================================================
// GASING CIRCLE — Academy News Theme Component
// File: javascripts/discourse/api-initializers/custom-layout.js
// Version: 3.1.0 — Refactored into modular lib files
// =============================================================

import { apiInitializer } from "discourse/lib/api";
import { later } from "@ember/runloop";
import { STATE, API } from "../lib/gc-state";
import { isTargetRoute } from "../lib/gc-utils";
import { renderLayout, cleanupLayout } from "../lib/gc-render";

export default apiInitializer("1.8.0", (api) => {
  API.instance = api;

  api.onPageChange((_url) => {
    cleanupLayout();
    if (isTargetRoute()) {
      later(renderLayout, 150);
    }
  });

  api.registerBehaviorTransformer?.("discovery-layout", () => {
    if (isTargetRoute()) later(renderLayout, 200);
  });

  if (isTargetRoute()) {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      later(renderLayout, 300);
    } else {
      document.addEventListener("DOMContentLoaded", () =>
        later(renderLayout, 300),
      );
    }
  }

  api.onAppEvent("composer:saved", () => {
    if (isTargetRoute()) {
      STATE.preventNextRoute = true;
      // Auto-clear safeguard
      setTimeout(() => {
        STATE.preventNextRoute = false;
      }, 1500);

      // Automatically refresh the current topic reading panel
      if (STATE.activeTopicId) {
        setTimeout(() => {
          const activeCard = document.querySelector(
            `.gc-topic-card[data-topic-id="${STATE.activeTopicId}"]`
          );
          if (activeCard) activeCard.click();
        }, 300);
      }
    }
  });

  try {
    const router = api.container?.lookup("service:router");

    router?.on("routeWillChange", (transition) => {
      if (STATE.preventNextRoute) {
        STATE.preventNextRoute = false;
        transition.abort();
        return;
      }
    });

    router?.on("routeDidChange", () => {
      cleanupLayout();
      if (isTargetRoute()) later(renderLayout, 200);
    });
  } catch (e) {}
});
