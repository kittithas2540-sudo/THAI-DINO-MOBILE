// ข้อมูลไดโนเสาร์ไทย 6 สายพันธุ์
const dinos = [
  {nameTH:"ภูเวียงโกซอรัส สิรินธรเน", img:"images/phuwiangosaurus.png", info:"ซอโรพอดคอยาว กินพืช พบที่ขอนแก่น"},
  {nameTH:"สยามโมซอรัส สุธีธรนิ", img:"images/siamosaurus.png", info:"สไปโนซอรอยด์กินปลา พบในภาคอีสาน"},
  {nameTH:"สยามโมไทรันนัส อีสานเอนซิส", img:"images/siamotyrannus.png", info:"เทอโรโพดนักล่า พบในภาคอีสาน"},
  {nameTH:"ซิตตะโกซอรัส สัตยารักษ์กิ", img:"images/psittacosaurus.png", info:"ไดโนเสาร์กินพืชขนาดเล็ก มีกะโหลกรูปนกแก้ว"},
  {nameTH:"อีสานโนซอรัส อรรถวิภัชน์ชิ", img:"images/isanosaurus.png", info:"ซอโรพอดยุคแรกเริ่มในไทย"},
  {nameTH:"กินรีมิมัส ขอนแก่นเอนซิส", img:"images/kinnareemimus.png", info:"ไดโนเสาร์คล้ายนกกระจอกเทศ วิ่งเร็ว"},
];

// สร้างสำรับการ์ด (12 ใบ)
const deck = dinos.flatMap((d,i)=>[{id:i+"A",...d},{id:i+"B",...d}]);

// อ้างอิง DOM
const grid=document.getElementById("grid");
const timeEl=document.getElementById("time");
const pairsEl=document.getElementById("pairs");
const flipsEl=document.getElementById("flips");
const popup=document.getElementById("popup");
const popupTitle=document.getElementById("popup-title");
const popupText=document.getElementById("popup-text");
const popupImg=document.getElementById("popup-img");
const btnClose=document.getElementById("btnClose");
const btnRestart=document.getElementById("btnRestart");

// เสียง
const sfxFlip=document.getElementById("sfxFlip");
const sfxMatch=document.getElementById("sfxMatch");
const sfxMiss=document.getElementById("sfxMiss");
const sfxWin=document.getElementById("sfxWin");

// สถานะเกม
let state={};

// ฟังก์ชันสุ่ม
function shuffle(a){
  const arr=[...a];
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

// ฟังก์ชันจับเวลา
function formatTime(ms){
  const s=Math.floor(ms/1000);
  const mm=String(Math.floor(s/60)).padStart(2,"0");
  const ss=String(s%60).padStart(2,"0");
  return `${mm}:${ss}`;
}
function startTimer(){
  if(state.timer) return; // กันไม่ให้ซ้อน
  state.startAt=Date.now() - (state.elapsed||0);
  state.timer=setInterval(()=>{
    state.elapsed = Date.now()-state.startAt;
    timeEl.textContent=formatTime(state.elapsed);
  },200);
}
function stopTimer(){
  clearInterval(state.timer);
  state.timer=null;
}

// แสดงการ์ด
function render(){
  grid.innerHTML="";
  state.shuffled.forEach(card=>{
    const el=document.createElement("div");
    el.className="card";
    el.dataset.key=card.id;

    const inner=document.createElement("div");
    inner.className="card-inner";

    const back=document.createElement("div");
    back.className="face back";
    back.textContent="🦖"; // ด้านหลังการ์ด

    const front=document.createElement("div");
    front.className="face front";
    const thumb=document.createElement("div");
    thumb.className="thumb";
    const img=document.createElement("img");
    img.src=card.img; img.alt=card.nameTH;
    thumb.appendChild(img);
    const cap=document.createElement("div");
    cap.className="caption";
    cap.textContent=card.nameTH;
    front.appendChild(thumb);
    front.appendChild(cap);

    inner.appendChild(back);
    inner.appendChild(front);
    el.appendChild(inner);

    el.addEventListener("click",()=>onFlip(el,card));
    grid.appendChild(el);
  });
}

// ฟังก์ชันพลิกการ์ด
function onFlip(el,card){
  if(state.locked) return;
  if(el.classList.contains("flipped")) return;
  el.classList.add("flipped");
  sfxFlip.currentTime=0; sfxFlip.play();
  state.flips++; flipsEl.textContent=state.flips;

  state.flipped.push({el,card});
  if(state.flipped.length===2){
    state.locked=true;
    const [A,B]=state.flipped;
    if(A.card.nameTH===B.card.nameTH){
      // จับคู่ถูก
      sfxMatch.currentTime=0; sfxMatch.play();
      A.el.classList.add("matched");
      B.el.classList.add("matched");
      state.pairs++;
      pairsEl.textContent=`${state.pairs}/6`;
      showPopup(A.card);
      state.flipped=[];
      state.locked=false;
      if(state.pairs===6){
        stopTimer();
        setTimeout(()=>{ sfxWin.play(); alert("เยี่ยมมาก! คุณจับคู่ครบแล้ว 🎉"); },500);
      }
    }else{
      // จับคู่ผิด
      sfxMiss.currentTime=0; sfxMiss.play();
      setTimeout(()=>{
        A.el.classList.remove("flipped");
        B.el.classList.remove("flipped");
        state.flipped=[];
        state.locked=false;
      },800);
    }
  }
}

// ป๊อปอัพ
function showPopup(card){
  popupTitle.textContent=card.nameTH;
  popupText.textContent=card.info;
  popupImg.src=card.img;
  popupImg.alt=card.nameTH;
  popup.classList.add("active");
  stopTimer(); // ✅ หยุดเวลาเมื่อป๊อปอัพเด้ง
}
btnClose.addEventListener("click",()=>{
  popup.classList.remove("active");
  startTimer(); // ✅ เริ่มเวลาใหม่เมื่อปิดป๊อปอัพ
});

// เริ่มใหม่
function restart(){
  stopTimer();
  state={
    shuffled:shuffle(deck),
    flipped:[],
    locked:false,
    pairs:0,
    flips:0,
    startAt:null,
    timer:null,
    elapsed:0
  };
  timeEl.textContent="00:00";
  pairsEl.textContent="0/6";
  flipsEl.textContent="0";
  render();
  startTimer();
}
btnRestart.addEventListener("click",restart);

// เริ่มเกมครั้งแรก
restart();