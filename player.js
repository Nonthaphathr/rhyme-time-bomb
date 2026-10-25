/* หน้านักเรียน (มือถือ): กรอกชื่อ → รอ → ตอบ → ดูผล */
const app = $('#app');
const params = new URLSearchParams(location.search);
const shapes = ['▲', '◆', '●', '■'];
let pin = (params.get('pin') || '').replace(/\D/g, '');
let me = null, room = null, players = [], qLocalStart = 0, answeredQ = -1, tickIv = null, unsubR = null, unsubP = null;
const stored = () => { try { return JSON.parse(localStorage.getItem('tbk:me:' + pin) || 'null'); } catch (e) { return null; } };

function view(html) { app.innerHTML = `<div class="pl screen-in">${html}</div>`; }
const logo = `<img class="logo" src="assets/img/logo.png" alt="ระเบิดเวลาคำคล้องจอง">`;

function joinScreen(msg = '') {
  view(`${logo}<div class="panel"><div class="field"><label class="h" style="color:var(--gold)">รหัสห้อง (PIN)</label>
    <input class="inp" id="pin" inputmode="numeric" maxlength="6" placeholder="------" value="${esc(pin)}"></div>
    <div class="field"><label class="h" style="color:var(--gold)">ชื่อเล่นของเธอ</label><input class="inp" id="nm" maxlength="14" placeholder="พิมพ์ชื่อเล่น" autocomplete="off"></div>
    <p id="err" style="color:#ff9d9d;min-height:1.4em">${esc(msg)}</p><button class="btn" id="join">เข้าห้อง 🚀</button></div>`);
  $('#join').onclick = join; $('#nm').onkeydown = e => e.key === 'Enter' && join();
}
async function join() {
  Sound.init(); Sound.sfx('click', .6);
  pin = $('#pin').value.replace(/\D/g, ''); const name = $('#nm').value.trim();
  if (pin.length !== 6) return $('#err').textContent = 'กรอกรหัสห้อง 6 หลัก';
  $('#join').disabled = true; $('#err').textContent = '';
  let r; try { r = await DB.getRoom(pin); } catch (e) { r = null; }
  if (!r || r.state === 'closed') { $('#join').disabled = false; return $('#err').textContent = 'ไม่พบห้องนี้ ตรวจรหัสอีกครั้ง'; }
  if (r.kind === 'm1') return teamPicker(r);
  if (!name) { $('#join').disabled = false; return $('#err').textContent = 'กรอกชื่อเล่นก่อนนะ'; }
  let id = (stored() || {}).id || ('p' + Date.now().toString(36) + rand(1e4));
  me = { id, name }; try { localStorage.setItem('tbk:me:' + pin, JSON.stringify(me)); } catch (e) { }
  await DB.setPlayer(pin, id, { name, joinedAt: Date.now(), score: 0, streak: 0, correct: 0, ans: null, last: null });
  enter();
}
/* ---------- โหมด 1: เลือกทีม (มือถือประจำทีม) ---------- */
function teamPicker(r) {
  const names = r.teams || [];
  view(`${logo}<div class="panel"><h2 class="gold-text" style="font-size:30px">เลือกทีมของเธอ</h2><p class="muted" style="margin:6px 0 14px">เครื่องนี้จะเป็นเครื่องตอบของทีม · ทีมเดียวกันใช้ได้หลายเครื่อง</p>
    <div class="team-pick">${names.map((nm, i) => `<button class="btn tp" data-i="${i}" style="--tc:${TEAM_DEFS[i].color}"><img src="${TEAM_DEFS[i].img}" alt=""><span>${esc(nm)}</span></button>`).join('')}</div>
    <button class="btn ghost small" id="bk" style="margin-top:14px">← ใส่รหัสห้องใหม่</button></div>`);
  $('#bk').onclick = () => joinScreen();
  $$('.tp').forEach(b => b.onclick = async () => {
    Sound.init(); Sound.sfx('click', .6); const i = +b.dataset.i;
    const id = (stored() || {}).id || ('p' + Date.now().toString(36) + rand(1e4));
    me = { id, name: names[i], team: i, kind: 'm1' }; try { localStorage.setItem('tbk:me:' + pin, JSON.stringify(me)); } catch (e) { }
    await DB.setPlayer(pin, id, { name: names[i], team: i, joinedAt: Date.now(), ans: null });
    enter();
  });
}

function enter() {
  unsubR && unsubR(); unsubP && unsubP();
  unsubP = DB.onPlayers(pin, l => { players = l; refreshMe(); });
  unsubR = DB.onRoom(pin, r => { const prev = room; room = r; onRoom(prev); });
}
const mine = () => players.find(p => p.id === (me && me.id)) || {};
const rankOf = () => { const s = players.slice().sort((a, b) => (b.score || 0) - (a.score || 0)); const i = s.findIndex(p => p.id === me.id); return i < 0 ? '-' : i + 1; };
function meBar() { const m = mine(); return `<div class="me-bar"><span>${esc(me.name)}</span><span>${m.score || 0} คะแนน</span></div>`; }

function onRoom(prev) {
  if (!room) return; const st = room.state;
  if (room.kind === 'm1') return onRoomM1(prev);
  if (prev && prev.state === st && prev.qIndex === room.qIndex) { if (st === 'board' || st === 'end') drawBoard(); return; }
  clearInterval(tickIv);
  if (st === 'lobby') view(`${logo}<div class="panel">${meBar()}<p class="wait" style="margin-top:16px">✅ เข้าห้องแล้ว!<br>รอครูกดเริ่มเกม…</p></div>`);
  else if (st === 'countdown') { view(`<div class="big-count" style="font-size:40vw">GO!</div>`); Sound.sfx('countdown'); }
  else if (st === 'question') drawQuestion();
  else if (st === 'reveal') drawReveal();
  else if (st === 'board' || st === 'end') drawBoard();
  else if (st === 'closed') { view(`${logo}<div class="panel"><p>ห้องนี้ปิดแล้ว</p><button class="btn" id="re">เข้าห้องใหม่</button></div>`); $('#re').onclick = () => joinScreen(); }
}
function refreshMe() { if (room && room.kind === 'm1') return; const b = $('.me-bar'); if (b) b.outerHTML = meBar(); }

function drawQuestion() {
  const q = room.question, i = room.qIndex; qLocalStart = performance.now(); const T = q.time * 1000; const already = (mine().ans && mine().ans.q === i);
  view(`${meBar()}<div class="muted">ข้อ ${i + 1}/${room.qTotal} · คำที่คล้องจองกับ</div><div class="qword">${esc(q.word)}</div>
    <div class="timebar"><i id="tb"></i></div>
    <div class="choices" id="ch">${q.choices.map((c, k) => `<button class="choice c${k}" data-k="${k}"><span class="shape">${shapes[k]}</span><span>${esc(c)}</span></button>`).join('')}</div><p id="sent" class="wait hide">ส่งคำตอบแล้ว รอดูผล…</p>`);
  tickIv = setInterval(() => { const el = performance.now() - qLocalStart; const l = Math.max(0, 1 - el / T); $('#tb') && ($('#tb').style.transform = `scaleX(${l})`); if (el > T + 400) { clearInterval(tickIv); lock(); } }, 100);
  if (already) lock(mine().ans.idx);
  $$('#ch .choice').forEach(b => b.onclick = () => answer(+b.dataset.k));
}
function lock(sel) { $$('#ch .choice').forEach(b => { b.disabled = true; if (sel !== undefined && +b.dataset.k !== sel) b.classList.add('dim'); }); const s = $('#sent'); s && s.classList.remove('hide'); }
async function answer(k) {
  const i = room.qIndex; if (answeredQ === i) return; answeredQ = i; const ms = Math.round(performance.now() - qLocalStart);
  if (ms > room.question.time * 1000 + 400) return; Sound.sfx('select', .7); lock(k);
  await DB.setPlayer(pin, me.id, { ans: { q: i, idx: k, ms } });
}
function drawReveal() {
  const m = mine(); const last = m.last && m.last.q === room.qIndex ? m.last : null; const ok = last && last.correct;
  view(`${meBar()}<div class="res-badge ${ok ? 'ok' : 'no'}">${ok ? '✅ ถูกต้อง!' : last ? '❌ ยังไม่ถูก' : '⏰ ไม่ได้ตอบ'}</div>
    <div class="panel"><div class="muted">ได้คะแนนข้อนี้</div><div class="qword" style="font-size:64px">+${last ? last.points : 0}</div>
    ${last && last.bonus ? `<div class="chip ok">🔥 โบนัสตอบถูกติดกัน +${last.bonus}</div>` : ''}<div class="muted" style="margin-top:8px">อันดับตอนนี้: <b style="color:#fff3b0;font-size:1.4em">${rankOf()}</b> / ${players.length}</div></div>`);
  Sound.sfx(ok ? 'correct' : 'wrong', .8); if (navigator.vibrate) navigator.vibrate(ok ? [60] : [200]);
}
function drawBoard() {
  const end = room.state === 'end'; const b = room.board || [];
  view(`${meBar()}<h2 class="gold-text" style="font-size:36px">${end ? '🎉 จบเกมแล้ว!' : '🏆 อันดับ'}</h2>
    <div class="board">${b.map(r => `<div class="brow" style="font-size:22px;padding:8px 16px"><span class="rk">${r.rank}</span><span>${esc(r.name)}</span><span class="sc">${r.score}</span></div>`).join('')}</div>
    <div class="panel"><div class="muted">${end ? 'อันดับสุดท้ายของเธอ' : 'อันดับของเธอ'}</div><div class="res-badge ok">${rankOf()} <span style="font-size:.5em">/ ${players.length}</span></div></div>`);
  if (end && rankOf() <= 3) Confetti.fire(120);
}

/* ---------- โหมด 1: หน้าจอทีม ---------- */
let m1Key = '', m1Recv = 0, m1Left = 0, m1Notice = 0, m1Iv = null;
const tc = () => TEAM_DEFS[me.team] || TEAM_DEFS[0];
const heartsTxt = (l, max) => Array.from({ length: max }, (_, i) => i < l ? '❤️' : '🖤').join('');
function onRoomM1(prev) {
  const st = room.state; clearInterval(tickIv);
  if (st === 'closed') { clearInterval(m1Iv); view(`${logo}<div class="panel"><p>ห้องนี้ปิดแล้ว</p><button class="btn" id="re">เข้าห้องใหม่</button></div>`); $('#re').onclick = () => joinScreen(); return; }
  const t = tc();
  if (st === 'lobby') {
    clearInterval(m1Iv); m1Key = '';
    view(`${logo}<div class="panel" style="--tc:${t.color}"><img src="${t.img}" style="height:90px"><div class="h" style="font-size:30px;color:var(--tc)">${esc(me.name)}</div><p class="wait" style="margin-top:12px">✅ เข้าห้องแล้ว!<br>รอครูกดเริ่มเกม…</p><button class="btn ghost small" id="chg" style="margin-top:12px">เปลี่ยนทีม</button></div>`);
    $('#chg').onclick = () => teamPicker(room); return;
  }
  if (st === 'end') { clearInterval(m1Iv); m1Key = ''; drawEndM1(); return; }
  /* st === 'play' */
  m1Recv = performance.now(); m1Left = +room.left || 0;
  if (room.notice && room.notice.t !== m1Notice) { m1Notice = room.notice.t; if (prev) { toast(room.notice.text, 2600); Sound.sfx(room.notice.ok ? 'correct' : room.notice.text.startsWith('⚠') ? 'wrong' : 'click', .7); } }
  const mineNow = room.holder === me.team;
  if (prev && prev.turn !== room.turn && room.phase === 'running' && mineNow) { Sound.sfx('pass', .9); navigator.vibrate && navigator.vibrate([120, 60, 120]); }
  if (prev && prev.phase !== 'boom' && room.phase === 'boom') { Sound.sfx('explosion', .8); navigator.vibrate && navigator.vibrate(400); }
  const key = [room.phase, room.turn, room.holder, room.judging, room.paused, room.word, (room.teams || []).map(x => x.l + (x.o ? 'x' : '')).join(), (room.used || []).length].join('|');
  if (key === m1Key) return; m1Key = key;
  const keep = $('#tans') ? $('#tans').value : '';
  drawPlayM1(keep);
}
function drawPlayM1(keep = '') {
  const t = tc(), teams = room.teams || [], hold = teams[room.holder], mineNow = room.holder === me.team, my = teams[me.team] || {};
  const canType = room.phase === 'running' && mineNow && !room.judging && !room.paused && !my.o;
  let mid;
  if (my.o) mid = `<div class="panel"><div class="res-badge no">💀 ทีมเธอตกรอบแล้ว</div><p class="muted">ช่วยเชียร์เพื่อน ๆ ต่อไปนะ</p></div>`;
  else if (room.phase === 'routing') mid = `<div class="panel"><p class="wait">🎲 กำลังสุ่มว่าระเบิดไปอยู่ทีมไหน…</p></div>`;
  else if (room.phase === 'boom') mid = `<div class="panel"><div class="res-badge no">💥 ${esc((teams[room.boomTeam] || {}).n || '')} ระเบิด!</div></div>`;
  else if (mineNow) mid = `<div class="panel hold-me"><div class="h" style="font-size:26px;color:#ffb3b3">💣 ระเบิดอยู่ที่ทีมเธอ! รีบตอบ!</div>
    <div class="qword" id="ptime" style="font-size:72px">--</div><div class="timebar"><i id="tb"></i></div>
    ${room.judging ? `<p class="wait">⏳ รอครูตัดสินคำตอบ…</p>` : room.paused ? `<p class="wait">⏸ ครูหยุดเวลาไว้</p>` : ''}
    <input class="inp" id="tans" placeholder="พิมพ์คำที่สัมผัสกัน" autocomplete="off" ${canType ? '' : 'disabled'} style="margin-top:12px"><button class="btn green" id="tsend" ${canType ? '' : 'disabled'} style="margin-top:10px">ส่งคำตอบ 🚀</button></div>`;
  else mid = `<div class="panel"><div class="h" style="font-size:24px">💣 ระเบิดอยู่ที่ <span style="color:${TEAM_DEFS[room.holder] ? TEAM_DEFS[room.holder].color : '#fff'}">${esc(hold ? hold.n : '')}</span></div>
    <div class="qword" id="ptime" style="font-size:64px">--</div><div class="timebar"><i id="tb"></i></div><p class="muted" style="margin-top:8px">คิดคำสัมผัสเตรียมไว้ เผื่อระเบิดมาถึงทีมเธอ!</p></div>`;
  view(`<div class="me-bar" style="border-color:${t.color}"><span>${esc(me.name)}</span><span>${heartsTxt(my.l || 0, room.lives || 3)}</span></div>
    <div class="panel"><div class="muted">คำที่ต้องคล้องจองกับ</div><div class="qword">${esc(room.word || '…')}</div></div>${mid}
    <div class="used" style="justify-content:center">${(room.used || []).map(w => `<span>${esc(w)}</span>`).join('')}</div>
    <div class="mini-teams">${teams.map((x, i) => `<span class="${x.o ? 'out' : ''} ${i === room.holder ? 'hot' : ''}" style="--tc:${TEAM_DEFS[i].color}">${i === room.holder ? '💣' : ''}${esc(x.n)} ${x.o ? '💀' : '❤️' + x.l}</span>`).join('')}</div>`);
  const inp = $('#tans');
  if (inp) { inp.value = keep; if (canType) inp.focus({ preventScroll: true }); inp.onkeydown = e => e.key === 'Enter' && sendM1(); $('#tsend').onclick = sendM1; }
  clearInterval(m1Iv);
  m1Iv = setInterval(() => {
    const l = (room.paused || room.phase !== 'running') ? m1Left : Math.max(0, m1Left - (performance.now() - m1Recv) / 1000);
    const e = $('#ptime'); if (e) { e.textContent = Math.ceil(l); e.style.color = l <= 5 ? '#ff8a8a' : ''; }
    const b = $('#tb'); if (b) b.style.transform = `scaleX(${Math.min(1, l / (room.total || 20))})`;
  }, 150);
}
async function sendM1() {
  const inp = $('#tans'); if (!inp || inp.disabled) return; const text = inp.value.trim(); if (!text) return;
  inp.value = ''; Sound.sfx('select', .7);
  await DB.setPlayer(pin, me.id, { ans: { turn: room.turn, text, n: Date.now() } });
}
function drawEndM1() {
  const t = tc(), rank = room.rank || [], win = rank[0];
  view(`${logo}<h2 class="gold-text" style="font-size:34px">🎉 จบเกมแล้ว!</h2>
    <div class="panel"><div class="muted">ทีมชนะเลิศ</div><div class="res-badge ok">${esc(win ? win.n : '')}</div></div>
    <div class="board">${rank.map((r, k) => `<div class="brow" style="font-size:20px;padding:8px 14px;${r.id === me.team ? 'outline:3px solid var(--gold)' : ''}"><span class="rk">${k + 1}</span><span>${esc(r.n)}</span><span class="sc">${r.o ? '💀' : '❤️' + r.l}</span></div>`).join('')}</div>`);
  if (win && win.id === me.team) { Confetti.fire(160); Sound.sfx('victory', .8); }
}

(async function boot() {
  Sound.preload(['select', 'click', 'correct', 'wrong', 'countdown']);
  const s = pin && stored();
  if (s) { me = s; const r = await DB.getRoom(pin).catch(() => null); if (r && r.state !== 'closed') { enter(); return; } }
  joinScreen();
})();
