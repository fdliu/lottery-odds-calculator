
"use strict";

/* =====================================================================
   Core math (formulas)
   C(n,k) = n! / (k! * (n-k)!)
   P(match exactly x of the picked, out of a pool of N) =
       C(pick, x) * C(N-pick, pick-x) / C(N, pick)
   A prize tier combines independent main and bonus draws, so:
       P(tier) = P(main, x) * P(bonus, y)
   Odds = 1 / P(tier)
   EV_jackpot = J * (1 - e^(-N*p)) / N     (split among expected winners)
   EV_total   = EV_jackpot + sum(P_tier * prize) - ticket_cost
   ===================================================================== */

function comb(n, k){
  if(k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for(let i = 0; i < k; i++){ r = r * (n - i) / (i + 1); }
  return r;
}
function matchProb(pick, total, x){
  if(x < 0 || x > pick) return 0;
  return comb(pick, x) * comb(total - pick, pick - x) / comb(total, pick);
}

// prize: null = jackpot, number = fixed USD prize, "variable" = pari-mutuel
const GAMES = {
  powerball: {
    label: "Powerball",
    note: "5 white balls (1–69) + 1 Powerball (1–26)",
    mainPick: 5, mainMax: 69, bonusPick: 1, bonusMax: 26,
    tiers: [
      [5,1,"Jackpot",null],
      [5,0,"Match 5",1000000],
      [4,1,"Match 4 + Powerball",50000],
      [4,0,"Match 4",100],
      [3,1,"Match 3 + Powerball",100],
      [3,0,"Match 3",7],
      [2,1,"Match 2 + Powerball",7],
      [1,1,"Match 1 + Powerball",4],
      [0,1,"Powerball only",4]
    ]
  },
  megamillions: {
    label: "Mega Millions",
    note: "5 white balls (1–70) + 1 Mega Ball (1–24)",
    mainPick: 5, mainMax: 70, bonusPick: 1, bonusMax: 24,
    tiers: [
      [5,1,"Jackpot",null],
      [5,0,"Match 5",1000000],
      [4,1,"Match 4 + Mega Ball",10000],
      [4,0,"Match 4",500],
      [3,1,"Match 3 + Mega Ball",200],
      [3,0,"Match 3",10],
      [2,1,"Match 2 + Mega Ball",10],
      [1,1,"Match 1 + Mega Ball",4],
      [0,1,"Mega Ball only",2]
    ]
  },
  euromillions: {
    label: "EuroMillions",
    note: "5 main (1–50) + 2 Lucky Stars (1–12). Secondary prizes are pari-mutuel and vary by draw.",
    mainPick: 5, mainMax: 50, bonusPick: 2, bonusMax: 12,
    tiers: [
      [5,2,"Jackpot",null],
      [5,1,"Match 5 + 1 star","variable"],
      [5,0,"Match 5","variable"],
      [4,2,"Match 4 + 2 stars","variable"],
      [4,1,"Match 4 + 1 star","variable"],
      [3,2,"Match 3 + 2 stars","variable"],
      [4,0,"Match 4","variable"],
      [2,2,"Match 2 + 2 stars","variable"],
      [3,1,"Match 3 + 1 star","variable"],
      [3,0,"Match 3","variable"],
      [1,2,"Match 1 + 2 stars","variable"],
      [2,1,"Match 2 + 1 star","variable"],
      [2,0,"Match 2","variable"]
    ]
  }
};

const $ = id => document.getElementById(id);

function currentGame(){
  const g = $("game").value;
  if(g === "custom"){
    return {
      label: "Custom",
      note: "Custom game. Prize tiers are not defined, so only jackpot-style odds are shown.",
      mainPick: intVal("cMainPick"), mainMax: intVal("cMainMax"),
      bonusPick: intVal("cBonusPick"), bonusMax: intVal("cBonusMax"),
      tiers: []
    };
  }
  return GAMES[g];
}
function intVal(id){ const v = parseInt($(id).value, 10); return (isNaN(v) || v < 0) ? 0 : v; }

function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
function fmtMoney(n){ return n.toLocaleString("en-US", {style:"currency", currency:"USD", maximumFractionDigits:2}); }

function renderOdds(){
  const g = currentGame();
  $("gameNote").textContent = g.note;
  fillPerspective();
  const tbody = $("oddsBody");
  tbody.innerHTML = "";
  if(g.tiers.length === 0){
    const pAll = matchProb(g.mainPick, g.mainMax, g.mainPick) * matchProb(g.bonusPick, g.bonusMax, g.bonusPick);
    const pMainOnly = matchProb(g.mainPick, g.mainMax, g.mainPick);
    [["Match all numbers", pAll], ["Match all main (any bonus)", pMainOnly]].forEach(r => {
      const tr = document.createElement("tr");
      const oneIn = r[1] > 0 ? fmt(1 / r[1]) : "∞";
      const pct = (r[1] * 100).toExponential(2) + "%";
      tr.innerHTML = "<td class='rowhead'>" + r[0] + "</td><td data-label='Prize'>—</td><td class='mono' data-label='Odds (1 in)'>" + oneIn + "</td><td class='mono' data-label='Probability'>" + pct + "</td>";
      tbody.appendChild(tr);
    });
    return;
  }
  g.tiers.forEach(t => {
    const mx = t[0], bx = t[1], label = t[2], prize = t[3];
    const p = matchProb(g.mainPick, g.mainMax, mx) * matchProb(g.bonusPick, g.bonusMax, bx);
    const oneIn = fmt(1 / p);
    const pct = (p * 100) < 0.001 ? (p * 100).toExponential(2) + "%" : (p * 100).toFixed(4) + "%";
    const prizeStr = prize === null ? "Jackpot (variable)" : (prize === "variable" ? "Varies" : fmtMoney(prize));
    const tr = document.createElement("tr");
    tr.innerHTML = "<td class='rowhead'>" + label + "</td><td data-label='Prize'>" + prizeStr + "</td><td class='mono' data-label='Odds (1 in)'>" + oneIn + "</td><td class='mono' data-label='Probability'>" + pct + "</td>";
    tbody.appendChild(tr);
  });
}

/* ---- probability in perspective ---- */
const REFS = [
  { label: "being struck by lightning in your lifetime (US)", odds: 15300 },
  { label: "drawing a royal flush in 5-card poker", odds: 649740 },
  { label: "being attacked by a shark", odds: 3748067 },
  { label: "dying in a plane crash (per flight)", odds: 11000000 }
];

function fillPerspective(){
  const g = currentGame();
  const sel = $("perspTier");
  if(!sel) return;
  sel.innerHTML = "";
  const opts = [];
  if(g.tiers.length === 0){
    const pAll = matchProb(g.mainPick, g.mainMax, g.mainPick) * matchProb(g.bonusPick, g.bonusMax, g.bonusPick);
    const pMain = matchProb(g.mainPick, g.mainMax, g.mainPick);
    opts.push(["Match all numbers", pAll]);
    opts.push(["Match all main (any bonus)", pMain]);
  } else {
    g.tiers.forEach(t => {
      const p = matchProb(g.mainPick, g.mainMax, t[0]) * matchProb(g.bonusPick, g.bonusMax, t[1]);
      opts.push([t[2], p]);
    });
    const pAny = g.tiers.reduce((s, t) => s + matchProb(g.mainPick, g.mainMax, t[0]) * matchProb(g.bonusPick, g.bonusMax, t[1]), 0);
    opts.push(["Any prize", pAny]);
  }
  opts.forEach(o => {
    const op = document.createElement("option");
    op.value = o[1].toExponential(12);
    op.textContent = o[0] + " — 1 in " + fmt(1 / o[1]);
    sel.appendChild(op);
  });
  sel.selectedIndex = 0;
  renderPerspective();
}

function renderPerspective(){
  const sel = $("perspTier");
  const out = $("perspOut");
  if(!sel || !sel.value){ out.innerHTML = ""; return; }
  const p = parseFloat(sel.value);
  if(!(p > 0)){ out.innerHTML = ""; return; }
  const odds = 1 / p;
  const label = sel.options[sel.selectedIndex].textContent.split(" — ")[0];
  const dpy = {powerball:156, megamillions:104, euromillions:104}[$("game").value] || 156;
  const lines = [];
  lines.push("<strong>" + label + "</strong>: about 1 in " + fmt(odds) + ".");
  const flips = Math.max(1, Math.round(Math.log2(odds)));
  lines.push("About as likely as flipping a fair coin and getting heads " + flips + " times in a row.");
  if(odds > dpy){
    lines.push("Buying 1 line per draw (" + dpy + " draws a year), you would average about " + fmt(Math.round(odds / dpy)) + " years between wins.");
  }
  REFS.forEach(r => {
    if(odds > r.odds){
      lines.push("You are about " + fmt(Math.round(odds / r.odds)) + "× more likely to experience " + r.label + " (~1 in " + fmt(r.odds) + ").");
    } else {
      lines.push("This prize is about " + fmt(Math.round(r.odds / odds)) + "× more likely than " + r.label + " (~1 in " + fmt(r.odds) + ").");
    }
  });
  out.innerHTML = lines.map(l => "<div style='margin-bottom:4px;'>" + l + "</div>").join("") +
    "<div style='margin-top:8px;font-size:.72rem;'>Reference-event odds are rough population statistics used only to make the size of the probability feel real — they are not precise.</div>";
}

function calcEV(){
  const g = currentGame();
  const jackpot = parseFloat($("jackpot").value) || 0;
  const cost = parseFloat($("cost").value) || 0;
  const N = parseFloat($("tickets").value) || 0;
  const fed = Math.min(60, Math.max(0, parseFloat($("fedTax").value) || 0)) / 100;
  const state = Math.min(20, Math.max(0, parseFloat($("stateTax").value) || 0)) / 100;
  const tax = Math.min(0.9, fed + state);
  const out = $("evResult");
  const note = $("evNote");
  out.innerHTML = ""; note.textContent = "";

  if(g.tiers.length === 0){
    out.innerHTML = "<p class='note'>EV needs a defined prize table. Pick Powerball or Mega Millions to see expected value.</p>";
    return;
  }

  let jackTier = null;
  for(const t of g.tiers){ if(t[3] === null){ jackTier = t; break; } }
  const pJack = jackTier ? (matchProb(g.mainPick, g.mainMax, jackTier[0]) * matchProb(g.bonusPick, g.bonusMax, jackTier[1])) : 0;

  let evJack = 0;
  if(pJack > 0 && N > 0){
    evJack = jackpot * (1 - Math.exp(-N * pJack)) / N;
  }
  let evFixed = 0;
  for(const t of g.tiers){
    if(typeof t[3] === "number"){
      const p = matchProb(g.mainPick, g.mainMax, t[0]) * matchProb(g.bonusPick, g.bonusMax, t[1]);
      evFixed += p * t[3];
    }
  }
  const gross = evJack + evFixed;                 // expected gross return, pre-tax
  const netPre = gross - cost;                    // pre-tax EV (net)
  const grossAfter = gross * (1 - tax);           // expected return after tax
  const netAfter = grossAfter - cost;             // after-tax EV (net)
  const lossAfter = Math.max(0, cost - grossAfter);

  let verdict = "", cls = "";
  if(netAfter > 0){ verdict = "Positive EV after tax — extremely rare, usually only possible with a very large jackpot."; cls = "verdict-pos"; }
  else { verdict = "Negative EV after tax — on average you lose money per ticket. This is the real cost of playing."; cls = "verdict-neg"; }

  let bar = "";
  if(cost > 0){
    const retPct = Math.max(0, Math.min(100, grossAfter / cost * 100));
    const lossPct = Math.max(0, 100 - retPct);
    bar =
      "<div class='lossbar'><div class='ret' style='width:" + retPct.toFixed(2) + "%' title='Expected return'></div><div class='loss' style='width:" + lossPct.toFixed(2) + "%' title='Expected loss'></div></div>" +
      "<div class='note'><span style='color:var(--green);'>Return " + fmtMoney(grossAfter) + " (" + retPct.toFixed(0) + "%)</span> · <span style='color:var(--red);'>Loss " + fmtMoney(lossAfter) + " (" + lossPct.toFixed(0) + "%)</span> per " + fmtMoney(cost) + " ticket</div>";
  }

  out.innerHTML =
    "<div>Expected value per ticket <span class='note'>(after tax)</span></div>" +
    "<div class='big " + cls + "'>" + fmtMoney(netAfter) + "</div>" +
    "<div class='note'>Pre-tax EV: " + fmtMoney(netPre) + " · Expected return (after tax): " + fmtMoney(grossAfter) + " · Expected loss: " + fmtMoney(lossAfter) + "</div>" +
    bar +
    "<div class='note'>Jackpot odds: 1 in " + fmt(1 / pJack) + " · EV from jackpot: " + fmtMoney(evJack) + " · EV from fixed prizes: " + fmtMoney(evFixed) + " · Ticket cost: -" + fmtMoney(cost) + "</div>" +
    "<div class='note " + cls + "'>" + verdict + "</div>";

  note.textContent = "Assumes every prize is taxed at " + Math.round(tax * 100) + "% (federal " + Math.round(fed * 100) + "% + state " + (state * 100) + "%). Jackpot is split among expected winners (Poisson). Estimate only — not tax advice.";
  renderPayout(jackpot, tax);
}

function renderPayout(cash, tax){
  const out = $("payoutOut");
  out.innerHTML = "";
  if(cash <= 0){ return; }
  const ratio = Math.min(1, Math.max(0.01, (parseFloat($("cashRatio").value) || 52) / 100));
  const r = Math.min(0.2, Math.max(0, (parseFloat($("discRate").value) || 4) / 100));
  const n = 30;
  const advertised = cash / ratio;
  const lumpAfter = cash * (1 - tax);
  const annNominalAfter = advertised * (1 - tax);
  const pmtAfter = annNominalAfter / n;
  const pv = r === 0 ? annNominalAfter : pmtAfter * (1 - Math.pow(1 + r, -n)) / r;
  out.innerHTML =
    "<table style='margin-top:4px;'><colgroup><col style='width:34%'><col style='width:33%'><col style='width:33%'></colgroup>" +
    "<thead><tr><th></th><th>Lump sum (cash)</th><th>Annuity (30 yrs)</th></tr></thead><tbody>" +
    "<tr><td class='rowhead'>Pre-tax total</td><td class='mono' data-label='Lump sum'>" + fmtMoney(cash) + "</td><td class='mono' data-label='Annuity'>" + fmtMoney(advertised) + "</td></tr>" +
    "<tr><td class='rowhead'>After-tax total</td><td class='mono' data-label='Lump sum'>" + fmtMoney(lumpAfter) + "</td><td class='mono' data-label='Annuity'>" + fmtMoney(annNominalAfter) + "</td></tr>" +
    "<tr><td class='rowhead'>Present value</td><td class='mono' data-label='Lump sum'>" + fmtMoney(lumpAfter) + "</td><td class='mono' data-label='Annuity'>" + fmtMoney(pv) + "</td></tr>" +
    "</tbody></table>" +
    "<div class='note'>After tax at " + Math.round(tax * 100) + "%. Annuity present value discounts 30 yearly payments at " + (r * 100) + "% per year. The advertised jackpot is a nominal total, not cash you receive today.</div>";
}

function pickSet(max, count){
  const arr = [];
  for(let i = 1; i <= max; i++) arr.push(i);
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr.slice(0, count).sort((a, b) => a - b);
}
function filterViolations(nums, noBirthday, noConsecutive, noSameTail){
  const sorted = nums.slice().sort((a, b) => a - b);
  let birthday = 0, consecutive = 0, sameTail = 0;
  if(noBirthday){
    birthday = sorted.filter(n => n >= 1 && n <= 31).length;
  }
  if(noConsecutive){
    let run = 1;
    for(let i = 1; i < sorted.length; i++){
      run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
      if(run >= 3) consecutive = Math.max(consecutive, run);
    }
  }
  if(noSameTail){
    const tails = {};
    sorted.forEach(n => { const t = n % 10; tails[t] = (tails[t] || 0) + 1; });
    sameTail = Math.max(0, ...Object.values(tails));
  }
  return { birthday, consecutive, sameTail };
}

function quickPick(){
  const g = currentGame();
  const out = $("pickOut");
  const note = $("pickFilterNote");
  out.innerHTML = ""; if(note) note.textContent = "";
  const noB = $("fltBirthday").checked;
  const noC = $("fltConsecutive").checked;
  const noS = $("fltSameTail").checked;
  let main = pickSet(g.mainMax, g.mainPick);
  if(noB || noC || noS){
    for(let attempt = 0; attempt < 300; attempt++){
      main = pickSet(g.mainMax, g.mainPick);
      const v = filterViolations(main, noB, noC, noS);
      if(!(noB && v.birthday > 2) && !(noC && v.consecutive >= 3) && !(noS && v.sameTail >= 3)) break;
    }
  }
  const frag = document.createDocumentFragment();
  main.forEach(n => {
    const s = document.createElement("span");
    s.className = "ball"; s.textContent = n;
    frag.appendChild(s);
  });
  pickSet(g.bonusMax, g.bonusPick).forEach(n => {
    const s = document.createElement("span");
    s.className = "ball bonus"; s.textContent = n;
    frag.appendChild(s);
  });
  out.appendChild(frag);
  const v = filterViolations(main, true, true, true);
  if(note) note.textContent = "Birthday-range numbers: " + v.birthday + " · longest consecutive run: " + v.consecutive + " · max same last digit: " + v.sameTail + ".";
}

function onGameChange(){
  $("customFields").style.display = $("game").value === "custom" ? "block" : "none";
  renderOdds();
  renderHot();
  renderMulti();
  renderCompare();
  $("evResult").innerHTML = ""; $("evNote").textContent = "";
  $("payoutOut").innerHTML = "";
  $("pickOut").innerHTML = ""; $("pickFilterNote").textContent = "";
  $("myResult").innerHTML = "";
}

/* ================= Historical draw data (real sample) =================
   Powerball: last 30 draws (powerball.com). Mega Millions: last 10 draws
   (national-lottery.com). For production, replace with a live feed.
   Newest first. m = main numbers, b = bonus number, d = draw date. */
const DRAWS = {
  powerball: [
    {d:"2026-11-11",m:[8,42,45,51,57],b:17},
    {d:"2026-11-09",m:[13,34,41,45,48],b:25},
    {d:"2026-11-07",m:[3,36,37,56,61],b:21},
    {d:"2026-11-04",m:[15,34,41,53,56],b:21},
    {d:"2026-11-02",m:[7,23,29,64,66],b:23},
    {d:"2026-10-31",m:[2,4,18,50,56],b:20},
    {d:"2026-10-28",m:[11,13,16,47,60],b:13},
    {d:"2026-10-26",m:[18,26,49,50,54],b:1},
    {d:"2026-10-24",m:[4,5,15,19,55],b:19},
    {d:"2026-10-21",m:[1,21,44,50,57],b:5},
    {d:"2026-10-19",m:[8,31,32,42,48],b:23},
    {d:"2026-10-17",m:[12,13,24,32,35],b:11},
    {d:"2026-10-14",m:[3,34,37,42,46],b:20},
    {d:"2026-10-12",m:[22,28,38,51,69],b:9},
    {d:"2026-10-10",m:[1,4,19,33,51],b:15},
    {d:"2026-10-07",m:[11,13,14,21,65],b:19},
    {d:"2026-10-05",m:[16,23,32,36,54],b:9},
    {d:"2026-10-03",m:[4,42,44,55,59],b:14},
    {d:"2026-09-30",m:[4,6,23,33,44],b:13},
    {d:"2026-09-28",m:[17,21,29,42,49],b:7},
    {d:"2026-09-26",m:[14,40,52,55,57],b:24},
    {d:"2026-09-23",m:[5,15,26,29,30],b:14},
    {d:"2026-09-21",m:[2,7,9,17,58],b:20},
    {d:"2026-09-19",m:[18,30,41,45,68],b:10},
    {d:"2026-09-16",m:[2,21,24,25,64],b:7},
    {d:"2026-09-14",m:[19,20,57,61,67],b:22},
    {d:"2026-09-12",m:[14,16,23,58,69],b:3},
    {d:"2026-09-09",m:[9,40,42,55,65],b:23},
    {d:"2026-09-07",m:[15,19,28,39,56],b:3},
    {d:"2026-09-05",m:[15,40,47,53,59],b:9}
  ],
  megamillions: [
    {d:"2026-11-13",m:[10,22,33,49,57],b:18},
    {d:"2026-11-10",m:[2,18,25,30,65],b:22},
    {d:"2026-11-06",m:[27,34,44,53,64],b:1},
    {d:"2026-11-03",m:[4,24,31,62,70],b:3},
    {d:"2026-10-30",m:[5,10,38,49,68],b:17},
    {d:"2026-10-27",m:[14,19,21,45,67],b:3},
    {d:"2026-10-23",m:[3,7,46,49,51],b:5},
    {d:"2026-10-20",m:[13,28,33,35,48],b:3},
    {d:"2026-07-03",m:[5,9,29,47,57],b:16},
    {d:"2026-06-30",m:[26,41,50,53,62],b:12}
  ]
};

function hotCold(key){
  const g = GAMES[key];
  const draws = DRAWS[key];
  if(!g || !draws || draws.length === 0) return null;
  const mf = new Array(g.mainMax + 1).fill(0);
  const bf = new Array(g.bonusMax + 1).fill(0);
  const seen = {};
  draws.forEach((dr, i) => {
    dr.m.forEach(n => { mf[n]++; if(!(n in seen)) seen[n] = i; });
    if(!(dr.b in seen)) seen[dr.b] = i;
  });
  const build = (max, freq) => {
    const a = [];
    for(let n = 1; n <= max; n++) a.push({n, f: freq[n], ago: (n in seen) ? seen[n] : draws.length});
    return a;
  };
  const main = build(g.mainMax, mf);
  const bonus = build(g.bonusMax, bf);
  const byHot = (a,b) => b.f - a.f || a.ago - b.ago;
  const byCold = (a,b) => a.f - b.f || b.ago - a.ago;
  const byOver = (a,b) => b.ago - a.ago || a.f - b.f;
  return {
    hotMain: [...main].sort(byHot).slice(0,5),
    coldMain: [...main].sort(byCold).slice(0,5),
    overMain: [...main].sort(byOver).slice(0,5),
    hotBonus: [...bonus].sort(byHot).slice(0,3),
    coldBonus: [...bonus].sort(byCold).slice(0,3),
    overBonus: [...bonus].sort(byOver).slice(0,3),
    count: draws.length,
    from: draws[draws.length - 1].d,
    to: draws[0].d
  };
}

function statRow(label, items, mode, bonus){
  const balls = items.map(x => {
    const tip = mode === "ago" ? ("last seen " + x.ago + " draws ago") : ("drawn " + x.f + " times");
    return '<span class="ball' + (bonus ? " bonus" : "") + '" title="' + tip + '">' + x.n + '</span>';
  }).join("");
  return '<div style="margin-bottom:14px;"><div style="color:var(--muted);font-size:.8rem;margin-bottom:6px;">' + label + '</div><div class="balls" style="margin:0;">' + balls + '</div></div>';
}

function renderHot(){
  const key = $("game").value;
  const out = $("hotContent");
  const note = $("hotNote");
  out.innerHTML = "";
  if(!DRAWS[key]){
    note.textContent = "Historical results are included for Powerball and Mega Millions only. Pick one of those games.";
    return;
  }
  const hc = hotCold(key);
  if(!hc){ note.textContent = "No data available."; return; }
  note.textContent = "Based on " + hc.count + " real draws (" + hc.from + " to " + hc.to + ") from powerball.com and national-lottery.com. Frequencies describe the past only — they do not change future odds.";
  out.innerHTML =
    statRow("Hot — most frequent", hc.hotMain, "freq", false) +
    statRow("Cold — least frequent", hc.coldMain, "freq", false) +
    statRow("Overdue — longest gap", hc.overMain, "ago", false) +
    statRow("Bonus — hot", hc.hotBonus, "freq", true) +
    statRow("Bonus — cold", hc.coldBonus, "freq", true) +
    statRow("Bonus — overdue", hc.overBonus, "ago", true);
}

function parseNums(s){ return (s.match(/\d+/g) || []).map(Number); }

function prizeHit(g, mc, bc){
  for(const t of g.tiers){ if(t[0] === mc && t[1] === bc) return true; }
  return false;
}

function myWindowCount(){
  const v = $("myWindow").value;
  if(v === "custom"){
    const n = parseInt($("myWindowCustom").value, 10);
    return (Number.isFinite(n) && n >= 1) ? n : null;
  }
  return parseInt(v, 10);
}

function onWindowChange(){
  $("myWindowCustomWrap").style.display = $("myWindow").value === "custom" ? "" : "none";
}

function validateSet(main, bonus){
  const g = currentGame();
  if(main.length !== g.mainPick || main.some(n => n < 1 || n > g.mainMax) || new Set(main).size !== main.length){
    return "Enter exactly " + g.mainPick + " distinct main numbers between 1 and " + g.mainMax + ".";
  }
  if(bonus.length !== g.bonusPick || bonus.some(n => n < 1 || n > g.bonusMax) || new Set(bonus).size !== bonus.length){
    return "Enter " + g.bonusPick + " bonus number(s) between 1 and " + g.bonusMax + ".";
  }
  return null;
}

function computeCheck(main, bonus, key){
  const g = GAMES[key];
  const all = DRAWS[key];
  if(!g || !all){ return { error: "Historical results are included for Powerball and Mega Millions only." }; }
  const want = myWindowCount();
  if(want === null){ return { error: "Enter a valid custom number of draws." }; }
  const draws = all.slice(0, want);
  const capped = draws.length < want;
  const mset = new Set(main);
  let best = null, prizeDraws = 0, twoPlus = 0;
  draws.forEach(dr => {
    let mc = 0; dr.m.forEach(n => { if(mset.has(n)) mc++; });
    const bc = bonus.includes(dr.b) ? 1 : 0;
    if(!best || mc > best.mc || (mc === best.mc && bc > best.bc)) best = {mc, bc, d: dr.d};
    if(prizeHit(g, mc, bc)) prizeDraws++;
    if(mc >= 2) twoPlus++;
  });
  return {
    drawsCount: draws.length, total: all.length, capped,
    from: draws[draws.length - 1].d, to: draws[0].d,
    best, prizeDraws, twoPlus
  };
}

function singleResultHtml(r){
  let html = "<div>Checked against " + r.drawsCount + " recent draws (" + r.from + " to " + r.to + ")." + (r.capped ? " Built-in sample only has " + r.total + " draws." : "") + "</div>";
  html += "<div style='margin-top:8px;'>Best match: <strong>" + r.best.mc + " main" + (r.best.bc ? " + bonus" : "") + "</strong> on " + r.best.d + ".</div>";
  html += "<div class='note'>Draws with a prize-tier match: " + r.prizeDraws + " · Draws with 2+ main matched: " + r.twoPlus + ".</div>";
  return html;
}

function runCheck(main, bonus, key, out){
  const r = computeCheck(main, bonus, key);
  out.innerHTML = r.error ? "<p class='note'>" + r.error + "</p>" : singleResultHtml(r);
}

function checkMyNumbers(){
  const key = $("game").value;
  const out = $("myResult");
  out.innerHTML = "";
  const main = parseNums($("myMain").value);
  const bonus = parseNums($("myBonus").value);
  const err = validateSet(main, bonus);
  if(err){ out.innerHTML = "<p class='note'>" + err + "</p>"; return; }
  runCheck(main, bonus, key, out);
}

/* ---- saved number sets (localStorage) ---- */
const STORE_KEY = "trueodds.mynumbers.v1";

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function loadSets(){
  try { const a = JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); return Array.isArray(a) ? a : []; }
  catch(e){ return []; }
}
function persistSets(sets){ try { localStorage.setItem(STORE_KEY, JSON.stringify(sets)); } catch(e){} }

function renderSaved(){
  const out = $("savedList");
  const sets = loadSets();
  out.innerHTML = "";
  if(sets.length === 0){
    out.innerHTML = "<div style='font-size:.85rem;color:var(--muted);margin-bottom:6px;'>Saved sets</div><p class='note'>None yet. Enter numbers above, name them, and tap Save this set.</p>";
    return;
  }
  let html = "<div style='font-size:.85rem;color:var(--muted);margin-bottom:8px;'>Saved sets (" + sets.length + ")</div>";
  sets.forEach((s, i) => {
    let balls = s.main.map(n => '<span class="ball">' + n + '</span>').join("");
    (s.bonus || []).forEach(n => { balls += '<span class="ball bonus">' + n + '</span>'; });
    html +=
      "<div class='saved-row'>" +
        "<div style='display:flex;justify-content:space-between;gap:8px;align-items:center;'>" +
          "<span style='font-weight:700;font-size:.9rem;'>" + escapeHtml(s.name || ("Set " + (i + 1))) + "</span>" +
          "<span class='note' style='margin:0;'>" + escapeHtml(s.game || "") + "</span>" +
        "</div>" +
        "<div class='balls' style='margin:6px 0 8px;'>" + balls + "</div>" +
        "<div style='display:flex;gap:8px;'>" +
          "<button type='button' class='btn2 mini' data-check='" + i + "'>Check</button>" +
          "<button type='button' class='danger mini' data-del='" + i + "'>Delete</button>" +
        "</div>" +
      "</div>";
  });
  out.innerHTML = html;
}

function saveCurrentSet(){
  const key = $("game").value;
  const main = parseNums($("myMain").value);
  const bonus = parseNums($("myBonus").value);
  const err = validateSet(main, bonus);
  if(err){ $("myResult").innerHTML = "<p class='note'>" + err + "</p>"; return; }
  const name = ($("setName").value || "").trim();
  const sets = loadSets();
  sets.push({ name: name || null, main: main, bonus: bonus, game: key });
  persistSets(sets);
  $("setName").value = "";
  renderSaved();
  $("myResult").innerHTML = "<p class='note'>Saved. Stored in this browser only (localStorage).</p>";
}

function checkSavedSet(i){
  const sets = loadSets();
  const s = sets[i];
  if(!s) return;
  runCheck(s.main, s.bonus || [], s.game, $("myResult"));
}

function deleteSavedSet(i){
  const sets = loadSets();
  sets.splice(i, 1);
  persistSets(sets);
  renderSaved();
}

function checkAllSets(){
  const sets = loadSets();
  const out = $("myResult");
  if(sets.length === 0){ out.innerHTML = "<p class='note'>No saved sets to check. Save some first.</p>"; return; }
  let html = "<div style='font-weight:700;margin-bottom:8px;'>Checked " + sets.length + " saved set(s)</div>";
  sets.forEach((s, i) => {
    const name = s.name || ("Set " + (i + 1));
    const r = computeCheck(s.main, s.bonus || [], s.game);
    if(r.error){
      html += "<div class='saved-row'><strong>" + escapeHtml(name) + "</strong> <span class='note'>( " + escapeHtml(s.game) + " )</span><div class='note'>" + r.error + "</div></div>";
    } else {
      html += "<div class='saved-row'>" +
        "<div><strong>" + escapeHtml(name) + "</strong> <span class='note'>( " + escapeHtml(s.game) + " )</span></div>" +
        "<div class='note'>Best: " + r.best.mc + " main" + (r.best.bc ? " + bonus" : "") + " on " + r.best.d + " · Prize-tier matches: " + r.prizeDraws + " · 2+ main: " + r.twoPlus + "</div>" +
      "</div>";
    }
  });
  out.innerHTML = html;
}

function exportSets(){
  const sets = loadSets();
  const blob = new Blob([JSON.stringify(sets, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "trueodds-numbers.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sameSet(a, b){
  if(a.game !== b.game) return false;
  const key = arr => (arr || []).slice().sort((x, y) => x - y).join(",");
  return key(a.main) === key(b.main) && key(a.bonus) === key(b.bonus);
}

function importSetsFromFile(file){
  const reader = new FileReader();
  reader.onload = function(){
    try {
      const data = JSON.parse(reader.result);
      if(!Array.isArray(data)) throw new Error("not an array");
      const clean = data.filter(d => d && Array.isArray(d.main) && Array.isArray(d.bonus) && typeof d.game === "string")
        .map(d => ({ name: (typeof d.name === "string" ? d.name : null), main: d.main.map(Number), bonus: d.bonus.map(Number), game: d.game }));
      if(clean.length === 0) throw new Error("no valid sets");
      const sets = loadSets();
      let added = 0;
      clean.forEach(ns => {
        if(!sets.some(s => sameSet(s, ns))){ sets.push(ns); added++; }
      });
      persistSets(sets);
      renderSaved();
      $("myResult").innerHTML = "<p class='note'>Imported " + added + " new set(s); " + (clean.length - added) + " duplicate(s) skipped.</p>";
    } catch(e){
      $("myResult").innerHTML = "<p class='note'>Import failed — not a valid TrueOdds numbers JSON file.</p>";
    }
  };
  reader.readAsText(file);
}

/* ---- jackpot / rollover trend (sample data) ---- */
const SAMPLE_JACKPOT = [
  { d: "2026-09-25", jackpot: 120 },
  { d: "2026-10-02", jackpot: 185 },
  { d: "2026-10-09", jackpot: 260 },
  { d: "2026-10-16", jackpot: 340 },
  { d: "2026-10-23", jackpot: 400 },
  { d: "2026-10-30", jackpot: 455 },
  { d: "2026-11-06", jackpot: 510 },
  { d: "2026-11-13", jackpot: 555 }
];
let jackpotData = SAMPLE_JACKPOT;

function renderJackpotChart(data){
  const out = $("jackpotChart");
  const note = $("jackpotChartNote");
  out.innerHTML = "";
  if(!data || data.length === 0){ note.textContent = "No data."; return; }
  const max = Math.max(...data.map(d => d.jackpot));
  data.forEach(d => {
    const h = Math.max(4, Math.round(d.jackpot / max * 120));
    const bar = document.createElement("div");
    bar.style.cssText = "flex:1;min-width:16px;background:var(--accent);height:" + h + "px;border-radius:3px 3px 0 0;";
    bar.title = d.d + " — $" + d.jackpot + "M";
    out.appendChild(bar);
  });
  note.textContent = "Sample data: " + data[0].d + " → " + data[data.length - 1].d + " · latest $" + data[data.length - 1].jackpot + "M. Replace with a live jackpot feed for production.";
}

function importJackpotCsv(file){
  const reader = new FileReader();
  reader.onload = function(){
    try {
      const lines = reader.result.split(/\r?\n/).filter(l => l.trim());
      const data = [];
      lines.forEach((line, i) => {
        if(i === 0 && /date|jackpot/i.test(line)) return;
        const cols = line.split(/[,\t]/).map(c => c.trim());
        const d = cols[0];
        const j = parseFloat(String(cols[1] || "").replace(/[$,\s]/g, ""));
        if(d && isFinite(j) && j >= 0) data.push({ d, jackpot: j });
      });
      if(data.length === 0) throw new Error("empty");
      jackpotData = data;
      renderJackpotChart(jackpotData);
      $("jackpotChartNote").textContent = "Imported " + data.length + " rows.";
    } catch(e){
      $("jackpotChartNote").textContent = "Import failed — use CSV rows of: date,jackpot (one per line).";
    }
  };
  reader.readAsText(file);
}

function exportJackpotCsv(){
  const data = jackpotData || SAMPLE_JACKPOT;
  const csv = "date,jackpot_usd_m\n" + data.map(d => d.d + "," + d.jackpot).join("\n");
  download("trueodds-jackpot.csv", csv, "text/csv;charset=utf-8");
}

function download(filename, text, mime){
  const blob = new Blob([text], {type: mime || "text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---- multi-ticket odds & game comparison ---- */
function renderMulti(){
  const g = currentGame();
  const n = parseInt($("multiTickets").value, 10) || 0;
  const tbody = $("multiBody");
  tbody.innerHTML = "";
  if(g.tiers.length === 0){ tbody.innerHTML = "<tr><td colspan='3' class='note'>Pick a defined game.</td></tr>"; return; }
  if(n <= 0){ tbody.innerHTML = "<tr><td colspan='3' class='note'>Enter a number of tickets above 0.</td></tr>"; return; }
  g.tiers.forEach(t => {
    const p = matchProb(g.mainPick, g.mainMax, t[0]) * matchProb(g.bonusPick, g.bonusMax, t[1]);
    const pAtLeast = 1 - Math.pow(1 - p, n);
    const oneIn = p > 0 ? fmt(1 / p) : "∞";
    const pct = pAtLeast * 100;
    const pctStr = pct < 0.001 ? (pAtLeast * 100).toExponential(2) + "%" : pct.toFixed(3) + "%";
    const tr = document.createElement("tr");
    tr.innerHTML = "<td class='rowhead'>" + t[2] + "</td><td class='mono' data-label='Odds (1 in)'>" + oneIn + "</td><td class='mono' data-label='Chance in N tickets'>" + pctStr + "</td>";
    tbody.appendChild(tr);
  });
}

function renderCompare(){
  const out = $("compareBody");
  let html = "<table><colgroup><col style='width:24%'><col style='width:20%'><col style='width:19%'><col style='width:19%'><col style='width:18%'></colgroup>" +
    "<thead><tr><th>Game</th><th>Jackpot odds</th><th>Any prize</th><th>Fixed-prize EV</th><th>Numbers</th></tr></thead><tbody>";
  Object.keys(GAMES).forEach(k => {
    const g = GAMES[k];
    let jackTier = null;
    for(const t of g.tiers){ if(t[3] === null){ jackTier = t; break; } }
    const pJack = jackTier ? matchProb(g.mainPick, g.mainMax, jackTier[0]) * matchProb(g.bonusPick, g.bonusMax, jackTier[1]) : 0;
    const pAny = g.tiers.reduce((s, t) => s + matchProb(g.mainPick, g.mainMax, t[0]) * matchProb(g.bonusPick, g.bonusMax, t[1]), 0);
    let evFixed = 0, hasFixed = false;
    g.tiers.forEach(t => { if(typeof t[3] === "number"){ hasFixed = true; evFixed += matchProb(g.mainPick, g.mainMax, t[0]) * matchProb(g.bonusPick, g.bonusMax, t[1]) * t[3]; } });
    html += "<tr><td class='rowhead'>" + g.label + "</td>" +
      "<td class='mono' data-label='Jackpot odds'>1 in " + fmt(1 / pJack) + "</td>" +
      "<td class='mono' data-label='Any prize'>1 in " + (pAny > 0 ? (1 / pAny).toFixed(1) : "∞") + "</td>" +
      "<td class='mono' data-label='Fixed-prize EV'>" + (hasFixed ? fmtMoney(evFixed) : "pari-mutuel") + "</td>" +
      "<td class='mono' data-label='Numbers'>" + g.mainPick + "/" + g.mainMax + " + " + g.bonusPick + "/" + g.bonusMax + "</td></tr>";
  });
  html += "</tbody></table>";
  html += "<div class='note'>Fixed-prize EV excludes the jackpot. EuroMillions secondary prizes are pari-mutuel, so no fixed EV is shown.</div>";
  out.innerHTML = html;
}

function exportOddsCsv(){
  const g = currentGame();
  const n = parseInt($("multiTickets").value, 10) || 0;
  let csv = "game,prize_tier,odds_1_in,probability" + (n > 0 ? ",chance_at_least_once_in_" + n + "_tickets" : "") + "\n";
  if(g.tiers.length > 0){
    g.tiers.forEach(t => {
      const p = matchProb(g.mainPick, g.mainMax, t[0]) * matchProb(g.bonusPick, g.bonusMax, t[1]);
      const row = [g.label, t[2], (1 / p).toFixed(0), p.toExponential(6)];
      if(n > 0) row.push((1 - Math.pow(1 - p, n)).toExponential(6));
      csv += row.join(",") + "\n";
    });
  }
  download("trueodds-odds.csv", csv, "text/csv;charset=utf-8");
}

/* ---- auto-check reminder (on page load) ---- */
const LAST_CHECK_KEY = "trueodds.lastcheck.v1";

function latestDrawDate(){
  let latest = null;
  Object.keys(DRAWS).forEach(k => {
    const d = DRAWS[k];
    if(d && d.length && d[0].d && (!latest || d[0].d > latest)) latest = d[0].d;
  });
  return latest;
}

function autoCheckOnLoad(){
  const sets = loadSets();
  if(sets.length === 0) return;
  const latest = latestDrawDate();
  if(!latest) return;
  let prev = null;
  try { prev = localStorage.getItem(LAST_CHECK_KEY); } catch(e){}
  if(prev === latest) return;
  let html = "<div style='font-weight:700;margin-bottom:6px;'>Auto-check: new draw since your last visit (" + latest + ")</div>";
  sets.forEach((s, i) => {
    const name = s.name || ("Set " + (i + 1));
    const r = computeCheck(s.main, s.bonus || [], s.game);
    html += "<div class='note'>" + escapeHtml(name) + " (" + escapeHtml(s.game) + "): " + (r.error ? r.error : ("best " + r.best.mc + " main" + (r.best.bc ? " + bonus" : "") + " on " + r.best.d)) + "</div>";
  });
  $("myResult").innerHTML = html;
  try { localStorage.setItem(LAST_CHECK_KEY, latest); } catch(e){}
}

/* ---- PWA: installable + offline ---- */
const ICON_192 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAC3ElEQVR42u3dgY0aQRBFwYmM+AiXDCCFRWJW9Lz60kuA6ZIs+w6vZWZmZmZmZmZmZmZmZpf2ej7eO/MJW+LQwTAHD4Q5eCDM0cNgjh4Gc/ggmMMHwRw+CObwQTCHD4I5fBAcvkBw/ILA4QsExy8IHL5AcPyCwPELAocvEBy/IHD8gsDxCwLHLwgcvyBw/ILA8QsCxy8IHL8gcPyCwPELAscvCBy/IABAADh+QeD4BYHjFwQACADHLwgcvyAAQF0AHkxZBB5KaQQeSVkAHkhpBB5HWQAeRmkEHkVZAB5EaQQeQ1kAHkJpBB5BWQAeQGkEPnxlAUz7kOy7QQAAAACc80cfOxvArQgAAAAAAAAoApj6NwV2PoBbEAAAAAAAAFAEMPkfS6wBYCsCAAAAAAAAAAAAgBiA6T8wZR0AWxAAAAAAAAAAAAAAxACc8EsT1gLwUwQAAAAAAAAAAAAAAAAAAAAAAJAA4Gs3lEbgQxQAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIA0p8B8MVYvhgrffwAAAAAAAAAAAAAAAAAAAAAAJAC4D/JAyB9/AAAAAAAAAAAAABRANMRWAfA2jUAAAAAAAAAAACAIIDJCKwBYO0eAAAAAAAAVQBTEdj5ANZdAwAAAAAAoApgIgI7G8C6ewAAkAbgK1OUPn4AlAcAgdLHD4DyACBQ+vgBUB4ABEofPwDKA4BA6eMHQHkAECh9/AAoDwACpY8fAuWPHwDlAUCg9PFDoPzxA6A8AAiUPn4IlD9+CJQ/fgCUBwCB0scPgfLHD4Hyxw+B8scPgfLHD4HjNwgcv0Hg+A0Cx28QOH6DwPEbBI7fIHD8BoLDNwgcv0Hg+A0Eh28QOH4DweEbBI7fQHD4BoLDNxAcvoHg8A0Eh28gOHwDweEbDI7eshi8qKVAeDFLgfAiloDhEzYzMzMzMzMzMzMzM7u2D6i9hgbvNFDJAAAAAElFTkSuQmCC";
const ICON_512 = "data:image/png;base64,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";

function setupPWA(){
  const manifest = {
    name: "TrueOdds — Lottery Odds & EV Calculator",
    short_name: "TrueOdds",
    description: "Real odds and expected value for Powerball, Mega Millions and EuroMillions. No predictions — just the math.",
    start_url: ".",
    scope: ".",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d1117",
    theme_color: "#0d1117",
    icons: [
      { src: ICON_192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: ICON_512, sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  };
  try {
    const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = URL.createObjectURL(blob);
    document.head.appendChild(link);
  } catch(e){}
  if("serviceWorker" in navigator){
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").catch(function(){});
    });
  }
}

function init(){
  const sel = $("game");
  Object.keys(GAMES).forEach(k => {
    const o = document.createElement("option");
    o.value = k; o.textContent = GAMES[k].label;
    sel.appendChild(o);
  });
  const oc = document.createElement("option");
  oc.value = "custom"; oc.textContent = "Custom game";
  sel.appendChild(oc);

  sel.addEventListener("change", onGameChange);
  $("evBtn").addEventListener("click", calcEV);
  $("stateSel").addEventListener("change", function(){
    const v = $("stateSel").value;
    if(v !== "") $("stateTax").value = v;
  });
  $("pickBtn").addEventListener("click", quickPick);
  $("checkBtn").addEventListener("click", checkMyNumbers);
  $("myWindow").addEventListener("change", onWindowChange);
  $("perspTier").addEventListener("change", renderPerspective);
  $("saveBtn").addEventListener("click", saveCurrentSet);
  $("savedList").addEventListener("click", function(e){
    const t = e.target && e.target.closest ? e.target.closest("button") : null;
    if(!t) return;
    if(t.hasAttribute("data-check")) checkSavedSet(parseInt(t.getAttribute("data-check"), 10));
    else if(t.hasAttribute("data-del")) deleteSavedSet(parseInt(t.getAttribute("data-del"), 10));
  });
  $("checkAllBtn").addEventListener("click", checkAllSets);
  $("exportBtn").addEventListener("click", exportSets);
  $("importBtn").addEventListener("click", function(){ $("importFile").click(); });
  $("importFile").addEventListener("change", function(e){
    if(e.target.files && e.target.files[0]) importSetsFromFile(e.target.files[0]);
    e.target.value = "";
  });
  $("jackpotImportBtn").addEventListener("click", function(){ $("jackpotFile").click(); });
  $("jackpotFile").addEventListener("change", function(e){
    if(e.target.files && e.target.files[0]) importJackpotCsv(e.target.files[0]);
    e.target.value = "";
  });
  $("jackpotExportBtn").addEventListener("click", exportJackpotCsv);
  $("multiTickets").addEventListener("input", renderMulti);
  $("exportOddsCsvBtn").addEventListener("click", exportOddsCsv);
  ["cMainPick","cMainMax","cBonusPick","cBonusMax"].forEach(id => $(id).addEventListener("input", renderOdds));

  renderOdds();
  renderHot();
  renderSaved();
  renderJackpotChart(jackpotData);
  renderMulti();
  renderCompare();
  autoCheckOnLoad();
  setupPWA();

  document.querySelectorAll(".lock-overlay").forEach(function(o){
    o.addEventListener("click", function(){ window.location.href = "index.html#pricing"; });
  });
}
init();
