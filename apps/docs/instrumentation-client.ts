import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (!projectToken) {
  if (process.env.NODE_ENV === "development") {
    throw new Error(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is missing. PostHog initialization aborted.",
    );
  }
} else {
  posthog.init(projectToken, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",

    // Comprehensive URL, Campaign, and Context Tracking
    disable_capture_url_hashes: true,
    save_referrer: true,
    save_campaign_params: true,

    // Tracking Behaviors & Deep Telemetry
    autocapture: true,
    rageclick: { content_ignorelist: true },
    capture_pageview: "history_change",
    capture_pageleave: "if_capture_pageview",
    capture_heatmaps: true,
    capture_dead_clicks: true,
    capture_exceptions: true,

    // Session Replay & Console Logs
    disable_session_recording: false,
    enable_recording_console_log: true,
    session_recording: {
      recordCrossOriginIframes: true,
      maskAllInputs: false,
    },

    // Feature Flags & Remote Config Reliability
    feature_flag_cache_ttl_ms: 300000,
    remote_config_refresh_interval_ms: 300000,
    advanced_feature_flags_dedup_per_session: true,

    // Persistence & Cross-Subdomain Security
    persistence: "localStorage+cookie",
    cross_subdomain_cookie: true,
    secure_cookie: true,
    cookieWinsOnConflict: true,

    // Network & Transport Control
    api_transport: "fetch",
    request_batching: true,

    // Debugging
    debug: process.env.NODE_ENV === "development",
  });

  // Register global super property post-init
  posthog.register({
    appName: "DarajaSdk",
  });
}
