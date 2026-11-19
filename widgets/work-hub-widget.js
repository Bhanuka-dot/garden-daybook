// Work Hub launcher widget for Scriptable (iOS).
// Small: tap anywhere -> Quick capture.
// Medium: Capture button + 4 tab buttons.
// Large: Capture + all 7 tabs + optional "Today" list (set DATA_URL).

const DOC = "https://claude.ai/artifact/HT5ykg9oPj5f7SeWtEJ2F8";

// Optional live list. Leave "" for launcher only.
// Expected JSON: { "items": ["Check irrigation zone 3", "Call supplier"] }
const DATA_URL = "";

const TABS = [
  { label: "Tasks",     icon: "checklist",              id: "c6e59525-0bd9" },
  { label: "Remind",    icon: "bell.fill",              id: "b1b8f5c3-0933" },
  { label: "Meetings",  icon: "person.2.fill",          id: "d6d8397e-f299" },
  { label: "Buying",    icon: "cart.fill",              id: "ee4d30a0-1681" },
  { label: "Projects",  icon: "folder.fill",            id: "b22be98c-c72b" },
  { label: "Off days",  icon: "calendar",               id: "33ac10c7-ce67" },
  { label: "Personal",  icon: "person.crop.circle",     id: "4f6410b9-533a" },
];
const CAPTURE_ID = "5f8dbf64-46bd";

const C = {
  bg:     Color.dynamic(new Color("#F4F2EA"), new Color("#16271E")),
  tile:   Color.dynamic(new Color("#FFFFFF"), new Color("#22382C")),
  ink:    Color.dynamic(new Color("#16271E"), new Color("#F4F2EA")),
  stone:  Color.dynamic(new Color("#7E8576"), new Color("#A9B0A1")),
  accent: new Color("#2E6B4A"),
};

const tabUrl = (id) => `${DOC}#${id}`;

function symbol(name, size) {
  const s = SFSymbol.named(name) || SFSymbol.named("circle");
  s.applyFont(Font.systemFont(size));
  return s.image;
}

function header(w) {
  const row = w.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  const img = row.addImage(symbol("leaf.fill", 14));
  img.imageSize = new Size(14, 14);
  img.tintColor = C.accent;
  row.addSpacer(6);
  const t = row.addText("Work Hub");
  t.font = Font.boldSystemFont(14);
  t.textColor = C.ink;
  row.addSpacer();
  const df = new DateFormatter();
  df.dateFormat = "EEE d MMM";
  const d = row.addText(df.string(new Date()));
  d.font = Font.mediumSystemFont(11);
  d.textColor = C.stone;
}

function captureButton(w) {
  const b = w.addStack();
  b.layoutHorizontally();
  b.centerAlignContent();
  b.backgroundColor = C.accent;
  b.cornerRadius = 12;
  b.setPadding(8, 12, 8, 12);
  b.url = tabUrl(CAPTURE_ID);
  const img = b.addImage(symbol("plus.circle.fill", 16));
  img.imageSize = new Size(16, 16);
  img.tintColor = Color.white();
  b.addSpacer(6);
  const t = b.addText("Quick capture");
  t.font = Font.boldSystemFont(13);
  t.textColor = Color.white();
  b.addSpacer();
}

function tabRow(w, tabs) {
  const row = w.addStack();
  row.layoutHorizontally();
  tabs.forEach((tab, i) => {
    if (i > 0) row.addSpacer(6);
    const cell = row.addStack();
    cell.layoutVertically();
    cell.centerAlignContent();
    cell.backgroundColor = C.tile;
    cell.cornerRadius = 10;
    cell.setPadding(6, 4, 6, 4);
    cell.size = new Size(0, 46);
    cell.url = tabUrl(tab.id);
    const top = cell.addStack();
    top.addSpacer();
    const img = top.addImage(symbol(tab.icon, 14));
    img.imageSize = new Size(16, 16);
    img.tintColor = C.accent;
    top.addSpacer();
    cell.addSpacer(3);
    const bottom = cell.addStack();
    bottom.addSpacer();
    const t = bottom.addText(tab.label);
    t.font = Font.mediumSystemFont(10);
    t.textColor = C.ink;
    t.lineLimit = 1;
    t.minimumScaleFactor = 0.7;
    bottom.addSpacer();
  });
}

async function loadItems() {
  if (!DATA_URL) return null;
  try {
    const data = await new Request(DATA_URL).loadJSON();
    return Array.isArray(data.items) ? data.items.slice(0, 5) : null;
  } catch (e) {
    return null;
  }
}

function itemList(w, items) {
  const label = w.addText("TODAY");
  label.font = Font.boldSystemFont(10);
  label.textColor = C.stone;
  w.addSpacer(4);
  items.forEach((it) => {
    const t = w.addText("•  " + it);
    t.font = Font.systemFont(12);
    t.textColor = C.ink;
    t.lineLimit = 1;
    w.addSpacer(2);
  });
}

async function build(family) {
  const w = new ListWidget();
  w.backgroundColor = C.bg;
  w.setPadding(12, 12, 12, 12);
  w.url = tabUrl(CAPTURE_ID); // default tap target (only one on small)

  if (family === "small") {
    header(w);
    w.addSpacer();
    const img = w.addImage(symbol("plus.circle.fill", 34));
    img.imageSize = new Size(34, 34);
    img.tintColor = C.accent;
    w.addSpacer(6);
    const t = w.addText("Quick capture");
    t.font = Font.boldSystemFont(14);
    t.textColor = C.ink;
    return w;
  }

  header(w);
  w.addSpacer(8);
  captureButton(w);
  w.addSpacer(8);
  tabRow(w, TABS.slice(0, 4));

  if (family === "large") {
    w.addSpacer(6);
    tabRow(w, TABS.slice(4));
    w.addSpacer(10);
    const items = await loadItems();
    if (items && items.length) itemList(w, items);
    w.addSpacer();
  }
  return w;
}

const family = config.widgetFamily || "medium";
const widget = await build(family);
widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
