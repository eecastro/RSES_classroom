/**
 * Rosenberg Self-Esteem Scale (classroom edition): class data collector
 * Developed by Eric E Castro, Psychology Department, St Ignatius College Prep
 *
 * Receives anonymous answers from the GitHub Pages page and saves one row per student
 * to the "Responses" tab, with the date only (no time of day). If a student changes an
 * answer and asks for results again, the page resends with the same random submission ID
 * and the script updates that row instead of adding another.
 * It also returns the class average to the page, and the "Trends" tab averages by school year.
 *
 * Setup: paste into Extensions > Apps Script in a new Google Sheet, run setup() once,
 * then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * After editing this script later, redeploy: Deploy > Manage deployments > Edit > New version.
 *
 * Instructor dashboard (dashboard.html): run setDashboardKey() once to create a private key.
 * The dashboard asks for that key and receives class results by semester, school year and
 * section: averages, score bands, item statistics and reliability. It never receives
 * individual rows, and any group with fewer than MIN_N students stays hidden.
 */

var RESPONSES = 'Responses';
var TRENDS = 'Trends';
var MIN_N = 5;                  // never return results for fewer than this many students
var YEAR_STARTS_MONTH = 8;      // school year starts in August (1 = January)
var BAND_LO = 15, BAND_HI = 25; // the page's "typical range" rule of thumb (0–30 scoring)

// Items 2, 5, 6, 8 and 9 are negatively worded. Stored points are already reverse-scored,
// so 0–3 always means low to high self-esteem.
var REVERSED = [false, true, false, false, true, true, false, true, true, false];
var ITEM_HEADERS = REVERSED.map(function (r, i) { return 'Item ' + (i + 1) + (r ? ' (reversed)' : ''); });
var HEADERS = ['Date', 'School year', 'Section']
  .concat(ITEM_HEADERS)
  .concat(['Total (0-30)', 'Page version', 'Submission ID (random)']);
var ITEM_COL0 = 3;              // zero-based index of Item 1 in a row (column D)
var TOTAL_COL0 = 13;            // column N
var ID_COL = HEADERS.length;    // column P (1-based)
var KEY_PROP = 'DASHBOARD_KEY';

/* ---------- One-time setup: run this once from the editor ---------- */
function setup() {
  var ss = SpreadsheetApp.getActive();

  var sh = ss.getSheetByName(RESPONSES) || ss.insertSheet(RESPONSES, 0);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sh.setFrozenRows(1);
  sh.getRange('1:1').setFontWeight('bold').setWrap(true);
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd');
  sh.getRange('B:C').setNumberFormat('@');           // keep "2026-27" as text
  sh.getRange('D:N').setNumberFormat('0');

  var tr = ss.getSheetByName(TRENDS) || ss.insertSheet(TRENDS);
  tr.clear();
  tr.getRange('A1').setFormula(
    '=QUERY(' + RESPONSES + '!A:N,' +
    '"select B, count(N), avg(N), min(N), max(N) where B is not null group by B order by B ' +
    'label B \'School year\', count(N) \'Students\', avg(N) \'Average total (0-30)\', min(N) \'Lowest\', max(N) \'Highest\'", 1)'
  );
  tr.getRange('C:C').setNumberFormat('0.0');
  tr.getRange('1:1').setFontWeight('bold').setWrap(true);
  tr.setFrozenRows(1);
  tr.getRange('A30').setValue('Rows with fewer than ' + MIN_N + ' students are too small to read much into.')
    .setFontStyle('italic');

  tr.getCharts().forEach(function (c) { tr.removeChart(c); });
  tr.insertChart(tr.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(tr.getRange('A1:A25'))
    .addRange(tr.getRange('C1:C25'))
    .setNumHeaders(1)
    .setOption('title', 'Average self-esteem score by school year (0 to 30)')
    .setOption('vAxis', { minValue: 0, maxValue: 30 })
    .setOption('pointSize', 6)
    .setOption('useFirstColumnAsDomain', true)
    .setPosition(2, 8, 0, 0)
    .build());

  SpreadsheetApp.getUi().alert('Setup complete. Next: Deploy > New deployment > Web app.');
}

/* ---------- Receive one submission ---------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse(e.postData.contents);

    // Validate everything; reject anything malformed instead of storing it
    if (!Array.isArray(d.items) || d.items.length !== REVERSED.length) throw new Error('bad items');
    var items = d.items.map(function (v) {
      var n = Number(v);
      if (!(n === Math.floor(n) && n >= 0 && n <= 3)) throw new Error('bad item');
      return n;
    });
    var total = items.reduce(function (a, b) { return a + b; }, 0);
    var section = String(d.section || '').replace(/[^A-Za-z0-9 \-]/g, '').slice(0, 20);
    var id = String(d.id || '');
    if (!/^[A-Za-z0-9-]{8,40}$/.test(id)) throw new Error('bad id');
    var version = String(d.v || '').slice(0, 20);

    var today = dateOnly(new Date());   // server date, no time of day
    lock.waitLock(10000);
    var sh = SpreadsheetApp.getActive().getSheetByName(RESPONSES);

    // Same submission ID = same student changing an answer: update that row
    var existing = sh.getLastRow() > 1
      ? sh.getRange(2, ID_COL, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext()
      : null;
    if (existing) {
      var r = existing.getRow();
      var kept = sh.getRange(r, 1, 1, 2).getValues()[0];   // keep the original date and school year
      var row = [kept[0], kept[1], section].concat(items).concat([total, version, id]);
      sh.getRange(r, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow([today, schoolYear(today), section].concat(items).concat([total, version, id]));
    }
    CacheService.getScriptCache().removeAll(['stats', 'dash']);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- Return the class average to the page ---------- */
function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.view === 'dashboard') return dashboard(params.key);

  var cache = CacheService.getScriptCache();
  var cached = cache.get('stats');
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);

  var rows = readRows();
  var current = schoolYear(new Date());
  var thisYear = rows.filter(function (r) { return String(r[1]) === current; });
  var out = { ok: true, currentYear: current, thisYear: brief(thisYear), allTime: brief(rows) };
  var text = JSON.stringify(out);
  cache.put('stats', text, 60);   // refresh at most once a minute
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

function brief(rows) {
  if (rows.length < MIN_N) return { n: rows.length };
  return { n: rows.length, mean: round1(mean(rows.map(function (r) { return Number(r[TOTAL_COL0]); }))) };
}

/* ---------- Instructor dashboard ---------- */
// Run once from the editor. Creates (or replaces) the key the dashboard asks for.
function setDashboardKey() {
  var key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 32);
  PropertiesService.getScriptProperties().setProperty(KEY_PROP, key);
  CacheService.getScriptCache().remove('dash');
  var msg = 'Your dashboard key:\n\n' + key + '\n\nCopy it now and paste it into dashboard.html when it asks. ' +
    'Anyone with this key can see class results (never individual rows). Run setDashboardKey again to replace it.';
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (x) { /* run from a trigger or API: the log has it */ }
}

function dashboard(key) {
  var stored = PropertiesService.getScriptProperties().getProperty(KEY_PROP);
  if (!stored) return json({ ok: false, error: 'no-key', message: 'Run setDashboardKey() in the Apps Script editor first.' });
  if (!safeEqual(String(key || ''), stored)) {
    Utilities.sleep(800);   // slow down guessing
    return json({ ok: false, error: 'bad-key', message: 'That key is not right.' });
  }

  var cache = CacheService.getScriptCache();
  var cached = cache.get('dash');
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);

  var rows = readRows().filter(function (r) { return r[0] instanceof Date && !isNaN(r[0]); });
  var out = {
    ok: true,
    minN: MIN_N,
    bandLo: BAND_LO,
    bandHi: BAND_HI,
    reversed: REVERSED,
    total: rows.length,
    semesters: groupFor(rows, semesterOf),
    years: groupFor(rows, function (r) { var y = String(r[1] || schoolYear(r[0])); return { key: y, label: y }; })
  };
  var text = JSON.stringify(out);
  if (text.length < 90000) cache.put('dash', text, 60);   // CacheService limit is 100 KB
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

// Group rows by term, then by section within each term. Aggregates only.
function groupFor(rows, keyFn) {
  var groups = {}, labels = {};
  rows.forEach(function (r) {
    var k = keyFn(r);
    labels[k.key] = k.label;
    (groups[k.key] = groups[k.key] || []).push(r);
  });
  return Object.keys(groups).sort().map(function (k) {
    var g = groups[k];
    var bySection = {};
    g.forEach(function (r) {
      var s = String(r[2] || '').trim() || '(no section)';
      (bySection[s] = bySection[s] || []).push(r);
    });
    var out = detail(g);
    out.key = k;
    out.label = labels[k];
    out.sections = Object.keys(bySection).sort().map(function (s) {
      var d = detail(bySection[s]);
      d.section = s;
      return d;
    });
    return out;
  });
}

function detail(rows) {
  var n = rows.length;
  if (n < MIN_N) return { n: n };

  var items = rows.map(function (r) {
    var v = [];
    for (var j = 0; j < REVERSED.length; j++) v.push(Number(r[ITEM_COL0 + j]));
    return v;
  });
  var totals = items.map(sum);
  var k = REVERSED.length;

  // Score distribution in 3-point bins: 0–2, 3–5, … 24–26, 27–30
  var hist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  totals.forEach(function (t) { hist[Math.min(9, Math.floor(t / 3))]++; });

  // Item statistics
  var alphaAll = cronbach(items, range(k));
  var each = range(k).map(function (j) {
    var col = items.map(function (v) { return v[j]; });
    var rest = items.map(function (v) { return sum(v) - v[j]; });
    // How students answered on the page (agreement), before reverse scoring: SA, A, D, SD
    var raw = col.map(function (p) { return REVERSED[j] ? p : 3 - p; });   // 0 = SA … 3 = SD
    return {
      mean: round2(mean(col)),
      sd: round2(sdOf(col)),
      answers: [0, 1, 2, 3].map(function (c) { return pct(raw.filter(function (x) { return x === c; }).length, n); }),
      rit: pearson(col, rest),                                           // corrected item-total correlation
      alphaIfDropped: cronbach(items, range(k).filter(function (x) { return x !== j; }))
    };
  });

  // Positively vs negatively worded items (average points 0–3, after reverse scoring)
  var posIdx = range(k).filter(function (j) { return !REVERSED[j]; });
  var negIdx = range(k).filter(function (j) { return REVERSED[j]; });
  var pos = items.map(function (v) { return mean(posIdx.map(function (j) { return v[j]; })); });
  var neg = items.map(function (v) { return mean(negIdx.map(function (j) { return v[j]; })); });
  // Agreement index: average agreement (SA = 3 … SD = 0) across all 10 items, ignoring wording.
  // 1.5 is balanced; higher means a lean toward agreeing with everything.
  var agree = items.map(function (v) {
    return mean(v.map(function (p, j) { return REVERSED[j] ? 3 - p : p; }));
  });

  return {
    n: n,
    mean: round2(mean(totals)),
    sd: round2(sdOf(totals)),
    median: median(totals),
    low: pct(totals.filter(function (t) { return t < BAND_LO; }).length, n),
    mid: pct(totals.filter(function (t) { return t >= BAND_LO && t <= BAND_HI; }).length, n),
    high: pct(totals.filter(function (t) { return t > BAND_HI; }).length, n),
    hist: hist.map(function (c) { return pct(c, n); }),
    alpha: alphaAll,
    items: each,
    pos: round2(mean(pos)),
    neg: round2(mean(neg)),
    posNegR: pearson(pos, neg),
    agree: round2(mean(agree)),
    agreeHigh: pct(agree.filter(function (a) { return a >= 2; }).length, n)   // agreed, on average, with most statements
  };
}

// Fall = YEAR_STARTS_MONTH to December; Spring = January to the month before.
function semesterOf(r) {
  var tz = Session.getScriptTimeZone();
  var y = Number(Utilities.formatDate(r[0], tz, 'yyyy'));
  var m = Number(Utilities.formatDate(r[0], tz, 'M'));
  return m >= YEAR_STARTS_MONTH
    ? { key: y + '-2', label: 'Fall ' + y }
    : { key: y + '-1', label: 'Spring ' + y };
}

/* ---------- Statistics ---------- */
function cronbach(items, idx) {
  if (idx.length < 2 || items.length < 3) return null;
  var itemVar = idx.reduce(function (a, j) { return a + variance(items.map(function (v) { return v[j]; })); }, 0);
  var totVar = variance(items.map(function (v) { return idx.reduce(function (a, j) { return a + v[j]; }, 0); }));
  if (!totVar) return null;
  return round2(idx.length / (idx.length - 1) * (1 - itemVar / totVar));
}
function pearson(xs, ys) {
  if (xs.length < 3) return null;
  var mx = mean(xs), my = mean(ys), sxy = 0, sxx = 0, syy = 0;
  for (var i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); syy += (ys[i] - my) * (ys[i] - my);
  }
  return sxx && syy ? round2(sxy / Math.sqrt(sxx * syy)) : null;
}
function variance(arr) {
  if (arr.length < 2) return 0;
  var m = mean(arr);
  return arr.reduce(function (a, v) { return a + (v - m) * (v - m); }, 0) / (arr.length - 1);
}
function sdOf(arr) { return Math.sqrt(variance(arr)); }
function median(arr) {
  var s = arr.slice().sort(function (a, b) { return a - b; }), h = Math.floor(s.length / 2);
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}
function sum(arr) { return arr.reduce(function (a, b) { return a + b; }, 0); }
function range(n) { var out = []; for (var i = 0; i < n; i++) out.push(i); return out; }
function pct(hits, total) { return total ? Math.round(hits / total * 1000) / 10 : null; }
function mean(arr) {
  var nums = arr.map(Number).filter(function (v) { return !isNaN(v); });
  return nums.length ? nums.reduce(function (a, b) { return a + b; }, 0) / nums.length : null;
}
function round1(v) { return v === null ? null : Math.round(v * 10) / 10; }
function round2(v) { return v === null ? null : Math.round(v * 100) / 100; }

/* ---------- Helpers ---------- */
function readRows() {
  var sh = SpreadsheetApp.getActive().getSheetByName(RESPONSES);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, HEADERS.length).getValues().filter(function (r) {
    // skip blank or hand-edited rows that don't hold 10 valid item scores
    for (var j = 0; j < REVERSED.length; j++) {
      var v = r[ITEM_COL0 + j];
      if (v === '' || isNaN(Number(v))) return false;
    }
    return true;
  }).map(function (r) {
    var t = 0;
    for (var j = 0; j < REVERSED.length; j++) t += Number(r[ITEM_COL0 + j]);
    r[TOTAL_COL0] = t;   // recompute the total from the items so a hand edit can't put them out of step
    return r;
  });
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function schoolYear(date) {
  var tz = Session.getScriptTimeZone();
  var y = Number(Utilities.formatDate(date, tz, 'yyyy'));
  var m = Number(Utilities.formatDate(date, tz, 'M'));
  var start = m >= YEAR_STARTS_MONTH ? y : y - 1;
  return start + '-' + String(start + 1).slice(2);
}

function dateOnly(date) {
  var tz = Session.getScriptTimeZone();
  return Utilities.parseDate(Utilities.formatDate(date, tz, 'yyyy-MM-dd'), tz, 'yyyy-MM-dd');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
