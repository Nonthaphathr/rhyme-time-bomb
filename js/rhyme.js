/* ตรรกะตรวจสัมผัสสระ (คำคล้องจอง) — นำมาจากเครื่องมือช่วยแต่งอินทรวิเชียรฉันท์ ๑๑ ของครูนนทพัทธ์
   (github.com/Nonthaphathr/intharavichian11) ไม่ดัดแปลงตรรกะ  สัมผัส = สระเดียวกัน + หมวดตัวสะกดเดียวกัน */
(function () {
// *** ฟังก์ชันตรวจสอบสัมผัส - แก้ไขแล้ว ***
        function checkSamphus(word1, word2) {
            if (!word1 || !word2) return false;

            word1 = word1.trim();
            word2 = word2.trim();

            if (!word1 || !word2) return false;

            const sound1 = getVowelAndFinalSound(word1);
            const sound2 = getVowelAndFinalSound(word2);

            return sound1.vowel === sound2.vowel &&
                   sound1.finalGroup === sound2.finalGroup &&
                   sound1.vowel !== '' && sound1.finalGroup !== '';
        }

        // *** ฟังก์ชันหาเสียงพยัญชนะต้น ***
        function getInitialConsonantGroup(word) {
            if (!word) return '';
            word = word.trim().replace(/[่้๊๋์]/g, '');

            let startIndex = 0;
            if ("เแโใไ".includes(word.charAt(0))) {
                startIndex = 1;
            }

            if (startIndex >= word.length) return '';

            // จัดการกรณี ห นำ และ อ นำ
            const firstChar = word.charAt(startIndex);

            // ถ้าเป็น ห หรือ อ นำ ให้ดูพยัญชนะถัดไปด้วย
            if ((firstChar === 'ห' || firstChar === 'อ') && startIndex + 1 < word.length) {
                const secondChar = word.charAt(startIndex + 1);
                const leadingConsonants = 'งญยรนลมว';

                if (leadingConsonants.includes(secondChar)) {
                    // คืนค่าเป็นคู่ เช่น "ห+ม", "อ+ย"
                    return firstChar + secondChar;
                }
            }

            const char = word.charAt(startIndex);

            if ('ก'.includes(char)) return 'k';
            if ('ขฃคฅฆ'.includes(char)) return 'kh';
            if ('ง'.includes(char)) return 'ng';
            if ('จ'.includes(char)) return 'j';
            if ('ฉชฌ'.includes(char)) return 'ch';
            if ('ซศษส'.includes(char)) return 's';
            if ('ยญ'.includes(char)) return 'y';
            if ('ฎด'.includes(char)) return 'd';
            if ('ฏต'.includes(char)) return 't';
            if ('ฐฑฒถทธ'.includes(char)) return 'th';
            if ('ณน'.includes(char)) return 'n';
            if ('บ'.includes(char)) return 'b';
            if ('ป'.includes(char)) return 'p';
            if ('ผพภฟฝ'.includes(char)) {
                 if ('ฝฟ'.includes(char)) return 'f';
                 return 'ph';
            }
            if ('ม'.includes(char)) return 'm';
            if ('ร'.includes(char)) return 'r';
            if ('ลฬ'.includes(char)) return 'l';
            if ('ว'.includes(char)) return 'w';
            if ('หฮ'.includes(char)) return 'h';
            if ('อ'.includes(char)) return 'a';

            return char;
        }
        // ตรวจสอบคำพ้องเสียง
        function isHomophone(word1, word2) {
             if (!checkSamphus(word1, word2)) return false;

             const init1 = getInitialConsonantGroup(word1);
             const init2 = getInitialConsonantGroup(word2);

             return init1 === init2 && init1 !== '';
        }
        function processLeadingConsonants(word) {
            const anamYWords = ['อย่า', 'อยู่', 'อย่าง', 'อยาก'];
            for (let anamWord of anamYWords) {
                if (word.startsWith(anamWord.replace(/[่้๊๋์]/g, ''))) {
                   return 'ย' + word.substring(2);
                }
            }

            if (word.length >= 2 && word.charAt(0) === 'ห') {
                const secondChar = word.charAt(1);
                const leadingConsonants = ['ง', 'ย', 'ญ', 'ร', 'น', 'ล', 'ม', 'ว'];

                if (leadingConsonants.includes(secondChar)) {
                   return word.substring(1);
                }
            }
            return word;
        }
        // ฟังก์ชันตัดตัวการันต์และพยัญชนะที่ถูกกำกับ (เพิ่มใหม่ตามคำสั่ง)
        function removeKaran(word) {
            let result = word;
            while (result.includes('์')) {
                const karanIndex = result.indexOf('์');
                if (karanIndex > 0) {
                    result = result.substring(0, karanIndex - 1) + result.substring(karanIndex + 1);
                } else {
                    result = result.substring(1);
                }
            }
            return result;
        }
        // วิเคราะห์คำบาลี/สันสกฤตที่มีโครงสร้าง สระยาว + ตัวสะกด + สระสั้น (เพิ่มใหม่ตามคำสั่ง)
        // เช่น ชาติ, เหตุ, ราชา, มาตุ, ปิตุ
        function analyzePaliStructure(word) {
            const consonants = 'กขคฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ';
            const shortEndVowels = 'ิึุ';
            const longVowels = ['า', 'ี', 'ื', 'ู', 'เ', 'แ', 'โ', 'อ'];

            const lastChar = word.charAt(word.length - 1);

            // ถ้าลงท้ายด้วยสระสั้น ิ ึ ุ
            if (shortEndVowels.includes(lastChar) && word.length >= 3) {
                const beforeLast = word.charAt(word.length - 2);

                // ถ้าก่อนสระสั้นเป็นพยัญชนะ
                if (consonants.includes(beforeLast)) {
                    // ตรวจสอบว่ามีสระยาวก่อนหน้าหรือไม่
                    const prefix = word.substring(0, word.length - 2);

                    for (let v of longVowels) {
                        if (prefix.includes(v)) {
                            // คืนค่าตัวสะกดและสระหลัก
                            return {
                                isPali: true,
                                finalConsonant: beforeLast,
                                mainVowel: v
                            };
                        }
                    }

                    // กรณีสระ เ- ที่อยู่หน้าคำ
                    if (word.charAt(0) === 'เ' || word.charAt(0) === 'แ' || word.charAt(0) === 'โ') {
                        return {
                            isPali: true,
                            finalConsonant: beforeLast,
                            mainVowel: word.charAt(0)
                        };
                    }
                }
            }

            return { isPali: false };
        }
        // *** ฟังก์ชันหาสระและตัวสะกด - แก้ไขตามคำสั่ง ***
        function getVowelAndFinalSound(word) {
            if (!word) return { vowel: '', finalGroup: '' };

            // ตัดวรรณยุกต์ (ยกเว้น ์ ไว้ก่อน เพื่อส่งให้ removeKaran ตัดการันต์)
            let cleanWord = word.replace(/[่้๊๋]/g, '');
            // ตัดตัวการันต์และพยัญชนะที่ถูกกำกับ
            cleanWord = removeKaran(cleanWord);

            const processedWord = processLeadingConsonants(cleanWord);

            // --- Ror Han Specific Rules ---
            if (/รร[ถตษสศดจชฎฏฐฑฒทธ]$/.test(processedWord)) {
                return { vowel: 'อะ', finalGroup: 'กด' };
            }
            if (/รร[คกขฆ]$/.test(processedWord)) {
                return { vowel: 'อะ', finalGroup: 'กก' };
            }
            if (/รร[พภบปฟ]$/.test(processedWord)) {
                return { vowel: 'อะ', finalGroup: 'กบ' };
            }
            if (processedWord.endsWith('รรม')) {
                return { vowel: 'อำ', finalGroup: 'กกา' };
            }
            if (processedWord.endsWith('รร')) {
                return { vowel: 'อะ', finalGroup: 'กน' };
            }
            if (processedWord.endsWith('รรณ')) {
                return { vowel: 'อะ', finalGroup: 'กน' };
            }

            if (hasAiVowel(processedWord)) {
                return { vowel: 'ไอ', finalGroup: 'เกย' };
            }

            const finalGroup = getFinalConsonantGroup(processedWord);
            const vowel = getVowelSound(processedWord);

            return { vowel, finalGroup };
        }
        function hasAiVowel(word) {
            if (word.includes('ไ')) return true;
            if (word.includes('ใ')) return true;
            if (word.includes('ัย')) return true;

            const specialAiWords = [
                'วัย', 'ชัย', 'ภัย', 'ไทย', 'อัย', 'ขัย', 'นัย', 'ลัย', 'สัย',
                'ปัจจัย', 'อาศัย', 'วิสัย', 'ปรนัย', 'อุปัย', 'วิธัย'
            ];

            for (let specialWord of specialAiWords) {
                if (word === specialWord || word.endsWith(specialWord)) {
                        return true;
                }
            }
            return false;
        }
        // *** ฟังก์ชันหาหมวดตัวสะกด - แก้ไขใหม่ทั้งหมดตามคำสั่ง ***
        function getFinalConsonantGroup(word) {
            if (hasAiVowel(word)) {
                return 'เกย';
            }

            const finalConsonantGroups = {
                'ก': 'กก', 'ข': 'กก', 'ค': 'กก', 'ฆ': 'กก',
                'จ': 'กด', 'ช': 'กด', 'ซ': 'กด', 'ฌ': 'กด', 'ญ': 'กน',
                'ด': 'กด', 'ต': 'กด', 'ถ': 'กด', 'ท': 'กด', 'ธ': 'กด',
                'ศ': 'กด', 'ษ': 'กด', 'ส': 'กด', 'ฏ': 'กด', 'ฐ': 'กด',
                'ฑ': 'กด', 'ฒ': 'กด',
                'บ': 'กบ', 'ป': 'กบ', 'พ': 'กบ', 'ฟ': 'กบ', 'ภ': 'กบ',
                'น': 'กน', 'ณ': 'กน', 'ร': 'กน', 'ล': 'กน', 'ฬ': 'กน',
                'ม': 'กม',
                'ง': 'กง',
                'ย': 'เกย',
                'ว': 'เกอว'
            };

            // ตรวจสอบโครงสร้างคำบาลี/สันสกฤต ก่อน
            const paliResult = analyzePaliStructure(word);
            if (paliResult.isPali && paliResult.finalConsonant) {
                return finalConsonantGroups[paliResult.finalConsonant] || 'กกา';
            }

            const lastChar = word.charAt(word.length - 1);

            if (finalConsonantGroups[lastChar]) {
                return finalConsonantGroups[lastChar];
            }

            return 'กกา';
        }
        // *** ฟังก์ชันหาสระ - แก้ไขใหม่ทั้งหมดตามคำสั่ง ***
        function getVowelSound(word) {
            if (hasAiVowel(word)) {
                return 'ไอ';
            }

            // ตรวจสอบโครงสร้างคำบาลี/สันสกฤต ก่อน
            const paliResult = analyzePaliStructure(word);
            if (paliResult.isPali && paliResult.mainVowel) {
                const vowelMap = {
                    'า': 'อา', 'ี': 'อี', 'ื': 'อื', 'ู': 'อู',
                    'เ': 'เอ', 'แ': 'แอ', 'โ': 'โอ', 'อ': 'ออ'
                };
                return vowelMap[paliResult.mainVowel] || paliResult.mainVowel;
            }

            // สระประสม (ตรวจก่อนสระเดี่ยว)
            if (word.includes('เ') && word.includes('ีย')) return 'เอีย';
            if (word.includes('เ') && word.includes('ือ')) return 'เอือ';
            if (word.includes('ัว')) return 'อัว';
            if (word.includes('เ') && word.includes('าะ')) return 'เอาะ';
            if (word.includes('เ') && word.includes('อะ')) return 'เออะ';
            if (word.includes('เ') && word.includes('ียะ')) return 'เอียะ';
            if (word.includes('เ') && word.includes('ือะ')) return 'เอือะ';
            if (word.includes('ัวะ')) return 'อัวะ';

            if (word.includes('ำ')) return 'อำ';
            if (word.includes('เ') && word.includes('า')) return 'เอา';
            if (word.includes('เ') && word.includes('อ')) return 'เออ';

            // สระเดี่ยวยาว (ตรวจก่อนสระสั้น)
            if (word.includes('แ')) return 'แอ';
            if (word.includes('โ')) return 'โอ';
            if (word.includes('ื')) return 'อื';
            if (word.includes('ู')) return 'อู';
            if (word.includes('ี')) return 'อี';
            if (word.includes('า')) return 'อา';
            if (word.includes('อ') && word.length > 1) {
                // ตรวจสอบว่าเป็นสระออ หรือพยัญชนะ อ
                const oIndex = word.indexOf('อ');
                if (oIndex > 0 || (oIndex === 0 && word.length > 1 && !'ะัาำิีึืุูเแโใไๅ'.includes(word.charAt(1)))) {
                    // ไม่ใช่สระออ
                } else if (word.includes('อ') && word.indexOf('อ') > 0) {
                    return 'ออ';
                }
            }

            // สระเดี่ยวสั้น
            if (word.includes('เ') && word.includes('ะ')) return 'เอะ';
            if (word.includes('แ') && word.includes('ะ')) return 'แอะ';
            if (word.includes('โ') && word.includes('ะ')) return 'โอะ';
            if (word.includes('ึ')) return 'อึ';
            if (word.includes('ุ')) return 'อุ';
            if (word.includes('ิ')) return 'อิ';
            if (word.includes('ะ')) return 'อะ';
            if (word.includes('ั')) return 'อะ';

            // สระ เ- เดี่ยว (ไม่มีตัวสะกด)
            if (word.includes('เ')) return 'เอ';

            // คำพยางค์เดียวไม่มีสระ
            if (word.length === 1) {
                return 'อะ';
            }

            return 'อะ';
        }

        
  /* ---- ส่วนที่เพิ่มสำหรับเกม (ไม่แก้ฟังก์ชันต้นฉบับด้านบน) ----
     1) พยางค์เปิดแบบ เ/แ/โ + พยัญชนะตัวเดียว (เก เท แล โต) ไม่มีตัวสะกด — ต้นฉบับอ่านพยัญชนะตัวท้ายเป็นตัวสะกด
     2) รูป ก+ว+ตัวสะกด ไม่มีสระ (ด่วน ส่วน ควร รวม พวก) = สระอัว */
  const TONE = /[่้๊๋]/g;
  function soundOf(w) {
    const c = String(w || '').trim().replace(TONE, '');
    if (/^[เแโ][ก-ฮ]$/.test(c)) return { vowel: { 'เ': 'เอ', 'แ': 'แอ', 'โ': 'โอ' }[c[0]], finalGroup: 'เปิด' };
    const m = c.match(/^(?:[กขค][รลว]|[ตทศสจ]ร|[ปพ][รล]|ห[งญนยรลมว]|[ก-ฮ])ว([ก-ฮ])$/);
    if (m) return { vowel: 'อัว', finalGroup: getFinalConsonantGroup(m[1]) };
    return getVowelAndFinalSound(w);
  }
  window.Rhyme = {
    checkSamphus, isHomophone, getVowelAndFinalSound, soundOf,
    /* ตรวจคำตอบกับคำโจทย์: สระเดียวกัน + หมวดตัวสะกดเดียวกัน, ไม่ใช่เสียงซ้ำ (พยัญชนะต้นกลุ่มเดียวกัน), และเป็นคำเดียว */
    isRhyme(prompt, answer) {
      const a = String(answer || '').trim(), p = String(prompt || '').trim(); if (!a || !p || /\s/.test(a)) return false;
      try { if (Intl.Segmenter && [...new Intl.Segmenter('th', { granularity: 'word' }).segment(a)].filter(x => x.isWordLike).length > 1) return false; } catch (e) { }
      const sa = soundOf(a), sp = soundOf(p);
      if (!sa.vowel || !sa.finalGroup || sa.vowel !== sp.vowel || sa.finalGroup !== sp.finalGroup) return false;
      return getInitialConsonantGroup(a) !== getInitialConsonantGroup(p);
    }
  };
})();
