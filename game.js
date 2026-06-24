"use strict";

const LOCAL_VOCABULARY_PATH = "assets/data/vocabulary.csv";
const QUESTIONS_PER_STAGE = 5;
const MAX_VISIBLE_STAGES = 6;
const STAGE_MAIN_CHAPTER_QUESTIONS = 3;
const ENCOUNTERS_PER_ACT = 5;
const RUN_ACTS = [
  { name: "幼體區", stage: "baby", rewardScale: 1 },
  { name: "成長體區", stage: "rookie", rewardScale: 1.35 },
  { name: "完全體區", stage: "ultimate", rewardScale: 1.75 }
];
const ENCOUNTERS_PER_RUN = ENCOUNTERS_PER_ACT * RUN_ACTS.length;
const NORMAL_ENCOUNTERS_PER_RUN = ENCOUNTERS_PER_RUN - 1;
const REVIEW_ENCOUNTERS_PER_RUN = 3;
const RECENT_WORD_LIMIT = 72;
const RECENT_WORD_PENALTY = 10;
const MONSTER_HP_BASE = 96;
const PLAYER_HP_MAX = 3;
const WRONG_DAMAGE = 1;
const LETTER_DAMAGE_SHARE = 0.58;
const SPEECH_LANG = "en-US";
const SAVE_KEY = "spellQuestProgressV1";
const REGION_UNLOCK_SEEN_TARGET = 20;
const REGION_UNLOCK_STEADY_TARGET = 8;
const REGION_INTRO_DURATION_MS = 2200;
const REGION_INTRO_TO_BATTLE_DELAY_MS = 2380;
const ENCOUNTER_SCOUT_DELAY_MS = 1040;
const BOSS_SCOUT_DELAY_MS = 1380;
const ADVANCE_START_DELAY_MS = 680;
const ADVANCE_WALK_DURATION_MS = 2850;
const ADVANCE_CUT_LEAD_MS = 480;
const ADVANCE_CUT_DURATION_MS = 760;
const ADVANCE_CUT_START_DELAY_MS = ADVANCE_START_DELAY_MS + ADVANCE_WALK_DURATION_MS - ADVANCE_CUT_LEAD_MS;
const ADVANCE_NEXT_ENCOUNTER_DELAY_MS = ADVANCE_CUT_START_DELAY_MS + 330;
const ADVANCE_BOSS_CLEAR_DELAY_MS = ADVANCE_CUT_START_DELAY_MS + 470;
const ADVANCE_STEP_TIMES_MS = [120, 560, 1000, 1440, 1880, 2320];
const ENEMY_ATTACK_DURATION_MS = 1040;
const ENEMY_ATTACK_IMPACT_DELAY_MS = 560;
const ENEMY_ATTACK_RECOVER_MS = 360;
const QUESTION_POSE_DURATION_MS = 820;
const MONSTER_LEVEL_MAX = 10;
const MONSTER_STAR_MAX = 3;
const MONSTER_EXP_PER_LEVEL = 100;
const MONSTER_SHARDS_PER_STAR = 3;
const EVOLUTION_SUPPORTED_COUNT = 30;
const EVOLUTION_STAGES = ["baby", "rookie", "ultimate"];
const EVOLUTION_STAGE_LABELS = {
  baby: "幼年期",
  rookie: "成長期",
  ultimate: "完全體"
};
const MONSTER_ACTION_PACK_COUNT = 30;
const MONSTER_ACTIONS = ["idle-1", "idle-2", "entrance", "hit", "defeat", "capture", "evolution"];

const fallbackRows = [
  { id: "sample_apple", enabled: "TRUE", pack: "sample", chapter: "l14", type: "word", level: "1", en: "apple", zh: "蘋果", tags: "thing", note: "" },
  { id: "sample_look_out", enabled: "TRUE", pack: "sample", chapter: "l07", type: "phrase", level: "1", en: "look out", zh: "小心", tags: "action", note: "" },
  { id: "sample_a_an", enabled: "TRUE", pack: "sample", chapter: "l13", type: "pattern", level: "1", en: "a / an", zh: "一個", tags: "word", note: "" },
  { id: "sample_pe_teacher", enabled: "TRUE", pack: "sample", chapter: "l27", type: "word", level: "1", en: "P.E. teacher", zh: "體育老師", tags: "school", note: "" },
  { id: "sample_letter", enabled: "TRUE", pack: "sample", chapter: "l25", type: "word", level: "1", en: "letter", zh: "信", tags: "thing", note: "" },
  { id: "sample_meet", enabled: "TRUE", pack: "sample", chapter: "l01", type: "word", level: "1", en: "meet", zh: "認識；相遇", tags: "action", note: "" }
];

const monsterNames = [
  "Sprout Fang", "Pudding Spark", "Bubble Horn", "Pebble Cub", "Moon Puff",
  "Wind Whisk", "Candy Imp", "Copper Bot", "Cactus Nib", "Cloud Munch",
  "Lava Tot", "Crystal Pip", "Shell Bean", "Mushroom Pop", "Mango Drake",
  "Gear Slime", "Owlbit", "Beetle Bolt", "Fox Ember", "Turtle Tune",
  "Star Noodle", "Snow Button", "Flower Wisp", "Bell Hopper", "Book Mimic",
  "Ghost Mallow", "Lantern Kip", "Sand Snip", "Thunder Pea", "Rainbow Byte"
];

const monsterCatalog = [
  { zh: { baby: "芽牙獸", rookie: "森牙獸", ultimate: "翠牙戰獸" }, theme: "草 / 牙" },
  { zh: { baby: "布丁電獸", rookie: "焦糖電獸", ultimate: "雷霆布丁獸" }, theme: "甜點 / 電氣" },
  { zh: { baby: "泡角獸", rookie: "浪角獸", ultimate: "海鳴角獸" }, theme: "水泡 / 角" },
  { zh: { baby: "小岩獸", rookie: "岩甲獸", ultimate: "巨岩鎧獸" }, theme: "岩石 / 鎧甲" },
  { zh: { baby: "月絨獸", rookie: "月影獸", ultimate: "銀月幻獸" }, theme: "月亮 / 柔軟" },
  { zh: { baby: "風鬚獸", rookie: "旋鬚獸", ultimate: "暴風鬚獸" }, theme: "風 / 觸鬚" },
  { zh: { baby: "糖魔獸", rookie: "甜牙魔獸", ultimate: "糖獄魔王獸" }, theme: "糖果 / 小惡魔" },
  { zh: { baby: "銅機獸", rookie: "齒輪機獸", ultimate: "鋼銅巨機獸" }, theme: "金屬 / 機械" },
  { zh: { baby: "仙刺獸", rookie: "荒刺獸", ultimate: "沙漠棘王獸" }, theme: "仙人掌 / 尖刺" },
  { zh: { baby: "雲吞獸", rookie: "霧吞獸", ultimate: "積雨吞天獸" }, theme: "雲 / 吞食" },
  { zh: { baby: "熔幼獸", rookie: "熔爪獸", ultimate: "炎岩暴獸" }, theme: "熔岩 / 火" },
  { zh: { baby: "晶芽獸", rookie: "冰晶獸", ultimate: "極光晶獸" }, theme: "水晶 / 冰" },
  { zh: { baby: "殼豆獸", rookie: "甲殼豆獸", ultimate: "鐵殼守衛獸" }, theme: "貝殼 / 豆子" },
  { zh: { baby: "蘑菇泡獸", rookie: "孢子泡獸", ultimate: "毒菇爆裂獸" }, theme: "蘑菇 / 孢子" },
  { zh: { baby: "芒果龍獸", rookie: "果翼龍獸", ultimate: "金芒龍王獸" }, theme: "芒果 / 龍" },
  { zh: { baby: "齒輪黏獸", rookie: "機油黏獸", ultimate: "核心黏械獸" }, theme: "齒輪 / 黏液" },
  { zh: { baby: "夜晶鴞獸", rookie: "智眼鴞獸", ultimate: "星瞳賢鴞獸" }, theme: "夜鳥 / 智慧" },
  { zh: { baby: "甲雷獸", rookie: "鋼甲雷獸", ultimate: "轟雷甲王獸" }, theme: "甲蟲 / 雷" },
  { zh: { baby: "狐焰獸", rookie: "炎狐獸", ultimate: "紅蓮狐王獸" }, theme: "狐 / 火焰" },
  { zh: { baby: "龜音獸", rookie: "旋律龜獸", ultimate: "交響龜甲獸" }, theme: "龜 / 音樂" },
  { zh: { baby: "星麵獸", rookie: "星河麵獸", ultimate: "銀河麵龍獸" }, theme: "星星 / 麵條" },
  { zh: { baby: "雪扣獸", rookie: "冰扣獸", ultimate: "白霜扣衛獸" }, theme: "雪 / 扣子" },
  { zh: { baby: "花靈獸", rookie: "花舞靈獸", ultimate: "萬花靈后獸" }, theme: "花 / 靈氣" },
  { zh: { baby: "鈴跳獸", rookie: "響鈴跳獸", ultimate: "金鈴躍王獸" }, theme: "鈴鐺 / 跳躍" },
  { zh: { baby: "書箱獸", rookie: "魔書箱獸", ultimate: "禁書寶庫獸" }, theme: "書 / 寶箱" },
  { zh: { baby: "幽棉獸", rookie: "影棉獸", ultimate: "幽影棉王獸" }, theme: "幽靈 / 棉花" },
  { zh: { baby: "燈仔獸", rookie: "輝燈獸", ultimate: "星燈守護獸" }, theme: "燈籠 / 守護" },
  { zh: { baby: "沙鉗獸", rookie: "砂鉗獸", ultimate: "流沙鉗皇獸" }, theme: "沙 / 鉗子" },
  { zh: { baby: "雷豆獸", rookie: "電豆獸", ultimate: "轟雷豆將獸" }, theme: "雷 / 豆子" },
  { zh: { baby: "虹碼獸", rookie: "光碼獸", ultimate: "虹界終端獸" }, theme: "彩虹 / 數位" }
];

const MONSTER_GREETINGS = [
  "來挑戰我吧！",
  "你會拼這個字嗎？",
  "準備好了嗎？",
  "這題可沒那麼簡單！",
  "讓我看看你的實力！"
];

const BOSS_GREETINGS = [
  "最後考驗來了！",
  "讓我看看真正的實力！",
  "打敗我才算通過！",
  "完全體挑戰開始！"
];

const MONSTER_CORRECT_BANTER = [
  "剛剛表現不錯嘛！",
  "這一下有打中！",
  "你記得很快耶！",
  "好，下一題還能跟上嗎？",
  "有進步，我感覺到了！"
];

const BOSS_CORRECT_BANTER = [
  "不錯，但還沒結束！",
  "這種程度還打不倒我！",
  "有資格挑戰下一題了！",
  "很好，再讓我看看！"
];

const MONSTER_RETRY_BANTER = [
  "再給你一次機會！",
  "慢慢看清楚，再試一次。",
  "這題還沒結束喔！",
  "記住剛剛的拼法，再來！",
  "別急，下一次會更準。"
];

const BOSS_RETRY_BANTER = [
  "冷靜點，再挑戰一次！",
  "真正的勇者會記住錯誤。",
  "我再給你一次機會！",
  "看清楚拼法，再攻過來！"
];

const REGIONS = [
  { name: "陽光草原", range: "Route 01", minChapter: 1, maxChapter: 5, monsterStart: 0, icon: "✿", theme: "grassland", description: "明亮草地與短單字，適合熱身出發。" },
  { name: "糖果森林", range: "Route 02", minChapter: 6, maxChapter: 10, monsterStart: 6, icon: "●", theme: "forest", description: "蘑菇、糖果色植物與日常片語交錯出現。" },
  { name: "水晶冰洞", range: "Route 03", minChapter: 11, maxChapter: 15, monsterStart: 12, icon: "◆", theme: "ice", description: "冰晶洞窟會帶來更多容易混淆的拼字。" },
  { name: "機械都市", range: "Route 04", minChapter: 16, maxChapter: 20, monsterStart: 18, icon: "▣", theme: "machine", description: "霓虹平台與較長單字，節奏更像正式戰鬥。" },
  { name: "星界遺跡", range: "Route 05", minChapter: 21, maxChapter: Infinity, monsterStart: 24, icon: "✹", theme: "astral", description: "終盤星光遺跡，適合挑戰 Boss 與高難度複習。" }
];

const BGM_BASE_PATH = "assets/audio/bgm/";
const BGM_VOLUME = 0.26;
const BGM_FADE_MS = 720;
const BGM_TRACKS = {
  title: { id: "title", file: "bgm-01-title-theme.mp3", label: "首頁主題曲" },
  study: { id: "study", file: "bgm-02-study-manual.mp3", label: "學習手冊" },
  grassland: { id: "grassland", file: "bgm-03-sunny-grassland.mp3", label: "陽光草原" },
  forest: { id: "forest", file: "bgm-04-candy-forest.mp3", label: "糖果森林" },
  ice: { id: "ice", file: "bgm-05-crystal-ice-cave.mp3", label: "水晶冰洞" },
  machine: { id: "machine", file: "bgm-06-mechanical-city.mp3", label: "機械都市" },
  astral: { id: "astral", file: "bgm-07-astral-ruins.mp3", label: "星界遺跡" },
  boss: { id: "boss", file: "bgm-08-boss-battle.mp3", label: "Boss 戰" }
};
const REGION_BGM_TRACKS = {
  grassland: "grassland",
  forest: "forest",
  ice: "ice",
  machine: "machine",
  astral: "astral"
};

const REGION_SCENES = {
  grassland: {
    background: "regions/bg-region-grassland.png",
    sky: "#69b8f2",
    warm: "rgba(190, 255, 150, 0.1)",
    tint: "rgba(64, 185, 86, 0.08)",
    accent: "rgba(255, 242, 124, 0.32)",
    particle: "dust",
    label: "Sunny Grassland"
  },
  forest: {
    background: "regions/bg-region-forest.png",
    sky: "#8e62d7",
    warm: "rgba(255, 136, 211, 0.14)",
    tint: "rgba(119, 40, 151, 0.12)",
    accent: "rgba(255, 195, 90, 0.36)",
    particle: "ember",
    label: "Candy Forest"
  },
  ice: {
    background: "regions/bg-region-ice.png",
    sky: "#77b8ee",
    warm: "rgba(122, 224, 255, 0.2)",
    tint: "rgba(91, 152, 255, 0.14)",
    accent: "rgba(170, 239, 255, 0.45)",
    particle: "crystal",
    label: "Crystal Ice Cave"
  },
  machine: {
    background: "regions/bg-region-machine.png",
    sky: "#162b4f",
    warm: "rgba(46, 236, 255, 0.12)",
    tint: "rgba(8, 20, 44, 0.16)",
    accent: "rgba(64, 231, 255, 0.4)",
    particle: "storm",
    label: "Neon Machine City"
  },
  astral: {
    background: "regions/bg-region-astral.png",
    sky: "#20115b",
    warm: "rgba(178, 100, 255, 0.16)",
    tint: "rgba(27, 15, 78, 0.18)",
    accent: "rgba(255, 212, 112, 0.42)",
    particle: "star",
    label: "Astral Ruins"
  }
};

const els = {
  canvas: document.getElementById("dungeonCanvas"),
  dungeonFrame: document.getElementById("dungeonFrame"),
  monster: document.getElementById("monster"),
  monsterSprite: document.getElementById("monsterSprite"),
  slash: document.getElementById("slash"),
  impactBurst: document.getElementById("impactBurst"),
  projectileLeft: document.getElementById("projectileLeft"),
  projectileRight: document.getElementById("projectileRight"),
  muzzleLeft: document.getElementById("muzzleLeft"),
  muzzleRight: document.getElementById("muzzleRight"),
  speedLines: document.getElementById("speedLines"),
  damageText: document.getElementById("damageText"),
  stageBanner: document.getElementById("stageBanner"),
  regionIntro: document.getElementById("regionIntro"),
  regionIntroArt: document.getElementById("regionIntroArt"),
  regionIntroRoute: document.getElementById("regionIntroRoute"),
  regionIntroName: document.getElementById("regionIntroName"),
  regionIntroDetail: document.getElementById("regionIntroDetail"),
  scoutOverlay: document.getElementById("scoutOverlay"),
  scoutTitle: document.getElementById("scoutTitle"),
  scoutSubtitle: document.getElementById("scoutSubtitle"),
  scoutList: document.getElementById("scoutList"),
  scoutSkipButton: document.getElementById("scoutSkipButton"),
  scoutStartButton: document.getElementById("scoutStartButton"),
  answerCallout: document.getElementById("answerCallout"),
  answerCalloutSpeaker: document.getElementById("answerCalloutSpeaker"),
  answerCalloutText: document.getElementById("answerCalloutText"),
  rewardPop: document.getElementById("rewardPop"),
  rewardTitle: document.getElementById("rewardTitle"),
  rewardDetail: document.getElementById("rewardDetail"),
  captureCard: document.getElementById("captureCard"),
  captureCardImage: document.getElementById("captureCardImage"),
  captureCardName: document.getElementById("captureCardName"),
  clearCinematic: document.getElementById("clearCinematic"),
  clearKicker: document.getElementById("clearKicker"),
  clearTitle: document.getElementById("clearTitle"),
  clearRegion: document.getElementById("clearRegion"),
  clearDetail: document.getElementById("clearDetail"),
  clearProgress: document.getElementById("clearProgress"),
  hpFill: document.getElementById("hpFill"),
  playerHpFill: document.getElementById("playerHpFill"),
  monsterName: document.getElementById("monsterName"),
  questionProgress: document.getElementById("questionProgress"),
  stageLabel: document.getElementById("stageLabel"),
  comboLabel: document.getElementById("comboLabel"),
  sourceStatus: document.getElementById("sourceStatus"),
  questionType: document.getElementById("questionType"),
  zhPrompt: document.getElementById("zhPrompt"),
  chapterLabel: document.getElementById("chapterLabel"),
  tagLabel: document.getElementById("tagLabel"),
  speakButton: document.getElementById("speakButton"),
  skipButton: document.getElementById("skipButton"),
  reloadButton: document.getElementById("reloadButton"),
  hudMusicButton: document.getElementById("hudMusicButton"),
  homeButton: document.getElementById("homeButton"),
  dexButton: document.getElementById("dexButton"),
  dexCloseButton: document.getElementById("dexCloseButton"),
  dexOverlay: document.getElementById("dexOverlay"),
  dexGrid: document.getElementById("dexGrid"),
  dexSummary: document.getElementById("dexSummary"),
  trainingButton: document.getElementById("trainingButton"),
  homeDexButton: document.getElementById("homeDexButton"),
  monsterTestButton: document.getElementById("monsterTestButton"),
  monsterTestPanel: document.getElementById("monsterTestPanel"),
  testMonsterStatus: document.getElementById("testMonsterStatus"),
  testMonsterSelect: document.getElementById("testMonsterSelect"),
  testPrevMonsterButton: document.getElementById("testPrevMonsterButton"),
  testNextMonsterButton: document.getElementById("testNextMonsterButton"),
  testBabyButton: document.getElementById("testBabyButton"),
  testRookieButton: document.getElementById("testRookieButton"),
  testUltimateButton: document.getElementById("testUltimateButton"),
  testIntroButton: document.getElementById("testIntroButton"),
  testHitButton: document.getElementById("testHitButton"),
  testDefeatButton: document.getElementById("testDefeatButton"),
  testCaptureButton: document.getElementById("testCaptureButton"),
  testEvolutionButton: document.getElementById("testEvolutionButton"),
  testExitButton: document.getElementById("testExitButton"),
  trainingOverlay: document.getElementById("trainingOverlay"),
  trainingCloseButton: document.getElementById("trainingCloseButton"),
  trainingStats: document.getElementById("trainingStats"),
  trainingList: document.getElementById("trainingList"),
  allReviewButton: document.getElementById("allReviewButton"),
  wrongPracticeButton: document.getElementById("wrongPracticeButton"),
  weakPracticeButton: document.getElementById("weakPracticeButton"),
  masteredPracticeButton: document.getElementById("masteredPracticeButton"),
  runSummaryOverlay: document.getElementById("runSummaryOverlay"),
  runSummaryStats: document.getElementById("runSummaryStats"),
  runSummaryTitle: document.getElementById("runSummaryTitle"),
  runSummaryText: document.getElementById("runSummaryText"),
  summaryMedal: document.getElementById("summaryMedal"),
  summaryRankTitle: document.getElementById("summaryRankTitle"),
  summaryRankDetail: document.getElementById("summaryRankDetail"),
  captureShowcase: document.getElementById("captureShowcase"),
  wrongReview: document.getElementById("wrongReview"),
  wrongList: document.getElementById("wrongList"),
  nextRunButton: document.getElementById("nextRunButton"),
  retryWrongButton: document.getElementById("retryWrongButton"),
  summaryDexButton: document.getElementById("summaryDexButton"),
  summaryHomeButton: document.getElementById("summaryHomeButton"),
  answerDisplay: document.getElementById("answerDisplay"),
  letterBank: document.getElementById("letterBank"),
  feedbackLine: document.getElementById("feedbackLine"),
  startOverlay: document.getElementById("startOverlay"),
  startButton: document.getElementById("startButton"),
  musicButton: document.getElementById("musicButton"),
  scoutToggleButton: document.getElementById("scoutToggleButton"),
  regionMapOverlay: document.getElementById("regionMapOverlay"),
  regionMapCloseButton: document.getElementById("regionMapCloseButton"),
  regionMapBackButton: document.getElementById("regionMapBackButton"),
  regionMapStartButton: document.getElementById("regionMapStartButton"),
  regionMapGrid: document.getElementById("regionMapGrid"),
  regionMapSummary: document.getElementById("regionMapSummary"),
  regionCard: document.getElementById("regionCard"),
  regionCardVisual: document.getElementById("regionCardVisual"),
  regionName: document.getElementById("regionName"),
  regionMeta: document.getElementById("regionMeta"),
  regionProgress: document.getElementById("regionProgress"),
  battleFlow: document.getElementById("battleFlow"),
  rewardHighlights: document.getElementById("rewardHighlights"),
  startTitle: document.getElementById("startTitle"),
  loadSummary: document.getElementById("loadSummary"),
  stageTrack: document.getElementById("stageTrack"),
  masteryLabel: document.getElementById("masteryLabel"),
  captureLabel: document.getElementById("captureLabel")
};

const ctx = els.canvas.getContext("2d");
if (ctx) {
  els.dungeonFrame.classList.add("canvas-renderer");
}
document.body.classList.add("battle-integrated-ui");

const battleImages = new Map();
const battleRenderState = {
  monsterIndex: 0,
  boss: false,
  evolutionStage: "baby",
  attack: null,
  advanceStart: 0,
  playerHitStart: 0,
  enemyAttackStart: 0,
  defeatStart: 0,
  encounterIntroStart: 0,
  bossIntroStart: 0,
  questionPoseStart: 0,
  monsterVisible: false
};

function getLayerAssetPath(name) {
  const embedded = window.SPELL_QUEST_ASSETS?.layers?.[name];
  return embedded || `assets/layers/${name}`;
}

function getCurrentRegionScene() {
  const index = progress ? getCurrentRegionIndex() : 0;
  const theme = REGIONS[index]?.theme || "grassland";
  return REGION_SCENES[theme] || REGION_SCENES.grassland;
}

function getRegionScene(index = getCurrentRegionIndex()) {
  const theme = REGIONS[index]?.theme || "grassland";
  return REGION_SCENES[theme] || REGION_SCENES.grassland;
}

function getRegionBackgroundPath(index = getCurrentRegionIndex()) {
  const scene = getRegionScene(index);
  return getLayerAssetPath(scene.background || "bg-clean.png");
}

function getBattleImage(src) {
  if (!src) {
    return null;
  }
  if (battleImages.has(src)) {
    return battleImages.get(src);
  }
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  battleImages.set(src, image);
  return image;
}

function isImageReady(image) {
  return image && image.complete && image.naturalWidth > 0;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

function getTimedPulse(start, duration, time = performance.now()) {
  if (!start) {
    return 0;
  }
  const progress = clamp01((time - start) / duration);
  if (progress >= 1) {
    return 0;
  }
  return Math.sin(progress * Math.PI);
}

function getAdvanceMotion(time = performance.now()) {
  const start = battleRenderState.advanceStart;
  if (!start) {
    return {
      active: false,
      progress: 0,
      pulse: 0,
      forward: 0,
      travel: 0,
      step: 0,
      sway: 0,
      shake: 0
    };
  }

  const progress = clamp01((time - start) / ADVANCE_WALK_DURATION_MS);
  if (progress >= 1) {
    return {
      active: false,
      progress: 1,
      pulse: 0,
      forward: 1,
      travel: 1,
      step: 0,
      sway: 0,
      shake: 0
    };
  }

  const pulse = Math.sin(progress * Math.PI);
  const forward = easeOutCubic(progress);
  const stepWave = Math.sin(progress * Math.PI * 6);
  const step = Math.abs(stepWave) * pulse;
  const sway = Math.sin(progress * Math.PI * 2) * pulse;
  const shake = (0.45 + step * 0.55) * pulse;
  return {
    active: true,
    progress,
    pulse,
    forward,
    travel: progress,
    step,
    sway,
    shake
  };
}

function getEnemyAttackMotion(time = performance.now()) {
  const start = battleRenderState.enemyAttackStart;
  if (!start) {
    return {
      active: false,
      progress: 1,
      charge: 0,
      lunge: 0,
      impact: 0,
      recover: 0
    };
  }

  const progress = clamp01((time - start) / ENEMY_ATTACK_DURATION_MS);
  if (progress >= 1) {
    return {
      active: false,
      progress: 1,
      charge: 0,
      lunge: 0,
      impact: 0,
      recover: 0
    };
  }

  const chargeProgress = clamp01(progress / 0.38);
  const charge = progress < 0.42 ? Math.sin(chargeProgress * Math.PI) : 0;
  const lungeIn = easeOutCubic(clamp01((progress - 0.28) / 0.24));
  const lungeOut = easeOutCubic(clamp01((progress - 0.62) / 0.28));
  const lunge = lungeIn * (1 - lungeOut);
  const impact = getTimedPulse(start + ENEMY_ATTACK_IMPACT_DELAY_MS, ENEMY_ATTACK_RECOVER_MS, time);
  const recover = progress > 0.62 ? easeOutCubic((progress - 0.62) / 0.38) : 0;

  return {
    active: true,
    progress,
    charge,
    lunge,
    impact,
    recover
  };
}

function getQuestionPoseMotion(time = performance.now()) {
  const start = battleRenderState.questionPoseStart;
  if (!start) {
    return {
      active: false,
      progress: 1,
      lunge: 0,
      hop: 0,
      settle: 0,
      aura: 0
    };
  }

  const progress = clamp01((time - start) / QUESTION_POSE_DURATION_MS);
  if (progress >= 1) {
    return {
      active: false,
      progress: 1,
      lunge: 0,
      hop: 0,
      settle: 0,
      aura: 0
    };
  }

  const lungeIn = easeOutCubic(clamp01(progress / 0.36));
  const lungeOut = easeOutCubic(clamp01((progress - 0.42) / 0.5));
  const lunge = lungeIn * (1 - lungeOut);
  const hop = Math.sin(clamp01(progress / 0.62) * Math.PI);
  const settle = progress > 0.5 ? Math.sin(clamp01((progress - 0.5) / 0.5) * Math.PI) : 0;
  const aura = Math.sin(progress * Math.PI);
  return {
    active: true,
    progress,
    lunge,
    hop,
    settle,
    aura
  };
}

function getCanvasCameraShake(time) {
  let intensity = 0;
  const attack = battleRenderState.attack;
  if (attack) {
    const impactElapsed = time - (attack.start + attack.impactDelay);
    const preImpactElapsed = time - attack.start;
    if (isChargedBeamSkill(attack.skill) && preImpactElapsed >= 0 && preImpactElapsed < attack.impactDelay) {
      const charge = easeOutCubic(preImpactElapsed / attack.impactDelay);
      const baseCharge = attack.skill === "finisher" ? 7 : 4;
      intensity += charge * baseCharge;
    }
    if (impactElapsed >= 0 && impactElapsed < 520) {
      const falloff = 1 - impactElapsed / 520;
      const base = attack.skill === "finisher" ? 24 : (attack.skill === "letter" ? 7 : (attack.skill === "normal" ? 11 : 16));
      intensity += base * falloff;
    }
  }
  const enemyAttackMotion = getEnemyAttackMotion(time);
  intensity += enemyAttackMotion.charge * 3 + enemyAttackMotion.lunge * 8 + enemyAttackMotion.impact * 22;
  const playerHitPulse = getTimedPulse(battleRenderState.playerHitStart, 380, time);
  intensity += playerHitPulse * 18;
  const encounterIntroPulse = getTimedPulse(battleRenderState.encounterIntroStart, battleRenderState.boss ? 1180 : 820, time);
  intensity += encounterIntroPulse * (battleRenderState.boss ? 5 : 3);
  const bossIntroPulse = getTimedPulse(battleRenderState.bossIntroStart, 1200, time);
  intensity += bossIntroPulse * 8;
  const questionMotion = getQuestionPoseMotion(time);
  intensity += questionMotion.lunge * (battleRenderState.boss ? 5 : 2.2);
  intensity += getAdvanceMotion(time).shake * 4;

  if (intensity <= 0.2) {
    return { x: 0, y: 0 };
  }
  return {
    x: Math.round(Math.sin(time * 0.071) * intensity + Math.sin(time * 0.131) * intensity * 0.45),
    y: Math.round(Math.cos(time * 0.083) * intensity * 0.72)
  };
}

function drawImageCover(image, x, y, width, height) {
  if (!isImageReady(image)) {
    return false;
  }
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  return true;
}

function drawImageContain(image, x, y, width, height) {
  if (!isImageReady(image)) {
    return false;
  }
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  return true;
}

function getBattleLayout(width, height) {
  const playPanel = document.querySelector(".play-panel");
  const panelRect = playPanel?.getBoundingClientRect();
  const frameRect = els.dungeonFrame.getBoundingClientRect();
  let sidePanelWidth = 0;
  if (panelRect && panelRect.left > frameRect.left + frameRect.width * 0.58 && panelRect.top < frameRect.top + frameRect.height * 0.45) {
    sidePanelWidth = Math.max(0, frameRect.right - panelRect.left);
  }
  const battleWidth = Math.max(360, width - sidePanelWidth);
  return {
    battleWidth,
    sidePanelWidth,
    centerX: battleWidth / 2,
    targetY: height * 0.63
  };
}

function isChargedBeamSkill(skill) {
  return skill !== "letter";
}

function getAttackTiming(skill) {
  if (skill === "letter") {
    return { duration: 310, impactDelay: 145, clearDelay: 360, defeatDelay: 520 };
  }
  if (skill === "finisher") {
    return { duration: 920, impactDelay: 540, clearDelay: 1060, defeatDelay: 860 };
  }
  if (skill === "double") {
    return { duration: 800, impactDelay: 460, clearDelay: 940, defeatDelay: 780 };
  }
  if (skill === "power") {
    return { duration: 740, impactDelay: 420, clearDelay: 880, defeatDelay: 720 };
  }
  return { duration: 680, impactDelay: 380, clearDelay: 820, defeatDelay: 680 };
}

function triggerCanvasHit(damage, skill) {
  battleRenderState.monsterVisible = true;
  const timing = getAttackTiming(skill);
  battleRenderState.attack = {
    start: performance.now(),
    duration: timing.duration,
    impactDelay: timing.impactDelay,
    damage,
    skill,
    seed: Math.floor(Math.random() * 9999)
  };
}

function triggerCanvasAdvance() {
  battleRenderState.advanceStart = performance.now();
}

function triggerCanvasPlayerHit() {
  battleRenderState.playerHitStart = performance.now();
}

function triggerCanvasEnemyAttack() {
  battleRenderState.monsterVisible = true;
  const now = performance.now();
  battleRenderState.enemyAttackStart = now;
  window.setTimeout(() => {
    battleRenderState.playerHitStart = performance.now();
  }, ENEMY_ATTACK_IMPACT_DELAY_MS);
}

function triggerCanvasDefeat() {
  battleRenderState.monsterVisible = true;
  battleRenderState.defeatStart = performance.now();
}

function triggerCanvasEncounterIntro() {
  battleRenderState.monsterVisible = true;
  battleRenderState.encounterIntroStart = performance.now();
}

function triggerCanvasBossIntro() {
  battleRenderState.bossIntroStart = performance.now();
}

function triggerCanvasQuestionPose() {
  battleRenderState.monsterVisible = true;
  battleRenderState.questionPoseStart = performance.now();
}

function resetCanvasBattleState() {
  battleRenderState.attack = null;
  battleRenderState.advanceStart = 0;
  battleRenderState.playerHitStart = 0;
  battleRenderState.enemyAttackStart = 0;
  battleRenderState.defeatStart = 0;
  battleRenderState.encounterIntroStart = 0;
  battleRenderState.bossIntroStart = 0;
  battleRenderState.questionPoseStart = 0;
  battleRenderState.monsterVisible = false;
}

let audioContext = null;
let musicEnabled = true;
let musicTimer = null;
let musicGain = null;
let musicStep = 0;
let bgmAudio = null;
let bgmTrackId = "";
let bgmUsingFallback = false;
let questions = [];
let questionRegionMap = new Map();
let stages = [];
let mainStages = [];
let stageIndex = 0;
let questionIndex = 0;
let monsterHp = MONSTER_HP_BASE;
let monsterMaxHp = MONSTER_HP_BASE;
let playerHp = PLAYER_HP_MAX;
let combo = 0;
let currentQuestion = null;
let answerTokens = [];
let answerLetters = [];
let selectedLetters = [];
let currentQuestionDamage = null;
let acceptingInput = false;
let started = false;
let battleTestMode = false;
let battleTestMonsterIndex = 0;
let battleTestStage = "baby";
let animationStart = performance.now();
let advancePulse = 0;
let lastAnswerWasPerfect = true;
let progress = loadProgress();
let runEncounterIndex = 0;
let runStats = createRunStats();
let activeEncounterCount = ENCOUNTERS_PER_RUN;
let activeRunMode = "adventure";
let speechRequestId = 0;
let rewardRequestId = 0;
let calloutTimer = null;
let calloutSfxTimers = [];
let dialogueTimers = [];
let pendingEncounterGreeting = "";
let pendingRegionIntro = false;
let regionIntroTimer = null;
let scoutContinueCallback = null;
let scoutOverlayMode = "prompt";
let encounterFlowId = 0;
let monsterQueue = [];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows
    .filter((cells) => cells.some((value) => value.trim() !== ""))
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}

function normalizeRows(rows) {
  return rows
    .filter((row) => String(row.enabled).trim().toLowerCase() === "true")
    .map((row, index) => ({
      id: row.id || `q_${index}`,
      en: String(row.en || "").trim(),
      zh: String(row.zh || "").trim(),
      type: String(row.type || "word").trim(),
      level: String(row.level || "1").trim(),
      chapter: String(row.chapter || "l01").trim(),
      tags: String(row.tags || "").trim()
    }))
    .filter((row) => row.en && row.zh && getAnswerLetters(row.en).length > 0);
}

function loadProgress() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return createEmptyProgress();
    }
    const parsed = JSON.parse(raw);
    return {
      captured: Array.isArray(parsed.captured) ? parsed.captured : [],
      monsters: parsed.monsters && typeof parsed.monsters === "object" ? parsed.monsters : {},
      inventory: normalizeInventory(parsed.inventory),
      words: parsed.words && typeof parsed.words === "object" ? parsed.words : {},
      recentWords: Array.isArray(parsed.recentWords) ? parsed.recentWords.slice(-RECENT_WORD_LIMIT) : [],
      unlockedRegion: clampNumber(parsed.unlockedRegion, 0, REGIONS.length - 1, 0),
      currentRegion: clampNumber(parsed.currentRegion, 0, REGIONS.length - 1, clampNumber(parsed.unlockedRegion, 0, REGIONS.length - 1, 0)),
      scoutEnabled: parsed.scoutEnabled !== false
    };
  } catch (error) {
    console.warn("Progress reset because saved data was invalid.", error);
    return createEmptyProgress();
  }
}

function createEmptyProgress() {
  return {
    captured: [],
    monsters: {},
    inventory: normalizeInventory(),
    words: {},
    recentWords: [],
    unlockedRegion: 0,
    currentRegion: 0,
    scoutEnabled: true
  };
}

function normalizeInventory(raw = {}) {
  return {
    candy: Math.max(0, Number(raw.candy) || 0),
    energy: Math.max(0, Number(raw.energy) || 0),
    shards: Math.max(0, Number(raw.shards) || 0)
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function createRunStats() {
  return {
    correct: 0,
    wrong: 0,
    retries: 0,
    skipped: 0,
    monsters: 0,
    captured: 0,
    capturedMonsters: [],
    monsterExp: 0,
    monsterShards: 0,
    monsterLevelUps: 0,
    monsterStarUps: 0,
    evolved: 0,
    evolvedMonsters: [],
    materials: { candy: 0, energy: 0, shards: 0 },
    materialsAwarded: false,
    maxCombo: 0,
    wrongQuestions: [],
    rewards: []
  };
}

function saveProgress() {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("Progress could not be saved.", error);
  }
}

function getWordProgress(question) {
  const key = getWordKey(question);
  if (!progress.words[key]) {
    progress.words[key] = { correct: 0, wrong: 0, streak: 0, seen: 0, mastered: false };
  }
  return progress.words[key];
}

function getWordKey(question) {
  return question.id || `${question.chapter}:${question.en}`;
}

function recordWordResult(question, isCorrect) {
  const item = getWordProgress(question);
  item.seen += 1;
  if (isCorrect) {
    item.correct += 1;
    item.streak += 1;
  } else {
    item.wrong += 1;
    item.streak = 0;
  }
  item.mastered = item.streak >= 3 && item.correct >= 3;
  rememberRecentWord(question);
  saveProgress();
}

function rememberRecentWord(question) {
  const key = getWordKey(question);
  progress.recentWords = (progress.recentWords || []).filter((item) => item !== key);
  progress.recentWords.push(key);
  if (progress.recentWords.length > RECENT_WORD_LIMIT) {
    progress.recentWords = progress.recentWords.slice(-RECENT_WORD_LIMIT);
  }
}

function getMasteryText(question) {
  const item = getWordProgress(question);
  if (item.mastered) {
    return `熟練度 已掌握 (${item.streak}連)`;
  }
  if (item.seen === 0) {
    return "熟練度 新單字";
  }
  return `熟練度 ${item.correct}/${Math.max(1, item.seen)}  連續${item.streak}`;
}

function getMasteryReward(question, before, after) {
  if (!before.mastered && after.mastered) {
    return `掌握 ${question.en}`;
  }
  if (before.streak < 2 && after.streak >= 2) {
    return `${question.en} 連續答對 ${after.streak}`;
  }
  return "";
}

function addRunReward(title, detail, kind = "normal", data = {}) {
  runStats.rewards.push({ title, detail, kind, data });
}

function setBattlePhase(phase) {
  document.body.dataset.battlePhase = phase;
  if (!els.battleFlow) {
    return;
  }
  for (const node of els.battleFlow.querySelectorAll("span")) {
    const active = node.dataset.phase === phase;
    node.classList.toggle("active", active);
    node.classList.toggle("done", !active && isPhaseBefore(node.dataset.phase, phase));
  }
}

function setWordLockVisible(visible) {
  document.body.dataset.wordLock = visible ? "ready" : "hidden";
}

function isPhaseBefore(source, target) {
  const order = ["listen", "spell", "attack", "advance"];
  return order.indexOf(source) >= 0 && order.indexOf(source) < order.indexOf(target);
}

function showReward(title, detail, kind = "normal") {
  if (!els.rewardPop) {
    return;
  }
  rewardRequestId += 1;
  const requestId = rewardRequestId;
  els.rewardPop.className = `reward-pop ${kind}`;
  els.rewardTitle.textContent = title;
  els.rewardDetail.textContent = detail;
  void els.rewardPop.offsetWidth;
  els.rewardPop.classList.add("active");
  window.setTimeout(() => {
    if (requestId === rewardRequestId) {
      els.rewardPop.classList.remove("active");
    }
  }, 1800);
}

function showCaptureCard(monsterIndex) {
  if (!els.captureCard) {
    return;
  }
  const stage = getMonsterEvolutionStage(monsterIndex);
  const name = getMonsterDisplayName(monsterIndex, stage);
  els.captureCardImage.src = getMonsterActionSpritePath(monsterIndex, stage, "capture");
  els.captureCardName.textContent = name;
  els.captureCard.classList.remove("hidden", "active");
  void els.captureCard.offsetWidth;
  els.captureCard.classList.add("active");
  window.setTimeout(() => {
    els.captureCard.classList.remove("active");
    els.captureCard.classList.add("hidden");
  }, 2200);
}

function showClearCinematic({ clearedRegion, nextRegion, unlockedRegionNow, unlockStatus }) {
  if (!els.clearCinematic) {
    return;
  }
  const needsMorePractice = unlockStatus && !unlockStatus.ready && REGIONS.indexOf(clearedRegion) < REGIONS.length - 1;
  els.clearKicker.textContent = unlockedRegionNow ? "New Route" : needsMorePractice ? "Training Gate" : "Area Clear";
  els.clearTitle.textContent = unlockedRegionNow ? "新地區開放！" : needsMorePractice ? "Boss 擊破！" : "地區突破！";
  els.clearRegion.textContent = unlockedRegionNow && nextRegion ? nextRegion.name : clearedRegion.name;
  els.clearDetail.textContent = unlockedRegionNow && nextRegion
    ? `${clearedRegion.name} Boss 擊破，下一站已解鎖。`
    : needsMorePractice
      ? `解鎖下一區：Boss 擊破，${unlockStatus.text}。`
      : `${clearedRegion.name} Boss 擊破，遠征紀錄已更新。`;
  renderClearProgress(unlockedRegionNow ? nextRegion : clearedRegion);
  els.clearCinematic.classList.remove("hidden", "active");
  void els.clearCinematic.offsetWidth;
  els.clearCinematic.classList.add("active");
  playTone(unlockedRegionNow ? "regionClear" : "areaClear");
}

function hideClearCinematic() {
  els.clearCinematic?.classList.remove("active");
  els.clearCinematic?.classList.add("hidden");
}

function renderClearProgress(region) {
  if (!els.clearProgress) {
    return;
  }
  els.clearProgress.replaceChildren();
  const targetIndex = Math.max(0, REGIONS.indexOf(region));
  REGIONS.forEach((item, index) => {
    const node = document.createElement("span");
    node.className = index <= getUnlockedRegionIndex() ? "unlocked" : "";
    if (index === targetIndex) {
      node.classList.add("current");
    }
    node.textContent = String(index + 1);
    node.title = item.name;
    els.clearProgress.appendChild(node);
  });
}

function getWeightedStageQuestions(entries) {
  return pickWeightedQuestions(entries, QUESTIONS_PER_STAGE);
}

function getQuestionWeight(item, chapterBias = 0) {
  const word = getWordProgress(item);
  const length = getAnswerLetters(item.en).length;
  const rawShortBonus = length <= 3 ? 8 : length <= 5 ? 5 : length <= 7 ? 2 : 0;
  const shortBonus = word.mastered ? Math.floor(rawShortBonus / 2) : rawShortBonus;
  const novelty = word.seen === 0 ? 8 : 0;
  const weak = word.seen > 0 && !word.mastered ? 4 : 0;
  const review = Math.min(word.wrong * 5, 16);
  const streakPenalty = Math.min(word.streak, 4);
  const masteredPenalty = word.mastered ? 5 : 0;
  const recentPenalty = progress.recentWords?.includes(getWordKey(item)) ? RECENT_WORD_PENALTY : 0;
  return Math.max(1, 5 + shortBonus + novelty + weak + review + chapterBias - recentPenalty - streakPenalty - masteredPenalty);
}

function pickWeightedQuestions(entries, count, options = {}) {
  const pool = [];
  const chapterBias = options.chapterBias || 0;
  const usedKeys = options.usedKeys || new Set();
  for (const item of entries) {
    if (usedKeys.has(getWordKey(item))) {
      continue;
    }
    const weight = getQuestionWeight(item, chapterBias);
    for (let i = 0; i < weight; i += 1) {
      pool.push(item);
    }
  }

  const picked = [];
  const used = new Set();
  for (const item of shuffle(pool)) {
    const key = getWordKey(item);
    if (used.has(key)) {
      continue;
    }
    picked.push(item);
    used.add(key);
    if (picked.length >= count) {
      break;
    }
  }
  if (picked.length) {
    return picked;
  }
  return shuffle(entries.filter((item) => !usedKeys.has(getWordKey(item)))).slice(0, count);
}

function buildMixedStageQuestions(mainEntries, allItems) {
  const picked = [];
  const used = new Set();

  function addUnique(items) {
    for (const item of items) {
      const key = getWordKey(item);
      if (used.has(key)) {
        continue;
      }
      picked.push(item);
      used.add(key);
      if (picked.length >= QUESTIONS_PER_STAGE) {
        return;
      }
    }
  }

  addUnique(pickWeightedQuestions(mainEntries, STAGE_MAIN_CHAPTER_QUESTIONS, { chapterBias: 3 }));

  const reviewCandidates = allItems.filter((item) => {
    const word = getWordProgress(item);
    return word.wrong > 0 || !word.mastered;
  });
  addUnique(pickWeightedQuestions(reviewCandidates, QUESTIONS_PER_STAGE - picked.length));
  addUnique(pickWeightedQuestions(allItems, QUESTIONS_PER_STAGE - picked.length));

  return picked;
}

function getMonsterIndex(index = stageIndex) {
  if (battleTestMode) {
    return battleTestMonsterIndex;
  }
  return monsterQueue[runEncounterIndex] ?? (index % monsterNames.length);
}

function getRunActInfo(encounterIndex = runEncounterIndex) {
  const actIndex = Math.max(0, Math.min(RUN_ACTS.length - 1, Math.floor(encounterIndex / ENCOUNTERS_PER_ACT)));
  const act = RUN_ACTS[actIndex] || RUN_ACTS[0];
  const localIndex = encounterIndex % ENCOUNTERS_PER_ACT;
  return {
    ...act,
    actIndex,
    localIndex,
    label: `${act.name} ${localIndex + 1}/${ENCOUNTERS_PER_ACT}`
  };
}

function getEncounterMonsterStage(monsterIndex = getMonsterIndex()) {
  if (battleTestMode && monsterIndex === battleTestMonsterIndex) {
    return battleTestStage;
  }
  return getRunActInfo().stage;
}

function isBossEncounter() {
  if (battleTestMode) {
    return false;
  }
  return runEncounterIndex === activeEncounterCount - 1;
}

function rememberWrongQuestion(question) {
  if (!question) {
    return;
  }
  const key = getWordKey(question);
  if (!runStats.wrongQuestions.some((item) => getWordKey(item) === key)) {
    runStats.wrongQuestions.push(question);
  }
}

function supportsMonsterEvolution(index) {
  return index >= 0 && index < EVOLUTION_SUPPORTED_COUNT;
}

function getEvolutionStageIndex(stage) {
  return Math.max(0, EVOLUTION_STAGES.indexOf(stage));
}

function getMonsterEvolutionStageFromData(monster) {
  if (!monster) {
    return "baby";
  }
  const level = clampNumber(monster.level, 1, MONSTER_LEVEL_MAX, 1);
  const stars = clampNumber(monster.stars, 0, MONSTER_STAR_MAX, 0);
  if (level >= 8 || stars >= 3) {
    return "ultimate";
  }
  if (level >= 4 || stars >= 1) {
    return "rookie";
  }
  return "baby";
}

function getMonsterEvolutionStage(index) {
  if (battleTestMode && index === battleTestMonsterIndex) {
    return battleTestStage;
  }
  if (!supportsMonsterEvolution(index)) {
    return "baby";
  }
  const data = progress.monsters?.[String(index)];
  return getMonsterEvolutionStageFromData(data);
}

function getMonsterEvolutionLabel(stage) {
  return EVOLUTION_STAGE_LABELS[stage] || EVOLUTION_STAGE_LABELS.baby;
}

function getMonsterCatalogEntry(index) {
  return monsterCatalog[index] || null;
}

function getMonsterDisplayName(index, stage = getMonsterEvolutionStage(index)) {
  const entry = getMonsterCatalogEntry(index);
  return entry?.zh?.[stage] || entry?.zh?.baby || monsterNames[index] || "Unknown";
}

function getMonsterBaseName(index) {
  return getMonsterDisplayName(index, "baby");
}

function getMonsterEnglishName(index) {
  return monsterNames[index] || "Unknown";
}

function getMonsterEvolutionNameChain(index) {
  return EVOLUTION_STAGES.map((stage) => getMonsterDisplayName(index, stage));
}

function getMonsterSpritePath(index, stage = getMonsterEvolutionStage(index)) {
  if (supportsMonsterEvolution(index)) {
    const embeddedEvolution = window.SPELL_QUEST_ASSETS?.evolutions?.[index]?.[stage];
    if (embeddedEvolution) {
      return embeddedEvolution;
    }
    if (stage !== "baby") {
      return `assets/evolutions/monster-${String(index).padStart(2, "0")}-${stage}.png`;
    }
    const babyPath = `assets/evolutions/monster-${String(index).padStart(2, "0")}-baby.png`;
    if (index === 0) {
      return babyPath;
    }
  }
  const embedded = window.SPELL_QUEST_ASSETS?.monsters?.[index];
  if (embedded) {
    return embedded;
  }
  return `assets/monsters/monster-${String(index).padStart(2, "0")}.png`;
}

function supportsMonsterActionPack(index) {
  return index >= 0 && index < MONSTER_ACTION_PACK_COUNT;
}

function getMonsterActionSpritePath(index, stage = getMonsterEvolutionStage(index), action = "idle-1") {
  if (!supportsMonsterActionPack(index) || !MONSTER_ACTIONS.includes(action)) {
    return getMonsterSpritePath(index, stage);
  }
  const embeddedAction = window.SPELL_QUEST_ASSETS?.monsterPacks?.[index]?.[stage]?.[action];
  if (embeddedAction) {
    return embeddedAction;
  }
  return `assets/monster-packs/monster-${String(index).padStart(2, "0")}/${stage}/${action}.png`;
}

function getCapturedCount() {
  return new Set(progress.captured).size;
}

function hasCapturedMonster(index) {
  return progress.captured.includes(index);
}

function getMonsterProgress(index) {
  const key = String(index);
  if (!progress.monsters[key]) {
    progress.monsters[key] = {
      level: 1,
      exp: 0,
      stars: 0,
      shards: 0,
      wins: 0
    };
  }
  const data = progress.monsters[key];
  data.level = clampNumber(data.level, 1, MONSTER_LEVEL_MAX, 1);
  data.exp = Math.max(0, Number(data.exp) || 0);
  data.stars = clampNumber(data.stars, 0, MONSTER_STAR_MAX, 0);
  data.shards = Math.max(0, Number(data.shards) || 0);
  data.wins = Math.max(0, Number(data.wins) || 0);
  return data;
}

function getMonsterExpNeeded(monster) {
  return monster.level >= MONSTER_LEVEL_MAX ? 0 : MONSTER_EXP_PER_LEVEL + (monster.level - 1) * 35;
}

function getMonsterStarText(monster) {
  return "★".repeat(monster.stars) + "☆".repeat(MONSTER_STAR_MAX - monster.stars);
}

function addMonsterExp(monster, amount) {
  let levelUps = 0;
  monster.exp += Math.max(0, amount);
  let needed = getMonsterExpNeeded(monster);
  while (needed > 0 && monster.exp >= needed && monster.level < MONSTER_LEVEL_MAX) {
    monster.exp -= needed;
    monster.level += 1;
    levelUps += 1;
    needed = getMonsterExpNeeded(monster);
  }
  if (monster.level >= MONSTER_LEVEL_MAX) {
    monster.exp = 0;
  }
  return levelUps;
}

function addMonsterShards(monster, amount) {
  let starUps = 0;
  monster.shards += Math.max(0, amount);
  while (monster.shards >= MONSTER_SHARDS_PER_STAR && monster.stars < MONSTER_STAR_MAX) {
    monster.shards -= MONSTER_SHARDS_PER_STAR;
    monster.stars += 1;
    starUps += 1;
  }
  if (monster.stars >= MONSTER_STAR_MAX) {
    monster.shards = 0;
  }
  return starUps;
}

function awardMonsterGrowth(index, { capturedNow, defeatedBoss }) {
  const monster = getMonsterProgress(index);
  const before = { ...monster };
  const beforeStage = getMonsterEvolutionStageFromData(before);
  const expGain = 24 + Math.min(runStats.maxCombo, 6) * 3 + (defeatedBoss ? 18 : 0) + (capturedNow ? 10 : 0);
  const shardGain = capturedNow ? 1 : (defeatedBoss ? 2 : 1);
  monster.wins += 1;
  const levelUps = addMonsterExp(monster, expGain);
  const starUps = addMonsterShards(monster, shardGain);

  saveProgress();
  const after = { ...monster };
  const afterStage = getMonsterEvolutionStageFromData(after);
  return {
    before,
    after,
    beforeStage,
    afterStage,
    evolved: supportsMonsterEvolution(index) && getEvolutionStageIndex(afterStage) > getEvolutionStageIndex(beforeStage),
    expGain,
    shardGain,
    levelUps,
    starUps
  };
}

function captureMonster(index) {
  if (hasCapturedMonster(index)) {
    return false;
  }
  progress.captured.push(index);
  progress.captured.sort((a, b) => a - b);
  getMonsterProgress(index);
  saveProgress();
  return true;
}

function addInventoryMaterials(materials) {
  progress.inventory = normalizeInventory(progress.inventory);
  progress.inventory.candy += Math.max(0, Number(materials.candy) || 0);
  progress.inventory.energy += Math.max(0, Number(materials.energy) || 0);
  progress.inventory.shards += Math.max(0, Number(materials.shards) || 0);
  saveProgress();
}

function awardRunCompletionMaterials() {
  if (runStats.materialsAwarded) {
    return runStats.materials;
  }
  const totalAttempts = runStats.correct + runStats.wrong;
  const accuracy = totalAttempts ? runStats.correct / totalAttempts : 0;
  const completionScale = activeRunMode === "adventure" ? 1 : Math.max(0.28, activeEncounterCount / ENCOUNTERS_PER_RUN);
  const actBonus = RUN_ACTS.reduce((sum, act) => sum + act.rewardScale, 0) * completionScale;
  const candy = Math.max(activeRunMode === "adventure" ? 3 : 1, Math.round((3 + runStats.monsters * 0.65) * completionScale + actBonus));
  const energyBase = activeRunMode === "adventure" ? 1 : 0;
  const energy = energyBase + (accuracy >= 0.75 ? 1 : 0) + (activeRunMode === "adventure" && runStats.wrong === 0 ? 1 : 0);
  const shards = Math.max(activeRunMode === "adventure" ? 2 : 1, Math.round((2 + Math.floor(runStats.maxCombo / 4) + (accuracy >= 0.9 ? 1 : 0)) * completionScale));
  runStats.materials = { candy, energy, shards };
  runStats.materialsAwarded = true;
  addInventoryMaterials(runStats.materials);
  addRunReward("探險素材", `糖果 +${candy}・能量 +${energy}・碎片 +${shards}`, "growth");
  return runStats.materials;
}

function useCandyOnMonster(index) {
  if (!hasCapturedMonster(index)) {
    return;
  }
  progress.inventory = normalizeInventory(progress.inventory);
  const monster = getMonsterProgress(index);
  if (progress.inventory.candy <= 0 || monster.level >= MONSTER_LEVEL_MAX) {
    return;
  }
  const beforeStage = getMonsterEvolutionStageFromData({ ...monster });
  progress.inventory.candy -= 1;
  const levelUps = addMonsterExp(monster, 85);
  const afterStage = getMonsterEvolutionStageFromData(monster);
  saveProgress();
  if (levelUps > 0 || afterStage !== beforeStage) {
    showReward("餵養成功", `${getMonsterDisplayName(index, afterStage)} Lv.${monster.level}`, afterStage !== beforeStage ? "evolution" : "growth");
  } else {
    showReward("經驗增加", getMonsterDisplayName(index, afterStage), "growth");
  }
  renderDex();
}

function useEnergyOnMonster(index) {
  if (!hasCapturedMonster(index)) {
    return;
  }
  progress.inventory = normalizeInventory(progress.inventory);
  const monster = getMonsterProgress(index);
  const beforeStage = getMonsterEvolutionStageFromData({ ...monster });
  if (progress.inventory.energy <= 0 || beforeStage === "ultimate") {
    return;
  }
  progress.inventory.energy -= 1;
  monster.level = Math.max(monster.level, beforeStage === "baby" ? 4 : 8);
  const afterStage = getMonsterEvolutionStageFromData(monster);
  saveProgress();
  showReward("進化能量", `${getMonsterDisplayName(index, afterStage)} ${getMonsterEvolutionLabel(afterStage)}`, "evolution");
  renderDex();
}

function useShardOnMonster(index) {
  if (!hasCapturedMonster(index)) {
    return;
  }
  progress.inventory = normalizeInventory(progress.inventory);
  const monster = getMonsterProgress(index);
  if (progress.inventory.shards <= 0 || monster.stars >= MONSTER_STAR_MAX) {
    return;
  }
  progress.inventory.shards -= 1;
  const starUps = addMonsterShards(monster, 1);
  saveProgress();
  showReward(starUps > 0 ? "星等提升" : "碎片注入", `${getMonsterDisplayName(index)} ${getMonsterStarText(monster)}`, "growth");
  renderDex();
}

function getUnlockedRegionIndex() {
  progress.unlockedRegion = clampNumber(progress.unlockedRegion, 0, REGIONS.length - 1, 0);
  return progress.unlockedRegion;
}

function getCurrentRegionIndex() {
  const unlocked = getUnlockedRegionIndex();
  progress.currentRegion = clampNumber(progress.currentRegion, 0, unlocked, unlocked);
  return progress.currentRegion;
}

function setCurrentRegion(index) {
  progress.currentRegion = clampNumber(index, 0, getUnlockedRegionIndex(), getCurrentRegionIndex());
  saveProgress();
  updateRegionPanel();
  updateHomeRegionSummary();
}

function getChapterNumber(question) {
  const raw = String(question?.chapter || question?.level || "");
  const match = raw.match(/\d+/);
  if (!match) {
    return 1;
  }
  return Number(match[0]) || 1;
}

function buildQuestionRegionMap(items) {
  questionRegionMap = new Map();
  const sorted = items
    .map((question, index) => ({
      question,
      index,
      chapter: getChapterNumber(question),
      answerLength: getAnswerLetters(question.en).length
    }))
    .sort((a, b) =>
      a.chapter - b.chapter ||
      a.answerLength - b.answerLength ||
      String(a.question.en).localeCompare(String(b.question.en)) ||
      a.index - b.index
    );

  sorted.forEach(({ question }, index) => {
    const regionIndex = sorted.length
      ? Math.min(REGIONS.length - 1, Math.floor((index * REGIONS.length) / sorted.length))
      : 0;
    questionRegionMap.set(getWordKey(question), regionIndex);
  });
}

function getQuestionRegionIndex(question) {
  const assigned = questionRegionMap.get(getWordKey(question));
  if (Number.isInteger(assigned)) {
    return assigned;
  }
  const chapter = getChapterNumber(question);
  const index = REGIONS.findIndex((region) => chapter >= region.minChapter && chapter <= region.maxChapter);
  return index >= 0 ? index : REGIONS.length - 1;
}

function getRegionQuestions(index = getCurrentRegionIndex()) {
  const regionItems = questions.filter((question) => getQuestionRegionIndex(question) === index);
  return regionItems.length ? regionItems : questions;
}

function getRegionUnlockStatus(index = getCurrentRegionIndex()) {
  const items = getRegionQuestions(index);
  const seenTarget = Math.min(REGION_UNLOCK_SEEN_TARGET, items.length);
  const steadyTarget = Math.min(REGION_UNLOCK_STEADY_TARGET, Math.max(1, Math.ceil(items.length * 0.08)));
  const seen = items.filter((question) => getWordProgress(question).seen > 0).length;
  const steady = items.filter((question) => {
    const word = getWordProgress(question);
    return word.mastered || word.streak >= 2 || word.correct >= 2;
  }).length;
  const ready = items.length > 0 && seen >= seenTarget && steady >= steadyTarget;
  return {
    seen,
    seenTarget,
    steady,
    steadyTarget,
    ready,
    text: `看過 ${seen}/${seenTarget} · 熟練 ${steady}/${steadyTarget}`
  };
}

function getRegionMonsterIndices(index = getCurrentRegionIndex()) {
  const start = REGIONS[index]?.monsterStart ?? 0;
  return Array.from({ length: 6 }, (_, offset) => (start + offset) % monsterNames.length);
}

function unlockNextRegion() {
  const current = getCurrentRegionIndex();
  if (current >= getUnlockedRegionIndex() && current < REGIONS.length - 1) {
    const status = getRegionUnlockStatus(current);
    if (!status.ready) {
      return false;
    }
    progress.unlockedRegion = current + 1;
    progress.currentRegion = current + 1;
    saveProgress();
    return true;
  }
  return false;
}

function updateRegionPanel() {
  if (!els.regionName || !els.regionMeta || !els.regionProgress) {
    return;
  }
  const current = getCurrentRegionIndex();
  const unlocked = getUnlockedRegionIndex();
  const region = REGIONS[current];
  const count = getRegionQuestions(current).length;
  const status = getRegionUnlockStatus(current);
  const seenPct = status.seenTarget ? Math.min(1, status.seen / status.seenTarget) : 0;
  const steadyPct = status.steadyTarget ? Math.min(1, status.steady / status.steadyTarget) : 0;
  const missionText = current < REGIONS.length - 1 ? "Boss 戰準備中" : "最終挑戰";
  els.regionCard.dataset.theme = region.theme || "sun";
  if (els.regionCardVisual) {
    els.regionCardVisual.style.backgroundImage = `linear-gradient(180deg, rgba(20, 16, 12, 0.02), rgba(20, 16, 12, 0.42)), url("${getRegionBackgroundPath(current)}")`;
  }
  els.regionName.textContent = region.name;
  els.regionMeta.textContent = `${region.range} · ${count} 題任務 · ${missionText}`;
  els.regionProgress.replaceChildren();
  [
    ["探索", seenPct, `${status.seen}/${status.seenTarget}`],
    ["熟練", steadyPct, `${status.steady}/${status.steadyTarget}`]
  ].forEach(([label, pct, value]) => {
    const row = document.createElement("span");
    row.className = "region-progress-row";
    row.style.setProperty("--progress", `${Math.round(pct * 100)}%`);
    row.setAttribute("aria-label", `${label} ${value}`);

    const name = document.createElement("b");
    name.textContent = label;
    const bar = document.createElement("i");
    const countLabel = document.createElement("em");
    countLabel.textContent = value;
    row.append(name, bar, countLabel);
    els.regionProgress.appendChild(row);
  });
  if (els.regionMapOverlay && !els.regionMapOverlay.classList.contains("hidden")) {
    renderRegionMap();
  }
}

function updateHomeRegionSummary() {
  if (!els.loadSummary) {
    return;
  }
  if (!questions.length) {
    els.loadSummary.textContent = "正在準備題庫...";
    return;
  }
  const region = REGIONS[getCurrentRegionIndex()];
  els.loadSummary.textContent = `冒險地圖已更新，下一站是 ${region.name}。`;
}

function openRegionMap() {
  renderRegionMap();
  els.regionMapOverlay?.classList.remove("hidden");
}

function closeRegionMap() {
  els.regionMapOverlay?.classList.add("hidden");
}

function renderRegionMap() {
  if (!els.regionMapGrid || !els.regionMapSummary) {
    return;
  }
  const current = getCurrentRegionIndex();
  const unlocked = getUnlockedRegionIndex();
  const currentRegion = REGIONS[current];
  const status = getRegionUnlockStatus(current);
  els.regionMapSummary.textContent = current < REGIONS.length - 1
    ? `目前選擇：${currentRegion.name}。解鎖下一區需要 Boss 擊破，${status.text}。`
    : `目前選擇：${currentRegion.name}。這是目前最後地區。`;
  if (els.regionMapStartButton) {
    els.regionMapStartButton.disabled = questions.length === 0;
    els.regionMapStartButton.textContent = `挑戰 ${currentRegion.name}`;
  }

  els.regionMapGrid.replaceChildren();
  REGIONS.forEach((region, index) => {
    const available = index <= unlocked;
    const selected = index === current;
    const items = getRegionQuestions(index);
    const regionStatus = getRegionUnlockStatus(index);
    const seenPct = regionStatus.seenTarget ? Math.min(1, regionStatus.seen / regionStatus.seenTarget) : 0;
    const steadyPct = regionStatus.steadyTarget ? Math.min(1, regionStatus.steady / regionStatus.steadyTarget) : 0;
    const node = document.createElement("button");
    node.type = "button";
    node.className = `region-map-node theme-${region.theme || "grassland"}`;
    node.disabled = !available;
    node.dataset.state = selected ? "current" : available ? "open" : "locked";
    node.style.setProperty("--seen-progress", `${Math.round(seenPct * 100)}%`);
    node.style.setProperty("--steady-progress", `${Math.round(steadyPct * 100)}%`);

    const visual = document.createElement("span");
    visual.className = "region-map-visual";
    visual.style.backgroundImage = `linear-gradient(180deg, rgba(22, 18, 14, 0.03), rgba(22, 18, 14, 0.38)), url("${getRegionBackgroundPath(index)}")`;

    const icon = document.createElement("span");
    icon.className = "region-map-icon";
    icon.textContent = available ? region.icon : "鎖";

    const copy = document.createElement("span");
    copy.className = "region-map-copy";
    const title = document.createElement("strong");
    title.textContent = region.name;
    const meta = document.createElement("span");
    meta.textContent = available
      ? `${region.range} · ${items.length} 題 · ${regionStatus.text}`
      : `${region.range} · 尚未開放`;
    const desc = document.createElement("small");
    desc.textContent = available ? region.description : "先突破前一地區 Boss，累積足夠熟練度後開放。";
    copy.append(title, meta, desc);

    const progress = document.createElement("span");
    progress.className = "region-map-bars";
    progress.append(document.createElement("i"), document.createElement("b"));

    node.append(visual, icon, copy, progress);
    if (available) {
      node.addEventListener("click", () => {
        setCurrentRegion(index);
        renderRegionMap();
      });
    }
    els.regionMapGrid.appendChild(node);
  });
}

function buildMonsterQueue(count, regionIndex = getCurrentRegionIndex()) {
  const queue = [];
  const used = new Set();
  const regionPool = getRegionMonsterIndices(regionIndex);

  for (let slot = 0; slot < count; slot += 1) {
    const bossSlot = slot === count - 1;
    const candidates = regionPool.filter((index) => !used.has(index));
    const pool = candidates.length ? candidates : regionPool;
    const weighted = [];
    for (const index of pool) {
      const captured = hasCapturedMonster(index);
      const base = captured ? 2 : 9;
      const bossBonus = bossSlot && !captured ? 6 : 0;
      const earlyVariety = index < ENCOUNTERS_PER_RUN && getCapturedCount() < ENCOUNTERS_PER_RUN ? -2 : 0;
      const weight = Math.max(1, base + bossBonus + earlyVariety);
      for (let i = 0; i < weight; i += 1) {
        weighted.push(index);
      }
    }
    const picked = shuffle(weighted)[0] ?? (slot % monsterNames.length);
    queue.push(picked);
    used.add(picked);
  }

  return queue;
}

function updateProgressLabels() {
  const captured = getCapturedCount();
  const inventory = normalizeInventory(progress.inventory);
  if (els.captureLabel) {
    els.captureLabel.textContent = `收服 ${captured} / ${monsterNames.length}`;
  }
  if (els.dexSummary) {
    els.dexSummary.textContent = `已收服 ${captured} / ${monsterNames.length}｜糖果 ${inventory.candy}｜能量 ${inventory.energy}｜碎片 ${inventory.shards}`;
  }
  updateRegionPanel();
}

function renderDex() {
  els.dexGrid.replaceChildren();
  updateProgressLabels();

  monsterNames.forEach((name, index) => {
    const caught = hasCapturedMonster(index);
    const card = document.createElement("article");
    card.className = caught ? "dex-card" : "dex-card locked";

    const img = document.createElement("img");
    const currentStage = caught ? getMonsterEvolutionStage(index) : "baby";
    const displayName = getMonsterDisplayName(index, currentStage);
    img.src = getMonsterSpritePath(index, currentStage);
    img.alt = caught ? displayName : "未收服怪物";

    const title = document.createElement("strong");
    title.textContent = caught ? displayName : "???";

    const meta = document.createElement("span");
    meta.textContent = caught
      ? `No. ${String(index + 1).padStart(2, "0")} ${getMonsterEvolutionLabel(currentStage)}｜${getMonsterEnglishName(index)}`
      : "尚未收服";

    card.append(img, title, meta);
    if (caught) {
      const monster = getMonsterProgress(index);
      const growth = document.createElement("div");
      growth.className = "dex-growth";

      const level = document.createElement("span");
      level.textContent = `Lv.${monster.level}`;

      const stars = document.createElement("span");
      stars.className = "dex-stars";
      stars.textContent = getMonsterStarText(monster);

      const exp = document.createElement("span");
      exp.textContent = monster.level >= MONSTER_LEVEL_MAX
        ? "EXP MAX"
        : `EXP ${monster.exp}/${getMonsterExpNeeded(monster)}`;

      const shards = document.createElement("span");
      shards.textContent = monster.stars >= MONSTER_STAR_MAX
        ? "碎片 MAX"
        : `碎片 ${monster.shards}/${MONSTER_SHARDS_PER_STAR}`;

      growth.append(level, stars, exp, shards);
      card.appendChild(growth);

      const evolution = document.createElement("div");
      evolution.className = supportsMonsterEvolution(index) ? "dex-evolution" : "dex-evolution locked";
      for (const stage of EVOLUTION_STAGES) {
        const node = document.createElement("span");
        node.className = "evolution-node";
        if (getEvolutionStageIndex(stage) <= getEvolutionStageIndex(currentStage)) {
          node.classList.add("unlocked");
        }
        if (stage === currentStage) {
          node.classList.add("active");
        }
        node.textContent = getMonsterDisplayName(index, stage);
        evolution.appendChild(node);
      }
      card.appendChild(evolution);

      const actions = document.createElement("div");
      actions.className = "dex-actions";

      const candyButton = document.createElement("button");
      candyButton.type = "button";
      candyButton.textContent = "餵糖果";
      candyButton.disabled = normalizeInventory(progress.inventory).candy <= 0 || monster.level >= MONSTER_LEVEL_MAX;
      candyButton.addEventListener("click", () => useCandyOnMonster(index));

      const energyButton = document.createElement("button");
      energyButton.type = "button";
      energyButton.textContent = "進化能量";
      energyButton.disabled = normalizeInventory(progress.inventory).energy <= 0 || currentStage === "ultimate";
      energyButton.addEventListener("click", () => useEnergyOnMonster(index));

      const shardButton = document.createElement("button");
      shardButton.type = "button";
      shardButton.textContent = "碎片強化";
      shardButton.disabled = normalizeInventory(progress.inventory).shards <= 0 || monster.stars >= MONSTER_STAR_MAX;
      shardButton.addEventListener("click", () => useShardOnMonster(index));

      actions.append(candyButton, energyButton, shardButton);
      card.appendChild(actions);
    }
    els.dexGrid.appendChild(card);
  });
}

function openDex() {
  initAudio();
  startMusic("study");
  renderDex();
  els.dexOverlay.classList.remove("hidden");
}

function closeDex() {
  els.dexOverlay.classList.add("hidden");
  refreshSceneMusic();
}

function getVocabularyBuckets() {
  const buckets = {
    all: questions.slice(),
    newWords: [],
    wrong: [],
    weak: [],
    mastered: []
  };

  for (const question of questions) {
    const item = getWordProgress(question);
    if (item.seen === 0) {
      buckets.newWords.push(question);
    }
    if (item.wrong > 0) {
      buckets.wrong.push(question);
    }
    if (item.seen > 0 && !item.mastered) {
      buckets.weak.push(question);
    }
    if (item.mastered) {
      buckets.mastered.push(question);
    }
  }

  return buckets;
}

function openTraining() {
  initAudio();
  startMusic("study");
  renderTrainingPanel("all");
  els.trainingOverlay.classList.remove("hidden");
}

function closeTraining() {
  els.trainingOverlay.classList.add("hidden");
  refreshSceneMusic();
}

function renderTrainingPanel(filter = "all") {
  const buckets = getVocabularyBuckets();
  const stats = [
    ["總題庫", buckets.all.length],
    ["新單字", buckets.newWords.length],
    ["未熟", buckets.weak.length],
    ["錯題", buckets.wrong.length],
    ["已掌握", buckets.mastered.length]
  ];
  const filterMap = {
    all: buckets.all,
    newWords: buckets.newWords,
    wrong: buckets.wrong,
    weak: buckets.weak,
    mastered: buckets.mastered
  };
  const list = filterMap[filter] || buckets.all;

  els.trainingStats.replaceChildren(
    ...stats.map(([label, value]) => createTrainingStat(label, value))
  );

  els.trainingList.replaceChildren();
  if (!questions.length) {
    els.trainingList.append(createTrainingEmpty("題庫還在讀取中，稍等一下再開始訓練。"));
  } else if (!list.length) {
    els.trainingList.append(createTrainingEmpty("這個分類目前沒有單字，可以先玩一般遠征累積紀錄。"));
  } else {
    for (const question of list) {
      els.trainingList.append(createWordChip(question));
    }
  }

  els.wrongPracticeButton.disabled = buckets.wrong.length === 0;
  els.weakPracticeButton.disabled = buckets.weak.length === 0;
  els.masteredPracticeButton.disabled = buckets.mastered.length === 0;
  els.allReviewButton.disabled = buckets.all.length === 0;
}

function createTrainingStat(label, value) {
  const item = document.createElement("button");
  item.className = "training-stat";
  item.type = "button";
  item.dataset.filter = label === "新單字" ? "newWords" : label === "錯題" ? "wrong" : label === "未熟" ? "weak" : label === "已掌握" ? "mastered" : "all";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  item.append(strong, span);
  item.addEventListener("click", () => renderTrainingPanel(item.dataset.filter));
  return item;
}

function createTrainingEmpty(text) {
  const node = document.createElement("p");
  node.className = "training-empty";
  node.textContent = text;
  return node;
}

function createWordChip(question) {
  const item = getWordProgress(question);
  const chip = document.createElement("button");
  chip.className = "training-chip";
  chip.type = "button";
  chip.title = `播放 ${question.en}`;
  chip.setAttribute("aria-label", `播放 ${question.en}`);
  const title = document.createElement("strong");
  title.textContent = question.zh;
  const answer = document.createElement("span");
  answer.textContent = question.en;
  const meta = document.createElement("small");
  if (item.mastered) {
    meta.textContent = `已掌握 · 連續 ${item.streak}`;
  } else if (item.seen === 0) {
    meta.textContent = `${question.chapter} · 新單字`;
  } else {
    meta.textContent = `${question.chapter} · 正確 ${item.correct}/${item.seen} · 錯 ${item.wrong}`;
  }
  chip.append(title, answer, meta);
  chip.addEventListener("click", () => {
    initAudio();
    speakText(question.en);
  });
  return chip;
}

function buildPracticeStages(items, label, encounterCount) {
  const pool = items.length ? items : questions;
  const count = Math.max(1, encounterCount);
  return Array.from({ length: count }, (_, index) => ({
    chapter: `${label} ${index + 1}`,
    questions: pickWeightedQuestions(pool, Math.min(QUESTIONS_PER_STAGE, pool.length || QUESTIONS_PER_STAGE))
  }));
}

function buildRunStages(items, encounterCount, label = "遠征") {
  const usedKeys = new Set();
  return Array.from({ length: encounterCount }, (_, index) => {
    const act = getRunActInfo(index);
    return {
      chapter: `${label}｜${act.label}`,
      act,
      questions: buildRunQuestionSet(items, usedKeys)
    };
  }).filter((stage) => stage.questions.length > 0);
}

function buildRunQuestionSet(items, usedKeys) {
  const picked = [];
  const localKeys = new Set();

  function addWeighted(pool, count, chapterBias = 0) {
    if (picked.length >= QUESTIONS_PER_STAGE || count <= 0 || !pool.length) {
      return;
    }
    const blocked = new Set([...usedKeys, ...localKeys]);
    const selected = pickWeightedQuestions(pool, Math.min(count, QUESTIONS_PER_STAGE - picked.length), {
      usedKeys: blocked,
      chapterBias
    });
    for (const item of selected) {
      const key = getWordKey(item);
      if (localKeys.has(key)) {
        continue;
      }
      picked.push(item);
      localKeys.add(key);
      usedKeys.add(key);
      if (picked.length >= QUESTIONS_PER_STAGE) {
        break;
      }
    }
  }

  const newWords = items.filter((item) => getWordProgress(item).seen === 0);
  const weakWords = items.filter((item) => {
    const word = getWordProgress(item);
    return word.seen > 0 && !word.mastered;
  });
  const wrongWords = items.filter((item) => getWordProgress(item).wrong > 0);
  const masteredWords = items.filter((item) => getWordProgress(item).mastered);

  addWeighted(newWords, 2, 3);
  addWeighted(wrongWords, 1, 2);
  addWeighted(weakWords, 1, 1);
  addWeighted(items, QUESTIONS_PER_STAGE - picked.length);
  addWeighted(masteredWords, QUESTIONS_PER_STAGE - picked.length);

  return picked;
}

function startPracticeRun(items, label, encounterCount = REVIEW_ENCOUNTERS_PER_RUN) {
  if (!items.length) {
    const filter = label === "錯題重練" ? "wrong" : label === "未熟練習" ? "weak" : label === "已掌握複習" ? "mastered" : "all";
    renderTrainingPanel(filter);
    return;
  }

  activeRunMode = "practice";
  activeEncounterCount = Math.max(1, Math.min(ENCOUNTERS_PER_RUN, encounterCount));
  stages = buildRunStages(items, activeEncounterCount, label);
  if (!stages.length) {
    stages = buildPracticeStages(items, label, activeEncounterCount);
  }
  monsterQueue = buildMonsterQueue(activeEncounterCount);
  started = true;
  initAudio();
  startMusic();
  closeTraining();
  els.startOverlay.classList.add("hidden");
  resetRun(true);
  showBanner(label);
}

async function loadQuestions() {
  setLoading("讀取本地題庫中...");
  try {
    const rows = await fetchLocalVocabularyRows();
    const loaded = normalizeRows(rows);
    if (loaded.length === 0) {
      throw new Error("本地題庫沒有可用題目");
    }

    questions = loaded;
    els.sourceStatus.textContent = `本地題庫：${questions.length} 題`;
    els.loadSummary.textContent = `已載入本地題庫 ${questions.length} 題。按下開始冒險查看地區。`;
  } catch (error) {
    questions = normalizeRows(fallbackRows);
    els.sourceStatus.textContent = "使用內建範例題庫";
    els.loadSummary.textContent = `無法讀取本地題庫，已載入 ${questions.length} 題範例。`;
    console.warn("Using fallback vocabulary:", error);
  }

  buildQuestionRegionMap(questions);
  mainStages = buildStages(questions);
  stages = mainStages;
  resetRun(false);
  updateRegionPanel();
  if (!started && questions.length) {
    updateHomeRegionSummary();
  }
  if (!els.trainingOverlay.classList.contains("hidden")) {
    renderTrainingPanel("all");
  }
  els.startButton.disabled = false;
}

async function fetchLocalVocabularyRows() {
  if (typeof window.SPELL_QUEST_VOCABULARY_CSV === "string" && window.SPELL_QUEST_VOCABULARY_CSV.trim()) {
    return parseCsv(window.SPELL_QUEST_VOCABULARY_CSV);
  }

  const response = await fetch(LOCAL_VOCABULARY_PATH, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return parseCsv(await response.text());
}

function setLoading(text) {
  els.sourceStatus.textContent = text;
  els.loadSummary.textContent = text;
  els.startButton.disabled = true;
}

function buildStages(items) {
  const byChapter = new Map();
  for (const item of items) {
    const key = item.chapter || `level-${item.level || "1"}`;
    if (!byChapter.has(key)) {
      byChapter.set(key, []);
    }
    byChapter.get(key).push(item);
  }

  return [...byChapter.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([chapter, entries]) => ({
      chapter,
      questions: buildMixedStageQuestions(entries, items)
    }))
    .filter((stage) => stage.questions.length > 0);
}

function resetRun(showIntro = true) {
  stageIndex = 0;
  questionIndex = 0;
  combo = 0;
  runEncounterIndex = 0;
  runStats = createRunStats();
  playerHp = PLAYER_HP_MAX;
  rewardRequestId += 1;
  els.rewardPop?.classList.remove("active");
  els.captureCard?.classList.add("hidden");
  els.captureCard?.classList.remove("active");
  hideClearCinematic();
  if (monsterQueue.length < activeEncounterCount) {
    monsterQueue = buildMonsterQueue(activeEncounterCount);
  }
  els.runSummaryOverlay?.classList.add("hidden");
  setupStage(showIntro);
  renderHud();
}

function startNormalRun(showIntro = true) {
  activeRunMode = "adventure";
  activeEncounterCount = ENCOUNTERS_PER_RUN;
  const regionIndex = getCurrentRegionIndex();
  const region = REGIONS[regionIndex];
  stages = buildRunStages(getRegionQuestions(regionIndex), activeEncounterCount, region.name);
  monsterQueue = buildMonsterQueue(activeEncounterCount, regionIndex);
  pendingRegionIntro = showIntro;
  resetRun(showIntro);
}

function startWrongReviewRun() {
  const wrongQuestions = runStats.wrongQuestions.slice();
  if (!wrongQuestions.length) {
    return;
  }
  activeEncounterCount = Math.min(REVIEW_ENCOUNTERS_PER_RUN, Math.max(1, wrongQuestions.length));
  stages = buildPracticeStages(wrongQuestions, "錯題重練", activeEncounterCount);
  monsterQueue = buildMonsterQueue(activeEncounterCount);
  initAudio();
  startMusic();
  resetRun(true);
  showBanner("錯題重練");
}

function getMonsterTestQuestion() {
  return questions[0] || {
    id: "monster_test_word",
    enabled: "TRUE",
    pack: "test",
    chapter: "TEST",
    type: "word",
    level: "1",
    en: "sprout",
    zh: "怪物測試",
    tags: "test",
    note: ""
  };
}

function updateMonsterTestButtons() {
  const entries = [
    ["baby", els.testBabyButton],
    ["rookie", els.testRookieButton],
    ["ultimate", els.testUltimateButton]
  ];
  for (const [stage, button] of entries) {
    button?.classList.toggle("active", battleTestStage === stage);
  }
  if (els.testMonsterStatus) {
    const number = String(battleTestMonsterIndex).padStart(2, "0");
    const packStatus = supportsMonsterActionPack(battleTestMonsterIndex)
      ? (battleTestMonsterIndex <= 1
        ? "formal-v1-safe"
        : (battleTestMonsterIndex >= 10 ? "mature-candidate-safe" : "formal-v1-candidate-safe"))
      : "base-only";
    els.testMonsterStatus.textContent = `Monster ${number} · ${getMonsterDisplayName(battleTestMonsterIndex, battleTestStage)} · ${getMonsterEnglishName(battleTestMonsterIndex)} · ${packStatus}`;
  }
  if (els.testMonsterSelect && Number(els.testMonsterSelect.value) !== battleTestMonsterIndex) {
    els.testMonsterSelect.value = String(battleTestMonsterIndex);
  }
}

function populateMonsterTestSelect() {
  if (!els.testMonsterSelect || els.testMonsterSelect.options.length) {
    return;
  }
  for (let index = 0; index < monsterNames.length; index++) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${String(index).padStart(2, "0")} ${getMonsterBaseName(index)} / ${getMonsterEnglishName(index)}`;
    els.testMonsterSelect.appendChild(option);
  }
}

function setMonsterTestMonster(index) {
  if (!Number.isFinite(index)) {
    return;
  }
  battleTestMonsterIndex = (Math.round(index) + monsterNames.length) % monsterNames.length;
  monsterQueue = [battleTestMonsterIndex];
  updateMonsterTestButtons();
  resetCanvasBattleState();
  applyMonsterVariant(0);
  triggerCanvasEncounterIntro();
  showBanner(`Monster ${String(battleTestMonsterIndex).padStart(2, "0")} ${getMonsterDisplayName(battleTestMonsterIndex, battleTestStage)}`);
  renderHud();
}

function setMonsterTestStage(stage) {
  if (!EVOLUTION_STAGES.includes(stage)) {
    return;
  }
  battleTestStage = stage;
  updateMonsterTestButtons();
  resetCanvasBattleState();
  applyMonsterVariant(0);
  triggerCanvasEncounterIntro();
  showBanner(`測試 ${getMonsterEvolutionLabel(stage)}`);
  renderHud();
}

function startMonsterBattleTest() {
  battleTestMode = true;
  activeRunMode = "test";
  battleTestMonsterIndex = 0;
  battleTestStage = "baby";
  activeEncounterCount = 1;
  stages = [{
    chapter: "Monster Test",
    questions: [getMonsterTestQuestion()]
  }];
  monsterQueue = [battleTestMonsterIndex];
  started = true;
  initAudio();
  startMusic();
  closeTraining();
  closeDex();
  els.runSummaryOverlay?.classList.add("hidden");
  els.startOverlay.classList.add("hidden");
  document.body.classList.add("monster-test-mode");
  els.monsterTestPanel?.classList.remove("hidden");
  populateMonsterTestSelect();
  resetRun(true);
  setMonsterTestStage("baby");
}

function exitMonsterBattleTest() {
  battleTestMode = false;
  document.body.classList.remove("monster-test-mode");
  els.monsterTestPanel?.classList.add("hidden");
  returnHome();
}

function triggerMonsterTestAction(action) {
  if (!battleTestMode) {
    return;
  }
  if (action === "intro") {
    resetCanvasBattleState();
    triggerCanvasEncounterIntro();
    showBanner("進場測試");
    return;
  }
  if (action === "hit") {
    resetCanvasBattleState();
    triggerHit(88, "finisher");
    els.feedbackLine.textContent = "受擊測試：定格、白閃、爆炸與鏡頭震動。";
    els.feedbackLine.className = "feedback-line good";
    return;
  }
  if (action === "defeat") {
    resetCanvasBattleState();
    triggerCanvasDefeat();
    playTone("victory");
    showBanner("擊敗測試");
    els.feedbackLine.textContent = "擊敗測試：怪物倒下與淡出。";
    els.feedbackLine.className = "feedback-line good";
    return;
  }
  if (action === "capture") {
    showCaptureCard(battleTestMonsterIndex);
    showReward("收服展示", `${getMonsterDisplayName(battleTestMonsterIndex, battleTestStage)} ${getMonsterEvolutionLabel(battleTestStage)}`, "capture");
    return;
  }
  if (action === "evolution") {
    resetCanvasBattleState();
    showReward("進化展示", `${getMonsterDisplayName(battleTestMonsterIndex, battleTestStage)} ${getMonsterEvolutionLabel(battleTestStage)}`, "evolution");
    triggerCanvasEncounterIntro();
  }
}

function setupStage(showIntro = true) {
  const flowId = ++encounterFlowId;
  const boss = isBossEncounter();
  setBattlePhase("listen");
  const act = getRunActInfo();
  const bannerText = boss ? "完全體 Boss 來襲！" : act.label;
  const scale = 1 + act.actIndex * 0.28 + act.localIndex * 0.05;
  monsterMaxHp = Math.round(MONSTER_HP_BASE * scale * (boss ? 1.85 : 1));
  monsterHp = monsterMaxHp;
  questionIndex = 0;
  acceptingInput = false;
  resetCanvasBattleState();
  hideAnswerCallout();
  els.answerDisplay.replaceChildren();
  els.letterBank.replaceChildren();
  els.feedbackLine.textContent = "";
  els.monster.classList.remove("defeat");
  els.monster.classList.toggle("boss", boss);
  applyMonsterVariant(stageIndex);
  renderHud();
  pendingEncounterGreeting = showIntro && !battleTestMode ? getRandomGreeting() : "";
  const beginQuestion = () => {
    if (flowId !== encounterFlowId) {
      return;
    }
    showScoutOverlay(() => {
      if (flowId === encounterFlowId) {
        loadQuestion();
      }
    });
  };
  const beginEncounter = () => {
    if (flowId !== encounterFlowId) {
      return;
    }
    startMusic(boss ? "boss" : getRegionMusicTrackId());
    triggerCanvasEncounterIntro();
    if (boss) {
      triggerCanvasBossIntro();
    }
    if (showIntro) {
      showBanner(bannerText);
    }
    const scoutDelay = showIntro && !battleTestMode ? (boss ? BOSS_SCOUT_DELAY_MS : ENCOUNTER_SCOUT_DELAY_MS) : 0;
    if (scoutDelay > 0) {
      window.setTimeout(beginQuestion, scoutDelay);
    } else {
      beginQuestion();
    }
  };
  if (pendingRegionIntro && activeRunMode === "adventure" && runEncounterIndex === 0) {
    pendingRegionIntro = false;
    showRegionIntro();
    window.setTimeout(beginEncounter, REGION_INTRO_TO_BATTLE_DELAY_MS);
  } else {
    beginEncounter();
  }
}

function getStage() {
  return stages[stageIndex % stages.length];
}

function isScoutEnabled() {
  return started && progress.scoutEnabled !== false && !battleTestMode;
}

function getScoutStatus(question) {
  const word = progress.words[getWordKey(question)] || { correct: 0, wrong: 0, streak: 0, seen: 0, mastered: false };
  if (word.wrong > 0 && !word.mastered) {
    return "錯題";
  }
  if (word.seen === 0) {
    return "新字";
  }
  if (word.mastered) {
    return "已掌握";
  }
  return "練習中";
}

function getScoutQuestions() {
  const stage = getStage();
  const seen = new Set();
  return (stage?.questions || []).filter((question) => {
    const key = getWordKey(question);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).slice(0, 6);
}

function showScoutOverlay(onContinue) {
  const items = getScoutQuestions();
  if (!isScoutEnabled() || !items.length || !els.scoutOverlay || !els.scoutList) {
    onContinue();
    return;
  }

  acceptingInput = false;
  scoutContinueCallback = onContinue;
  scoutOverlayMode = "prompt";
  const boss = isBossEncounter();
  const monsterIndex = getMonsterIndex();
  const monsterName = getMonsterDisplayName(monsterIndex, getEncounterMonsterStage(monsterIndex));
  els.scoutOverlay.dataset.mode = scoutOverlayMode;
  if (els.scoutTitle) {
    els.scoutTitle.textContent = boss ? "BOSS SCAN" : "ALLY COMMS";
  }
  if (els.scoutSubtitle) {
    els.scoutSubtitle.textContent = `偵測到 ${monsterName}，要先查看可能考的單字嗎？`;
  }
  if (els.scoutSkipButton) {
    els.scoutSkipButton.textContent = "略過偵查";
  }
  if (els.scoutStartButton) {
    els.scoutStartButton.textContent = "查看情報";
  }
  els.scoutList.replaceChildren();
  for (const question of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scout-word-card";
    button.innerHTML = `
      <span>${getScoutStatus(question)}</span>
      <strong></strong>
      <em></em>
    `;
    button.querySelector("strong").textContent = question.en;
    button.querySelector("em").textContent = question.zh;
    button.addEventListener("click", () => {
      initAudio();
      speakText(question.en);
      playTone("spellTick");
    });
    els.scoutList.appendChild(button);
  }
  refreshMonsterCalloutPosition();
  els.scoutOverlay.classList.remove("hidden", "active");
  void els.scoutOverlay.offsetWidth;
  els.scoutOverlay.classList.add("active");
  playTone(boss ? "regionClear" : "areaClear");
}

function showScoutIntel() {
  if (!els.scoutOverlay || !els.scoutSubtitle) {
    return;
  }
  const boss = isBossEncounter();
  const monsterIndex = getMonsterIndex();
  const monsterName = getMonsterDisplayName(monsterIndex, getEncounterMonsterStage(monsterIndex));
  scoutOverlayMode = "intel";
  els.scoutOverlay.dataset.mode = scoutOverlayMode;
  if (els.scoutTitle) {
    els.scoutTitle.textContent = boss ? "BOSS INTEL" : "SCOUT INTEL";
  }
  els.scoutSubtitle.textContent = `${monsterName} 可能考這些單字，點卡片可聽發音。`;
  if (els.scoutSkipButton) {
    els.scoutSkipButton.hidden = true;
  }
  if (els.scoutStartButton) {
    els.scoutStartButton.textContent = "開始戰鬥";
  }
  playTone("spellTick");
}

function hideScoutOverlay() {
  if (!els.scoutOverlay) {
    return;
  }
  els.scoutOverlay.classList.add("hidden");
  els.scoutOverlay.classList.remove("active");
  els.scoutOverlay.dataset.mode = "";
  scoutOverlayMode = "prompt";
  if (els.scoutSkipButton) {
    els.scoutSkipButton.hidden = false;
  }
  scoutContinueCallback = null;
}

function continueFromScout() {
  const callback = scoutContinueCallback;
  hideScoutOverlay();
  if (callback) {
    callback();
  }
}

function handleScoutPrimaryAction() {
  if (scoutOverlayMode === "prompt") {
    showScoutIntel();
    return;
  }
  continueFromScout();
}

function loadQuestion() {
  if (!stages.length) {
    return;
  }

  setBattlePhase("listen");
  setWordLockVisible(false);
  const stage = getStage();
  currentQuestion = stage.questions[questionIndex % stage.questions.length];
  answerTokens = tokenizeAnswer(currentQuestion.en);
  answerLetters = answerTokens.filter((token) => token.kind === "letter");
  selectedLetters = [];
  currentQuestionDamage = createQuestionDamagePlan();
  acceptingInput = playerHp > 0;
  renderQuestion();
  renderHud();

  if (battleTestMode) {
    acceptingInput = false;
    setBattlePhase("listen");
    els.feedbackLine.textContent = "測試模式：切換階段或觸發動作來檢查第 1 隻怪物素材。";
    els.feedbackLine.className = "feedback-line";
    return;
  }

  if (started) {
    acceptingInput = false;
    beginQuestionDialogue(currentQuestion);
  }
}

function tokenizeAnswer(answer) {
  let letterIndex = 0;
  return Array.from(answer).map((char) => {
    if (/[a-z]/i.test(char)) {
      const token = {
        kind: "letter",
        value: char,
        match: char.toLowerCase(),
        letterIndex
      };
      letterIndex += 1;
      return token;
    }
    return { kind: "fixed", value: char };
  });
}

function getAnswerLetters(answer) {
  return Array.from(answer)
    .filter((char) => /[a-z]/i.test(char))
    .map((char) => char.toLowerCase());
}

function renderQuestion() {
  hideAnswerCallout();
  els.zhPrompt.textContent = currentQuestion.zh;
  els.questionType.textContent = currentQuestion.type;
  els.chapterLabel.textContent = currentQuestion.chapter;
  els.tagLabel.textContent = currentQuestion.tags || `Level ${currentQuestion.level}`;
  els.feedbackLine.textContent = "聽發音，看中文，依序點字母。";
  els.feedbackLine.className = "feedback-line";
  els.masteryLabel.textContent = getMasteryText(currentQuestion);

  renderAnswer(false);
  renderLetterBank();
}

function showMonsterCallout(text, options = {}) {
  if (!els.answerCallout) {
    return;
  }
  const monsterIndex = getMonsterIndex();
  const speaker = options.speaker || getMonsterDisplayName(monsterIndex, getEncounterMonsterStage(monsterIndex));
  if (els.answerCalloutSpeaker) {
    els.answerCalloutSpeaker.textContent = speaker;
    els.answerCalloutSpeaker.hidden = options.showSpeaker !== true;
  }
  if (els.answerCalloutText) {
    els.answerCalloutText.textContent = text;
  }
  if (calloutTimer) {
    window.clearTimeout(calloutTimer);
    calloutTimer = null;
  }
  clearCalloutSfxTimers();
  refreshMonsterCalloutPosition();
  playCalloutSfxSequence(text, options.sfx || "talk");
  els.answerCallout.classList.remove("hidden", "active");
  void els.answerCallout.offsetWidth;
  els.answerCallout.classList.add("active");
  if (options.duration) {
    calloutTimer = window.setTimeout(hideAnswerCallout, options.duration);
  }
}

function clearDialogueTimers() {
  for (const timer of dialogueTimers) {
    window.clearTimeout(timer);
  }
  dialogueTimers = [];
}

function clearCalloutSfxTimers() {
  for (const timer of calloutSfxTimers) {
    window.clearTimeout(timer);
  }
  calloutSfxTimers = [];
}

function queueDialogue(callback, delay) {
  const timer = window.setTimeout(() => {
    dialogueTimers = dialogueTimers.filter((item) => item !== timer);
    callback();
  }, delay);
  dialogueTimers.push(timer);
  return timer;
}

function getRandomGreeting() {
  const pool = isBossEncounter() ? BOSS_GREETINGS : MONSTER_GREETINGS;
  return pool[Math.floor(Math.random() * pool.length)] || "來挑戰我吧！";
}

function pickRandomLine(lines, fallback = "") {
  return lines[Math.floor(Math.random() * lines.length)] || fallback;
}

function getCorrectBanterLine() {
  return pickRandomLine(
    isBossEncounter() ? BOSS_CORRECT_BANTER : MONSTER_CORRECT_BANTER,
    "剛剛表現不錯嘛！"
  );
}

function getRetryBanterLine() {
  return pickRandomLine(
    isBossEncounter() ? BOSS_RETRY_BANTER : MONSTER_RETRY_BANTER,
    "再給你一次機會！"
  );
}

function getSpellingText(answer, visibleCount = null) {
  const letters = getAnswerLetters(answer);
  const shown = visibleCount == null ? letters : letters.slice(0, visibleCount);
  return shown.map((letter) => letter.toUpperCase()).join("   ");
}

function showQuestionCallout(question) {
  if (!question) {
    return;
  }
  setWordLockVisible(true);
  triggerCanvasQuestionPose();
  showMonsterCallout(`${question.zh} 的英文是什麼？`, { sfx: "question" });
}

function showAnswerCallout(answer) {
  showMonsterCallout(`記住，是 ${answer.toUpperCase()}`, { sfx: "answer" });
}

function showCorrectBanterCallout() {
  triggerCanvasQuestionPose();
  showMonsterCallout(getCorrectBanterLine(), { duration: 1250, sfx: "praise" });
}

function showRetryBanterCallout() {
  triggerCanvasQuestionPose();
  showMonsterCallout(getRetryBanterLine(), { duration: 1450, sfx: "retry" });
}

function beginQuestionDialogue(question) {
  clearDialogueTimers();
  const greeting = pendingEncounterGreeting;
  pendingEncounterGreeting = "";
  const questionDelay = greeting ? 1450 : 0;
  if (greeting) {
    showMonsterCallout(greeting, { sfx: "greeting" });
  }
  queueDialogue(() => {
    if (currentQuestion === question) {
      showQuestionCallout(question);
      requestSpeechForCurrentQuestion();
    }
  }, questionDelay);
  queueDialogue(() => {
    if (currentQuestion === question && playerHp > 0) {
      acceptingInput = true;
      setBattlePhase("spell");
    }
  }, questionDelay + 780);
}

function beginWrongAnswerDialogue(question) {
  const answer = question.en;
  const letters = getAnswerLetters(answer);
  const spellStartMs = 1900;
  const spellStepMs = 950;
  const spellEndPadMs = 1400;
  const finalAnswerMs = spellStartMs + letters.length * spellStepMs + 260;
  const retryBanterMs = finalAnswerMs + 1250;
  clearDialogueTimers();
  queueDialogue(() => {
    if (currentQuestion === question) {
      showAnswerCallout(answer);
    }
  }, 360);
  queueDialogue(() => {
    if (currentQuestion === question) {
      speakText(answer);
    }
  }, 720);
  letters.forEach((letter, index) => {
    queueDialogue(() => {
      if (currentQuestion === question) {
        showMonsterCallout(getSpellingText(answer, index + 1), { sfx: "spell" });
        speakLetterName(letter);
        playTone("spellTick");
      }
    }, spellStartMs + index * spellStepMs);
  });
  queueDialogue(() => {
    if (currentQuestion === question) {
      showAnswerCallout(answer);
      speakText(answer, { rate: 0.76, pitch: 1.04 });
    }
  }, finalAnswerMs);
  queueDialogue(() => {
    if (currentQuestion === question && playerHp > 0) {
      showRetryBanterCallout();
    }
  }, retryBanterMs);
  return retryBanterMs + spellEndPadMs;
}

function hideAnswerCallout() {
  clearDialogueTimers();
  clearCalloutSfxTimers();
  if (calloutTimer) {
    window.clearTimeout(calloutTimer);
    calloutTimer = null;
  }
  els.answerCallout?.classList.remove("active");
  els.answerCallout?.classList.add("hidden");
}

function renderAnswer(revealAnswer) {
  els.answerDisplay.replaceChildren();
  for (const token of answerTokens) {
    const node = document.createElement("span");
    if (token.kind === "letter") {
      node.className = "answer-slot";
      if (revealAnswer || selectedLetters.length > token.letterIndex) {
        node.textContent = token.value.toUpperCase();
        node.classList.add("filled");
      }
    } else {
      node.className = token.value === " " ? "fixed-char space" : "fixed-char";
      node.textContent = token.value === " " ? "" : token.value;
    }
    els.answerDisplay.appendChild(node);
  }
}

function renderLetterBank() {
  els.letterBank.replaceChildren();
  const answerPool = answerLetters.map((token, index) => ({
    id: `${token.match}_${index}_${Math.random().toString(16).slice(2)}`,
    char: token.value,
    match: token.match,
    distractor: false
  }));
  const distractorPool = getDistractorLetters(currentQuestion).map((char, index) => ({
    id: `distractor_${char}_${index}_${Math.random().toString(16).slice(2)}`,
    char,
    match: char.toLowerCase(),
    distractor: true
  }));
  const pool = shuffle([...answerPool, ...distractorPool]);
  els.letterBank.classList.toggle("compact", pool.length > 12);
  els.letterBank.classList.toggle("dense", pool.length > 18);

  for (const item of pool) {
    const button = document.createElement("button");
    button.className = "letter-button";
    if (item.distractor) {
      button.classList.add("distractor");
    }
    button.type = "button";
    button.textContent = item.char.toUpperCase();
    button.dataset.match = item.match;
    button.addEventListener("click", () => chooseLetter(button));
    els.letterBank.appendChild(button);
  }
}

function getDistractorLetters(question) {
  if (!question) {
    return [];
  }
  const word = getWordProgress(question);
  const answerSet = new Set(answerLetters.map((token) => token.match));
  const base = Math.min(3, Math.floor(runEncounterIndex / 2) + 1);
  const bossBonus = isBossEncounter() ? 3 : 0;
  const masteryBonus = word.mastered ? 2 : (word.streak >= 2 ? 1 : 0);
  const newWordRelief = word.seen === 0 ? 1 : 0;
  const count = Math.max(0, Math.min(7, base + bossBonus + masteryBonus - newWordRelief));
  const confusingPairs = {
    b: "d", d: "b", p: "q", q: "p", m: "n", n: "m",
    a: "e", e: "a", i: "y", y: "i", c: "k", k: "c"
  };
  const candidates = [];

  for (const token of answerLetters) {
    const paired = confusingPairs[token.match];
    if (paired && !answerSet.has(paired)) {
      candidates.push(paired);
    }
  }

  for (const char of "etaoinshrdlucmfwypvbgkjqxz") {
    if (!answerSet.has(char)) {
      candidates.push(char);
    }
  }

  return shuffle(candidates).slice(0, count);
}

function getQuestionDamageBudget() {
  const projectedCombo = combo + 1;
  const baseDamage = 30 + Math.min(projectedCombo, 6) * 9;
  return isBossEncounter() ? Math.round(baseDamage * 1.12) : baseDamage;
}

function createQuestionDamagePlan() {
  const letters = Math.max(1, answerLetters.length);
  const total = getQuestionDamageBudget();
  const letterPool = Math.max(letters, Math.round(total * LETTER_DAMAGE_SHARE));
  return {
    total,
    dealt: 0,
    letterDamage: Math.max(1, Math.floor(letterPool / letters))
  };
}

function applyLetterHit() {
  if (!currentQuestionDamage) {
    currentQuestionDamage = createQuestionDamagePlan();
  }
  const remainingLetters = Math.max(1, answerLetters.length - selectedLetters.length);
  const remainingLetterPool = Math.max(0, Math.round(currentQuestionDamage.total * LETTER_DAMAGE_SHARE) - currentQuestionDamage.dealt);
  const planned = Math.max(1, Math.ceil(remainingLetterPool / remainingLetters));
  const damage = Math.min(planned, Math.max(0, monsterHp - 1));
  currentQuestionDamage.dealt += damage;
  if (damage > 0) {
    monsterHp = Math.max(1, monsterHp - damage);
    triggerHit(damage, "letter");
  } else {
    triggerHit(1, "letter");
  }
  renderHud();
}

function getRemainingQuestionDamage() {
  if (!currentQuestionDamage) {
    currentQuestionDamage = createQuestionDamagePlan();
  }
  return Math.max(1, currentQuestionDamage.total - currentQuestionDamage.dealt);
}

function chooseLetter(button) {
  if (!acceptingInput || !currentQuestion || button.classList.contains("used")) {
    return;
  }

  const next = answerLetters[selectedLetters.length];
  if (!next) {
    return;
  }

  if (button.dataset.match === next.match) {
    button.classList.add("used");
    selectedLetters.push(button.dataset.match);
    renderAnswer(false);

    if (selectedLetters.length === answerLetters.length) {
      acceptingInput = false;
      window.setTimeout(completeQuestion, 90);
    } else {
      applyLetterHit();
    }
  } else {
    failQuestion(button);
  }
}

function failQuestion(button) {
  acceptingInput = false;
  setBattlePhase("spell");
  recordWordResult(currentQuestion, false);
  runStats.wrong += 1;
  runStats.retries += 1;
  rememberWrongQuestion(currentQuestion);
  combo = 0;
  playerHp = Math.max(0, playerHp - WRONG_DAMAGE);
  button.classList.remove("wrong");
  void button.offsetWidth;
  button.classList.add("wrong");
  renderAnswer(true);
  renderHud();
  playTone("wrong");
  triggerEnemyCounterAttack();

  els.feedbackLine.textContent = `怪物反擊！正確答案是 ${currentQuestion.en}`;
  els.feedbackLine.className = "feedback-line bad";
  const retryDelay = beginWrongAnswerDialogue(currentQuestion);

  if (playerHp <= 0) {
    window.setTimeout(gameOver, Math.max(1800, retryDelay));
    return;
  }

  window.setTimeout(retryQuestion, retryDelay);
}

function retryQuestion() {
  selectedLetters = [];
  hideAnswerCallout();
  acceptingInput = false;
  setBattlePhase("listen");
  renderAnswer(false);
  renderLetterBank();
  renderHud();
  els.masteryLabel.textContent = getMasteryText(currentQuestion);
  els.feedbackLine.textContent = "再聽一次，照順序反擊！";
  els.feedbackLine.className = "feedback-line";
  showQuestionCallout(currentQuestion);
  requestSpeechForCurrentQuestion();
  window.setTimeout(() => {
    if (currentQuestion && playerHp > 0) {
      acceptingInput = true;
      setBattlePhase("spell");
    }
  }, 780);
}

function completeQuestion() {
  acceptingInput = false;
  hideAnswerCallout();
  setWordLockVisible(false);
  setBattlePhase("attack");
  const answeredQuestion = currentQuestion;
  const masteryBefore = { ...getWordProgress(currentQuestion) };
  recordWordResult(currentQuestion, true);
  const masteryReward = getMasteryReward(currentQuestion, masteryBefore, getWordProgress(currentQuestion));
  if (masteryReward) {
    addRunReward("熟練度提升", masteryReward, "mastery");
  }
  runStats.correct += 1;
  combo += 1;
  runStats.maxCombo = Math.max(runStats.maxCombo, combo);
  const actualDamage = Math.min(monsterHp, getRemainingQuestionDamage());
  monsterHp = Math.max(0, monsterHp - actualDamage);
  const skill = getComboSkill(monsterHp <= 0);

  els.feedbackLine.textContent = getHitFeedback(skill, currentQuestion.en);
  els.feedbackLine.className = "feedback-line good";
  triggerHit(actualDamage, skill);
  if (masteryReward) {
    window.setTimeout(() => showReward("熟練度提升", masteryReward, "mastery"), 360);
  }
  renderHud();

  if (monsterHp <= 0) {
    window.setTimeout(defeatMonster, getAttackTiming(skill).defeatDelay);
    return;
  }

  questionIndex += 1;
  const timing = getAttackTiming(skill);
  const banterDelay = Math.max(760, timing.impactDelay + 360);
  const nextQuestionDelay = banterDelay + 1280;
  window.setTimeout(() => {
    if (currentQuestion === answeredQuestion && monsterHp > 0) {
      showCorrectBanterCallout();
    }
  }, banterDelay);
  window.setTimeout(() => {
    if (currentQuestion === answeredQuestion && monsterHp > 0) {
      loadQuestion();
    }
  }, nextQuestionDelay);
}

function getComboSkill(isFinisher) {
  if (isBossEncounter() && isFinisher) {
    return "finisher";
  }
  if (combo >= 5) {
    return "double";
  }
  if (combo >= 3) {
    return "power";
  }
  return "normal";
}

function getHitFeedback(skill, answer) {
  if (skill === "finisher") {
    return `終結大招！${answer}`;
  }
  if (skill === "double") {
    return `雙重爆擊！${answer}`;
  }
  if (skill === "power") {
    return `強力射擊！${answer}`;
  }
  return `命中！${answer}`;
}

function defeatMonster() {
  acceptingInput = false;
  showMonsterCallout("可惡，我還會再變強的！", { duration: 1500, sfx: "defeat" });
  setBattlePhase("advance");
  playTone("victory");
  els.monster.classList.add("defeat");
  triggerCanvasDefeat();
  const defeatedBoss = isBossEncounter();
  const monsterIndex = getMonsterIndex();
  const monsterStage = getEncounterMonsterStage(monsterIndex);
  const monsterName = getMonsterDisplayName(monsterIndex, monsterStage);
  const clearedRegion = REGIONS[getCurrentRegionIndex()];
  const capturedNow = captureMonster(monsterIndex);
  const unlockStatus = defeatedBoss ? getRegionUnlockStatus(getCurrentRegionIndex()) : null;
  const unlockedRegionNow = defeatedBoss && unlockNextRegion();
  const nextRegion = REGIONS[getCurrentRegionIndex()];
  runStats.monsters += 1;
  if (capturedNow) {
    runStats.captured += 1;
    runStats.capturedMonsters.push(monsterIndex);
    addRunReward("新收服", monsterName, "capture", { monsterIndex });
  }
  const growth = awardMonsterGrowth(monsterIndex, { capturedNow, defeatedBoss });
  runStats.monsterExp += growth.expGain;
  runStats.monsterShards += growth.shardGain;
  runStats.monsterLevelUps += growth.levelUps;
  runStats.monsterStarUps += growth.starUps;
  if (growth.evolved) {
    runStats.evolved += 1;
    runStats.evolvedMonsters.push({ monsterIndex, stage: growth.afterStage });
  }
  addRunReward("怪物 EXP", `${monsterName} +${growth.expGain} EXP`, "growth", { monsterIndex });
  if (growth.levelUps > 0) {
    addRunReward("等級提升", `${monsterName} Lv.${growth.after.level}`, "growth", { monsterIndex });
  }
  if (growth.starUps > 0) {
    addRunReward("升星成功", `${monsterName} ${getMonsterStarText(growth.after)}`, "growth", { monsterIndex });
  }
  if (growth.evolved) {
    addRunReward("進化成功", `${getMonsterDisplayName(monsterIndex, growth.afterStage)} ${getMonsterEvolutionLabel(growth.afterStage)}`, "evolution", { monsterIndex, stage: growth.afterStage });
  }
  if (unlockedRegionNow) {
    addRunReward("新地區", nextRegion.name, "region");
  } else if (defeatedBoss && unlockStatus && !unlockStatus.ready && getCurrentRegionIndex() < REGIONS.length - 1) {
    addRunReward("解鎖條件", unlockStatus.text, "region");
  }
  updateProgressLabels();
  showBanner(unlockedRegionNow ? "新地區解鎖！" : (defeatedBoss ? "Boss 擊破！" : (capturedNow ? "收服成功！" : "再次擊敗！")));
  if (unlockedRegionNow) {
    showReward("新地區解鎖！", nextRegion.name, "region");
  } else if (defeatedBoss && unlockStatus && !unlockStatus.ready && getCurrentRegionIndex() < REGIONS.length - 1) {
    showReward("還差一點！", unlockStatus.text, "region");
  } else if (capturedNow) {
    showReward("收服成功！", monsterName, "capture");
    if (!defeatedBoss) {
      window.setTimeout(() => showCaptureCard(monsterIndex), 260);
    }
  } else if (growth.evolved) {
    showReward("進化成功！", `${getMonsterDisplayName(monsterIndex, growth.afterStage)} ${getMonsterEvolutionLabel(growth.afterStage)}`, "evolution");
  } else if (growth.levelUps > 0 || growth.starUps > 0) {
    showReward("養成成功！", `${monsterName} Lv.${growth.after.level} ${getMonsterStarText(growth.after)}`, "growth");
  } else {
    showReward(`+${growth.expGain} EXP`, monsterName, "growth");
  }
  questionIndex += 1;

  window.setTimeout(() => {
    triggerAdvance();
    showBanner("前進！");
  }, ADVANCE_START_DELAY_MS);

  window.setTimeout(() => {
    triggerTravelCut();
  }, ADVANCE_CUT_START_DELAY_MS);

  window.setTimeout(() => {
    if (defeatedBoss) {
      awardRunCompletionMaterials();
      showClearCinematic({ clearedRegion, nextRegion, unlockedRegionNow, unlockStatus });
      window.setTimeout(() => {
        hideClearCinematic();
        showRunSummary();
      }, 2450);
      return;
    }
    stageIndex = (stageIndex + 1) % stages.length;
    runEncounterIndex += 1;
    advancePulse += 1;
    setupStage(true);
  }, defeatedBoss ? ADVANCE_BOSS_CLEAR_DELAY_MS : ADVANCE_NEXT_ENCOUNTER_DELAY_MS);
}

function skipQuestion() {
  if (!acceptingInput || !currentQuestion) {
    return;
  }
  acceptingInput = false;
  hideAnswerCallout();
  setBattlePhase("spell");
  recordWordResult(currentQuestion, false);
  runStats.wrong += 1;
  runStats.skipped += 1;
  rememberWrongQuestion(currentQuestion);
  combo = 0;
  playerHp = Math.max(0, playerHp - WRONG_DAMAGE);
  renderAnswer(true);
  renderHud();
  playTone("wrong");
  triggerPlayerHit();
  els.feedbackLine.textContent = `答案：${currentQuestion.en}`;
  els.feedbackLine.className = "feedback-line bad";

  if (playerHp <= 0) {
    window.setTimeout(gameOver, 850);
    return;
  }

  questionIndex += 1;
  window.setTimeout(loadQuestion, 1350);
}

function gameOver() {
  acceptingInput = false;
  hideAnswerCallout();
  setBattlePhase("spell");
  startMusic("title");
  showBanner("挑戰失敗");
  els.startTitle.textContent = "再挑戰一次";
  els.loadSummary.textContent = `剛剛的答案是 ${currentQuestion.en}。再試一次，怪獸等著你！`;
  els.startButton.textContent = "重新開始";
  els.startButton.disabled = false;
  els.startOverlay.classList.remove("hidden");
}

function showRunSummary() {
  acceptingInput = false;
  hideAnswerCallout();
  startMusic("title");
  const totalAttempts = runStats.correct + runStats.wrong;
  const accuracy = totalAttempts ? Math.round((runStats.correct / totalAttempts) * 100) : 0;
  const currentRegion = REGIONS[getCurrentRegionIndex()];
  const grade = getRunGrade(accuracy, runStats.maxCombo, runStats.wrong);
  els.runSummaryTitle.textContent = "遠征完成！";
  els.runSummaryText.textContent = `擊敗 ${runStats.monsters} 隻怪物，答對率 ${accuracy}%。下一站：${currentRegion.name}`;
  els.summaryMedal.textContent = grade.rank;
  els.summaryRankTitle.textContent = grade.title;
  els.summaryRankDetail.textContent = grade.detail;
  els.nextRunButton.textContent = `挑戰 ${currentRegion.name}`;
  els.runSummaryStats.replaceChildren(
    createSummaryItem("答對", runStats.correct),
    createSummaryItem("重試", runStats.retries),
    createSummaryItem("跳過", runStats.skipped),
    createSummaryItem("最高連擊", runStats.maxCombo),
    createSummaryItem("新收服", runStats.captured),
    createSummaryItem("經驗糖果", `+${runStats.materials.candy}`),
    createSummaryItem("進化能量", `+${runStats.materials.energy}`),
    createSummaryItem("怪物碎片", `+${runStats.materials.shards}`),
    createSummaryItem("怪物EXP", `+${runStats.monsterExp}`),
    createSummaryItem("碎片", `+${runStats.monsterShards}`),
    createSummaryItem("進化", runStats.evolved),
    createSummaryItem("圖鑑", `${getCapturedCount()} / ${monsterNames.length}`),
    createSummaryItem("地區", currentRegion.name)
  );
  renderCaptureShowcase();
  renderRewardHighlights();
  renderWrongReview();
  els.runSummaryOverlay.classList.remove("hidden");
}

function getRunGrade(accuracy, maxCombo, wrong) {
  if (accuracy >= 95 && maxCombo >= 5 && wrong === 0) {
    return { rank: "S", title: "完美遠征！", detail: "反應超快，怪物完全擋不住。" };
  }
  if (accuracy >= 85 && maxCombo >= 4) {
    return { rank: "A", title: "王牌拼字手", detail: "連擊穩定，熟練度正在快速成長。" };
  }
  if (accuracy >= 70) {
    return { rank: "B", title: "穩定突破", detail: "已經抓到節奏，錯題再練一次會更穩。" };
  }
  return { rank: "C", title: "重新整備", detail: "先把錯題補強，下次就能推更遠。" };
}

function renderCaptureShowcase() {
  if (!els.captureShowcase) {
    return;
  }
  els.captureShowcase.replaceChildren();
  const captured = runStats.capturedMonsters.slice(-3);
  if (!captured.length) {
    const empty = document.createElement("div");
    empty.className = "capture-showcase-empty";
    empty.textContent = "這局沒有新收服，下一局再瞄準新怪物！";
    els.captureShowcase.appendChild(empty);
    return;
  }
  for (const monsterIndex of captured) {
    const card = document.createElement("article");
    card.className = "summary-capture-card";
    const img = document.createElement("img");
    const stage = getMonsterEvolutionStage(monsterIndex);
    const displayName = getMonsterDisplayName(monsterIndex, stage);
    img.src = getMonsterActionSpritePath(monsterIndex, stage, "capture");
    img.alt = displayName;
    const title = document.createElement("strong");
    title.textContent = displayName;
    const meta = document.createElement("span");
    const monster = getMonsterProgress(monsterIndex);
    meta.textContent = `Lv.${monster.level} ${getMonsterStarText(monster)}`;
    card.append(img, title, meta);
    els.captureShowcase.appendChild(card);
  }
}

function renderRewardHighlights() {
  if (!els.rewardHighlights) {
    return;
  }
  els.rewardHighlights.replaceChildren();
  const rewards = runStats.rewards.slice(-4);
  if (!rewards.length) {
    const item = document.createElement("div");
    item.className = "reward-highlight normal";
    const title = document.createElement("strong");
    title.textContent = "遠征完成";
    const detail = document.createElement("span");
    detail.textContent = "繼續挑戰可提升熟練度與收服怪物";
    item.append(title, detail);
    els.rewardHighlights.appendChild(item);
    return;
  }
  for (const reward of rewards) {
    const item = document.createElement("div");
    item.className = `reward-highlight ${reward.kind || "normal"}`;
    if ((reward.kind === "capture" || reward.kind === "growth" || reward.kind === "evolution") && Number.isInteger(reward.data?.monsterIndex)) {
      const img = document.createElement("img");
      const rewardStage = reward.data.stage || getMonsterEvolutionStage(reward.data.monsterIndex);
      const rewardAction = reward.kind === "evolution" ? "evolution" : (reward.kind === "capture" ? "capture" : "idle-1");
      img.src = getMonsterActionSpritePath(reward.data.monsterIndex, rewardStage, rewardAction);
      img.alt = "";
      item.appendChild(img);
    }
    const title = document.createElement("strong");
    title.textContent = reward.title;
    const detail = document.createElement("span");
    detail.textContent = reward.detail;
    item.append(title, detail);
    els.rewardHighlights.appendChild(item);
  }
}

function renderWrongReview() {
  const wrongQuestions = runStats.wrongQuestions.slice(0, 6);
  els.wrongList.replaceChildren();
  if (!wrongQuestions.length) {
    els.wrongReview.classList.add("hidden");
    els.retryWrongButton.hidden = true;
    return;
  }

  els.wrongReview.classList.remove("hidden");
  els.retryWrongButton.hidden = false;
  for (const question of wrongQuestions) {
    const chip = document.createElement("span");
    chip.className = "wrong-chip";
    chip.textContent = `${question.zh} / ${question.en}`;
    els.wrongList.appendChild(chip);
  }
}

function createSummaryItem(label, value) {
  const item = document.createElement("div");
  item.className = "summary-item";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  item.append(strong, span);
  return item;
}

function triggerHit(damage, skill = "normal") {
  triggerCanvasHit(damage, skill);
  const quick = skill === "letter";
  const timing = getAttackTiming(skill);
  els.dungeonFrame.classList.remove("shake");
  els.dungeonFrame.classList.remove("hit-rush");
  els.dungeonFrame.classList.remove("letter-hit");
  els.dungeonFrame.classList.remove("power-hit");
  els.dungeonFrame.classList.remove("double-hit");
  els.dungeonFrame.classList.remove("finisher-hit");
  els.dungeonFrame.classList.remove("cannon-fire");
  els.monster.classList.remove("hit");
  els.slash.classList.remove("active");
  els.impactBurst.classList.remove("active");
  els.projectileLeft.classList.remove("active");
  els.projectileRight.classList.remove("active");
  els.muzzleLeft.classList.remove("active");
  els.muzzleRight.classList.remove("active");
  els.damageText.classList.remove("active");
  void els.dungeonFrame.offsetWidth;

  els.damageText.textContent = damage;
  els.dungeonFrame.classList.add("shake");
  els.dungeonFrame.classList.add("hit-rush");
  els.dungeonFrame.classList.add("cannon-fire");
  playTone(skill === "finisher" || isChargedBeamSkill(skill) ? "chargeShot" : "letterShot");
  if (quick) {
    els.dungeonFrame.classList.add("letter-hit");
  } else if (skill !== "normal") {
    els.dungeonFrame.classList.add(`${skill}-hit`);
    showBanner(getSkillBanner(skill));
  }
  els.muzzleLeft.classList.add("active");
  els.muzzleRight.classList.add("active");
  els.projectileLeft.classList.add("active");
  els.projectileRight.classList.add("active");
  const impactDelay = timing.impactDelay;
  window.setTimeout(() => {
    playTone(skill === "finisher" ? "heavyHit" : (quick ? "letterHit" : "hit"));
    els.monster.classList.add("hit");
    els.slash.classList.add("active");
    els.impactBurst.classList.add("active");
    els.damageText.classList.add("active");
  }, impactDelay);

  window.setTimeout(() => {
    els.dungeonFrame.classList.remove("hit-rush");
    els.dungeonFrame.classList.remove("letter-hit");
    els.dungeonFrame.classList.remove("power-hit");
    els.dungeonFrame.classList.remove("double-hit");
    els.dungeonFrame.classList.remove("finisher-hit");
    els.dungeonFrame.classList.remove("cannon-fire");
  }, timing.clearDelay);
}

function getSkillBanner(skill) {
  if (skill === "finisher") {
    return "終結大招！";
  }
  if (skill === "double") {
    return "雙重爆擊！";
  }
  return "強力射擊！";
}

function triggerAdvance() {
  triggerCanvasAdvance();
  els.dungeonFrame.classList.remove("advance");
  els.speedLines.classList.remove("active");
  void els.dungeonFrame.offsetWidth;
  els.dungeonFrame.classList.add("advance");
  els.speedLines.classList.add("active");
  ADVANCE_STEP_TIMES_MS.forEach((delay, index) => {
    window.setTimeout(() => {
      playTone(index % 2 === 0 ? "tick" : "spellTick");
    }, delay);
  });
  window.setTimeout(() => {
    els.dungeonFrame.classList.remove("advance");
    els.speedLines.classList.remove("active");
  }, ADVANCE_WALK_DURATION_MS);
}

function triggerTravelCut() {
  els.dungeonFrame.classList.remove("travel-cut");
  void els.dungeonFrame.offsetWidth;
  els.dungeonFrame.classList.add("travel-cut");
  playTone("spellTick");
  window.setTimeout(() => {
    els.dungeonFrame.classList.remove("travel-cut");
  }, ADVANCE_CUT_DURATION_MS);
}

function triggerPlayerHit() {
  triggerCanvasPlayerHit();
  els.dungeonFrame.classList.remove("player-hit");
  void els.dungeonFrame.offsetWidth;
  els.dungeonFrame.classList.add("player-hit");
}

function triggerEnemyCounterAttack() {
  triggerCanvasEnemyAttack();
  playMonsterVoiceSfx("attack");
  playTone("enemyCharge");
  window.setTimeout(() => {
    els.dungeonFrame.classList.remove("player-hit");
    void els.dungeonFrame.offsetWidth;
    els.dungeonFrame.classList.add("player-hit");
    playTone("enemyHit");
  }, ENEMY_ATTACK_IMPACT_DELAY_MS);
}

function showBanner(text) {
  els.stageBanner.classList.remove("active");
  void els.stageBanner.offsetWidth;
  els.stageBanner.textContent = text;
  els.stageBanner.classList.add("active");
}

function showRegionIntro() {
  if (!els.regionIntro) {
    return;
  }
  const index = getCurrentRegionIndex();
  const region = REGIONS[index];
  const scene = getRegionScene(index);
  if (els.regionIntroArt) {
    els.regionIntroArt.style.backgroundImage = `linear-gradient(180deg, rgba(10, 11, 18, 0.02), rgba(10, 11, 18, 0.48)), url("${getRegionBackgroundPath(index)}")`;
  }
  if (els.regionIntroRoute) {
    els.regionIntroRoute.textContent = `${region.range} · ${scene.label}`;
  }
  if (els.regionIntroName) {
    els.regionIntroName.textContent = region.name;
  }
  if (els.regionIntroDetail) {
    els.regionIntroDetail.textContent = region.description;
  }
  els.regionIntro.dataset.theme = region.theme || "grassland";
  els.regionIntro.classList.remove("hidden", "active");
  void els.regionIntro.offsetWidth;
  els.regionIntro.classList.add("active");
  window.clearTimeout(regionIntroTimer);
  regionIntroTimer = window.setTimeout(hideRegionIntro, REGION_INTRO_DURATION_MS);
  playTone("areaClear");
}

function hideRegionIntro() {
  if (!els.regionIntro) {
    return;
  }
  els.regionIntro.classList.remove("active");
  window.clearTimeout(regionIntroTimer);
  regionIntroTimer = window.setTimeout(() => {
    els.regionIntro.classList.add("hidden");
  }, 220);
}

function renderHud() {
  if (!stages.length) {
    return;
  }
  const stage = getStage();
  const act = getRunActInfo();
  els.stageLabel.textContent = `${act.name} ${act.localIndex + 1}/${ENCOUNTERS_PER_ACT}`;
  els.comboLabel.textContent = String(combo);
  els.questionProgress.textContent = `${(questionIndex % stage.questions.length) + 1} / ${stage.questions.length}`;
  els.hpFill.style.width = `${Math.max(0, (monsterHp / monsterMaxHp) * 100)}%`;
  els.playerHpFill.style.width = `${Math.max(0, (playerHp / PLAYER_HP_MAX) * 100)}%`;
  updateProgressLabels();
  renderStageTrack();
}

function renderStageTrack() {
  els.stageTrack.replaceChildren();
  els.stageTrack.style.setProperty("--stage-count", activeEncounterCount);
  for (let index = 0; index < activeEncounterCount; index += 1) {
    const node = document.createElement("span");
    node.className = "stage-node";
    if (index % ENCOUNTERS_PER_ACT === 0) {
      node.classList.add("act-start");
    }
    if (index === activeEncounterCount - 1) {
      node.classList.add("boss-node");
    }
    if (index < runEncounterIndex) {
      node.classList.add("done");
    }
    if (index === runEncounterIndex) {
      node.classList.add("active");
    }
    els.stageTrack.appendChild(node);
  }
}

function applyMonsterVariant(index) {
  const monsterIndex = getMonsterIndex(index);
  const stage = getEncounterMonsterStage(monsterIndex);
  const displayName = getMonsterDisplayName(monsterIndex, stage);
  els.monsterName.textContent = isBossEncounter() ? `Boss ${displayName}` : displayName;
  els.monsterSprite.src = getMonsterActionSpritePath(monsterIndex, stage, "idle-1");
  battleRenderState.monsterIndex = monsterIndex;
  battleRenderState.boss = isBossEncounter();
  battleRenderState.evolutionStage = stage;
}

function speakCurrent() {
  if (!currentQuestion) {
    playTone("tick");
    return;
  }
  speakText(currentQuestion.en);
}

function speakText(text, options = {}) {
  if (!text || !("speechSynthesis" in window)) {
    playTone("tick");
    return;
  }
  if (options.cancel !== false) {
    window.speechSynthesis.cancel();
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || SPEECH_LANG;
  utterance.rate = options.rate ?? 0.82;
  utterance.pitch = options.pitch ?? 1.08;
  utterance.volume = options.volume ?? 1;
  window.speechSynthesis.speak(utterance);
}

function speakLetterName(letter) {
  speakText(String(letter || "").toUpperCase(), {
    rate: 0.68,
    pitch: 1.08,
    volume: 0.98
  });
}

function requestSpeechForCurrentQuestion() {
  if (!currentQuestion) {
    return;
  }
  speechRequestId += 1;
  const requestId = speechRequestId;
  window.setTimeout(() => {
    if (currentQuestion && requestId === speechRequestId) {
      speakCurrent();
    }
  }, 520);
}

function initAudio() {
  if (!audioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor) {
      audioContext = new AudioContextCtor();
    }
  }
  if (audioContext?.state === "suspended") {
    audioContext.resume();
  }
}

function getBgmSource(track) {
  if (!track) {
    return "";
  }
  return window.SPELL_QUEST_ASSETS?.bgm?.[track.file] || `${BGM_BASE_PATH}${track.file}`;
}

function getRegionMusicTrackId(regionIndex = getCurrentRegionIndex()) {
  const theme = REGIONS[regionIndex]?.theme || "grassland";
  return REGION_BGM_TRACKS[theme] || "grassland";
}

function getDesiredMusicTrackId() {
  if (isStudyOverlayOpen()) {
    return "study";
  }
  if (!started) {
    return "title";
  }
  if (isBossEncounter()) {
    return "boss";
  }
  return getRegionMusicTrackId();
}

function isStudyOverlayOpen() {
  return Boolean(
    els.trainingOverlay && !els.trainingOverlay.classList.contains("hidden")
  ) || Boolean(
    els.dexOverlay && !els.dexOverlay.classList.contains("hidden")
  );
}

function fadeBgmAudio(audio, targetVolume, duration = BGM_FADE_MS, onComplete = null) {
  if (!audio) {
    onComplete?.();
    return;
  }
  if (audio.spellQuestFadeTimer) {
    window.clearInterval(audio.spellQuestFadeTimer);
    audio.spellQuestFadeTimer = null;
  }
  const startVolume = audio.volume;
  const startTime = performance.now();
  audio.spellQuestFadeTimer = window.setInterval(() => {
    const progress = Math.min(1, (performance.now() - startTime) / duration);
    audio.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress >= 1) {
      window.clearInterval(audio.spellQuestFadeTimer);
      audio.spellQuestFadeTimer = null;
      onComplete?.();
    }
  }, 40);
}

function stopBgmAudio() {
  if (bgmAudio) {
    const oldAudio = bgmAudio;
    bgmAudio = null;
    bgmTrackId = "";
    fadeBgmAudio(oldAudio, 0, 260, () => {
      oldAudio.pause();
      oldAudio.src = "";
    });
  }
}

function startBgmAudio(trackId) {
  const track = BGM_TRACKS[trackId] || BGM_TRACKS.title;
  const source = getBgmSource(track);
  if (!source) {
    return false;
  }

  if (bgmAudio && bgmTrackId === track.id) {
    bgmUsingFallback = false;
    if (bgmAudio.paused) {
      const resumePromise = bgmAudio.play();
      if (resumePromise?.catch) {
        resumePromise.catch(() => startSynthMusic());
      }
    }
    fadeBgmAudio(bgmAudio, BGM_VOLUME, 360);
    return true;
  }

  stopSynthMusic();
  const previousAudio = bgmAudio;
  const nextAudio = new Audio(source);
  nextAudio.loop = true;
  nextAudio.preload = "auto";
  nextAudio.volume = 0;
  bgmAudio = nextAudio;
  bgmTrackId = track.id;
  bgmUsingFallback = false;

  if (previousAudio) {
    fadeBgmAudio(previousAudio, 0, 360, () => {
      previousAudio.pause();
      previousAudio.src = "";
    });
  }

  const playPromise = nextAudio.play();
  if (playPromise?.then) {
    playPromise
      .then(() => {
        if (bgmAudio === nextAudio) {
          fadeBgmAudio(nextAudio, BGM_VOLUME, BGM_FADE_MS);
        }
      })
      .catch((error) => {
        if (bgmAudio === nextAudio) {
          console.warn("MP3 BGM failed; using synth fallback:", error);
          stopBgmAudio();
          startSynthMusic();
        }
      });
  } else {
    fadeBgmAudio(nextAudio, BGM_VOLUME, BGM_FADE_MS);
  }
  return true;
}

function startMusic(trackId = getDesiredMusicTrackId()) {
  if (!musicEnabled) {
    return;
  }
  if (startBgmAudio(trackId)) {
    return;
  }
  startSynthMusic();
}

function startSynthMusic() {
  if (!musicEnabled || !audioContext || musicTimer) {
    return;
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  bgmUsingFallback = true;
  musicGain = audioContext.createGain();
  musicGain.gain.setValueAtTime(0.16, audioContext.currentTime);
  musicGain.connect(audioContext.destination);
  scheduleMusicPhrase();
  musicTimer = window.setInterval(scheduleMusicPhrase, 1800);
}

function stopSynthMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicGain) {
    musicGain.gain.setTargetAtTime(0.001, audioContext?.currentTime || 0, 0.08);
    window.setTimeout(() => {
      musicGain?.disconnect();
      musicGain = null;
    }, 180);
  }
  bgmUsingFallback = false;
}

function stopMusic() {
  stopBgmAudio();
  stopSynthMusic();
}

function refreshSceneMusic() {
  if (musicEnabled) {
    startMusic(getDesiredMusicTrackId());
  }
}

function scheduleMusicPhrase() {
  if (!audioContext || !musicGain) {
    return;
  }

  const now = audioContext.currentTime;
  const melody = [
    [392, 0.00], [523, 0.22], [587, 0.44], [523, 0.66],
    [440, 0.92], [587, 1.14], [659, 1.36], [587, 1.58]
  ];
  const bass = musicStep % 2 === 0 ? 130.81 : 146.83;
  musicStep += 1;

  playMusicNote(bass, now, 1.65, "triangle", 0.7);
  for (const [frequency, offset] of melody) {
    playMusicNote(frequency, now + offset, 0.16, "square", 0.38);
  }
}

function playMusicNote(frequency, startTime, duration, type, volumeScale) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.08 * volumeScale, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.03);
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  updateMusicButtons();
  initAudio();
  if (musicEnabled) {
    startMusic();
  } else {
    stopMusic();
  }
}

function updateMusicButtons() {
  els.musicButton.textContent = musicEnabled ? "音樂 ON" : "音樂 OFF";
  if (els.hudMusicButton) {
    els.hudMusicButton.classList.toggle("muted", !musicEnabled);
    els.hudMusicButton.title = musicEnabled ? "關閉音樂" : "開啟音樂";
    els.hudMusicButton.setAttribute("aria-label", els.hudMusicButton.title);
    const icon = els.hudMusicButton.querySelector("span");
    if (icon) {
      icon.textContent = musicEnabled ? "♪" : "×";
    }
  }
}

function toggleScout() {
  progress.scoutEnabled = progress.scoutEnabled === false;
  saveProgress();
  updateScoutButton();
  playTone("tick");
}

function updateScoutButton() {
  if (!els.scoutToggleButton) {
    return;
  }
  const enabled = progress.scoutEnabled !== false;
  els.scoutToggleButton.textContent = enabled ? "偵查 ON" : "偵查 OFF";
  els.scoutToggleButton.classList.toggle("muted", !enabled);
  els.scoutToggleButton.setAttribute("aria-pressed", String(enabled));
}

function getMonsterVoiceProfile() {
  if (isBossEncounter()) {
    return { base: 145, wave: "sawtooth", tone: "boss", volume: 1.05 };
  }
  const monsterIndex = getMonsterIndex();
  const stage = getEncounterMonsterStage(monsterIndex);
  const stageShift = stage === "ultimate" ? 0.74 : stage === "rookie" ? 0.88 : 1;
  const family = monsterIndex % 5;
  const profiles = [
    { base: 560, wave: "square", tone: "cute", volume: 0.72 },
    { base: 260, wave: "sawtooth", tone: "beast", volume: 0.86 },
    { base: 430, wave: "square", tone: "mech", volume: 0.74 },
    { base: 640, wave: "triangle", tone: "magic", volume: 0.74 },
    { base: 330, wave: "triangle", tone: "calm", volume: 0.78 }
  ];
  const profile = profiles[family] || profiles[0];
  return {
    ...profile,
    base: profile.base * stageShift,
    volume: profile.volume * (stage === "ultimate" ? 1.08 : 1)
  };
}

function playCalloutSfxSequence(text, flavor = "talk") {
  if (flavor === "none" || !audioContext) {
    return;
  }
  if (flavor === "spell") {
    playMonsterVoiceSfx("spell");
    return;
  }
  playMonsterVoiceSfx("pop");

  const emotionMap = {
    greeting: "greeting",
    question: "question",
    answer: "answer",
    praise: "praise",
    retry: "retry",
    defeat: "defeat",
    spell: "spell"
  };
  const emotion = emotionMap[flavor] || "talk";
  if (emotion !== "talk") {
    const timer = window.setTimeout(() => playMonsterVoiceSfx(emotion), 70);
    calloutSfxTimers.push(timer);
  }

  if (flavor === "defeat") {
    return;
  }
  const textLength = Array.from(String(text || "").replace(/\s+/g, "")).length;
  const blipCount = Math.min(6, Math.max(1, Math.ceil(textLength / 7)));
  for (let index = 0; index < blipCount; index += 1) {
    const timer = window.setTimeout(() => {
      playMonsterVoiceSfx("talk", { index, flavor });
    }, 120 + index * 105);
    calloutSfxTimers.push(timer);
  }
}

function playMonsterVoiceSfx(kind, options = {}) {
  if (!audioContext) {
    return;
  }
  if (kind === "talk" && "speechSynthesis" in window && window.speechSynthesis.speaking) {
    return;
  }

  const profile = getMonsterVoiceProfile();
  const now = audioContext.currentTime;
  const voiceRandom = 0.92 + ((performance.now() + (options.index || 0) * 37) % 29) / 180;
  const base = profile.base * voiceRandom;
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  filter.type = profile.tone === "mech" ? "bandpass" : "lowpass";
  filter.frequency.setValueAtTime(profile.tone === "boss" ? 680 : profile.tone === "cute" ? 1800 : 1250, now);
  filter.Q.setValueAtTime(profile.tone === "mech" ? 8 : 1.2, now);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.001, now);

  const configs = {
    pop: { volume: 0.035, notes: [[base * 1.32, 0, 0.035, "triangle"], [base * 1.68, 0.038, 0.04, "triangle"]] },
    talk: { volume: 0.026, notes: [[base * (1 + ((options.index || 0) % 3) * 0.08), 0, 0.038, profile.wave]] },
    greeting: { volume: 0.052, notes: [[base * 0.95, 0, 0.07, profile.wave], [base * 1.18, 0.075, 0.07, profile.wave]] },
    question: { volume: 0.045, notes: [[base * 1.05, 0, 0.055, profile.wave], [base * 1.28, 0.058, 0.065, "triangle"]] },
    answer: { volume: 0.046, notes: [[base * 0.94, 0, 0.08, profile.wave], [base * 0.76, 0.082, 0.08, "triangle"]] },
    praise: { volume: 0.065, notes: [[base * 1.05, 0, 0.055, "triangle"], [base * 1.34, 0.06, 0.06, "triangle"], [base * 1.7, 0.13, 0.085, "triangle"]] },
    retry: { volume: 0.047, notes: [[base * 0.72, 0, 0.09, profile.wave], [base * 0.92, 0.105, 0.08, "triangle"]] },
    attack: { volume: 0.082, notes: [[base * 0.58, 0, 0.22, "sawtooth", base * 0.33]] },
    defeat: { volume: 0.058, notes: [[base * 0.88, 0, 0.09, profile.wave], [base * 0.62, 0.1, 0.1, "triangle"], [base * 0.42, 0.21, 0.12, "triangle"]] },
    spell: { volume: 0.028, notes: [[base * 1.45, 0, 0.04, "triangle"]] }
  };
  const config = configs[kind] || configs.talk;
  const voiceBoost = kind === "talk" ? 4.2 : kind === "spell" ? 3.2 : 4.4;
  const volume = Math.min(0.34, config.volume * profile.volume * voiceBoost);
  const releaseTime = Math.max(...config.notes.map((note) => note[1] + note[2])) + 0.08;

  for (const [frequency, start, duration, wave, endFrequency] of config.notes) {
    const osc = audioContext.createOscillator();
    osc.type = wave || profile.wave;
    osc.frequency.setValueAtTime(Math.max(40, frequency), now + start);
    if (endFrequency) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), now + start + duration);
    }
    osc.connect(filter);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.02);
  }

  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
  window.setTimeout(() => {
    gain.disconnect();
    filter.disconnect();
  }, Math.ceil((releaseTime + 0.12) * 1000));
}

function playTone(kind) {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.001, now);

  const notes = {
    tick: [520, 0.045, 0.045],
    spellTick: [620, 0.04, 0.038],
    wrong: [130, 0.16, 0.13],
    letterShot: [860, 0.045, 0.075],
    letterHit: [260, 0.055, 0.115],
    shot: [760, 0.075, 0.12],
    chargeShot: [520, 0.16, 0.16],
    hit: [180, 0.1, 0.2],
    heavyHit: [110, 0.18, 0.24],
    enemyCharge: [190, 0.16, 0.11],
    enemyHit: [95, 0.18, 0.2],
    victory: [300, 0.22, 0.13],
    areaClear: [392, 0.26, 0.14],
    regionClear: [523, 0.3, 0.16]
  };
  const [frequency, duration, volume] = notes[kind] || notes.tick;

  let releaseTime = duration + 0.08;
  if (kind === "victory" || kind === "areaClear" || kind === "regionClear") {
    const chord = kind === "regionClear" ? [392, 523, 659, 784, 1046] : kind === "areaClear" ? [330, 440, 554, 660] : [300, 380, 500, 680];
    releaseTime = duration + (chord.length - 1) * 0.07 + 0.12;
    chord.forEach((note, index) => {
      const osc = audioContext.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(note, now + index * 0.07);
      osc.connect(gain);
      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + duration);
    });
  } else {
    const osc = audioContext.createOscillator();
    osc.type = kind === "wrong" || kind === "heavyHit" || kind === "enemyHit" ? "sawtooth" : "square";
    osc.frequency.setValueAtTime(frequency, now);
    if (kind === "shot") {
      osc.frequency.exponentialRampToValueAtTime(1180, now + duration);
    }
    if (kind === "chargeShot") {
      osc.frequency.exponentialRampToValueAtTime(940, now + duration);
    }
    if (kind === "hit" || kind === "heavyHit") {
      osc.frequency.exponentialRampToValueAtTime(90, now + duration);
    }
    if (kind === "letterHit" || kind === "enemyHit") {
      osc.frequency.exponentialRampToValueAtTime(70, now + duration);
    }
    if (kind === "enemyCharge") {
      osc.frequency.exponentialRampToValueAtTime(360, now + duration);
    }
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
  }

  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function drawDungeon(time) {
  if (!ctx) {
    return;
  }

  const rect = els.canvas.getBoundingClientRect();
  const ratio = els.canvas.width / Math.max(1, rect.width);
  const width = rect.width || els.canvas.width;
  const height = rect.height || els.canvas.height;
  const layout = getBattleLayout(width, height);
  const t = (time - animationStart) / 1000;
  const advanceMotion = getAdvanceMotion(time);
  const playerHitPulse = getTimedPulse(battleRenderState.playerHitStart, 360, time);

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);

  const shake = getCanvasCameraShake(time);
  updateMonsterCalloutPosition(layout, height, t, time);
  ctx.save();
  ctx.translate(shake.x, shake.y);
  drawCanvasBackground(width, height, layout, t, advanceMotion);
  drawCanvasSpeedLines(layout, height, advanceMotion);
  drawCanvasAdvanceForeground(layout, height, advanceMotion);
  drawCanvasEncounterIntro(layout, height, time);
  drawCanvasBossIntroWarning(layout, height, time);
  drawCanvasMonster(layout, height, t, time);
  drawCanvasEnemyAttackFocus(layout, height, time);
  drawCanvasAttack(layout, height, time);
  drawCanvasCrosshair(layout, height, t, advanceMotion);
  drawCanvasCannons(layout, height, t, time, advanceMotion);
  ctx.restore();
  drawCanvasPlayerHit(width, height, playerHitPulse);

  requestAnimationFrame(drawDungeon);
}

function drawCanvasBackground(width, height, layout, t, advanceMotion) {
  const advancePulse = advanceMotion.pulse || 0;
  const forward = advanceMotion.forward || 0;
  const step = advanceMotion.step || 0;
  const sway = advanceMotion.sway || 0;
  const scene = getCurrentRegionScene();
  const bg = getBattleImage(getLayerAssetPath(scene.background || "bg-clean.png"));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, layout.battleWidth, height);
  ctx.clip();
  ctx.fillStyle = scene.sky || "#5f99de";
  ctx.fillRect(0, 0, layout.battleWidth, height);
  const scale = 1.02 + forward * 0.2 + step * 0.026 + Math.sin(t * 0.22) * 0.006;
  const drawWidth = layout.battleWidth * scale;
  const drawHeight = height * scale;
  const drawX = (layout.battleWidth - drawWidth) / 2 + sway * layout.battleWidth * 0.022;
  const drawY = (height - drawHeight) / 2 + forward * height * 0.086 + step * height * 0.018;
  if (!drawImageCover(bg, drawX, drawY, drawWidth, drawHeight)) {
    drawImageCover(getBattleImage(getLayerAssetPath("bg-clean.png")), drawX, drawY, drawWidth, drawHeight);
  }

  ctx.globalAlpha = 0.08 + advancePulse * 0.12;
  ctx.fillStyle = scene.warm || "#fff3b1";
  ctx.fillRect(0, 0, layout.battleWidth, height);
  drawCanvasRegionAtmosphere(scene, layout, height, t, advancePulse);
  ctx.restore();
}

function drawCanvasRegionAtmosphere(scene, layout, height, t, advancePulse) {
  const particle = scene.particle || "dust";
  const count = particle === "storm" ? 20 : particle === "crystal" ? 14 : particle === "star" ? 18 : 16;
  ctx.save();
  ctx.globalAlpha = 0.16 + advancePulse * 0.12;
  for (let i = 0; i < count; i += 1) {
    const seed = i * 137;
    const drift = particle === "storm" ? t * 72 : particle === "ember" ? t * 28 : t * 18;
    const x = ((seed + drift) % (layout.battleWidth + 180)) - 90;
    const y = particle === "star"
      ? height * (0.18 + seededUnit(19, i) * 0.48)
      : height * (0.54 + seededUnit(23, i) * 0.34);
    ctx.fillStyle = scene.accent || "rgba(255,236,171,0.28)";
    if (particle === "crystal") {
      drawPixelDiamond(x, y, 4 + (i % 3) * 2);
    } else if (particle === "storm") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.72);
      ctx.fillRect(-18, -1, 42 + (i % 3) * 16, 2);
      ctx.restore();
    } else if (particle === "star") {
      drawPixelStar(x, y, 5 + (i % 4), 5);
    } else {
      ctx.fillRect(Math.round(x), Math.round(y), 14 + (i % 4) * 8, particle === "ember" ? 4 : 3);
    }
  }
  if (scene.tint) {
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = scene.tint;
    ctx.fillRect(0, 0, layout.battleWidth, height);
  }
  ctx.restore();
}

function drawCanvasSpeedLines(layout, height, advanceMotion) {
  if (!advanceMotion.active && advanceMotion.pulse <= 0) {
    return;
  }
  const advancePulse = advanceMotion.pulse;
  const forward = advanceMotion.forward;
  const step = advanceMotion.step;
  ctx.save();
  ctx.globalAlpha = advancePulse * 0.82;
  ctx.strokeStyle = "rgba(255, 250, 215, 0.78)";
  ctx.lineWidth = 3 + step * 3;
  const vanishingX = layout.centerX;
  const vanishingY = height * 0.55;
  for (let i = 0; i < 22; i += 1) {
    const angle = -0.95 + (i / 21) * 1.9;
    const length = layout.battleWidth * (0.16 + (i % 4) * 0.04 + forward * 0.12);
    const inner = 40 + (i % 3) * 18 + forward * 54;
    const outer = inner + length;
    ctx.beginPath();
    ctx.moveTo(vanishingX + Math.sin(angle) * inner, vanishingY + Math.cos(angle) * inner * 0.22);
    ctx.lineTo(vanishingX + Math.sin(angle) * outer, vanishingY + Math.cos(angle) * outer * 0.42);
    ctx.stroke();
  }

  ctx.globalAlpha = advancePulse * 0.7;
  ctx.strokeStyle = "rgba(255, 216, 115, 0.64)";
  ctx.lineWidth = 5;
  for (let i = 0; i < 5; i += 1) {
    const y = height * (0.63 + i * 0.07 + (forward * 0.12) % 0.08);
    const spread = layout.battleWidth * (0.12 + i * 0.075);
    ctx.beginPath();
    ctx.moveTo(layout.centerX - spread, y);
    ctx.lineTo(layout.centerX - spread * 2.4, y + height * 0.13);
    ctx.moveTo(layout.centerX + spread, y);
    ctx.lineTo(layout.centerX + spread * 2.4, y + height * 0.13);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCanvasAdvanceForeground(layout, height, advanceMotion) {
  if (!advanceMotion.active && advanceMotion.pulse <= 0) {
    return;
  }
  const pulse = advanceMotion.pulse;
  const travel = advanceMotion.travel || 0;
  const step = advanceMotion.step || 0;
  const sway = advanceMotion.sway || 0;
  const vanishingX = layout.centerX + sway * layout.battleWidth * 0.018;
  const vanishingY = height * 0.56;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, layout.battleWidth, height);
  ctx.clip();

  drawAdvanceGroundRushLines(layout, height, advanceMotion, vanishingX, vanishingY);
  drawAdvanceFocusLines(layout, height, advanceMotion, vanishingX, vanishingY);

  ctx.globalAlpha = pulse * 0.22;
  const vignette = ctx.createRadialGradient(layout.centerX, height * 0.58, height * 0.12, layout.centerX, height * 0.58, layout.battleWidth * 0.55);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(0.55, "rgba(255,255,255,0.08)");
  vignette.addColorStop(1, "rgba(255,214,94,0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, layout.battleWidth, height);

  const arrival = clamp01(((advanceMotion.travel || 0) - 0.82) / 0.18);
  if (arrival > 0) {
    const flash = Math.sin(arrival * Math.PI);
    ctx.globalAlpha = 0.18 + flash * 0.22;
    const arrivalGlow = ctx.createRadialGradient(layout.centerX, height * 0.58, height * 0.08, layout.centerX, height * 0.58, layout.battleWidth * (0.42 + arrival * 0.18));
    arrivalGlow.addColorStop(0, "rgba(255,255,238,0.34)");
    arrivalGlow.addColorStop(0.5, "rgba(255,218,112,0.22)");
    arrivalGlow.addColorStop(1, "rgba(28,24,34,0.36)");
    ctx.fillStyle = arrivalGlow;
    ctx.fillRect(0, 0, layout.battleWidth, height);

    ctx.globalAlpha = flash * 0.62;
    ctx.fillStyle = "rgba(255, 246, 190, 0.72)";
    for (let i = 0; i < 9; i += 1) {
      const size = 8 + i * 3;
      const x = layout.centerX + (i - 4) * layout.battleWidth * 0.085;
      const y = height * (0.5 + Math.abs(i - 4) * 0.028);
      ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    }
  }
  ctx.restore();
}

function drawAdvanceGroundRushLines(layout, height, advanceMotion, centerX, centerY) {
  const pulse = advanceMotion.pulse || 0;
  if (pulse <= 0) {
    return;
  }
  const travel = advanceMotion.travel || 0;
  const step = advanceMotion.step || 0;
  const width = layout.battleWidth;
  const lineCount = 30;
  const lowerCenterY = centerY + height * (0.025 + step * 0.012);
  const innerBase = Math.min(width, height) * (0.11 + step * 0.018);
  const outerBase = Math.max(width, height) * (0.68 + step * 0.08);

  ctx.save();
  ctx.lineCap = "butt";
  for (let i = 0; i < lineCount; i += 1) {
    const sideProgress = i / Math.max(1, lineCount - 1);
    const seedA = seededUnit(501 + i * 37, Math.floor(travel * 18));
    const seedB = seededUnit(719 + i * 53, Math.floor(travel * 22));
    const angle = Math.PI * (0.13 + sideProgress * 0.74) + (seedA - 0.5) * 0.12;
    const inner = innerBase * (0.78 + seedB * 0.5);
    const outer = outerBase * (0.86 + seedA * 0.24);
    const xScale = 1.18 + seedB * 0.16;
    const yScale = 0.76 + seedA * 0.18;
    const startX = centerX + Math.cos(angle) * inner * xScale;
    const startY = lowerCenterY + Math.sin(angle) * inner * yScale;
    const endX = centerX + Math.cos(angle) * outer * xScale;
    const endY = lowerCenterY + Math.sin(angle) * outer * yScale;
    const widthBoost = sideProgress < 0.16 || sideProgress > 0.84 ? 1.35 : 1;
    const lineWidth = (1.4 + seedB * 3.8 + step * 2.2) * widthBoost;
    const alpha = pulse * (0.18 + seedA * 0.36 + step * 0.12);

    ctx.globalAlpha = alpha * 0.34;
    ctx.strokeStyle = "rgba(22, 18, 20, 0.82)";
    ctx.lineWidth = lineWidth + 2.4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = i % 4 === 0 ? "rgba(255, 226, 122, 0.82)" : "rgba(255, 255, 244, 0.86)";
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAdvanceFocusLines(layout, height, advanceMotion, centerX, centerY) {
  const pulse = advanceMotion.pulse || 0;
  if (pulse <= 0) {
    return;
  }
  const travel = advanceMotion.travel || 0;
  const step = advanceMotion.step || 0;
  const width = layout.battleWidth;
  const maxRadius = Math.max(width, height) * 0.82;
  const clearRadius = Math.min(width, height) * (0.14 + step * 0.025);
  const lineCount = 54;
  const burst = 0.62 + step * 0.38;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "butt";
  for (let i = 0; i < lineCount; i += 1) {
    const seedA = seededUnit(i * 41 + 7, Math.floor(travel * 16));
    const seedB = seededUnit(i * 67 + 11, Math.floor(travel * 20));
    const angle = (i / lineCount) * Math.PI * 2 + (seedA - 0.5) * 0.16 + travel * 0.32;
    const inner = clearRadius * (0.82 + seedB * 0.56);
    const outer = maxRadius * (0.68 + seedA * 0.46);
    const yScale = 0.78 + seedB * 0.18;
    const startX = centerX + Math.cos(angle) * inner;
    const startY = centerY + Math.sin(angle) * inner * yScale;
    const endX = centerX + Math.cos(angle) * outer;
    const endY = centerY + Math.sin(angle) * outer * yScale;
    const lineWidth = (1.1 + seedB * 3.2) * (0.72 + step * 0.56);
    const edgeBias = Math.abs(Math.sin(angle));
    const alpha = pulse * burst * (0.16 + seedA * 0.32 + edgeBias * 0.12);

    ctx.globalAlpha = alpha * 0.36;
    ctx.strokeStyle = "rgba(24, 20, 24, 0.9)";
    ctx.lineWidth = lineWidth + 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = i % 5 === 0 ? "rgba(255, 226, 120, 0.9)" : "rgba(255, 255, 244, 0.92)";
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  const centerGlow = ctx.createRadialGradient(centerX, centerY, clearRadius * 0.12, centerX, centerY, clearRadius * 1.18);
  centerGlow.addColorStop(0, "rgba(255,255,255,0.08)");
  centerGlow.addColorStop(0.62, "rgba(255,255,255,0.04)");
  centerGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = pulse * 0.58;
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function getEncounterIntroProgress(time) {
  if (!battleRenderState.encounterIntroStart) {
    return 1;
  }
  const duration = battleRenderState.boss ? 1180 : 820;
  return clamp01((time - battleRenderState.encounterIntroStart) / duration);
}

function drawCanvasEncounterIntro(layout, height, time) {
  if (!battleRenderState.encounterIntroStart) {
    return;
  }
  const progress = getEncounterIntroProgress(time);
  if (progress >= 1) {
    return;
  }
  const eased = easeOutCubic(progress);
  const pulse = Math.sin(progress * Math.PI);
  const x = layout.centerX;
  const groundY = layout.targetY + height * 0.16;
  const ringScale = battleRenderState.boss ? 1.32 : 1;

  ctx.save();
  ctx.globalAlpha = pulse * (battleRenderState.boss ? 0.5 : 0.34);
  ctx.strokeStyle = battleRenderState.boss ? "#ff76c9" : "#94f7c1";
  ctx.lineWidth = battleRenderState.boss ? 5 : 3;
  for (let i = 0; i < 3; i += 1) {
    const radiusX = (38 + i * 42 + eased * 120) * ringScale;
    const radiusY = (8 + i * 6 + eased * 20) * ringScale;
    ctx.beginPath();
    ctx.ellipse(x, groundY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = pulse * 0.42;
  ctx.fillStyle = battleRenderState.boss ? "#ffe0a8" : "#ffe8ad";
  for (let i = 0; i < 14; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const spread = (28 + i * 12) * eased * ringScale;
    const size = 5 + (i % 4) * 3;
    ctx.fillRect(Math.round(x + side * spread), Math.round(groundY - 8 - (i % 5) * pulse * 8), size, 3);
  }

  if (!battleRenderState.boss) {
    ctx.globalAlpha = pulse * 0.32;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 82 - eased * 42, height * 0.49);
    ctx.lineTo(x - 28, height * 0.49);
    ctx.moveTo(x + 28, height * 0.49);
    ctx.lineTo(x + 82 + eased * 42, height * 0.49);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCanvasBossIntroWarning(layout, height, time) {
  if (!battleRenderState.boss || !battleRenderState.bossIntroStart) {
    return;
  }
  const progress = clamp01((time - battleRenderState.bossIntroStart) / 1200);
  if (progress >= 1) {
    return;
  }
  const pulse = Math.sin(progress * Math.PI);
  const x = layout.centerX;
  const y = height * 0.57;
  ctx.save();
  ctx.globalAlpha = 0.18 + pulse * 0.22;
  ctx.fillStyle = "#7d1d58";
  ctx.fillRect(0, 0, layout.battleWidth, height);
  ctx.globalAlpha = pulse * 0.86;
  ctx.strokeStyle = "#ff5bb8";
  ctx.lineWidth = 5;
  for (let i = 0; i < 3; i += 1) {
    const radius = (80 + i * 58 + progress * 90) * (1 + pulse * 0.08);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#fff2a8";
  ctx.globalAlpha = pulse * 0.92;
  ctx.font = "900 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BOSS", x, height * 0.25);
  ctx.restore();
}

function getMonsterRenderPose(layout, height, t, time) {
  const bossScale = battleRenderState.boss ? 1.18 : 1;
  const baseSize = Math.min(layout.battleWidth * 0.24, height * 0.36) * bossScale;
  const attack = battleRenderState.attack;
  const impactElapsed = attack ? time - (attack.start + attack.impactDelay) : -1;
  const hitFreezeDuration = attack?.skill === "finisher" ? 190 : (attack?.skill === "letter" ? 62 : (attack?.skill === "normal" ? 112 : 145));
  const hitPulseDuration = attack?.skill === "letter" ? 300 : (attack?.skill === "finisher" ? 560 : 440);
  const hitFreeze = impactElapsed >= 0 && impactElapsed < hitFreezeDuration;
  const hitPulse = attack ? getTimedPulse(attack.start + attack.impactDelay, hitPulseDuration, time) : 0;
  const defeatProgress = battleRenderState.defeatStart ? clamp01((time - battleRenderState.defeatStart) / 760) : 0;
  const enemyAttackMotion = getEnemyAttackMotion(time);
  const enemyAttackProgress = enemyAttackMotion.progress;
  const enemyAttackPulse = enemyAttackMotion.lunge;
  const enemyChargePulse = enemyAttackMotion.charge;
  const enemyImpactPulse = enemyAttackMotion.impact;
  const questionMotion = getQuestionPoseMotion(time);
  const stagePressure = battleRenderState.boss
    ? 1.42
    : (battleRenderState.evolutionStage === "ultimate" ? 1.22 : (battleRenderState.evolutionStage === "rookie" ? 1.08 : 0.94));
  const introProgress = getEncounterIntroProgress(time);
  const introEase = easeOutCubic(introProgress);
  let monsterAction = Math.floor(time / 460) % 2 === 0 ? "idle-1" : "idle-2";
  if (introProgress < 0.92) {
    monsterAction = "entrance";
  }
  if (enemyAttackMotion.active && (enemyAttackPulse > 0.04 || enemyChargePulse > 0.08)) {
    monsterAction = "entrance";
  }
  if (questionMotion.active && questionMotion.lunge > 0.08 && !enemyAttackMotion.active) {
    monsterAction = battleRenderState.evolutionStage === "baby" ? "idle-2" : "entrance";
  }
  if (hitFreeze || hitPulse > 0.18) {
    monsterAction = "hit";
  }
  if (defeatProgress > 0.04) {
    monsterAction = "defeat";
  }
  const actionRenderTuning = {
    entrance: { scale: 0.9, yOffset: 12 },
    hit: { scale: 0.96, yOffset: 4 },
    defeat: { scale: 0.94, yOffset: 14 }
  }[monsterAction] || { scale: 1, yOffset: 0 };
  const bob = hitFreeze ? 0 : Math.sin(t * (battleRenderState.boss ? 2.4 : 2.2)) * (battleRenderState.boss ? 8 : 6);
  const questionScale = questionMotion.lunge * 0.16 * stagePressure + questionMotion.settle * 0.035;
  const size = baseSize * actionRenderTuning.scale * (0.3 + introEase * 0.7) * (1 + questionScale + hitPulse * 0.12 - enemyChargePulse * 0.08 + enemyAttackPulse * 1.05 + enemyImpactPulse * 0.18 - defeatProgress * 0.28);
  const questionSway = Math.sin(questionMotion.progress * Math.PI * 2) * questionMotion.lunge * 8 * stagePressure;
  const x = layout.centerX + questionSway + Math.sin(enemyAttackProgress * Math.PI * 6) * (enemyAttackPulse * 14 + enemyChargePulse * 4);
  const enterStartY = battleRenderState.boss ? height * 0.35 : height * 0.47;
  const enterY = enterStartY + (layout.targetY - enterStartY) * introEase;
  const hitKnock = hitFreeze ? 15 : hitPulse * 10;
  const lungeTargetY = height * 0.5;
  const chargeY = enemyChargePulse * height * 0.045;
  const lungeY = (lungeTargetY - enterY) * enemyAttackPulse;
  const questionForwardY = questionMotion.lunge * height * 0.04 * stagePressure;
  const questionHopY = questionMotion.hop * height * (battleRenderState.evolutionStage === "baby" ? -0.035 : -0.016);
  const impactSnap = enemyImpactPulse * height * 0.018;
  const y = enterY + actionRenderTuning.yOffset + bob * (1 - enemyAttackPulse) + questionForwardY + questionHopY + hitKnock + chargeY + lungeY + impactSnap + defeatProgress * 62;
  return {
    x,
    y,
    size,
    alpha: 1 - defeatProgress * 0.96,
    monsterAction,
    hitFreeze,
    hitPulse,
    questionPosePulse: questionMotion.aura,
    questionPoseLunge: questionMotion.lunge,
    enemyChargePulse,
    enemyAttackPulse,
    enemyImpactPulse
  };
}

function updateMonsterCalloutPosition(layout, height, t, time) {
  if (!els.answerCallout) {
    return;
  }
  const pose = getMonsterRenderPose(layout, height, t, time);
  const x = Math.max(130, Math.min(layout.battleWidth - 130, pose.x));
  const y = Math.max(92, pose.y - pose.size * 0.43);
  const lockY = Math.max(height * 0.18, y - Math.min(156, height * 0.19));
  els.answerCallout.style.setProperty("--callout-x", `${Math.round(x)}px`);
  els.answerCallout.style.setProperty("--callout-y", `${Math.round(y)}px`);
  els.dungeonFrame?.style.setProperty("--word-lock-y", `${Math.round(lockY)}px`);
  els.dungeonFrame?.style.setProperty("--scout-callout-x", `${Math.round(x)}px`);
  els.dungeonFrame?.style.setProperty("--scout-callout-y", `${Math.round(y)}px`);
}

function refreshMonsterCalloutPosition(time = performance.now()) {
  if (!els.canvas || !els.answerCallout) {
    return;
  }
  const rect = els.canvas.getBoundingClientRect();
  const width = rect.width || els.canvas.width;
  const height = rect.height || els.canvas.height;
  const layout = getBattleLayout(width, height);
  const t = (time - animationStart) / 1000;
  updateMonsterCalloutPosition(layout, height, t, time);
}

function drawCanvasMonster(layout, height, t, time) {
  if (!battleRenderState.monsterVisible) {
    return;
  }
  const pose = getMonsterRenderPose(layout, height, t, time);
  const { x, y, size, monsterAction, hitFreeze, hitPulse, questionPosePulse, questionPoseLunge, enemyChargePulse, enemyAttackPulse, enemyImpactPulse } = pose;
  const monsterSrc = getMonsterActionSpritePath(battleRenderState.monsterIndex, battleRenderState.evolutionStage, monsterAction);
  const monster = getBattleImage(monsterSrc);
  const alpha = pose.alpha;

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = `rgba(47, 31, 18, ${(0.22 + enemyAttackPulse * 0.12) * alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.42, size * (0.3 + enemyAttackPulse * 0.08), size * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  if (battleRenderState.boss) {
    ctx.globalAlpha = Math.max(0, 0.32 * alpha);
    ctx.fillStyle = "rgba(255, 105, 190, 0.62)";
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.55, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (questionPosePulse > 0) {
    drawQuestionPoseEffect(x, y, size, questionPosePulse, questionPoseLunge);
  }
  if (enemyChargePulse > 0) {
    ctx.globalAlpha = enemyChargePulse * 0.52 * alpha;
    ctx.strokeStyle = battleRenderState.boss ? "#ff75c8" : "#ffe36f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.32, size * (0.34 + enemyChargePulse * 0.2), size * (0.08 + enemyChargePulse * 0.05), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = enemyChargePulse * 0.36 * alpha;
    ctx.fillStyle = battleRenderState.boss ? "#ff8bd6" : "#fff09b";
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2 + time * 0.006;
      const radius = size * (0.34 + (i % 3) * 0.04);
      ctx.fillRect(Math.round(x + Math.cos(angle) * radius), Math.round(y + Math.sin(angle) * radius * 0.42), 5 + (i % 2) * 3, 5);
    }
  }
  ctx.globalAlpha = Math.max(0, alpha);
  const drawX = x - size / 2 + (hitFreeze ? -8 : hitPulse * 10);
  const drawY = y - size / 2;
  drawImageContain(monster, drawX, drawY, size, size);
  if (hitFreeze) {
    ctx.globalAlpha = 0.78;
    ctx.globalCompositeOperation = "screen";
    drawImageContain(monster, drawX - 4, drawY - 4, size + 8, size + 8);
    ctx.globalCompositeOperation = "source-over";
  }
  if (hitPulse > 0) {
    ctx.globalAlpha = hitPulse * 0.72;
    ctx.fillStyle = "#fff8b8";
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.5, size * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    drawMonsterHitSparks(x, y, size, hitPulse, battleRenderState.attack);
  }
  if (enemyImpactPulse > 0) {
    ctx.globalAlpha = enemyImpactPulse * 0.68;
    ctx.strokeStyle = "#ffec7a";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.08, size * (0.34 + enemyImpactPulse * 0.24), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawQuestionPoseEffect(x, y, size, pulse, lunge) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const pressure = battleRenderState.boss
    ? 1.35
    : (battleRenderState.evolutionStage === "ultimate" ? 1.18 : 1);
  ctx.globalAlpha = pulse * 0.34 * pressure;
  ctx.strokeStyle = battleRenderState.boss ? "#ff86d7" : "#fff06d";
  ctx.lineWidth = (3 + lunge * 4) * pressure;
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.34, size * (0.3 + lunge * 0.24), size * (0.075 + lunge * 0.04), 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = pulse * 0.18 * pressure;
  ctx.fillStyle = battleRenderState.boss ? "#ff78ce" : "#fff2a0";
  ctx.beginPath();
  ctx.ellipse(x, y, size * (0.48 + lunge * 0.12), size * (0.4 + lunge * 0.08), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = pulse * 0.42;
  ctx.fillStyle = battleRenderState.evolutionStage === "baby" ? "#a5ffcb" : "#fff6a8";
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 + lunge * 1.8;
    const radius = size * (0.34 + (i % 4) * 0.032 + lunge * 0.12);
    const block = Math.max(3, Math.round(size * (0.018 + (i % 3) * 0.004)));
    ctx.fillRect(
      Math.round(x + Math.cos(angle) * radius - block / 2),
      Math.round(y + Math.sin(angle) * radius * 0.58 - block / 2),
      block,
      block
    );
  }
  ctx.restore();
}

function drawMonsterHitSparks(x, y, size, hitPulse, attack) {
  const skill = attack?.skill || "normal";
  const seed = attack?.seed || 1;
  const heavy = skill === "finisher" || skill === "double" || skill === "power";
  const count = heavy ? 18 : (skill === "letter" ? 8 : 12);
  const radiusBase = size * (heavy ? 0.34 : 0.25);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < count; i += 1) {
    const unit = seededUnit(seed + 17, i);
    const angle = unit * Math.PI * 2 + hitPulse * 1.8;
    const distance = radiusBase + hitPulse * size * (0.28 + seededUnit(seed + 31, i) * 0.32);
    const sparkX = x + Math.cos(angle) * distance;
    const sparkY = y + Math.sin(angle) * distance * 0.72;
    const length = (heavy ? 18 : 10) + seededUnit(seed + 43, i) * (heavy ? 18 : 8);
    ctx.save();
    ctx.translate(sparkX, sparkY);
    ctx.rotate(angle);
    ctx.globalAlpha = hitPulse * (0.55 + seededUnit(seed + 59, i) * 0.38);
    ctx.fillStyle = i % 3 === 0 ? "#ffffff" : (heavy ? "#ffef63" : "#8ff6ff");
    ctx.fillRect(-length * 0.5, -2, length, heavy ? 5 : 4);
    ctx.restore();
  }
  if (heavy) {
    ctx.globalAlpha = hitPulse * 0.72;
    ctx.strokeStyle = "#fff26f";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(x, y, size * (0.28 + hitPulse * 0.42), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCanvasCrosshair(layout, height, t, advanceMotion = { step: 0, sway: 0, pulse: 0 }) {
  const pulse = 0.5 + Math.sin(t * 2.4) * 0.5;
  const radius = Math.min(84, layout.battleWidth * 0.055) + pulse * 4 + (advanceMotion.step || 0) * 8;
  const x = layout.centerX + (advanceMotion.sway || 0) * Math.min(18, layout.battleWidth * 0.018);
  const y = height * 0.57 + (advanceMotion.step || 0) * height * 0.018;
  ctx.save();
  ctx.strokeStyle = "rgba(164, 255, 158, 0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.86)";
  ctx.lineWidth = 5;
  const corner = radius * 0.78;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * corner, y + sy * radius);
      ctx.lineTo(x + sx * radius, y + sy * radius);
      ctx.lineTo(x + sx * radius, y + sy * corner);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "rgba(78, 229, 255, 0.78)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 22, y);
  ctx.lineTo(x + 22, y);
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x, y + 22);
  ctx.stroke();
  ctx.restore();
}

function drawCanvasEnemyAttackFocus(layout, height, time) {
  if (!battleRenderState.enemyAttackStart) {
    return;
  }
  const motion = getEnemyAttackMotion(time);
  if (!motion.active) {
    return;
  }
  const { progress, charge, lunge, impact } = motion;
  const pulse = Math.sin(progress * Math.PI);
  const x = layout.centerX;
  const y = height * 0.54;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, layout.battleWidth, height);
  ctx.clip();

  ctx.globalAlpha = charge * 0.12 + lunge * 0.15 + impact * 0.28;
  ctx.fillStyle = "#7f1724";
  ctx.fillRect(0, 0, layout.battleWidth, height);

  ctx.globalAlpha = charge * 0.82;
  ctx.strokeStyle = "rgba(255, 239, 150, 0.88)";
  ctx.lineWidth = 4 + charge * 2;
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2 + progress * 2.2;
    const inner = 28 + charge * 90;
    const outer = layout.battleWidth * (0.17 + (i % 4) * 0.035 + charge * 0.08);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner * 0.72);
    ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer * 0.72);
    ctx.stroke();
  }

  if (lunge > 0) {
    ctx.globalAlpha = lunge * 0.72;
    ctx.strokeStyle = "rgba(255, 250, 220, 0.78)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 16; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const spread = layout.battleWidth * (0.08 + (i % 8) * 0.045);
      const startY = height * (0.18 + (i % 6) * 0.09);
      ctx.beginPath();
      ctx.moveTo(x + side * spread, startY);
      ctx.lineTo(x + side * spread * (0.22 + lunge * 0.16), y + height * (0.02 + lunge * 0.05));
      ctx.stroke();
    }
  }

  if (impact > 0) {
    ctx.globalAlpha = impact * 0.92;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(x, y, 48 + impact * 132, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = impact * 0.75;
    ctx.fillStyle = "#fff08a";
    drawPixelStar(x, y, 62 + impact * 98, 10);
    ctx.globalAlpha = impact * 0.35;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, layout.battleWidth, height);
  }
  ctx.restore();
}

function drawCanvasCannons(layout, height, t, time, advanceMotion = getAdvanceMotion(time)) {
  const left = getBattleImage(getLayerAssetPath("cannon-left.png"));
  const right = getBattleImage(getLayerAssetPath("cannon-right.png"));
  const attack = battleRenderState.attack;
  const attackPulse = attack ? getTimedPulse(attack.start, attack.duration, time) : 0;
  const recoil = attackPulse * (attack?.skill === "finisher" ? 50 : (attack?.skill === "letter" ? 18 : 32));
  const bob = Math.sin(t * 1.5) * 4;
  const walkBob = advanceMotion.step * 38;
  const walkSway = advanceMotion.sway * Math.min(layout.battleWidth * 0.028, 28);
  const walkPush = advanceMotion.forward * Math.min(layout.battleWidth * 0.026, 30);
  const cannonWidth = Math.min(layout.battleWidth * 0.34, 560);
  const cannonHeight = cannonWidth * 0.86;
  const y = height - cannonHeight + 36 + bob + walkBob + recoil * 0.18;

  ctx.save();
  drawImageContain(left, -cannonWidth * 0.12 - recoil + walkSway - walkPush, y, cannonWidth, cannonHeight);
  drawImageContain(right, layout.battleWidth - cannonWidth * 0.88 + recoil + walkSway + walkPush, y, cannonWidth, cannonHeight);
  ctx.restore();
}

function drawCanvasAttack(layout, height, time) {
  const attack = battleRenderState.attack;
  if (!attack) {
    return;
  }
  const elapsed = time - attack.start;
  if (elapsed > attack.duration + 260) {
    battleRenderState.attack = null;
    return;
  }
  const chargedBeam = isChargedBeamSkill(attack.skill);
  const projectileProgress = clamp01(elapsed / attack.impactDelay);
  const freezeDuration = attack.skill === "finisher" ? 185 : (attack.skill === "letter" ? 58 : (attack.skill === "normal" ? 98 : 130));
  const impactElapsed = elapsed - attack.impactDelay;
  const impactProgress = impactElapsed > freezeDuration
    ? clamp01((impactElapsed - freezeDuration) / 280)
    : 0.04;
  const startLeft = { x: layout.centerX - layout.battleWidth * 0.27, y: height * 0.77 };
  const startRight = { x: layout.centerX + layout.battleWidth * 0.27, y: height * 0.77 };
  const target = { x: layout.centerX, y: height * 0.59 };
  const sizeScale = attack.skill === "finisher" ? 1.4 : (attack.skill === "letter" ? 0.72 : (attack.skill === "normal" ? 1 : 1.18));

  ctx.save();
  if (chargedBeam && elapsed < attack.impactDelay) {
    drawChargeGather(startLeft, startRight, target, projectileProgress, sizeScale, attack);
  }
  if (elapsed > attack.impactDelay && elapsed < attack.impactDelay + 120) {
    const flash = 1 - (elapsed - attack.impactDelay) / 120;
    ctx.globalAlpha = flash * (attack.skill === "finisher" ? 0.5 : (attack.skill === "letter" ? 0.18 : 0.34));
    ctx.fillStyle = "#fff0aa";
    ctx.fillRect(0, 0, layout.battleWidth, height);
    ctx.globalAlpha = 1;
  }
  if (!chargedBeam && elapsed < attack.impactDelay) {
    const eased = easeOutCubic(projectileProgress);
    drawEnergyBolt(startLeft, target, eased, sizeScale, false);
    drawEnergyBolt(startRight, target, eased, sizeScale, true);
  } else if (impactElapsed >= 0) {
    if (chargedBeam) {
      drawChargedBeam(startLeft, startRight, target, impactElapsed, sizeScale, attack);
    }
    drawStarburst(target.x, target.y, impactProgress, sizeScale);
    drawExplosionFragments(target.x, target.y, impactProgress, sizeScale, attack.seed);
  }
  if (elapsed < (chargedBeam ? attack.impactDelay : 220)) {
    const flash = chargedBeam ? Math.min(1, 0.25 + projectileProgress * 0.95) : 1 - elapsed / 220;
    drawMuzzleFlash(startLeft.x, startLeft.y, flash, sizeScale);
    drawMuzzleFlash(startRight.x, startRight.y, flash, sizeScale);
  }
  ctx.restore();
}

function drawChargeGather(startLeft, startRight, target, progress, scale, attack) {
  const charge = easeOutCubic(progress);
  const pulse = 0.5 + Math.sin(progress * Math.PI * 6) * 0.5;
  const heavy = attack.skill === "finisher" || attack.skill === "double";
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.1 + charge * 0.28;
  ctx.fillStyle = heavy ? "#181225" : "#10283a";
  ctx.fillRect(0, 0, target.x * 2, target.y * 2);

  for (const [index, start] of [startLeft, startRight].entries()) {
    const glowRadius = (34 + charge * (heavy ? 118 : 96) + pulse * 18) * scale;
    drawRadialGlow(
      start.x,
      start.y,
      glowRadius,
      "rgba(255,255,255,0.95)",
      heavy ? "rgba(255,181,57,0)" : "rgba(53,229,255,0)",
      0.58 + charge * 0.34
    );

    ctx.globalAlpha = 0.65 + charge * 0.34;
    ctx.strokeStyle = heavy ? "#fff27d" : "#72f6ff";
    ctx.lineWidth = (5 + charge * 14) * scale;
    ctx.beginPath();
    ctx.arc(start.x, start.y, (18 + charge * 58 + pulse * 11) * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = charge * 0.72;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = (4 + charge * 8) * scale;
    ctx.beginPath();
    ctx.arc(start.x, start.y, (10 + charge * 34 + pulse * 5) * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = charge * 0.48;
    ctx.strokeStyle = heavy ? "#ffe46c" : "#75f2ff";
    ctx.lineWidth = (3 + charge * 5) * scale;
    for (let spoke = 0; spoke < 8; spoke += 1) {
      const angle = (spoke / 8) * Math.PI * 2 + progress * Math.PI * (1.6 + index);
      const inner = (16 + charge * 18) * scale;
      const outer = (42 + charge * 48 + pulse * 12) * scale;
      ctx.beginPath();
      ctx.moveTo(start.x + Math.cos(angle) * inner, start.y + Math.sin(angle) * inner * 0.72);
      ctx.lineTo(start.x + Math.cos(angle) * outer, start.y + Math.sin(angle) * outer * 0.72);
      ctx.stroke();
    }

    ctx.globalAlpha = charge * 0.98;
    ctx.fillStyle = "#ffffff";
    drawPixelStar(start.x, start.y, (24 + charge * 46 + pulse * 10) * scale, 10);

    for (let i = 0; i < 12; i += 1) {
      const unit = seededUnit(attack.seed + index * 31, i);
      const orbit = 24 + charge * 108 + unit * 28;
      const angle = unit * Math.PI * 2 + progress * Math.PI * (3.6 + index);
      const x = start.x + Math.cos(angle) * orbit * scale;
      const y = start.y + Math.sin(angle) * orbit * 0.6 * scale;
      ctx.globalAlpha = charge * (0.42 + unit * 0.5);
      ctx.fillStyle = i % 2 === 0 ? "#fff6a0" : "#5eefff";
      const block = Math.max(4, Math.round((8 + unit * 8) * scale));
      ctx.fillRect(Math.round(x - block / 2), Math.round(y - block / 2), block, block);
    }
  }
  ctx.restore();
}

function drawChargedBeam(startLeft, startRight, target, impactElapsed, scale, attack) {
  const beamWindow = attack.skill === "finisher" ? 380 : (attack.skill === "double" ? 320 : 280);
  const progress = clamp01(impactElapsed / beamWindow);
  const fade = Math.max(0, 1 - progress * 0.82);
  const flash = Math.sin(Math.min(1, progress * 1.25) * Math.PI);
  if (fade <= 0) {
    return;
  }
  const widthBase = (attack.skill === "finisher" ? 58 : (attack.skill === "double" ? 48 : (attack.skill === "power" ? 40 : 34))) * scale;
  const jitter = Math.sin((attack.seed + impactElapsed) * 0.16) * 5 * scale;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = attack.skill === "finisher" ? "rgba(255, 235, 104, 0.96)" : "rgba(75, 237, 255, 0.86)";
  ctx.shadowBlur = 58 * scale;

  for (const [index, start] of [startLeft, startRight].entries()) {
    const offset = (index === 0 ? -1 : 1) * jitter;
    const flicker = 0.88 + seededUnit(attack.seed + Math.floor(impactElapsed / 24), index) * 0.18;

    ctx.globalAlpha = fade * 0.22;
    ctx.strokeStyle = attack.skill === "finisher" ? "#ff6f28" : "#0bb9ff";
    ctx.lineWidth = widthBase * 2.35 * flicker;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x + offset * 1.2, target.y);
    ctx.stroke();

    ctx.globalAlpha = fade * 0.52;
    ctx.strokeStyle = attack.skill === "finisher" ? "#ffcf53" : "#31e3ff";
    ctx.lineWidth = widthBase * 1.55 * flicker;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x + offset, target.y);
    ctx.stroke();

    ctx.globalAlpha = fade * 0.86;
    ctx.strokeStyle = "#fff36f";
    ctx.lineWidth = widthBase * 0.92;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x + offset * 0.45, target.y);
    ctx.stroke();

    ctx.globalAlpha = Math.min(1, fade * (1 + flash * 0.32));
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(8, widthBase * 0.42);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      const trail = (i + 1) / 5;
      const px = start.x + (target.x - start.x) * trail;
      const py = start.y + (target.y - start.y) * trail;
      ctx.globalAlpha = fade * (0.18 + flash * 0.12);
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#fff36f";
      drawPixelStar(px + offset * trail, py, (10 + i * 5 + flash * 8) * scale, 6);
    }
  }

  if (attack.skill === "double" || attack.skill === "finisher") {
    ctx.globalAlpha = fade * 0.48;
    ctx.strokeStyle = "#ff7cd7";
    ctx.lineWidth = widthBase * 0.55;
    ctx.beginPath();
    ctx.moveTo(startLeft.x, startLeft.y - 16 * scale);
    ctx.quadraticCurveTo(target.x, target.y - 80 * scale, startRight.x, startRight.y - 16 * scale);
    ctx.stroke();
  }

  drawRadialGlow(
    target.x,
    target.y,
    (92 + flash * 168) * scale,
    "rgba(255,255,255,0.98)",
    attack.skill === "finisher" ? "rgba(255,106,49,0)" : "rgba(48,222,255,0)",
    fade * 0.9
  );
  ctx.globalAlpha = fade * 0.98;
  ctx.fillStyle = "#ffffff";
  drawPixelStar(target.x, target.y, (70 + flash * 118) * scale, 14);
  ctx.globalAlpha = fade * 0.72;
  ctx.fillStyle = "#fff36f";
  drawPixelStar(target.x, target.y, (44 + flash * 74) * scale, 10);
  ctx.restore();
}

function drawRadialGlow(x, y, radius, innerColor, outerColor, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.32, innerColor);
  gradient.addColorStop(1, outerColor);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnergyBolt(start, target, progress, scale, flip) {
  const x = start.x + (target.x - start.x) * progress;
  const y = start.y + (target.y - start.y) * progress;
  const angle = Math.atan2(target.y - start.y, target.x - start.x);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + (flip ? Math.PI : 0));
  ctx.globalAlpha = 0.84;
  ctx.shadowColor = "rgba(68, 218, 255, 0.72)";
  ctx.shadowBlur = 18 * scale;
  ctx.strokeStyle = "#fff36f";
  ctx.lineWidth = 8 * scale;
  ctx.beginPath();
  ctx.moveTo(-42 * scale, 0);
  ctx.lineTo(42 * scale, 0);
  ctx.stroke();
  ctx.strokeStyle = "#4df2ff";
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(-30 * scale, -7 * scale);
  ctx.lineTo(26 * scale, 6 * scale);
  ctx.stroke();
  ctx.restore();
}

function drawMuzzleFlash(x, y, progress, scale) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  drawRadialGlow(
    x,
    y,
    78 * scale * (0.78 + progress * 0.8),
    "rgba(255,255,255,0.96)",
    "rgba(255,198,46,0)",
    progress * 0.86
  );
  ctx.globalAlpha = progress * 0.96;
  ctx.fillStyle = "#fff6a0";
  ctx.shadowColor = "rgba(255, 220, 71, 0.9)";
  ctx.shadowBlur = 42 * scale;
  drawPixelStar(x, y, 62 * scale * (0.62 + progress * 0.62), 10);
  ctx.globalAlpha = progress * 0.72;
  ctx.fillStyle = "#ffffff";
  drawPixelStar(x, y, 34 * scale * (0.7 + progress * 0.56), 8);
  ctx.restore();
}

function drawStarburst(x, y, progress, scale) {
  const pulse = Math.sin(progress * Math.PI);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - progress * 0.78);
  ctx.fillStyle = "#fff7a8";
  ctx.shadowColor = "rgba(255, 222, 72, 0.95)";
  ctx.shadowBlur = 34 * scale;
  drawPixelStar(x, y, (70 + pulse * 92) * scale, 14);
  ctx.globalAlpha = Math.max(0, 0.68 - progress * 0.46);
  ctx.fillStyle = "#55e7ff";
  ctx.beginPath();
  ctx.arc(x, y, (42 + progress * 112) * scale, 0, Math.PI * 2);
  ctx.strokeStyle = "#55e7ff";
  ctx.lineWidth = 7 * scale;
  ctx.stroke();
  ctx.globalAlpha = Math.max(0, 0.4 - progress * 0.34);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.arc(x, y, (24 + progress * 72) * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function seededUnit(seed, index) {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function drawExplosionFragments(x, y, progress, scale, seed) {
  const count = Math.round(18 * scale);
  const fade = Math.max(0, 1 - progress);
  ctx.save();
  ctx.globalAlpha = fade;
  for (let i = 0; i < count; i += 1) {
    const angle = seededUnit(seed, i) * Math.PI * 2;
    const distance = (34 + seededUnit(seed, i + 20) * 118) * progress * scale;
    const size = (4 + seededUnit(seed, i + 40) * 9) * scale;
    const px = x + Math.cos(angle) * distance;
    const py = y + Math.sin(angle) * distance * 0.78;
    ctx.fillStyle = i % 3 === 0 ? "#fff7a8" : (i % 3 === 1 ? "#49e6ff" : "#ff7fb8");
    ctx.fillRect(Math.round(px - size / 2), Math.round(py - size / 2), Math.max(2, Math.round(size)), Math.max(2, Math.round(size)));
  }
  ctx.restore();
}

function drawPixelStar(x, y, radius, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? radius : radius * 0.38;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

function drawPixelDiamond(x, y, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
  ctx.fill();
}

function drawCanvasPlayerHit(width, height, pulse) {
  if (pulse <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = pulse * 0.24;
  ctx.fillStyle = "#ff4f62";
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = pulse * 0.78;
  ctx.strokeStyle = "#fff0a6";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.55, 54 + pulse * 180, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = pulse * 0.42;
  ctx.strokeStyle = "#ff334a";
  ctx.lineWidth = Math.max(18, Math.min(width, height) * 0.035);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);
  ctx.globalAlpha = pulse * 0.72;
  ctx.fillStyle = "#fff2a1";
  drawPixelStar(width * 0.5, height * 0.55, 38 + pulse * 64, 9);
  ctx.restore();
}

function drawCloud(x, y, size, t) {
  ctx.save();
  const drift = Math.round(Math.sin(t * 0.35) * 8);
  const block = Math.max(18, Math.round(size * 0.13));
  ctx.translate(drift, 0);
  ctx.fillStyle = "rgba(255, 225, 249, 0.88)";
  ctx.fillRect(x - block * 3, y, block * 6, block * 2);
  ctx.fillRect(x - block * 2, y - block, block * 4, block * 3);
  ctx.fillRect(x - block * 4, y + block, block * 2, block * 2);
  ctx.fillRect(x + block * 2, y + block, block * 3, block * 2);
  ctx.fillStyle = "rgba(255, 245, 255, 0.62)";
  ctx.fillRect(x - block, y - block * 2, block * 3, block);
  ctx.restore();
}

function drawRocks(width, height, t) {
  const rockColor = "#b8733c";
  const dark = "#81502e";
  for (let side = 0; side < 2; side += 1) {
    const mirror = side === 0 ? 1 : -1;
    const baseX = side === 0 ? width * 0.08 : width * 0.92;
    for (let i = 0; i < 5; i += 1) {
      const x = baseX + mirror * i * width * 0.055;
      const top = height * (0.32 + i * 0.035 + Math.sin(t + i) * 0.004);
      const bottom = height * 0.64;
      ctx.fillStyle = rockColor;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + mirror * width * 0.055, bottom);
      ctx.lineTo(x - mirror * width * 0.04, bottom);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = dark;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}

function returnHome() {
  encounterFlowId += 1;
  acceptingInput = false;
  hideAnswerCallout();
  started = false;
  battleTestMode = false;
  document.body.classList.remove("monster-test-mode");
  els.monsterTestPanel?.classList.add("hidden");
  speechRequestId += 1;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  hideRegionIntro();
  hideScoutOverlay();
  closeTraining();
  closeDex();
  closeRegionMap();
  els.runSummaryOverlay?.classList.add("hidden");
  hideClearCinematic();
  els.startTitle.textContent = "單字怪獸遠征";
  els.startButton.textContent = "開始冒險";
  els.startButton.disabled = questions.length === 0;
  updateRegionPanel();
  updateHomeRegionSummary();
  startMusic("title");
  els.startOverlay.classList.remove("hidden");
}

function openAdventureMap() {
  if (questions.length === 0) {
    return;
  }
  initAudio();
  closeTraining();
  closeDex();
  openRegionMap();
}

function startGame() {
  initAudio();
  startMusic();
  started = true;
  hideScoutOverlay();
  closeTraining();
  closeRegionMap();
  els.startOverlay.classList.add("hidden");
  els.startTitle.textContent = "單字怪獸遠征";
  els.startButton.textContent = "開始冒險";
  startNormalRun(true);
}

els.startButton.addEventListener("click", openAdventureMap);
els.regionMapCloseButton.addEventListener("click", closeRegionMap);
els.regionMapBackButton.addEventListener("click", closeRegionMap);
els.regionMapStartButton.addEventListener("click", () => {
  closeRegionMap();
  startGame();
});
els.trainingButton.addEventListener("click", openTraining);
els.homeDexButton.addEventListener("click", openDex);
els.monsterTestButton.addEventListener("click", startMonsterBattleTest);
els.scoutToggleButton.addEventListener("click", toggleScout);
els.scoutStartButton.addEventListener("click", handleScoutPrimaryAction);
els.scoutSkipButton.addEventListener("click", continueFromScout);
els.testPrevMonsterButton.addEventListener("click", () => setMonsterTestMonster(battleTestMonsterIndex - 1));
els.testNextMonsterButton.addEventListener("click", () => setMonsterTestMonster(battleTestMonsterIndex + 1));
els.testMonsterSelect.addEventListener("change", () => setMonsterTestMonster(Number(els.testMonsterSelect.value)));
els.testBabyButton.addEventListener("click", () => setMonsterTestStage("baby"));
els.testRookieButton.addEventListener("click", () => setMonsterTestStage("rookie"));
els.testUltimateButton.addEventListener("click", () => setMonsterTestStage("ultimate"));
els.testIntroButton.addEventListener("click", () => triggerMonsterTestAction("intro"));
els.testHitButton.addEventListener("click", () => triggerMonsterTestAction("hit"));
els.testDefeatButton.addEventListener("click", () => triggerMonsterTestAction("defeat"));
els.testCaptureButton.addEventListener("click", () => triggerMonsterTestAction("capture"));
els.testEvolutionButton.addEventListener("click", () => triggerMonsterTestAction("evolution"));
els.testExitButton.addEventListener("click", exitMonsterBattleTest);
els.musicButton.addEventListener("click", toggleMusic);
els.speakButton.addEventListener("click", () => {
  initAudio();
  speakCurrent();
});
els.skipButton.addEventListener("click", skipQuestion);
els.reloadButton.addEventListener("click", loadQuestions);
els.hudMusicButton.addEventListener("click", toggleMusic);
els.homeButton.addEventListener("click", returnHome);
els.dexButton.addEventListener("click", openDex);
els.dexCloseButton.addEventListener("click", closeDex);
els.nextRunButton.addEventListener("click", () => {
  initAudio();
  startMusic();
  startNormalRun(true);
});
els.retryWrongButton.addEventListener("click", startWrongReviewRun);
els.summaryDexButton.addEventListener("click", () => {
  els.runSummaryOverlay.classList.add("hidden");
  openDex();
});
els.summaryHomeButton.addEventListener("click", returnHome);
els.dexOverlay.addEventListener("click", (event) => {
  if (event.target === els.dexOverlay) {
    closeDex();
  }
});
els.trainingCloseButton.addEventListener("click", closeTraining);
els.trainingOverlay.addEventListener("click", (event) => {
  if (event.target === els.trainingOverlay) {
    closeTraining();
  }
});
els.regionMapOverlay.addEventListener("click", (event) => {
  if (event.target === els.regionMapOverlay) {
    closeRegionMap();
  }
});
els.allReviewButton.addEventListener("click", () => {
  startPracticeRun(questions, "題庫複習", ENCOUNTERS_PER_RUN);
});
els.wrongPracticeButton.addEventListener("click", () => {
  startPracticeRun(getVocabularyBuckets().wrong, "錯題重練", REVIEW_ENCOUNTERS_PER_RUN);
});
els.weakPracticeButton.addEventListener("click", () => {
  startPracticeRun(getVocabularyBuckets().weak, "未熟練習", REVIEW_ENCOUNTERS_PER_RUN);
});
els.masteredPracticeButton.addEventListener("click", () => {
  startPracticeRun(getVocabularyBuckets().mastered, "已掌握複習", REVIEW_ENCOUNTERS_PER_RUN);
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (els.scoutOverlay && !els.scoutOverlay.classList.contains("hidden")) {
    continueFromScout();
  } else if (!els.trainingOverlay.classList.contains("hidden")) {
    closeTraining();
  } else if (!els.regionMapOverlay.classList.contains("hidden")) {
    closeRegionMap();
  } else if (!els.dexOverlay.classList.contains("hidden")) {
    closeDex();
  }
});

window.addEventListener("resize", () => {
  const rect = els.canvas.getBoundingClientRect();
  const maxRatio = window.matchMedia("(pointer: coarse)").matches ? 1.35 : 2;
  const ratio = Math.min(window.devicePixelRatio || 1, maxRatio);
  els.canvas.width = Math.max(900, Math.round(rect.width * ratio));
  els.canvas.height = Math.max(540, Math.round(rect.height * ratio));
});

window.dispatchEvent(new Event("resize"));
requestAnimationFrame(drawDungeon);
updateProgressLabels();
updateMusicButtons();
updateScoutButton();
loadQuestions();
