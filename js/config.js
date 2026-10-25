/* ตั้งค่าเกม "ระเบิดเวลาคำคล้องจอง" — แก้เฉพาะไฟล์นี้ก่อน deploy ขึ้น GitHub Pages */
window.TBK_CONFIG = {
  // URL ของ Google Apps Script Web App (ลงท้ายด้วย /exec) — ใช้ดึงคลังคำและบันทึกคะแนนลง Google Sheets
  // เว้นว่างไว้ = ใช้คลังคำตัวอย่างในเครื่อง และบันทึกคะแนนเป็นไฟล์ CSV แทน
  GAS_URL: "https://script.google.com/macros/s/AKfycbxwogA_NEuwlDURUteo0rfxifzEqJ-dCqS462JLoVFrF0FYvQJ8alGDFJRaVp56HbeQ/exec",

  // ค่า firebaseConfig ของโปรเจกต์ Firebase (ใช้เฉพาะโหมด 2 ตอบสดพร้อมกันทั้งห้อง)
  // เว้นว่างไว้ = โหมดทดลองในเครื่องเดียว (เปิดหน้าครูกับหน้านักเรียนคนละแท็บของเบราว์เซอร์เดียวกัน)
  FIREBASE: {
    apiKey: "AIzaSyArbINXvnjnPfxaRSbbbFusHoegHBWETYs",
    authDomain: "rhyme-time-bomb.firebaseapp.com",
    projectId: "rhyme-time-bomb",
    storageBucket: "rhyme-time-bomb.firebasestorage.app",
    messagingSenderId: "173249040251",
    appId: "1:173249040251:web:ca25b7c242cca94d85b7de"
  },

  // URL หน้าเกมสำหรับสร้าง QR (เว้นว่าง = ใช้ที่อยู่ปัจจุบันของหน้าครู)
  // ตัวอย่าง: "https://USERNAME.github.io/REPO/"
  SITE_URL: "",

  TITLE: "ระเบิดเวลาคำคล้องจอง",
  AUTHOR: "ครูนนทพัทธ์ หิรัญเรือง"
};
