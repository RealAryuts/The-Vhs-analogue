const clk = document.getElementById("hud-clock");
const statCv = document.getElementById("stat-cv");
const statCtx = statCv.getContext("2d");

const custHuman = document.getElementById("cust-human");
const deskTape = document.getElementById("desk-tape");
const shiftNote = document.getElementById("shift-note");
const btnCloseNote = document.getElementById("btn-close-note");
const cntTxt = document.getElementById("cnt-txt");
const cntBtns = document.getElementById("cnt-btns");

let statImg = statCtx.createImageData(statCv.width, statCv.height);
let asked = {};

function drawStat() {
  const d = statImg.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  statCtx.putImageData(statImg, 0, 0);
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
  asked = {};
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
  opts.push({ lbl: "[ INSPECT TAPE ]", fn: nextPartPlaceholder });
  mkBtns(cntBtns, opts);
}

// workbench scene goes here next
function nextPartPlaceholder() {
  custHuman.classList.add("hidden");
  clk.textContent = "12:00 AM";
  cntTxt.textContent = "You pick up the cassette and head to the workbench... (Act 2 WIP)";
  mkBtns(cntBtns, [
    { lbl: "[ RESTART ]", fn: startShift }
  ]);
}

drawStat();
startShift();