/* script.js - Controller (최종 완벽본) */

let fullCharData = {}, fullArcData = {}, fullConsoleData = {}, fullModuleData = {}, fullExternalBuffData = {};
let currentCharacter = "", currentArc = "", currentConsole = "";
let currentArcTier = 1;
let activeAwakeNodes = new Set();
let moduleInputMode = "direct"; // 기본값은 직접입력 모드 ('direct' 또는 'count')

// --- 1. 초기 데이터 로드 ---
async function loadDatabases() {
    fullCharData = await fetchData(SHEET_CHAR_URL, 'char-status', typeof CHAR_OFFLINE_BACKUP !== 'undefined' ? CHAR_OFFLINE_BACKUP : {});
    fullArcData = await fetchData(SHEET_ARC_URL, 'arc-status', typeof ARC_OFFLINE_BACKUP !== 'undefined' ? ARC_OFFLINE_BACKUP : {});
    fullConsoleData = await fetchData(SHEET_CONSOLE_URL, 'console-status', typeof CONSOLE_OFFLINE_BACKUP !== 'undefined' ? CONSOLE_OFFLINE_BACKUP : {});
    fullModuleData = await fetchData(SHEET_MODULE_URL, 'module-status', typeof MODULE_OFFLINE_BACKUP !== 'undefined' ? MODULE_OFFLINE_BACKUP : {});
    fullExternalBuffData = await fetchData(SHEET_BUFF_URL, 'buff-status', typeof BUFF_OFFLINE_BACKUP !== 'undefined' ? BUFF_OFFLINE_BACKUP : {});
    fullEnemyData = await fetchData(SHEET_ENEMY_URL, 'enemy-status', typeof ENEMY_OFFLINE_BACKUP !== 'undefined' ? ENEMY_OFFLINE_BACKUP : {});
    buildSelectors();               // 캐릭터, 아크, 콘솔 셀렉터 로드
    buildModuleSelectors();         // 모듈 셀렉터 로드
    buildExternalBuffSelectors();   // 외부 버프 셀렉터 로드
    syncResistanceDisplay(); //저항 로드
    autoCalculateEnemyStats();// 적 방어력 로드
}

// --- 2. 셀렉터 설정 및 프리셋 호출 ---
function buildSelectors() {
    const sysKeys = ['character', 'ark', 'id', 'name', '공격력', '치명타'];
    const setupSelector = (id, data, currentVar, applyFn) => {
        const el = document.getElementById(id);
        if (!el) return "";
        el.innerHTML = "";
        const keys = Object.keys(data).filter(k => !sysKeys.includes(k.toLowerCase()));
        keys.forEach(k => { 
            const o = document.createElement('option'); 
            o.value = k; 
            o.textContent = k; 
            el.appendChild(o); 
        });
        if (keys.length > 0) {
            const initial = keys[0];
            el.value = initial;
            applyFn(initial);
            return initial;
        }
        return "";
    };

    currentCharacter = setupSelector('char-select', fullCharData, currentCharacter, () => applyCharPreset());
    currentArc = setupSelector('arc-select', fullArcData, currentArc, () => applyArcPreset());
    currentConsole = setupSelector('console-select', fullConsoleData, currentConsole, () => applyConsolePreset());
    buildConsoleOptionSelectors();
}

// --- 콘솔 주옵션/부옵션 선택 ---
function buildConsoleOptionSelectors() {
    const mainSelect = document.getElementById('console-main-opt');
    const subSelects = document.querySelectorAll('.console-sub-opt');

    if (!fullConsoleData) return;

    const mainOptions = Object.keys(fullConsoleData['주옵션'] || {});
    if (mainSelect) {
        mainSelect.innerHTML = '<option value="">선택 안함</option>';
        mainOptions.forEach(opt => {
            const row = fullConsoleData['주옵션'][opt];
            const desc = parseRowString(row, 17);
            const o = document.createElement('option');
            o.value = opt; o.textContent = desc || opt; mainSelect.appendChild(o);
        });
    }

    const subOptions = Object.keys(fullConsoleData['부옵션'] || {});
    subSelects.forEach(sel => {
        sel.innerHTML = '<option value="">선택 안함</option>';
        subOptions.forEach(opt => {
            const row = fullConsoleData['부옵션'][opt];
            const desc = parseRowString(row, 17);
            const o = document.createElement('option');
            o.value = opt; o.textContent = desc || opt; sel.appendChild(o);
        });
    });
}

// --- 모듈 주옵션 설정 ---
function buildModuleSelectors() {
    if (!fullModuleData) return;

    if (typeof currentCharacter !== 'undefined' && currentCharacter) {
        updateModuleBonusDescription(currentCharacter);
    }

    const mainPack = fullModuleData['주옵션'] || {};
    const mainRow = mainPack['고정공격력'] || mainPack['고정 공격력'];

    if (mainRow) {
        let mainAtkVal = 0;
        for (let i = 2; i <= 12; i++) {
            const temp = parseRowFloat(mainRow, i);
            if (temp !== 0) {
                mainAtkVal = temp;
                break;
            }
        }

        const mainInput = document.getElementById('ui-mod-main-flat');
        if (mainInput) {
            mainInput.value = mainAtkVal;
        }
    }
    calculate();
}

// --- 캐릭터별 모듈 보너스 설명 갱신 ---
function updateModuleBonusDescription(selectedCharName) {
    const descElement = document.getElementById('ui-mod-bonus-desc');
    if (!descElement) return;

    const charPack = fullCharData ? fullCharData[selectedCharName] : null;
    if (!charPack) {
        descElement.innerText = "캐릭터 데이터를 찾을 수 없습니다.";
        return;
    }

    const bonusRow = Object.values(charPack).find(row => row && row[1] === '장착보너스');

    if (bonusRow) {
        const fullDesc = parseRowString(bonusRow, 17);
        descElement.innerText = fullDesc ? fullDesc : "시트 17번 열에 설명이 비어있습니다.";
    } else {
        descElement.innerText = "캐릭터별 전용 세트 효과 적용 개수를 입력하세요";
    }
}

// --- 외부 버프 선택 리스트 동적 빌드 ---
function buildExternalBuffSelectors() {
    const consoleContainer = document.getElementById('ext-buff-console-list');
    const partyContainer = document.getElementById('ext-buff-party-list');

    if (!fullExternalBuffData || !consoleContainer || !partyContainer) return;

    consoleContainer.innerHTML = "";
    partyContainer.innerHTML = "";

    if (fullExternalBuffData['에스퍼사이클']) {
        const container = document.getElementById('esper-buff-container'); 
        if (container) container.innerHTML = '';

        Object.keys(fullExternalBuffData['에스퍼사이클']).forEach(name => {
            const row = fullExternalBuffData['에스퍼사이클'][name];
            const desc = parseRowString(row, 17);
            const checkboxHTML = createBuffCheckboxHTML('esper', name, desc); 
            if (container) container.appendChild(checkboxHTML);
        });
    }

    if (fullExternalBuffData['콘솔']) {
        Object.keys(fullExternalBuffData['콘솔']).forEach(name => {
            const row = fullExternalBuffData['콘솔'][name];
            const desc = parseRowString(row, 17);
            consoleContainer.appendChild(createBuffCheckboxHTML('console',name, desc));
        });
    }

    if (fullExternalBuffData['파티원']) {
        Object.keys(fullExternalBuffData['파티원']).forEach(name => {
            const row = fullExternalBuffData['파티원'][name];
            const desc = parseRowString(row, 17);
            const flatAtkValue = parseRowFloat(row, 5); 
            partyContainer.appendChild(createBuffCheckboxHTML('party', name, desc, flatAtkValue));
            
        });
    }
    calculate();
}

// --- 프리셋 데이터 매핑 함수들 ---
function applyCharPreset() {
    currentCharacter = document.getElementById('char-select').value;
    if (!currentCharacter || !fullCharData[currentCharacter]) return;

    activeAwakeNodes.clear();
    document.querySelectorAll('.awake-btn').forEach(b => b.classList.remove('active'));

    const pack = fullCharData[currentCharacter];
    const baseRow = pack[currentCharacter];

    const updateBuffUI = (id, skillKey) => {
        const cb = document.getElementById(id);
        const row = pack[skillKey];
        const exists = row && Array.from({ length: 12 }, (_, i) => parseRowFloat(row, i + 2)).some(v => v !== 0);
        cb.disabled = !exists;
        cb.checked = false;
        cb.parentElement.classList.toggle('opacity-40', !exists);
        cb.parentElement.classList.toggle('pointer-events-none', !exists);
        document.getElementById(`desc-${id}`).textContent = row ? parseRowString(row, 17) : "정보 없음";
    };

    updateBuffUI('trigger-vailray', '바일레이스킬');
    updateBuffUI('trigger-ultimate', '궁극스킬');

    if (baseRow) {
        document.getElementById('stat-base-atk').textContent = parseRowFloat(baseRow, 2);
        document.getElementById('stat-base-cr').textContent = parseRowFloat(baseRow, 3) + "%";
        document.getElementById('stat-base-cd').textContent = parseRowFloat(baseRow, 4) + "%";
    }

    document.getElementById('desc-p3').textContent = parseRowString(pack['돌파3'], 17) || "정보 없음";
    document.getElementById('desc-p6').textContent = parseRowString(pack['돌파6'], 17) || "정보 없음";
    
    if (typeof updateModuleBonusDescription === 'function') {
        updateModuleBonusDescription(currentCharacter);
    }
    calculate();
}

function applyArcPreset() {
    currentArc = document.getElementById('arc-select').value;
    const pack = fullArcData[currentArc];
    if (!pack) return;
    const row = pack[`믹싱레벨${currentArcTier}`] || pack[currentArcTier];
    const baseOptionText = pack[`기본`][17] || pack[currentArcTier];
    if (row) {
        document.getElementById('ui-arc-base-atk').value = parseRowFloat(row, 2);
        document.getElementById('display-arc-name').textContent = currentArc;
        document.getElementById('display-arc-base-opt').textContent = baseOptionText[17];
        document.getElementById('display-arc-desc').innerText = parseRowString(row, 17);
    }
    calculate();
}

function applyConsolePreset() {
    const conSelect = document.getElementById('console-select');
    const setSelect = document.getElementById('console-set-select');
    if (!conSelect || !setSelect) return;

    currentConsole = conSelect.value;
    const setType = setSelect.value;

    if (!fullConsoleData[currentConsole]) return;

    const pack = fullConsoleData[currentConsole];
    const row = pack[setType];

    if (row) {
        const descEl = document.getElementById('display-console-desc');
        if (descEl) descEl.innerText = parseRowString(row, 17);
    }
    calculate();
}

// --- 모듈 부옵션 직접입력 / 개수입력 토글 제어 ---
function switchModuleMode(mode) {
    moduleInputMode = mode;

    const btnDirect = document.getElementById('btn-mod-direct');
    const btnCount = document.getElementById('btn-mod-count');
    const ids = ['atk-p', 'dmg', 'cr', 'cd', 'flat'];

    const sheetKeyMap = {
        'atk-p': '공격력%',
        'dmg': '피해%',
        'cr': '치명타 확률%',
        'cd': '치명타 피해%',
        'flat': '고정공격력'
    };

    if (mode === 'direct') {
        btnDirect.className = "px-2.5 py-1 rounded font-bold transition-all bg-zinc-800 text-white";
        btnCount.className = "px-2.5 py-1 rounded font-bold transition-all text-zinc-500 hover:text-zinc-300";

        ids.forEach(id => {
            const descEl = document.getElementById(`desc-mod-${id}`);
            const unitEl = document.getElementById(`unit-mod-${id}`);
            const input = document.getElementById(`ui-mod-sub-${id}`);

            if (descEl) descEl.textContent = "";
            if (unitEl) unitEl.textContent = (id === 'flat') ? "" : "%";
            if (input) {
                input.placeholder = (id === 'flat') ? "0" : "0.0";
                input.value = "";
            }
        });
    } else {
        btnDirect.className = "px-2.5 py-1 rounded font-bold transition-all text-zinc-500 hover:text-zinc-300";
        btnCount.className = "px-2.5 py-1 rounded font-bold transition-all bg-zinc-800 text-white";

        let subPack = {};
        if (typeof fullModuleData !== 'undefined' && fullModuleData) {
            subPack = fullModuleData['부옵션'] || fullModuleData;
        }

        ids.forEach(id => {
            const descEl = document.getElementById(`desc-mod-${id}`);
            const unitEl = document.getElementById(`unit-mod-${id}`);
            const input = document.getElementById(`ui-mod-sub-${id}`);

            const sheetKey = sheetKeyMap[id];
            const row = subPack[sheetKey];
            let sheetDesc = row ? parseRowString(row, 17) : "";

            if (descEl) {
                descEl.textContent = sheetDesc ? `${sheetDesc} *` : `[${sheetKey}?] *`;
            }
            if (unitEl) unitEl.textContent = "개";
            if (input) {
                input.placeholder = "0";
                input.value = "";
            }
        });
    }
    calculate();
}

// --- 3. 초기 이벤트 및 실행 핸들러 ---
window.onload = () => {
    loadDatabases();
    
    // 페이지 로드 시 드롭다운 값에 맞춰 초기화
    

};

function setArcTier(tier) { 
    currentArcTier = tier; 
    document.querySelectorAll('.arc-tier-btn').forEach((b, i) => b.classList.toggle('active', (i + 1) === tier)); 
    applyArcPreset(); 
}

function toggleAwake(n) { 
    const b = document.getElementById(`awake-${n}`); 
    if (activeAwakeNodes.has(n)) { 
        activeAwakeNodes.delete(n); 
        b.classList.remove('active'); 
    } else { 
        activeAwakeNodes.add(n); 
        b.classList.add('active'); 
    } 
    document.getElementById('awake-count').textContent = activeAwakeNodes.size; 
    calculate(); 
}

// --- 4. 타겟(적) 스탯 자동 연산 함수 ---

function autoCalculateEnemyStats() {
    // 1. 영역 타입 가져오기
    const domainRadios = document.getElementsByName('domain-select');
    let domainType = "일반";
    for (const radio of domainRadios) {
        if (radio.checked) {
            domainType = radio.value;
            break;
        }
    }
    
    // 2. 적 레벨 가져오기
    const enemyLvl = Number(document.getElementById('input-enemy-lvl').value) || 0;
    
    // 3. 결과 표시용 요소
    const enemyDefDisplay = document.getElementById('display-enemy-def');
    
    // 4. 공식 적용
    let calculatedDef = 0;
    if (domainType === "일반") {
        calculatedDef = 600 + (6 * enemyLvl);
    } else if (domainType === "궤도") {
        calculatedDef = 540 + (6 * enemyLvl);
    }
    
    // 5. 화면에 텍스트 업데이트
    if (enemyDefDisplay) {
        enemyDefDisplay.textContent = calculatedDef;
    }
}

// 속성 저항력 드롭다운(select-res) 변경 시 결과값(display-enemy-res) 연동
function syncResistanceDisplay() {
    const resSelect = document.getElementById('select-res');
    const resDisplay = document.getElementById('display-enemy-res');
    
    if (resSelect && resDisplay) {
        // 드롭다운에서 선택된 값을 가져와서 % 기호를 붙여 표시
        resDisplay.textContent = resSelect.value + "%";
    }
}