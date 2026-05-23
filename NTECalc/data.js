/* data.js */
const SHEET_CHAR_URL = 'https://docs.google.com/spreadsheets/d/12MwyBSL3awsmN3_gzcUjfSu7eUBN4yfjy0wZT0s0cck/export?format=csv&gid=0'; 
const SHEET_ARC_URL  = 'https://docs.google.com/spreadsheets/d/12MwyBSL3awsmN3_gzcUjfSu7eUBN4yfjy0wZT0s0cck/export?format=csv&gid=364781019';
const SHEET_CONSOLE_URL = 'https://docs.google.com/spreadsheets/d/12MwyBSL3awsmN3_gzcUjfSu7eUBN4yfjy0wZT0s0cck/export?format=csv&gid=549944236';
const SHEET_MODULE_URL = 'https://docs.google.com/spreadsheets/d/12MwyBSL3awsmN3_gzcUjfSu7eUBN4yfjy0wZT0s0cck/export?format=csv&gid=366006077';
const SHEET_BUFF_URL = 'https://docs.google.com/spreadsheets/d/12MwyBSL3awsmN3_gzcUjfSu7eUBN4yfjy0wZT0s0cck/export?format=csv&gid=196940550';
const SHEET_ENEMY_URL = 'https://docs.google.com/spreadsheets/d/12MwyBSL3awsmN3_gzcUjfSu7eUBN4yfjy0wZT0s0cck/export?format=csv&gid=2053434991';

const SHEET_IDX = {
    KEY_PRIMARY: 0,   // A열 (캐릭터명 등)
    KEY_SECONDARY: 1, // B열 (스킬명, 조건 등)
    BASE_ATK: 2,      // C열 기본 공격력
    BASE_CR: 3,       // D열 기본 치확
    BASE_CD: 4,       // E열 기본 치피
    FLAT_ATK: 5,      // F열 깡공 증가값
    DESC: 17          // R열 통문장 설명 (17번 열)
};


const CHAR_OFFLINE_BACKUP = {
    "기본 테스트용 캐릭터": {
        "기본 테스트용 캐릭터": ["기본 테스트용 캐릭터", "기본 테스트용 캐릭터", "1200", "5", "50"], 
        "일반공격": ["기본 테스트용 캐릭터", "일반공격", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "100", "물리 기본 일반 타격"],
        "바일레이스킬": ["기본 테스트용 캐릭터", "바일레이스킬", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "250", "테스트용 바일레이 스킬"],
        "궁극스킬": ["기본 테스트용 캐릭터", "궁극스킬", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "500", "테스트용 궁극 타격"]
    }
};

const ARC_OFFLINE_BACKUP = {
    "기본형 테스트 아크": {
        "믹싱레벨1": ["기본형 테스트 아크", "믹싱레벨1", "500", "0", "0", "0", "10", "0", "0", "0", "0", "0", "0", "0", "0", "공격력+15%\n「바이레일 스킬」..."],
        "믹싱레벨5": ["기본형 테스트 아크", "믹싱레벨5", "600", "0", "0", "0", "20", "0", "0", "0", "0", "0", "0", "0", "0", "최대 돌파 효과"]
    }
};

const CONSOLE_OFFLINE_BACKUP= {
    "기본형 콘솔 아크": {
        "2세트": ["기본형 테스트 콘솔", "2세트", "500", "0", "0", "0", "10", "0", "0", "0", "0", "0", "0", "0", "0", "공격력+15%\n「바이레일 스킬」..."],
        "4세트": ["기본형 테스트 콘솔", "4세트", "600", "0", "0", "0", "20", "0", "0", "0", "0", "0", "0", "0", "0", "최대 돌파 효과"]
    }
};