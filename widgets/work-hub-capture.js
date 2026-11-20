// Work Hub Capture — Scriptable widget (iOS Home Screen + Lock Screen).
// Tap a widget button -> native iOS text box -> Add -> Work Hub sheet saves it and shows "Added to …".
// First time only: sign in to claude.ai inside that sheet (it keeps its own login, separate from Safari).
// Uses the same prefix codes as the app: T R D W B M P O X (no letter = Inbox).

const APP = "https://claude.ai/artifact/TEx2YN3JYKrQpBCgnrQKSt";
const HISTORY_FILE = "workhub-captures.json";

const TYPES = {
  T: { label: "Task",      sym: "checklist",               hex: "#007AFF", ex: "Thu OXA find magu for 101 !",  hint: "Add a day (Thu, 21 Nov, tmrw), OXA or OSL, and ! to pin." },
  R: { label: "Follow-up", sym: "bell.fill",               hex: "#FF9500", ex: "Thu Mr Viru jetty pots !",     hint: "Who and when. Example: Thu Mr Viru jetty pots" },
  D: { label: "Update",    sym: "text.bubble.fill",        hex: "#34C759", ex: "OXA 401 privacy fence done",   hint: "End with done or ongoing. Add tmrw for tomorrow's plan." },
  W: { label: "Walk",      sym: "leaf.fill",               hex: "#00A389", ex: "GM Block 10 red plants removed", hint: "Matches an open walk-through point and updates its status." },
  B: { label: "Buy",       sym: "cart.fill",               hex: "#FF2D55", ex: "hand gloves x5",               hint: "Add received to tick off an open purchase." },
  M: { label: "Meeting",   sym: "person.2.fill",           hex: "#AF52DE", ex: "HR ok'd Ibrahim replacement",  hint: "Adds to today's meeting notes." },
  P: { label: "Project",   sym: "folder.fill",             hex: "#2A73EC", ex: "hydroponic budget sent",       hint: "A project note." },
  O: { label: "Off day",   sym: "moon.zzz.fill",           hex: "#8A9894", ex: "Tahir off Sat",                hint: "Who is off and which day." },
  X: { label: "Personal",  sym: "person.crop.circle.fill", hex: "#E4602D", ex: "renew driving licence 2 Dec",  hint: "Private reminder. Add a date." },
};
const GRID_MEDIUM = ["T", "R", "D", "W", "B", "M"];
const GRID_LARGE  = ["T", "R", "D", "W", "B", "M", "P", "O", "X"];

/* ---------- colours (system-like, light + dark) ---------- */
const C = {
  accent: Color.dynamic(new Color("#00796B"), new Color("#4FE3C1")),
  ink:    Color.dynamic(new Color("#000000"), new Color("#FFFFFF")),
  ink2:   Color.dynamic(new Color("#3C3C43", 0.6), new Color("#EBEBF5", 0.6)),
  fill:   Color.dynamic(new Color("#767680", 0.12), new Color("#767680", 0.24)),
  bgTop:  Color.dynamic(new Color("#E3F3EF"), new Color("#0E2A25")),
  bgBot:  Color.dynamic(new Color("#FFFFFF"), new Color("#1C1C1E")),
};
const tint = (hex, a) => Color.dynamic(new Color(hex, a), new Color(hex, a * 1.8));

/* ---------- history (last captures sent from the widget) ---------- */
const fm = FileManager.local();
const histPath = fm.joinPath(fm.documentsDirectory(), HISTORY_FILE);
function loadHistory() {
  try { return fm.fileExists(histPath) ? JSON.parse(fm.readString(histPath)) : []; } catch (e) { return []; }
}
function saveHistory(list) {
  try { fm.writeString(histPath, JSON.stringify(list.slice(0, 20))); } catch (e) {}
}
function typeOf(line) {
  const m = String(line).match(/^([DRTWMBPOX])(?:\s*[:.\-–]\s*|\s+)/i);
  return m ? m[1].toUpperCase() : null;
}
const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();

/* ---------- capture flow (runs in the Scriptable app) ---------- */
function runURL(p) {
  return URLScheme.forRunningScript() + "?p=" + encodeURIComponent(p || "any");
}

async function capture(p) {
  const t = TYPES[p];
  const a = new Alert();
  a.title = t ? "New " + t.label.toLowerCase() : "Capture";
  a.message = t
    ? t.hint
    : "Start with a letter to file it:\nT task · R follow-up · D update · W walk\nB buy · M meeting · P project · O off day · X personal\nNo letter goes to Inbox. Add ! to pin.";
  a.addTextField(t ? t.ex : "R Thu OXA Mr Viru jetty pots !", "");
  a.addAction("Add");
  a.addCancelAction("Cancel");
  const choice = await a.presentAlert();
  if (choice === -1) return;
  const text = a.textFieldValue(0).replace(/\s+/g, " ").trim();
  if (!text) return;

  const line = t && !typeOf(text) ? p + " " + text : text;
  const hist = loadHistory();
  hist.unshift({ line, at: Date.now() });
  saveHistory(hist);
  // Open Work Hub as a sheet inside Scriptable (no jump to Safari or the Claude app).
  // #add= files the line at once and shows "Added to …"; swipe the sheet down when done.
  await Safari.openInApp(APP + "#add=" + encodeURIComponent(line), false);
}

/* ---------- widget building blocks ---------- */
function symbol(name, size, weight) {
  const s = SFSymbol.named(name) || SFSymbol.named("circle");
  s.applyFont(weight === "bold" ? Font.boldSystemFont(size) : Font.semiboldSystemFont(size));
  return s.image;
}

function background(w) {
  const g = new LinearGradient();
  g.colors = [C.bgTop, C.bgBot];
  g.locations = [0, 0.75];
  w.backgroundGradient = g;
}

function header(w, todayCount) {
  const row = w.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  const badge = row.addStack();
  badge.size = new Size(20, 20);
  badge.cornerRadius = 6;
  badge.backgroundColor = C.accent;
  badge.centerAlignContent();
  const bi = badge.addImage(symbol("square.and.pencil", 11, "bold"));
  bi.imageSize = new Size(11, 11);
  bi.tintColor = Color.dynamic(Color.white(), new Color("#03201A"));
  row.addSpacer(7);
  const title = row.addText("Work Hub");
  title.font = Font.semiboldSystemFont(14);
  title.textColor = C.ink;
  row.addSpacer();
  const df = new DateFormatter();
  df.dateFormat = "EEE d";
  const right = row.addText(todayCount ? todayCount + " today" : df.string(new Date()));
  right.font = Font.mediumSystemFont(12);
  right.textColor = C.ink2;
}

function captureField(w, height) {
  const f = w.addStack();
  f.layoutHorizontally();
  f.centerAlignContent();
  f.backgroundColor = C.fill;
  f.cornerRadius = height / 2;
  f.size = new Size(0, height);
  f.setPadding(0, 10, 0, 12);
  f.url = runURL("any");
  const i = f.addImage(symbol("plus.circle.fill", 17, "bold"));
  i.imageSize = new Size(18, 18);
  i.tintColor = C.accent;
  f.addSpacer(7);
  const t = f.addText("New capture");
  t.font = Font.systemFont(15);
  t.textColor = C.ink2;
  f.addSpacer();
  const m = f.addImage(symbol("mic.fill", 13));
  m.imageSize = new Size(12, 14);
  m.tintColor = C.ink2;
}

function chip(row, key, height) {
  const t = TYPES[key];
  const c = row.addStack();
  c.layoutHorizontally();
  c.centerAlignContent();
  c.backgroundColor = tint(t.hex, 0.14);
  c.cornerRadius = 10;
  c.size = new Size(0, height);
  c.setPadding(0, 6, 0, 6);
  c.url = runURL(key);
  c.addSpacer();
  const i = c.addImage(symbol(t.sym, 12));
  i.imageSize = new Size(14, 14);
  i.tintColor = new Color(t.hex);
  c.addSpacer(5);
  const l = c.addText(t.label);
  l.font = Font.semiboldSystemFont(12.5);
  l.textColor = C.ink;
  l.lineLimit = 1;
  l.minimumScaleFactor = 0.75;
  c.addSpacer();
}

function chipGrid(w, keys, cols, height, gap) {
  for (let r = 0; r < keys.length; r += cols) {
    if (r > 0) w.addSpacer(gap);
    const row = w.addStack();
    row.layoutHorizontally();
    keys.slice(r, r + cols).forEach((k, i) => {
      if (i > 0) row.addSpacer(gap);
      chip(row, k, height);
    });
  }
}

function recentList(w, hist) {
  const label = w.addText("RECENT");
  label.font = Font.semiboldSystemFont(11);
  label.textColor = C.ink2;
  w.addSpacer(6);
  if (!hist.length) {
    const e = w.addText("Nothing captured from the widget yet.");
    e.font = Font.systemFont(13);
    e.textColor = C.ink2;
    return;
  }
  const rel = new RelativeDateTimeFormatter();
  rel.useNamedDateTimeStyle();
  hist.slice(0, 5).forEach((h, ix) => {
    if (ix > 0) w.addSpacer(6);
    const k = typeOf(h.line);
    const t = TYPES[k];
    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    const dot = row.addImage(symbol(t ? t.sym : "tray.fill", 11));
    dot.imageSize = new Size(13, 13);
    dot.tintColor = t ? new Color(t.hex) : C.ink2;
    row.addSpacer(8);
    const tx = row.addText(k ? h.line.replace(/^\S+\s+/, "") : h.line);
    tx.font = Font.systemFont(13.5);
    tx.textColor = C.ink;
    tx.lineLimit = 1;
    row.addSpacer(8);
    const when = row.addText(rel.string(new Date(h.at), new Date()));
    when.font = Font.systemFont(11.5);
    when.textColor = C.ink2;
    when.lineLimit = 1;
  });
}

/* ---------- widget families ---------- */
function build(family) {
  const hist = loadHistory();
  const todayCount = hist.filter((h) => isToday(h.at)).length;
  const w = new ListWidget();
  w.url = runURL("any");
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  if (family === "accessoryCircular") {
    w.addAccessoryWidgetBackground = true;
    const s = w.addStack();
    s.addSpacer();
    const i = s.addImage(symbol("square.and.pencil", 22, "bold"));
    i.imageSize = new Size(24, 24);
    s.addSpacer();
    return w;
  }
  if (family === "accessoryRectangular") {
    const t = w.addText("Work Hub");
    t.font = Font.headline();
    const s = w.addText("Tap to capture");
    s.font = Font.systemFont(13);
    const n = w.addText(todayCount ? todayCount + " captured today" : "Inbox, tasks, follow-ups");
    n.font = Font.systemFont(13);
    n.textOpacity = 0.7;
    return w;
  }
  if (family === "accessoryInline") {
    w.addText("Capture to Work Hub" + (todayCount ? " · " + todayCount : ""));
    return w;
  }

  background(w);

  if (family === "small") {
    w.setPadding(14, 14, 14, 14);
    header(w, 0);
    w.addSpacer();
    const t = w.addText("Capture");
    t.font = Font.boldSystemFont(22);
    t.textColor = C.ink;
    const s = w.addText(todayCount ? todayCount + " added today" : "One line, filed for you");
    s.font = Font.systemFont(12.5);
    s.textColor = C.ink2;
    w.addSpacer(10);
    const b = w.addStack();
    b.layoutHorizontally();
    b.centerAlignContent();
    b.backgroundColor = C.accent;
    b.cornerRadius = 17;
    b.size = new Size(0, 34);
    b.addSpacer();
    const i = b.addImage(symbol("plus", 13, "bold"));
    i.imageSize = new Size(13, 13);
    i.tintColor = Color.dynamic(Color.white(), new Color("#03201A"));
    b.addSpacer(5);
    const bt = b.addText("New");
    bt.font = Font.semiboldSystemFont(14);
    bt.textColor = Color.dynamic(Color.white(), new Color("#03201A"));
    b.addSpacer();
    return w;
  }

  if (family === "large") {
    w.setPadding(16, 16, 16, 16);
    header(w, todayCount);
    w.addSpacer(12);
    captureField(w, 38);
    w.addSpacer(12);
    chipGrid(w, GRID_LARGE, 3, 32, 7);
    w.addSpacer(16);
    recentList(w, hist);
    w.addSpacer();
    return w;
  }

  // medium (default)
  w.setPadding(12, 14, 12, 14);
  header(w, todayCount);
  w.addSpacer(8);
  captureField(w, 32);
  w.addSpacer(7);
  chipGrid(w, GRID_MEDIUM, 3, 28, 6);
  return w;
}

/* ---------- entry ---------- */
const p = (args.queryParameters || {}).p;

if (config.runsInWidget || config.runsInAccessoryWidget) {
  Script.setWidget(build(config.widgetFamily || "medium"));
} else if (p) {
  await capture(p === "any" ? null : String(p).toUpperCase());
} else {
  // Run by hand inside Scriptable: preview the sizes.
  const m = new Alert();
  m.title = "Work Hub Capture";
  m.message = "Preview a widget size, or capture now.";
  ["Capture now", "Small", "Medium", "Large"].forEach((x) => m.addAction(x));
  m.addCancelAction("Close");
  const i = await m.presentSheet();
  if (i === 0) await capture(null);
  else if (i === 1) await build("small").presentSmall();
  else if (i === 2) await build("medium").presentMedium();
  else if (i === 3) await build("large").presentLarge();
}
Script.complete();
