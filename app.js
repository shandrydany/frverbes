/* Conjugueur v2.4 — тренажёр французских спряжений */
"use strict";

const TENSES = {
  P:  { label: "Présent",               kind: "s" },
  PC: { label: "Passé composé",         kind: "c", aux: "P" },
  I:  { label: "Imparfait",             kind: "s" },
  PQP:{ label: "Plus-que-parfait",      kind: "c", aux: "I" },
  F:  { label: "Futur simple",          kind: "s" },
  FA: { label: "Futur antérieur",       kind: "c", aux: "F" },
  J:  { label: "Passé simple",          kind: "s" },
  PA: { label: "Passé antérieur",       kind: "c", aux: "J" },
  C:  { label: "Conditionnel présent",  kind: "s" },
  CP: { label: "Conditionnel passé",    kind: "c", aux: "C" },
  S:  { label: "Subjonctif présent",    kind: "s", subj: true },
  SP: { label: "Subjonctif passé",      kind: "c", aux: "S", subj: true },
  T:  { label: "Subjonctif imparfait",  kind: "s", subj: true },
  Y:  { label: "Impératif",             kind: "imp" },
};
const DEFAULT_TENSES = ["P", "PC", "I", "F"];

const AUX = {
  avoir: {
    P:["ai","as","a","avons","avez","ont"],
    I:["avais","avais","avait","avions","aviez","avaient"],
    F:["aurai","auras","aura","aurons","aurez","auront"],
    J:["eus","eus","eut","eûmes","eûtes","eurent"],
    C:["aurais","aurais","aurait","aurions","auriez","auraient"],
    S:["aie","aies","ait","ayons","ayez","aient"],
  },
  "être": {
    P:["suis","es","est","sommes","êtes","sont"],
    I:["étais","étais","était","étions","étiez","étaient"],
    F:["serai","seras","sera","serons","serez","seront"],
    J:["fus","fus","fut","fûmes","fûtes","furent"],
    C:["serais","serais","serait","serions","seriez","seraient"],
    S:["sois","sois","soit","soyons","soyez","soient"],
  },
};
const PRONOUNS = ["je","tu","il/elle","nous","vous","ils/elles"];
const IMP_PRONOUNS = ["(tu)","(nous)","(vous)"];
const ACCENTS = ["é","è","ê","ë","à","â","ç","î","ï","ô","û","ù","'"];
const PRAISE = ["Bravo !","Magnifique !","Génial !","Parfait !","Incroyable !","Superbe !","Excellent !","Formidable !","Chapeau !","Trop fort !"];
const XP_PER_LEVEL = 300;

let DB = [];
let settings = load("cj2-settings", { tenses: DEFAULT_TENSES, range: 100, accents: "strict", lang: "ru", phrases: true });
if (!Array.isArray(settings.tenses) || !settings.tenses.length || !settings.tenses.every(t => TENSES[t])) settings.tenses = DEFAULT_TENSES;
let stats = load("cj2-stats", { streak: 0, done: 0, xp: 0 });
let card = null;
let activeInput = null;
let cardCount = 0;

function load(k, def){ try { return Object.assign({}, def, JSON.parse(localStorage.getItem(k)) || {}); } catch(e){ return def; } }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
const $ = id => document.getElementById(id);

const I18N = {
  ru: {
    h1: "Что учим сегодня? 💪",
    tenses: "⏰ Времена", 
    verbs: "📚 Глаголы", 
    lang: "🌍 Язык перевода", 
    accents: "´ Акценты (é, è, ç…)",
    top50: "Топ-50", top100: "Топ-100", top300: "Топ-300", all: "Все 581 🤯",
    strict: "Строго 😤", lenient: "Мягко 😌",
    bonus: "💬 Бонус", bonusOpt: "Перевести предложение (+25 ⚡)",
    start: "Тренировать глаголы! 🚀", skip: "Пропустить ⏭", next: "Дальше →",
    phraseLabel: "💬 Бонусное задание! Переведи на французский:",
    reveal: "Показать ответ (без очков)",
    streak: "Серия карточек без ошибок", xp: "Опыт и уровень", settings: "Настройки",
    corrRetype: "правильно: <b>{a}</b> — перепечатай",
    corrAlmost: "почти! проверь акценты: <b>{a}</b>",
    noVerbs: "Для выбранных времён нет подходящих глаголов — измени настройки.",
    vVerbs: "глагол", vTenses: "времён",
  },
  en: {
    h1: "What shall we train today? 💪",
    tenses: "⏰ Tenses", verbs: "📚 Verbs", lang: "🌍 Translation language", accents: "´ Accents (é, è, ç…)",
    top50: "Top 50", top100: "Top 100", top300: "Top 300", all: "All 581 🤯",
    strict: "Strict 😤", lenient: "Lenient 😌",
    bonus: "💬 Bonus", bonusOpt: "Translate a phrase into French (+25 ⚡)",
    start: "Start training! 🚀", skip: "Skip ⏭", next: "Next →",
    phraseLabel: "💬 Bonus task! Translate into French:",
    reveal: "Show answer (no points)",
    streak: "Streak of flawless cards", xp: "XP and level", settings: "Settings",
    corrRetype: "correct: <b>{a}</b> — retype it",
    corrAlmost: "almost! check the accents: <b>{a}</b>",
    noVerbs: "No verbs match the selected tenses — change the settings.",
    vVerbs: "verbs", vTenses: "tenses",
  },
};
function L(key){ return (I18N[settings.lang] || I18N.ru)[key] || I18N.ru[key] || key; }
function applyI18n(){
  document.documentElement.lang = settings.lang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = L(el.dataset.i18n); });
}

function stripAccents(s){ return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function norm(s){
  return s.trim().toLowerCase().replace(/\u2019/g, "'").replace(/œ/g, "oe").replace(/\s+/g, " ");
}
function normPhrase(s){
  return norm(s).replace(/[.!?,;:]/g, "").replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

function isVowelStart(w){ return /^[aeiouyàâéèêëîïôûùœh]/i.test(w) && !/^ha[ïi]r/.test(w); }

function availableTenses(verb){
  return settings.tenses.filter(id => {
    const t = TENSES[id];
    if (t.kind === "s") return !!verb.t[id];
    if (t.kind === "imp") return !!verb.t.Y;
    return true;
  });
}

function buildAnswers(verb, tenseId){
  const t = TENSES[tenseId];
  if (t.kind === "s") return verb.t[tenseId].map(f => ({ display: f, accepted: [norm(f)] }));
  if (t.kind === "imp") return verb.t.Y.map(f => ({ display: f, accepted: [norm(f)] }));
  const auxForms = AUX[verb.aux][t.aux];
  const pp = verb.pp;
  const agree = verb.aux === "être"
    ? [ [0,2], [0,2], [0,2], [1,3], [0,1,2,3], [1,3] ]
    : [ [0],[0],[0],[0],[0],[0] ];
  return auxForms.map((a, i) => {
    const accepted = agree[i].map(j => norm(a + " " + pp[j]));
    let display = a + " " + pp[0];
    if (verb.aux === "être") {
      if (i <= 2) display = a + " " + pp[0] + "(e)";
      else if (i === 4) display = a + " " + pp[0] + "(e)(s)";
      else display = a + " " + pp[0] + "(e)s";
    }
    return { display, accepted };
  });
}

function pronounLabel(tenseId, i, firstWord){
  if (TENSES[tenseId].kind === "imp") return IMP_PRONOUNS[i];
  let p = PRONOUNS[i];
  const el = i === 0 && isVowelStart(firstWord);
  if (TENSES[tenseId].subj) {
    if (i === 2) return "qu'il/elle";
    return el ? "que j'" : "que " + p;
  }
  return el ? "j'" : p;
}

function newCard(){
  const pool = DB.slice(0, settings.range);
  let verb, av;
  for (let tries = 0; tries < 60; tries++) {
    verb = pool[Math.floor(Math.random() * pool.length)];
    av = availableTenses(verb);
    if (av.length) break;
  }
  if (!av || !av.length) { alert(L("noVerbs")); showScreen("settings"); return; }
  const tenseId = av[Math.floor(Math.random() * av.length)];
  const answers = buildAnswers(verb, tenseId);
  cardCount++;
  card = { verb, tenseId, answers,
           solved: answers.map(() => false),
           err: answers.map(() => 0),
           hadError: false, phraseDone: false };
  renderCard();
}

function renderCard(){
  const v = card.verb;
  $("card-ru").textContent = settings.lang === "en" ? v.en : v.ru;
  
  if (v.prep) {
    $("card-prep").innerHTML = `<b>Предлоги:</b> ${v.prep}`;
  } else {
    $("card-prep").textContent = "";
  }
  
  $("card-inf").textContent = v.inf;
  $("card-tense").textContent = TENSES[card.tenseId].label;
  $("btn-next").disabled = true;
  $("phrase-block").hidden = true;
  $("phrase-input").value = ""; $("phrase-input").className = ""; $("phrase-input").readOnly = false;
  $("phrase-corr").textContent = ""; $("phrase-mark").textContent = "";
  $("progress-text").textContent = "Карточка " + cardCount;

  const rows = $("rows");
  rows.innerHTML = "";
  card.answers.forEach((ans, i) => {
    const row = document.createElement("div");
    row.className = "row";
    const pron = document.createElement("div");
    pron.className = "pron";
    pron.textContent = pronounLabel(card.tenseId, i, ans.display);
    const input = document.createElement("input");
    input.type = "text";
    input.autocapitalize = "none"; input.autocomplete = "off";
    input.autocorrect = "off"; input.spellcheck = false;
    input.dataset.i = i;
    input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); check(i); } });
    input.addEventListener("focus", () => { activeInput = input; });
    
    const btnCheck = document.createElement("button");
    btnCheck.className = "check"; 
    btnCheck.type = "button"; 
    btnCheck.textContent = "✓";
    btnCheck.title = "Проверить";
    btnCheck.addEventListener("click", () => check(i));
    
    const btnReveal = document.createElement("button");
    btnReveal.className = "reveal"; 
    btnReveal.type = "button"; 
    btnReveal.textContent = "💡";
    btnReveal.title = L("reveal");
    btnReveal.addEventListener("click", () => reveal(i));
    
    const mark = document.createElement("div");
    mark.className = "mark"; 
    mark.id = "mark-" + i;
    
    row.append(pron, input, btnCheck, btnReveal, mark);
    rows.appendChild(row);
    
    const corr = document.createElement("div");
    corr.className = "correction"; 
    corr.id = "corr-" + i;
    rows.appendChild(corr);
  });
  const first = rows.querySelector("input");
  if (first) first.focus();
}

function check(i){
  if (card.solved[i]) { focusNext(i); return; }
  const input = document.querySelector(`#rows input[data-i="${i}"]`);
  const ans = card.answers[i];
  const val = norm(input.value);
  const mark = $("mark-" + i), corr = $("corr-" + i);

  let ok = ans.accepted.includes(val);
  let almost = false;
  if (!ok && val) {
    const na = stripAccents(val);
    if (ans.accepted.some(a => stripAccents(a) === na)) {
      if (settings.accents === "lenient") ok = true;
      else almost = true;
    }
  }

  input.classList.remove("ok","bad","almost","shake");
  if (ok) {
    card.solved[i] = true;
    if (!ans.accepted.includes(val)) input.value = ans.display;
    input.classList.add("ok");
    input.readOnly = true;
    mark.textContent = "✅"; 
    mark.classList.add("pulse");
    corr.textContent = "";
    
    const btn = document.querySelector(`#rows button[data-i="${i}"]`);
    if (btn) btn.classList.add("hidden");
    
    addXP(card.err[i] ? 3 : 10, input);
    if (card.solved.every(Boolean)) finishForms();
    else focusNext(i);
  } else {
    card.hadError = true;
    card.err[i]++;
    void input.offsetWidth;
    input.classList.add(almost ? "almost" : "bad", "shake");
    mark.textContent = "❌";
    
    if (card.err[i] === 1) {
      corr.innerHTML = (almost ? L("corrAlmost") : L("corrRetype")).replace("{a}", ans.display);
      input.select();
    } else if (card.err[i] >= 2) {
      setTimeout(() => {
        if (!card.solved[i]) {
          input.value = ans.display;
          input.className = "revealed"; 
          input.readOnly = true;
          mark.textContent = "👁";
          corr.textContent = "";
          
          const btn = document.querySelector(`#rows button[data-i="${i}"]`);
          if (btn) btn.classList.add("hidden");
        }
      }, 800);
    }
  }
}

function reveal(i){
  if (card.solved[i]) return;
  const input = document.querySelector(`#rows input[data-i="${i}"]`);
  card.hadError = true;
  card.solved[i] = true;
  input.value = card.answers[i].display;
  input.className = "revealed"; 
  input.readOnly = true;
  $("mark-" + i).textContent = "👁";
  $("corr-" + i).textContent = "";
  
  const btn = document.querySelector(`#rows button[data-i="${i}"]`);
  if (btn) btn.classList.add("hidden");
  
  if (card.solved.every(Boolean)) finishForms();
  else focusNext(i);
}

function focusNext(i){
  const n = card.answers.length;
  for (let k = 1; k <= n; k++) {
    const j = (i + k) % n;
    if (!card.solved[j]) {
      document.querySelector(`#rows input[data-i="${j}"]`).focus();
      return;
    }
  }
}

function finishForms(){
  const v = card.verb;
  if (settings.phrases && v.phr) {
    $("phrase-block").hidden = false;
    $("phrase-src").textContent = "«" + (settings.lang === "en" ? v.phr[2] : v.phr[1]) + "»";
    $("phrase-input").focus();
  } else {
    finishCard();
  }
}

function checkPhrase(){
  const input = $("phrase-input");
  if (input.readOnly) return;
  const target = card.verb.phr[0];
  const val = normPhrase(input.value);
  let ok = val === normPhrase(target);
  if (!ok && settings.accents === "lenient" && val && stripAccents(val) === stripAccents(normPhrase(target))) ok = true;
  input.classList.remove("ok","bad","shake");
  if (ok) {
    input.value = target;
    input.classList.add("ok"); 
    input.readOnly = true;
    $("phrase-mark").textContent = "✅";
    $("phrase-corr").textContent = "";
    addXP(25, input);
    card.phraseDone = true;
    finishCard();
  } else {
    card.hadError = true;
    void input.offsetWidth;
    input.classList.add("bad","shake");
    $("phrase-mark").textContent = "❌";
    $("phrase-corr").innerHTML = L("corrRetype").replace("{a}", target);
    input.select();
  }
}

function revealPhrase(){
  const input = $("phrase-input");
  if (input.readOnly) return;
  card.hadError = true;
  input.value = card.verb.phr[0];
  input.className = "revealed"; 
  input.readOnly = true;
  $("phrase-mark").textContent = "👁";
  $("phrase-corr").textContent = "";
  finishCard();
}

function finishCard(){
  stats.done += 1;
  stats.streak = card.hadError ? 0 : stats.streak + 1;
  save("cj2-stats", stats);
  renderStats();
  if (!card.hadError) {
    confetti(50);
    praise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  }
  const btn = $("btn-next");
  btn.disabled = false;
  btn.focus();
}

function addXP(n, nearEl){
  if (!n) return;
  const before = Math.floor(stats.xp / XP_PER_LEVEL);
  stats.xp += n;
  save("cj2-stats", stats);
  renderStats();
  if (nearEl) {
    const f = document.createElement("div");
    f.className = "xpfloat"; 
    f.textContent = "+" + n + "⚡";
    f.style.top = (nearEl.offsetTop - 4) + "px";
    $("card").appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }
  if (Math.floor(stats.xp / XP_PER_LEVEL) > before) {
    praise("Niveau " + (Math.floor(stats.xp / XP_PER_LEVEL) + 1) + " !");
    confetti(80);
  }
}

function praise(text){
  const el = document.createElement("div");
  el.className = "praise"; 
  el.textContent = text;
  $("card").appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

const CONF_COLORS = ["#f48fb1","#ec6d9a","#0abab5","#7fd8d5","#ffd6e7","#a3ecea"];
function confetti(n){
  const box = $("confetti");
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.style.left = Math.random() * 100 + "vw";
    s.style.background = CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)];
    s.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
    s.style.animationDelay = (Math.random() * 0.4) + "s";
    s.style.transform = "rotate(" + Math.random() * 360 + "deg)";
    box.appendChild(s);
    setTimeout(() => s.remove(), 3800);
  }
}

function renderSettings(){
  const box = $("tense-chips");
  box.innerHTML = "";
  Object.entries(TENSES).forEach(([id, t]) => {
    const label = document.createElement("label");
    label.className = "chip";
    const cb = document.createElement("input");
    cb.type = "checkbox"; 
    cb.value = id;
    cb.checked = settings.tenses.includes(id);
    const span = document.createElement("span");
    span.textContent = t.label;
    label.append(cb, span);
    box.appendChild(label);
  });
  const set = (name, val) => { const el = document.querySelector(`input[name="${name}"][value="${val}"]`); if (el) el.checked = true; };
  set("range", settings.range); 
  set("accents", settings.accents); 
  set("lang", settings.lang);
  $("opt-phrases").checked = !!settings.phrases;
}

function readSettings(){
  const tenses = [...document.querySelectorAll("#tense-chips input:checked")].map(cb => cb.value);
  settings.tenses = tenses.length ? tenses : DEFAULT_TENSES;
  settings.range = parseInt(document.querySelector('input[name="range"]:checked')?.value || "100", 10);
  settings.accents = document.querySelector('input[name="accents"]:checked')?.value || "strict";
  settings.lang = document.querySelector('input[name="lang"]:checked')?.value || "ru";
  settings.phrases = $("opt-phrases").checked;
  save("cj2-settings", settings);
}

function renderAccentBar(){
  const bar = $("accent-bar");
  ACCENTS.forEach(ch => {
    const b = document.createElement("button");
    b.type = "button"; 
    b.textContent = ch;
    b.addEventListener("mousedown", e => e.preventDefault());
    b.addEventListener("touchstart", e => { e.preventDefault(); insertChar(ch); }, { passive: false });
    b.addEventListener("click", () => insertChar(ch));
    bar.appendChild(b);
  });
}
function insertChar(ch){
  if (!activeInput || activeInput.readOnly) return;
  const s = activeInput.selectionStart ?? activeInput.value.length;
  const e = activeInput.selectionEnd ?? s;
  activeInput.value = activeInput.value.slice(0, s) + ch + activeInput.value.slice(e);
  activeInput.focus();
  activeInput.setSelectionRange(s + 1, s + 1);
}

function showScreen(name){
  $("screen-settings").hidden = name !== "settings";
  $("screen-train").hidden = name !== "train";
  $("accent-bar").style.display = name === "train" ? "flex" : "none";
}
function renderStats(){
  $("stat-streak").textContent = stats.streak;
  $("stat-xp").textContent = stats.xp;
  $("stat-lvl").textContent = "Lv" + (Math.floor(stats.xp / XP_PER_LEVEL) + 1);
}

function setupServiceWorker(){
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").then(reg => {
    reg.update();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reg.update();
    });
    reg.addEventListener("updatefound", () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener("statechange", () => {
        if (nw.state === "installed" && navigator.serviceWorker.controller) {
          nw.postMessage("SKIP_WAITING");
        }
      });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
}

async function init(){
  renderStats();
  renderAccentBar();
  renderSettings();
  applyI18n();
  showScreen("settings");

  const res = await fetch("verbs.json");
  DB = (await res.json()).verbs;

  $("btn-start").addEventListener("click", () => { readSettings(); cardCount = 0; showScreen("train"); newCard(); });
  document.querySelectorAll('input[name="lang"]').forEach(r =>
    r.addEventListener("change", () => { 
      settings.lang = r.value; 
      save("cj2-settings", settings); 
      applyI18n(); 
      if (card) renderCard(); 
    }));
  $("btn-settings").addEventListener("click", () => { renderSettings(); showScreen("settings"); });
  $("btn-back").addEventListener("click", () => { cardCount = 0; showScreen("settings"); });
  $("btn-next").addEventListener("click", newCard);
  $("btn-skip").addEventListener("click", newCard);
  $("phrase-input").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); checkPhrase(); } });
  $("phrase-input").addEventListener("focus", e => { activeInput = e.target; });
  $("phrase-reveal").addEventListener("click", revealPhrase);

  setupServiceWorker();
}
init();
