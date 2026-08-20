// Тесты логики app.js v2 (node test.js)
const fs = require("fs");
let code = fs.readFileSync("app.js", "utf8");
code = code.replace(/init\(\);\s*$/, "module.exports = { buildAnswers, pronounLabel, norm, normPhrase, stripAccents, TENSES };");

global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = { getElementById: () => ({ addEventListener(){}, style:{} }), querySelector: () => null, querySelectorAll: () => [] };
global.navigator = { userAgent: "test" };
global.window = { matchMedia: () => ({ matches: false }) };

const m = new (require("module").Module)("test");
m._compile(code, "app.js");
const { buildAnswers, pronounLabel, norm, normPhrase, stripAccents, TENSES } = m.exports;

const db = JSON.parse(fs.readFileSync("verbs.json", "utf8")).verbs;
const get = inf => db.find(v => v.inf === inf);

let fails = 0;
function eq(actual, expected, label){
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.log("FAIL", label, "\n  got:", a, "\n  exp:", e); fails++; }
  else console.log("ok  ", label);
}

eq(buildAnswers(get("parler"), "P").map(a=>a.display),
   ["parle","parles","parle","parlons","parlez","parlent"], "parler présent");
eq(buildAnswers(get("parler"), "PC").map(a=>a.display),
   ["ai parlé","as parlé","a parlé","avons parlé","avez parlé","ont parlé"], "parler PC");
eq(buildAnswers(get("être"), "J").map(a=>a.display),
   ["fus","fus","fut","fûmes","fûtes","furent"], "être passé simple");
eq(buildAnswers(get("parler"), "T").map(a=>a.display),
   ["parlasse","parlasses","parlât","parlassions","parlassiez","parlassent"], "parler subj imparfait");
eq(buildAnswers(get("parler"), "Y").map(a=>a.display), ["parle","parlons","parlez"], "parler impératif");
eq(buildAnswers(get("aller"), "FA")[0].display, "serai allé(e)", "aller futur antérieur");
eq(buildAnswers(get("aller"), "SP")[0].accepted, ["sois allé","sois allée"], "aller subj passé accepted");
eq(buildAnswers(get("finir"), "CP")[3].display, "aurions fini", "finir cond passé");
eq(buildAnswers(get("aller"), "PA")[2].display, "fut allé(e)", "aller passé antérieur");

eq(pronounLabel("P", 0, "parle"), "je", "je");
eq(pronounLabel("PC", 0, "ai parlé"), "j'", "j'");
eq(pronounLabel("S", 0, "aille"), "que j'", "que j'");
eq(pronounLabel("S", 2, "aille"), "qu'il/elle", "qu'il");
eq(pronounLabel("Y", 1, "parlons"), "(nous)", "imp nous");

eq(normPhrase("  Je parle   français.  "), "je parle francais".replace("francais","français"), "normPhrase");
eq(normPhrase("Laisse-moi tranquille."), "laisse moi tranquille", "normPhrase hyphen");
eq(stripAccents("allé"), "alle", "stripAccents");

// целостность базы
let bad = 0;
for (const v of db) {
  if (!v.t.P || v.t.P.length !== 6) bad++;
  if (!v.pp || v.pp.length !== 4) bad++;
  if (!v.ru || !v.en) bad++;
}
eq(bad, 0, "база: у всех " + db.length + " глаголов есть P, pp, ru, en");
const withPhr = db.filter(v => v.phr).length;
console.log("глаголов с фразами:", withPhr);

console.log(fails ? `\n${fails} FAILURES` : "\nALL TESTS PASSED");
process.exit(fails ? 1 : 0);
