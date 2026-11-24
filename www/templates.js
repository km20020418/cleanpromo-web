/* 청소전문 홍보 템플릿 — 캔버스로 5종 디자인을 그린다.
   앱과 미리보기에서 같은 파일을 쓴다. window.CleanTpl.render(kind, data) → canvas */
(function(){
const BLUE = '#5bb6e8', BLUE_TXT = '#1f86c7', INK = '#111418', GRAY = '#6b7280', WHITE = '#ffffff';
const PT = '"Pretendard", system-ui, sans-serif', ANTON = '"Anton", "Pretendard", sans-serif', BHS = '"BHS", sans-serif';
let LOGO = ['청소','전문'];
const SIZES = {cover:[1080,1350], contact:[1080,1350], blog:[1080,1080], square:[1080,1080], story:[1080,1920]};

function rr(x, X, Y, W, H, r){ x.beginPath(); x.moveTo(X+r, Y); x.arcTo(X+W, Y, X+W, Y+H, r); x.arcTo(X+W, Y+H, X, Y+H, r); x.arcTo(X, Y+H, X, Y, r); x.arcTo(X, Y, X+W, Y, r); x.closePath(); }
function photo(x, im, X, Y, W, H, r = 0){
  x.save(); if(r){ rr(x, X, Y, W, H, r); x.clip(); }
  if(im){ const s = Math.max(W/im.width, H/im.height), sw = W/s, sh = H/s; x.drawImage(im, (im.width-sw)/2, (im.height-sh)/2, sw, sh, X, Y, W, H); }
  else { x.fillStyle = '#e5e7eb'; x.fillRect(X, Y, W, H); }
  x.restore();
}
function font(x, w, s, f){ x.font = `${w} ${s}px ${f}`; }
/* 제목: 줄바꿈(\n) 또는 자동 줄바꿈, 최대 maxLines 줄, 넘치면 글자 크기를 줄인다 */
function lines(x, text, maxW, size, weight, maxLines, fam = PT){
  let s = size;
  for(;;){
    font(x, weight, s, fam);
    const out = [];
    for(const para of String(text).split('\n')){
      let cur = '';
      for(const word of para.split(' ')){
        const t = cur ? cur + ' ' + word : word;
        if(x.measureText(t).width <= maxW || !cur) cur = t; else { out.push(cur); cur = word; }
      }
      out.push(cur);
    }
    const fits = out.length <= maxLines && out.every(l => x.measureText(l).width <= maxW);
    if(fits || s <= size*0.6) return {lines: out.slice(0, maxLines), size: s, weight, fam};
    s -= 4;
  }
}
function drawLines(x, L, X, Y, lh, color, align = 'left'){
  font(x, L.weight, L.size, L.fam); x.fillStyle = color; x.textAlign = align; x.textBaseline = 'alphabetic';
  L.lines.forEach((l, i) => x.fillText(l, X, Y + L.size + i*L.size*lh));
  x.textAlign = 'left';
  return Y + L.size*lh*L.lines.length;
}
function fitOne(x, t, maxW, size, weight, fam){ let s = size; do { font(x, weight, s, fam); s -= 2; } while(x.measureText(t).width > maxW && s > 14); return s+2; }
function pill(x, t, X, Y, bg, fg, size = 30){
  font(x, 700, size, PT); const w = x.measureText(t).width + size*1.2, h = size*1.7;
  x.fillStyle = bg; rr(x, X, Y, w, h, h/2); x.fill();
  x.fillStyle = fg; x.textBaseline = 'middle'; x.fillText(t, X + size*0.6, Y + h/2 + 1); x.textBaseline = 'alphabetic';
  return w;
}
/* 청소전문 타원 로고 */
function mark(x, X, Y, h = 96, text = LOGO){
  const w = h*1.5;
  x.fillStyle = BLUE; x.beginPath(); x.ellipse(X + w/2, Y + h/2, w/2, h/2, 0, 0, Math.PI*2); x.fill();
  x.fillStyle = INK; x.textAlign = 'center'; font(x, 400, h*0.39, BHS);
  x.fillText(text[0], X + w/2, Y + h*0.47); x.fillText(text[1], X + w/2, Y + h*0.85);
  x.textAlign = 'left'; return w;
}
function tel(x, t, X, Y, size, color = INK, align = 'left'){ font(x, 400, size, ANTON); x.fillStyle = color; x.textAlign = align; x.fillText(t, X, Y); x.textAlign = 'left'; }

const T = {
  /* 인스타 표지: 위 제목, 아래 전·후 사진을 가장자리까지 크게 */
  cover(x, d){
    x.fillStyle = WHITE; x.fillRect(0, 0, 1080, 1350);
    mark(x, 64, 50, 96);
    tel(x, d.tel, 1016, 116, 50, INK, 'right');
    const L = lines(x, d.title, 952, 86, 800, 2);
    let y = drawLines(x, L, 64, 178, 1.18, INK);
    font(x, 500, 34, PT); x.fillStyle = GRAY; x.fillText(d.sub, 66, y + 46);
    const top = 470, gap = 10, w = (1080 - gap)/2;
    photo(x, d.before, 0, top, w, 1350 - top); photo(x, d.after, w + gap, top, w, 1350 - top);
    pill(x, '청소 전', 28, 1350 - 92, INK, WHITE, 30); pill(x, '청소 후', w + gap + 28, 1350 - 92, BLUE, INK, 30);
  },
  /* 인스타 마지막 장: 문의 안내 */
  contact(x, d){
    x.fillStyle = WHITE; x.fillRect(0, 0, 1080, 1350);
    mark(x, 80, 80, 96);
    font(x, 800, 100, PT); x.fillStyle = INK; x.fillText('청소가', 80, 340); x.fillText('필요할 땐?', 80, 460);
    x.fillStyle = BLUE; x.fillRect(80, 510, 120, 6);
    font(x, 500, 42, PT); x.fillStyle = '#374151';
    d.points.forEach((p, i) => x.fillText(p, 80, 610 + i*76));
    font(x, 700, 42, PT); x.fillStyle = BLUE_TXT; x.fillText(d.badge, 80, 610 + d.points.length*76);
    x.save(); x.beginPath(); x.arc(860, 700, 230, 0, Math.PI*2); x.fillStyle = BLUE; x.fill(); x.clip();
    if(d.char){ const h = 430, w = h*d.char.width/d.char.height; x.drawImage(d.char, 860 - w/2 + 10, 520, w, h); }
    x.restore();
    font(x, 500, 36, PT); x.fillStyle = GRAY; x.fillText(d.svc, 80, 1112);
    tel(x, d.tel, 80, 1262, 128);
  },
  /* 블로그 대표이미지: 작게 보여도 읽히도록 큰 흰 제목 + 작은 '청소 전' 사진 */
  blog(x, d){
    photo(x, d.after, 0, 0, 1080, 1080);
    const g = x.createLinearGradient(0, 380, 0, 1080); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.78)');
    x.fillStyle = g; x.fillRect(0, 380, 1080, 700);
    x.fillStyle = WHITE; rr(x, 742, 50, 288, 360, 18); x.fill();
    photo(x, d.before, 752, 60, 268, 340, 12);
    pill(x, '청소 전', 766, 74, INK, WHITE, 26);
    pill(x, '청소 후', 50, 50, BLUE, INK, 30);
    const L = lines(x, d.title, 960, 112, 800, 2);
    const y0 = 1080 - 110 - L.size*1.16*L.lines.length;
    pill(x, `${d.place} ${d.kind} 후기`.trim(), 60, y0 - 70, BLUE, INK, 32);
    drawLines(x, L, 60, y0, 1.16, WHITE);
    font(x, 600, 34, PT); x.fillStyle = 'rgba(255,255,255,.9)'; x.fillText(`${LOGO.join('')}  ${d.tel}`, 62, 1040);
  },
  /* 당근·카카오 정사각 */
  square(x, d){
    x.fillStyle = WHITE; x.fillRect(0, 0, 1080, 1080);
    const head = `${d.place ? d.place + ' ' : ''}${d.kind} 완료`;
    const s = fitOne(x, head, 952, 64, 800, PT);
    if(d.place){ font(x, 800, s, PT); x.fillStyle = BLUE_TXT; x.fillText(d.place, 64, 104); const w = x.measureText(d.place + ' ').width; x.fillStyle = INK; x.fillText(`${d.kind} 완료`, 64 + w, 104); }
    else { x.fillStyle = INK; x.fillText(head, 64, 104); }
    const top = 150, bot = 900, gap = 10, w = (1080 - gap)/2;
    photo(x, d.before, 0, top, w, bot - top); photo(x, d.after, w + gap, top, w, bot - top);
    pill(x, '청소 전', 28, bot - 82, INK, WHITE, 28); pill(x, '청소 후', w + gap + 28, bot - 82, BLUE, INK, 28);
    mark(x, 64, 940, 92);
    tel(x, d.tel, 1016, 1020, 70, INK, 'right');
  },
  /* 인스타 스토리: 위 250px·아래 340px는 앱 화면에 가려지므로 비워 둔다 */
  story(x, d){
    x.fillStyle = WHITE; x.fillRect(0, 0, 1080, 1920);
    mark(x, 80, 250, 96);
    const L = lines(x, d.title, 920, 92, 800, 2);
    let y = drawLines(x, L, 80, 370, 1.18, INK);
    font(x, 500, 34, PT); x.fillStyle = GRAY; x.fillText(`${d.place ? d.place + ' · ' : ''}${d.kind}`, 82, y + 44);
    const top = y + 90, h = 420;
    photo(x, d.before, 80, top, 920, h, 16); photo(x, d.after, 80, top + h + 16, 920, h, 16);
    pill(x, '청소 전', 104, top + 22, INK, WHITE, 30); pill(x, '청소 후', 104, top + h + 38, BLUE, INK, 30);
    tel(x, d.tel, 540, top + 2*h + 16 + 120, 84, INK, 'center');
  }
};

window.CleanTpl = {
  SIZES, kinds: Object.keys(T),
  render(kind, d, canvas){
    const [w, h] = SIZES[kind]; const c = canvas || document.createElement('canvas'); c.width = w; c.height = h;
    LOGO = d.logo && d.logo.length === 2 ? d.logo : LOGO; const x = c.getContext('2d'); x.textBaseline = 'alphabetic'; T[kind](x, d); return c;
  },
  async ready(){ try{ await Promise.all(['800 40px Pretendard','600 40px Pretendard','500 40px Pretendard','40px Anton','40px BHS'].map(f => document.fonts.load(f, '청소전문0123'))); }catch(e){} }
};
})();
