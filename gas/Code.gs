/**
 * ระเบิดเวลาคำคล้องจอง — Google Apps Script (ผูกกับ Google Sheets)
 * วิธีใช้: เปิดสเปรดชีตใหม่ → ส่วนขยาย → Apps Script → วางโค้ดนี้ → รันฟังก์ชัน setup() 1 ครั้ง (อนุญาตสิทธิ์)
 *        → ทำให้ใช้งานได้ → เว็บแอป → เรียกใช้ในฐานะ: ฉัน / ผู้มีสิทธิ์เข้าถึง: ทุกคน → คัดลอก URL (/exec) ไปใส่ GAS_URL ใน js/config.js
 */
const SHEET_WORDS = 'คลังคำ';
const SHEET_SCORES = 'บันทึกคะแนน';
const SHEET_SESSIONS = 'สรุปกิจกรรม';
const WORD_HEADERS = ['id', 'คำโจทย์', 'คำสัมผัสที่ถูกต้อง (คั่นด้วยคอมมา)', 'ตัวเลือกหลอก (คั่นด้วยคอมมา)', 'ระดับ (1=ง่าย 2=กลาง 3=ยาก)', 'หมวด/หมายเหตุ', 'เปิดใช้ (TRUE/FALSE)'];
const SCORE_HEADERS = ['เวลา', 'รหัสกิจกรรม', 'โหมด', 'PIN', 'ชื่อ/ทีม', 'คะแนน', 'อันดับ', 'ตอบถูก', 'จากทั้งหมด', 'ระเบิด', 'หมายเหตุ'];
const SESSION_HEADERS = ['เวลา', 'รหัสกิจกรรม', 'โหมด', 'PIN', 'จำนวนผู้เล่น/ทีม', 'จำนวนรอบ/ข้อ'];

/** รันครั้งเดียวเพื่อสร้างแผ่นงานและคำตัวอย่าง */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mk = (name, headers) => {
    let sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#f5c451');
      sh.setFrozenRows(1);
    }
    return sh;
  };
  const w = mk(SHEET_WORDS, WORD_HEADERS); mk(SHEET_SCORES, SCORE_HEADERS); mk(SHEET_SESSIONS, SESSION_HEADERS);
  if (w.getLastRow() === 1) {
    const rows = [
      [1, 'ใจ', 'ไป, ไว, ไหม, ไร, ไก่, ไข่, ไฟ, ให้, ไทย', 'กา, ปู, ดี, ลม, ทอง, เสือ', 1, 'สัมผัสสระ -ไอ', true],
      [2, 'ปลา', 'กา, ตา, หมา, ฟ้า, ท่า, นา, ยา, ขา', 'ปู, ดี, ลม, ทอง, เสือ, รัก', 1, 'สัมผัสสระ -อา', true],
      [3, 'ดี', 'ปี, มี, ที่, สี, ผี, หนี, ขี่, ตี', 'กา, ปู, ลม, ทอง, เสือ, รัก', 1, 'สัมผัสสระ -อี', true],
      [4, 'ครู', 'ปู, หู, ดู, รู, งู, หมู, ตู้', 'กา, ดี, ลม, ทอง, เสือ, รัก', 1, 'สัมผัสสระ -อู', true],
      [5, 'ลม', 'ผม, ขม, ชม, ส้ม, นม, ดม, จม, ก้ม, ปม', 'กา, ปู, ดี, ทอง, เสือ, รัก', 2, 'สัมผัสสระ -อม', true],
      [6, 'ทอง', 'ลอง, ของ, น้อง, ห้อง, มอง, กอง, ร้อง, ต้อง, ฟอง, สอง', 'กา, ปู, ดี, ลม, เสือ, รัก', 2, 'สัมผัสสระ -อง', true],
      [7, 'ช้าง', 'ข้าง, ทาง, ล่าง, บาง, วาง, ร้าง, อ้าง, นาง, ยาง, กลาง', 'กา, ปู, ดี, ลม, ทอง, เสือ', 2, 'สัมผัสสระ -าง', true],
      [8, 'เสือ', 'เรือ, เหนือ, เมื่อ, เนื้อ, เบื่อ, เหลือ, เกลือ, เพื่อ, เชื่อ', 'กา, ปู, ดี, ลม, ทอง, รัก', 3, 'สัมผัสสระ -เอือ', true],
      [9, 'รัก', 'ปัก, ชัก, หัก, พัก, นัก, ทัก, หนัก, จัก', 'กา, ปู, ดี, ลม, ทอง, เสือ', 3, 'สัมผัสสระ -ัก', true]
    ];
    w.getRange(2, 1, rows.length, WORD_HEADERS.length).setValues(rows);
  }
  w.setColumnWidths(1, 1, 50); w.setColumnWidths(2, 1, 110); w.setColumnWidths(3, 2, 380);
}

const splitList = v => String(v == null ? '' : v).split(/[,，、;\n]+/).map(s => s.trim()).filter(Boolean);
const toLevel = v => { const s = String(v).trim(); if (s === 'ง่าย') return 1; if (s === 'กลาง') return 2; if (s === 'ยาก') return 3; const n = parseInt(s, 10); return n >= 1 && n <= 3 ? n : 1; };
const json = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

/** GET ?action=words → คลังคำทั้งหมดที่เปิดใช้งาน */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'ping';
  if (action === 'words') {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_WORDS);
    if (!sh || sh.getLastRow() < 2) return json({ ok: true, words: [] });
    const data = sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues();
    const words = data.filter(r => String(r[1]).trim() && String(r[6]).toUpperCase() !== 'FALSE')
      .map((r, i) => ({ id: r[0] || i + 1, prompt: String(r[1]).trim(), correct: splitList(r[2]), distractors: splitList(r[3]), level: toLevel(r[4]), tag: String(r[5] || '') }))
      .filter(w => w.correct.length);
    return json({ ok: true, words: words, count: words.length });
  }
  return json({ ok: true, name: 'ระเบิดเวลาคำคล้องจอง', time: new Date().toISOString() });
}

/** POST (text/plain JSON) {action:'saveResults', sessionId, mode, pin, time, rows:[{name,score,rank,correct,total,booms,note}], rounds} */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action !== 'saveResults') return json({ ok: false, error: 'unknown action' });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sc = ss.getSheetByName(SHEET_SCORES), se = ss.getSheetByName(SHEET_SESSIONS);
    if (!sc || !se) { setup(); sc = ss.getSheetByName(SHEET_SCORES); se = ss.getSheetByName(SHEET_SESSIONS); }
    const t = body.time || new Date().toLocaleString('th-TH');
    const rows = (body.rows || []).map(r => [t, body.sessionId || '', body.mode || '', body.pin || '', r.name || '', r.score != null ? r.score : '', r.rank || '', r.correct != null ? r.correct : '', r.total != null ? r.total : '', r.booms != null ? r.booms : (r.lives != null ? 'ชีวิตเหลือ ' + r.lives : ''), r.note || '']);
    if (rows.length) sc.getRange(sc.getLastRow() + 1, 1, rows.length, SCORE_HEADERS.length).setValues(rows);
    se.appendRow([t, body.sessionId || '', body.mode || '', body.pin || '', rows.length, body.rounds || '']);
    return json({ ok: true, saved: rows.length });
  } catch (err) { return json({ ok: false, error: String(err) }); }
}
