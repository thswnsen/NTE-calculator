/* utils.js */
// UI에서 안전하게 숫자 수치를 긁어오는 헬퍼
const getUIVal = id => { 
    const el = document.getElementById(id); 
    return el ? (parseFloat(el.value) || 0) : 0; 
};

// 시트 행(Row) 데이터에서 숫자를 안전하게 파싱
const parseRowFloat = (row, idx) => {
    if (!row || !row[idx]) return 0;
    const val = row[idx].toString().replace(/[^0-9.-]/g, "");
    return parseFloat(val) || 0;
};

// 시트 행(Row) 데이터에서 문자열을 안전하게 파싱 (따옴표 제거 및 공백 정돈)
const parseRowString = (row, idx) => {
    return (row && row[idx]) ? row[idx].replace(/^"|"$/g, '').trim() : "";
};

// CSV 텍스트를 Matrix(객체) 구조로 변환하는 핵심 파서
function parseSheetToMatrix(csvText) {
    let targetMatrix = {};
    // 큰따옴표 안의 줄바꿈 보호
    const rows = csvText.replace(/"([^"]*)"/g, (m, p1) => '"' + p1.replace(/\n/g, '[NEWLINE]') + '"').split(/\r?\n/);
    if (rows.length < 2) return targetMatrix;

    rows.slice(1).forEach(row => {
        if (!row.trim()) return;
        const tokens = (row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(t =>
            t.replace(/^"|"$/g, '').trim().replace(/\[NEWLINE\]/g, '\n')
        );
        if (tokens.length >= 2) {
            const pKey = tokens[SHEET_IDX.KEY_PRIMARY];
            const sKey = tokens[SHEET_IDX.KEY_SECONDARY];
            if (!targetMatrix[pKey]) targetMatrix[pKey] = {};
            targetMatrix[pKey][sKey] = tokens;
        }
    });
    return targetMatrix;
}

// 구글 시트 fetch 통신 함수
async function fetchData(url, statusId, backup) {
    try {
        const res = await fetch(`${url}&t=${Date.now()}`);
        const statusEl = document.getElementById(statusId);
        if (statusEl) {
            statusEl.innerHTML = '<i class="fa-solid fa-circle-check text-[#deff9a]"></i> 연동 완료';
        }
        return parseSheetToMatrix(await res.text());
    } catch (e) {
        const statusEl = document.getElementById(statusId);
        if (statusEl) {
            statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-500"></i> 오프라인';
        }
        return backup || {};
    }
}


//스텟 가산 함수
function accumulateStats(ctx, row, multiplier = 1) {
    if (!row) return;

    // 시트 인덱스(3~16)별 대응하는 ctx 스탯 키 매핑 테이블
    const statMap = {
        5: 'flatAtk',     // 고정 공격력 (깡공)
        6: 'atkP',        // 공격력 %
        7: 'dmg',         // 피해 증가 %
        8: 'cr',          // 추가 치명타 확률 %
        9: 'cd',          // 추가 치명타 피해 %
        10: 'ignore',     // 방어력 무시 %
        11: 'shred',      // 방어력 감소 %
        12: 'resPen',     // 속성 저항 무시 %
        13: 'resShred',   // 속성 저항 감소 %
        14: 'skillScale', // 스킬 계수 %
        15: 'Vulnerable', // 취약 %
        16: 'Multiplier'  // 최종 데미지 배율
    };

    for (let idx = 5; idx <= 16; idx++) {
        const key = statMap[idx];
        if (key && row[idx] !== undefined && row[idx] !== "") {
            //스킬배율 누적안되게 예외처리
            if(idx==14) return;
            const val = parseRowFloat(row, idx) * multiplier;
            // 취약(Vulnerable)의 경우 퍼센트 수치이므로 소수점 비율로 치환하여 누적
        
            if (key === 'Vulnerable') {
                ctx[key] += val / 100;
            } else {
                ctx[key] += val;
            }
        }
    }
}