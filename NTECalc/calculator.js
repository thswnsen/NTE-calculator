function calculate() {
    if (!currentCharacter || !fullCharData[currentCharacter]) return;

    // 1. 초기값 세팅 (캐릭터 기본)
    const pack = fullCharData[currentCharacter];
    const baseRow = pack[currentCharacter];
    const ctx = {
        baseAtk: parseRowFloat(baseRow, 2) + getUIVal('ui-arc-base-atk'),
        atkP: 0, dmg: 0, cr: parseRowFloat(baseRow, 3), cd: parseRowFloat(baseRow, 4),
        shred: 0, ignore: 0, resPen: 0, resShred: 0, flatAtk: 0, // ui-mod-flat 자리 초기화 (아래에서 모듈 주옵션 합산 처리)
        skillScale: 0, Vulnerable: 0, Multiplier: 0
    };

    // 2. 아크 수치 합산
    const arcPack = fullArcData[currentArc];
    if (arcPack) {
        const r = arcPack[`믹싱레벨${currentArcTier}`] || arcPack[currentArcTier];
        if (r) {
            accumulateStats(ctx, r);
        }
    }

    // 3. 각성/돌파 수치 합산 및 UI 업데이트
    const addStat = (rowKey) => {
        const r = pack[rowKey];
        if (r) {
            accumulateStats(ctx, r);
        }
    };

    activeAwakeNodes.forEach(n => addStat(`각성${n}`));
    updateAwakeTierUI(3, activeAwakeNodes.size >= 3, () => addStat('돌파3'));
    updateAwakeTierUI(6, activeAwakeNodes.size >= 6, () => addStat('돌파6'));

    // 4. 콘솔 수치 합산 
    const conSetType = document.getElementById('console-set-select').value;
    const conPack = fullConsoleData[currentConsole];
    if (conPack && conPack[conSetType]) {
        const r = conPack[conSetType];
        accumulateStats(ctx, r);
    }
    const addConsoleOpt = (type, name) => {
        if (name && fullConsoleData[type] && fullConsoleData[type][name]) {
            const r = fullConsoleData[type][name];
           accumulateStats(ctx, r);
        }
    };

    // 콘솔 주옵션 적용
    const mainOptVal = document.getElementById('console-main-opt').value;
    addConsoleOpt('주옵션', mainOptVal);

    // 콘솔 부옵션 4개 적용
    for (let i = 1; i <= 4; i++) {
        const subOptVal = document.getElementById(`console-sub-${i}`).value;
        addConsoleOpt('부옵션', subOptVal);
    }

    // 5. 스킬 및 자가 버프
    const skillType = document.querySelector('input[name="skill-select"]:checked').value;
    ctx.skillScale = parseRowFloat(pack[skillType], 14);

    const applyTrigger = (id, key, arcBonusIdx) => {
        if (document.getElementById(id).checked && pack[key]) {
            addStat(key);
            if (arcPack) {
                const r = arcPack[`믹싱레벨${currentArcTier}`] || arcPack[currentArcTier];
                if (r) accumulateStats(ctx, r);
            }
        }
    };
    applyTrigger('trigger-vailray', '바일레이스킬', 13);
    applyTrigger('trigger-ultimate', '궁극스킬', 14);


    // 6-A. 모듈 주옵션(고정 공격력) 합산
    ctx.flatAtk += getUIVal('ui-mod-main-flat');

    // 6-B. 모듈 부옵션 연산 (스위치 모드 분기 처리)
    if (typeof moduleInputMode !== 'undefined' && moduleInputMode === 'direct') {
        // [직접 입력 모드] 유저가 칸에 적어놓은 퍼센트 수치 그대로 가산
        ctx.atkP += getUIVal('ui-mod-sub-atk-p');
        ctx.dmg += getUIVal('ui-mod-sub-dmg');
        ctx.cr += getUIVal('ui-mod-sub-cr');
        ctx.cd += getUIVal('ui-mod-sub-cd');
        ctx.flatAtk += getUIVal('ui-mod-sub-flat');
    } else {
        // [개수 입력 모드] (시트 데이터 상단 안전 참조) * (입력 개수)
        const subPack = (typeof fullModuleData !== 'undefined' && fullModuleData && fullModuleData['부옵션']) ? fullModuleData['부옵션'] : {};

        const getSingleVal = (sheetName, cellIdx) => {
            return subPack[sheetName] ? parseRowFloat(subPack[sheetName], cellIdx) : 0;
        };

        // 개당 계수 * 세팅한 개수
        ctx.atkP += getSingleVal('공격력%', 6) * getUIVal('ui-mod-sub-atk-p');
        ctx.dmg += getSingleVal('피해%', 7) * getUIVal('ui-mod-sub-dmg');
        ctx.cr += getSingleVal('치명타확률%', 8) * getUIVal('ui-mod-sub-cr');
        ctx.cd += getSingleVal('치명타데미지%', 9) * getUIVal('ui-mod-sub-cd');
        ctx.flatAtk += getSingleVal('고정공격력', 5) * getUIVal('ui-mod-sub-flat');
    }

    // --- 캐릭터별 모듈 장착 보너스 연산 ---
    const bonusCountInput = document.getElementById('ui-mod-bonus-count');
    if (bonusCountInput) {
        const count = parseInt(bonusCountInput.value) || 0;
        if (count > 0) {
            const charPack = fullCharData ? fullCharData[currentCharacter] : null;

            // 🎯 구조 보정: charPack['장착보너스']는 Object.values를 쓸 필요 없이 '그대로가 데이터 배열'입니다.
            if (charPack && charPack['장착보너스']) {
                const bonusRow = charPack['장착보너스'];
                

                accumulateStats(ctx, bonusRow,count);
            }
        }
    }

    
      //외부 버프 (콘솔 / 파티원) 수치 합산
    if (fullExternalBuffData) {
        // 🔥 1. 에스퍼사이클 외부 버프 순회 
        if (fullExternalBuffData['에스퍼사이클']) {
            Object.keys(fullExternalBuffData['에스퍼사이클']).forEach(name => {
                // UI 생성 시 'esper' 접두사를 썼으므로 ext-esper-${name}으로 호출합니다.
                const checkbox = document.getElementById(`buff-esper-${name}`);
                if (checkbox && checkbox.checked) {
                    const r = fullExternalBuffData['에스퍼사이클'][name];

                    // 에스퍼사이클은 오직 치명타 확률(8번)과 취약 배율(15번)만 처리
                    ctx.cr += parseRowFloat(r, 8);
                    ctx.Vulnerable += parseRowFloat(r, 15) / 100; // 수치 비율 변환 (ex: 20 -> 0.20)
                }
            });
        }

        // 2. 콘솔 외부 버프 순회
        if (fullExternalBuffData['콘솔']) {
            Object.keys(fullExternalBuffData['콘솔']).forEach(name => {
                const checkbox = document.getElementById(`buff-console-${name}`);
                if (checkbox && checkbox.checked) {
                    const r = fullExternalBuffData['콘솔'][name];

                accumulateStats(ctx, r);
                }
            });
        }

        // 3. 파티원 외부 버프 순회
        if (fullExternalBuffData['파티원']) {
            Object.keys(fullExternalBuffData['파티원']).forEach(name => {
                const checkbox = document.getElementById(`buff-party-${name}`);

                // 🎯 켜져 있을 때만 스탯 누적 돌입
                if (checkbox && checkbox.checked) {
                    const r = fullExternalBuffData['파티원'][name];
                    const customInput = document.getElementById(`input-buff-party-${name}`);

                    if (customInput) {
                        //  인풋박스가 있을 경우 해당 값을 반영.
                        const inputValue = customInput.value !== "" ? customInput.value : customInput.placeholder;
                        ctx.flatAtk += parseFloat(inputValue);
                        //accumulateStats(ctx, r);
                  
                    } else {
                        accumulateStats(ctx, r);
                    }

                }
            });
        }
    }

      // 7. 최종 데미지 공식 적용
    renderFinalResults(ctx);
}