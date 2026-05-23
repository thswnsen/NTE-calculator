// --- 메인 함수 ---
function calculate() {
    if (!currentCharacter || !fullCharData[currentCharacter]) return;

    const pack = fullCharData[currentCharacter];
    const baseRow = pack[currentCharacter];

    // 1. 초기값 세팅 (캐릭터 기본)
    const ctx = initCtx(baseRow);

    // 2. 단계별 합산
    accumulateGear(ctx, pack);
    accumulateConsole(ctx);
    accumulateSkillAndTrigger(ctx, pack);
    accumulateModules(ctx, pack);
    accumulateExternalBuffs(ctx);

    // 3. 최종 데미지 적용
    renderFinalResults(ctx);
}

// --- 단계별 서브 함수 ---

function initCtx(baseRow) {
    return {
        baseAtk: parseRowFloat(baseRow, 2) + getUIVal('ui-arc-base-atk'),
        atkP: 0, dmg: 0, cr: parseRowFloat(baseRow, 3), cd: parseRowFloat(baseRow, 4),
        shred: 0, ignore: 0, resPen: 0, resShred: 0, flatAtk: 0,
        skillScale: 0, Vulnerable: 0, Multiplier: 0
    };
}

function accumulateGear(ctx, pack) {
    const arcPack = fullArcData[currentArc];
    if (arcPack) {

        //아크 기본옵션 추가
        const b = arcPack[`기본`] || arcPack[currentArcTier];
        if (b) accumulateStats(ctx, b);

        const r = arcPack[`믹싱레벨${currentArcTier}`] || arcPack[currentArcTier];
        const isEnabled = document.getElementById('switch-arc-option')?.checked;
        if (r&&isEnabled) accumulateStats(ctx, r);
    }
    const addStat = (rowKey) => { const r = pack[rowKey]; if (r) accumulateStats(ctx, r); };
    activeAwakeNodes.forEach(n => addStat(`각성${n}`));
    updateAwakeTierUI(3, activeAwakeNodes.size >= 3, () => addStat('돌파3'));
    updateAwakeTierUI(6, activeAwakeNodes.size >= 6, () => addStat('돌파6'));
}

function accumulateConsole(ctx) {
    const conSetType = document.getElementById('console-set-select').value;
    const conPack = fullConsoleData[currentConsole];
    if (conPack && conPack[conSetType]) accumulateStats(ctx, conPack[conSetType]);

    const addConsoleOpt = (type, name) => {
        if (name && fullConsoleData[type] && fullConsoleData[type][name]) {
            accumulateStats(ctx, fullConsoleData[type][name]);
        }
    };
    addConsoleOpt('주옵션', document.getElementById('console-main-opt').value);
    for (let i = 1; i <= 4; i++) {
        addConsoleOpt('부옵션', document.getElementById(`console-sub-${i}`).value);
    }
}

function accumulateSkillAndTrigger(ctx, pack) {
    const skillType = document.querySelector('input[name="skill-select"]:checked').value;
    ctx.skillScale = parseRowFloat(pack[skillType], 14);

    const checkTrigger = (id, skillName) => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked && pack[skillName]) {
            accumulateStats(ctx, pack[skillName]);
        }
    };
    checkTrigger('trigger-vailray', '바일레이스킬');
    checkTrigger('trigger-ultimate', '궁극스킬');
}

function accumulateModules(ctx, pack) {
    ctx.flatAtk += getUIVal('ui-mod-main-flat');
    if (typeof moduleInputMode !== 'undefined' && moduleInputMode === 'direct') {
        ctx.atkP += getUIVal('ui-mod-sub-atk-p');
        ctx.dmg += getUIVal('ui-mod-sub-dmg');
        ctx.cr += getUIVal('ui-mod-sub-cr');
        ctx.cd += getUIVal('ui-mod-sub-cd');
        ctx.flatAtk += getUIVal('ui-mod-sub-flat');
    } else {
        const subPack = (typeof fullModuleData !== 'undefined' && fullModuleData && fullModuleData['부옵션']) ? fullModuleData['부옵션'] : {};
        const getSingleVal = (n, i) => subPack[n] ? parseRowFloat(subPack[n], i) : 0;
        ctx.atkP += getSingleVal('공격력%', 6) * getUIVal('ui-mod-sub-atk-p');
        ctx.dmg += getSingleVal('피해%', 7) * getUIVal('ui-mod-sub-dmg');
        ctx.cr += getSingleVal('치명타확률%', 8) * getUIVal('ui-mod-sub-cr');
        ctx.cd += getSingleVal('치명타데미지%', 9) * getUIVal('ui-mod-sub-cd');
        ctx.flatAtk += getSingleVal('고정공격력', 5) * getUIVal('ui-mod-sub-flat');
    }
    const bonusCountInput = document.getElementById('ui-mod-bonus-count');
    if (bonusCountInput) {
        const count = parseInt(bonusCountInput.value) || 0;
        if (count > 0 && pack['장착보너스']) accumulateStats(ctx, pack['장착보너스'], count);
    }
}

function accumulateExternalBuffs(ctx) {
    if (!fullExternalBuffData) return;
    if (fullExternalBuffData['에스퍼사이클']) {
        Object.keys(fullExternalBuffData['에스퍼사이클']).forEach(name => {
            const checkbox = document.getElementById(`buff-esper-${name}`);
            if (checkbox && checkbox.checked) {
                const r = fullExternalBuffData['에스퍼사이클'][name];
                ctx.cr += parseRowFloat(r, 8);
                ctx.Vulnerable += parseRowFloat(r, 15) / 100;
            }
        });
    }
    if (fullExternalBuffData['콘솔']) {
        Object.keys(fullExternalBuffData['콘솔']).forEach(name => {
            const checkbox = document.getElementById(`buff-console-${name}`);
            if (checkbox && checkbox.checked) accumulateStats(ctx, fullExternalBuffData['콘솔'][name]);
        });
    }
    if (fullExternalBuffData['파티원']) {
        Object.keys(fullExternalBuffData['파티원']).forEach(name => {
            const checkbox = document.getElementById(`buff-party-${name}`);
            if (checkbox && checkbox.checked) {
                const r = fullExternalBuffData['파티원'][name];
                const customInput = document.getElementById(`input-buff-party-${name}`);
                if (customInput) {
                    ctx.flatAtk += parseFloat(customInput.value !== "" ? customInput.value : customInput.placeholder);
                } else {
                    accumulateStats(ctx, r);
                }
            }
        });
    }
}