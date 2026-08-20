/* Conjugueur v2.4 — тренажёр французских спряжений */
"use strict";

/* ---------- Времена ---------- */
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

/* ---------- Состояние ---------- */
let DB = [];
let settings = load("cj2-settings", { tenses: DEFAULT_TENSES, range: 100, accents: "strict", lang: "ru", phrases: true });
if (!Array.isArray(settings.tenses) || !settings.tenses.length || !settings.tenses.every(t => TENSES[t])) settings.tenses = DEFAULT_TENSES;
let stats = load("cj2-stats", { streak: 0, done: 0, xp: 0 });
let card = null;
let activeInput = null;

function load(k, def){ try { return Object.assign({}, def, JSON.parse(localStorage.getItem(k)) || {}); } catch(e){ return def; } }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
const $ = id => document.getElementById(id);

/* ---------- Переводы интерфейса ---------- */
const I18N = {
  ru: {
    h1: "Что учим сегодня? 💪",
    tenses: "⏰ Времена", 
    verbs: "📚 Глаголы", 
    lang: "🌍 Язык перевода", 
    accents: "´ Акценты (é, è, ç…)",
    top50: "Топ-50", 
    top100: "Топ-100", 
    top300: "Топ-300", 
    all: "Все 581 🤯",
    strict: "Строго 😤", 
    lenient: "Мягко 😌",
    bonus: "💬 Бонус", 
    bonusOpt: "Перевести предложение (+25 ⚡)",
    start: "Тренировать глаголы! 🚀", 
    skip: "Пропустить ⏭", 
    next: "Дальше →",
    phraseLabel: "💬 Бонусное задание! Переведи на французский:",
    reveal: "Показать ответ (без очков)",
    streak: "Серия карточек без ошибок", 
    xp: "Опыт и уровень", 
    settings: "Настройки",
    corrRetype: "правильно: <b>{a}</b> — перепечатай",
    corrAlmost: "почти! проверь акценты: <b>{a}</b>",
    corrPartial: "подсказка: <b>{root}</b>...",
    noVerbs: "Для выбранных времён нет подходящих глаголов — измени настройки.",
    vVerbs: "глагол", 
    vTenses: "времён",
  },
  en: {
    h1: "What shall we train today? 💪",
    tenses: "⏰ Tenses", 
    verbs: "📚 Verbs", 
    lang: "🌍 Translation language", 
    accents: "´ Accents (é, è, ç…)",
    top50: "Top 50", 
    top100: "Top 100", 
    top300: "Top 300", 
    all: "All 581 🤯",
    strict: "Strict 😤", 
    lenient: "Lenient 😌",
    bonus: "💬 Bonus", 
    bonusOpt: "Translate a phrase into French (+25 ⚡)",
    start: "Start training! 🚀", 
    skip: "Skip ⏭", 
    next: "Next →",
    phraseLabel: "💬 Bonus task! Translate into French:",
    reveal: "Show answer (no points)",
    streak: "Streak of flawless cards", 
    xp: "XP and level", 
    settings: "Settings",
    corrRetype: "correct: <b>{a}</b> — retype it",
    corrAlmost: "almost! check the accents: <b>{a}</b>",
    corrPartial: "hint: <b>{root}</b>...",
    noVerbs: "No verbs match the selected tenses — change the settings.",
    vVerbs: "verbs", 
    vTenses: "tenses",
  },
};
function L(key){ return (I18N[settings.lang] || I18N.ru)[key] || I18N.ru[key] || key; }
function applyI18n(){
  document.documentElement.lang = settings.lang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = L(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = L(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = L(el.dataset.i18nTitle); });
}

/* ---------- Нормализация ---------- */
function stripAccents(s){ return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function norm(s){
  return s.trim().toLowerCase().replace(/\u2019/g, "'").replace(/œ/g, "oe").replace(/\s+/g, " ");
}
function normPhrase(s){
  return norm(s).replace(/[.!?,;:]/g, "").replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

/* ---------- Карточка ---------- */
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
  card = { verb, tenseId, answers,
           solved: answers.map(() => false),
           err: answers.map(() => 0),
           hadError: false, phraseDone: false };
  renderCard();
}

/* ---------- Рендер ---------- */
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

/* ---------- Проверка форм ---------- */
function check(i){
  if (card.solved[i]) { focusNext(i); return; }
  const input = document.querySelector(`#rows input[data-i="${i}"]`);
  const ans = card.answers[i];
  const val = norm(input.value);
  const mark = $("mark-" + i), corr = $("corr-" + i);

  let ok = ans.accepted.includes(val);
