/* ฟังก์ชันกลาง: เสียง, คลังคำ, ฐานข้อมูลห้อง, บันทึกผล, เอฟเฟกต์ */
const CFG = window.TBK_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = n => Math.floor(Math.random() * n);
const pick = a => a[rand(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFC').replace(/[\s​-‍⁠﻿]/g, '').trim();
const LEVEL_NAME = { 1: 'ง่าย', 2: 'กลาง', 3: 'ยาก' };
const TEAM_DEFS = [
  { name: 'ช้างเผือก', img: 'assets/img/team_elephant.png', color: '#e23b3b' },
  { name: 'สิงห์ทอง', img: 'assets/img/team_lion.png', color: '#f2b705' },
  { name: 'พญานาค', img: 'assets/img/team_naga.png', color: '#1f9d6b' },
  { name: 'หงส์ม่วง', img: 'assets/img/team_swan.png', color: '#9b59d0' },
  { name: 'ครุฑา', img: 'assets/img/team_garuda.png', color: '#2d6fd6' },
  { name: 'กินรี', img: 'assets/img/team_kinnari.png', color: '#e8559a' }
];

/* ---------------- เสียง ---------------- */
const Sound = (() => {
  let ctx, master, musicGain, sfxGain, muted = false, cur = null;
  const bufs = {}, loading = {};
  const FILES = {
    lobby: 'assets/music/lobby.mp3', play_loop: 'assets/music/play_loop.wav',
    play_hurry: 'assets/music/play_hurry.wav', leaderboard: 'assets/music/leaderboard.wav'
  };
  const sfxUrl = n => `assets/sfx/${n}.mp3`;
  // ปรับความดังตามไฟล์ (เพลง lobby ดังอยู่แล้ว เพลงที่สังเคราะห์ค่อนข้างเบา / เอฟเฟกต์บางตัวเบา)
  const MUSIC_VOL = { lobby: 0.9, play_loop: 1.6, play_hurry: 1.6, leaderboard: 1.6 };
  const SFX_VOL = { explosion: 3.2, tick: 2.2, tock: 2.2, beep_urgent: 2.2, click: 2.5, select: 2.2, pass: 2, lose_life: 2.2, drumroll: 2, countdown: 2, countdown_go: 2, start: 1.8 };
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor();              // กันเสียงแตกเมื่อเร่งความดัง
    comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.2;
    master.connect(comp); comp.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 1; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 1; sfxGain.connect(master);
  }
  async function load(url) {
    if (bufs[url]) return bufs[url];
    if (!loading[url]) loading[url] = fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).then(b => ctx.decodeAudioData(b)).then(b => (bufs[url] = b)).catch(e => { console.warn('audio', url, e); if (!window._audioWarned) { window._audioWarned = 1; try { toast('⚠️ โหลดไฟล์เสียงไม่ได้ — ต้องเปิดเกมผ่าน GitHub Pages หรือ localhost (เปิดไฟล์ตรง ๆ แบบ file:// จะไม่มีเสียง)', 7000); } catch (_) { } } return null; });
    return loading[url];
  }
  return {
    init,
    preload(names = []) { init(); names.forEach(n => load(FILES[n] || sfxUrl(n))); },
    async sfx(name, vol = 1) {
      init(); const b = await load(sfxUrl(name)); if (!b) return;
      const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = vol * (SFX_VOL[name] || 1.6); s.buffer = b; s.connect(g).connect(sfxGain); s.start(); return s;
    },
    async music(name, { fade = 0.6, vol = MUSIC_VOL[name] || 1 } = {}) {
      init(); if (cur && cur.name === name) return;
      const b = await load(FILES[name]); if (!b) return;
      const old = cur; const g = ctx.createGain(); g.gain.value = 0; g.connect(musicGain);
      const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.connect(g); s.start();
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + fade);
      cur = { name, s, g };
      if (old) { old.g.gain.cancelScheduledValues(ctx.currentTime); old.g.gain.setValueAtTime(old.g.gain.value, ctx.currentTime); old.g.gain.linearRampToValueAtTime(0, ctx.currentTime + fade); setTimeout(() => { try { old.s.stop(); } catch (e) { } }, fade * 1000 + 100); }
    },
    stopMusic(fade = 0.5) {
      if (!cur || !ctx) return; const old = cur; cur = null;
      old.g.gain.setValueAtTime(old.g.gain.value, ctx.currentTime); old.g.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
      setTimeout(() => { try { old.s.stop(); } catch (e) { } }, fade * 1000 + 100);
    },
    get current() { return cur && cur.name; },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 1; return muted; },
    get muted() { return muted; }
  };
})();

/* ---------------- คลังคำ ---------------- */
const Words = {
  list: [], source: 'sample',
  async load(force = false) {
    const cacheKey = 'tbk:words';
    if (CFG.GAS_URL) {
      try {
        const r = await fetch(CFG.GAS_URL + (CFG.GAS_URL.includes('?') ? '&' : '?') + 'action=words' + (force ? '&t=' + Date.now() : ''));
        const j = await r.json();
        if (j.ok && j.words && j.words.length) {
          this.list = j.words; this.source = 'sheet';
          try { localStorage.setItem(cacheKey, JSON.stringify(j.words)); } catch (e) { }
          return this;
        }
      } catch (e) { console.warn('โหลดจาก Sheets ไม่ได้', e); }
      try { const c = JSON.parse(localStorage.getItem(cacheKey) || 'null'); if (c && c.length) { this.list = c; this.source = 'cache'; return this; } } catch (e) { }
    }
    this.list = window.TBK_SAMPLE_WORDS || []; this.source = 'sample';
    return this;
  },
  filter(levels) { const L = levels && levels.length ? levels : [1, 2, 3]; const f = this.list.filter(w => L.includes(+w.level || 1)); return f.length ? f : this.list; },
  /* สร้างโจทย์ปรนัย 4 ตัวเลือก */
  makeQuestion(row) {
    const correct = pick(row.correct);
    const rhymes = x => window.Rhyme && Rhyme.isRhyme(row.prompt, x);   // กันตัวเลือกหลอกที่บังเอิญสัมผัสจริง
    let d = shuffle((row.distractors || []).filter(x => norm(x) !== norm(correct) && !rhymes(x)));
    if (d.length < 3) {
      const bad = new Set([...(row.correct || []), row.prompt].map(norm));
      const filler = shuffle(this.list.filter(w => w.id !== row.id).flatMap(w => [w.prompt, ...(w.correct || [])]).filter(x => !bad.has(norm(x)) && !rhymes(x)));
      d = d.concat(filler);
    }
    d = [...new Set(d)].slice(0, 3);
    const choices = shuffle([correct, ...d]);
    return { word: row.prompt, choices, correctIdx: choices.indexOf(correct), rowId: row.id };
  }
};

/* ---------------- ฐานข้อมูลห้อง (Firestore หรือโหมดทดลองในเครื่อง) ---------------- */
const DB = (() => {
  const f = CFG.FIREBASE || {};
  if (f.apiKey && f.projectId && window.firebase) {
    firebase.initializeApp(f); const fs = firebase.firestore();
    const room = p => fs.collection('rooms').doc(p);
    return {
      mode: 'firebase',
      createRoom: (pin, d) => room(pin).set(d),
      updateRoom: (pin, p) => room(pin).update(p),
      getRoom: async pin => { const s = await room(pin).get(); return s.exists ? s.data() : null; },
      onRoom: (pin, cb) => room(pin).onSnapshot(s => cb(s.exists ? s.data() : null)),
      setPlayer: (pin, id, d) => room(pin).collection('players').doc(id).set(d, { merge: true }),
      onPlayers: (pin, cb) => room(pin).collection('players').onSnapshot(s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    };
  }
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('tbk-local') : null;
  const subs = {};
  const key = p => 'tbk:room:' + p;
  const read = p => { try { return JSON.parse(localStorage.getItem(key(p)) || 'null'); } catch (e) { return null; } };
  const write = (p, o) => { localStorage.setItem(key(p), JSON.stringify(o)); notify(p); bc && bc.postMessage({ pin: p }); };
  const notify = p => setTimeout(() => (subs[p] || []).forEach(fn => fn()), 0);
  bc && (bc.onmessage = e => notify(e.data.pin));
  window.addEventListener('storage', e => { if (e.key && e.key.startsWith('tbk:room:')) notify(e.key.slice(9)); });
  const sub = (p, fn) => { (subs[p] = subs[p] || []).push(fn); setTimeout(fn, 0); return () => { subs[p] = subs[p].filter(x => x !== fn); }; };
  return {
    mode: 'local',
    createRoom: async (pin, d) => write(pin, { room: d, players: {} }),
    updateRoom: async (pin, patch) => { const o = read(pin) || { room: {}, players: {} }; Object.assign(o.room, patch); write(pin, o); },
    getRoom: async pin => (read(pin) || {}).room || null,
    onRoom: (pin, cb) => sub(pin, () => cb((read(pin) || {}).room || null)),
    setPlayer: async (pin, id, d) => { const o = read(pin); if (!o) return; o.players[id] = Object.assign(o.players[id] || {}, d); write(pin, o); },
    onPlayers: (pin, cb) => sub(pin, () => cb(Object.entries((read(pin) || {}).players || {}).map(([id, v]) => ({ id, ...v }))))
  };
})();

/* ---------------- บันทึกผล ---------------- */
async function saveResults(payload) {
  if (!CFG.GAS_URL) return { ok: false, reason: 'no-gas' };
  try {
    await fetch(CFG.GAS_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveResults', ...payload }) });
    return { ok: true };
  } catch (e) { return { ok: false, reason: String(e) }; }
}
function downloadCSV(rows, filename) {
  const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------------- QR ---------------- */
function makeQR(el, text, size = 280) {
  el.innerHTML = '';
  if (window.QRCode) { new QRCode(el, { text, width: size, height: size, colorDark: '#2a0a1e', colorLight: '#fff8e6', correctLevel: QRCode.CorrectLevel.M }); }
  else { el.innerHTML = `<div class="qr-fallback">${esc(text)}</div>`; }
}

/* ---------------- ลูกเล่นภาพ ---------------- */
function toast(msg, ms = 2200) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
}
const Confetti = (() => {
  let cv, c, parts = [], run = false;
  const colors = ['#f5c451', '#e23b3b', '#2d6fd6', '#1f9d6b', '#e8559a', '#fff3c4'];
  function loop() {
    c.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => { p.y += p.vy; p.x += p.vx; p.r += p.vr; p.vy += 0.04; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore(); });
    parts = parts.filter(p => p.y < cv.height + 30);
    if (parts.length) requestAnimationFrame(loop); else { run = false; c.clearRect(0, 0, cv.width, cv.height); }
  }
  return {
    fire(n = 160) {
      if (!cv) { cv = document.createElement('canvas'); cv.id = 'confetti'; document.body.appendChild(cv); c = cv.getContext('2d'); }
      cv.width = innerWidth; cv.height = innerHeight;
      for (let i = 0; i < n; i++) parts.push({ x: Math.random() * cv.width, y: -20 - Math.random() * 200, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3, r: Math.random() * 6, vr: (Math.random() - .5) * .3, s: 8 + Math.random() * 10, c: pick(colors) });
      if (!run) { run = true; requestAnimationFrame(loop); }
    }
  };
})();
function flash(kind = 'boom') {
  const d = document.createElement('div'); d.className = 'flash ' + kind; document.body.appendChild(d); setTimeout(() => d.remove(), 900);
}
function bigExplosion() {
  const img = document.createElement('img'); img.src = 'assets/img/explosion.png'; img.className = 'boom-img'; document.body.appendChild(img);
  setTimeout(() => img.remove(), 1500); flash('boom');
  document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 700);
}
