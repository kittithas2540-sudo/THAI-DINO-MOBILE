// =====================
// ข้อมูลเกมและสถานะ
// =====================

// ข้อมูลไดโนเสาร์ไทย 6 สายพันธุ์
const dinos = [
  { nameTH: "ภูเวียงโกซอรัส สิรินธรเน", img: "images/phuwiangosaurus.png", info: "ซอโรพอดคอยาว กินพืช พบที่ขอนแก่น" },
  { nameTH: "สยามโมซอรัส สุธีธรนิ", img: "images/siamosaurus.png", info: "สไปโนซอรอยด์กินปลา พบในภาคอีสาน" },
  { nameTH: "สยามโมไทรันนัส อีสานเอนซิส", img: "images/siamotyrannus.png", info: "เทอโรโพดนักล่า พบในภาคอีสาน" },
  { nameTH: "ซิตตะโกซอรัส สัตยารักษ์กิ", img: "images/psittacosaurus.png", info: "ไดโนเสาร์กินพืชขนาดเล็ก มีกะโหลกรูปนกแก้ว" },
  { nameTH: "อีสานโนซอรัส อรรถวิภัชน์ชิ", img: "images/isanosaurus.png", info: "ซอโรพอดยุคแรกเริ่มในไทย" },
  { nameTH: "กินรีมิมัส ขอนแก่นเอนซิส", img: "images/kinnareemimus.png", info: "ไดโนเสาร์คล้ายนกกระจอกเทศ วิ่งเร็ว" },
];

// สร้างสำรับการ์ด (12 ใบ = 6 คู่)
const deck = dinos.flatMap((d, i) => [{ id: i + "A", ...d }, { id: i + "B", ...d }]);

// =====================
// DOM อ้างอิง
// =====================

const grid = document.getElementById("grid");

const timeEl = document.getElementById("time");
const pairsEl = document.getElementById("pairs");
const flipsEl = document.getElementById("flips");

const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupText = document.getElementById("popup-text");
const popupImg = document.getElementById("popup-img");
const popupSummary = document.getElementById("popup-summary");
const btnClose = document.getElementById("btnClose");
const btnRestartPopup = document.getElementById("btnRestartPopup");

// ชื่อและเริ่มเกม
const inputName = document.getElementById("playerName");
const btnStart = document.getElementById("btnStart");

// Leaderboard
const leaderboardList = document.getElementById("leaderboard-list");
const btnSortTime = document.getElementById("sortTime");
const btnSortFlips = document.getElementById("sortFlips");

// เสียง
const sfxFlip = document.getElementById("sfxFlip");
const sfxMatch = document.getElementById("sfxMatch");
const sfxMiss = document.getElementById("sfxMiss");
const sfxWin = document.getElementById("sfxWin");

// =====================
// สถานะเกม
// =====================

let state = {};
let playerName = "";
let sortMode = "time"; // time | flips

// =====================
// Utilities
// =====================

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function startTimer() {
  if (state.timer) return; // ป้องกันซ้อน
  state.startAt = Date.now() - (state.elapsed || 0);
  state.timer = setInterval(() => {
    state.elapsed = Date.now() - state.startAt;
    timeEl.textContent = formatTime(state.elapsed);
  }, 200);
}

function stopTimer() {
  clearInterval(state.timer);
  state.timer = null;
}

// =====================
// Render การ์ด
// =====================

function render() {
  grid.innerHTML = "";
  state.shuffled.forEach(card => {
    const el = document.createElement("div");
    el.className = "card";
    el.dataset.key = card.id;

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const back = document.createElement("div");
    back.className = "face back";
    back.textContent = "🦖";

    const front = document.createElement("div");
    front.className = "face front";

    const thumb = document.createElement("div");
    thumb.className = "thumb";

    const img = document.createElement("img");
    img.src = card.img;
    img.alt = card.nameTH;
    thumb.appendChild(img);

    const cap = document.createElement("div");
    cap.className = "caption";
    cap.textContent = card.nameTH;

    front.appendChild(thumb);
    front.appendChild(cap);

    inner.appendChild(back);
    inner.appendChild(front);
    el.appendChild(inner);

    el.addEventListener("click", () => onFlip(el, card));
    grid.appendChild(el);
  });
}

// =====================
// Flip logic
// =====================

function onFlip(el, card) {
  if (state.locked) return;
  if (el.classList.contains("flipped")) return;

  el.classList.add("flipped");
  sfxFlip.currentTime = 0; sfxFlip.play();
  state.flips++; flipsEl.textContent = state.flips;

  state.flipped.push({ el, card });

  if (state.flipped.length === 2) {
    state.locked = true;
    const [A, B] = state.flipped;

    if (A.card.nameTH === B.card.nameTH) {
      // จับคู่ถูก
      sfxMatch.currentTime = 0; sfxMatch.play();
      A.el.classList.add("matched");
      B.el.classList.add("matched");

      state.pairs++;
      pairsEl.textContent = `${state.pairs}/6`;

      // แสดงความรู้สั้น ๆ ของไดโนเสาร์คู่นี้ (popup ปกติ)
      showInfoPopup(A.card);

      state.flipped = [];
      state.locked = false;

      // ชนะเกม
      if (state.pairs === 6) {
        onWin();
      }
    } else {
      // จับคู่ผิด
      sfxMiss.currentTime = 0; sfxMiss.play();
      setTimeout(() => {
        A.el.classList.remove("flipped");
        B.el.classList.remove("flipped");
        state.flipped = [];
        state.locked = false;
      }, 800);
    }
  }
}

// =====================
// Popups
// =====================

function showInfoPopup(card) {
  popupTitle.textContent = card.nameTH;
  popupText.textContent = card.info;
  popupImg.src = card.img;
  popupImg.alt = card.nameTH;
  popupSummary.textContent = ""; // เคลียร์สรุป
  popup.classList.add("active");
  stopTimer(); // หยุดเวลาเพื่ออ่านความรู้
}

function onWin() {
  stopTimer();
  setTimeout(() => {
    sfxWin.play();
    const durationSec = Math.floor(state.elapsed / 1000);

    popupTitle.textContent = "คุณชนะแล้ว!";
    popupText.textContent = `${playerName || "ผู้เล่นไม่ระบุ"} จับคู่ครบทั้ง 6 คู่`;
    popupImg.src = ""; // ไม่แสดงรูปตอนสรุปชนะ
    popupImg.alt = "";
    popupSummary.textContent = `ใช้เวลา ${durationSec} วินาที และพลิกการ์ดไป ${state.flips} ครั้ง`;
    popup.classList.add("active");

    // บันทึกคะแนนและอัปเดตตาราง
    saveScore(playerName || "ผู้เล่นไม่ระบุ", durationSec, state.flips);
    renderLeaderboard();
  }, 400);
}

// ปุ่มปิด popup
btnClose.addEventListener("click", () => {
  popup.classList.remove("active");
  // ถ้ายังไม่ชนะ ให้เดินเวลาใหม่ต่อ
  if (state.pairs < 6) startTimer();
});

// ปุ่มเล่นใหม่ใน popup
btnRestartPopup.addEventListener("click", () => {
  popup.classList.remove("active");
  restart();
});

// =====================
// Leaderboard
// =====================

function saveScore(name, time, flips) {
  let scores = JSON.parse(localStorage.getItem("dinoScores") || "[]");
  scores.push({ name, time, flips, ts: Date.now() });
  localStorage.setItem("dinoScores", JSON.stringify(scores));
}

function renderLeaderboard() {
  let scores = JSON.parse(localStorage.getItem("dinoScores") || "[]");

  if (sortMode === "time") {
    scores.sort((a, b) => a.time - b.time || a.flips - b.flips || a.ts - b.ts);
  } else {
    scores.sort((a, b) => a.flips - b.flips || a.time - b.time || a.ts - b.ts);
  }

  const top10 = scores.slice(0, 10);
  leaderboardList.innerHTML = "";
  top10.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${s.name} — เวลา ${s.time} วิ, พลิก ${s.flips} ครั้ง`;
    leaderboardList.appendChild(li);
  });

  // ปรับสไตล์ active ของปุ่ม
  btnSortTime.classList.toggle("active", sortMode === "time");
  btnSortFlips.classList.toggle("active", sortMode === "flips");
}

// ปุ่มสลับโหมดเรียง
btnSortTime.addEventListener("click", () => {
  sortMode = "time";
  renderLeaderboard();
});
btnSortFlips.addEventListener("click", () => {
  sortMode = "flips";
  renderLeaderboard();
});

// =====================
// Start / Restart
// =====================

btnStart.addEventListener("click", () => {
  playerName = (inputName.value || "").trim() || "ผู้เล่นไม่ระบุ";
  restart();
});

function restart() {
  stopTimer();
  state = {
    shuffled: shuffle(deck),
    flipped: [],
    locked: false,
    pairs: 0,
    flips: 0,
    startAt: null,
    timer: null,
    elapsed: 0
  };
  timeEl.textContent = "00:00";
  pairsEl.textContent = "0/6";
  flipsEl.textContent = "0";
  render();
  startTimer();
}

// =====================
// Init
// =====================

renderLeaderboard();
// ไม่เริ่มเกมอัตโนมัติ จนกว่าจะกด "เริ่มเกม" เพื่อให้กรอกชื่อก่อน
