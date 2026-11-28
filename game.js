const clk = document.getElementById("hud-clock");
const statCv = document.getElementById("stat-cv");
const statCtx = statCv.getContext("2d");

const sc = {
  counter: document.getElementById("sc-counter"),
  bench: document.getElementById("sc-bench")
};

const custHuman = document.getElementById("cust-human");
const deskTape = document.getElementById("desk-tape");
const shiftNote = document.getElementById("shift-note");
const btnCloseNote = document.getElementById("btn-close-note");
const cntTxt = document.getElementById("cnt-txt");
const cntBtns = document.getElementById("cnt-btns");

const benchCv = document.getElementById("bench-cv");
const bCtx = benchCv.getContext("2d");
const benchHdr = document.getElementById("bench-hdr");
const ribBox = document.getElementById("ribbon-box");
const ribNeedle = document.getElementById("rib-needle");
const ribProg = document.getElementById("rib-prog");
const btnAlign = document.getElementById("btn-align");
const benchDone = document.getElementById("bench-done");
const btnVcr = document.getElementById("btn-vcr");

const WIRES = [
  { id: "red", col: "#d93b3b" },
  { id: "yellow", col: "#e6c32e" },
  { id: "green", col: "#3cb867" },
  { id: "blue", col: "#3b82d6" }
];

let statOn = true;
let statImg = statCtx.createImageData(statCv.width, statCv.height);
let asked = {};

let benchOn = false;
let benchStep = 0;
let screws = [];
let lNodes = [];
let rNodes = [];
let links = {};
let dragNode = null;
let dragPt = { x: 0, y: 0 };

let ribPos = 10;
let ribDir = 1;
let ribHold = false;
let ribPct = 0;
let ribLoopId = null;

function showSc(name) {
  Object.keys(sc).forEach((k) => sc[k].classList.toggle("active", k === name));
}

function setStat(on) {
  statOn = on;
  statCv.classList.toggle("off", !on);
}

function drawStat() {
  if (statOn) {
    const d = statImg.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
    statCtx.putImageData(statImg, 0, 0);
  }
  requestAnimationFrame(drawStat);
}

function mkBtns(el, list) {
  el.innerHTML = "";
  list.forEach((it) => {
    const b = document.createElement("button");
    b.className = "vhs-btn";
    b.textContent = it.lbl;
    b.onclick = it.fn;
    el.appendChild(b);
  });
}

function startShift() {
  cancelAnimationFrame(ribLoopId);
  benchOn = false;
  asked = {};
  showSc("counter");
  setStat(true);
  clk.textContent = "11:00 PM";
  shiftNote.classList.add("hidden");
  custHuman.classList.add("hidden");
  deskTape.classList.add("hidden");

  cntTxt.textContent = "11:00 PM. Rain drums on the shop window. A yellow shift note is taped to the counter.";
  mkBtns(cntBtns, [
    { lbl: "[ READ SHIFT NOTE ]", fn: openNote },
    { lbl: "[ START SHIFT ]", fn: startKnock }
  ]);
}

function openNote() {
  shiftNote.classList.remove("hidden");
}

btnCloseNote.addEventListener("click", () => {
  shiftNote.classList.add("hidden");
  startKnock();
});

function startKnock() {
  clk.textContent = "11:15 PM";
  cntTxt.textContent = "*KNOCK. KNOCK.* Someone is standing outside in the rain at 11:15 PM.";
  mkBtns(cntBtns, [
    { lbl: "[ LET IN ]", fn: letIn },
    { lbl: "[ KEEP DOOR LOCKED ]", fn: keepLocked }
  ]);
}

function keepLocked() {
  clk.textContent = "06:00 AM";
  cntTxt.textContent = "ENDING 0: You kept the deadbolt shut until sunrise and never learned what was on the tape.";
  mkBtns(cntBtns, [
    { lbl: "[ PLAY AGAIN ]", fn: startShift }
  ]);
}

function letIn() {
  custHuman.classList.remove("hidden");
  deskTape.classList.remove("hidden");
  cntTxt.textContent = 'He slides an unlabeled cassette across the desk. "Fix the tracking. Don\'t copy it."';
  showCustOpts();
}

function showCustOpts() {
  const opts = [];
  if (!asked.what) {
    opts.push({
      lbl: "[ WHAT'S ON IT? ]",
      fn: () => {
        asked.what = true;
        cntTxt.textContent = '"Nothing you want to watch twice. Just fix the ribbon."';
        showCustOpts();
      }
    });
  }
  if (!asked.where) {
    opts.push({
      lbl: "[ WHERE'D YOU GET IT? ]",
      fn: () => {
        asked.where = true;
        cntTxt.textContent = '"Found it behind a wall. It was still warm."';
        showCustOpts();
      }
    });
  }
  if (!asked.late) {
    opts.push({
      lbl: "[ WHY SO LATE? ]",
      fn: () => {
        asked.late = true;
        cntTxt.textContent = '"Because nobody else is awake to hear it."';
        showCustOpts();
      }
    });
  }
  opts.push({ lbl: "[ INSPECT TAPE ]", fn: startBench });
  mkBtns(cntBtns, opts);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// workbench 3-step repair
function startBench() {
  cancelAnimationFrame(ribLoopId);
  showSc("bench");
  setStat(false);
  clk.textContent = "12:00 AM";

  benchOn = true;
  benchStep = 1;
  links = {};
  dragNode = null;
  ribBox.classList.add("hidden");
  benchDone.classList.add("hidden");

  screws = [
    { x: 300, y: 175, out: false },
    { x: 640, y: 120, out: false },
    { x: 350, y: 405, out: false },
    { x: 690, y: 350, out: false }
  ];

  const ys = [148, 226, 304, 382];
  const rOrd = shuffle(WIRES);
  lNodes = WIRES.map((w, i) => ({ id: w.id, col: w.col, x: 92, y: ys[i] }));
  rNodes = rOrd.map((w, i) => ({ id: w.id, col: w.col, x: 868, y: ys[i] }));

  benchHdr.textContent = "STEP 1/3: UNSCREW CASING (0/4)";
  drawBench();
}

function getPt(e) {
  const r = benchCv.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * benchCv.width,
    y: ((e.clientY - r.top) / r.height) * benchCv.height
  };
}

function drawBench() {
  bCtx.clearRect(0, 0, benchCv.width, benchCv.height);

  if (benchStep === 1) {
    screws.forEach((s) => {
      if (s.out) return;
      bCtx.save();
      bCtx.fillStyle = "#9aa3a0";
      bCtx.strokeStyle = "#111";
      bCtx.lineWidth = 4;
      bCtx.beginPath();
      bCtx.arc(s.x, s.y, 18, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.stroke();

      bCtx.strokeStyle = "#222629";
      bCtx.lineWidth = 4;
      bCtx.beginPath();
      bCtx.moveTo(s.x - 9, s.y - 9);
      bCtx.lineTo(s.x + 9, s.y + 9);
      bCtx.moveTo(s.x + 9, s.y - 9);
      bCtx.lineTo(s.x - 9, s.y + 9);
      bCtx.stroke();
      bCtx.restore();
    });
    return;
  }

  Object.keys(links).forEach((id) => {
    const a = lNodes.find((n) => n.id === id);
    const b = rNodes.find((n) => n.id === id);
    if (a && b) drawWire(a.x, a.y, b.x, b.y, a.col, true);
  });

  if (dragNode) {
    drawWire(dragNode.x, dragNode.y, dragPt.x, dragPt.y, dragNode.col, false);
  }

  lNodes.forEach((n) => drawNode(n, !!links[n.id]));
  rNodes.forEach((n) => drawNode(n, !!links[n.id]));
}

function drawWire(x1, y1, x2, y2, col, locked) {
  bCtx.save();
  bCtx.lineCap = "round";
  bCtx.strokeStyle = "#08090a";
  bCtx.lineWidth = locked ? 12 : 10;
  bCtx.beginPath();
  bCtx.moveTo(x1, y1);
  bCtx.bezierCurveTo(x1 + 190, y1, x2 - 190, y2, x2, y2);
  bCtx.stroke();

  bCtx.strokeStyle = col;
  bCtx.lineWidth = locked ? 7 : 5;
  bCtx.beginPath();
  bCtx.moveTo(x1, y1);
  bCtx.bezierCurveTo(x1 + 190, y1, x2 - 190, y2, x2, y2);
  bCtx.stroke();
  bCtx.restore();
}

function drawNode(n, done) {
  bCtx.save();
  bCtx.fillStyle = "#16191c";
  bCtx.strokeStyle = done ? "#e5ebe4" : "#8b948e";
  bCtx.lineWidth = 3;
  bCtx.beginPath();
  bCtx.arc(n.x, n.y, 18, 0, Math.PI * 2);
  bCtx.fill();
  bCtx.stroke();

  bCtx.fillStyle = n.col;
  bCtx.beginPath();
  bCtx.arc(n.x, n.y, 10, 0, Math.PI * 2);
  bCtx.fill();
  bCtx.restore();
}

function hitNode(list, pt) {
  return list.find((n) => Math.hypot(n.x - pt.x, n.y - pt.y) <= 28);
}

function startRibbonStep() {
  benchStep = 3;
  clk.textContent = "01:00 AM";
  benchHdr.textContent = "STEP 3/3: ALIGN MAGNETIC RIBBON";
  ribBox.classList.remove("hidden");
  ribPos = 10;
  ribDir = 1;
  ribPct = 0;
  ribHold = false;
  ribProg.style.width = "0%";
  runRibbonLoop();
}

function runRibbonLoop() {
  if (!benchOn || benchStep !== 3) return;
  const spd = ribHold ? 0.55 : 1.15;
  ribPos += ribDir * spd;
  if (ribPos >= 92) { ribPos = 92; ribDir = -1; }
  if (ribPos <= 4) { ribPos = 4; ribDir = 1; }
  ribNeedle.style.left = ribPos + "%";

  const inZone = ribPos >= 38 && ribPos <= 60;
  if (ribHold && inZone) {
    ribPct = Math.min(100, ribPct + 1.35);
  } else if (!ribHold) {
    ribPct = Math.max(0, ribPct - 0.25);
  }
  ribProg.style.width = ribPct + "%";

  if (ribPct >= 100) {
    finishBench();
    return;
  }
  ribLoopId = requestAnimationFrame(runRibbonLoop);
}

function finishBench() {
  benchOn = false;
  ribHold = false;
  cancelAnimationFrame(ribLoopId);
  ribBox.classList.add("hidden");
  benchHdr.textContent = "SIGNAL RESTORED — READY FOR VCR";
  benchDone.classList.remove("hidden");
}

benchCv.addEventListener("pointerdown", (e) => {
  if (!benchOn) return;
  const pt = getPt(e);

  if (benchStep === 1) {
    const hit = screws.find((s) => !s.out && Math.hypot(s.x - pt.x, s.y - pt.y) <= 28);
    if (hit) {
      hit.out = true;
      const done = screws.filter((s) => s.out).length;
      benchHdr.textContent = "STEP 1/3: UNSCREW CASING (" + done + "/4)";
      if (done === 4) {
        benchStep = 2;
        clk.textContent = "12:30 AM";
        benchHdr.textContent = "STEP 2/3: SPLICE MATCHING WIRES (0/4)";
      }
      drawBench();
    }
    return;
  }

  if (benchStep === 2) {
    const nd = hitNode(lNodes, pt);
    if (nd && !links[nd.id]) {
      dragNode = nd;
      dragPt = pt;
      benchCv.setPointerCapture(e.pointerId);
      drawBench();
    }
  }
});

window.addEventListener("pointermove", (e) => {
  if (!benchOn) return;
  if (benchStep === 2 && dragNode) {
    dragPt = getPt(e);
    drawBench();
  }
});

window.addEventListener("pointerup", (e) => {
  if (!benchOn) return;
  ribHold = false;
  if (benchStep !== 2 || !dragNode) return;

  const pt = getPt(e);
  const tgt = hitNode(rNodes, pt);
  if (tgt && tgt.id === dragNode.id) {
    links[dragNode.id] = true;
  }
  dragNode = null;
  drawBench();

  const cnt = Object.keys(links).length;
  benchHdr.textContent = "STEP 2/3: SPLICE MATCHING WIRES (" + cnt + "/4)";
  if (cnt === 4) {
    startRibbonStep();
  }
});

btnAlign.addEventListener("pointerdown", () => {
  if (!benchOn || benchStep !== 3) return;
  ribHold = true;
});

// crt playback goes here next
btnVcr.addEventListener("click", () => {
  showSc("counter");
  setStat(true);
  custHuman.classList.add("hidden");
  deskTape.classList.add("hidden");
  clk.textContent = "01:30 AM";
  cntTxt.textContent = "You slide the fixed cassette into the VCR deck... (Act 3 WIP)";
  mkBtns(cntBtns, [
    { lbl: "[ RESTART ]", fn: startShift }
  ]);
});

drawStat();
startShift();