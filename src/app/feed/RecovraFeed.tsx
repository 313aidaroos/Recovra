"use client";
import { useMemo } from "react";
import { createFeedClient } from "@/feed-client/api";
import { FeedView, type FeedSkin } from "@/feed-client/FeedView";

// Recovra skin: only Recovra's own classes from src/app/globals.css (panel, primary-cta, secondary-button, chip…). Layout in ./feed.css.
const skin: FeedSkin = {
  tabs: "rv-feed-tabs",
  tab: "rv-feed-tab",
  tabActive: "rv-feed-tab-on",
  card: "panel",
  cardHead: "",
  title: "rv-feed-title",
  button: "primary-cta rv-sm",
  buttonSecondary: "secondary-button rv-sm",
  buttonSmall: "",
  chip: "chip rv-feed-chip",
  aiChip: "chip rv-feed-ai",
  input: "rv-feed-input",
  label: "rv-feed-label",
  muted: "rv-feed-muted",
  alert: "rv-feed-alert",
  notice: "rv-feed-notice",
  empty: "rv-feed-muted",
  listRow: "rv-feed-row",
  signInUrl: "/auth/apixis/start?next=%2Ffeed",
  buyIxisUrl: "https://apixis-wallet.vercel.app/buy?product=recovra",
};

export function RecovraFeed() {
  const client = useMemo(() => createFeedClient({ client: "recovra", sessionUrl: "/api/feed-session" }), []);
  return <FeedView client={client} skin={skin} siteName="Recovra" />;
}
