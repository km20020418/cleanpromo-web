(() => {
const $ = id => document.getElementById(id);
const Cap = window.Capacitor;
const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
const P = name => native ? (Cap.Plugins && Cap.Plugins[name]) || Cap.registerPlugin(name) : null;
const UPDATE_URL = 'https://km20020418.github.io/cleanpromo-web/update/version.json';
const VERSION = window.APP_VERSION || 0;

const CH = [
  {k:'instagram', n:'인스타그램', btn:'인스타에 올리기', how:'글이 복사돼요 → 인스타 고르고 → 문구 칸을 길게 눌러 붙여넣기. 표지·청소 전·청소 후·달라진 점·문의 5장이 한 번에 넘어가요.'},
  {k:'blog', n:'네이버 블로그', btn:'블로그에 올리기', how:'글이 복사돼요 → 블로그 앱에서 첫 줄은 제목, 나머지는 본문에 붙여넣기. 첫 사진을 대표이미지로 지정하세요.'},
  {k:'daangn', n:'당근', btn:'당근에 올리기', how:'글이 복사돼요 → 당근 비즈프로필 소식 쓰기에 붙여넣기'},
  {k:'place', n:'플레이스·카카오', btn:'플레이스·카카오에 올리기', how:'글이 복사돼요 → 스마트플레이스 소식 / 카카오채널 소식에 붙여넣기'}
];
const LABEL = {cover:'인스타 1 표지', before:'인스타 2 청소 전', after:'인스타 3 청소 후', detail:'인스타 4 달라진 점', contact:'인스타 5 문의', blog:'블로그 대표', square:'당근·카카오', story:'스토리'};
const MODELS = ['claude-sonnet-5-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'];
const DEF = {logo1:'청소', logo2:'전문', bTel:'010-7532-4080', bSvc:'입주 · 사무실 · 매장 · 상가 · 학원',
  bPts:'깔끔하고 꼼꼼한 청소\n정기 관리 가능\n합리적인 비용', bBadge:'여성 안심 청소', bArea:'', bInsta:'', key:''};

let texts = {}, cur = 'instagram', imgs = {B:null, A:null}, canv = {}, charImg = null;

/* ---------- 저장소 ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d }catch(e){ return d } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true }catch(e){ return false } }
};
const SF = Object.keys(DEF);
function loadSettings(){ const s = Object.assign({}, DEF, store.get('settings2', {})); SF.forEach(f => $(f).value = s[f]); return s; }
function saveSettings(){ const o = {}; SF.forEach(f => o[f] = $(f).value.trim()); store.set('settings2', o); }
const val = id => $(id).value.trim();
const brand = () => ({logo:[val('logo1') || '청소', val('logo2') || '전문'], tel:val('bTel'), svc:val('bSvc'),
  points:val('bPts').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 4), badge:val('bBadge'), area:val('bArea'), insta:val('bInsta')});
function toast(msg, ms = 2600){ const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, ms); }
function headerLogo(){ const b = brand(); $('hLogo').textContent = ''; $('hLogo').append(b.logo[0], document.createElement('br'), b.logo[1]); }

/* ---------- 설정 ---------- */
loadSettings(); headerLogo();
$('ver').textContent = `버전 ${VERSION}`;
$('openSet').onclick = () => $('setSheet').hidden = false;
$('closeSet').onclick = () => { saveSettings(); $('setSheet').hidden = true; headerLogo(); renderAll(); toast('저장했어요'); };

/* ---------- 사진 ---------- */
function loadImg(src){ return new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; }); }
loadImg(window.CHAR_IMG).then(im => charImg = im).catch(() => {});
async function pick(which, file){
  if(!file) return;
  try{ const im = await loadImg(URL.createObjectURL(file)); imgs[which] = im; const el = $('img'+which); el.src = im.src; el.hidden = false; }
  catch(e){ toast('사진을 열 수 없어요. 다른 사진을 골라 주세요.'); }
}
$('fB').addEventListener('change', e => pick('B', e.target.files[0]));
$('fA').addEventListener('change', e => pick('A', e.target.files[0]));
function scaled(im, max, q = .85){ const s = Math.min(1, max/Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width*s); c.height = Math.round(im.height*s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q); }
const b64 = d => d.slice(d.indexOf(',')+1);

/* ---------- 디자인 ---------- */
function data(){
  const b = brand(), kind = $('kind').value, place = val('place');
  return Object.assign({}, b, {title: $('title').value.trim() || defTitle(), place, kind,
    sub: texts.sub || [place, kind].filter(Boolean).join(' · '), changes: Array.isArray(texts.changes) ? texts.changes : null, before: imgs.B, after: imgs.A, char: charImg});
}
const defTitle = () => `${$('kind').value},\n새것처럼 깨끗하게`;
async function renderAll(){
  if(!imgs.B || !imgs.A || $('res').hidden) return;
  await CleanTpl.ready();
  const d = data();
  if(!$('gal').children.length){
    $('gal').innerHTML = CleanTpl.kinds.map(k => `<figure><canvas id="cv_${k}"></canvas>${LABEL[k]}</figure>`).join('');
  }
  CleanTpl.kinds.forEach(k => { canv[k] = CleanTpl.render(k, d, $('cv_' + k)); });
}
let tmr; $('title').addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(renderAll, 250); });
['kind','place'].forEach(id => $(id).addEventListener('change', renderAll));

/* ---------- 기본 문구 ---------- */
function fallback(){
  const b = brand(), k = $('kind').value, p = val('place') || b.area, m = val('memo');
  const tag = s => '#' + s.replace(/[\s·]/g, ''), tel = b.tel ? `☎ ${b.tel}` : '';
  const tags = [...new Set([p && tag(p.split(' ')[0]+k.replace(/\s/g,'')), b.area && tag(b.area.split(' ').pop()+'청소'), tag(k), tag(k.replace(/\s/g,'')+'업체'), '#청소전후', '#청소업체', '#청소전문', '#정기청소', '#사무실청소', '#입주청소'].filter(Boolean))].join(' ');
  return {
    title: defTitle(), sub: [p, k, m.split(/[,.\n]/)[0]].filter(Boolean).join(' · ').slice(0, 40),
    instagram: `${p ? p+' ' : ''}${k} 다녀왔어요 ✨\n${m ? m+'\n' : ''}\n청소 전과 후, 사진으로 직접 비교해 보세요.\n${b.points.join(', ')}.\n${b.badge ? b.badge+', 편하게 맡겨 주세요.\n' : ''}\n${tel}\n문의는 DM 또는 전화 주세요!\n\n${tags}`,
    blog: `${p ? '['+p+'] ' : ''}${k} 후기 | 청소 전·후 비교\n\n안녕하세요, ${b.logo.join('')}입니다.\n오늘은 ${p ? p+'에서 ' : ''}진행한 ${k} 현장을 소개해 드릴게요.\n\n[사진: 청소 전]\n${m || '오랫동안 쌓인 묵은 때와 먼지가 많았던 현장이었어요.'}\n\n[사진: 청소 후]\n구석구석 꼼꼼하게 마무리했습니다.\n\n${b.points.map(x => '✔ '+x).join('\n')}\n${b.svc ? '\n'+b.svc+' 모두 가능합니다.' : ''}\n정기적으로 청소가 필요한 사업장도 편하게 연락 주세요.\n${tel}`,
    daangn: `${p ? p+' ' : ''}이웃님들 안녕하세요! ${b.logo.join('')}입니다 😊\n오늘 ${k} 현장 전·후 사진 공유드려요.\n${m ? m+'\n' : ''}${b.badge ? b.badge+', ' : ''}동네에서 믿고 맡기실 수 있게 꼼꼼히 하겠습니다.\n${tel}`,
    place: `[${k} 현장 소식]${p ? ' '+p : ''}\n${m || '청소 전·후 사진으로 확인해 보세요.'}\n예약·견적 문의: ${b.tel || '전화 문의'}`
  };
}

/* ---------- AI 문구 (Claude API) ---------- */
async function aiTexts(key){
  const b = brand();
  const prompt = `당신은 동네 청소업체의 SNS 홍보 담당입니다. 첨부된 두 사진은 순서대로 [청소 전], [청소 후] 사진입니다. 사진에서 실제로 보이는 변화(물때, 기름때, 먼지, 얼룩, 바닥 광택 등)를 구체적으로 짚어 주세요. 사진에 보이지 않는 것은 지어내지 마세요. 고객 후기·별점·고객 발언을 지어내지 마세요.
업체 로고 이름: ${b.logo.join('')} / 전화: ${b.tel || '없음'} / 서비스: ${b.svc} / 강점: ${b.points.join(', ')} / 강조: ${b.badge} / 활동지역: ${b.area || '미입력'} / 인스타: ${b.insta || '없음'}
이번 현장: ${$('kind').value}, 장소: ${val('place') || '미입력'}, 메모: ${val('memo') || '없음'}
따뜻하고 친근한 사장님 말투로, 과장 광고 표현("최고","1위","100%") 없이 쓰세요.
아래 JSON 하나만 출력하세요. 다른 말은 쓰지 마세요.
{"title":"디자인 카드 제목. 사진 속 변화를 담은 짧은 문구 2줄, 각 줄 11자 이내, 줄 사이는 \\n","sub":"제목 아래 작은 설명 한 줄, 30자 이내(장소 · 청소 종류 · 특징)","changes":["사진에서 실제로 보이는 달라진 점 3개. 각 14자 이내 짧은 문구(예: 욕실 물때 제거)"],"instagram":"인스타 캡션 5~8줄, 빈 줄 후 지역·청소종류 해시태그 12~18개","blog":"첫 줄은 검색에 잘 걸리는 블로그 제목(지역+청소종류+후기). 다음 줄부터 본문 600~900자, 중간에 [사진: 청소 전], [사진: 청소 후] 자리 표시, 마지막에 문의 안내","daangn":"당근 비즈프로필 소식 4~6줄, 이웃에게 말하듯","place":"네이버 플레이스/카카오채널 소식 3~4줄"}`;
  const content = [
    {type:'text', text:'[청소 전]'}, {type:'image', source:{type:'base64', media_type:'image/jpeg', data:b64(scaled(imgs.B, 1024, .8))}},
    {type:'text', text:'[청소 후]'}, {type:'image', source:{type:'base64', media_type:'image/jpeg', data:b64(scaled(imgs.A, 1024, .8))}},
    {type:'text', text:prompt}
  ];
  let lastErr;
  for(const model of [store.get('model', null), ...MODELS].filter(Boolean)){
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'content-type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true'},
      body: JSON.stringify({model, max_tokens:3000, messages:[{role:'user', content}]})
    });
    const j = await r.json().catch(() => ({}));
    if(r.ok){
      store.set('model', model);
      const t = (j.content || []).map(c => c.text || '').join('');
      const o = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}')+1));
      CH.forEach(c => { if(typeof o[c.k] !== 'string') throw new Error('형식 오류'); });
      return o;
    }
    lastErr = {status:r.status, msg:(j.error && j.error.message) || ''};
    if(r.status === 404 || (r.status === 400 && /model/i.test(lastErr.msg))) { if(store.get('model', null) === model) store.set('model', null); continue; }
    break;
  }
  throw lastErr || new Error('AI 오류');
}

/* ---------- 실행 ---------- */
async function run(){
  if(!imgs.B || !imgs.A){ $('st').textContent = '청소 전·후 사진 두 장을 먼저 넣어 주세요.'; return; }
  if(!val('bTel')){ $('setSheet').hidden = false; toast('전화번호를 먼저 적어 주세요'); return; }
  const key = val('key');
  $('go').disabled = $('regen').disabled = true;
  $('st').textContent = key ? '사진을 보고 글을 쓰는 중이에요… (20~40초)' : '만드는 중…'; $('st').classList.add('pulse');
  if(key){
    try{ texts = await aiTexts(key); $('st').textContent = '완성! 디자인을 확인하고 올려 보세요.'; }
    catch(e){
      texts = fallback();
      const s = e && e.status;
      $('st').textContent = s === 401 ? 'AI 키가 맞지 않아요(설정 확인). 기본 문구로 만들었어요.'
        : s === 429 || s === 529 ? 'AI가 바빠요. 잠시 후 다시 해 주세요. 우선 기본 문구로 만들었어요.'
        : s === 400 && /credit|balance/i.test(e.msg) ? 'AI 키 잔액이 부족해요. 기본 문구로 만들었어요.'
        : navigator.onLine === false ? '인터넷 연결이 없어 기본 문구로 만들었어요.'
        : 'AI 문구를 못 받아 기본 문구로 만들었어요.';
    }
  } else { texts = fallback(); $('st').textContent = '완성! (설정에 AI 키를 넣으면 사진을 보고 더 자연스럽게 써 줘요)'; }
  $('title').value = texts.title || defTitle();
  $('st').classList.remove('pulse'); $('go').disabled = $('regen').disabled = false;
  $('res').hidden = false; await renderAll(); show('instagram');
  saveHistory();
  $('res').scrollIntoView({behavior:'smooth'});
}

function show(k){
  cur = k;
  $('tabs').innerHTML = CH.map(c => `<button role="tab" aria-selected="${c.k === k}" data-k="${c.k}">${c.n}</button>`).join('');
  $('out').textContent = texts[k] || '';
  const c = CH.find(c => c.k === k); $('share').textContent = c.btn; $('howTo').textContent = c.how;
  $('story').hidden = k !== 'instagram';
}
$('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if(b) show(b.dataset.k); });
$('go').onclick = run; $('regen').onclick = run;

async function copyText(t){
  try{ if(native){ await P('Clipboard').write({string:t}); } else { await navigator.clipboard.writeText(t); } return true; }catch(e){ return false; }
}
$('copy').onclick = async () => { toast(await copyText(texts[cur] || '') ? '글이 복사됐어요' : '복사가 안 됐어요. 글을 길게 눌러 복사하세요'); };

/* ---------- 공유 ---------- */
async function writeCache(name, dataUrl){ const r = await P('Filesystem').writeFile({path:name, data:b64(dataUrl), directory:'CACHE'}); return r.uri; }
async function shareFiles(list, text, withText){
  const copied = text ? await copyText(text) : false;
  if(!native){ toast(copied ? '글이 복사됐어요 (휴대폰 앱에서는 바로 공유돼요)' : '휴대폰 앱에서 공유돼요'); return; }
  try{
    const ts = Date.now(), files = [];
    for(let i = 0; i < list.length; i++) files.push(await writeCache(`p_${ts}_${i}.jpg`, list[i]));
    toast(copied ? '글이 복사됐어요. 올릴 앱을 고르고 붙여넣기 하세요' : '올릴 앱을 고르세요', 3500);
    await P('Share').share({title:'청소 홍보', text: withText ? text : undefined, files, dialogTitle:'어디에 올릴까요?'});
  }catch(e){ if(!/cancel/i.test(String(e && e.message))) toast('공유를 열 수 없어요: ' + (e && e.message || '')); }
}
const jpg = k => canv[k].toDataURL('image/jpeg', .92);
$('share').onclick = async () => {
  await renderAll();
  const t = texts[cur] || '', B = scaled(imgs.B, 2048, .9), A = scaled(imgs.A, 2048, .9);
  const set = {instagram:['cover','before','after','detail','contact'].map(jpg), blog:[jpg('blog'), B, A], daangn:[jpg('square')], place:[jpg('square')]}[cur];
  shareFiles(set, t, cur !== 'instagram');
};
$('story').onclick = async () => { await renderAll(); shareFiles([jpg('story')], '', false); };

/* ---------- 최근 기록 (사진까지 저장해 다시 열면 그대로) ---------- */
async function saveHistory(){
  const h = store.get('hist2', []);
  const id = Date.now();
  const item = {id, when:new Date().toLocaleDateString('ko-KR'), kind:$('kind').value, place:val('place'), memo:val('memo'), title:$('title').value, texts, thumb:canv.cover ? scaled(canv.cover, 160, .7) : ''};
  if(native){
    try{
      await P('Filesystem').writeFile({path:`hist/${id}_b.jpg`, data:b64(scaled(imgs.B, 1600, .85)), directory:'DATA', recursive:true});
      await P('Filesystem').writeFile({path:`hist/${id}_a.jpg`, data:b64(scaled(imgs.A, 1600, .85)), directory:'DATA', recursive:true});
      item.saved = true;
    }catch(e){}
  }
  h.unshift(item);
  const removed = h.splice(15);
  if(native) removed.forEach(r => ['b','a'].forEach(s => P('Filesystem').deleteFile({path:`hist/${r.id}_${s}.jpg`, directory:'DATA'}).catch(() => {})));
  if(!store.set('hist2', h)){ h.splice(5); store.set('hist2', h); }
  renderHistory();
}
function renderHistory(){
  const h = store.get('hist2', []);
  $('histBox').hidden = !h.length; $('hist').innerHTML = '';
  h.forEach(it => {
    const b = document.createElement('button'), im = document.createElement('img'), sp = document.createElement('span');
    im.src = it.thumb; im.alt = ''; sp.textContent = `${it.when} · ${it.place ? it.place+' ' : ''}${it.kind}`;
    b.append(im, sp); b.onclick = () => openHistory(it); $('hist').append(b);
  });
}
async function openHistory(it){
  if(!it.saved || !native){ toast('이 기록은 사진이 저장되지 않았어요'); return; }
  try{
    const rd = s => P('Filesystem').readFile({path:`hist/${it.id}_${s}.jpg`, directory:'DATA'}).then(r => loadImg('data:image/jpeg;base64,' + r.data));
    imgs.B = await rd('b'); imgs.A = await rd('a');
    $('imgB').src = imgs.B.src; $('imgB').hidden = false; $('imgA').src = imgs.A.src; $('imgA').hidden = false;
    $('kind').value = it.kind; $('place').value = it.place || ''; $('memo').value = it.memo || '';
    texts = it.texts; $('title').value = it.title || texts.title || defTitle();
    $('res').hidden = false; await renderAll(); show('instagram');
    $('res').scrollIntoView({behavior:'smooth'});
  }catch(e){ toast('기록을 열 수 없어요'); }
}
renderHistory();

/* ---------- 자동 업데이트 (APK 재설치 없이 화면·기능 갱신) ---------- */
async function checkUpdate(){
  const U = P('CapacitorUpdater'); if(!U) return;
  try{ await U.notifyAppReady(); }catch(e){}
  try{
    const r = await fetch(UPDATE_URL + '?t=' + Date.now(), {cache:'no-store'});
    if(!r.ok) return;
    const v = await r.json();
    if(!(Number(v.version) > Number(VERSION))) return;
    const busy = !!(imgs.B || imgs.A);
    if(!busy) toast('새 버전으로 업데이트하는 중이에요…', 6000);
    const bundle = await U.download({url: v.url, version: String(v.version)});
    if(!(imgs.B || imgs.A)) await U.set({id: bundle.id});
    else { await U.next({id: bundle.id}); toast('새 버전이 준비됐어요. 다음에 앱을 켜면 적용돼요', 3500); }
  }catch(e){}
}
setTimeout(checkUpdate, 800);
})();
