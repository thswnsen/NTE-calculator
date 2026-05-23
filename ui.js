// --- 돌파활성화 UI ---
function updateAwakeTierUI(tier, isActive, statFn) {
    const card = document.getElementById(`card-p${tier}`);
    const badge = document.getElementById(`badge-p${tier}`);
    const desc = document.getElementById(`desc-p${tier}`);
    if (!card) return;

    const title = card.querySelector('span:first-child');

    if (isActive) {
        statFn();
        card.classList.replace('border-zinc-900', 'border-[#deff9a]/30');
        card.classList.add('bg-zinc-900/50');
        badge.textContent = "활성화";
        badge.className = "text-[9px] px-1.5 rounded bg-[#deff9a] text-black font-bold";
        desc.className = "text-xs text-zinc-200";

        if (title) {
            title.classList.replace('text-zinc-500', 'text-[#deff9a]');
        }
    } else {
        card.classList.replace('border-[#deff9a]/30', 'border-zinc-900');
        card.classList.remove('bg-zinc-900/50');
        badge.textContent = "비활성";
        badge.className = "text-[9px] px-1.5 rounded bg-zinc-900 text-zinc-500";
        desc.className = "text-xs text-zinc-500 italic";

        if (title) {
            title.classList.replace('text-[#deff9a]', 'text-zinc-500');
        }
    }
}


// --- 5. 최종 레포트 ---
function renderFinalResults(ctx) {
    const eLvl = Number(document.getElementById('input-enemy-lvl').value);
    const pLvl = Number(document.getElementById('input-player-lvl').value);
    const eRes = Number(document.getElementById('select-res').value) / 100;
    const isOrbit = document.querySelector('input[name="domain-select"]:checked').value === "궤도";

    const totalAtk = ctx.baseAtk * (1 + ctx.atkP / 100) + ctx.flatAtk;
    const finalCR = Math.min(100, Math.max(0, ctx.cr));

    // 방어력 공식
    const enemyDefBase = isOrbit ? (90 + eLvl) : (100 + eLvl);
    const defFactor = (100 + pLvl) / ((enemyDefBase * (1 - ctx.shred / 100) * (1 - ctx.ignore / 100)) + (100 + pLvl));

    // 저항력 공식
    const effRes = eRes - ctx.resPen - ctx.resShred;
    console.log(defFactor);
    const finalVulnMultiplier = 1 + (ctx.Vulnerable || 0);
    const finalDmgMultiplier = 1 + (ctx.finalDmgMultiplier || 0);

    // 데미지 계산
    const dmgNormal = totalAtk * (ctx.skillScale / 100) * (1 + ctx.dmg / 100) * defFactor * (1-effRes) * finalVulnMultiplier * finalDmgMultiplier;
    const dmgCrit = dmgNormal * (1 + ctx.cd / 100);
    const dmgExp = dmgCrit * (finalCR / 100) + dmgNormal * (1 - finalCR / 100);

   
    // 결과 텍스트 업데이트 전용 헬퍼
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    // 1. 메인 데미지 결과
    setVal('res-expected', Math.floor(dmgExp).toLocaleString());
    setVal('res-crit', Math.floor(dmgCrit).toLocaleString());
    setVal('res-normal', Math.floor(dmgNormal).toLocaleString());

    // 2. [수정됨] 세부 스탯 리포트 (기본 공격력 추가)
    setVal('fact-base-atk', Math.floor(ctx.baseAtk).toLocaleString()); // 기본 공격력 
    setVal('fact-flat-atk', `+${ctx.flatAtk.toLocaleString()}`);
    setVal('fact-atk-pct', `+${ctx.atkP.toFixed(1)}%`);
    setVal('fact-atk', Math.floor(totalAtk).toLocaleString());

    setVal('fact-base', `${ctx.skillScale.toFixed(0)}%`); // 스킬 계수
    setVal('fact-skill-scale', `${ctx.skillScale.toFixed(0)}%`); // 스킬 계수
    setVal('fact-dmg', `+${ctx.dmg.toFixed(1)}%`);
    setVal('fact-crit-rate', `${finalCR.toFixed(1)}%`);
    setVal('fact-crit-dmg', `${ctx.cd.toFixed(1)}%`);

    // 3. [추가] 방어력/내성/최종 배율 리포트 (UI에 해당 ID가 있다면 작동)
    setVal('fact-def-shred', `${ctx.shred.toFixed(1)}%`);
    setVal('fact-def-ignore', `${ctx.ignore.toFixed(1)}%`);
    setVal('fact-res-pen', `${ctx.resPen.toFixed(1)}%`);
    setVal('fact-res-shred', `${ctx.resPen.toFixed(1)}%`);
    setVal('fact-vuln', `${finalVulnMultiplier.toFixed(2)}x`);

    //setVal('fact-final-bonus', `${(defFactor * resArea * amp).toFixed(2)}x`);
}


// 💡 탭 전환 기능 (hidden 클래스 완벽 제어 버전)
function switchTab(t) {
    // 1. 모든 탭 콘텐츠에서 active를 제거하고 hidden을 추가하여 숨깁니다.
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.classList.add('hidden');
    });

    // 2. 모든 탭 버튼의 하이라이트 스타일을 초기화합니다.
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-zinc-800', 'text-white', 'border', 'border-white/10');
        b.classList.add('text-zinc-500');
    });

    // 3. 선택된 탭 콘텐츠만 hidden을 제거하고 active를 넣어 화면에 보여줍니다.
    const targetContent = document.getElementById('content-' + t);
    if (targetContent) {
        targetContent.classList.remove('hidden');
        targetContent.classList.add('active');
    }

    // 4. 선택된 탭 버튼을 하이라이트합니다.
    const activeBtn = document.getElementById('tab-' + t);
    if (activeBtn) { 
        activeBtn.classList.add('bg-zinc-800', 'text-white', 'border', 'border-white/10');
        activeBtn.classList.remove('text-zinc-500');
    }
}

// --- 외부 버프 동적 UI 생성 및 하이브리드 제어 헬퍼 ---
function createBuffCheckboxHTML(type, name, desc, flatAtkValue = 0) {
    const label = document.createElement('label');
    label.className = "flex items-center justify-between p-2 rounded bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/60 transition-all cursor-pointer";
    
    // ID로 사용할 수 있도록 공백을 하이픈으로 치환
    const idSafe = name.replace(/\s+/g, '-');
    const checkboxId = `buff-${type}-${idSafe}`;
    const inputId = `input-buff-${type}-${idSafe}`;

    let rightControlHTML = '';
    if (flatAtkValue > 0) {
        // 🎯 깡공 수치가 있는 버프 (예: 파티원 버프 중 일부) -> 수치 커스텀 입력칸 + 체크박스 조합
        rightControlHTML = `
            <div class="flex items-center gap-1.5" onclick="event.stopPropagation();">
                <input type="number" id="${inputId}" placeholder="${flatAtkValue}" oninput="calculate()"
                    class="w-12 text-center text-xs bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[#deff9a] focus:outline-none focus:border-[#deff9a]/50">
                <input type="checkbox" id="${checkboxId}" onchange="toggleBuffInput('${checkboxId}', '${inputId}')"
                    class="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#deff9a] focus:ring-0 focus:ring-offset-0 accent-[#deff9a]">
            </div>
        `;
    } else {
        // 🎯 일반 버프 -> 깔끔한 순수 체크박스만 배치
        rightControlHTML = `
            <div class="flex items-center">
                <input type="checkbox" id="${checkboxId}" onchange="calculate()"
                    class="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-[#deff9a] focus:ring-0 focus:ring-offset-0 accent-[#deff9a]">
            </div>
        `;
    }

    label.innerHTML = `
        <div class="flex flex-col pr-2">
            <span class="text-xs font-bold text-zinc-200">${name}</span>
            <span class="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">${desc || '설명 없음'}</span>
        </div>
        ${rightControlHTML}
    `;

    return label;
}

/**
 * 하이브리드 버프 체크박스 토글 시 테두리 하이라이트 및 실시간 계산을 동기화합니다.
 */
function toggleBuffInput(checkboxId, inputId) {
    const cb = document.getElementById(checkboxId);
    const input = document.getElementById(inputId);
    if (!cb || !input) return;

    if (cb.checked) {
        input.classList.add('border-[#deff9a]/50');
    } else {
        input.classList.remove('border-[#deff9a]/50');
    }

    // 전역 계산 함수 호출
    if (typeof calculate === 'function') {
        calculate();
    }
}