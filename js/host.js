/* หน้าจอครู: หน้าหลัก + 3 โหมดการเล่น */
const app = $('#app');
let cleanup = [];                       // ฟังก์ชันล้างตัวจับเวลา/ตัวฟังเมื่อเปลี่ยนหน้า
function onLeave(fn) { cleanup.push(fn); }
function render(html, soft = false) {
  if (!soft) { cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = []; }
  app.innerHTML = html; const first = app.firstElementChild; if (first) first.classList.add('screen-in');
  window.scrollTo(0, 0);
}
const sessionId = () => 'S' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + rand(100);
const nowStr = () => new Date().toLocaleString('th-TH', { hour12: false });

/* ตัวนับถอยหลัง */
class Countdown {
  constructor(onTick, onEnd) { this.onTick = onTick; this.onEnd = onEnd; this.iv = null; }
  start(sec) { this.stop(); this.total = sec; this.acc = 0; this.t0 = performance.now(); this.paused = false; this.lastWhole = Math.ceil(sec) + 1; this.ended = false; this.iv = setInterval(() => this.step(), 100); this.step(); }
  get left() { return Math.max(0, this.total - (this.acc + (this.paused ? 0 : performance.now() - this.t0)) / 1000); }
  step() {
    const l = this.left, w = Math.ceil(l); const changed = w !== this.lastWhole; this.lastWhole = w;
    this.onTick(l, this.total, changed, w);
    if (l <= 0 && !this.ended) { this.ended = true; this.stop(); this.onEnd(); }
  }
  pause() { if (!this.paused && this.iv) { this.acc += performance.now() - this.t0; this.paused = true; } }
  resume() { if (this.paused) { this.t0 = performance.now(); this.paused = false; } }
  stop() { clearInterval(this.iv); this.iv = null; }
}

/* ตัวช่วยสร้าง segment buttons */
function seg(name, opts, val, multi = false) {
  return `<div class="seg" data-seg="${name}" data-multi="${multi ? 1 : 0}">` + opts.map(o => {
    const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
    const on = multi ? val.includes(v) : val === v;
    return `<button type="button" data-v="${esc(v)}" class="${on ? 'on' : ''}">${esc(t)}</button>`;
  }).join('') + '</div>';
}
function bindSeg(cfg, after) {
  $$('[data-seg]', app).forEach(box => {
    const name = box.dataset.seg, multi = box.dataset.multi === '1';
    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; Sound.sfx('click', .6);
      const raw = b.dataset.v, v = isNaN(+raw) ? raw : +raw;
      if (multi) { const arr = cfg[name]; const i = arr.indexOf(v); if (i >= 0) { if (arr.length > 1) arr.splice(i, 1); } else arr.push(v); $$('button', box).forEach(x => { const xv = isNaN(+x.dataset.v) ? x.dataset.v : +x.dataset.v; x.classList.toggle('on', arr.includes(xv)); }); }
      else { cfg[name] = v; $$('button', box).forEach(x => x.classList.toggle('on', x === b)); }
      after && after(name);
    });
  });
}
const levelSeg = cfg => seg('levels', [[1, 'ง่าย'], [2, 'กลาง'], [3, 'ยาก']], cfg.levels, true);
const backBtn = `<button class="btn ghost small" id="back">← กลับหน้าหลัก</button>`;

/* ---------------- หน้าหลัก ---------------- */
function home() {
  const wInfo = { sheet: ['ok', `📗 คลังคำจาก Google Sheets (${Words.list.length} คำ)`], cache: ['warn', `📙 ใช้คลังคำที่เก็บไว้ในเครื่อง (${Words.list.length} คำ)`], sample: ['warn', `📘 คลังคำตัวอย่าง ${Words.list.length} คำ (ยังไม่ได้เชื่อม Sheets)`] }[Words.source];
  const dbChip = DB.mode === 'firebase' ? ['ok', '☁️ Firebase พร้อมใช้งานโหมดตอบสด'] : ['warn', '🧪 โหมดตอบสด: ทดลองในเครื่อง (ยังไม่ได้ตั้งค่า Firebase)'];
  render(`<div class="home">
    <img class="logo" src="assets/img/logo.png" alt="ระเบิดเวลาคำคล้องจอง">
    <div class="modes">
      <div class="panel mode-card" data-mode="1"><span class="ico">💣</span><span class="no">โหมด 1</span><h3>แบ่งทีมระเบิดเวลา</h3>
        <p>แบ่งห้องเป็น 2–6 ทีม ระเบิดถูกสุ่มส่งไปยังทีมเป้าหมาย ทีมต้องระดมสมองส่งคำคล้องจองเพื่อโยนระเบิดต่อ ตอบผิดหรือหมดเวลา ระเบิดทำงาน เสียพลังชีวิต</p><div class="tag">🖥️ ใช้จอครูจอเดียว · เหมาะกับห้อง 30 คน</div></div>
      <div class="panel mode-card" data-mode="2"><span class="ico">📱</span><span class="no">โหมด 2</span><h3>ตอบสดพร้อมกันทั้งห้อง</h3>
        <p>นักเรียนสแกน QR เข้าห้องโดยไม่ต้องลงทะเบียน กดเลือกคำตอบบนมือถือพร้อมกัน ได้คะแนนตามความเร็ว มีตารางคะแนนสะสมหน้าชั้นเรียน</p><div class="tag">📲 นักเรียนใช้มือถือ/แท็บเล็ต</div></div>
      <div class="panel mode-card" data-mode="3"><span class="ico">🎤</span><span class="no">โหมด 3</span><h3>ต่อคำเวียนรายคนหน้าห้อง</h3>
        <p>ครูคุมจอหลัก นักเรียนตอบคำสัมผัสด้วยวาจาทีละคน ครูกด “ผ่าน” หรือ “ระเบิด” เปลี่ยนคำและจับเวลาคนถัดไปทันที</p><div class="tag">🗣️ ไม่ต้องใช้อุปกรณ์นักเรียน</div></div>
    </div>
    <div class="statusbar"><span class="chip ${wInfo[0]}">${wInfo[1]}</span><span class="chip ${dbChip[0]}">${dbChip[1]}</span>
      <button class="chip" id="reload" style="color:inherit">🔄 โหลดคลังคำใหม่</button></div>
    <p class="muted" style="margin-top:12px;font-size:14px">💡 แตะที่ใดก็ได้เพื่อเปิดเสียงเพลง lobby</p></div>`);
  $$('.mode-card').forEach(c => c.onclick = () => { Sound.sfx('click'); ({ 1: setupM1, 2: setupM2, 3: setupM3 })[c.dataset.mode](); });
  $('#reload').onclick = async e => { e.stopPropagation(); toast('กำลังโหลดคลังคำ…'); await Words.load(true); toast(`โหลดแล้ว ${Words.list.length} คำ`); home(); };
  Sound.preload(['lobby', 'play_loop', 'play_hurry', 'leaderboard', 'tick', 'tock', 'beep_urgent', 'explosion', 'correct', 'pass', 'wrong', 'lose_life', 'victory', 'drumroll', 'start', 'click', 'countdown', 'countdown_go']);
  Sound.music('lobby');
}
document.addEventListener('pointerdown', () => { Sound.init(); if (!Sound.current && !window._inGame) Sound.music('lobby'); }, { once: true });

/* =====================================================================
   โหมด 1: แบ่งทีมระเบิดเวลา
   ===================================================================== */
function setupM1() {
  window._inGame = false;
  const cfg = { n: 4, lives: 3, time: 20, accel: 'on', devices: 'off', levels: [1, 2, 3], names: TEAM_DEFS.map(t => t.name) };
  render(`<div class="setup panel"><h2 class="gold-text">💣 โหมด 1 · แบ่งทีมระเบิดเวลา</h2>
    <div class="field"><label>จำนวนทีม</label>${seg('n', [2, 3, 4, 5, 6], cfg.n)}</div>
    <div class="field"><label>ชื่อทีม (แก้ไขได้)</label><div class="team-edit" id="te"></div></div>
    <div class="row"><div class="field grow"><label>พลังชีวิตต่อทีม</label>${seg('lives', [1, 2, 3, 4, 5], cfg.lives)}</div>
      <div class="field grow"><label>เวลาต่อการส่งระเบิด (วินาที)</label>${seg('time', [10, 15, 20, 30], cfg.time)}</div></div>
    <div class="row"><div class="field grow"><label>เร่งเวลาให้สั้นลงเรื่อย ๆ</label>${seg('accel', [['on', 'เปิด'], ['off', 'ปิด']], cfg.accel)}</div>
      <div class="field grow"><label>ระดับความยากของคำโจทย์</label>${levelSeg(cfg)}</div></div>
    <div class="field"><label>วิธีตอบของทีม</label>${seg('devices', [['off', '🗣️ ครูพิมพ์/ตัดสินหน้าห้อง'], ['on', '📱 มือถือประจำทีม (สแกน QR)']], cfg.devices)}
      <p class="muted" style="font-size:14px;margin-top:6px">แบบมือถือประจำทีม: แต่ละทีมใช้มือถือ/แท็บเล็ตอย่างน้อย 1 เครื่อง ทีมที่ถือระเบิดพิมพ์คำตอบเองบนเครื่อง ครูยังกดตัดสินและควบคุมเกมได้เหมือนเดิม</p></div>
    <div class="row" style="justify-content:space-between;margin-top:22px">${backBtn}<button class="btn" id="go">เริ่มเกม 💣</button></div></div>`);
  const drawTeams = () => { $('#te').innerHTML = cfg.names.slice(0, cfg.n).map((nm, i) => `<div class="te" style="--tc:${TEAM_DEFS[i].color}"><img src="${TEAM_DEFS[i].img}"><input class="inp" data-i="${i}" value="${esc(nm)}" maxlength="14"></div>`).join(''); $$('#te input').forEach(inp => inp.oninput = () => cfg.names[+inp.dataset.i] = inp.value || TEAM_DEFS[+inp.dataset.i].name); };
  drawTeams(); bindSeg(cfg, n => n === 'n' && drawTeams());
  $('#back').onclick = home; $('#go').onclick = () => { Sound.init(); Sound.sfx('start'); cfg.devices === 'on' ? lobbyM1(cfg) : playM1(cfg); };
}

async function lobbyM1(cfg) {
  window._inGame = true; Sound.music('lobby');
  const names = cfg.names.slice(0, cfg.n);
  let pin; for (let i = 0; i < 6; i++) { pin = String(100000 + rand(900000)); if (!(await DB.getRoom(pin))) break; }
  await DB.createRoom(pin, { kind: 'm1', state: 'lobby', teams: names, lives: cfg.lives, createdAt: Date.now() });
  const base = (CFG.SITE_URL || (location.origin + location.pathname.replace(/[^/]*$/, ''))).replace(/\/?$/, '/');
  const net = { pin, players: [], unsub: null };
  render(`<div class="stage"><div class="lobby">
    <div class="panel pin-box center"><div class="muted">ให้แต่ละทีมสแกน QR หรือไปที่</div><div style="font-size:clamp(13px,1.3vw,17px);word-break:break-all;color:#fff3b0">${esc(base)}play.html</div>
      <div class="qr" id="qr"></div><div class="muted">รหัสห้อง (PIN)</div><div class="pin">${pin}</div>
      <div class="row" style="justify-content:center;margin-top:10px"><button class="btn" id="start" disabled>เริ่มเกม 💣</button><button class="btn ghost small" id="close">ยกเลิก</button></div></div>
    <div class="panel"><div class="row" style="justify-content:space-between"><h2 class="gold-text">ทีมที่เข้าห้อง</h2><span class="chip" id="pc">0 เครื่อง</span></div>
      <p class="muted" style="margin:6px 0 14px">แต่ละทีมเลือกทีมของตัวเองบนมือถือ (ใช้ได้หลายเครื่องต่อทีม) · ทีมที่ยังไม่มีเครื่อง ครูพิมพ์ตอบแทนได้</p><div class="teams lobby-teams" id="tg"></div></div></div></div>`);
  makeQR($('#qr'), `${base}play.html?pin=${pin}`, 260);
  const seen = new Set();
  const draw = () => {
    $('#tg').innerHTML = names.map((nm, i) => { const c = net.players.filter(p => p.team === i).length; return `<div class="team ${c ? 'active' : ''}" style="--tc:${TEAM_DEFS[i].color}"><img class="badge" src="${TEAM_DEFS[i].img}"><div class="nm">${esc(nm)}</div><div class="pc">${c ? '✅ ' + c + ' เครื่อง' : 'รอเข้าห้อง…'}</div></div>`; }).join('');
    $('#pc').textContent = net.players.length + ' เครื่อง'; $('#start').disabled = !net.players.length;
    net.players.forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); Sound.sfx('select', .5); } });
  };
  net.unsub = DB.onPlayers(pin, l => { net.players = l; draw(); }); draw();
  onLeave(() => { net.unsub && net.unsub(); });
  $('#close').onclick = async () => { await DB.updateRoom(pin, { state: 'closed' }); home(); };
  $('#start').onclick = () => { Sound.sfx('start'); net.unsub && net.unsub(); playM1(cfg, net); };
}

function playM1(cfg, net) {
  window._inGame = true; Sound.music('play_loop');
  const NET = net || null;
  const teams = cfg.names.slice(0, cfg.n).map((nm, i) => ({ id: i, name: nm, def: TEAM_DEFS[i], lives: cfg.lives, passes: 0, booms: 0, out: false }));
  const g = { pool: shuffle(Words.filter(cfg.levels)), idx: 0, row: null, used: new Set(), usedList: [], holder: null, state: 'idle', passCount: 0, rounds: 0, time: cfg.time, log: [], sid: sessionId(), turn: 0, judging: false };
  render(`<div class="stage">
    <div class="panel prompt-plate"><div class="lbl">คำโจทย์ · ส่งคำที่ <b>คล้องจอง</b> กับคำนี้</div><div class="word" id="word">…</div><div class="cheat hide" id="cheat"></div></div>
    <div class="bomb-zone"><div class="holder-tag" id="holder">กำลังสุ่มทีม…</div>
      <div class="bomb-wrap" id="bw"><svg viewBox="0 0 100 100"><circle class="ring-bg" cx="50" cy="50" r="46"/><circle class="ring-fg" id="ring" cx="50" cy="50" r="46" stroke-dasharray="289" stroke-dashoffset="0"/></svg>
      <img id="bomb" src="assets/img/bomb.png" alt=""><div class="bomb-time" id="bt">--</div></div></div>
    <div class="teams" id="teams"></div>
    <div class="panel" id="ctrl"></div>
    <div class="used" id="used"></div></div>`);
  const el = { word: $('#word'), holder: $('#holder'), bw: $('#bw'), ring: $('#ring'), bt: $('#bt'), teams: $('#teams'), ctrl: $('#ctrl'), used: $('#used'), cheat: $('#cheat') };
  const alive = () => teams.filter(t => !t.out);
  const drawTeams = () => {
    el.teams.innerHTML = teams.map(t => `<div class="team ${t.out ? 'out' : ''} ${g.holder === t && !t.out ? 'active' : ''}" id="tm${t.id}" style="--tc:${t.def.color}">
      <img class="badge" src="${t.def.img}"><div class="nm">${esc(t.name)}</div>
      <div class="hearts">${Array.from({ length: cfg.lives }, (_, i) => `<img src="assets/img/${i < t.lives ? 'heart' : 'heart_broken'}.png">`).join('')}</div>
      <div class="pc">ส่งสำเร็จ ${t.passes} · ระเบิด ${t.booms}</div></div>`).join('');
  };
  const cd = new Countdown((left, total, changed, whole) => {
    el.bt.textContent = Math.ceil(left); el.bt.classList.toggle('low', left <= 5);
    const pct = left / total; el.ring.style.strokeDashoffset = 289 * (1 - pct); el.ring.style.stroke = pct > .5 ? 'var(--ok)' : pct > .25 ? '#f5c451' : 'var(--bad)';
    el.bw.style.setProperty('--shake', left > 10 ? '0s' : (0.08 + left * 0.05).toFixed(2) + 's');
    if (changed && left > 0) { if (left <= 5) { Sound.sfx('beep_urgent'); Sound.music('play_hurry', { fade: .3 }); } else { Sound.sfx(whole % 2 ? 'tick' : 'tock', .8); Sound.music('play_loop', { fade: .3 }); } }
  }, () => explode('หมดเวลา'));
  onLeave(() => { cd.stop(); window._inGame = false; });

  /* ---- โหมดมือถือประจำทีม: ส่งสถานะขึ้นห้อง + รับคำตอบจากเครื่องทีม ---- */
  let notice = null; const handled = new Set();
  const say = (text, ok) => { notice = { t: Date.now(), text, ok: !!ok }; };
  const pub = (extra = {}) => {
    if (!NET) return;
    DB.updateRoom(NET.pin, Object.assign({
      kind: 'm1', state: 'play', phase: g.state, word: g.row ? g.row.prompt : '', holder: g.holder ? g.holder.id : -1, turn: g.turn,
      total: g.time, left: (cd.iv && cd.total) ? +cd.left.toFixed(2) : g.time, paused: !!cd.paused || g.judging, judging: g.judging,
      used: g.usedList.slice(-14), lives: cfg.lives, notice, teams: teams.map(t => ({ n: t.name, l: t.lives, o: t.out, p: t.passes, b: t.booms }))
    }, extra)).catch(() => { });
  };
  function onNetPlayers(list) {
    NET.players = list; if (g.state !== 'running' || g.judging || cd.paused || !g.holder) return;
    for (const p of list) {
      const a = p.ans; if (!a || a.turn !== g.turn || p.team !== g.holder.id) continue;
      const k = p.id + ':' + a.n; if (handled.has(k)) continue; handled.add(k);
      toast(`📱 ${g.holder.name} ตอบ “${a.text}”`, 1800); submit(a.text);
      if (g.state !== 'running' || g.judging) break;
    }
  }
  if (NET) { NET.unsub = DB.onPlayers(NET.pin, onNetPlayers); onLeave(() => { NET.unsub && NET.unsub(); }); }

  const ctrlIdle = () => { el.ctrl.className = 'panel ctrl'; el.ctrl.innerHTML = `<div class="muted center">กำลังสุ่มส่งระเบิด…</div>`; };
  const ctrlRun = () => {
    el.ctrl.className = 'panel ctrl';
    el.ctrl.innerHTML = `<input class="inp" id="ans" placeholder="พิมพ์คำตอบของทีม แล้วกด Enter" autocomplete="off"><button class="btn green" id="send">ส่งคำตอบ</button>
      <button class="btn ghost small" id="okb" title="ครูตัดสินว่าถูก">✓ ผ่าน (ครูกด)</button><button class="btn red small" id="boomb">💥 ระเบิด</button>
      <button class="btn ghost small" id="pause">⏸ หยุด</button><button class="btn ghost small" id="skip">↻ เปลี่ยนคำ</button><button class="btn ghost small" id="hint">👁 เฉลย</button><button class="btn ghost small" id="end">จบเกม</button>`;
    const inp = $('#ans'); inp.focus();
    inp.onkeydown = e => { if (e.key === 'Enter') submit(inp.value); };
    $('#send').onclick = () => submit(inp.value);
    $('#okb').onclick = () => accept('(ครูตัดสิน)'); $('#boomb').onclick = () => explode('ครูกดระเบิด');
    $('#pause').onclick = e => { if (cd.paused) { cd.resume(); e.target.textContent = '⏸ หยุด'; inp.focus(); } else { cd.pause(); e.target.textContent = '▶ เล่นต่อ'; } pub(); };
    $('#skip').onclick = () => nextRound(g.holder); $('#hint').onclick = () => { el.cheat.classList.toggle('hide'); };
    $('#end').onclick = () => { if (confirm('จบเกมตอนนี้และสรุปผล?')) finish(null); };
  };
  const ctrlJudge = text => {
    el.ctrl.className = 'panel verdict';
    el.ctrl.innerHTML = `<span>คำว่า <b style="font-size:1.4em;color:#fff3b0">“${esc(text)}”</b> ระบบตรวจแล้วยังไม่สัมผัส (และไม่อยู่ในคลังคำ) — ครูตัดสิน:</span><button class="btn green" id="yes">✓ ยอมรับ ผ่านต่อ</button><button class="btn red" id="no">✗ ผิด 💥</button><button class="btn ghost small" id="cancel">ยกเลิก</button>`;
    g.judging = true; say('⏳ รอครูตัดสิน “' + text + '”'); pub();
    $('#yes').onclick = () => { g.judging = false; ctrlRun(); accept(text); }; $('#no').onclick = () => { g.judging = false; explode('ตอบสัมผัสผิด'); }; $('#cancel').onclick = () => { g.judging = false; ctrlRun(); cd.resume(); pub(); };
  };
  const drawUsed = () => { el.used.innerHTML = g.usedList.map(w => `<span>${esc(w)}</span>`).join(''); };

  function nextWord() { if (g.idx >= g.pool.length) { g.pool = shuffle(g.pool); g.idx = 0; } g.row = g.pool[g.idx++]; g.used = new Set(); g.usedList = []; el.word.textContent = g.row.prompt; el.word.classList.remove('swap'); void el.word.offsetWidth; el.word.classList.add('swap'); el.cheat.innerHTML = g.row.correct.slice(0, 8).map(w => `<span>${esc(w)}</span>`).join(''); drawUsed(); g.rounds++; }

  async function roulette(excludeTeam) {
    const cands = alive().filter(t => t !== excludeTeam); const list = cands.length ? cands : alive();
    if (list.length === 1) return list[0];
    const target = pick(list); let i = rand(list.length); const steps = 14 + rand(list.length);
    for (let s = 0; s < steps; s++) { $$('.team').forEach(x => x.classList.remove('active')); const t = list[(i++) % list.length]; $('#tm' + t.id)?.classList.add('active'); Sound.sfx('click', .5); await sleep(60 + s * 14); }
    $$('.team').forEach(x => x.classList.remove('active')); return target;
  }
  function flyBomb(toTeam) {
    return new Promise(res => {
      const from = el.bw.getBoundingClientRect(), to = $('#tm' + toTeam.id)?.getBoundingClientRect(); if (!to) return res();
      const f = document.createElement('img'); f.src = 'assets/img/bomb.png'; f.className = 'flying-bomb'; document.body.appendChild(f);
      const sx = from.left + from.width / 2 - 45, sy = from.top + from.height / 2 - 45, ex = to.left + to.width / 2 - 45, ey = to.top - 20;
      Sound.sfx('pass');
      f.animate([{ transform: `translate(${sx}px,${sy}px) scale(1.6) rotate(0)` }, { transform: `translate(${(sx + ex) / 2}px,${Math.min(sy, ey) - 120}px) scale(1.2) rotate(180deg)` }, { transform: `translate(${ex}px,${ey}px) scale(.8) rotate(360deg)` }], { duration: 650, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => { f.remove(); res(); };
    });
  }
  async function assign(team, first = false) {
    g.state = 'routing'; g.turn++; ctrlIdle(); cd.stop(); pub();
    const t = team || await roulette(g.holder); g.holder = t; if (!first) await flyBomb(t);
    drawTeams(); el.holder.textContent = `💣 ระเบิดอยู่ที่ ${t.name}`; g.state = 'running';
    ctrlRun(); cd.start(g.time); pub();
  }
  async function nextRound(startTeam) { g.state = 'routing'; cd.stop(); nextWord(); g.time = cfg.time; g.passCount = 0; drawTeams(); await assign(startTeam || null, !!startTeam && g.holder === startTeam); }

  function submit(text) {
    if (g.state !== 'running') return; const n = norm(text); const inp = $('#ans'); if (!n) return;
    if (g.used.has(n) || n === norm(g.row.prompt)) { Sound.sfx('wrong', .6); const mm = n === norm(g.row.prompt) ? 'ห้ามตอบคำโจทย์ซ้ำ' : 'คำนี้ถูกใช้ไปแล้ว!'; toast(mm); say('⚠️ ' + mm); pub(); inp && (inp.value = ''); return; }
    cd.pause();
    const inBank = (g.row.correct || []).some(w => norm(w) === n);
    if (inBank || (window.Rhyme && Rhyme.isRhyme(g.row.prompt, text.trim()))) { accept(text); } else ctrlJudge(text);
  }
  function accept(text) {
    if (g.state !== 'running') return; const n = norm(text); if (n && text !== '(ครูตัดสิน)') { g.used.add(n); g.usedList.push(text.trim()); drawUsed(); }
    g.holder.passes++; g.passCount++; g.log.push({ team: g.holder.name, word: g.row.prompt, answer: text, result: 'pass' });
    if (cfg.accel === 'on') g.time = Math.max(8, cfg.time - Math.floor(g.passCount / 2));
    Sound.sfx('correct'); say('✅ ' + g.holder.name + ' ตอบ “' + text.trim() + '” ผ่าน!', true); cd.stop(); assign(null);
  }
  async function explode(why) {
    if (g.state !== 'running') return; g.state = 'boom'; cd.stop(); const t = g.holder;
    t.lives--; t.booms++; g.log.push({ team: t.name, word: g.row.prompt, answer: why, result: 'boom' });
    ctrlIdle(); el.ctrl.innerHTML = `<div class="center h" style="font-size:28px;color:#ff9d9d">💥 ${esc(t.name)} ${esc(why)}!</div>`;
    Sound.sfx('explosion'); bigExplosion(); $('#tm' + t.id)?.classList.add('hit'); setTimeout(() => Sound.sfx('lose_life'), 500);
    if (t.lives <= 0) t.out = true; say('💥 ' + t.name + ' ' + why); pub({ phase: 'boom', boomTeam: t.id }); drawTeams(); await sleep(1900);
    if (alive().length <= 1) return finish(alive()[0] || t);
    nextRound(null);
  }
  function finish(winner) {
    g.state = 'end'; cd.stop(); Sound.music('leaderboard'); Sound.sfx('victory'); Confetti.fire(220); flash('win');
    const rank = teams.slice().sort((a, b) => (b.out ? -1 : 0) - (a.out ? -1 : 0) || b.lives - a.lives || b.passes - a.passes);
    if (!winner) winner = rank[0];
    if (NET) pub({ state: 'end', phase: 'end', winner: winner.id, rank: rank.map(t => ({ id: t.id, n: t.name, l: t.lives, p: t.passes, b: t.booms, o: t.out })) });
    const rows = rank.map((t, i) => [i + 1, t.name, t.lives, t.passes, t.booms, t.out ? 'ตกรอบ' : 'รอด']);
    render(`<div class="result panel champ"><img class="t" src="assets/img/trophy.png"><h2 class="gold-text" style="font-size:clamp(34px,5vw,64px)">ทีมชนะเลิศ</h2>
      <img src="${winner.def.img}" style="height:18vh"><h2 style="font-size:clamp(28px,4vw,52px)">${esc(winner.name)}</h2>
      <table><tr><th>อันดับ</th><th>ทีม</th><th>ชีวิตเหลือ</th><th>ส่งสำเร็จ</th><th>ระเบิด</th><th>สถานะ</th></tr>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>
      <p id="savemsg" class="muted" style="margin-top:10px"></p>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn" id="again">เล่นอีกครั้ง</button><button class="btn ghost" id="csv">⬇ CSV</button><button class="btn ghost" id="home">หน้าหลัก</button></div></div>`);
    const payload = { sessionId: g.sid, mode: NET ? 'โหมด 1 แบ่งทีม (มือถือประจำทีม)' : 'โหมด 1 แบ่งทีมระเบิดเวลา', time: nowStr(), rows: teams.map(t => ({ name: t.name, score: t.passes, lives: t.lives, booms: t.booms, note: t.out ? 'ตกรอบ' : 'รอด' })), rounds: g.rounds };
    saveResults(payload).then(r => { $('#savemsg').textContent = r.ok ? '✅ ส่งผลไปบันทึกใน Google Sheets แล้ว' : 'ℹ️ ยังไม่ได้เชื่อม Google Sheets — ดาวน์โหลด CSV เก็บไว้ได้'; });
    $('#again').onclick = setupM1; $('#home').onclick = home; $('#csv').onclick = () => downloadCSV([['อันดับ', 'ทีม', 'ชีวิตเหลือ', 'ส่งสำเร็จ', 'ระเบิด', 'สถานะ'], ...rows], 'ระเบิดเวลา-โหมด1.csv');
  }
  drawTeams(); nextRound(null);
}

/* =====================================================================
   โหมด 3: ต่อคำเวียนรายคนหน้าห้อง
   ===================================================================== */
function setupM3() {
  window._inGame = false;
  const cfg = { time: 10, accel: 'off', order: 'shuffle', levels: [1, 2, 3], roster: '' };
  render(`<div class="setup panel"><h2 class="gold-text">🎤 โหมด 3 · ต่อคำเวียนรายคนหน้าห้อง</h2>
    <div class="row"><div class="field grow"><label>เวลาต่อคน (วินาที)</label>${seg('time', [5, 8, 10, 15, 20], cfg.time)}</div>
      <div class="field grow"><label>ลดเวลาลงทุกรอบ (ต่ำสุด 4 วินาที)</label>${seg('accel', [['on', 'เปิด'], ['off', 'ปิด']], cfg.accel)}</div></div>
    <div class="field"><label>ระดับความยาก</label>${levelSeg(cfg)}</div>
    <div class="field"><label>รายชื่อนักเรียน (ไม่บังคับ — 1 บรรทัดต่อ 1 คน เพื่อแสดงชื่อและสรุปผลรายคน)</label><textarea class="inp" id="roster" placeholder="เช่น&#10;ด.ช.สมชาย&#10;ด.ญ.สมหญิง"></textarea></div>
    <div class="field"><label>ลำดับคนตอบ</label>${seg('order', [['shuffle', 'สุ่ม'], ['seq', 'ตามลำดับรายชื่อ']], cfg.order)}</div>
    <p class="muted">คีย์ลัด: <span class="key">Space</span> ผ่าน · <span class="key">B</span> ระเบิด · <span class="key">P</span> หยุด/เล่นต่อ · <span class="key">H</span> ดูเฉลย</p>
    <div class="row" style="justify-content:space-between;margin-top:18px">${backBtn}<button class="btn" id="go">เริ่มกิจกรรม 🎤</button></div></div>`);
  bindSeg(cfg); $('#back').onclick = home;
  $('#go').onclick = () => { cfg.roster = $('#roster').value; Sound.init(); Sound.sfx('start'); playM3(cfg); };
}

function playM3(cfg) {
  window._inGame = true; Sound.music('play_loop');
  const roster = cfg.roster.split('\n').map(s => s.trim()).filter(Boolean);
  const stats = {}; roster.forEach(n => stats[n] = { pass: 0, boom: 0 });
  const g = { pool: shuffle(Words.filter(cfg.levels)), idx: 0, row: null, pass: 0, boom: 0, n: 0, student: '', qs: [], seq: 0, time: cfg.time, log: [], state: 'idle', sid: sessionId() };
  render(`<div class="stage">
    <div class="stats"><span class="chip ok">✅ ผ่าน <b id="sp">0</b></span><span class="chip warn">💥 ระเบิด <b id="sb">0</b></span><span class="chip">รอบที่ <b id="sn">0</b></span></div>
    <div class="panel prompt-plate"><div class="m3-name" id="who">&nbsp;</div><div class="lbl">ตอบคำที่ <b>คล้องจอง</b> กับคำนี้</div><div class="word" id="word">…</div><div class="cheat hide" id="cheat"></div></div>
    <div class="bomb-zone"><div class="bomb-wrap" id="bw"><svg viewBox="0 0 100 100"><circle class="ring-bg" cx="50" cy="50" r="46"/><circle class="ring-fg" id="ring" cx="50" cy="50" r="46" stroke-dasharray="289" stroke-dashoffset="0"/></svg>
      <img id="bomb" src="assets/img/bomb.png" alt=""><div class="bomb-time" id="bt">--</div></div></div>
    <div class="m3-btns"><button class="btn green" id="pass">✅ ผ่าน <span class="key">Space</span></button><button class="btn red" id="boom">💥 ระเบิด <span class="key">B</span></button></div>
    <div class="row" style="justify-content:center"><button class="btn ghost small" id="pause">⏸ หยุด</button><button class="btn ghost small" id="hint">👁 เฉลย</button><button class="btn ghost small" id="end">จบกิจกรรม</button></div></div>`);
  const el = { word: $('#word'), who: $('#who'), bw: $('#bw'), ring: $('#ring'), bt: $('#bt'), cheat: $('#cheat') };
  const cd = new Countdown((left, total, changed, whole) => {
    el.bt.textContent = Math.ceil(left); el.bt.classList.toggle('low', left <= 3);
    const pct = left / total; el.ring.style.strokeDashoffset = 289 * (1 - pct); el.ring.style.stroke = pct > .5 ? 'var(--ok)' : pct > .25 ? '#f5c451' : 'var(--bad)';
    el.bw.style.setProperty('--shake', pct > .5 ? '0s' : (0.08 + pct * 0.3).toFixed(2) + 's');
    if (changed && left > 0) { if (left <= 3) { Sound.sfx('beep_urgent'); Sound.music('play_hurry', { fade: .3 }); } else { Sound.sfx(whole % 2 ? 'tick' : 'tock', .8); Sound.music('play_loop', { fade: .3 }); } }
  }, () => doBoom('หมดเวลา'));
  const draw = () => { $('#sp').textContent = g.pass; $('#sb').textContent = g.boom; $('#sn').textContent = g.n; };
  const nextStudent = () => { if (!roster.length) return ''; if (cfg.order === 'seq') return roster[g.seq++ % roster.length]; if (!g.qs.length) g.qs = shuffle(roster); return g.qs.pop(); };
  function next() {
    if (g.idx >= g.pool.length) { g.pool = shuffle(g.pool); g.idx = 0; } g.row = g.pool[g.idx++]; g.n++; g.student = nextStudent();
    el.word.textContent = g.row.prompt; el.word.classList.remove('swap'); void el.word.offsetWidth; el.word.classList.add('swap');
    el.who.textContent = g.student ? '🎯 ' + g.student : ' '; el.cheat.innerHTML = g.row.correct.slice(0, 8).map(w => `<span>${esc(w)}</span>`).join('');
    g.time = cfg.accel === 'on' ? Math.max(4, cfg.time - Math.floor((g.n - 1) / 3) * 0.5) : cfg.time; g.state = 'running'; draw(); cd.start(g.time);
  }
  function doPass() { if (g.state !== 'running') return; cd.stop(); g.state = 'wait'; g.pass++; if (g.student) stats[g.student].pass++; g.log.push([g.n, g.student, g.row.prompt, 'ผ่าน']); Sound.sfx('correct'); flash('win'); draw(); setTimeout(next, 450); }
  async function doBoom(why) { if (g.state !== 'running') return; cd.stop(); g.state = 'wait'; g.boom++; if (g.student) stats[g.student].boom++; g.log.push([g.n, g.student, g.row.prompt, 'ระเบิด (' + why + ')']); Sound.sfx('explosion'); bigExplosion(); draw(); await sleep(1700); next(); }
  function key(e) { if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase(); if (k === ' ' || k === 'enter') { e.preventDefault(); doPass(); } else if (k === 'b') doBoom('ครูกดระเบิด'); else if (k === 'p') $('#pause').click(); else if (k === 'h') el.cheat.classList.toggle('hide'); }
  document.addEventListener('keydown', key); onLeave(() => { document.removeEventListener('keydown', key); cd.stop(); window._inGame = false; });
  $('#pass').onclick = doPass; $('#boom').onclick = () => doBoom('ครูกดระเบิด');
  $('#pause').onclick = e => { if (cd.paused) { cd.resume(); e.target.textContent = '⏸ หยุด'; } else { cd.pause(); e.target.textContent = '▶ เล่นต่อ'; } };
  $('#hint').onclick = () => el.cheat.classList.toggle('hide');
  $('#end').onclick = () => { if (!confirm('จบกิจกรรมและสรุปผล?')) return; cd.stop(); finish(); };
  function finish() {
    Sound.music('leaderboard'); Sound.sfx('victory'); Confetti.fire(120);
    const rows = roster.length ? Object.entries(stats).sort((a, b) => b[1].pass - a[1].pass).map(([n, s]) => [n, s.pass, s.boom]) : [];
    render(`<div class="result panel"><h2 class="gold-text center" style="font-size:clamp(30px,4vw,52px)">สรุปกิจกรรม</h2>
      <div class="stats" style="margin:10px 0"><span class="chip ok">✅ ผ่าน ${g.pass}</span><span class="chip warn">💥 ระเบิด ${g.boom}</span><span class="chip">ทั้งหมด ${g.pass + g.boom} รอบ</span></div>
      ${rows.length ? `<table><tr><th>นักเรียน</th><th>ผ่าน</th><th>ระเบิด</th></tr>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>` : ''}
      <p id="savemsg" class="muted" style="margin-top:10px"></p>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn" id="again">เล่นอีกครั้ง</button><button class="btn ghost" id="csv">⬇ CSV</button><button class="btn ghost" id="home">หน้าหลัก</button></div></div>`);
    const players = roster.length ? rows.map(r => ({ name: r[0], score: r[1], booms: r[2] })) : [{ name: '(ทั้งห้อง)', score: g.pass, booms: g.boom }];
    saveResults({ sessionId: g.sid, mode: 'โหมด 3 ต่อคำเวียนรายคน', time: nowStr(), rows: players, rounds: g.n }).then(r => { $('#savemsg').textContent = r.ok ? '✅ ส่งผลไปบันทึกใน Google Sheets แล้ว' : 'ℹ️ ยังไม่ได้เชื่อม Google Sheets — ดาวน์โหลด CSV เก็บไว้ได้'; });
    $('#again').onclick = setupM3; $('#home').onclick = home;
    $('#csv').onclick = () => downloadCSV([['รอบ', 'นักเรียน', 'คำโจทย์', 'ผล'], ...g.log], 'ระเบิดเวลา-โหมด3.csv');
  }
  next();
}

/* =====================================================================
   โหมด 2: ตอบสดพร้อมกันทั้งห้อง (Classroom Live Quiz)
   ===================================================================== */
function setupM2() {
  window._inGame = false;
  const cfg = { count: 10, time: 15, levels: [1, 2, 3], prog: 'on' };
  const warn = DB.mode === 'local' ? `<p class="chip warn" style="margin-bottom:8px">🧪 ยังไม่ได้ตั้งค่า Firebase ใน js/config.js — ใช้โหมดทดลอง: เปิดหน้านักเรียนในแท็บอื่นของเบราว์เซอร์เดียวกันเท่านั้น</p>` : '';
  render(`<div class="setup panel"><h2 class="gold-text">📱 โหมด 2 · ตอบสดพร้อมกันทั้งห้อง</h2>${warn}
    <div class="row"><div class="field grow"><label>จำนวนข้อ</label>${seg('count', [5, 10, 15, 20], cfg.count)}</div>
      <div class="field grow"><label>เวลาต่อข้อ (วินาที)</label>${seg('time', [10, 15, 20, 30], cfg.time)}</div></div>
    <div class="row"><div class="field grow"><label>ระดับความยาก</label>${levelSeg(cfg)}</div>
      <div class="field grow"><label>เรียงข้อ</label>${seg('prog', [['on', 'ง่าย → ยาก'], ['off', 'สุ่มทั้งหมด']], cfg.prog)}</div></div>
    <div class="row" style="justify-content:space-between;margin-top:22px">${backBtn}<button class="btn" id="go">สร้างห้อง 📱</button></div></div>`);
  bindSeg(cfg); $('#back').onclick = home;
  $('#go').onclick = () => { Sound.init(); Sound.sfx('start'); hostM2(cfg); };
}

async function hostM2(cfg) {
  window._inGame = true; Sound.music('lobby');
  let rows = shuffle(Words.filter(cfg.levels)).slice(0, cfg.count);
  if (cfg.prog === 'on') rows = rows.map((r, i) => [r, i]).sort((a, b) => (+a[0].level || 1) - (+b[0].level || 1) || a[1] - b[1]).map(x => x[0]);
  const Q = rows.map(r => Words.makeQuestion(r)); const N = Q.length;
  let pin; for (let i = 0; i < 6; i++) { pin = String(100000 + rand(900000)); if (!(await DB.getRoom(pin))) break; }
  await DB.createRoom(pin, { state: 'lobby', qIndex: -1, qTotal: N, time: cfg.time, createdAt: Date.now(), question: null, reveal: null, board: null });
  const base = (CFG.SITE_URL || (location.origin + location.pathname.replace(/[^/]*$/, ''))).replace(/\/?$/, '/');
  const url = `${base}play.html?pin=${pin}`;
  const g = { players: [], i: -1, phase: 'lobby', sid: sessionId(), cd: null, revealed: false };
  const unsub = DB.onPlayers(pin, list => { g.players = list; onPlayers(); });

  /* ---- ล็อบบี้ ---- */
  render(`<div class="stage"><div class="lobby">
    <div class="panel pin-box center"><div class="muted">สแกน QR หรือไปที่</div><div style="font-size:clamp(13px,1.3vw,17px);word-break:break-all;color:#fff3b0">${esc(base)}play.html</div>
      <div class="qr" id="qr"></div><div class="muted">รหัสห้อง (PIN)</div><div class="pin">${pin}</div>
      <div class="row" style="justify-content:center;margin-top:10px"><button class="btn" id="start" disabled>เริ่มเกม ▶</button><button class="btn ghost small" id="close">ยกเลิก</button></div></div>
    <div class="panel"><div class="row" style="justify-content:space-between"><h2 class="gold-text">ผู้เล่นในห้อง</h2><span class="chip" id="pc">0 คน</span></div>
      <p class="muted" style="margin:6px 0 14px">${N} ข้อ · ข้อละ ${cfg.time} วินาที · รอนักเรียนสแกนเข้าห้อง…</p><div class="player-grid" id="pg"></div></div></div></div>`);
  onLeave(() => { unsub && unsub(); g.cd && g.cd.stop(); window._inGame = false; });
  makeQR($('#qr'), url, 260);
  let seen = new Set();
  function onPlayers() {
    const pg = $('#pg'); if (g.phase === 'lobby' && pg) {
      const sorted = g.players.slice().sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
      pg.innerHTML = sorted.map(p => `<span class="pchip">${esc(p.name)}</span>`).join(''); $('#pc').textContent = sorted.length + ' คน'; $('#start').disabled = !sorted.length;
      sorted.forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); Sound.sfx('select', .5); } });
    }
    if (g.phase === 'question') updateAnswered();
  }
  $('#close').onclick = async () => { await DB.updateRoom(pin, { state: 'closed' }); home(); };
  $('#start').onclick = async () => {
    g.phase = 'countdown'; await DB.updateRoom(pin, { state: 'countdown' }); Sound.music('play_loop');
    for (let c = 3; c >= 1; c--) { render(`<div class="stage"><div class="big-count" style="margin:auto">${c}</div></div>`, true); Sound.sfx('countdown'); await sleep(1000); }
    Sound.sfx('countdown_go'); question(0);
  };

  /* ---- ข้อคำถาม ---- */
  function answeredCount() { return g.players.filter(p => p.ans && p.ans.q === g.i).length; }
  function updateAnswered() { const e = $('#ansc'); if (e) e.textContent = `ตอบแล้ว ${answeredCount()}/${g.players.length}`; if (g.players.length && answeredCount() >= g.players.length && !g.revealed && g.cd && g.cd.left > 0.8) { g.cd.stop(); setTimeout(reveal, 500); } }
  async function question(i) {
    g.i = i; g.phase = 'question'; g.revealed = false; const q = Q[i];
    await DB.updateRoom(pin, { state: 'question', qIndex: i, question: { word: q.word, choices: q.choices, time: cfg.time, startedAt: Date.now() }, reveal: null, board: null });
    const shapes = ['▲', '◆', '●', '■'];
    render(`<div class="stage"><div class="qhead"><span class="chip">ข้อ ${i + 1}/${N}</span><span class="chip ok" id="ansc">ตอบแล้ว 0/${g.players.length}</span><span class="chip">PIN ${pin}</span></div>
      <div class="panel prompt-plate"><div class="lbl">คำใดต่อไปนี้ <b>คล้องจอง</b> กับคำว่า</div><div class="word swap">${esc(q.word)}</div></div>
      <div class="timebar"><i id="tb"></i></div>
      <div class="choices" id="ch">${q.choices.map((c, k) => `<div class="choice c${k}"><span class="shape">${shapes[k]}</span><span>${esc(c)}</span><span class="cnt hide"></span></div>`).join('')}</div></div>`, true);
    g.cd = new Countdown((left, total, changed, whole) => {
      $('#tb') && ($('#tb').style.transform = `scaleX(${left / total})`);
      if (changed && left > 0 && left <= 5) { Sound.sfx('beep_urgent', .7); }
      if (left <= Math.min(6, total * .35)) Sound.music('play_hurry', { fade: .3 });
    }, async () => { await sleep(900); reveal(); });
    g.cd.start(cfg.time); Sound.music('play_loop', { fade: .3 });
  }

  /* ---- เฉลย + คิดคะแนน ---- */
  async function reveal() {
    if (g.revealed) return; g.revealed = true; g.phase = 'reveal'; g.cd && g.cd.stop(); const q = Q[g.i], T = cfg.time * 1000; const counts = [0, 0, 0, 0];
    const updates = g.players.map(p => {
      const a = p.ans && p.ans.q === g.i ? p.ans : null; if (a && a.idx >= 0 && a.idx < 4) counts[a.idx]++;
      const ok = !!a && a.idx === q.correctIdx; const streak = ok ? (p.streak || 0) + 1 : 0;
      const base = ok ? Math.round(1000 * (1 - Math.min(1, a.ms / T) / 2)) : 0; const bonus = ok && streak >= 2 ? Math.min(250, 50 * (streak - 1)) : 0;
      const pts = base + bonus; p._pts = pts; p._ok = ok; p.score = (p.score || 0) + pts; p.streak = streak; p.correct = (p.correct || 0) + (ok ? 1 : 0);
      return DB.setPlayer(pin, p.id, { score: p.score, streak, correct: p.correct, last: { q: g.i, points: pts, correct: ok, bonus } });
    });
    await Promise.all(updates); await DB.updateRoom(pin, { state: 'reveal', reveal: { correctIdx: q.correctIdx, counts } });
    $$('.choice').forEach((c, k) => { c.classList.add(k === q.correctIdx ? 'right' : 'dim'); const cn = $('.cnt', c); cn.classList.remove('hide'); cn.textContent = counts[k] + ' คน'; });
    Sound.sfx(counts[q.correctIdx] ? 'correct' : 'wrong');
    const ctl = document.createElement('div'); ctl.className = 'row'; ctl.style.justifyContent = 'center'; ctl.innerHTML = `<button class="btn" id="nb">ดูอันดับคะแนน 🏆</button>`; $('.stage').appendChild(ctl); $('#nb').onclick = board;
  }

  /* ---- ตารางคะแนน ---- */
  async function board() {
    g.phase = 'board'; const ranked = g.players.slice().sort((a, b) => (b.score || 0) - (a.score || 0)); const top = ranked.slice(0, 5); const last = g.i >= N - 1;
    await DB.updateRoom(pin, { state: 'board', board: top.map((p, k) => ({ name: p.name, score: p.score || 0, rank: k + 1 })) });
    Sound.music('leaderboard', { fade: .3 }); Sound.sfx('drumroll');
    render(`<div class="stage"><h2 class="gold-text center" style="font-size:clamp(30px,5vh,56px)">🏆 อันดับคะแนน</h2><div class="board" id="bd"></div><div class="row" style="justify-content:center;margin-top:14px"><button class="btn" id="nx" disabled>${last ? 'สรุปผลสุดท้าย 🎉' : 'ข้อต่อไป ▶'}</button></div></div>`, true);
    const bd = $('#bd'); const order = top.slice().reverse();
    for (let k = 0; k < order.length; k++) { await sleep(k === 0 ? 1100 : 650); const p = order[k], rk = top.length - k; bd.insertAdjacentHTML('afterbegin', `<div class="brow"><span class="rk">${rk}</span><span>${esc(p.name)}</span><span class="dl">${p.last && p.last.q === g.i && p.last.points ? '+' + p.last.points : ''}</span><span class="sc">${p.score || 0}</span></div>`); Sound.sfx('select', .6); }
    $('#nx').disabled = false; $('#nx').onclick = () => last ? finish() : question(g.i + 1);
  }

  /* ---- จบเกม ---- */
  async function finish() {
    g.phase = 'end'; const ranked = g.players.slice().sort((a, b) => (b.score || 0) - (a.score || 0)); const top = ranked.slice(0, 3);
    await DB.updateRoom(pin, { state: 'end', board: ranked.slice(0, 10).map((p, k) => ({ name: p.name, score: p.score || 0, rank: k + 1 })) });
    Sound.music('leaderboard'); Sound.sfx('victory'); Confetti.fire(260);
    const disp = [top[1], top[0], top[2]].map((p, k) => p && { p, rk: [2, 1, 3][k], h: [58, 78, 44][k] }).filter(Boolean);
    render(`<div class="stage"><h2 class="gold-text center" style="font-size:clamp(32px,5.5vh,64px)">🎉 สรุปผลการแข่งขัน 🎉</h2>
      <div class="podium">${disp.map(d => `<div class="pod"><img src="assets/img/${d.rk === 1 ? 'trophy' : 'star'}.png"><div class="pn">${esc(d.p.name)}</div><div class="blk" style="height:${d.h}%">${d.rk}<div style="font-size:.4em">${d.p.score || 0}</div></div></div>`).join('')}</div>
      <div class="panel" style="margin-top:14px;max-height:30vh;overflow:auto"><table style="width:100%;font-size:18px"><tr><th>#</th><th>ชื่อ</th><th>คะแนน</th><th>ตอบถูก</th></tr>${ranked.map((p, k) => `<tr><td>${k + 1}</td><td>${esc(p.name)}</td><td>${p.score || 0}</td><td>${p.correct || 0}/${N}</td></tr>`).join('')}</table></div>
      <p id="savemsg" class="muted center"></p>
      <div class="row" style="justify-content:center"><button class="btn" id="again">เล่นอีกครั้ง</button><button class="btn ghost" id="csv">⬇ CSV</button><button class="btn ghost" id="home">หน้าหลัก</button></div></div>`, true);
    const rowsOut = ranked.map((p, k) => ({ name: p.name, score: p.score || 0, rank: k + 1, correct: p.correct || 0, total: N }));
    saveResults({ sessionId: g.sid, mode: 'โหมด 2 ตอบสดทั้งห้อง', pin, time: nowStr(), rows: rowsOut, rounds: N }).then(r => { $('#savemsg').textContent = r.ok ? '✅ ส่งผลไปบันทึกใน Google Sheets แล้ว' : 'ℹ️ ยังไม่ได้เชื่อม Google Sheets — ดาวน์โหลด CSV เก็บไว้ได้'; });
    $('#again').onclick = setupM2; $('#home').onclick = home;
    $('#csv').onclick = () => downloadCSV([['อันดับ', 'ชื่อ', 'คะแนน', 'ตอบถูก', 'จากทั้งหมด'], ...rowsOut.map(r => [r.rank, r.name, r.score, r.correct, r.total])], `ระเบิดเวลา-โหมด2-${pin}.csv`);
  }
}

/* ---------------- ปุ่มบน/เต็มจอ ---------------- */
$('#btn-mute').onclick = e => { const m = Sound.toggleMute(); e.currentTarget.textContent = m ? '🔇' : '🔊'; };
$('#btn-full').onclick = () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => { }); };
Words.load().then(home);
