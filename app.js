"use strict";

const STORAGE_KEYS = {
  customCards: "levelLink.customCards.v2",
  deck: "levelLink.deck.v2",
  decks: "levelLink.decks.v1",
  activeDeckId: "levelLink.activeDeckId.v1",
  playerName: "levelLink.playerName.v1",
  dailyMissions: "levelLink.dailyMissions.v1",
  cardUpgrades: "levelLink.cardUpgrades.v1",
  inventory: "levelLink.inventory.v1",
  creatorTickets: "levelLink.creatorTickets.v1",
  gachaHistory: "levelLink.gachaHistory.v1",
  gachaBalls: "levelLink.gachaBalls.v1",
  gold: "levelLink.gold.v1",
  questClears: "levelLink.questClears.v1",
  marketPurchases: "levelLink.marketPurchases.v1",
  lastDailyReward: "levelLink.lastDailyReward.v1",
  aiBattle: "levelLink.aiBattle.v1",
  autoBattle: "levelLink.autoBattle.v1",
  cloudEnabled: "levelLink.cloudEnabled.v1",
  tutorialSeen: "levelLink.tutorialSeen.v1"
};

const MAX_HP = 500;
const MIN_DECK_SIZE = 100;
const DECK_SIZE = 300;
const INITIAL_HAND = 5;
const TURN_DRAW_COUNT = 2;
const FIELD_LIMIT = 6;
const LEVEL_MULTIPLIER_PER_LEVEL = 0.05;
const LEVEL_MULTIPLIER_CAP = 100;
const LEVEL_FOR_MULTIPLIER_CAP = Math.ceil((LEVEL_MULTIPLIER_CAP - 1) / LEVEL_MULTIPLIER_PER_LEVEL);
const DRAW_EFFECT_MULTIPLIER = 2;
const GACHA_BALL_NAME = "ガチャ玉";
const GACHA_SINGLE_COST = 1;
const GACHA_TEN_COST = 10;
const GACHA_CARDS_PER_BALL = 5;
const GACHA_HISTORY_LIMIT = 200;
const GOLD_NAME = "ゴールド";
const QUEST_AREA_COUNT = 5;
const QUEST_STAGES_PER_AREA = 10;
const QUEST_FIRST_CLEAR_GACHA_BALL_REWARD = 10;
const MARKET_SHOP_LISTING_COUNT = 6;
const MARKET_AUCTION_LISTING_COUNT = 5;
const AUCTION_BASE_DURATION_MS = 6 * 60 * 60 * 1000;
const AUCTION_EXTENSION_MS = 10 * 60 * 1000;
const AUCTION_CLAIM_GRACE_MS = 24 * 60 * 60 * 1000;
const AUCTION_MIN_BID_INCREMENT = 10;
const CARD_MAX_ENHANCE_LEVEL = 10;
const CARD_MAX_EVOLUTION = 3;
const BATTLE_ENHANCE_COST = 2;
const BATTLE_ENHANCE_ATK_BONUS = 2;
const BATTLE_ENHANCE_DEF_BONUS = 4;
const BATTLE_ENHANCE_MAX = 5;
const CLOUD_SAVE_VERSION = 1;
const CLOUD_SAVE_DEBOUNCE_MS = 900;
const FIREBASE_SDK_VERSION = "10.12.5";
const DAILY_GACHA_BALL_REWARD = 2;
const AI_WIN_GACHA_BALL_REWARD = 3;
const AI_LOSE_GACHA_BALL_REWARD = 1;
const CREATOR_TICKET_CHANCE = 3;
const CREATOR_TICKET_NAME = "カード創造チケット";
const HAND_SORT_OPTIONS = [
  { id: "draw", label: "引いた順" },
  { id: "costAsc", label: "コスト低い順" },
  { id: "costDesc", label: "コスト高い順" }
];

const RARITY_ORDER = ["N", "R", "SR", "SSR", "UR"];
const RARITY_LABELS = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR"
};

const CARD_ATTRIBUTES = [
  { id: "sakura", label: "桜" },
  { id: "moon", label: "月" },
  { id: "water", label: "水" },
  { id: "wind", label: "風" },
  { id: "light", label: "光" },
  { id: "sky", label: "空" },
  { id: "memory", label: "記憶" },
  { id: "neutral", label: "無" }
];

const RARITY_RATES = [
  { rarity: "N", weight: 61 },
  { rarity: "R", weight: 25 },
  { rarity: "SR", weight: 10 },
  { rarity: "SSR", weight: 3 },
  { rarity: "UR", weight: 1 }
];

const DAILY_MISSION_DEFINITIONS = [
  {
    id: "login",
    title: "ログイン",
    body: "今日ゲームを開く",
    event: "dailyLogin",
    target: 1,
    reward: { gachaBalls: 1, gold: 50 }
  },
  {
    id: "gacha",
    title: "ガチャ開封",
    body: "ガチャを1パック以上開封する",
    event: "gachaPack",
    target: 1,
    reward: { gold: 120 }
  },
  {
    id: "ai",
    title: "AI戦",
    body: "AI戦を最後まで1回遊ぶ",
    event: "aiBattleComplete",
    target: 1,
    reward: { gachaBalls: 2, gold: 80 }
  },
  {
    id: "quest",
    title: "クエスト勝利",
    body: "クエストで1回勝利する",
    event: "questWin",
    target: 1,
    reward: { gachaBalls: 3, gold: 150 }
  },
  {
    id: "upgrade",
    title: "カード強化",
    body: "カードを1回強化する",
    event: "battleEnhance",
    target: 1,
    reward: { gold: 220 }
  }
];

const RARITY_COST_MULTIPLIER = {
  N: 1,
  R: 1.35,
  SR: 2,
  SSR: 3,
  UR: 4
};

const CREATOR_TIERS = [
  {
    id: "n",
    label: "N作成",
    tickets: 1,
    minRarity: "N",
    maxAtk: 8,
    maxDef: 12,
    spellMax: { draw: 2, maxCost: 1, heal: 30, graveHand: 1 },
    description: "低コストの基本カード向け"
  },
  {
    id: "r",
    label: "R作成",
    tickets: 3,
    minRarity: "R",
    maxAtk: 14,
    maxDef: 20,
    spellMax: { draw: 3, maxCost: 2, heal: 60, graveHand: 2 },
    description: "序盤から中盤で使いやすいカード向け"
  },
  {
    id: "sr",
    label: "SR作成",
    tickets: 6,
    minRarity: "SR",
    maxAtk: 22,
    maxDef: 32,
    spellMax: { draw: 5, maxCost: 3, heal: 100, graveHand: 3 },
    description: "主力になる強力なカード向け"
  },
  {
    id: "ssr",
    label: "SSR作成",
    tickets: 10,
    minRarity: "SSR",
    maxAtk: 34,
    maxDef: 48,
    spellMax: { draw: 7, maxCost: 4, heal: 150, graveHand: 4 },
    description: "切り札級のカード向け"
  },
  {
    id: "ur",
    label: "UR作成",
    tickets: 18,
    minRarity: "UR",
    maxAtk: 50,
    maxDef: 70,
    spellMax: { draw: 10, maxCost: 6, heal: 240, graveHand: 6 },
    description: "最高レアの超切り札カード向け"
  }
];

const CHARACTER_EFFECT_OPTIONS = [
  {
    id: "none",
    label: "効果なし",
    trigger: "none",
    effect: "none",
    maxByTier: { n: 0, r: 0, sr: 0, ssr: 0, ur: 0 },
    description: "効果を持たないかわりにコストを抑えられます。"
  },
  {
    id: "summonDraw",
    label: "召喚時ドロー",
    trigger: "summon",
    effect: "draw",
    maxByTier: { n: 1, r: 1, sr: 2, ssr: 3, ur: 4 },
    description: "召喚した時、山札からカードを引きます。"
  },
  {
    id: "summonHeal",
    label: "召喚時HP回復",
    trigger: "summon",
    effect: "heal",
    maxByTier: { n: 15, r: 30, sr: 55, ssr: 90, ur: 140 },
    description: "召喚した時、自分のHPを回復します。"
  },
  {
    id: "summonMaxCost",
    label: "召喚時最大コスト増加",
    trigger: "summon",
    effect: "maxCost",
    maxByTier: { n: 1, r: 1, sr: 2, ssr: 3, ur: 4 },
    description: "召喚した時、最大コストを増やします。"
  },
  {
    id: "attackLevel",
    label: "攻撃時レベル上昇",
    trigger: "attack",
    effect: "level",
    maxByTier: { n: 1, r: 2, sr: 3, ssr: 5, ur: 8 },
    description: "攻撃した時、自分のレベルを上げます。"
  },
  {
    id: "attackDamage",
    label: "攻撃時追加ダメージ",
    trigger: "attack",
    effect: "damage",
    maxByTier: { n: 3, r: 7, sr: 12, ssr: 20, ur: 32 },
    description: "攻撃した時、相手プレイヤーに追加ダメージを与えます。"
  },
  {
    id: "summonGraveHand",
    label: "召喚時手札を墓地へ",
    trigger: "summon",
    effect: "graveHand",
    maxByTier: { n: 1, r: 1, sr: 2, ssr: 3, ur: 5 },
    description: "召喚した時、手札を選んで墓地へ送り、そのコスト分レベルを上げます。"
  },
  {
    id: "attackGraveHand",
    label: "攻撃時手札を墓地へ",
    trigger: "attack",
    effect: "graveHand",
    maxByTier: { n: 1, r: 1, sr: 2, ssr: 3, ur: 5 },
    description: "攻撃した時、手札を選んで墓地へ送り、そのコスト分レベルを上げます。"
  },
  {
    id: "attackAbsorb",
    label: "攻撃時吸収",
    trigger: "attack",
    effect: "absorb",
    maxByTier: { n: 1, r: 1, sr: 1, ssr: 1, ur: 1 },
    description: "攻撃した時、自分の攻撃力分だけ防御を回復します。防御は元の最大値を超えません。"
  }
];

const DEFAULT_CARDS = [
  {
    id: "char-sprout-fairy",
    source: "default",
    type: "character",
    name: "芽吹きの精",
    icon: "芽",
    attribute: "wind",
    rarity: "N",
    cost: 1,
    atk: 2,
    def: 3,
    abilities: []
  },
  {
    id: "char-sakura-swordsman",
    source: "default",
    type: "character",
    name: "桜の剣士",
    icon: "桜",
    attribute: "sakura",
    rarity: "R",
    cost: 4,
    atk: 8,
    def: 8,
    abilities: []
  },
  {
    id: "char-moon-fox",
    source: "default",
    type: "character",
    name: "月影の狐",
    icon: "月",
    attribute: "moon",
    rarity: "R",
    cost: 4,
    atk: 10,
    def: 6,
    abilities: []
  },
  {
    id: "char-flower-knight",
    source: "default",
    type: "character",
    name: "花守の騎士",
    icon: "花",
    attribute: "sakura",
    rarity: "R",
    cost: 4,
    atk: 6,
    def: 12,
    abilities: []
  },
  {
    id: "char-sakura-dragon",
    source: "default",
    type: "character",
    name: "桜天龍",
    icon: "龍",
    attribute: "sakura",
    rarity: "SSR",
    cost: 8,
    atk: 18,
    def: 18,
    abilities: []
  },
  {
    id: "char-holy-wall",
    source: "default",
    type: "character",
    name: "聖壁の守護者",
    icon: "盾",
    attribute: "light",
    rarity: "R",
    cost: 4,
    atk: 5,
    def: 16,
    abilities: ["block"]
  },
  {
    id: "char-wind-archer",
    source: "default",
    type: "character",
    name: "風鈴の射手",
    icon: "風",
    attribute: "wind",
    rarity: "N",
    cost: 3,
    atk: 7,
    def: 6,
    abilities: []
  },
  {
    id: "char-drop-mage",
    source: "default",
    type: "character",
    name: "雫の魔導士",
    icon: "雫",
    attribute: "water",
    rarity: "SR",
    cost: 5,
    atk: 9,
    def: 13,
    abilities: []
  },
  {
    id: "spell-knowledge-book",
    source: "default",
    type: "spell",
    name: "知識の書",
    icon: "書",
    attribute: "memory",
    rarity: "N",
    cost: 2,
    spell: { effect: "draw", value: 2 }
  },
  {
    id: "spell-star-ritual",
    source: "default",
    type: "spell",
    name: "星読みの儀式",
    icon: "星",
    attribute: "moon",
    rarity: "SR",
    cost: 4,
    spell: { effect: "draw", value: 3 }
  },
  {
    id: "spell-mana-fountain",
    source: "default",
    type: "spell",
    name: "魔力の泉",
    icon: "泉",
    attribute: "water",
    rarity: "R",
    cost: 3,
    spell: { effect: "maxCost", value: 1 }
  },
  {
    id: "spell-life-prayer",
    source: "default",
    type: "spell",
    name: "生命の祈り",
    icon: "祈",
    attribute: "light",
    rarity: "N",
    cost: 3,
    spell: { effect: "heal", value: 40 }
  },
  {
    id: "char-crystal-lancer",
    source: "default",
    type: "character",
    name: "水晶の槍姫",
    icon: "晶",
    attribute: "water",
    rarity: "SR",
    cost: 6,
    atk: 15,
    def: 14,
    abilities: []
  },
  {
    id: "char-rainbow-guardian",
    source: "default",
    type: "character",
    name: "虹翼の守護者",
    icon: "虹",
    attribute: "light",
    rarity: "SR",
    cost: 6,
    atk: 10,
    def: 22,
    abilities: ["block"]
  },
  {
    id: "char-starlight-queen",
    source: "default",
    type: "character",
    name: "星灯の女王",
    icon: "灯",
    attribute: "sky",
    rarity: "SSR",
    cost: 9,
    atk: 24,
    def: 20,
    abilities: []
  },
  {
    id: "char-celestial-whale",
    source: "default",
    type: "character",
    name: "天海の大鯨",
    icon: "海",
    attribute: "water",
    rarity: "UR",
    cost: 10,
    atk: 18,
    def: 32,
    abilities: ["block"]
  },
  {
    id: "spell-grand-library",
    source: "default",
    type: "spell",
    name: "大図書館の扉",
    icon: "扉",
    attribute: "memory",
    rarity: "SSR",
    cost: 6,
    spell: { effect: "draw", value: 5 }
  },
  {
    id: "spell-celestial-spring",
    source: "default",
    type: "spell",
    name: "天恵の泉",
    icon: "恵",
    attribute: "water",
    rarity: "SR",
    cost: 6,
    spell: { effect: "maxCost", value: 2 }
  }
];

const SET_2_CARDS = [
  {
    id: "char-mist-apprentice",
    source: "set-2",
    type: "character",
    name: "霞の見習い",
    icon: "霞",
    attribute: "wind",
    rarity: "N",
    cost: 2,
    atk: 3,
    def: 5,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "graveHand", value: 1 }
  },
  {
    id: "char-bell-recycler",
    source: "set-2",
    type: "character",
    name: "鈴音の回収士",
    icon: "鈴",
    attribute: "light",
    rarity: "R",
    cost: 4,
    atk: 7,
    def: 9,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "draw", value: 1 }
  },
  {
    id: "char-azure-cleric",
    source: "set-2",
    type: "character",
    name: "蒼羽の癒し手",
    icon: "癒",
    attribute: "light",
    rarity: "R",
    cost: 4,
    atk: 5,
    def: 13,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "heal", value: 40 }
  },
  {
    id: "char-twilight-alchemist",
    source: "set-2",
    type: "character",
    name: "薄明の錬金士",
    icon: "錬",
    attribute: "memory",
    rarity: "SR",
    cost: 6,
    atk: 10,
    def: 16,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "graveHand", value: 2 }
  },
  {
    id: "char-comet-duelist",
    source: "set-2",
    type: "character",
    name: "彗星の決闘者",
    icon: "彗",
    attribute: "sky",
    rarity: "SR",
    cost: 6,
    atk: 16,
    def: 12,
    abilities: [],
    characterEffect: { trigger: "attack", effect: "damage", value: 12 }
  },
  {
    id: "char-honeydew-absorber",
    source: "set-2",
    type: "character",
    name: "甘露の吸収士",
    icon: "吸",
    attribute: "water",
    rarity: "SR",
    cost: 7,
    atk: 13,
    def: 18,
    abilities: [],
    characterEffect: { trigger: "attack", effect: "absorb", value: 1 }
  },
  {
    id: "char-crimson-rose-vampire",
    source: "set-2",
    type: "character",
    name: "紅薔薇の吸血姫",
    icon: "薔",
    attribute: "moon",
    rarity: "UR",
    cost: 10,
    atk: 22,
    def: 24,
    abilities: [],
    characterEffect: { trigger: "attack", effect: "absorb", value: 1 }
  },
  {
    id: "char-lotus-oracle",
    source: "set-2",
    type: "character",
    name: "蓮華の神託者",
    icon: "蓮",
    attribute: "light",
    rarity: "SSR",
    cost: 8,
    atk: 16,
    def: 24,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "graveHand", value: 3 }
  },
  {
    id: "char-sky-archive-dragon",
    source: "set-2",
    type: "character",
    name: "天文庫の龍",
    icon: "庫",
    attribute: "sky",
    rarity: "SSR",
    cost: 10,
    atk: 24,
    def: 26,
    abilities: [],
    characterEffect: { trigger: "attack", effect: "draw", value: 2 }
  },
  {
    id: "spell-parting-bloom",
    source: "set-2",
    type: "spell",
    name: "別れ花の儀",
    icon: "別",
    attribute: "sakura",
    rarity: "N",
    cost: 2,
    spell: { effect: "graveHand", value: 1 }
  },
  {
    id: "spell-memory-river",
    source: "set-2",
    type: "spell",
    name: "記憶の小川",
    icon: "記",
    attribute: "memory",
    rarity: "R",
    cost: 4,
    spell: { effect: "graveHand", value: 2 }
  },
  {
    id: "spell-moonlit-release",
    source: "set-2",
    type: "spell",
    name: "月明かりの解放",
    icon: "解",
    attribute: "moon",
    rarity: "SR",
    cost: 6,
    spell: { effect: "graveHand", value: 3 }
  },
  {
    id: "spell-sunrise-hymn",
    source: "set-2",
    type: "spell",
    name: "朝焼けの賛歌",
    icon: "朝",
    attribute: "light",
    rarity: "R",
    cost: 4,
    spell: { effect: "heal", value: 70 }
  },
  {
    id: "spell-angel-rest",
    source: "set-2",
    type: "spell",
    name: "天使の休息",
    icon: "休",
    attribute: "light",
    rarity: "SSR",
    cost: 7,
    spell: { effect: "heal", value: 130 }
  },
  {
    id: "spell-sage-contract",
    source: "set-2",
    type: "spell",
    name: "賢者の契約",
    icon: "契",
    attribute: "memory",
    rarity: "SR",
    cost: 5,
    spell: { effect: "draw", value: 4 }
  }
];

const GACHA_SETS = [
  {
    id: "set-1",
    label: "第1弾",
    name: "はじまりの桜星ガチャ",
    description: "桜、月、星海をテーマにした最初のカードパックです。",
    cardIds: DEFAULT_CARDS.map((card) => card.id)
  },
  {
    id: "set-2",
    label: "第2弾",
    name: "記憶解放ガチャ",
    description: "手札を墓地へ送り、レベルを伸ばすカードと吸収キャラを中心にした第2弾パックです。",
    cardIds: SET_2_CARDS.map((card) => card.id)
  }
];

const DEFAULT_GACHA_SET_ID = GACHA_SETS[0].id;

const DEFAULT_DECK_COUNTS = {
  "char-sprout-fairy": 36,
  "char-sakura-swordsman": 36,
  "char-moon-fox": 36,
  "char-flower-knight": 30,
  "char-holy-wall": 24,
  "char-sakura-dragon": 15,
  "char-wind-archer": 42,
  "char-drop-mage": 27,
  "spell-knowledge-book": 24,
  "spell-star-ritual": 12,
  "spell-mana-fountain": 9,
  "spell-life-prayer": 9
};

const state = {
  screen: "menu",
  customCards: [],
  inventory: {},
  creatorTickets: 0,
  gachaBalls: 0,
  gold: 0,
  dailyMissions: { date: "", progress: {}, claimed: [] },
  cardUpgrades: {},
  questClears: [],
  marketPurchases: { date: "", shop: [], auction: [] },
  lastDailyReward: "",
  gachaHistory: [],
  gachaResults: [],
  activeGachaSetId: DEFAULT_GACHA_SET_ID,
  playerName: "",
  auctions: {
    docs: {},
    bidInputs: {},
    sellInputs: {},
    feedKey: "",
    userFeedReady: false,
    userUnsubscribe: null,
    unsubscribers: [],
    busy: false,
    message: ""
  },
  decks: [],
  activeDeckId: "",
  tutorialSeen: false,
  deckIds: [],
  battleHandSort: "draw",
  autoBattle: false,
  cardDetailId: null,
  cardDetailHandUid: null,
  graveChoice: null,
  creatorDraft: {
    type: "character",
    tierId: "n",
    name: "",
    icon: "桜",
    attribute: "sakura",
    atk: 8,
    def: 8,
    block: false,
    characterEffect: "none",
    characterEffectValue: 1,
    effect: "draw",
    value: 2
  },
  battle: null,
  fx: null,
  cloud: {
    status: "loading",
    configured: false,
    enabled: false,
    needsChoice: false,
    user: null,
    remoteData: null,
    message: "クラウド保存を確認しています。",
    lastSync: "",
    saving: false,
    applyingRemote: false
  },
  online: {
    roomId: "",
    inputRoomId: "",
    playerIndex: null,
    room: null,
    message: "",
    busy: false,
    unsubscribe: null
  }
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer = null;
let fxTimer = null;
let cloudSaveTimer = null;
let onlineProfileTimer = null;
let cloudApi = null;

init();
registerServiceWorker();

function init() {
  state.customCards = readCustomCards();
  state.inventory = readInventory();
  state.creatorTickets = readCreatorTickets();
  state.gachaBalls = readGachaBalls();
  state.gold = readGold();
  state.playerName = readPlayerName();
  state.dailyMissions = readDailyMissions();
  state.cardUpgrades = readCardUpgrades();
  state.questClears = readQuestClears();
  state.marketPurchases = readMarketPurchases();
  state.lastDailyReward = readLastDailyReward();
  state.gachaHistory = readGachaHistory();
  state.tutorialSeen = readTutorialSeen();
  state.autoBattle = readAutoBattle();
  normalizeInventory();
  initializeDailyMissions();
  grantDailyRewardIfAvailable();
  initializeDecks();
  if (!state.tutorialSeen) {
    state.screen = "tutorial";
  }
  state.cloud.enabled = readCloudEnabled();
  attachEvents();
  render();
  initCloudSave();
}

function attachEvents() {
  app.addEventListener("click", handleClick);
  app.addEventListener("input", handleInput);
  app.addEventListener("change", handleInput);
  window.addEventListener("beforeunload", syncAiBattleSave);
  window.addEventListener("beforeunload", leaveOnlineRoomSilently);
  window.addEventListener("beforeunload", unsubscribeAuctionFeed);
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "screen") {
    state.cardDetailId = null;
    state.cardDetailHandUid = null;
    state.graveChoice = null;
    state.screen = button.dataset.screen;
    render();
    return;
  }

  if (action === "finish-tutorial") {
    saveTutorialSeen(true);
    state.screen = "menu";
    render();
    return;
  }

  if (action === "tutorial-gacha") {
    saveTutorialSeen(true);
    state.screen = "gacha";
    render();
    return;
  }

  if (action === "tutorial-deck") {
    saveTutorialSeen(true);
    state.screen = "deck";
    render();
    return;
  }

  if (action === "tutorial-ai") {
    saveTutorialSeen(true);
    startBattle("ai");
    return;
  }

  if (action === "view-card") {
    showCardDetail(button.dataset.cardId);
    return;
  }

  if (action === "view-hand-card") {
    showHandCardDetail(button.dataset.uid);
    return;
  }

  if (action === "close-card-detail") {
    state.cardDetailId = null;
    state.cardDetailHandUid = null;
    render();
    return;
  }

  if (action === "toggle-grave-choice") {
    toggleGraveChoice(button.dataset.uid);
    return;
  }

  if (action === "confirm-grave-choice") {
    confirmGraveChoice();
    return;
  }

  if (action === "cancel-grave-choice") {
    cancelGraveChoice();
    return;
  }

  if (action === "reset-deck") {
    state.deckIds = buildDefaultDeck();
    state.deckIds = sanitizeDeck(state.deckIds);
    saveDeck();
    showToast("所持カード内で標準デッキを作り直しました。");
    render();
    return;
  }

  if (action === "select-deck") {
    selectDeck(button.dataset.deckId);
    return;
  }

  if (action === "create-deck") {
    createNewDeck();
    return;
  }

  if (action === "duplicate-deck") {
    duplicateActiveDeck();
    return;
  }

  if (action === "delete-deck") {
    deleteActiveDeck();
    return;
  }

  if (action === "gacha") {
    runGacha(Number(button.dataset.count) || 1);
    return;
  }

  if (action === "claim-daily-mission") {
    claimDailyMission(button.dataset.missionId);
    return;
  }

  if (action === "enhance-card") {
    enhanceCard(button.dataset.cardId);
    return;
  }

  if (action === "evolve-card") {
    evolveCard(button.dataset.cardId);
    return;
  }

  if (action === "select-gacha-set") {
    state.activeGachaSetId = button.dataset.setId || DEFAULT_GACHA_SET_ID;
    state.gachaResults = [];
    render();
    return;
  }

  if (action === "start-quest") {
    startQuestBattle(button.dataset.stageId);
    return;
  }

  if (action === "buy-shop-card") {
    buyMarketListing("shop", button.dataset.listingId);
    return;
  }

  if (action === "buy-auction-card") {
    placeAuctionBid(button.dataset.listingId);
    return;
  }

  if (action === "claim-auction-card") {
    claimAuctionCard(button.dataset.listingId);
    return;
  }

  if (action === "claim-auction-refund") {
    claimAuctionRefund(button.dataset.listingId);
    return;
  }

  if (action === "forfeit-auction-listing") {
    forfeitAuctionListing(button.dataset.listingId);
    return;
  }

  if (action === "sell-card") {
    sellOwnedCard(button.dataset.cardId);
    return;
  }

  if (action === "list-auction-card") {
    createUserAuctionListing(button.dataset.cardId);
    return;
  }

  if (action === "cancel-auction-listing") {
    cancelAuctionListing(button.dataset.listingId);
    return;
  }

  if (action === "claim-auction-payout") {
    claimAuctionPayout(button.dataset.listingId);
    return;
  }

  if (action === "cloud-login") {
    signInWithGoogle();
    return;
  }

  if (action === "cloud-logout") {
    signOutCloud();
    return;
  }

  if (action === "cloud-load") {
    loadCloudSaveChoice();
    return;
  }

  if (action === "cloud-upload") {
    uploadLocalSaveChoice();
    return;
  }

  if (action === "cloud-force-load") {
    forceLoadCloudSave();
    return;
  }

  if (action === "cloud-force-upload") {
    forceUploadCloudSave();
    return;
  }

  if (action === "create-online-room") {
    createOnlineRoom();
    return;
  }

  if (action === "join-online-room") {
    joinOnlineRoom();
    return;
  }

  if (action === "leave-online-room") {
    leaveOnlineRoom();
    return;
  }

  if (action === "start-online-battle") {
    startOnlineBattle();
    return;
  }

  if (action === "add-deck-card") {
    addDeckCard(button.dataset.cardId);
    return;
  }

  if (action === "remove-deck-card") {
    removeDeckCard(button.dataset.cardId);
    return;
  }

  if (action === "save-card") {
    saveCreatedCard();
    return;
  }

  if (action === "start-battle") {
    startBattle();
    return;
  }

  if (action === "start-ai-battle") {
    startBattle("ai");
    return;
  }

  if (action === "new-ai-battle") {
    if (!window.confirm("現在のAI戦を終了して、新しいAI戦を始めますか？")) return;
    state.battle = null;
    clearSavedAiBattle();
    startBattle("ai", { forceNew: true });
    return;
  }

  if (action === "spin-roulette") {
    spinRoulette();
    return;
  }

  if (action === "ready-next-turn") {
    readyNextTurn();
    return;
  }

  if (action === "toggle-auto-battle") {
    saveAutoBattle(!state.autoBattle);
    showToast(state.autoBattle ? "自動戦闘をONにしました。" : "自動戦闘をOFFにしました。");
    render();
    maybeScheduleAutoBattle();
    return;
  }

  if (action === "play-card") {
    playHandCard(button.dataset.uid);
    return;
  }

  if (action === "level-card") {
    sendHandCardToGrave(button.dataset.uid);
    return;
  }

  if (action === "set-hand-sort") {
    setBattleHandSort(button.dataset.sort);
    return;
  }

  if (action === "battle-enhance-card") {
    enhanceBattleUnit(button.dataset.uid);
    return;
  }

  if (action === "select-attacker") {
    selectAttacker(button.dataset.uid);
    return;
  }

  if (action === "attack-card") {
    attackCard(button.dataset.uid);
    return;
  }

  if (action === "attack-player") {
    attackPlayer();
    return;
  }

  if (action === "cancel-attack") {
    state.battle.pendingAttackerUid = null;
    render();
    syncOnlineBattle();
    return;
  }

  if (action === "end-turn") {
    endTurn();
    return;
  }

  if (action === "surrender") {
    surrender();
    return;
  }

  if (action === "new-battle") {
    const previousMode = state.battle?.mode || "local";
    const previousQuestStageId = state.battle?.questStageId;
    state.battle = null;
    if (previousMode === "online") {
      resetOnlineRoomBattle();
      return;
    }
    if (previousMode === "ai") clearSavedAiBattle();
    if (previousMode === "quest" && previousQuestStageId) {
      startQuestBattle(previousQuestStageId);
      return;
    }
    startBattle(previousMode, { forceNew: true });
  }
}

function handleInput(event) {
  const field = event.target.dataset.field;
  if (!field) return;

  if (field === "onlineRoomId") {
    state.online.inputRoomId = normalizeOnlineRoomId(event.target.value);
    render();
    return;
  }

  if (field === "playerName") {
    savePlayerName(event.target.value);
    return;
  }

  if (field.startsWith("auctionBid:")) {
    const listingId = field.slice("auctionBid:".length);
    state.auctions.bidInputs[listingId] = clampInteger(event.target.value, 0, 99999999);
    render();
    return;
  }

  if (field.startsWith("auctionStart:")) {
    const cardId = field.slice("auctionStart:".length);
    state.auctions.sellInputs[cardId] = clampInteger(event.target.value, 0, 99999999);
    render();
    return;
  }

  if (field === "activeDeckName") {
    renameActiveDeck(event.target.value);
    render();
    return;
  }

  if (event.target.type === "checkbox") {
    state.creatorDraft[field] = event.target.checked;
  } else if (event.target.type === "number") {
    state.creatorDraft[field] = clampInteger(event.target.value, 0, 999);
  } else {
    state.creatorDraft[field] = event.target.value;
  }

  if (field === "type") {
    state.creatorDraft.icon = state.creatorDraft.type === "character" ? "桜" : "書";
  }
  if (field === "attribute") {
    state.creatorDraft.attribute = normalizeCardAttribute(state.creatorDraft.attribute);
  }

  clampCreatorDraftToTier();
  render();
}

function render() {
  syncAiBattleSave();
  app.innerHTML = `
    <div class="app-shell">
      ${renderTopbar()}
      <main class="main">
        ${renderScreen()}
      </main>
    </div>
    ${renderFxOverlay()}
    ${renderCardDetailOverlay()}
    ${renderGraveChoiceOverlay()}
  `;
}

function renderGraveChoiceOverlay() {
  const choice = state.graveChoice;
  const battle = state.battle;
  if (!choice || !battle) return "";
  const player = battle.players[choice.playerIndex];
  if (!player) return "";
  const selected = new Set(choice.selectedUids || []);
  const selectableCards = player.hand
    .map((handCard) => ({ handCard, card: getBattleCard(handCard.cardId, player) }))
    .filter((entry) => entry.card);
  const selectedCost = selectableCards
    .filter((entry) => selected.has(entry.handCard.uid))
    .reduce((sum, entry) => sum + entry.card.cost, 0);
  const max = Math.max(1, choice.max || 1);
  return `
    <div class="card-detail-overlay grave-choice-overlay" role="dialog" aria-modal="true" aria-label="墓地へ送るカード選択">
      <div class="card-detail-panel grave-choice-panel">
        <div class="card-detail-top">
          <strong>手札を墓地へ送る</strong>
          <button class="ghost" data-action="cancel-grave-choice">やめる</button>
        </div>
        <div class="notice">
          ${escapeHtml(choice.sourceName)}の効果です。手札から最大${max}枚選び、墓地へ送ります。送ったカードのコスト分レベルが上がります。
        </div>
        <div class="toolbar">
          <span class="pill aqua">選択 ${selected.size}/${max}枚</span>
          <span class="pill pink">LV +${selectedCost}</span>
        </div>
        <div class="grave-choice-list">
          ${selectableCards.length ? selectableCards.map(({ handCard, card }) => {
            const isSelected = selected.has(handCard.uid);
            const disabled = !isSelected && selected.size >= max;
            return `
              <button class="grave-choice-card ${isSelected ? "selected" : ""}" data-action="toggle-grave-choice" data-uid="${handCard.uid}" ${disabled ? "disabled" : ""}>
                <span class="grave-choice-name">${escapeHtml(card.name)}</span>
                <span class="pill strong">コスト ${card.cost}</span>
                <small>${escapeHtml(cardEffectText(card))}</small>
              </button>
            `;
          }).join("") : `<div class="empty-field">選べる手札がありません</div>`}
        </div>
        <div class="detail-actions">
          <button class="accent" data-action="confirm-grave-choice" ${selected.size ? "" : "disabled"}>選んだカードを墓地へ送る</button>
          <button data-action="cancel-grave-choice">送らない</button>
        </div>
      </div>
    </div>
  `;
}

function renderCardDetailOverlay() {
  const handContext = getHandDetailContext();
  const card = handContext?.card || getCard(state.cardDetailId);
  if (!card) return "";
  return `
    <div class="card-detail-overlay" role="dialog" aria-modal="true" aria-label="カード詳細">
      <div class="card-detail-panel">
        <div class="card-detail-top">
          <strong>カード詳細</strong>
          <button class="ghost" data-action="close-card-detail">閉じる</button>
        </div>
        ${renderGameCard(card, { mode: "detail", extraClass: "detail-game-card", staticCard: true })}
        ${renderCardEffectSummary(card)}
        ${handContext ? renderHandDetailActions(handContext) : ""}
      </div>
    </div>
  `;
}

function renderFxOverlay() {
  const fx = state.fx;
  if (!fx) return "";
  const typeClass = `fx-${escapeAttr(fx.type)}`;
  const rarityClass = fx.rarity ? `rarity-${escapeAttr(fx.rarity)}` : "";
  return `
    <div class="fx-overlay ${typeClass} ${rarityClass}" aria-live="polite">
      <div class="fx-burst">
        <span class="fx-ring"></span>
        <span class="fx-spark fx-spark-a"></span>
        <span class="fx-spark fx-spark-b"></span>
        <span class="fx-spark fx-spark-c"></span>
        <strong>${escapeHtml(fx.title)}</strong>
        ${fx.detail ? `<small>${escapeHtml(fx.detail)}</small>` : ""}
      </div>
    </div>
  `;
}

function renderTopbar() {
  const battleMode = state.screen === "battle";
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">LL</div>
        <div>
          <h1>レベルリンク・カードバトル</h1>
          <small>召喚、墓地送り、レベル倍率で戦うカードゲーム</small>
        </div>
      </div>
      <nav class="top-actions" aria-label="メインメニュー">
        <button class="ghost" data-action="screen" data-screen="menu">メニュー</button>
        <button class="ghost" data-action="screen" data-screen="tutorial">遊び方</button>
        <button class="ghost" data-action="screen" data-screen="gacha">ガチャ</button>
        <button class="ghost" data-action="screen" data-screen="missions">ミッション</button>
        <button class="ghost" data-action="screen" data-screen="quest">クエスト</button>
        <button class="ghost" data-action="screen" data-screen="market">ショップ</button>
        <button class="ghost" data-action="screen" data-screen="deck">山札編成</button>
        <button class="ghost" data-action="screen" data-screen="creator">カード作成</button>
        <button class="ghost" data-action="screen" data-screen="cloud">クラウド保存</button>
        <button class="ghost" data-action="screen" data-screen="online">オンライン</button>
        <button class="${battleMode ? "accent" : "ghost"}" data-action="start-battle">バトル開始</button>
        <button class="ghost" data-action="start-ai-battle">AI戦</button>
      </nav>
    </header>
  `;
}

function renderScreen() {
  if (state.screen === "tutorial") return renderTutorial();
  if (state.screen === "gacha") return renderGacha();
  if (state.screen === "missions") return renderDailyMissions();
  if (state.screen === "quest") return renderQuest();
  if (state.screen === "market") return renderMarket();
  if (state.screen === "deck") return renderDeckBuilder();
  if (state.screen === "upgrade") return renderMenu();
  if (state.screen === "creator") return renderCardCreator();
  if (state.screen === "battle") return renderBattle();
  if (state.screen === "cloud") return renderCloudSave();
  if (state.screen === "online") return renderOnlinePlaceholder();
  return renderMenu();
}

function renderMenu() {
  return `
    <section class="menu-grid">
      ${renderMenuTile("遊び方", "初めて遊ぶ人向けに、カード入手からバトルの流れまで確認できます。", "？", "tutorial")}
      ${renderMenuTile("ガチャ", "ガチャ玉を使ってカードと創造チケットを入手します。", "召", "gacha")}
      ${renderMenuTile("デイリーミッション", "毎日のお題を達成してガチャ玉やゴールドを受け取ります。", "日", "missions")}
      ${renderMenuTile("クエスト", "ステージを順番にクリアしてゴールドを集めます。", "冒", "quest")}
      ${renderMenuTile("ショップ・オークション", "ゴールドでカードを買ったり、余ったカードを売却します。", "市", "market")}
      ${renderMenuTile("山札編成", "100〜300枚の山札を所持カードと作成カードから組みます。", "山", "deck")}
      ${renderMenuTile("カード作成", "ガチャで入手した創造チケットを消費してカードを作ります。", "作", "creator")}
      ${renderMenuTile("クラウド保存", "Googleアカウントでログインして別端末にもデータを引き継ぎます。", "雲", "cloud")}
      <button class="menu-tile" data-action="start-battle">
        <span class="menu-icon">戦</span>
        <span><strong>バトル開始</strong>1台で遊べる2人対戦を開始します。先攻はルーレットで決まります。</span>
      </button>
      <button class="menu-tile" data-action="start-ai-battle">
        <span class="menu-icon">AI</span>
        <span><strong>AIとバトル</strong>1人で遊べるCPU対戦を開始します。AIは召喚、呪文、墓地送り、攻撃を自動で行います。</span>
      </button>
      ${renderMenuTile("オンライン対戦", "Googleログイン後、部屋IDを作って離れた相手と対戦できます。", "通", "online")}
    </section>
  `;
}

function renderMenuTile(title, body, icon, screen) {
  return `
    <button class="menu-tile" data-action="screen" data-screen="${screen}">
      <span class="menu-icon">${escapeHtml(icon)}</span>
      <span><strong>${escapeHtml(title)}</strong>${escapeHtml(body)}</span>
    </button>
  `;
}

function renderPlayerNameEditor(helpText = "") {
  return `
    <label class="player-name-editor">
      <span>ゲーム内の名前</span>
      <input data-field="playerName" maxlength="16" value="${escapeAttr(state.playerName)}" placeholder="${escapeAttr(getPlayerDisplayName())}">
      ${helpText ? `<small>${escapeHtml(helpText)}</small>` : ""}
    </label>
  `;
}

function renderTutorial() {
  return `
    <section class="stack tutorial-screen">
      <div class="band tutorial-hero">
        <div>
          <span class="pill pink strong">初回ガイド</span>
          <h2>まずは「カードを集めて、AI戦で試す」と覚えればOKです</h2>
          <p>このゲームは、キャラクターを出して相手HPを0にするカードバトルです。手札を墓地へ送るとレベルが上がり、自分のキャラ全体が強くなるのが大事な特徴です。</p>
        </div>
        <div class="tutorial-actions">
          <button class="primary" data-action="tutorial-gacha">ガチャへ進む</button>
          <button class="accent" data-action="tutorial-ai">AI戦で試す</button>
          <button data-action="finish-tutorial">メニューへ</button>
        </div>
      </div>

      <div class="tutorial-grid">
        ${renderTutorialCard("1", "カードを集める", `${GACHA_BALL_NAME}を使うと、1個で5枚カードが出ます。10連は${GACHA_TEN_COST}個で50枚です。`) }
        ${renderTutorialCard("2", "山札を作る", `山札は${MIN_DECK_SIZE}〜${DECK_SIZE}枚です。持っている枚数までしか入れられません。迷ったら最初の山札のままで大丈夫です。`) }
        ${renderTutorialCard("3", "AI戦で練習", "最初はAI戦がおすすめです。途中でやめても、次にAI戦を開いた時に続きから遊べます。") }
        ${renderTutorialCard("4", "クエストで報酬", `クエスト初回クリアで${GACHA_BALL_NAME}10個、勝利で${GOLD_NAME}が手に入ります。`) }
      </div>

      <div class="band">
        <div class="section-title">
          <div>
            <h2>バトルの基本</h2>
            <p>毎ターン、コストを使って行動します。手札はタップすると大きく表示され、そこから召喚・使用・墓地送りを選べます。</p>
          </div>
        </div>
        <div class="tutorial-steps">
          ${renderTutorialStep("ターン開始", `コストが最大まで回復し、山札から${TURN_DRAW_COUNT}枚ドローします。召喚済みキャラはまた攻撃できるようになります。`)}
          ${renderTutorialStep("召喚・呪文", "キャラカードは場に出ます。呪文カードは効果を使ったあと墓地へ行きます。召喚したターンのキャラは攻撃できません。")}
          ${renderTutorialStep("墓地送り", "手札のカードを墓地へ送ると、そのカードのコスト分だけレベルが上がります。レベルが上がるほどキャラの攻撃・防御に倍率がかかります。")}
          ${renderTutorialStep("攻撃", "キャラは1ターンに1回攻撃できます。キャラ同士の戦闘では、攻撃側も反撃ダメージを受けます。")}
        </div>
      </div>

      <div class="split">
        <div class="band stack">
          <div class="section-title">
            <div>
              <h2>勝つための考え方</h2>
              <p>強いカードを出すだけでなく、いつ墓地へ送るかがかなり大事です。</p>
            </div>
          </div>
          <div class="tutorial-tip-list">
            <div><strong>序盤</strong><span>低コストキャラやドローで手札を整えます。</span></div>
            <div><strong>中盤</strong><span>不要なカードを墓地へ送り、レベル倍率を伸ばします。</span></div>
            <div><strong>守り</strong><span>ブロック持ちのキャラは攻撃対象を引き受けます。</span></div>
            <div><strong>攻め</strong><span>高火力キャラや吸収キャラで相手の場を崩します。</span></div>
          </div>
        </div>

        <div class="band stack">
          <div class="section-title">
            <div>
              <h2>属性</h2>
              <p>属性はカードの分類と見た目の個性です。今のルールでは、属性による有利・不利やダメージ倍率はありません。</p>
            </div>
          </div>
          <div class="tutorial-tip-list">
            <div><strong>桜・月・水など</strong><span>カードの雰囲気やイラスト色に使われます。</span></div>
            <div><strong>戦闘</strong><span>勝敗は攻撃力、防御力、効果、レベル倍率で決まります。</span></div>
            <div><strong>迷ったら</strong><span>属性より、コストと効果を優先して見れば大丈夫です。</span></div>
          </div>
        </div>
      </div>

      <div class="band">
        <div class="section-title">
          <div>
            <h2>画面で迷った時</h2>
            <p>スマホではカードが小さく表示されます。カードを一度選ぶと詳細が開くので、そこで効果を確認してから行動できます。</p>
          </div>
        </div>
        <div class="tutorial-grid compact">
          ${renderTutorialCard("灰", "コスト不足", "使えるコストより高いカードは灰色になります。今は出せない合図です。")}
          ${renderTutorialCard("並", "手札の並べ替え", "バトル中の手札は、引いた順・コスト低い順・コスト高い順に並べ替えできます。")}
          ${renderTutorialCard("雲", "データ保存", "Googleログインすると、スマホとPCでゲームデータを引き継げます。")}
          ${renderTutorialCard("通", "オンライン", "部屋IDを作って相手に伝えるとオンライン対戦ができます。")}
        </div>
      </div>

      <div class="band tutorial-finish">
        <h2>準備できたら始めましょう</h2>
        <div class="toolbar">
          <button class="primary" data-action="tutorial-gacha">ガチャでカード入手</button>
          <button data-action="tutorial-deck">山札を確認</button>
          <button class="accent" data-action="tutorial-ai">AI戦を始める</button>
          <button data-action="finish-tutorial">メニューへ戻る</button>
        </div>
      </div>
    </section>
  `;
}

function renderTutorialCard(mark, title, body) {
  return `
    <div class="tutorial-card">
      <span class="tutorial-mark">${escapeHtml(mark)}</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(body)}</p>
    </div>
  `;
}

function renderTutorialStep(title, body) {
  return `
    <div class="tutorial-step">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(body)}</span>
    </div>
  `;
}

function renderQuest() {
  const nextStage = getHighestUnlockedQuestNumber();
  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>クエスト</h2>
            <p>1-1から順番に進みます。各エリアは10ステージで、クリアすると次のステージが解放されます。</p>
          </div>
          <div class="toolbar">
            <span class="pill mint strong">${GOLD_NAME} ${state.gold}</span>
            <span class="pill aqua">次 ${formatQuestStageId(numberToQuestStage(nextStage))}</span>
            <span class="pill pink">クリア ${state.questClears.length}/${QUEST_AREA_COUNT * QUEST_STAGES_PER_AREA}</span>
          </div>
        </div>
      </div>
      ${Array.from({ length: QUEST_AREA_COUNT }, (_, areaIndex) => renderQuestArea(areaIndex + 1)).join("")}
    </section>
  `;
}

function renderQuestArea(area) {
  return `
    <div class="band quest-area">
      <div class="section-title">
        <div>
          <h3>エリア ${area}</h3>
          <p>${escapeHtml(getQuestAreaName(area))}</p>
        </div>
      </div>
      <div class="quest-grid">
        ${Array.from({ length: QUEST_STAGES_PER_AREA }, (_, stageIndex) => renderQuestStageButton(createQuestStage(area, stageIndex + 1))).join("")}
      </div>
    </div>
  `;
}

function renderQuestStageButton(stage) {
  const unlocked = isQuestStageUnlocked(stage);
  const cleared = isQuestStageCleared(stage.id);
  return `
    <button class="quest-stage ${cleared ? "cleared" : ""}" data-action="start-quest" data-stage-id="${stage.id}" ${unlocked ? "" : "disabled"}>
      <strong>${escapeHtml(stage.id)}</strong>
      <span>${cleared ? "CLEAR" : unlocked ? "挑戦" : "LOCK"}</span>
      <small>${GOLD_NAME} ${stage.rewardGold}</small>
      <small>初回 ${GACHA_BALL_NAME} ${QUEST_FIRST_CLEAR_GACHA_BALL_REWARD}個</small>
    </button>
  `;
}

function renderDailyMissions() {
  initializeDailyMissions();
  const completed = DAILY_MISSION_DEFINITIONS.filter((mission) => isDailyMissionComplete(mission)).length;
  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>デイリーミッション</h2>
            <p>毎日0時に更新されます。達成したミッションは報酬を受け取れます。</p>
          </div>
          <div class="toolbar">
            <span class="pill pink strong">${completed}/${DAILY_MISSION_DEFINITIONS.length} 達成</span>
            <span class="pill mint">${GACHA_BALL_NAME} ${state.gachaBalls}個</span>
            <span class="pill aqua">${GOLD_NAME} ${state.gold}</span>
          </div>
        </div>
      </div>
      <div class="mission-grid">
        ${DAILY_MISSION_DEFINITIONS.map(renderDailyMissionCard).join("")}
      </div>
    </section>
  `;
}

function renderDailyMissionCard(mission) {
  const progress = getDailyMissionProgress(mission.id);
  const complete = isDailyMissionComplete(mission);
  const claimed = isDailyMissionClaimed(mission.id);
  const rate = Math.min(100, Math.round((progress / mission.target) * 100));
  return `
    <article class="band mission-card">
      <div class="mission-top">
        <div>
          <h3>${escapeHtml(mission.title)}</h3>
          <p>${escapeHtml(mission.body)}</p>
        </div>
        <span class="pill ${claimed ? "mint" : complete ? "pink strong" : "aqua"}">${claimed ? "受取済み" : complete ? "達成" : `${progress}/${mission.target}`}</span>
      </div>
      <div class="mission-bar"><div style="width: ${rate}%"></div></div>
      <div class="toolbar">
        ${renderDailyMissionReward(mission.reward)}
        <button class="primary" data-action="claim-daily-mission" data-mission-id="${escapeAttr(mission.id)}" ${complete && !claimed ? "" : "disabled"}>${claimed ? "受取済み" : "報酬を受け取る"}</button>
      </div>
    </article>
  `;
}

function renderDailyMissionReward(reward) {
  const parts = [];
  if (reward.gachaBalls) parts.push(`${GACHA_BALL_NAME} ${reward.gachaBalls}`);
  if (reward.gold) parts.push(`${GOLD_NAME} ${reward.gold}`);
  if (reward.creatorTickets) parts.push(`${CREATOR_TICKET_NAME} ${reward.creatorTickets}`);
  return `<span class="pill mint strong">報酬 ${escapeHtml(parts.join(" / "))}</span>`;
}

function renderMarket() {
  const shopListings = getDailyShopListings();
  const npcAuctionListings = getDailyAuctionListings();
  const auctionListings = getVisibleAuctionListings(npcAuctionListings);
  const sellableCards = getSellableCards();
  ensureAuctionFeed(npcAuctionListings);
  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>ショップ・オークション</h2>
            <p>クエストで集めた${GOLD_NAME}を使ってカードを入手します。オークションは入札式です。</p>
          </div>
          <div class="toolbar">
            <span class="pill mint strong">${GOLD_NAME} ${state.gold}</span>
            <span class="pill aqua">ショップは毎日入れ替え</span>
          </div>
        </div>
        ${state.auctions.message ? `<div class="notice">${escapeHtml(state.auctions.message)}</div>` : ""}
      </div>

      <div class="band">
        <div class="section-title">
          <div>
            <h3>デイリーショップ</h3>
            <p>表示中のカードを固定価格で1枚ずつ購入できます。</p>
          </div>
        </div>
        <div class="market-grid">
          ${shopListings.map((listing) => renderMarketListing(listing, "shop")).join("")}
        </div>
      </div>

      <div class="band">
        <div class="section-title">
          <div>
            <h3>カードオークション</h3>
            <p>終了時刻までに一番高く入札した人が落札できます。終了10分以内に更新されると、残り時間が10分に戻ります。入札した${GOLD_NAME}はその時点で預かり金になります。</p>
          </div>
          <div class="toolbar">
            ${state.cloud.user ? `<span class="pill aqua">ログイン中</span>` : `<button class="primary" data-action="cloud-login" ${state.cloud.configured ? "" : "disabled"}>Googleログイン</button>`}
          </div>
        </div>
        ${state.cloud.user ? renderMyAuctionDashboard() : ""}
        <div class="market-grid">
          ${auctionListings.length ? auctionListings.map(renderAuctionListing).join("") : `<div class="empty-field">表示できるオークションがありません</div>`}
        </div>
      </div>

      <div class="band">
        <div class="section-title">
          <div>
            <h3>カード売却・出品</h3>
            <p>山札に入れていない余りカードだけ売却やユーザーオークション出品ができます。</p>
          </div>
        </div>
        <div class="market-sell-list">
          ${sellableCards.length ? sellableCards.map(renderSellableCard).join("") : `<div class="empty-field">売却できる余りカードがありません</div>`}
        </div>
      </div>
    </section>
  `;
}

function renderAuctionListing(listing) {
  const card = getCard(listing.cardId);
  if (!card) return "";
  const auction = getAuctionDoc(listing);
  const status = getAuctionStatus(auction);
  const highestBid = auction.highestBid || 0;
  const currentPrice = highestBid || auction.startPrice || listing.price;
  const minimumBid = getMinimumAuctionBid(auction);
  const inputValue = state.auctions.bidInputs[listing.id] || minimumBid;
  const isSignedIn = Boolean(state.cloud.user);
  const isUserAuction = auction.kind === "user";
  const isSeller = isSignedIn && auction.sellerUid === state.cloud.user.uid;
  const isHighestBidder = isSignedIn && auction.highestBidderUid === state.cloud.user.uid;
  const refundAmount = isSignedIn ? getAuctionRefundAmount(auction, state.cloud.user.uid) : 0;
  const canBid = isSignedIn && status === "active" && inputValue >= minimumBid && state.gold >= inputValue && !isHighestBidder && !isSeller && !state.auctions.busy;
  const canClaim = isHighestBidder && ["ended", "overdue"].includes(status) && !state.auctions.busy;
  const canCancel = isSeller && status !== "claimed" && highestBid <= 0 && !state.auctions.busy;
  const canClaimPayout = isSeller && status === "claimed" && highestBid > 0 && !auction.sellerPaid && !state.auctions.busy;
  const canForfeit = isSeller && status === "overdue" && highestBid > 0 && !state.auctions.busy;
  const statusText = auctionStatusText(auction, status);
  return `
    <article class="market-card auction-card">
      ${renderGameCard(card, { mode: "library", staticCard: true })}
      <div class="market-price-row">
        <span class="pill mint strong">現在 ${GOLD_NAME} ${currentPrice}</span>
        <span class="pill aqua">${escapeHtml(statusText)}</span>
      </div>
      <div class="auction-info">
        <span>出品者 ${isUserAuction ? escapeHtml(auction.sellerName || "ユーザー") : "NPC"}</span>
        <span>開始価格 ${GOLD_NAME} ${auction.startPrice || listing.price}</span>
        <span>最高入札者 ${escapeHtml(auction.highestBidderName || "なし")}</span>
        <span>残り ${escapeHtml(formatAuctionRemaining(auction.endAtMs))}</span>
        ${status === "ended" && isSeller ? `<span>受け取り期限 ${escapeHtml(formatAuctionRemaining(auction.endAtMs + AUCTION_CLAIM_GRACE_MS))}</span>` : ""}
      </div>
      ${refundAmount > 0 ? `
        <button class="primary" data-action="claim-auction-refund" data-listing-id="${escapeAttr(listing.id)}" ${state.auctions.busy ? "disabled" : ""}>返金 ${GOLD_NAME} ${refundAmount} を受け取る</button>
      ` : ""}
      ${isSeller && status === "active" ? `
        <button class="ghost" data-action="cancel-auction-listing" data-listing-id="${escapeAttr(listing.id)}" ${canCancel ? "" : "disabled"}>${highestBid > 0 ? "入札中のため取消不可" : "出品を取り消す"}</button>
        <small class="market-note">${highestBid > 0 ? "入札が入った出品は取り消せません。" : "取り消すとカードが手元に戻ります。"}</small>
      ` : status === "active" ? `
        <div class="auction-bid-row">
          <input data-field="auctionBid:${escapeAttr(listing.id)}" type="number" min="${minimumBid}" step="${AUCTION_MIN_BID_INCREMENT}" value="${inputValue}" ${isSignedIn ? "" : "disabled"}>
          <button class="accent" data-action="buy-auction-card" data-listing-id="${escapeAttr(listing.id)}" ${canBid ? "" : "disabled"}>入札</button>
        </div>
        <small class="market-note">最低入札 ${GOLD_NAME} ${minimumBid}。入札成功時にゴールドを預けます。${isHighestBidder ? "。現在あなたが最高入札者です。" : ""}${isSeller ? "。自分の出品には入札できません。" : ""}</small>
      ` : ["ended", "overdue"].includes(status) && isHighestBidder ? `
        <button class="primary" data-action="claim-auction-card" data-listing-id="${escapeAttr(listing.id)}" ${canClaim ? "" : "disabled"}>落札して受け取る</button>
        <small class="market-note">支払いは入札時の預かり金で完了済みです。</small>
      ` : canClaimPayout ? `
        <button class="primary" data-action="claim-auction-payout" data-listing-id="${escapeAttr(listing.id)}">売上を受け取る</button>
        <small class="market-note">${GOLD_NAME} ${highestBid} を受け取れます。</small>
      ` : isSeller && status === "ended" ? `
        <button disabled>落札者の受け取り待ち</button>
      ` : isSeller && status === "overdue" ? `
        <button class="danger" data-action="forfeit-auction-listing" data-listing-id="${escapeAttr(listing.id)}" ${canForfeit ? "" : "disabled"}>期限切れでカードを戻す</button>
      ` : isSeller && status === "expired" ? `
        <button class="ghost" data-action="cancel-auction-listing" data-listing-id="${escapeAttr(listing.id)}" ${canCancel ? "" : "disabled"}>終了した出品を戻す</button>
      ` : status === "forfeited" ? `
        <button disabled>落札不成立</button>
      ` : status === "cancelled" ? `
        <button disabled>取り消し済み</button>
      ` : status === "claimed" ? `
        <button disabled>${auction.sellerPaid ? "取引完了" : "落札済み"}</button>
      ` : `
        <button disabled>${status === "ended" ? "終了" : "入札終了"}</button>
      `}
      ${!isSignedIn ? `<small class="market-note">入札にはGoogleログインが必要です。</small>` : ""}
    </article>
  `;
}

function renderMyAuctionDashboard() {
  const summary = getMyAuctionSummary();
  const hasItems = summary.selling.length || summary.bidding.length || summary.refunds.length || summary.history.length;
  return `
    <div class="auction-dashboard">
      <div class="auction-dashboard-column">
        <h4>自分の出品</h4>
        ${summary.selling.length ? summary.selling.map(renderAuctionCompactRow).join("") : `<small class="muted">出品中のカードはありません。</small>`}
      </div>
      <div class="auction-dashboard-column">
        <h4>入札中・返金</h4>
        ${summary.bidding.length ? summary.bidding.map(renderAuctionCompactRow).join("") : `<small class="muted">最高入札中のカードはありません。</small>`}
        ${summary.refunds.length ? summary.refunds.map(renderAuctionCompactRow).join("") : ""}
      </div>
      <div class="auction-dashboard-column">
        <h4>履歴</h4>
        ${summary.history.length ? summary.history.map(renderAuctionCompactRow).join("") : `<small class="muted">${hasItems ? "完了履歴はまだありません。" : "オークションの履歴はまだありません。"}</small>`}
      </div>
    </div>
  `;
}

function renderAuctionCompactRow(auction) {
  const card = getCard(auction.cardId);
  if (!card) return "";
  const status = getAuctionStatus(auction);
  const currentUid = state.cloud.user?.uid || "";
  const isSeller = auction.sellerUid === currentUid;
  const isHighestBidder = auction.highestBidderUid === currentUid;
  const refundAmount = getAuctionRefundAmount(auction, currentUid);
  return `
    <div class="auction-compact-row">
      <div>
        <strong>${escapeHtml(card.name)}</strong>
        <small>${escapeHtml(auctionStatusText(auction, status))} / ${GOLD_NAME} ${auction.highestBid || auction.startPrice}</small>
      </div>
      <div class="auction-compact-actions">
        ${refundAmount > 0 ? `<button class="primary" data-action="claim-auction-refund" data-listing-id="${escapeAttr(auction.id)}">返金 ${refundAmount}</button>` : ""}
        ${isHighestBidder && ["ended", "overdue"].includes(status) ? `<button class="accent" data-action="claim-auction-card" data-listing-id="${escapeAttr(auction.id)}">受け取る</button>` : ""}
        ${isSeller && status === "claimed" && auction.highestBid > 0 && !auction.sellerPaid ? `<button class="primary" data-action="claim-auction-payout" data-listing-id="${escapeAttr(auction.id)}">売上</button>` : ""}
        ${isSeller && status === "overdue" ? `<button class="danger" data-action="forfeit-auction-listing" data-listing-id="${escapeAttr(auction.id)}">期限処理</button>` : ""}
      </div>
    </div>
  `;
}

function renderMarketListing(listing, type) {
  const card = getCard(listing.cardId);
  if (!card) return "";
  const purchased = isMarketListingPurchased(type, listing.id);
  const canBuy = !purchased && state.gold >= listing.price;
  return `
    <article class="market-card">
      ${renderGameCard(card, { mode: "library", staticCard: true })}
      <div class="market-price-row">
        <span class="pill mint strong">${GOLD_NAME} ${listing.price}</span>
        ${type === "auction" ? `<span class="pill aqua">NPC出品</span>` : `<span class="pill">固定価格</span>`}
      </div>
      <button class="${type === "auction" ? "accent" : "primary"}" data-action="${type === "auction" ? "buy-auction-card" : "buy-shop-card"}" data-listing-id="${listing.id}" ${canBuy ? "" : "disabled"}>
        ${purchased ? "購入済み" : type === "auction" ? "落札する" : "購入する"}
      </button>
      ${!purchased && state.gold < listing.price ? `<small class="market-note">${GOLD_NAME}が足りません</small>` : ""}
    </article>
  `;
}

function renderSellableCard(entry) {
  const auctionStart = state.auctions.sellInputs[entry.card.id] || getDefaultAuctionStartPrice(entry.card);
  const canListAuction = Boolean(state.cloud.user) && entry.sellable > 0 && auctionStart > 0 && !state.auctions.busy;
  return `
    <div class="market-sell-row">
      <div>
        ${renderMiniCardHeader(entry.card)}
        <div class="toolbar" style="margin-top: 6px;">
          ${renderCardPills(entry.card)}
          <span class="pill">余り ${entry.sellable}枚</span>
        </div>
      </div>
      <div class="market-sell-action">
        <span class="pill mint strong">+${entry.price} ${GOLD_NAME}</span>
        <button data-action="sell-card" data-card-id="${entry.card.id}">1枚売却</button>
        <div class="market-auction-action">
          <input data-field="auctionStart:${escapeAttr(entry.card.id)}" type="number" min="1" step="10" value="${auctionStart}" ${state.cloud.user ? "" : "disabled"}>
          <button class="accent" data-action="list-auction-card" data-card-id="${escapeAttr(entry.card.id)}" ${canListAuction ? "" : "disabled"}>1枚出品</button>
        </div>
        ${state.cloud.user ? `<small class="market-note">出品中はカードが所持数から外れます。</small>` : `<small class="market-note">出品にはGoogleログインが必要です。</small>`}
      </div>
    </div>
  `;
}

function renderCloudSave() {
  const cloud = state.cloud;
  const user = cloud.user;
  const signedIn = Boolean(user);
  const setupText = [
    "Firebaseプロジェクトを作成",
    "AuthenticationでGoogleログインを有効化",
    "Firestore Databaseを作成",
    "firebase-config.jsに設定値を入力",
    "GitHub PagesのURLを承認済みドメインに追加"
  ];
  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>クラウド保存</h2>
            <p>Googleアカウントでログインすると、所持カード・山札・ガチャ玉・作成カードを別端末へ引き継げます。</p>
          </div>
          <span class="pill ${cloudStatusClass()}">${escapeHtml(cloudStatusLabel())}</span>
        </div>
        <div class="cloud-panel">
          <div class="cloud-account">
            <div class="cloud-avatar">${user?.photoURL ? `<img src="${escapeAttr(user.photoURL)}" alt="">` : "G"}</div>
            <div>
              <strong>${signedIn ? escapeHtml(user.displayName || "Googleユーザー") : "未ログイン"}</strong>
              <small>${signedIn ? escapeHtml(user.email || "") : "クラウド保存を使うにはGoogleログインが必要です。"}</small>
            </div>
          </div>
          <div class="toolbar">
            ${signedIn
              ? `<button data-action="cloud-logout">ログアウト</button>`
              : `<button class="primary" data-action="cloud-login" ${cloud.configured ? "" : "disabled"}>Googleでログイン</button>`}
          </div>
        </div>
        ${renderPlayerNameEditor("クラウド保存・オンライン対戦・オークションで使う名前です。")}
        <div class="notice cloud-message">${escapeHtml(cloud.message || "")}</div>
        ${cloud.lastSync ? `<div class="notice">最終同期: ${escapeHtml(cloud.lastSync)}</div>` : ""}
      </div>

      ${signedIn ? `
        <div class="band stack">
          <div class="section-title">
            <div>
              <h3>手動同期</h3>
              <p>端末ごとの枚数がズレた時は、正しい方の端末でクラウドへ保存し、もう片方でクラウドから読み込みます。</p>
            </div>
          </div>
          <div class="cloud-save-list">
            <span>ガチャ玉 ${state.gachaBalls}個</span>
            <span>${GOLD_NAME} ${state.gold}</span>
            <span>${CREATOR_TICKET_NAME} ${state.creatorTickets}枚</span>
            <span>所持カード ${Object.values(state.inventory).reduce((sum, count) => sum + count, 0)}枚</span>
            <span>山札 ${state.deckIds.length}枚</span>
          </div>
          <div class="toolbar">
            <button class="primary" data-action="cloud-force-load">クラウドから再読み込み</button>
            <button class="accent" data-action="cloud-force-upload">この端末をクラウドへ保存</button>
          </div>
        </div>
      ` : ""}

      ${cloud.needsChoice && cloud.remoteData ? `
        <div class="band stack">
          <div class="section-title">
            <div>
              <h3>保存データの選択</h3>
              <p>クラウドに既存データがあります。どちらを使うか選んでください。</p>
            </div>
          </div>
          <div class="split">
            <div class="cloud-choice">
              <h3>クラウドデータを読み込む</h3>
              <p>この端末のデータをクラウドの内容で置き換えます。別端末の続きで遊ぶ時はこちらです。</p>
              <button class="primary" data-action="cloud-load">クラウドを読み込む</button>
            </div>
            <div class="cloud-choice">
              <h3>この端末をクラウドへ保存</h3>
              <p>今この端末にあるデータでクラウドを上書きします。この端末を正として保存する時はこちらです。</p>
              <button class="accent" data-action="cloud-upload">この端末を保存する</button>
            </div>
          </div>
        </div>
      ` : ""}

      <div class="band">
        <div class="section-title">
          <div>
            <h3>保存されるもの</h3>
            <p>オンライン対戦とは別に、まずはゲームデータの引き継ぎだけを行います。</p>
          </div>
        </div>
        <div class="cloud-save-list">
          <span>所持カード</span>
          <span>作成カード</span>
          <span>山札</span>
          <span>ガチャ玉</span>
          <span>カード創造チケット</span>
          <span>AI戦の途中データ</span>
        </div>
      </div>

      ${cloud.configured ? "" : `
        <div class="band stack">
          <div class="section-title">
            <div>
              <h3>Firebase設定が必要です</h3>
              <p>この機能を使うには、公開前にFirebaseの設定値を入れる必要があります。</p>
            </div>
          </div>
          <ol class="setup-list">
            ${setupText.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}
          </ol>
          <div class="notice">詳しい手順は FIREBASE_SETUP.md に追加しています。</div>
        </div>
      `}
    </section>
  `;
}

function renderGacha() {
  const activeSet = getActiveGachaSet();
  const setCards = getGachaSetCards(activeSet);
  const collectionTotal = Object.values(state.inventory).reduce((sum, count) => sum + count, 0);
  const ownedKinds = setCards.filter((card) => getOwnedCount(card.id) > 0).length;
  const results = state.gachaResults || [];
  const canSingle = state.gachaBalls >= GACHA_SINGLE_COST;
  const canTen = state.gachaBalls >= GACHA_TEN_COST;
  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>ガチャ</h2>
            <p>現在は${escapeHtml(activeSet.label)}です。弾を切り替えて提供カードを確認できます。</p>
          </div>
          <div class="toolbar">
            <span class="pill mint strong">${GACHA_BALL_NAME} ${state.gachaBalls}個</span>
            <span class="pill strong">所持 ${collectionTotal}枚</span>
            <span class="pill aqua">${escapeHtml(activeSet.label)} ${ownedKinds}/${setCards.length}種</span>
            <span class="pill pink strong">${CREATOR_TICKET_NAME} ${state.creatorTickets}枚</span>
          </div>
        </div>
        <div class="gacha-pack-panel">
          <div>
            <span class="pill rarity-pill rarity-SR">開催中</span>
            <h3>${escapeHtml(activeSet.label)} ${escapeHtml(activeSet.name)}</h3>
            <p>${escapeHtml(activeSet.description)}</p>
          </div>
          <div class="toolbar">
            ${GACHA_SETS.map((set) => `
              <button class="${set.id === activeSet.id ? "accent" : "ghost"}" data-action="select-gacha-set" data-set-id="${set.id}">
                ${escapeHtml(set.label)}
              </button>
            `).join("")}
          </div>
        </div>
        <div class="toolbar">
          <button class="primary" data-action="gacha" data-count="1" ${canSingle ? "" : "disabled"}>${escapeHtml(activeSet.label)}を1パック開封 (${GACHA_SINGLE_COST}個 / ${GACHA_CARDS_PER_BALL}枚)</button>
          <button class="accent" data-action="gacha" data-count="10" ${canTen ? "" : "disabled"}>${escapeHtml(activeSet.label)}を10パック開封 (${GACHA_TEN_COST}個 / ${GACHA_TEN_COST * GACHA_CARDS_PER_BALL}枚)</button>
        </div>
        <div class="notice" style="margin-top: 12px;">
          ${GACHA_BALL_NAME}はAI戦報酬と1日1回ボーナスで入手できます。1個で${GACHA_CARDS_PER_BALL}枚、10個で${GACHA_TEN_COST * GACHA_CARDS_PER_BALL}枚入手できます。AI戦勝利で${AI_WIN_GACHA_BALL_REWARD}個、敗北でも${AI_LOSE_GACHA_BALL_REWARD}個。${escapeHtml(activeSet.label)}のカード枠提供割合: ${escapeHtml(formatRarityRates())}。各排出枠${CREATOR_TICKET_CHANCE}%の確率でカード枠の代わりに${CREATOR_TICKET_NAME}が出ます。
        </div>
      </div>
      ${results.length ? `
        <div class="band">
          <div class="section-title">
            <div>
              <h3>今回の結果</h3>
              <p>同じカードを引くと所持枚数が増えます。</p>
            </div>
          </div>
          <div class="card-list">
            ${results.map((result) => renderGachaResult(result)).join("")}
          </div>
        </div>
      ` : ""}
      <div class="band">
        <div class="section-title">
          <div>
            <h3>${escapeHtml(activeSet.label)}の提供カード</h3>
            <p>この弾から出るカードです。山札には所持枚数までしか入れられません。</p>
          </div>
        </div>
        <div class="card-list">
          ${sortCardsByRarity(setCards).map((card) => renderCollectionCard(card)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderGachaResult(result) {
  if (result.type === "ticket") {
    return `
      <article class="game-card gacha-result-card spell rarity-SSR">
        <div class="card-head">
          <div class="card-art">創</div>
          <div class="card-name">
            <strong>${CREATOR_TICKET_NAME}</strong>
            <small>カード作成に使う特別アイテム</small>
          </div>
          <div class="cost-gem">★</div>
        </div>
        <div class="stat"><span>効果</span><strong>カード作成を1回行える</strong></div>
        <div class="toolbar"><span class="pill rarity-pill rarity-SSR">低確率</span></div>
      </article>
    `;
  }
  const card = getCard(result.cardId);
  return renderGameCard(card, { mode: "library", extraClass: "gacha-result-card" });
}

function renderCollectionCard(card) {
  const owned = getOwnedCount(card.id);
  return `
    <div class="deck-row card-detail-trigger" data-action="view-card" data-card-id="${card.id}">
      <div>
        ${renderMiniCardHeader(card)}
        ${renderCardIllustration(card, true)}
        <div class="toolbar" style="margin-top: 8px;">
          ${renderCardPills(card)}
          <span class="pill ${owned ? "mint strong" : ""}">所持 ${owned}枚</span>
        </div>
        ${renderCardEffectSummary(card)}
      </div>
    </div>
  `;
}

function renderDeckBuilder() {
  const cards = sortCardsByRarity(getCards());
  const counts = countDeckIds(state.deckIds);
  const total = state.deckIds.length;
  const ready = total >= MIN_DECK_SIZE && total <= DECK_SIZE;
  const activeDeck = getActiveDeck();
  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>山札編成</h2>
            <p>山札は100〜300枚です。複数デッキを作って、使うデッキを切り替えられます。</p>
          </div>
          <div class="toolbar">
            <span class="pill ${ready ? "mint strong" : "pink strong"}">${total} / ${DECK_SIZE}枚</span>
            <button data-action="reset-deck">標準デッキに戻す</button>
            <button class="primary" data-action="start-battle" ${ready ? "" : "disabled"}>この山札でバトル</button>
            <button class="accent" data-action="start-ai-battle" ${ready ? "" : "disabled"}>AIとバトル</button>
          </div>
        </div>
        <div class="notice">
          山札には所持枚数までしか入れられません。枚数が100〜300枚の時にバトルを開始できます。
        </div>
      </div>
      <div class="band deck-manager">
        <div class="section-title">
          <div>
            <h3>使用デッキ</h3>
            <p>バトル、AI戦、クエスト、オンライン対戦は選択中のデッキを使います。</p>
          </div>
          <div class="toolbar">
            <button data-action="create-deck">新規デッキ</button>
            <button data-action="duplicate-deck">コピー作成</button>
            <button class="danger" data-action="delete-deck" ${state.decks.length > 1 ? "" : "disabled"}>削除</button>
          </div>
        </div>
        <div class="deck-tabs">
          ${state.decks.map((deck) => `
            <button class="${deck.id === state.activeDeckId ? "accent" : "ghost"}" data-action="select-deck" data-deck-id="${escapeAttr(deck.id)}">
              ${escapeHtml(deck.name)} <small>${sanitizeDeck(deck.deckIds).length}枚</small>
            </button>
          `).join("")}
        </div>
        <label class="deck-name-edit">
          デッキ名
          <input data-field="activeDeckName" maxlength="24" value="${escapeAttr(activeDeck?.name || "")}">
        </label>
      </div>
      <div class="band">
        <div class="card-list">
          ${cards.map((card) => renderDeckRow(card, counts[card.id] || 0, total, getOwnedCount(card.id))).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderDeckRow(card, count, total, owned) {
  const canAdd = total < DECK_SIZE && count < owned;
  return `
    <div class="deck-row">
      <div>
        ${renderMiniCardHeader(card)}
        ${renderCardIllustration(card, true)}
        <div class="toolbar" style="margin-top: 8px;">
          ${renderCardPills(card)}
          <span class="pill ${owned ? "mint strong" : "pink"}">所持 ${owned}枚</span>
        </div>
        ${renderCardEffectSummary(card)}
      </div>
      <div class="deck-controls">
        <button data-action="remove-deck-card" data-card-id="${card.id}" ${count > 0 ? "" : "disabled"}>-</button>
        <span class="deck-count">${count}/${owned}</span>
        <button data-action="add-deck-card" data-card-id="${card.id}" ${canAdd ? "" : "disabled"}>+</button>
      </div>
    </div>
  `;
}

function renderCardUpgrade() {
  const ownedCards = sortCardsByRarity(getCards())
    .filter((card) => getOwnedCount(card.id) > 0);
  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>カード強化・進化</h2>
            <p>余った同名カードと${GOLD_NAME}を使ってカードを強化します。デッキに必要な枚数と最後の1枚は消費しません。</p>
          </div>
          <div class="toolbar">
            <span class="pill aqua">${GOLD_NAME} ${state.gold}</span>
            <span class="pill mint">所持カード ${Object.values(state.inventory).reduce((sum, count) => sum + count, 0)}枚</span>
          </div>
        </div>
      </div>
      <div class="upgrade-list">
        ${ownedCards.length ? ownedCards.map(renderUpgradeRow).join("") : `<div class="empty-field">強化できるカードがありません</div>`}
      </div>
    </section>
  `;
}

function renderUpgradeRow(card) {
  const upgrade = getCardUpgrade(card.id);
  const enhanceCost = getEnhanceCost(card, upgrade);
  const evolutionCost = getEvolutionCost(card, upgrade);
  const spare = getUpgradeableSpareCount(card.id);
  const canEnhance = canEnhanceCard(card.id);
  const canEvolve = canEvolveCard(card.id);
  return `
    <article class="upgrade-row">
      <div>
        ${renderMiniCardHeader(card)}
        ${renderCardEffectSummary(card)}
        <div class="toolbar" style="margin-top: 8px;">
          ${renderCardPills(card)}
          <span class="pill">所持 ${getOwnedCount(card.id)}枚</span>
          <span class="pill">強化素材 ${spare}枚</span>
        </div>
      </div>
      <div class="upgrade-status">
        <div class="upgrade-meter">
          <span>強化 +${upgrade.level}/${CARD_MAX_ENHANCE_LEVEL}</span>
          <div><i style="width:${Math.round((upgrade.level / CARD_MAX_ENHANCE_LEVEL) * 100)}%"></i></div>
        </div>
        <span class="pill pink strong">進化 ${upgrade.evolution}/${CARD_MAX_EVOLUTION}</span>
        <small>${escapeHtml(cardUpgradeEffectText(card, upgrade))}</small>
      </div>
      <div class="upgrade-actions">
        <button class="accent" data-action="enhance-card" data-card-id="${escapeAttr(card.id)}" ${canEnhance ? "" : "disabled"}>
          強化
        </button>
        <small>必要: 同名${enhanceCost.cards}枚 / ${GOLD_NAME} ${enhanceCost.gold}</small>
        <button class="primary" data-action="evolve-card" data-card-id="${escapeAttr(card.id)}" ${canEvolve ? "" : "disabled"}>
          進化
        </button>
        <small>条件: 強化+${CARD_MAX_ENHANCE_LEVEL} / 同名${evolutionCost.cards}枚 / ${GOLD_NAME} ${evolutionCost.gold}</small>
      </div>
    </article>
  `;
}

function renderCardCreator() {
  const draft = state.creatorDraft;
  clampCreatorDraftToTier();
  const tier = getCreatorTier(draft.tierId);
  const characterEffect = buildCharacterEffect(draft.characterEffect, draft.characterEffectValue, tier);
  const cost = draft.type === "character"
    ? calculateCharacterCost(draft.atk, draft.def, draft.block, characterEffect)
    : calculateSpellCost(draft.effect, draft.value);
  const rarity = calculateCreatedCardRarity(cost, tier);
  const enoughTickets = state.creatorTickets >= tier.tickets;
  return `
    <section class="split">
      <div class="band stack">
        <div class="section-title">
          <div>
            <h2>カード作成</h2>
            <p>使う${CREATOR_TICKET_NAME}が多いほど、作れるカードの上限と最低ランクが上がります。</p>
          </div>
          <span class="pill pink strong">${CREATOR_TICKET_NAME} ${state.creatorTickets}枚</span>
        </div>
        <div class="form-grid">
          <label class="full">
            作成ランク
            <select data-field="tierId">
              ${CREATOR_TIERS.map((entry) => `
                <option value="${entry.id}" ${tier.id === entry.id ? "selected" : ""}>
                  ${entry.tickets}枚使う - ${entry.label} / 最低${entry.minRarity}
                </option>
              `).join("")}
            </select>
          </label>
          <div class="creator-tier-summary full">
            <div class="creator-ticket-cost">
              <span>今回使う${CREATOR_TICKET_NAME}</span>
              <strong>${tier.tickets}枚</strong>
              <small>所持 ${state.creatorTickets}枚</small>
            </div>
            <div>
              <span class="pill rarity-pill rarity-${tier.minRarity}">最低 ${tier.minRarity}</span>
              <strong>${tier.label}</strong>
              <small>${escapeHtml(tier.description)}</small>
            </div>
            <div class="toolbar">
              <span class="pill pink strong">消費 ${tier.tickets}枚</span>
              ${draft.type === "character"
                ? `<span class="pill aqua">攻撃 ${tier.maxAtk}まで</span><span class="pill mint">防御 ${tier.maxDef}まで</span>`
                : `<span class="pill aqua">効果量 ${getCreatorSpellMax(draft.effect, tier)}まで</span>`}
            </div>
          </div>
          <label class="full">
            種類
            <select data-field="type">
              <option value="character" ${draft.type === "character" ? "selected" : ""}>キャラクターカード</option>
              <option value="spell" ${draft.type === "spell" ? "selected" : ""}>呪文カード</option>
            </select>
          </label>
          <label>
            カード名
            <input data-field="name" maxlength="24" value="${escapeAttr(draft.name)}" placeholder="例：朝露の剣士">
          </label>
          <label>
            アイコン
            <input data-field="icon" maxlength="2" value="${escapeAttr(draft.icon)}" placeholder="桜">
          </label>
          <label>
            属性
            <select data-field="attribute">
              ${CARD_ATTRIBUTES.map((entry) => `
                <option value="${entry.id}" ${normalizeCardAttribute(draft.attribute) === entry.id ? "selected" : ""}>${entry.label}</option>
              `).join("")}
            </select>
          </label>
          ${draft.type === "character" ? renderCharacterCreatorFields(draft, tier) : renderSpellCreatorFields(draft, tier)}
        </div>
        <div class="cost-preview">
          <span class="pill mint strong">自動計算コスト</span>
          <strong>${cost}</strong>
          <span class="pill rarity-pill rarity-${rarity}">ランク ${rarity}</span>
          <span class="pill pink strong">${CREATOR_TICKET_NAME} ${tier.tickets}枚消費</span>
          <small>${draft.type === "character"
            ? "ceil((攻撃力 × 1.15 + 防御力 + ブロック補正 + キャラ効果補正) / 5)"
            : "効果タイプ別の式で計算"}</small>
        </div>
        <button class="primary" data-action="save-card" ${enoughTickets ? "" : "disabled"}>${tier.tickets}枚消費してカード作成</button>
        ${enoughTickets ? "" : `<div class="notice">${tier.label}には${CREATOR_TICKET_NAME}が${tier.tickets}枚必要です。現在は${state.creatorTickets}枚です。</div>`}
      </div>
      <div class="band">
        <div class="section-title">
          <div>
          <h3>プレビュー</h3>
            <p>保存後、所持カードに1枚追加されます。</p>
          </div>
        </div>
        <div class="card-list">
          ${renderGameCard(previewDraftCard(cost, tier), { mode: "library" })}
        </div>
      </div>
    </section>
  `;
}

function renderCharacterCreatorFields(draft, tier) {
  const effectOption = getCharacterEffectOption(draft.characterEffect);
  const effectMax = getCreatorCharacterEffectMax(effectOption.id, tier);
  return `
    <label>
      攻撃力
      <input data-field="atk" type="number" min="0" max="${tier.maxAtk}" value="${draft.atk}">
    </label>
    <label>
      防御力
      <input data-field="def" type="number" min="0" max="${tier.maxDef}" value="${draft.def}">
    </label>
    <label class="full checkline">
      <input data-field="block" type="checkbox" ${draft.block ? "checked" : ""}>
      ブロック能力を持つ
    </label>
    <label>
      キャラ効果
      <select data-field="characterEffect">
        ${CHARACTER_EFFECT_OPTIONS.map((entry) => `
          <option value="${entry.id}" ${effectOption.id === entry.id ? "selected" : ""}>${entry.label}</option>
        `).join("")}
      </select>
    </label>
    ${effectOption.id === "none" ? `<div class="notice">効果なしの場合、コストを抑えたカードを作れます。</div>` : effectOption.effect === "absorb" ? `
      <div class="notice full">${escapeHtml(effectOption.description)} 効果量は攻撃力で決まります。</div>
    ` : `
      <label>
        効果量
        <input data-field="characterEffectValue" type="number" min="1" max="${effectMax}" value="${Math.max(1, draft.characterEffectValue)}">
      </label>
      <div class="notice full">${escapeHtml(effectOption.description)} 最大 ${effectMax} まで。</div>
    `}
  `;
}

function renderSpellCreatorFields(draft, tier) {
  return `
    <label>
      効果
      <select data-field="effect">
        <option value="draw" ${draft.effect === "draw" ? "selected" : ""}>山札からドロー</option>
        <option value="maxCost" ${draft.effect === "maxCost" ? "selected" : ""}>最大コストを恒久増加</option>
        <option value="heal" ${draft.effect === "heal" ? "selected" : ""}>HP回復</option>
        <option value="graveHand" ${draft.effect === "graveHand" ? "selected" : ""}>手札を墓地へ送る</option>
      </select>
    </label>
    <label>
      効果量
      <input data-field="value" type="number" min="1" max="${getCreatorSpellMax(draft.effect, tier)}" value="${Math.max(1, draft.value)}">
    </label>
  `;
}

function isOnlineBattle(battle = state.battle) {
  return battle?.mode === "online";
}

function getOnlinePlayerIndex() {
  if (Number.isInteger(state.online.playerIndex)) return state.online.playerIndex;
  const user = state.cloud.user;
  const room = state.online.room;
  if (!user || !room) return null;
  const index = getOnlineRoomPlayers(room).findIndex((player) => player?.uid === user.uid);
  return index === -1 ? null : index;
}

function canControlBattle(battle = state.battle) {
  if (!isOnlineBattle(battle)) return true;
  const index = getOnlinePlayerIndex();
  return Number.isInteger(index) && battle.phase === "battle" && battle.activePlayer === index;
}

function normalizeOnlineRoomId(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function generateOnlineRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getOnlineRoomRef(roomId) {
  return cloudApi.doc(cloudApi.db, "rooms", normalizeOnlineRoomId(roomId));
}

function getOnlineRoomPlayers(room) {
  const players = Array.isArray(room?.players) ? room.players : [];
  return [players[0] || null, players[1] || null];
}

function getOnlineDisplayName() {
  const user = state.cloud.user;
  return getPlayerDisplayName(user);
}

function getPlayerDisplayName(user = state.cloud.user) {
  return sanitizePlayerName(state.playerName)
    || sanitizePlayerName(user?.displayName)
    || sanitizePlayerName(user?.email?.split("@")[0])
    || "プレイヤー";
}

function sanitizePlayerName(name) {
  return String(name || "").replace(/\s+/g, " ").trim().slice(0, 16);
}

function getOnlineDeckSnapshot() {
  const deckIds = sanitizeDeck(state.deckIds);
  if (deckIds.length < MIN_DECK_SIZE || deckIds.length > DECK_SIZE) {
    throw new Error("オンライン対戦には100〜300枚の山札が必要です。山札編成を確認してください。");
  }
  const deckCustomIds = new Set(deckIds.filter((cardId) => state.customCards.some((card) => card.id === cardId)));
  const customCards = state.customCards
    .filter((card) => deckCustomIds.has(card.id))
    .map((card) => upgradeCustomCard(card));
  return {
    deckIds,
    customCards,
    cardUpgrades: {}
  };
}

function createOnlinePlayerProfile() {
  const user = state.cloud.user;
  const deckSnapshot = getOnlineDeckSnapshot();
  const activeDeck = getActiveDeck();
  return {
    uid: user.uid,
    name: getOnlineDisplayName(),
    deckName: activeDeck?.name || "デッキ",
    deckIds: deckSnapshot.deckIds,
    deckCount: deckSnapshot.deckIds.length,
    customCards: deckSnapshot.customCards,
    cardUpgrades: {}
  };
}

function applyOnlineRoomCustomCards(room) {
  getOnlineRoomPlayers(room).forEach((player) => {
    (player?.customCards || []).forEach((card) => {
      const upgraded = upgradeCustomCard(card);
      if (!upgraded?.id || getCard(upgraded.id)) return;
      state.customCards.push(upgraded);
    });
  });
}

function normalizeOnlineBattle(battle, roomId) {
  if (!battle) return null;
  applyOnlineRoomCustomCards({ players: battle.roomPlayers || state.online.room?.players || [] });
  return {
    ...battle,
    mode: "online",
    roomId: roomId || battle.roomId || state.online.roomId,
    revision: Math.max(0, clampInteger(battle.revision, 0, 99999999)),
    aiPlayer: null,
    aiScheduled: false,
    aiThinking: false
  };
}

function ensureOnlineReady() {
  if (!cloudApi || !state.cloud.configured) {
    state.online.message = "Firebase設定がまだ読み込まれていません。少し待ってからもう一度試してください。";
    render();
    return false;
  }
  if (!state.cloud.user) {
    state.online.message = "オンライン対戦にはGoogleログインが必要です。";
    render();
    return false;
  }
  try {
    getOnlineDeckSnapshot();
  } catch (error) {
    state.online.message = error.message || "オンライン対戦用の山札を確認してください。";
    render();
    return false;
  }
  return true;
}

async function createOnlineRoom() {
  if (!ensureOnlineReady() || state.online.busy) return;
  state.online.busy = true;
  state.online.message = "部屋を作成しています...";
  render();

  try {
    const player = createOnlinePlayerProfile();
    let roomId = "";
    let roomRef = null;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      roomId = generateOnlineRoomId();
      roomRef = getOnlineRoomRef(roomId);
      const existing = await cloudApi.getDoc(roomRef);
      if (!existing.exists()) break;
      roomRef = null;
    }
    if (!roomRef) throw new Error("部屋IDの作成に失敗しました。もう一度試してください。");
    const room = {
      roomId,
      status: "waiting",
      hostUid: player.uid,
      createdAt: cloudApi.serverTimestamp(),
      updatedAt: cloudApi.serverTimestamp(),
      players: [player, null],
      battle: null
    };
    await cloudApi.setDoc(roomRef, room);
    enterOnlineRoom(roomId, 0);
    state.online.message = `部屋ID ${roomId} を作成しました。`;
  } catch (error) {
    state.online.message = `部屋作成に失敗しました。${error?.message || ""}`;
    render();
  } finally {
    state.online.busy = false;
    render();
  }
}

async function joinOnlineRoom() {
  if (!ensureOnlineReady() || state.online.busy) return;
  const roomId = normalizeOnlineRoomId(state.online.inputRoomId);
  if (!roomId) return;
  state.online.busy = true;
  state.online.message = "部屋に参加しています...";
  render();

  try {
    const roomRef = getOnlineRoomRef(roomId);
    const snapshot = await cloudApi.getDoc(roomRef);
    if (!snapshot.exists()) throw new Error("その部屋IDは見つかりません。");
    const room = snapshot.data();
    const players = getOnlineRoomPlayers(room);
    const userIndex = players.findIndex((player) => player?.uid === state.cloud.user.uid);
    if (userIndex !== -1) {
      enterOnlineRoom(roomId, userIndex);
      state.online.message = "部屋に戻りました。";
      return;
    }
    if (players[1]?.uid) throw new Error("この部屋はすでに2人そろっています。");
    players[1] = createOnlinePlayerProfile();
    await cloudApi.setDoc(roomRef, {
      status: "ready",
      players,
      updatedAt: cloudApi.serverTimestamp()
    }, { merge: true });
    enterOnlineRoom(roomId, 1);
    state.online.message = "部屋に参加しました。";
  } catch (error) {
    state.online.message = `参加に失敗しました。${error?.message || ""}`;
    render();
  } finally {
    state.online.busy = false;
    render();
  }
}

function enterOnlineRoom(roomId, playerIndex) {
  leaveOnlineRoomSilently();
  state.online.roomId = normalizeOnlineRoomId(roomId);
  state.online.inputRoomId = state.online.roomId;
  state.online.playerIndex = playerIndex;
  state.screen = "online";
  subscribeOnlineRoom(state.online.roomId);
}

function subscribeOnlineRoom(roomId) {
  if (!cloudApi?.onSnapshot) return;
  const roomRef = getOnlineRoomRef(roomId);
  state.online.unsubscribe = cloudApi.onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      state.online.message = "部屋が見つからなくなりました。";
      state.online.room = null;
      if (isOnlineBattle(state.battle)) state.battle = null;
      render();
      return;
    }
    const room = snapshot.data();
    applyOnlineRoomCustomCards(room);
    state.online.room = room;
    state.online.roomId = room.roomId || roomId;
    const index = getOnlineRoomPlayers(room).findIndex((player) => player?.uid === state.cloud.user?.uid);
    if (index !== -1) state.online.playerIndex = index;
    if (room.battle) {
      state.battle = normalizeOnlineBattle(room.battle, state.online.roomId);
      state.screen = "battle";
    } else if (isOnlineBattle(state.battle)) {
      state.battle = null;
    }
    render();
  }, (error) => {
    state.online.message = `オンライン同期に失敗しました。${error?.message || ""}`;
    render();
  });
}

function leaveOnlineRoomSilently() {
  window.clearTimeout(onlineProfileTimer);
  if (typeof state.online.unsubscribe === "function") {
    state.online.unsubscribe();
  }
  state.online.unsubscribe = null;
}

function leaveOnlineRoom() {
  leaveOnlineRoomSilently();
  state.online.roomId = "";
  state.online.playerIndex = null;
  state.online.room = null;
  state.online.message = "部屋から退出しました。";
  if (isOnlineBattle(state.battle)) state.battle = null;
  state.screen = "online";
  render();
}

function scheduleOnlineProfileUpdate() {
  if (!cloudApi || !state.cloud.user || !state.online.roomId || state.online.playerIndex === null || state.online.room?.battle) return;
  window.clearTimeout(onlineProfileTimer);
  onlineProfileTimer = window.setTimeout(() => {
    updateOnlinePlayerProfileName().catch((error) => {
      state.online.message = `名前の更新に失敗しました。${error?.message || ""}`;
      if (state.screen === "online") render();
    });
  }, 700);
}

async function updateOnlinePlayerProfileName() {
  if (!cloudApi || !state.online.roomId || state.online.playerIndex === null || state.online.room?.battle) return;
  const players = getOnlineRoomPlayers(state.online.room);
  const index = state.online.playerIndex;
  if (!players[index]?.uid || players[index].uid !== state.cloud.user?.uid) return;
  players[index] = {
    ...players[index],
    name: getPlayerDisplayName()
  };
  await cloudApi.setDoc(getOnlineRoomRef(state.online.roomId), {
    players,
    updatedAt: cloudApi.serverTimestamp()
  }, { merge: true });
}

async function startOnlineBattle() {
  if (!ensureOnlineReady() || state.online.busy) return;
  const room = state.online.room;
  const players = getOnlineRoomPlayers(room);
  if (state.online.playerIndex !== 0) {
    state.online.message = "オンラインバトル開始は部屋を作ったプレイヤーだけが行えます。";
    render();
    return;
  }
  if (!players[0]?.uid || !players[1]?.uid) {
    state.online.message = "2人そろうと開始できます。";
    render();
    return;
  }
  state.online.busy = true;
  state.online.message = "オンラインバトルを開始しています...";
  render();

  try {
    const battle = createOnlineBattle(room);
    state.battle = battle;
    state.screen = "battle";
    await saveOnlineBattle(battle, "battle");
    render();
  } catch (error) {
    state.online.message = `バトル開始に失敗しました。${error?.message || ""}`;
    render();
  } finally {
    state.online.busy = false;
  }
}

function createOnlineBattle(room) {
  const players = getOnlineRoomPlayers(room);
  applyOnlineRoomCustomCards(room);
  const deck1 = shuffle([...(players[0].deckIds || [])]);
  const deck2 = shuffle([...(players[1].deckIds || [])]);
  const battle = {
    mode: "online",
    roomId: room.roomId || state.online.roomId,
    phase: "roulette",
    firstPlayer: null,
    activePlayer: null,
    nextActivePlayer: null,
    aiPlayer: null,
    aiScheduled: false,
    aiThinking: false,
    turnNumber: 0,
    revision: 0,
    pendingAttackerUid: null,
    winner: null,
    initialDeckSize: Math.max(deck1.length, deck2.length),
    players: [
      createPlayer(players[0].name || "P1", deck1),
      createPlayer(players[1].name || "P2", deck2)
    ],
    log: ["オンライン対戦を開始しました。"]
  };
  drawCards(battle, 0, INITIAL_HAND, false);
  drawCards(battle, 1, INITIAL_HAND, false);
  return battle;
}

function serializeOnlineBattle(battle) {
  const serialized = JSON.parse(JSON.stringify({
    ...battle,
    aiScheduled: false,
    aiThinking: false
  }));
  if (Array.isArray(serialized.log) && serialized.log.length > 120) {
    serialized.log = serialized.log.slice(-120);
  }
  return serialized;
}

async function saveOnlineBattle(battle = state.battle, status = null) {
  if (!isOnlineBattle(battle) || !state.online.roomId || !cloudApi) return;
  const roomRef = getOnlineRoomRef(state.online.roomId);
  const battleStatus = status || (battle.phase === "over" ? "over" : "battle");
  if (!cloudApi.runTransaction) {
    const serialized = serializeOnlineBattle(battle);
    serialized.revision = Math.max(0, clampInteger(battle.revision, 0, 99999999)) + 1;
    battle.revision = serialized.revision;
    await cloudApi.setDoc(roomRef, {
      status: battleStatus,
      battle: serialized,
      updatedAt: cloudApi.serverTimestamp()
    }, { merge: true });
    return;
  }
  await cloudApi.runTransaction(cloudApi.db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error("部屋が見つかりません。");
    const room = snapshot.data();
    const remoteRevision = Math.max(0, clampInteger(room?.battle?.revision, 0, 99999999));
    const localRevision = Math.max(0, clampInteger(battle.revision, 0, 99999999));
    if (room?.battle && remoteRevision > localRevision) {
      throw new Error("相手の操作が先に反映されています。画面を更新してからもう一度操作してください。");
    }
    const serialized = serializeOnlineBattle(battle);
    serialized.revision = remoteRevision + 1;
    battle.revision = serialized.revision;
    transaction.set(roomRef, {
      status: battleStatus,
      battle: serialized,
      updatedAt: cloudApi.serverTimestamp()
    }, { merge: true });
  });
}

async function resetOnlineRoomBattle() {
  if (!state.online.roomId || !cloudApi) {
    state.screen = "online";
    render();
    return;
  }
  try {
    const players = getOnlineRoomPlayers(state.online.room);
    const nextStatus = players[0]?.uid && players[1]?.uid ? "ready" : "waiting";
    await cloudApi.setDoc(getOnlineRoomRef(state.online.roomId), {
      status: nextStatus,
      battle: null,
      updatedAt: cloudApi.serverTimestamp()
    }, { merge: true });
    state.battle = null;
    state.screen = "online";
    state.online.message = "部屋を再戦待ちに戻しました。";
    render();
  } catch (error) {
    state.online.message = `部屋のリセットに失敗しました。${error?.message || ""}`;
    state.screen = "online";
    render();
  }
}

function syncOnlineBattle() {
  if (!isOnlineBattle(state.battle)) return;
  saveOnlineBattle(state.battle).catch((error) => {
    state.online.message = `オンライン保存に失敗しました。${error?.message || ""}`;
    render();
  });
}

function renderOnlinePlaceholder() {
  const user = state.cloud.user;
  const room = state.online.room;
  const players = getOnlineRoomPlayers(room);
  const roomId = state.online.roomId || state.online.inputRoomId;
  const signedIn = Boolean(user);
  const activeDeck = getActiveDeck();
  const deckReady = state.deckIds.length >= MIN_DECK_SIZE && state.deckIds.length <= DECK_SIZE;

  if (!state.cloud.configured) {
    return `
      <section class="stack">
        <div class="band">
          <div class="section-title">
            <div>
              <h2>オンライン対戦</h2>
              <p>オンライン対戦にはFirebase設定とGoogleログインが必要です。</p>
            </div>
          </div>
          <div class="notice">${escapeHtml(state.cloud.message || "Firebase設定を確認してください。")}</div>
        </div>
      </section>
    `;
  }

  if (!signedIn) {
    return `
      <section class="stack">
        <div class="band">
          <div class="section-title">
            <div>
              <h2>オンライン対戦</h2>
              <p>Googleでログインしてから、部屋を作成または参加します。</p>
            </div>
          </div>
          <button class="primary" data-action="cloud-login">Googleでログイン</button>
          <div class="notice">${escapeHtml(state.cloud.message || "ログインするとオンライン対戦を使えます。")}</div>
        </div>
      </section>
    `;
  }

  if (room) {
    const isHost = state.online.playerIndex === 0;
    const canStart = isHost && players[0]?.uid && players[1]?.uid && !room.battle;
    return `
      <section class="stack">
        <div class="band">
          <div class="section-title">
            <div>
              <h2>オンライン対戦</h2>
              <p>部屋IDを相手に伝えて参加してもらってください。</p>
            </div>
            <div class="toolbar">
              <span class="pill aqua strong">部屋ID ${escapeHtml(roomId)}</span>
              <button data-action="leave-online-room">退室</button>
            </div>
          </div>
          ${state.online.message ? `<div class="notice">${escapeHtml(state.online.message)}</div>` : ""}
          ${renderPlayerNameEditor("待機中の部屋には少し待つと反映されます。対戦開始後の名前は次の対戦から反映されます。")}
        </div>
        <div class="split">
          ${[0, 1].map((index) => `
            <div class="band">
              <h3>${index === 0 ? "プレイヤー1" : "プレイヤー2"}</h3>
              ${players[index]?.uid ? `
                <div class="player-top">
                  <strong>${escapeHtml(players[index].name || `P${index + 1}`)}</strong>
                  <span class="pill ${state.online.playerIndex === index ? "pink strong" : ""}">${state.online.playerIndex === index ? "あなた" : "参加中"}</span>
                </div>
                <p class="muted">${escapeHtml(players[index].deckName || "デッキ")} / 山札 ${players[index].deckCount || 0}枚</p>
              ` : `<div class="empty-field">参加待ち</div>`}
            </div>
          `).join("")}
        </div>
        <div class="band stack">
          ${room.battle ? `
            <button class="primary" data-action="screen" data-screen="battle">対戦画面へ戻る</button>
          ` : `
            <button class="primary" data-action="start-online-battle" ${canStart ? "" : "disabled"}>オンラインバトル開始</button>
            <div class="notice">${isHost ? "2人そろったら開始できます。" : "開始は部屋を作ったプレイヤーが行います。"}開始後に先攻・後攻ルーレットへ進みます。</div>
          `}
        </div>
      </section>
    `;
  }

  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>オンライン対戦</h2>
            <p>Googleログイン済みのプレイヤー同士で、部屋IDを使って対戦します。</p>
          </div>
          <div class="toolbar">
            <span class="pill pink strong">${escapeHtml(user.displayName || user.email || "ログイン中")}</span>
            <span class="pill ${deckReady ? "mint strong" : "pink strong"}">${escapeHtml(activeDeck?.name || "デッキ")} ${state.deckIds.length}/${DECK_SIZE}枚</span>
          </div>
        </div>
        ${renderPlayerNameEditor("部屋を作る前、または参加する前に変更してください。")}
      </div>
      <div class="split">
        <div class="band stack">
          <h3>部屋を作る</h3>
          <p class="muted">今の山札を使って部屋を作ります。相手には部屋IDを伝えてください。</p>
          <button class="primary" data-action="create-online-room" ${state.online.busy || !deckReady ? "disabled" : ""}>部屋を作る</button>
          ${deckReady ? "" : `<div class="notice">オンライン対戦には100〜300枚の山札が必要です。</div>`}
        </div>
        <div class="band stack">
          <h3>部屋IDで参加</h3>
          <input data-field="onlineRoomId" value="${escapeAttr(state.online.inputRoomId)}" placeholder="例：A7K2" maxlength="6" autocomplete="off">
          <button class="accent" data-action="join-online-room" ${state.online.busy || !state.online.inputRoomId ? "disabled" : ""}>参加</button>
        </div>
      </div>
      <div class="band">
        <h3>現在の注意</h3>
        <p class="notice">同期の上書き防止を入れています。画面上は相手の手札を隠しますが、静的サイト版のため完全なサーバー判定ではありません。</p>
        ${state.online.message ? `<div class="notice">${escapeHtml(state.online.message)}</div>` : ""}
      </div>
    </section>
  `;
}

function renderBattle() {
  const battle = state.battle;
  if (!battle) return renderBattleIntro();
  if (battle.phase === "roulette") return renderRoulette(battle);
  if (battle.phase === "handoff") return renderHandoff(battle);
  if (battle.phase === "over") return renderBattleOver(battle);
  return renderBattleBoard(battle);
}

function renderBattleIntro() {
  return `
    <section class="center-stage">
      <div class="roulette band">
        <div class="roulette-wheel">VS</div>
        <div>
          <h2>バトル開始</h2>
          <p>ローカル2人対戦、またはAIとバトルを選べます。先攻はルーレットで決まります。</p>
        </div>
        <div class="toolbar" style="justify-content: center;">
          <button class="primary" data-action="start-battle">2人対戦を準備</button>
          <button class="accent" data-action="start-ai-battle">AIとバトル</button>
        </div>
      </div>
    </section>
  `;
}

function renderRoulette(battle) {
  const hasResult = Number.isInteger(battle.firstPlayer);
  const waitingText = isCpuBattleMode(battle.mode) ? "YOU / CPU" : "P1 / P2";
  return `
    <section class="center-stage">
      <div class="roulette band">
        <div class="roulette-wheel">${hasResult ? escapeHtml(battle.players[battle.firstPlayer].name) : waitingText}</div>
        <div>
          <h2>先攻・後攻ルーレット</h2>
          <p>${hasResult ? `${escapeHtml(battle.players[battle.firstPlayer].name)}が先攻です。` : "ボタンを押して先攻を決めます。"}</p>
        </div>
        <button class="primary" data-action="spin-roulette">${hasResult ? "バトルへ進む" : "ルーレットを回す"}</button>
      </div>
    </section>
  `;
}

function renderHandoff(battle) {
  const next = battle.players[battle.nextActivePlayer];
  if (isCpuBattleMode(battle.mode)) {
    return renderBattleBoard(battle);
  }
  return `
    <section class="center-stage">
      <div class="handoff band">
        <h2>${escapeHtml(next.name)}のターン</h2>
        <p>手札を隠すため、端末を次のプレイヤーに渡してから進めてください。</p>
        <button class="primary" data-action="ready-next-turn">準備できた</button>
      </div>
    </section>
  `;
}

function renderBattleOver(battle) {
  const winner = battle.players[battle.winner];
  return `
    <section class="center-stage">
      <div class="result band">
        <h2>${escapeHtml(winner.name)}の勝利</h2>
        <p>HP、山札切れ、または降参によって勝敗が決まりました。</p>
        <div class="toolbar" style="justify-content: center;">
          <button class="primary" data-action="new-battle">もう一度バトル</button>
          <button data-action="screen" data-screen="menu">メニューへ</button>
        </div>
        ${renderLog(battle)}
      </div>
    </section>
  `;
}

function getHandDetailContext() {
  const battle = state.battle;
  if (!battle || !state.cardDetailHandUid) return null;
  for (let playerIndex = 0; playerIndex < battle.players.length; playerIndex += 1) {
    const player = battle.players[playerIndex];
    const handCard = player.hand.find((entry) => entry.uid === state.cardDetailHandUid);
    if (!handCard) continue;
    const card = getBattleCard(handCard.cardId, player);
    if (!card) return null;
    const actionsEnabled = isBattleActive() && !isAiTurn(battle) && canControlBattle(battle) && playerIndex === battle.activePlayer;
    const canPay = actionsEnabled && player.currentCost >= card.cost;
    const fieldFull = card.type === "character" && player.field.length >= FIELD_LIMIT;
    return {
      player,
      handCard,
      card,
      actionsEnabled,
      canPlay: canPay && !fieldFull,
      canLevel: canPay,
      actionLabel: card.type === "character" ? "召喚する" : "使用する",
      disabledReason: !actionsEnabled ? "今は操作できません。" : fieldFull ? "フィールドがいっぱいです。" : "コストが足りません。"
    };
  }
  return null;
}

function renderHandDetailActions(context) {
  return `
    <div class="detail-actions">
      <button class="accent" data-action="play-card" data-uid="${context.handCard.uid}" ${context.canPlay ? "" : "disabled"}>${escapeHtml(context.actionLabel)}</button>
      <button data-action="level-card" data-uid="${context.handCard.uid}" ${context.canLevel ? "" : "disabled"}>墓地へ送る</button>
      ${context.canPlay || context.canLevel ? "" : `<small>${escapeHtml(context.disabledReason)}</small>`}
    </div>
  `;
}

function renderHandSortControls() {
  return `
    <div class="hand-sort-controls" aria-label="手札の並び替え">
      ${HAND_SORT_OPTIONS.map((option) => `
        <button
          class="${state.battleHandSort === option.id ? "accent" : "ghost"}"
          data-action="set-hand-sort"
          data-sort="${option.id}"
        >${escapeHtml(option.label)}</button>
      `).join("")}
    </div>
  `;
}

function setBattleHandSort(sortId) {
  state.battleHandSort = HAND_SORT_OPTIONS.some((option) => option.id === sortId) ? sortId : "draw";
  render();
}

function showCardDetail(cardId) {
  if (!getCard(cardId)) return;
  state.cardDetailId = cardId;
  state.cardDetailHandUid = null;
  render();
}

function showHandCardDetail(uid) {
  const battle = state.battle;
  if (!battle || !uid) return;
  const players = isOnlineBattle(battle) ? [battle.players[getOnlinePlayerIndex()]] : battle.players;
  const owner = players
    .filter(Boolean)
    .find((player) => player.hand.some((entry) => entry.uid === uid));
  const handCard = owner?.hand.find((entry) => entry.uid === uid);
  if (!handCard || !getBattleCard(handCard.cardId, owner)) return;
  state.cardDetailId = handCard.cardId;
  state.cardDetailHandUid = uid;
  render();
}

function getSortedHand(hand) {
  if (state.battleHandSort === "draw") return hand;
  const direction = state.battleHandSort === "costDesc" ? -1 : 1;
  const owner = state.battle?.players?.find((player) => player.hand === hand);
  return hand
    .map((handCard, index) => ({ handCard, index, card: getBattleCard(handCard.cardId, owner) || getCard(handCard.cardId) }))
    .sort((a, b) => {
      const costDiff = ((a.card?.cost || 999) - (b.card?.cost || 999)) * direction;
      return costDiff || a.index - b.index;
    })
    .map((entry) => entry.handCard);
}

function renderBattleBoard(battle) {
  if (isOnlineBattle(battle)) {
    return renderOnlineBattleBoard(battle);
  }
  if (isCpuBattleMode(battle.mode)) {
    return renderAiBattleBoard(battle);
  }
  const active = battle.players[battle.activePlayer];
  const inactive = battle.players[1 - battle.activePlayer];
  return `
    <section class="battle-layout">
      ${renderScoreboard(battle)}
      <div class="band battle-actions">
        <span class="pill pink strong">${escapeHtml(active.name)}のターン</span>
        <span class="pill aqua">ターン ${battle.turnNumber}</span>
        <span class="pill mint">倍率 ${formatMultiplier(levelMultiplier(active.level))}</span>
        ${battle.pendingAttackerUid ? `<button data-action="cancel-attack">攻撃選択を解除</button>` : ""}
        <button class="accent" data-action="end-turn">ターンエンド</button>
        <button class="danger" data-action="surrender">降参</button>
      </div>
      <div class="board">
        ${renderFieldZone(battle, 1 - battle.activePlayer)}
        ${renderFieldZone(battle, battle.activePlayer)}
      </div>
      <div class="split">
        <div class="band hand-zone active-hand-zone">
          <div class="section-title">
            <div>
              <h3>${escapeHtml(active.name)}の手札</h3>
              <p>カードを使うか、墓地へ送ってレベルを上げます。</p>
            </div>
            ${renderHandSortControls()}
          </div>
          <div class="hand-grid">
            ${active.hand.length ? getSortedHand(active.hand).map((handCard) => renderHandCard(handCard, active)).join("") : `<div class="empty-field">手札がありません</div>`}
          </div>
        </div>
        <div class="band hand-zone hidden-hand-zone">
          <div class="section-title">
            <div>
              <h3>${escapeHtml(inactive.name)}の手札</h3>
              <p>非公開情報のため枚数だけ表示します。</p>
            </div>
          </div>
          <div class="card-back-row">
            ${inactive.hand.map(() => `<div class="card-back" aria-hidden="true"></div>`).join("") || `<div class="empty-field">0枚</div>`}
          </div>
          ${renderLog(battle)}
        </div>
      </div>
    </section>
  `;
}

function renderOnlineBattleBoard(battle) {
  const localIndex = getOnlinePlayerIndex();
  const safeLocalIndex = Number.isInteger(localIndex) ? localIndex : 0;
  const opponentIndex = 1 - safeLocalIndex;
  const local = battle.players[safeLocalIndex];
  const opponent = battle.players[opponentIndex];
  const isMyTurn = battle.activePlayer === safeLocalIndex;
  return `
    <section class="battle-layout">
      ${renderScoreboard(battle)}
      <div class="band battle-actions">
        <span class="pill aqua strong">部屋ID ${escapeHtml(battle.roomId || state.online.roomId || "")}</span>
        <span class="pill ${isMyTurn ? "pink strong" : "aqua"}">${isMyTurn ? "あなたのターン" : `${escapeHtml(battle.players[battle.activePlayer]?.name || "相手")}のターン`}</span>
        <span class="pill aqua">ターン ${battle.turnNumber}</span>
        <span class="pill mint">倍率 ${formatMultiplier(levelMultiplier(local.level))}</span>
        ${battle.pendingAttackerUid && isMyTurn ? `<button data-action="cancel-attack">攻撃選択を解除</button>` : ""}
        ${isMyTurn ? `<button class="accent" data-action="end-turn">ターンエンド</button>` : `<span class="pill">相手の操作待ち</span>`}
        <button class="danger" data-action="surrender">降参</button>
      </div>
      <div class="board">
        ${renderFieldZone(battle, opponentIndex)}
        ${renderFieldZone(battle, safeLocalIndex)}
      </div>
      <div class="split">
        <div class="band hand-zone active-hand-zone">
          <div class="section-title">
            <div>
              <h3>あなたの手札</h3>
              <p>${isMyTurn ? "カードを選んで、召喚・使用・墓地送りを選べます。" : "相手のターン中は操作できません。"}</p>
            </div>
            ${renderHandSortControls()}
          </div>
          <div class="hand-grid">
            ${local.hand.length ? getSortedHand(local.hand).map((handCard) => renderHandCard(handCard, local, isMyTurn)).join("") : `<div class="empty-field">手札がありません</div>`}
          </div>
        </div>
        <div class="band hand-zone hidden-hand-zone">
          <div class="section-title">
            <div>
              <h3>${escapeHtml(opponent.name)}の手札</h3>
              <p>相手の手札は枚数だけ表示します。</p>
            </div>
          </div>
          <div class="card-back-row">
            ${opponent.hand.map(() => `<div class="card-back" aria-hidden="true"></div>`).join("") || `<div class="empty-field">0枚</div>`}
          </div>
          ${renderLog(battle)}
        </div>
      </div>
    </section>
  `;
}

function renderAiBattleBoard(battle) {
  const human = battle.players[0];
  const ai = battle.players[1];
  const active = battle.players[battle.activePlayer];
  const humanActive = battle.activePlayer === 0;
  return `
    <section class="battle-layout">
      ${renderScoreboard(battle)}
      <div class="band battle-actions">
        <span class="pill pink strong">${escapeHtml(active.name)}のターン</span>
        <span class="pill aqua">ターン ${battle.turnNumber}</span>
        <span class="pill aqua strong">コスト ${active.currentCost}/${active.maxCost}</span>
        <span class="pill mint">倍率 ${formatMultiplier(levelMultiplier(active.level))}</span>
        <button class="${state.autoBattle ? "primary" : "ghost"}" data-action="toggle-auto-battle">${state.autoBattle ? "オートON" : "オートOFF"}</button>
        ${battle.autoThinking ? `<span class="pill aqua strong">オート行動中</span>` : ""}
        ${battle.pendingAttackerUid && humanActive ? `<button data-action="cancel-attack">攻撃選択を解除</button>` : ""}
        ${isAiTurn(battle) ? `<span class="pill aqua strong">${escapeHtml(ai.name)}が行動中</span>` : `<button class="accent" data-action="end-turn">ターンエンド</button>`}
        ${battle.mode === "ai" ? `<button data-action="new-ai-battle">新規AI戦</button>` : ""}
        <button class="danger" data-action="surrender">降参</button>
      </div>
      <div class="board">
        ${renderFieldZone(battle, 1)}
        ${renderFieldZone(battle, 0)}
      </div>
      <div class="split">
        <div class="band hand-zone active-hand-zone">
          <div class="section-title">
            <div>
              <h3>あなたの手札</h3>
              <p>${humanActive ? "カードを使うか、墓地へ送ってレベルを上げます。" : "AIの行動中です。あなたの操作は待機になります。"}</p>
            </div>
            ${renderHandSortControls()}
          </div>
          <div class="hand-grid">
            ${human.hand.length ? getSortedHand(human.hand).map((handCard) => renderHandCard(handCard, human, humanActive)).join("") : `<div class="empty-field">手札がありません</div>`}
          </div>
        </div>
        <div class="band hand-zone hidden-hand-zone">
          <div class="section-title">
            <div>
              <h3>${escapeHtml(ai.name)}の手札</h3>
              <p>相手の手札は非公開です。枚数だけ表示します。</p>
            </div>
          </div>
          <div class="card-back-row">
            ${ai.hand.map(() => `<div class="card-back" aria-hidden="true"></div>`).join("") || `<div class="empty-field">0枚</div>`}
          </div>
          ${renderLog(battle)}
        </div>
      </div>
    </section>
  `;
}

function renderScoreboard(battle) {
  return `
    <div class="scoreboard">
      ${battle.players.map((player, index) => renderPlayerPanel(player, index === battle.activePlayer, battle.initialDeckSize)).join("")}
    </div>
  `;
}

function renderPlayerPanel(player, active, initialDeckSize = null) {
  const maxHp = player.maxHp || MAX_HP;
  const hpRate = Math.max(0, Math.min(100, (player.hp / maxHp) * 100));
  const currentCardTotal = countBattleCards(player);
  const cardTotalText = Number.isFinite(initialDeckSize) ? `${currentCardTotal}/${initialDeckSize}` : String(currentCardTotal);
  return `
    <div class="player-panel ${active ? "active" : ""}">
      <div class="player-top">
        <h3>${escapeHtml(player.name)}</h3>
        <span class="pill ${active ? "pink strong" : ""}">${active ? "手番" : "待機"}</span>
      </div>
      <div class="hp-bar"><div class="hp-fill" style="width: ${hpRate}%"></div></div>
      <div class="toolbar">
        <span class="pill strong">HP ${Math.max(0, Math.ceil(player.hp))}/${maxHp}</span>
        <span class="pill aqua">コスト ${player.currentCost}/${player.maxCost}</span>
        <span class="pill pink">LV ${player.level}</span>
        <span class="pill mint">倍率 ${formatMultiplier(levelMultiplier(player.level))}</span>
        <span class="pill">山札 ${player.deck.length}</span>
        <span class="pill">墓地 ${player.grave.length}</span>
        <span class="pill">カード ${cardTotalText}</span>
      </div>
    </div>
  `;
}

function countBattleCards(player) {
  if (!player) return 0;
  return player.deck.length + player.hand.length + player.field.length + player.grave.length;
}

function renderFieldZone(battle, ownerIndex) {
  const owner = battle.players[ownerIndex];
  const isActiveOwner = ownerIndex === battle.activePlayer;
  const opponentIndex = 1 - battle.activePlayer;
  const canAct = canControlBattle(battle);
  const canDirect = canAct && !isAiTurn(battle) && battle.pendingAttackerUid && ownerIndex === opponentIndex && owner.field.length === 0;
  return `
    <div class="field-zone">
      <div class="field-title">
        <strong>${escapeHtml(owner.name)}のフィールド</strong>
        <div class="toolbar">
          <span class="pill">${owner.field.length}/${FIELD_LIMIT}</span>
          ${canDirect ? `<button class="primary" data-action="attack-player">プレイヤーへ直接攻撃</button>` : ""}
        </div>
      </div>
      <div class="field-grid">
        ${owner.field.length ? owner.field.map((unit) => renderFieldCard(unit, owner, isActiveOwner, ownerIndex)).join("") : `<div class="empty-field">キャラクターなし</div>`}
      </div>
    </div>
  `;
}

function renderFieldCard(unit, owner, isActiveOwner, ownerIndex) {
  const battle = state.battle;
  const card = getBattleCard(unit.cardId, owner);
  const stats = getEffectiveStats(unit, owner);
  const pending = battle.pendingAttackerUid;
  const canAct = canControlBattle(battle);
  const canSelect = canAct && !isAiTurn(battle) && isActiveOwner && unit.canAttack && !pending;
  const canTarget = canAct && !isAiTurn(battle) && pending && ownerIndex !== battle.activePlayer;
  const enhanceLevel = getBattleEnhanceLevel(unit);
  const canEnhance = canAct && !isAiTurn(battle) && isActiveOwner && !pending && owner.currentCost >= BATTLE_ENHANCE_COST && enhanceLevel < BATTLE_ENHANCE_MAX;
  const classes = [
    "field-card",
    canSelect ? "selectable" : "",
    canTarget ? "targetable" : ""
  ].filter(Boolean).join(" ");
  return `
    <div class="${classes} card-detail-trigger" data-action="view-card" data-card-id="${card.id}">
      ${renderMiniCardHeader(card)}
      ${renderCardIllustration(card, true)}
      <div class="stats">
        <div class="stat"><span>攻撃</span><strong>${stats.atk}</strong></div>
        <div class="stat"><span>防御</span><strong>${stats.def}</strong></div>
      </div>
      <div class="toolbar">
        ${card.abilities?.includes("block") ? `<span class="pill pink strong">ブロック</span>` : ""}
        ${card.characterEffect ? `<span class="pill aqua">${escapeHtml(characterEffectShortText(card.characterEffect))}</span>` : ""}
        ${enhanceLevel > 0 ? `<span class="pill mint strong">強化 +${enhanceLevel}</span>` : ""}
        <span class="pill">${unit.canAttack ? "攻撃可" : "待機"}</span>
      </div>
      ${canEnhance ? `<button class="primary" data-action="battle-enhance-card" data-uid="${unit.uid}">強化 ${BATTLE_ENHANCE_COST}</button>` : ""}
      ${canSelect ? `<button class="accent" data-action="select-attacker" data-uid="${unit.uid}">攻撃する</button>` : ""}
      ${canTarget ? `<button class="primary" data-action="attack-card" data-uid="${unit.uid}">対象にする</button>` : ""}
    </div>
  `;
}

function renderHandCard(handCard, player, actionsEnabled = true) {
  const card = getBattleCard(handCard.cardId, player);
  const canPay = actionsEnabled && player.currentCost >= card.cost;
  const costLocked = player.currentCost < card.cost;
  const actionLabel = card.type === "character" ? "召喚" : "使用";
  const fieldFull = card.type === "character" && player.field.length >= FIELD_LIMIT;
  return renderGameCard(card, {
    mode: "hand",
    extraClass: `hand-game-card${costLocked ? " is-cost-locked" : ""}`,
    uid: handCard.uid,
    canPlay: canPay && !fieldFull,
    canLevel: canPay,
    actionLabel,
    disabledReason: fieldFull ? "フィールド上限" : "コスト不足",
    costLocked,
    handMiniStats: renderHandMiniStats(card)
  });
}

function renderGameCard(card, options = {}) {
  const isCharacter = card.type === "character";
  const extraClass = options.extraClass ? ` ${escapeAttr(options.extraClass)}` : "";
  const detailAttrs = options.staticCard
    ? ""
    : options.mode === "hand" && options.uid
      ? ` data-action="view-hand-card" data-uid="${options.uid}" data-card-id="${card.id}"`
      : ` data-action="view-card" data-card-id="${card.id}"`;
  return `
    <article class="game-card${extraClass} ${isCharacter ? "character" : "spell"} rarity-${card.rarity || "N"} card-detail-trigger"${detailAttrs}>
      ${renderMiniCardHeader(card)}
      ${renderCardIllustration(card)}
      ${isCharacter ? renderCharacterBody(card) : renderSpellBody(card)}
      ${options.costLocked ? `<div class="cost-lock-label">コスト不足</div>` : ""}
      <div class="toolbar">
        ${renderCardPills(card)}
      </div>
      ${options.mode === "hand" ? `
        <div class="card-actions">
          ${options.handMiniStats || ""}
          <div class="hand-action-buttons">
            <button class="accent" data-action="play-card" data-uid="${options.uid}" data-card-id="${card.id}" data-card-type="${card.type}" ${options.canPlay ? "" : "disabled"}>${escapeHtml(options.actionLabel)}</button>
            <button data-action="level-card" data-uid="${options.uid}" data-card-id="${card.id}" data-card-type="${card.type}" ${options.canLevel ? "" : "disabled"}><span class="button-full">墓地へ送る</span><span class="button-short">墓地</span></button>
          </div>
        </div>
      ` : ""}
    </article>
  `;
}

function renderHandMiniStats(card) {
  if (card.type === "character") {
    return `
      <div class="hand-mini-stats">
        <span>攻 ${card.atk}</span>
        <span>防 ${card.def}</span>
      </div>
    `;
  }
  return `
    <div class="hand-mini-stats spell-mini-stats">
      <span>呪文</span>
      <span>${escapeHtml(shortSpellLabel(card.spell))}</span>
    </div>
  `;
}

function shortSpellLabel(spell) {
  if (!spell) return "効果";
  if (spell.effect === "draw") return `${effectiveDrawValue(spell.value)}ドロー`;
  if (spell.effect === "maxCost") return `コスト+${spell.value}`;
  if (spell.effect === "heal") return `${spell.value}回復`;
  if (spell.effect === "graveHand") return `手札${spell.value}墓地`;
  return "効果";
}

function normalizeCardAttribute(attribute) {
  return CARD_ATTRIBUTES.some((entry) => entry.id === attribute) ? attribute : "neutral";
}

function cardAttributeLabel(attribute) {
  const normalized = normalizeCardAttribute(attribute);
  return CARD_ATTRIBUTES.find((entry) => entry.id === normalized)?.label || "無";
}

function renderMiniCardHeader(card) {
  const attribute = cardAttributeLabel(card.attribute);
  return `
    <div class="card-head">
      <div class="card-art">${escapeHtml(card.icon || "札")}</div>
      <div class="card-name">
        <strong>${escapeHtml(card.name)}</strong>
        <small>${card.type === "character" ? "キャラクター" : "呪文"} / ${escapeHtml(card.rarity || "N")} / ${escapeHtml(attribute)}</small>
      </div>
      <div class="cost-gem">${card.cost}</div>
    </div>
  `;
}

function renderCardIllustration(card, compact = false) {
  const art = getCardArtProfile(card);
  const rarity = card.rarity || "N";
  const typeMark = card.type === "character" ? "CHARACTER" : "SPELL";
  const compactClass = compact ? " compact" : "";
  if (Number.isInteger(art.spriteIndex)) {
    const col = art.spriteIndex % 6;
    const row = Math.floor(art.spriteIndex / 6);
    const spriteX = `${col * 20}%`;
    const spriteY = `${row * 50}%`;
    const spriteSheet = art.spriteSheet ? ` --sprite-sheet: url(${escapeAttr(art.spriteSheet)});` : "";
    return `
      <div class="card-illustration photo-art ${card.type} rarity-${rarity}${compactClass}" style="--sprite-x: ${spriteX}; --sprite-y: ${spriteY};${spriteSheet}">
        <span class="art-type">${typeMark}</span>
      </div>
    `;
  }
  return `
    <div class="card-illustration ${card.type} art-${art.kind} rarity-${rarity}${compactClass}" style="--art-a: ${art.a}; --art-b: ${art.b}; --art-c: ${art.c};">
      <div class="art-sky"></div>
      <div class="art-spark art-spark-one"></div>
      <div class="art-spark art-spark-two"></div>
      ${card.type === "character" ? renderCharacterArt(art) : renderSpellArt(art)}
      <div class="art-ground"></div>
      <span class="art-type">${typeMark}</span>
    </div>
  `;
}

function renderCharacterArt(art) {
  if (art.kind === "dragon") {
    return `
      <div class="creature-art dragon-art">
        <div class="dragon-wing dragon-wing-left"></div>
        <div class="dragon-wing dragon-wing-right"></div>
        <div class="dragon-tail"></div>
        <div class="dragon-body"></div>
        <div class="dragon-neck"></div>
        <div class="dragon-head"><span></span></div>
        <div class="dragon-horn dragon-horn-left"></div>
        <div class="dragon-horn dragon-horn-right"></div>
      </div>
    `;
  }

  if (art.kind === "whale") {
    return `
      <div class="creature-art whale-art">
        <div class="whale-tail"></div>
        <div class="whale-body"><span></span></div>
        <div class="whale-fin whale-fin-left"></div>
        <div class="whale-fin whale-fin-right"></div>
        <div class="whale-fountain"></div>
      </div>
    `;
  }

  const features = art.features || [];
  return `
    <div class="character-art">
      ${features.includes("wings") ? `<div class="char-wing char-wing-left"></div><div class="char-wing char-wing-right"></div>` : ""}
      ${features.includes("tail") ? `<div class="char-tail"></div>` : ""}
      ${features.includes("bow") ? `<div class="char-bow"></div><div class="char-arrow"></div>` : ""}
      ${features.includes("sword") ? `<div class="char-weapon char-sword"></div>` : ""}
      ${features.includes("spear") ? `<div class="char-weapon char-spear"></div>` : ""}
      ${features.includes("staff") ? `<div class="char-weapon char-staff"></div>` : ""}
      ${features.includes("shield") ? `<div class="char-shield"></div>` : ""}
      <div class="char-body"></div>
      <div class="char-collar"></div>
      <div class="char-head"><span class="char-eye char-eye-left"></span><span class="char-eye char-eye-right"></span></div>
      <div class="char-hair"></div>
      ${features.includes("ears") ? `<div class="char-ear char-ear-left"></div><div class="char-ear char-ear-right"></div>` : ""}
      ${features.includes("crown") ? `<div class="char-crown"><span></span></div>` : ""}
      ${features.includes("sprout") ? `<div class="char-sprout"><span></span></div>` : ""}
      ${features.includes("petals") ? `<div class="char-petal char-petal-one"></div><div class="char-petal char-petal-two"></div><div class="char-petal char-petal-three"></div>` : ""}
    </div>
  `;
}

function renderSpellArt(art) {
  if (art.kind === "book" || art.kind === "library") {
    return `
      <div class="spell-art book-art ${art.kind === "library" ? "library-art" : ""}">
        <div class="book-cover book-cover-left"></div>
        <div class="book-cover book-cover-right"></div>
        <div class="book-spine"></div>
        <div class="book-rune book-rune-one"></div>
        <div class="book-rune book-rune-two"></div>
      </div>
    `;
  }

  if (art.kind === "fountain") {
    return `
      <div class="spell-art fountain-art">
        <div class="fountain-bowl"></div>
        <div class="fountain-stem"></div>
        <div class="fountain-splash fountain-splash-one"></div>
        <div class="fountain-splash fountain-splash-two"></div>
        <div class="fountain-splash fountain-splash-three"></div>
      </div>
    `;
  }

  if (art.kind === "prayer") {
    return `
      <div class="spell-art prayer-art">
        <div class="prayer-hand prayer-hand-left"></div>
        <div class="prayer-hand prayer-hand-right"></div>
        <div class="prayer-heart"></div>
        <div class="prayer-halo"></div>
      </div>
    `;
  }

  return `
    <div class="spell-art ritual-art">
      <div class="magic-ring magic-ring-one"></div>
      <div class="magic-ring magic-ring-two"></div>
      <div class="magic-star">✦</div>
      <div class="magic-rune magic-rune-one"></div>
      <div class="magic-rune magic-rune-two"></div>
      <div class="magic-rune magic-rune-three"></div>
    </div>
  `;
}

function renderCharacterBody(card) {
  return `
    <div class="stats">
      <div class="stat"><span>攻撃力</span><strong>${card.atk}</strong></div>
      <div class="stat"><span>防御力</span><strong>${card.def}</strong></div>
      ${card.characterEffect ? `<div class="stat full-stat"><span>効果</span><strong>${escapeHtml(characterEffectText(card.characterEffect))}</strong></div>` : ""}
    </div>
  `;
}

function renderSpellBody(card) {
  return `
    <div class="stat">
      <span>効果</span>
      <strong>${escapeHtml(spellText(card.spell))}</strong>
    </div>
  `;
}

function renderCardPills(card) {
  const rarity = card.rarity || "N";
  const upgrade = normalizeCardUpgrade(card.upgrade);
  const pills = [
    `<span class="pill rarity-pill rarity-${rarity}">${escapeHtml(RARITY_LABELS[rarity] || rarity)}</span>`,
    `<span class="pill mint">属性 ${escapeHtml(cardAttributeLabel(card.attribute))}</span>`,
    `<span class="pill strong">コスト ${card.cost}</span>`
  ];
  if (upgrade.level > 0) {
    pills.push(`<span class="pill aqua strong">強化 +${upgrade.level}</span>`);
  }
  if (upgrade.evolution > 0) {
    pills.push(`<span class="pill pink strong">進化 ${upgrade.evolution}</span>`);
  }
  if (card.type === "character" && card.abilities?.includes("block")) {
    pills.push(`<span class="pill pink strong">ブロック</span>`);
  }
  if (card.type === "character" && card.characterEffect) {
    pills.push(`<span class="pill aqua">${escapeHtml(characterEffectShortText(card.characterEffect))}</span>`);
  }
  if (card.source === "custom") {
    pills.push(`<span class="pill mint">作成カード</span>`);
  }
  return pills.join("");
}

function renderCardEffectSummary(card) {
  return `
    <div class="effect-summary">
      <span>効果</span>
      <strong>${escapeHtml(cardEffectText(card))}</strong>
    </div>
  `;
}

function cardEffectText(card) {
  if (card.type === "spell") return spellText(card.spell);
  const effects = [];
  if (card.abilities?.includes("block")) effects.push("ブロック");
  if (card.characterEffect) effects.push(characterEffectText(card.characterEffect));
  return effects.length ? effects.join(" / ") : "効果なし";
}

function renderLog(battle) {
  const lines = battle.log.slice(-12).reverse();
  return `
    <div class="stack">
      <div class="section-title"><h3>ログ</h3></div>
      <div class="log">
        ${lines.length ? lines.map((line) => `<div class="log-line">${escapeHtml(line)}</div>`).join("") : `<div class="log-line">まだ行動はありません。</div>`}
      </div>
    </div>
  `;
}

function runGacha(count) {
  const packCount = Math.max(1, Math.min(10, count));
  const cost = packCount >= 10 ? GACHA_TEN_COST : packCount * GACHA_SINGLE_COST;
  const resultCount = packCount * GACHA_CARDS_PER_BALL;
  const activeSet = getActiveGachaSet();
  const setCards = getGachaSetCards(activeSet);
  if (state.gachaBalls < cost) {
    showToast(`${GACHA_BALL_NAME}が足りません。AI戦や1日1回ボーナスで入手できます。`);
    return;
  }
  if (!setCards.length) {
    showToast("このガチャには排出カードが設定されていません。");
    return;
  }

  state.gachaBalls -= cost;
  const results = [];

  for (let i = 0; i < resultCount; i += 1) {
    if (Math.random() * 100 < CREATOR_TICKET_CHANCE) {
      state.creatorTickets += 1;
      results.push({ type: "ticket" });
      continue;
    }

    const rarity = chooseGachaRarity();
    const pool = setCards.filter((card) => (card.rarity || "N") === rarity);
    const fallbackPool = setCards.filter((card) => card.rarity);
    const card = randomItem(pool.length ? pool : fallbackPool.length ? fallbackPool : setCards);
    addInventory(card.id, 1);
    results.push({ type: "card", cardId: card.id, setId: activeSet.id });
  }

  state.gachaResults = results;
  state.gachaHistory = [...results, ...state.gachaHistory].slice(0, GACHA_HISTORY_LIMIT);
  saveGachaBalls();
  saveInventory();
  saveCreatorTickets();
  saveGachaHistory();
  addDailyMissionProgress("gachaPack", packCount);
  const ticketCount = results.filter((result) => result.type === "ticket").length;
  const topRarity = gachaFxRarity(results);
  setFx("gacha", `${activeSet.label} 開封`, `${packCount}パック / ${resultCount}枠 / 最高 ${topRarity}`, topRarity);
  showToast(`${activeSet.label}を${packCount}パック開封しました。${resultCount}枠入手、${GACHA_BALL_NAME}を${cost}個消費。${ticketCount ? `${CREATOR_TICKET_NAME} ${ticketCount}枚入手。` : "カードを入手しました。"}`);
  render();
}

function chooseGachaRarity() {
  const total = RARITY_RATES.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of RARITY_RATES) {
    roll -= entry.weight;
    if (roll < 0) return entry.rarity;
  }
  return "N";
}

function formatRarityRates() {
  const total = RARITY_RATES.reduce((sum, entry) => sum + entry.weight, 0);
  return RARITY_RATES
    .map((entry) => `${entry.rarity} ${Math.round((entry.weight / total) * 100)}%`)
    .join("、");
}

function addDeckCard(cardId) {
  if (!getCard(cardId)) return;
  if (state.deckIds.length >= DECK_SIZE) {
    showToast("山札は300枚までです。");
    return;
  }
  const deckCount = state.deckIds.filter((id) => id === cardId).length;
  const owned = getOwnedCount(cardId);
  if (deckCount >= owned) {
    showToast("所持枚数を超えて山札に入れることはできません。");
    return;
  }
  state.deckIds.push(cardId);
  saveDeck();
  render();
}

function removeDeckCard(cardId) {
  const index = state.deckIds.indexOf(cardId);
  if (index === -1) return;
  state.deckIds.splice(index, 1);
  saveDeck();
  render();
}

function saveCreatedCard() {
  const draft = state.creatorDraft;
  clampCreatorDraftToTier();
  const tier = getCreatorTier(draft.tierId);
  const name = draft.name.trim();
  if (state.creatorTickets < tier.tickets) {
    showToast(`${tier.label}には${CREATOR_TICKET_NAME}が${tier.tickets}枚必要です。`);
    return;
  }
  if (!name) {
    showToast("カード名を入力してください。");
    return;
  }
  const icon = (draft.icon || "札").trim().slice(0, 2) || "札";
  const attribute = normalizeCardAttribute(draft.attribute);
  const characterEffect = buildCharacterEffect(draft.characterEffect, draft.characterEffectValue, tier);
  const cost = draft.type === "character"
    ? calculateCharacterCost(draft.atk, draft.def, draft.block, characterEffect)
    : calculateSpellCost(draft.effect, draft.value);
  const rarity = calculateCreatedCardRarity(cost, tier);
  const card = draft.type === "character"
    ? {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "custom",
      type: "character",
      name,
      icon,
      attribute,
      cost,
      rarity,
      atk: clampInteger(draft.atk, 0, tier.maxAtk),
      def: clampInteger(draft.def, 0, tier.maxDef),
      abilities: draft.block ? ["block"] : [],
      ...(characterEffect ? { characterEffect } : {})
    }
    : {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "custom",
      type: "spell",
      name,
      icon,
      attribute,
      cost,
      rarity,
      spell: {
        effect: draft.effect,
        value: Math.max(1, clampInteger(draft.value, 1, getCreatorSpellMax(draft.effect, tier)))
      }
    };

  state.customCards.push(card);
  state.creatorTickets -= tier.tickets;
  addInventory(card.id, 1);
  saveCustomCards();
  saveCreatorTickets();
  saveInventory();
  state.creatorDraft.name = "";
  setFx("create", `${rarity}カード創造`, card.name, rarity);
  showToast(`${CREATOR_TICKET_NAME}を${tier.tickets}枚使い、${rarity}の${card.name}を1枚入手しました。`);
  render();
}

function startBattle(mode = "local", options = {}) {
  const aiMode = mode === "ai";
  if (aiMode && !options.forceNew && resumeSavedAiBattle()) {
    return;
  }

  state.deckIds = sanitizeDeck(state.deckIds);
  saveDeck();
  if (state.deckIds.length < MIN_DECK_SIZE || state.deckIds.length > DECK_SIZE) {
    state.screen = "deck";
    showToast("バトル開始には所持枚数内で作った山札が100〜300枚必要です。");
    render();
    return;
  }

  const p1Deck = shuffle([...state.deckIds]);
  const p2Deck = shuffle([...state.deckIds]);
  const battle = {
    mode: aiMode ? "ai" : "local",
    phase: "roulette",
    firstPlayer: null,
    activePlayer: null,
    nextActivePlayer: null,
    aiPlayer: aiMode ? 1 : null,
    aiScheduled: false,
    aiThinking: false,
    autoScheduled: false,
    autoThinking: false,
    pendingAttackerUid: null,
    initialDeckSize: state.deckIds.length,
    turnNumber: 0,
    winner: null,
    rewardGranted: false,
    players: [
      createPlayer(aiMode ? "あなた" : "プレイヤー1", p1Deck),
      createPlayer(aiMode ? "AI" : "プレイヤー2", p2Deck)
    ],
    log: []
  };

  drawCards(battle, 0, INITIAL_HAND, false);
  drawCards(battle, 1, INITIAL_HAND, false);
  battle.log.push(aiMode ? "あなたとAIが初期手札を5枚引きました。" : "両プレイヤーが初期手札を5枚引きました。");
  state.battle = battle;
  state.screen = "battle";
  state.cardDetailId = null;
  state.cardDetailHandUid = null;
  state.graveChoice = null;
  render();
}

function startQuestBattle(stageId) {
  const stage = getQuestStage(stageId);
  if (!stage || !isQuestStageUnlocked(stage)) {
    showToast("このクエストはまだ解放されていません。");
    return;
  }

  state.deckIds = sanitizeDeck(state.deckIds);
  saveDeck();
  if (state.deckIds.length < MIN_DECK_SIZE || state.deckIds.length > DECK_SIZE) {
    state.screen = "deck";
    showToast("クエスト開始には所持枚数内で作った山札が100〜300枚必要です。");
    render();
    return;
  }

  const p1Deck = shuffle([...state.deckIds]);
  const enemyDeck = buildQuestEnemyDeck(stage);
  const battle = {
    mode: "quest",
    phase: "battle",
    questStageId: stage.id,
    questRewardGold: stage.rewardGold,
    firstPlayer: 0,
    activePlayer: null,
    nextActivePlayer: null,
    aiPlayer: 1,
    aiScheduled: false,
    aiThinking: false,
    autoScheduled: false,
    autoThinking: false,
    pendingAttackerUid: null,
    initialDeckSize: state.deckIds.length,
    turnNumber: 0,
    winner: null,
    rewardGranted: false,
    players: [
      createPlayer("あなた", p1Deck),
      createPlayer(stage.enemyName, enemyDeck)
    ],
    log: []
  };

  battle.players[1].hp = stage.enemyHp;
  battle.players[1].maxHp = stage.enemyHp;
  battle.players[1].level = stage.enemyLevel;
  drawCards(battle, 0, INITIAL_HAND, false);
  drawCards(battle, 1, INITIAL_HAND, false);
  battle.log.push(`クエスト${stage.id}開始。${stage.enemyName}が立ちはだかります。`);
  state.battle = battle;
  state.screen = "battle";
  state.cardDetailId = null;
  state.cardDetailHandUid = null;
  state.graveChoice = null;
  startTurn(battle, 0);
  render();
  maybeScheduleAutoBattle();
}

function buildQuestEnemyDeck(stage) {
  const allowedRarityIndex = stage.number < 11 ? 1 : stage.number < 26 ? 2 : stage.number < 41 ? 3 : 4;
  const cards = [...DEFAULT_CARDS, ...SET_2_CARDS].filter((card) => RARITY_ORDER.indexOf(card.rarity || "N") <= allowedRarityIndex);
  const weightedPool = cards.flatMap((card) => {
    const rarityIndex = RARITY_ORDER.indexOf(card.rarity || "N");
    const weight = Math.max(1, 8 - rarityIndex * 2 + Math.floor(stage.number / 12));
    return Array.from({ length: weight }, () => card.id);
  });
  const deck = [];
  while (deck.length < DECK_SIZE) {
    deck.push(randomItem(weightedPool));
  }
  return shuffle(deck);
}

function spinRoulette() {
  const battle = state.battle;
  if (!battle) return;
  if (Number.isInteger(battle.firstPlayer)) {
    battle.phase = "battle";
    startTurn(battle, battle.firstPlayer);
    render();
    syncOnlineBattle();
    maybeScheduleAiTurn();
    maybeScheduleAutoBattle();
    return;
  }
  battle.firstPlayer = Math.random() < 0.5 ? 0 : 1;
  battle.activePlayer = battle.firstPlayer;
  battle.log.push(`${battle.players[battle.firstPlayer].name}が先攻に決まりました。`);
  setFx("battle", "先攻決定", `${battle.players[battle.firstPlayer].name}が先攻`);
  render();
  syncOnlineBattle();
}

function readyNextTurn() {
  const battle = state.battle;
  if (!battle || battle.phase !== "handoff") return;
  battle.phase = "battle";
  startTurn(battle, battle.nextActivePlayer);
  render();
  maybeScheduleAiTurn();
  maybeScheduleAutoBattle();
}

function startTurn(battle, playerIndex) {
  if (battle.phase === "over") return;
  const player = battle.players[playerIndex];
  battle.activePlayer = playerIndex;
  battle.nextActivePlayer = null;
  battle.pendingAttackerUid = null;
  battle.aiThinking = isCpuBattleMode(battle.mode) && playerIndex === battle.aiPlayer;
  battle.turnNumber += 1;
  player.ownTurns += 1;
  player.maxCost += 1;
  player.currentCost = player.maxCost;
  player.field.forEach((unit) => {
    unit.canAttack = true;
  });
  battle.log.push(`${player.name}のターン開始。最大コストが${player.maxCost}になりました。`);
  drawCards(battle, playerIndex, TURN_DRAW_COUNT, true);
}

function endTurn() {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (isAiTurn(battle)) return;
  if (!canControlBattle(battle)) {
    showToast("相手のターンです。");
    return;
  }
  battle.pendingAttackerUid = null;
  battle.nextActivePlayer = 1 - battle.activePlayer;
  battle.log.push(`${battle.players[battle.activePlayer].name}がターンエンドしました。`);
  if (isOnlineBattle(battle)) {
    startTurn(battle, battle.nextActivePlayer);
    render();
    syncOnlineBattle();
    return;
  }
  if (isCpuBattleMode(battle.mode)) {
    startTurn(battle, battle.nextActivePlayer);
    render();
    maybeScheduleAiTurn();
    maybeScheduleAutoBattle();
    return;
  }
  battle.phase = "handoff";
  render();
}

function playHandCard(uid) {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (isAiTurn(battle)) return;
  if (!canControlBattle(battle)) {
    showToast("相手のターンです。");
    return;
  }
  const player = battle.players[battle.activePlayer];
  const handIndex = player.hand.findIndex((card) => card.uid === uid);
  if (handIndex === -1) return;
  const handCard = player.hand[handIndex];
  const card = getBattleCard(handCard.cardId, player);
  if (!card || player.currentCost < card.cost) {
    showToast("使用可能コストが足りません。");
    return;
  }

  if (card.type === "character") {
    if (player.field.length >= FIELD_LIMIT) {
      showToast(`フィールドは${FIELD_LIMIT}体までです。`);
      return;
    }
    player.currentCost -= card.cost;
    player.hand.splice(handIndex, 1);
    player.field.push({
      uid: createUid("unit"),
      cardId: card.id,
      baseDefRemaining: card.def,
      canAttack: false,
      battleEnhance: 0
    });
    battle.log.push(`${player.name}が${card.name}を召喚しました。`);
    resolveCharacterEffect(battle, player, battle.players[1 - battle.activePlayer], card, "summon");
    setFx("summon", "召喚", card.name, card.rarity || "N");
  } else {
    player.currentCost -= card.cost;
    player.hand.splice(handIndex, 1);
    player.grave.push(card.id);
    player.level += card.cost;
    battle.log.push(`${player.name}の${card.name}が使用後に墓地へ送られ、レベルが${player.level}になりました。`);
    resolveSpell(battle, player, card);
    setFx("spell", "呪文発動", card.name, card.rarity || "N");
  }

  state.cardDetailId = null;
  state.cardDetailHandUid = null;
  checkBattleEnd(battle);
  render();
  syncOnlineBattle();
}

function sendHandCardToGrave(uid) {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (isAiTurn(battle)) return;
  if (!canControlBattle(battle)) {
    showToast("相手のターンです。");
    return;
  }
  const player = battle.players[battle.activePlayer];
  const handIndex = player.hand.findIndex((card) => card.uid === uid);
  if (handIndex === -1) return;
  const handCard = player.hand[handIndex];
  const card = getBattleCard(handCard.cardId, player);
  if (!card || player.currentCost < card.cost) {
    showToast("墓地へ送るコストが足りません。");
    return;
  }
  player.currentCost -= card.cost;
  player.hand.splice(handIndex, 1);
  player.grave.push(card.id);
  player.level += card.cost;
  battle.log.push(`${player.name}が${card.name}を墓地へ送り、レベルが${player.level}になりました。`);
  state.cardDetailId = null;
  state.cardDetailHandUid = null;
  render();
  syncOnlineBattle();
}

function startHandGraveChoice(battle, player, count, sourceName) {
  const playerIndex = battle.players.indexOf(player);
  if (playerIndex === -1) return;
  const max = Math.max(1, clampInteger(count, 1, 10));
  if (!player.hand.length) {
    battle.log.push(`${player.name}は${sourceName}の効果で墓地へ送れる手札がありませんでした。`);
    return;
  }
  if (isCpuBattleMode(battle.mode) && (playerIndex === battle.aiPlayer || shouldAutoControlPlayer(battle, playerIndex))) {
    const selectedUids = chooseAutoGraveHandUids(player, max);
    sendHandCardsToGraveByUid(battle, player, selectedUids, sourceName);
    return;
  }
  state.cardDetailId = null;
  state.cardDetailHandUid = null;
  state.graveChoice = {
    playerIndex,
    max,
    sourceName,
    selectedUids: []
  };
}

function chooseAutoGraveHandUids(player, max) {
  return player.hand
    .map((handCard) => ({ handCard, card: getBattleCard(handCard.cardId, player) }))
    .filter((entry) => entry.card)
    .sort((a, b) => b.card.cost - a.card.cost)
    .slice(0, max)
    .map((entry) => entry.handCard.uid);
}

function toggleGraveChoice(uid) {
  const choice = state.graveChoice;
  const battle = state.battle;
  if (!choice || !battle || !uid) return;
  const player = battle.players[choice.playerIndex];
  if (!player || !player.hand.some((handCard) => handCard.uid === uid)) return;
  const selected = new Set(choice.selectedUids || []);
  if (selected.has(uid)) {
    selected.delete(uid);
  } else if (selected.size < choice.max) {
    selected.add(uid);
  }
  choice.selectedUids = [...selected];
  render();
}

function confirmGraveChoice() {
  const choice = state.graveChoice;
  const battle = state.battle;
  if (!choice || !battle) return;
  if (isOnlineBattle(battle) && choice.playerIndex !== getOnlinePlayerIndex()) {
    state.graveChoice = null;
    showToast("相手の手札は操作できません。");
    render();
    return;
  }
  const player = battle.players[choice.playerIndex];
  state.graveChoice = null;
  if (!player) {
    render();
    return;
  }
  sendHandCardsToGraveByUid(battle, player, choice.selectedUids || [], choice.sourceName);
  checkBattleEnd(battle);
  render();
  syncOnlineBattle();
}

function cancelGraveChoice() {
  state.graveChoice = null;
  render();
}

function sendHandCardsToGraveByUid(battle, player, uids, sourceName) {
  const uniqueUids = [...new Set(uids || [])];
  const sentNames = [];
  let levelGain = 0;
  uniqueUids.forEach((uid) => {
    const handIndex = player.hand.findIndex((handCard) => handCard.uid === uid);
    if (handIndex === -1) return;
    const handCard = player.hand[handIndex];
    const card = getBattleCard(handCard.cardId, player);
    if (!card) return;
    player.hand.splice(handIndex, 1);
    player.grave.push(card.id);
    player.level += card.cost;
    levelGain += card.cost;
    sentNames.push(card.name);
  });
  if (!sentNames.length) {
    battle.log.push(`${player.name}は${sourceName}の効果で手札を墓地へ送りませんでした。`);
    return;
  }
  battle.log.push(`${player.name}が${sourceName}の効果で${sentNames.join("、")}を墓地へ送り、レベルが${player.level}になりました。`);
  setFx("level", "墓地送り", `LV +${levelGain}`, "SR");
}

function enhanceBattleUnit(uid) {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (isAiTurn(battle)) return;
  if (!canControlBattle(battle)) {
    showToast("相手のターンです。");
    return;
  }
  const playerIndex = battle.activePlayer;
  const player = battle.players[playerIndex];
  const unit = player.field.find((fieldUnit) => fieldUnit.uid === uid);
  if (!unit) return;
  if (player.currentCost < BATTLE_ENHANCE_COST) {
    showToast(`強化にはコスト${BATTLE_ENHANCE_COST}が必要です。`);
    return;
  }
  if (getBattleEnhanceLevel(unit) >= BATTLE_ENHANCE_MAX) {
    showToast("このカードはこれ以上強化できません。");
    return;
  }
  if (!enhanceBattleUnitForPlayer(battle, playerIndex, unit, true)) return;
  render();
  syncOnlineBattle();
}

function enhanceBattleUnitForPlayer(battle, playerIndex, unit, countsMission = false) {
  const player = battle.players[playerIndex];
  const card = getBattleCard(unit?.cardId, player);
  if (!player || !card || player.currentCost < BATTLE_ENHANCE_COST) return false;
  const beforeLevel = getBattleEnhanceLevel(unit);
  if (beforeLevel >= BATTLE_ENHANCE_MAX) return false;

  player.currentCost -= BATTLE_ENHANCE_COST;
  unit.battleEnhance = beforeLevel + 1;
  const currentBaseDef = Number.isFinite(unit.baseDefRemaining) ? unit.baseDefRemaining : card.def;
  unit.baseDefRemaining = Math.min(getBattleEnhancedMaxDef(card, unit), currentBaseDef + BATTLE_ENHANCE_DEF_BONUS);
  battle.log.push(`${player.name}が${card.name}をバトル中強化しました。強化+${unit.battleEnhance}`);
  if (countsMission) addDailyMissionProgress("battleEnhance", 1);
  setFx("level", "バトル強化", `${card.name} +${unit.battleEnhance}`, card.rarity || "N");
  return true;
}

function selectAttacker(uid) {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (isAiTurn(battle)) return;
  if (!canControlBattle(battle)) {
    showToast("相手のターンです。");
    return;
  }
  const player = battle.players[battle.activePlayer];
  const unit = player.field.find((fieldUnit) => fieldUnit.uid === uid);
  if (!unit || !unit.canAttack) return;
  battle.pendingAttackerUid = uid;
  battle.log.push(`${player.name}が${getBattleCard(unit.cardId, player).name}で攻撃対象を選んでいます。`);
  render();
  syncOnlineBattle();
}

function attackCard(targetUid) {
  const battle = state.battle;
  if (!isBattleActive() || !battle.pendingAttackerUid) return;
  if (isAiTurn(battle)) return;
  if (!canControlBattle(battle)) {
    showToast("相手のターンです。");
    return;
  }
  const attackerPlayer = battle.players[battle.activePlayer];
  const defenderPlayer = battle.players[1 - battle.activePlayer];
  const attacker = attackerPlayer.field.find((unit) => unit.uid === battle.pendingAttackerUid);
  if (!attacker || !attacker.canAttack) return;

  let target = defenderPlayer.field.find((unit) => unit.uid === targetUid);
  if (!target) return;

  const blocker = findBlocker(defenderPlayer, target.uid);
  if (blocker && blocker.uid !== target.uid) {
    battle.log.push(`ブロックにより攻撃対象が${getBattleCard(blocker.cardId, defenderPlayer).name}へ変更されました。`);
    target = blocker;
  }

  const attackerCard = getBattleCard(attacker.cardId, attackerPlayer);
  const targetCard = getBattleCard(target.cardId, defenderPlayer);
  const atkStats = getEffectiveStats(attacker, attackerPlayer);
  const defStats = getEffectiveStats(target, defenderPlayer);

  damageUnit(target, defenderPlayer, atkStats.atk);
  damageUnit(attacker, attackerPlayer, defStats.atk);
  attacker.canAttack = false;
  battle.pendingAttackerUid = null;

  battle.log.push(`${attackerPlayer.name}の${attackerCard.name}が${targetCard.name}を攻撃しました。双方が反撃ダメージを受けました。`);
  resolveCharacterEffect(battle, attackerPlayer, defenderPlayer, attackerCard, "attack", attacker, atkStats.atk);
  destroyDefeatedUnits(battle, attackerPlayer, defenderPlayer);
  setFx("attack", "攻撃", `${attackerCard.name} → ${targetCard.name}`, attackerCard.rarity || "N");
  checkBattleEnd(battle);
  render();
  syncOnlineBattle();
}

function attackPlayer() {
  const battle = state.battle;
  if (!isBattleActive() || !battle.pendingAttackerUid) return;
  if (isAiTurn(battle)) return;
  if (!canControlBattle(battle)) {
    showToast("相手のターンです。");
    return;
  }
  const attackerPlayer = battle.players[battle.activePlayer];
  const defenderPlayer = battle.players[1 - battle.activePlayer];
  if (defenderPlayer.field.length > 0) {
    showToast("相手フィールドにキャラクターがいるため直接攻撃できません。");
    return;
  }
  const attacker = attackerPlayer.field.find((unit) => unit.uid === battle.pendingAttackerUid);
  if (!attacker || !attacker.canAttack) return;
  const card = getBattleCard(attacker.cardId, attackerPlayer);
  const damage = getEffectiveStats(attacker, attackerPlayer).atk;
  defenderPlayer.hp -= damage;
  attacker.canAttack = false;
  battle.pendingAttackerUid = null;
  battle.log.push(`${attackerPlayer.name}の${card.name}が直接攻撃し、${damage}ダメージを与えました。`);
  resolveCharacterEffect(battle, attackerPlayer, defenderPlayer, card, "attack", attacker, damage);
  setFx("attack", "直接攻撃", `${card.name} / ${damage}ダメージ`, card.rarity || "N");
  checkBattleEnd(battle);
  render();
  syncOnlineBattle();
}

function surrender() {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (isOnlineBattle(battle)) {
    const playerIndex = getOnlinePlayerIndex();
    if (!Number.isInteger(playerIndex)) return;
    battle.winner = 1 - playerIndex;
    battle.phase = "over";
    battle.pendingAttackerUid = null;
    battle.log.push(`${battle.players[playerIndex].name}が降参しました。`);
    render();
    syncOnlineBattle();
    return;
  }
  if (isCpuBattleMode(battle.mode)) {
    battle.winner = battle.aiPlayer;
    battle.phase = "over";
    battle.rewardGranted = true;
    battle.log.push("あなたが降参しました。降参では報酬を入手できません。");
    render();
    return;
  }
  battle.winner = 1 - battle.activePlayer;
  battle.phase = "over";
  battle.log.push(`${battle.players[battle.activePlayer].name}が降参しました。`);
  render();
}

function resolveSpell(battle, player, card) {
  const spell = card.spell;
  if (spell.effect === "draw") {
    const drawCount = effectiveDrawValue(spell.value);
    battle.log.push(`${player.name}が${card.name}を使い、${drawCount}枚ドローします。`);
    drawCards(battle, battle.activePlayer, drawCount, true);
    return;
  }
  if (spell.effect === "maxCost") {
    player.maxCost += spell.value;
    player.currentCost += spell.value;
    battle.log.push(`${player.name}が${card.name}を使い、最大コストが${spell.value}増えました。`);
    return;
  }
  if (spell.effect === "heal") {
    const before = player.hp;
    player.hp = Math.min(MAX_HP, player.hp + spell.value);
    battle.log.push(`${player.name}が${card.name}を使い、HPを${Math.ceil(player.hp - before)}回復しました。`);
    return;
  }
  if (spell.effect === "graveHand") {
    battle.log.push(`${player.name}が${card.name}を使い、手札を墓地へ送るカードを選びます。`);
    startHandGraveChoice(battle, player, spell.value, card.name);
  }
}

function resolveCharacterEffect(battle, owner, opponent, card, trigger, unit = null, attackAmount = 0) {
  const characterEffect = card.characterEffect;
  if (!characterEffect || characterEffect.trigger !== trigger) return;
  const value = Math.max(1, clampInteger(characterEffect.value, 1, 999));
  const ownerIndex = battle.players.indexOf(owner);
  const triggerText = trigger === "summon" ? "召喚時効果" : "攻撃時効果";

  if (characterEffect.effect === "draw") {
    if (ownerIndex === -1) return;
    const drawCount = effectiveDrawValue(value);
    battle.log.push(`${owner.name}の${card.name}の${triggerText}。${drawCount}枚ドローします。`);
    drawCards(battle, ownerIndex, drawCount, true);
    return;
  }

  if (characterEffect.effect === "heal") {
    const before = owner.hp;
    owner.hp = Math.min(MAX_HP, owner.hp + value);
    battle.log.push(`${owner.name}の${card.name}の${triggerText}。HPを${Math.ceil(owner.hp - before)}回復しました。`);
    return;
  }

  if (characterEffect.effect === "maxCost") {
    owner.maxCost += value;
    owner.currentCost += value;
    battle.log.push(`${owner.name}の${card.name}の${triggerText}。最大コストが${value}増えました。`);
    return;
  }

  if (characterEffect.effect === "level") {
    owner.level += value;
    battle.log.push(`${owner.name}の${card.name}の${triggerText}。レベルが${owner.level}になりました。`);
    return;
  }

  if (characterEffect.effect === "damage") {
    opponent.hp -= value;
    battle.log.push(`${owner.name}の${card.name}の${triggerText}。${opponent.name}に${value}追加ダメージ。`);
    return;
  }

  if (characterEffect.effect === "absorb") {
    if (!unit) return;
    const healed = healUnitDefense(unit, owner, attackAmount || getEffectiveStats(unit, owner).atk);
    const resultText = healed > 0 ? `防御を${healed}回復しました。` : "防御はすでに最大です。";
    battle.log.push(`${owner.name}の${card.name}の${triggerText}。吸収で${resultText}`);
    return;
  }

  if (characterEffect.effect === "graveHand") {
    battle.log.push(`${owner.name}の${card.name}の${triggerText}。手札を墓地へ送るカードを選びます。`);
    startHandGraveChoice(battle, owner, value, card.name);
  }
}

function drawCards(battle, playerIndex, count, loseOnEmpty) {
  const player = battle.players[playerIndex];
  if (player.deck.length < count) {
    if (loseOnEmpty) {
      battle.winner = 1 - playerIndex;
      battle.phase = "over";
      battle.log.push(`${player.name}は山札が足りず敗北しました。`);
      grantBattleReward(battle);
    }
    return;
  }
  for (let i = 0; i < count; i += 1) {
    player.hand.push({
      uid: createUid("hand"),
      cardId: player.deck.shift()
    });
  }
  if (loseOnEmpty) {
    battle.log.push(`${player.name}が${count}枚ドローしました。`);
  }
}

function destroyDefeatedUnits(battle, playerA, playerB) {
  [playerA, playerB].forEach((player) => {
    const defeated = player.field.filter((unit) => unit.baseDefRemaining <= 0.0001);
    if (!defeated.length) return;
    defeated.forEach((unit) => {
      const card = getBattleCard(unit.cardId, player);
      player.grave.push(card.id);
      player.level += card.cost;
      battle.log.push(`${player.name}の${card.name}が破壊され、墓地へ送られました。レベルが${player.level}になりました。`);
    });
    player.field = player.field.filter((unit) => unit.baseDefRemaining > 0.0001);
  });
}

function damageUnit(unit, owner, damage) {
  const multiplier = levelMultiplier(owner.level);
  unit.baseDefRemaining -= damage / multiplier;
}

function healUnitDefense(unit, owner, amount) {
  const card = getBattleCard(unit.cardId, owner);
  if (!card || card.type !== "character") return 0;
  const multiplier = levelMultiplier(owner.level);
  const before = getEffectiveStats(unit, owner).def;
  const currentBaseDef = Number.isFinite(unit.baseDefRemaining) ? unit.baseDefRemaining : card.def;
  unit.baseDefRemaining = Math.min(getBattleEnhancedMaxDef(card, unit), currentBaseDef + Math.max(0, amount) / multiplier);
  const after = getEffectiveStats(unit, owner).def;
  return Math.max(0, after - before);
}

function maybeScheduleAiTurn() {
  const battle = state.battle;
  if (!isAiTurn(battle) || battle.aiScheduled) return;
  battle.aiScheduled = true;
  window.setTimeout(() => {
    const current = state.battle;
    if (!current) return;
    current.aiScheduled = false;
    if (!isAiTurn(current)) return;
    runAiTurn();
  }, 700);
}

function maybeScheduleAutoBattle() {
  const battle = state.battle;
  if (!shouldAutoControlPlayer(battle, 0) || battle.autoScheduled) return;
  battle.autoScheduled = true;
  window.setTimeout(() => {
    const current = state.battle;
    if (!current) return;
    current.autoScheduled = false;
    if (!shouldAutoControlPlayer(current, 0)) return;
    runAutoBattleTurn();
  }, 450);
}

function shouldAutoControlPlayer(battle = state.battle, playerIndex = 0) {
  return Boolean(
    state.autoBattle &&
    battle &&
    isCpuBattleMode(battle.mode) &&
    battle.phase === "battle" &&
    battle.activePlayer === playerIndex &&
    playerIndex !== battle.aiPlayer
  );
}

function runAutoBattleTurn() {
  const battle = state.battle;
  if (!shouldAutoControlPlayer(battle, 0)) return;
  battle.autoThinking = true;
  state.cardDetailId = null;
  state.cardDetailHandUid = null;
  state.graveChoice = null;

  let actionCount = 0;
  while (actionCount < 16 && battle.phase !== "over" && shouldAutoControlPlayer(battle, 0)) {
    const acted = tryAutoUseSpell(battle, 0) || tryAutoSummon(battle, 0) || tryAutoEnhanceUnit(battle, 0, true) || tryAutoLevelUp(battle, 0);
    if (!acted) break;
    actionCount += 1;
  }

  if (battle.phase !== "over" && shouldAutoControlPlayer(battle, 0)) {
    autoAttackAll(battle, 0);
  }

  if (battle.phase === "over") {
    battle.autoThinking = false;
    render();
    return;
  }

  if (!shouldAutoControlPlayer(battle, 0)) {
    battle.autoThinking = false;
    render();
    return;
  }

  battle.autoThinking = false;
  battle.pendingAttackerUid = null;
  battle.log.push("オート戦闘がターンエンドしました。");
  startTurn(battle, 1);
  render();
  maybeScheduleAiTurn();
}

function tryAutoUseSpell(battle, playerIndex) {
  const player = battle.players[playerIndex];
  const playable = player.hand
    .map((handCard, index) => ({ handCard, index, card: getBattleCard(handCard.cardId, player) }))
    .filter((entry) => entry.card?.type === "spell" && entry.card.cost <= player.currentCost);

  const maxCostSpell = playable.find((entry) => entry.card.spell.effect === "maxCost");
  if (maxCostSpell) return autoPlayHandIndex(battle, playerIndex, maxCostSpell.index);

  const healSpell = playable.find((entry) => entry.card.spell.effect === "heal" && player.hp <= MAX_HP - entry.card.spell.value);
  if (healSpell) return autoPlayHandIndex(battle, playerIndex, healSpell.index);

  const graveHandSpell = playable.find((entry) => entry.card.spell.effect === "graveHand" && player.hand.length > 2);
  if (graveHandSpell) return autoPlayHandIndex(battle, playerIndex, graveHandSpell.index);

  const drawSpell = playable.find((entry) => entry.card.spell.effect === "draw" && player.hand.length <= 8 && player.deck.length >= effectiveDrawValue(entry.card.spell.value));
  if (drawSpell) return autoPlayHandIndex(battle, playerIndex, drawSpell.index);

  return false;
}

function tryAutoSummon(battle, playerIndex) {
  const player = battle.players[playerIndex];
  if (player.field.length >= FIELD_LIMIT) return false;
  const candidates = player.hand
    .map((handCard, index) => ({ handCard, index, card: getBattleCard(handCard.cardId, player) }))
    .filter((entry) => entry.card?.type === "character" && entry.card.cost <= player.currentCost)
    .sort((a, b) => aiCardScore(b.card) - aiCardScore(a.card));
  if (!candidates.length) return false;
  return autoPlayHandIndex(battle, playerIndex, candidates[0].index);
}

function tryAutoEnhanceUnit(battle, playerIndex, countsMission = false) {
  const player = battle.players[playerIndex];
  if (!player || player.currentCost < BATTLE_ENHANCE_COST) return false;
  const candidates = player.field
    .filter((unit) => getBattleEnhanceLevel(unit) < BATTLE_ENHANCE_MAX)
    .sort((a, b) => {
      const aStats = getEffectiveStats(a, player);
      const bStats = getEffectiveStats(b, player);
      return (bStats.atk + bStats.def) - (aStats.atk + aStats.def);
    });
  if (!candidates.length) return false;
  return enhanceBattleUnitForPlayer(battle, playerIndex, candidates[0], countsMission);
}

function tryAutoLevelUp(battle, playerIndex) {
  const player = battle.players[playerIndex];
  if (player.currentCost < 1 || player.hand.length < 5 || player.level >= LEVEL_FOR_MULTIPLIER_CAP) return false;
  const candidates = player.hand
    .map((handCard, index) => ({ handCard, index, card: getBattleCard(handCard.cardId, player) }))
    .filter((entry) => entry.card && entry.card.cost <= player.currentCost)
    .sort((a, b) => b.card.cost - a.card.cost);
  if (!candidates.length) return false;
  return autoSendHandIndexToGrave(battle, playerIndex, candidates[0].index);
}

function autoPlayHandIndex(battle, playerIndex, handIndex) {
  const player = battle.players[playerIndex];
  const opponent = battle.players[1 - playerIndex];
  const handCard = player.hand[handIndex];
  const card = getBattleCard(handCard?.cardId, player);
  if (!card || player.currentCost < card.cost) return false;

  if (card.type === "character") {
    if (player.field.length >= FIELD_LIMIT) return false;
    player.currentCost -= card.cost;
    player.hand.splice(handIndex, 1);
    player.field.push({
      uid: createUid("unit"),
      cardId: card.id,
      baseDefRemaining: card.def,
      canAttack: false,
      battleEnhance: 0
    });
    battle.log.push(`${player.name}がオートで${card.name}を召喚しました。`);
    resolveCharacterEffect(battle, player, opponent, card, "summon");
    setFx("summon", "オート召喚", card.name, card.rarity || "N");
  } else {
    player.currentCost -= card.cost;
    player.hand.splice(handIndex, 1);
    player.grave.push(card.id);
    player.level += card.cost;
    battle.log.push(`${player.name}がオートで${card.name}を使用し、墓地へ送りました。レベルは${player.level}になりました。`);
    resolveSpell(battle, player, card);
    setFx("spell", "オート呪文", card.name, card.rarity || "N");
  }

  checkBattleEnd(battle);
  return true;
}

function autoSendHandIndexToGrave(battle, playerIndex, handIndex) {
  const player = battle.players[playerIndex];
  const handCard = player.hand[handIndex];
  const card = getBattleCard(handCard?.cardId, player);
  if (!card || player.currentCost < card.cost) return false;
  player.currentCost -= card.cost;
  player.hand.splice(handIndex, 1);
  player.grave.push(card.id);
  player.level += card.cost;
  battle.log.push(`${player.name}がオートで${card.name}を墓地へ送り、レベルは${player.level}になりました。`);
  setFx("level", "オート墓地送り", `LV +${card.cost}`, card.rarity || "N");
  return true;
}

function autoAttackAll(battle, attackerIndex) {
  const attackerPlayer = battle.players[attackerIndex];
  const defenderPlayer = battle.players[1 - attackerIndex];
  let attacks = 0;
  while (attacks < FIELD_LIMIT && battle.phase !== "over") {
    const attacker = attackerPlayer.field.find((unit) => unit.canAttack);
    if (!attacker) break;
    if (defenderPlayer.field.length === 0) {
      autoAttackPlayer(battle, attackerIndex, attacker);
    } else {
      autoAttackCard(battle, attackerIndex, attacker, chooseAutoAttackTarget(battle, attackerIndex, attacker));
    }
    attacks += 1;
  }
}

function chooseAutoAttackTarget(battle, attackerIndex, attacker) {
  const defender = battle.players[1 - attackerIndex];
  const blockers = defender.field.filter((unit) => getBattleCard(unit.cardId, defender).abilities?.includes("block"));
  if (blockers.length) return blockers[0];

  const attackerPlayer = battle.players[attackerIndex];
  const attackerAtk = getEffectiveStats(attacker, attackerPlayer).atk;
  return [...defender.field].sort((a, b) => {
    const aStats = getEffectiveStats(a, defender);
    const bStats = getEffectiveStats(b, defender);
    const aKillable = attackerAtk >= aStats.def ? 1 : 0;
    const bKillable = attackerAtk >= bStats.def ? 1 : 0;
    if (aKillable !== bKillable) return bKillable - aKillable;
    if (aStats.atk !== bStats.atk) return bStats.atk - aStats.atk;
    return aStats.def - bStats.def;
  })[0];
}

function autoAttackCard(battle, attackerIndex, attacker, target) {
  const attackerPlayer = battle.players[attackerIndex];
  const defenderPlayer = battle.players[1 - attackerIndex];
  if (!attacker || !target || !attacker.canAttack) return;

  let actualTarget = target;
  const blocker = findBlocker(defenderPlayer, target.uid);
  if (blocker && blocker.uid !== target.uid) {
    battle.log.push(`ブロックによりオート攻撃対象が${getBattleCard(blocker.cardId, defenderPlayer).name}へ変更されました。`);
    actualTarget = blocker;
  }

  const attackerCard = getBattleCard(attacker.cardId, attackerPlayer);
  const targetCard = getBattleCard(actualTarget.cardId, defenderPlayer);
  const atkStats = getEffectiveStats(attacker, attackerPlayer);
  const defStats = getEffectiveStats(actualTarget, defenderPlayer);
  damageUnit(actualTarget, defenderPlayer, atkStats.atk);
  damageUnit(attacker, attackerPlayer, defStats.atk);
  attacker.canAttack = false;
  battle.log.push(`${attackerPlayer.name}の${attackerCard.name}がオートで${targetCard.name}を攻撃しました。`);
  resolveCharacterEffect(battle, attackerPlayer, defenderPlayer, attackerCard, "attack", attacker, atkStats.atk);
  destroyDefeatedUnits(battle, attackerPlayer, defenderPlayer);
  setFx("attack", "オート攻撃", `${attackerCard.name} -> ${targetCard.name}`, attackerCard.rarity || "N");
  checkBattleEnd(battle);
}

function autoAttackPlayer(battle, attackerIndex, attacker) {
  const attackerPlayer = battle.players[attackerIndex];
  const defenderPlayer = battle.players[1 - attackerIndex];
  if (!attacker || !attacker.canAttack) return;
  const card = getBattleCard(attacker.cardId, attackerPlayer);
  const damage = getEffectiveStats(attacker, attackerPlayer).atk;
  defenderPlayer.hp -= damage;
  attacker.canAttack = false;
  battle.log.push(`${attackerPlayer.name}の${card.name}がオートで直接攻撃し、${damage}ダメージを与えました。`);
  resolveCharacterEffect(battle, attackerPlayer, defenderPlayer, card, "attack", attacker, damage);
  setFx("attack", "オート直接攻撃", `${card.name} / ${damage}ダメージ`, card.rarity || "N");
  checkBattleEnd(battle);
}

function runAiTurn() {
  const battle = state.battle;
  if (!isAiTurn(battle)) return;

  let actionCount = 0;
  while (actionCount < 12 && battle.phase !== "over") {
    const acted = tryAiUseSpell(battle) || tryAiSummon(battle) || tryAiEnhanceUnit(battle) || tryAiLevelUp(battle);
    if (!acted) break;
    actionCount += 1;
  }

  if (battle.phase !== "over") {
    aiAttackAll(battle);
  }

  if (battle.phase === "over") {
    battle.aiThinking = false;
    render();
    return;
  }

  battle.aiThinking = false;
  battle.log.push("AIがターンエンドしました。");
  startTurn(battle, 0);
  render();
  maybeScheduleAutoBattle();
}

function tryAiUseSpell(battle) {
  const ai = battle.players[battle.aiPlayer];
  const playable = ai.hand
    .map((handCard, index) => ({ handCard, index, card: getBattleCard(handCard.cardId, ai) }))
    .filter((entry) => entry.card?.type === "spell" && entry.card.cost <= ai.currentCost);

  const maxCostSpell = playable.find((entry) => entry.card.spell.effect === "maxCost");
  if (maxCostSpell) return aiPlayHandIndex(battle, maxCostSpell.index);

  const healSpell = playable.find((entry) => entry.card.spell.effect === "heal" && ai.hp <= MAX_HP - entry.card.spell.value);
  if (healSpell) return aiPlayHandIndex(battle, healSpell.index);

  const graveHandSpell = playable.find((entry) => entry.card.spell.effect === "graveHand" && ai.hand.length > 1);
  if (graveHandSpell) return aiPlayHandIndex(battle, graveHandSpell.index);

  const drawSpell = playable.find((entry) => entry.card.spell.effect === "draw" && ai.hand.length <= 7 && ai.deck.length >= effectiveDrawValue(entry.card.spell.value));
  if (drawSpell) return aiPlayHandIndex(battle, drawSpell.index);

  return false;
}

function tryAiSummon(battle) {
  const ai = battle.players[battle.aiPlayer];
  if (ai.field.length >= FIELD_LIMIT) return false;
  const candidates = ai.hand
    .map((handCard, index) => ({ handCard, index, card: getBattleCard(handCard.cardId, ai) }))
    .filter((entry) => entry.card?.type === "character" && entry.card.cost <= ai.currentCost)
    .sort((a, b) => aiCardScore(b.card) - aiCardScore(a.card));
  if (!candidates.length) return false;
  return aiPlayHandIndex(battle, candidates[0].index);
}

function tryAiEnhanceUnit(battle) {
  return tryAutoEnhanceUnit(battle, battle.aiPlayer, false);
}

function tryAiLevelUp(battle) {
  const ai = battle.players[battle.aiPlayer];
  if (ai.currentCost < 1 || ai.hand.length < 4 || ai.level >= LEVEL_FOR_MULTIPLIER_CAP) return false;
  const candidates = ai.hand
    .map((handCard, index) => ({ handCard, index, card: getBattleCard(handCard.cardId, ai) }))
    .filter((entry) => entry.card && entry.card.cost <= ai.currentCost)
    .sort((a, b) => b.card.cost - a.card.cost);
  if (!candidates.length) return false;
  return aiSendHandIndexToGrave(battle, candidates[0].index);
}

function aiPlayHandIndex(battle, handIndex) {
  const ai = battle.players[battle.aiPlayer];
  const handCard = ai.hand[handIndex];
  const card = getBattleCard(handCard?.cardId, ai);
  if (!card || ai.currentCost < card.cost) return false;

  if (card.type === "character") {
    if (ai.field.length >= FIELD_LIMIT) return false;
    ai.currentCost -= card.cost;
    ai.hand.splice(handIndex, 1);
    ai.field.push({
      uid: createUid("unit"),
      cardId: card.id,
      baseDefRemaining: card.def,
      canAttack: false,
      battleEnhance: 0
    });
    battle.log.push(`AIが${card.name}を召喚しました。`);
    resolveCharacterEffect(battle, ai, battle.players[0], card, "summon");
    setFx("summon", "AI召喚", card.name, card.rarity || "N");
  } else {
    ai.currentCost -= card.cost;
    ai.hand.splice(handIndex, 1);
    ai.grave.push(card.id);
    ai.level += card.cost;
    battle.log.push(`AIの${card.name}が使用後に墓地へ送られ、レベルが${ai.level}になりました。`);
    resolveSpell(battle, ai, card);
    setFx("spell", "AI呪文", card.name, card.rarity || "N");
  }

  checkBattleEnd(battle);
  return true;
}

function aiSendHandIndexToGrave(battle, handIndex) {
  const ai = battle.players[battle.aiPlayer];
  const handCard = ai.hand[handIndex];
  const card = getBattleCard(handCard?.cardId, ai);
  if (!card || ai.currentCost < card.cost) return false;
  ai.currentCost -= card.cost;
  ai.hand.splice(handIndex, 1);
  ai.grave.push(card.id);
  ai.level += card.cost;
  battle.log.push(`AIが${card.name}を墓地へ送り、レベルが${ai.level}になりました。`);
  return true;
}

function aiAttackAll(battle) {
  const ai = battle.players[battle.aiPlayer];
  const human = battle.players[0];
  let attacks = 0;
  while (attacks < FIELD_LIMIT && battle.phase !== "over") {
    const attacker = ai.field.find((unit) => unit.canAttack);
    if (!attacker) break;
    if (human.field.length === 0) {
      aiAttackPlayer(battle, attacker);
    } else {
      aiAttackCard(battle, attacker, chooseAiAttackTarget(battle, attacker));
    }
    attacks += 1;
  }
}

function chooseAiAttackTarget(battle, attacker) {
  const human = battle.players[0];
  const blockers = human.field.filter((unit) => getBattleCard(unit.cardId, human).abilities?.includes("block"));
  if (blockers.length) return blockers[0];

  const ai = battle.players[battle.aiPlayer];
  const attackerAtk = getEffectiveStats(attacker, ai).atk;
  return [...human.field].sort((a, b) => {
    const aStats = getEffectiveStats(a, human);
    const bStats = getEffectiveStats(b, human);
    const aKillable = attackerAtk >= aStats.def ? 1 : 0;
    const bKillable = attackerAtk >= bStats.def ? 1 : 0;
    if (aKillable !== bKillable) return bKillable - aKillable;
    if (aStats.atk !== bStats.atk) return bStats.atk - aStats.atk;
    return aStats.def - bStats.def;
  })[0];
}

function aiAttackCard(battle, attacker, target) {
  const ai = battle.players[battle.aiPlayer];
  const human = battle.players[0];
  if (!attacker || !target || !attacker.canAttack) return;

  let actualTarget = target;
  const blocker = findBlocker(human, target.uid);
  if (blocker && blocker.uid !== target.uid) {
    battle.log.push(`ブロックによりAIの攻撃対象が${getBattleCard(blocker.cardId, human).name}へ変更されました。`);
    actualTarget = blocker;
  }

  const attackerCard = getBattleCard(attacker.cardId, ai);
  const targetCard = getBattleCard(actualTarget.cardId, human);
  const atkStats = getEffectiveStats(attacker, ai);
  const defStats = getEffectiveStats(actualTarget, human);
  damageUnit(actualTarget, human, atkStats.atk);
  damageUnit(attacker, ai, defStats.atk);
  attacker.canAttack = false;
  battle.log.push(`AIの${attackerCard.name}が${targetCard.name}を攻撃しました。`);
  resolveCharacterEffect(battle, ai, human, attackerCard, "attack", attacker, atkStats.atk);
  destroyDefeatedUnits(battle, ai, human);
  setFx("attack", "AI攻撃", `${attackerCard.name} → ${targetCard.name}`, attackerCard.rarity || "N");
  checkBattleEnd(battle);
}

function aiAttackPlayer(battle, attacker) {
  const ai = battle.players[battle.aiPlayer];
  const human = battle.players[0];
  if (!attacker || !attacker.canAttack) return;
  const card = getBattleCard(attacker.cardId, ai);
  const damage = getEffectiveStats(attacker, ai).atk;
  human.hp -= damage;
  attacker.canAttack = false;
  battle.log.push(`AIの${card.name}が直接攻撃し、${damage}ダメージを与えました。`);
  resolveCharacterEffect(battle, ai, human, card, "attack", attacker, damage);
  setFx("attack", "AI直接攻撃", `${card.name} / ${damage}ダメージ`, card.rarity || "N");
  checkBattleEnd(battle);
}

function aiCardScore(card) {
  const blockBonus = card.abilities?.includes("block") ? 8 : 0;
  const effectBonus = characterEffectCostBonus(card.characterEffect);
  return card.cost * 4 + card.atk * 2 + card.def + blockBonus + effectBonus;
}

function isAiTurn(battle = state.battle) {
  return Boolean(battle && isCpuBattleMode(battle.mode) && battle.phase === "battle" && battle.activePlayer === battle.aiPlayer);
}

function isCpuBattleMode(mode) {
  return mode === "ai" || mode === "quest";
}

function findBlocker(player, targetUid) {
  const blockers = player.field.filter((unit) => getBattleCard(unit.cardId, player).abilities?.includes("block"));
  if (!blockers.length) return null;
  if (blockers.some((unit) => unit.uid === targetUid)) return null;
  return blockers[0];
}

function checkBattleEnd(battle) {
  if (battle.phase === "over") return true;
  const p1Dead = battle.players[0].hp <= 0;
  const p2Dead = battle.players[1].hp <= 0;
  if (p1Dead && p2Dead) {
    battle.winner = battle.activePlayer;
    battle.phase = "over";
    battle.log.push("双方のHPが0以下になりました。手番プレイヤーの勝利として処理しました。");
    grantBattleReward(battle);
    return true;
  }
  if (p1Dead || p2Dead) {
    battle.winner = p1Dead ? 1 : 0;
    battle.phase = "over";
    battle.log.push(`${battle.players[battle.winner].name}が勝利しました。`);
    grantBattleReward(battle);
    return true;
  }
  return false;
}

function grantBattleReward(battle) {
  if (!battle || battle.rewardGranted || !Number.isInteger(battle.winner)) return;
  if (battle.mode === "ai") {
    const reward = battle.winner === 0 ? AI_WIN_GACHA_BALL_REWARD : AI_LOSE_GACHA_BALL_REWARD;
    battle.rewardGranted = true;
    state.gachaBalls += reward;
    saveGachaBalls();
    addDailyMissionProgress("aiBattleComplete", 1);
    battle.log.push(`${GACHA_BALL_NAME}を${reward}個入手しました。`);
    return;
  }
  if (battle.mode === "quest") {
    battle.rewardGranted = true;
    if (battle.winner !== 0) {
      battle.log.push("クエストに敗北しました。ゴールドは入手できません。");
      return;
    }
    const stage = getQuestStage(battle.questStageId);
    if (!stage) return;
    const firstClear = !isQuestStageCleared(stage.id);
    const reward = firstClear ? stage.rewardGold : Math.max(10, Math.ceil(stage.rewardGold * 0.35));
    state.gold += reward;
    if (firstClear) {
      state.questClears.push(stage.id);
      state.questClears = normalizeQuestClears(state.questClears);
      state.gachaBalls += QUEST_FIRST_CLEAR_GACHA_BALL_REWARD;
      saveQuestClears();
      saveGachaBalls();
    }
    addDailyMissionProgress("questWin", 1);
    saveGold();
    battle.log.push(`${stage.id}を${firstClear ? "初クリア" : "再クリア"}しました。${GOLD_NAME}を${reward}入手しました。${firstClear ? `${GACHA_BALL_NAME}を${QUEST_FIRST_CLEAR_GACHA_BALL_REWARD}個入手しました。` : ""}`);
  }
}

function isBattleActive() {
  return state.battle && state.battle.phase === "battle";
}

function createPlayer(name, deck, cardUpgrades = {}) {
  return {
    name,
    hp: MAX_HP,
    maxHp: MAX_HP,
    level: 0,
    maxCost: 0,
    currentCost: 0,
    ownTurns: 0,
    deck,
    hand: [],
    field: [],
    grave: [],
    cardUpgrades: normalizeCardUpgrades(cardUpgrades)
  };
}

function getBaseCards() {
  return [...DEFAULT_CARDS, ...SET_2_CARDS, ...state.customCards];
}

function getBaseCard(cardId) {
  return getBaseCards().find((card) => card.id === cardId);
}

function getCards() {
  return getBaseCards().map((card) => applyCardUpgrade(card, {}));
}

function getCard(cardId) {
  const card = getBaseCard(cardId);
  return card ? applyCardUpgrade(card, {}) : undefined;
}

function getBattleCard(cardId, player) {
  const card = getBaseCard(cardId);
  return card ? applyCardUpgrade(card, {}) : undefined;
}

function applyCardUpgrade(card, upgrades = state.cardUpgrades) {
  if (!card) return card;
  const upgrade = normalizeCardUpgrade(upgrades?.[card.id]);
  const upgraded = {
    ...card,
    abilities: Array.isArray(card.abilities) ? [...card.abilities] : [],
    spell: card.spell ? { ...card.spell } : undefined,
    upgrade
  };
  if (upgrade.evolution > 0) {
    upgraded.rarity = bumpRarity(card.rarity || "N", upgrade.evolution);
  }
  if (card.type === "character") {
    upgraded.atk = Math.max(0, Math.ceil((card.atk || 0) + upgrade.level + upgrade.evolution * 5));
    upgraded.def = Math.max(0, Math.ceil((card.def || 0) + upgrade.level * 2 + upgrade.evolution * 10));
  } else if (upgraded.spell) {
    const spellBoost = Math.floor(upgrade.level / 5) + upgrade.evolution;
    if (upgraded.spell.effect === "heal") {
      upgraded.spell.value = Math.max(1, (card.spell.value || 1) + upgrade.level * 2 + upgrade.evolution * 10);
    } else if (upgraded.spell.effect === "maxCost") {
      upgraded.spell.value = Math.max(1, (card.spell.value || 1) + Math.floor(upgrade.evolution / 2));
    } else {
      upgraded.spell.value = Math.max(1, (card.spell.value || 1) + spellBoost);
    }
  }
  return upgraded;
}

function bumpRarity(rarity, amount) {
  const index = Math.max(0, RARITY_ORDER.indexOf(rarity || "N"));
  return RARITY_ORDER[Math.min(RARITY_ORDER.length - 1, index + Math.max(0, amount))] || "N";
}

function normalizeCardUpgrade(upgrade) {
  if (!upgrade || typeof upgrade !== "object") return { level: 0, evolution: 0 };
  return {
    level: clampInteger(upgrade.level, 0, CARD_MAX_ENHANCE_LEVEL),
    evolution: clampInteger(upgrade.evolution, 0, CARD_MAX_EVOLUTION)
  };
}

function normalizeCardUpgrades(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([cardId]) => typeof cardId === "string" && cardId)
    .map(([cardId, upgrade]) => [cardId, normalizeCardUpgrade(upgrade)])
    .filter(([, upgrade]) => upgrade.level > 0 || upgrade.evolution > 0));
}

function getCardUpgrade(cardId) {
  return normalizeCardUpgrade(state.cardUpgrades[cardId]);
}

function cardUpgradeEffectText(card, upgrade = getCardUpgrade(card.id)) {
  if (card.type === "character") {
    const atk = upgrade.level + upgrade.evolution * 5;
    const def = upgrade.level * 2 + upgrade.evolution * 10;
    return `攻撃+${atk} / 防御+${def} / 表示ランク${bumpRarity(getBaseCard(card.id)?.rarity || card.rarity || "N", upgrade.evolution)}`;
  }
  if (card.spell?.effect === "heal") return `回復量+${upgrade.level * 2 + upgrade.evolution * 10}`;
  if (card.spell?.effect === "maxCost") return `進化2以上で最大コスト増加量+1`;
  return `効果値+${Math.floor(upgrade.level / 5) + upgrade.evolution}`;
}

function getUpgradeRarityMultiplier(card) {
  return RARITY_COST_MULTIPLIER[getBaseCard(card.id)?.rarity || card.rarity || "N"] || 1;
}

function getEnhanceCost(card, upgrade = getCardUpgrade(card.id)) {
  const nextLevel = Math.min(CARD_MAX_ENHANCE_LEVEL, upgrade.level + 1);
  const multiplier = getUpgradeRarityMultiplier(card) * (1 + upgrade.evolution * 0.45);
  return {
    cards: 1,
    gold: Math.ceil((25 + nextLevel * 18) * multiplier)
  };
}

function getEvolutionCost(card, upgrade = getCardUpgrade(card.id)) {
  const multiplier = getUpgradeRarityMultiplier(card);
  return {
    cards: 2 + upgrade.evolution,
    gold: Math.ceil((420 + upgrade.evolution * 360) * multiplier)
  };
}

function getUpgradeableSpareCount(cardId) {
  return Math.max(0, getOwnedCount(cardId) - Math.max(1, getReservedDeckCount(cardId)));
}

function canEnhanceCard(cardId) {
  const card = getCard(cardId);
  if (!card) return false;
  const upgrade = getCardUpgrade(cardId);
  if (upgrade.level >= CARD_MAX_ENHANCE_LEVEL) return false;
  const cost = getEnhanceCost(card, upgrade);
  return state.gold >= cost.gold && getUpgradeableSpareCount(cardId) >= cost.cards;
}

function canEvolveCard(cardId) {
  const card = getCard(cardId);
  if (!card) return false;
  const upgrade = getCardUpgrade(cardId);
  if (upgrade.level < CARD_MAX_ENHANCE_LEVEL || upgrade.evolution >= CARD_MAX_EVOLUTION) return false;
  const cost = getEvolutionCost(card, upgrade);
  return state.gold >= cost.gold && getUpgradeableSpareCount(cardId) >= cost.cards;
}

function enhanceCard(cardId) {
  const card = getCard(cardId);
  if (!card) return;
  const upgrade = getCardUpgrade(cardId);
  if (upgrade.level >= CARD_MAX_ENHANCE_LEVEL) {
    showToast("これ以上強化できません。進化を目指しましょう。");
    return;
  }
  const cost = getEnhanceCost(card, upgrade);
  if (state.gold < cost.gold || getUpgradeableSpareCount(cardId) < cost.cards) {
    showToast("強化に必要な素材かゴールドが足りません。");
    return;
  }
  consumeUpgradeCost(cardId, cost);
  state.cardUpgrades[cardId] = {
    ...upgrade,
    level: upgrade.level + 1
  };
  saveCardUpgrades();
  addDailyMissionProgress("cardUpgrade", 1);
  setFx("create", "カード強化", `${card.name} +${upgrade.level + 1}`, card.rarity || "N");
  showToast(`${card.name}を+${upgrade.level + 1}に強化しました。`);
  render();
}

function evolveCard(cardId) {
  const card = getCard(cardId);
  if (!card) return;
  const upgrade = getCardUpgrade(cardId);
  if (upgrade.level < CARD_MAX_ENHANCE_LEVEL) {
    showToast(`進化には強化+${CARD_MAX_ENHANCE_LEVEL}が必要です。`);
    return;
  }
  if (upgrade.evolution >= CARD_MAX_EVOLUTION) {
    showToast("これ以上進化できません。");
    return;
  }
  const cost = getEvolutionCost(card, upgrade);
  if (state.gold < cost.gold || getUpgradeableSpareCount(cardId) < cost.cards) {
    showToast("進化に必要な素材かゴールドが足りません。");
    return;
  }
  consumeUpgradeCost(cardId, cost);
  state.cardUpgrades[cardId] = {
    ...upgrade,
    evolution: upgrade.evolution + 1
  };
  saveCardUpgrades();
  setFx("create", "カード進化", `${card.name} 進化${upgrade.evolution + 1}`, bumpRarity(card.rarity || "N", 1));
  showToast(`${card.name}が進化${upgrade.evolution + 1}になりました。`);
  render();
}

function consumeUpgradeCost(cardId, cost) {
  state.inventory[cardId] = getOwnedCount(cardId) - cost.cards;
  if (state.inventory[cardId] <= 0) delete state.inventory[cardId];
  state.gold -= cost.gold;
  saveInventory();
  saveGold();
}

function getMarketBaseCards() {
  return [...DEFAULT_CARDS, ...SET_2_CARDS];
}

function getDailyShopListings() {
  const day = localDateKey(new Date());
  return seededShuffle(getMarketBaseCards(), `shop:${day}`)
    .slice(0, MARKET_SHOP_LISTING_COUNT)
    .map((card, index) => ({
      id: `shop-${day}-${index}-${card.id}`,
      cardId: card.id,
      price: Math.ceil(calculateMarketCardPrice(card) * 1.08)
    }));
}

function getDailyAuctionListings() {
  const day = localDateKey(new Date());
  return seededShuffle(getMarketBaseCards(), `auction:${day}`)
    .slice(0, MARKET_AUCTION_LISTING_COUNT)
    .map((card, index) => {
      const variance = 0.72 + seededRandom(`${day}:${card.id}:auction-price`) * 0.58;
      return {
        id: `auction-${day}-${index}-${card.id}`,
        cardId: card.id,
        price: Math.max(10, Math.ceil(calculateMarketCardPrice(card) * variance))
      };
    });
}

function getVisibleAuctionListings(npcListings = getDailyAuctionListings()) {
  const npc = npcListings.map((listing) => ({ ...listing, source: "npc" }));
  const user = getUserAuctionListings();
  return [...user, ...npc];
}

function getUserAuctionListings() {
  const currentUid = state.cloud.user?.uid || "";
  return Object.values(state.auctions.docs)
    .filter((auction) => auction?.kind === "user")
    .filter((auction) => getCard(auction.cardId))
    .filter((auction) => {
      const status = getAuctionStatus(auction);
      if (status === "active") return true;
      if (status === "ended") return auction.sellerUid === currentUid || auction.highestBidderUid === currentUid;
      if (status === "overdue") return auction.sellerUid === currentUid || auction.highestBidderUid === currentUid;
      if (status === "expired") return auction.sellerUid === currentUid;
      return auction.sellerUid === currentUid && !auction.sellerPaid;
    })
    .sort((a, b) => (a.endAtMs || 0) - (b.endAtMs || 0))
    .map((auction) => ({
      id: auction.id,
      cardId: auction.cardId,
      price: auction.startPrice,
      source: "user"
    }));
}

function getMyAuctionSummary() {
  const uid = state.cloud.user?.uid || "";
  if (!uid) return { selling: [], bidding: [], refunds: [], history: [] };
  const all = Object.values(state.auctions.docs)
    .filter((auction) => auction?.id && getCard(auction.cardId))
    .sort((a, b) => (b.updatedAtMs || b.createdAtMs || 0) - (a.updatedAtMs || a.createdAtMs || 0));
  const selling = all
    .filter((auction) => auction.kind === "user" && auction.sellerUid === uid)
    .filter((auction) => ["active", "ended", "overdue", "expired", "claimed"].includes(getAuctionStatus(auction)) && !auction.sellerPaid)
    .slice(0, 5);
  const bidding = all
    .filter((auction) => auction.highestBidderUid === uid)
    .filter((auction) => ["active", "ended", "overdue"].includes(getAuctionStatus(auction)))
    .slice(0, 5);
  const refunds = all
    .filter((auction) => getAuctionRefundAmount(auction, uid) > 0)
    .slice(0, 5);
  const history = all
    .filter((auction) => auction.sellerUid === uid || auction.highestBidderUid === uid || auction.claimedByUid === uid)
    .filter((auction) => ["claimed", "cancelled", "forfeited"].includes(getAuctionStatus(auction)) || auction.sellerPaid)
    .slice(0, 6);
  return { selling, bidding, refunds, history };
}

function findAuctionListing(listingId) {
  return getVisibleAuctionListings(getDailyAuctionListings()).find((entry) => entry.id === listingId)
    || getDailyAuctionListings().find((entry) => entry.id === listingId)
    || (state.auctions.docs[listingId] ? {
      id: listingId,
      cardId: state.auctions.docs[listingId].cardId,
      price: state.auctions.docs[listingId].startPrice,
      source: state.auctions.docs[listingId].kind || "user"
    } : null);
}

function ensureAuctionFeed(listings = getDailyAuctionListings()) {
  if (!cloudApi || !state.cloud.configured) {
    state.auctions.message = "オークションにはFirebase設定が必要です。";
    return;
  }
  if (!state.cloud.user) {
    unsubscribeAuctionFeed();
    state.auctions.message = "オークション入札にはGoogleログインが必要です。";
    return;
  }
  if (!cloudApi.onSnapshot || !cloudApi.runTransaction || !cloudApi.collection || !cloudApi.query || !cloudApi.where) {
    state.auctions.message = "Firebase SDKの読み込みが古い可能性があります。最新版を反映してください。";
    return;
  }

  const feedKey = listings.map((listing) => listing.id).join("|");
  if (state.auctions.feedKey === feedKey && state.auctions.unsubscribers.length) return;

  unsubscribeAuctionFeed();
  state.auctions.feedKey = feedKey;
  state.auctions.message = "";
  listings.forEach((listing) => {
    seedAuctionDoc(listing).catch((error) => {
      state.auctions.message = `オークション準備に失敗しました。${formatCloudError(error)}`;
      if (state.screen === "market") render();
    });
    const unsubscribe = cloudApi.onSnapshot(getAuctionRef(listing.id), (snapshot) => {
      if (snapshot.exists()) {
        state.auctions.docs[listing.id] = normalizeAuctionDoc(snapshot.data(), listing);
      } else {
        state.auctions.docs[listing.id] = createAuctionDoc(listing);
      }
      if (state.screen === "market") render();
    }, (error) => {
      state.auctions.message = `オークション同期に失敗しました。${formatCloudError(error)}`;
      if (state.screen === "market") render();
    });
    state.auctions.unsubscribers.push(unsubscribe);
  });
  subscribeUserAuctions();
}

function unsubscribeAuctionFeed() {
  state.auctions.unsubscribers.forEach((unsubscribe) => {
    if (typeof unsubscribe === "function") unsubscribe();
  });
  state.auctions.unsubscribers = [];
  state.auctions.feedKey = "";
  if (typeof state.auctions.userUnsubscribe === "function") {
    state.auctions.userUnsubscribe();
  }
  state.auctions.userUnsubscribe = null;
  state.auctions.userFeedReady = false;
}

function subscribeUserAuctions() {
  if (state.auctions.userFeedReady || !cloudApi?.collection || !cloudApi?.query || !cloudApi?.where) return;
  const auctionQuery = cloudApi.query(
    cloudApi.collection(cloudApi.db, "auctions"),
    cloudApi.where("kind", "==", "user")
  );
  state.auctions.userUnsubscribe = cloudApi.onSnapshot(auctionQuery, (snapshot) => {
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const normalized = normalizeAuctionDoc({ ...data, id: data.id || docSnapshot.id });
      state.auctions.docs[normalized.id] = normalized;
    });
    state.auctions.userFeedReady = true;
    if (state.screen === "market") render();
  }, (error) => {
    state.auctions.message = `ユーザー出品の同期に失敗しました。${formatCloudError(error)}`;
    if (state.screen === "market") render();
  });
  state.auctions.userFeedReady = true;
}

function getAuctionRef(listingId) {
  return cloudApi.doc(cloudApi.db, "auctions", listingId);
}

function createAuctionDoc(listing, now = Date.now()) {
  return {
    id: listing.id,
    kind: listing.source === "user" ? "user" : "npc",
    cardId: listing.cardId,
    startPrice: listing.price,
    highestBid: 0,
    highestBidderUid: "",
    highestBidderName: "",
    sellerUid: listing.sellerUid || "npc",
    sellerName: listing.sellerName || "NPC",
    sellerPaid: false,
    refunds: {},
    endAtMs: now + AUCTION_BASE_DURATION_MS,
    status: "active",
    claimedByUid: "",
    claimedAtMs: 0,
    createdAtMs: now,
    updatedAtMs: now
};
}

function normalizeAuctionDoc(data, listing) {
  const safeListing = listing || {
    id: typeof data?.id === "string" ? data.id : createUid("auction"),
    cardId: typeof data?.cardId === "string" ? data.cardId : "",
    price: Math.max(1, clampInteger(data?.startPrice, 1, 99999999)),
    source: data?.kind === "user" ? "user" : "npc",
    sellerUid: typeof data?.sellerUid === "string" ? data.sellerUid : "npc",
    sellerName: typeof data?.sellerName === "string" ? data.sellerName : "NPC"
  };
  const fallback = createAuctionDoc(safeListing);
  const kind = data?.kind === "user" ? "user" : "npc";
  return {
    ...fallback,
    ...data,
    id: typeof data?.id === "string" ? data.id : fallback.id,
    kind,
    cardId: typeof data?.cardId === "string" ? data.cardId : fallback.cardId,
    startPrice: Math.max(1, clampInteger(data?.startPrice ?? fallback.startPrice, 1, 99999999)),
    highestBid: Math.max(0, clampInteger(data?.highestBid, 0, 99999999)),
    highestBidderUid: typeof data?.highestBidderUid === "string" ? data.highestBidderUid : "",
    highestBidderName: typeof data?.highestBidderName === "string" ? data.highestBidderName : "",
    sellerUid: typeof data?.sellerUid === "string" ? data.sellerUid : fallback.sellerUid,
    sellerName: typeof data?.sellerName === "string" ? data.sellerName : fallback.sellerName,
    sellerPaid: Boolean(data?.sellerPaid),
    refunds: normalizeAuctionRefunds(data?.refunds),
    endAtMs: Math.max(0, clampInteger(data?.endAtMs ?? fallback.endAtMs, 0, 9999999999999)),
    status: ["active", "claimed", "cancelled", "forfeited"].includes(data?.status) ? data.status : "active",
    claimedByUid: typeof data?.claimedByUid === "string" ? data.claimedByUid : "",
    claimedAtMs: Math.max(0, clampInteger(data?.claimedAtMs, 0, 9999999999999)),
    createdAtMs: Math.max(0, clampInteger(data?.createdAtMs ?? fallback.createdAtMs, 0, 9999999999999)),
    updatedAtMs: Math.max(0, clampInteger(data?.updatedAtMs ?? fallback.updatedAtMs, 0, 9999999999999))
  };
}

async function seedAuctionDoc(listing) {
  await cloudApi.runTransaction(cloudApi.db, async (transaction) => {
    const ref = getAuctionRef(listing.id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      transaction.set(ref, {
        ...createAuctionDoc(listing),
        createdAt: cloudApi.serverTimestamp(),
        updatedAt: cloudApi.serverTimestamp()
      });
    }
  });
}

function getAuctionDoc(listing) {
  return state.auctions.docs[listing.id] || createAuctionDoc(listing);
}

function normalizeAuctionRefunds(refunds) {
  if (!refunds || typeof refunds !== "object" || Array.isArray(refunds)) return {};
  return Object.fromEntries(Object.entries(refunds)
    .filter(([uid]) => typeof uid === "string" && uid)
    .map(([uid, amount]) => [uid, Math.max(0, clampInteger(amount, 0, 99999999))])
    .filter(([, amount]) => amount > 0));
}

function getAuctionRefundAmount(auction, uid) {
  if (!uid) return 0;
  return Math.max(0, clampInteger(auction?.refunds?.[uid] || 0, 0, 99999999));
}

function getDefaultAuctionStartPrice(card) {
  return Math.max(10, Math.ceil(calculateMarketCardPrice(card) * 0.7));
}

function getSellableCount(cardId) {
  return Math.max(0, getOwnedCount(cardId) - getReservedDeckCount(cardId));
}

function getReservedDeckCount(cardId) {
  const activeCount = state.deckIds.filter((id) => id === cardId).length;
  const deckCounts = state.decks.map((deck) => sanitizeDeck(deck.deckIds).filter((id) => id === cardId).length);
  return Math.max(activeCount, ...deckCounts, 0);
}

function getAuctionStatus(auction, now = Date.now()) {
  if (["claimed", "cancelled", "forfeited"].includes(auction.status)) return auction.status;
  if (auction.highestBidderUid && now >= auction.endAtMs + AUCTION_CLAIM_GRACE_MS) return "overdue";
  if (now >= auction.endAtMs) return auction.highestBidderUid ? "ended" : "expired";
  return "active";
}

function getMinimumAuctionBid(auction) {
  return (auction.highestBid || 0) > 0
    ? auction.highestBid + AUCTION_MIN_BID_INCREMENT
    : auction.startPrice;
}

function auctionStatusText(auction, status = getAuctionStatus(auction)) {
  if (status === "active") return "入札受付中";
  if (status === "ended") return "終了・落札待ち";
  if (status === "overdue") return "受け取り期限切れ";
  if (status === "claimed") return "受け取り済み";
  if (status === "cancelled") return "取り消し済み";
  if (status === "forfeited") return "落札不成立";
  return "入札なし終了";
}

function formatAuctionRemaining(endAtMs) {
  const remaining = Math.max(0, endAtMs - Date.now());
  if (remaining <= 0) return "終了";
  const totalMinutes = Math.ceil(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
}

function getAuctionBidderName() {
  return getPlayerDisplayName(state.cloud.user) || "入札者";
}

async function placeAuctionBid(listingId) {
  const listing = findAuctionListing(listingId);
  if (!listing) {
    showToast("このオークションは見つかりませんでした。");
    return;
  }
  if (!cloudApi || !state.cloud.user) {
    showToast("入札にはGoogleログインが必要です。");
    state.screen = "market";
    render();
    return;
  }
  const bidAmount = clampInteger(state.auctions.bidInputs[listing.id] || 0, 0, 99999999);
  if (state.gold < bidAmount) {
    showToast(`${GOLD_NAME}が足りません。`);
    return;
  }

  state.auctions.busy = true;
  state.auctions.message = "入札を送信しています。";
  render();

  try {
    await cloudApi.runTransaction(cloudApi.db, async (transaction) => {
      const ref = getAuctionRef(listing.id);
      const snapshot = await transaction.get(ref);
      const auction = snapshot.exists()
        ? normalizeAuctionDoc(snapshot.data(), listing)
        : createAuctionDoc(listing);
      const now = Date.now();
      const status = getAuctionStatus(auction, now);
      if (status !== "active") throw new Error("このオークションは終了しています。");
      if (auction.sellerUid === state.cloud.user.uid) throw new Error("自分の出品には入札できません。");
      if (auction.highestBidderUid === state.cloud.user.uid) throw new Error("現在あなたが最高入札者です。");
      const minimumBid = getMinimumAuctionBid(auction);
      if (bidAmount < minimumBid) throw new Error(`最低入札額は${minimumBid}${GOLD_NAME}です。`);
      const refunds = { ...auction.refunds };
      if (auction.highestBidderUid && auction.highestBidderUid !== state.cloud.user.uid && auction.highestBid > 0) {
        refunds[auction.highestBidderUid] = Math.max(0, clampInteger(refunds[auction.highestBidderUid] || 0, 0, 99999999)) + auction.highestBid;
      }
      const endAtMs = auction.endAtMs - now <= AUCTION_EXTENSION_MS
        ? now + AUCTION_EXTENSION_MS
        : auction.endAtMs;
      transaction.set(ref, {
        ...auction,
        highestBid: bidAmount,
        highestBidderUid: state.cloud.user.uid,
        highestBidderName: getAuctionBidderName(),
        refunds,
        endAtMs,
        status: "active",
        updatedAtMs: now,
        updatedAt: cloudApi.serverTimestamp()
      }, { merge: true });
    });
    state.gold -= bidAmount;
    saveGold();
    state.auctions.message = `${GOLD_NAME} ${bidAmount}を預けて入札しました。`;
    showToast("入札しました。ゴールドを預かりました。");
  } catch (error) {
    state.auctions.message = error?.message || "入札に失敗しました。";
    showToast(state.auctions.message);
  } finally {
    state.auctions.busy = false;
    render();
  }
}

async function claimAuctionCard(listingId) {
  const listing = findAuctionListing(listingId);
  if (!listing || !cloudApi || !state.cloud.user) return;
  const card = getCard(listing.cardId);
  if (!card) return;

  state.auctions.busy = true;
  state.auctions.message = "落札カードを受け取っています。";
  render();

  try {
    let paidAmount = 0;
    await cloudApi.runTransaction(cloudApi.db, async (transaction) => {
      const ref = getAuctionRef(listing.id);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("このオークションは見つかりませんでした。");
      const latest = normalizeAuctionDoc(snapshot.data(), listing);
      const status = getAuctionStatus(latest);
      if (!["ended", "overdue"].includes(status)) throw new Error("まだ受け取りできません。");
      if (latest.highestBidderUid !== state.cloud.user.uid) throw new Error("あなたは最高入札者ではありません。");
      paidAmount = latest.highestBid;
      transaction.set(ref, {
        status: "claimed",
        claimedByUid: state.cloud.user.uid,
        claimedAtMs: Date.now(),
        updatedAtMs: Date.now(),
        updatedAt: cloudApi.serverTimestamp()
      }, { merge: true });
    });
    addInventory(card.id, 1);
    saveInventory();
    state.auctions.message = `${card.name}を落札しました。`;
    setFx("auction", "落札成功", card.name, card.rarity || "N");
    showToast(`${card.name}を受け取りました。預けた${GOLD_NAME} ${paidAmount}で支払い済みです。`);
  } catch (error) {
    state.auctions.message = error?.message || "受け取りに失敗しました。";
    showToast(state.auctions.message);
  } finally {
    state.auctions.busy = false;
    render();
  }
}

async function claimAuctionRefund(listingId) {
  const listing = findAuctionListing(listingId);
  if (!listing || !cloudApi || !state.cloud.user) return;

  state.auctions.busy = true;
  state.auctions.message = "返金を受け取っています。";
  render();

  try {
    let refund = 0;
    await cloudApi.runTransaction(cloudApi.db, async (transaction) => {
      const ref = getAuctionRef(listing.id);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("オークションが見つかりません。");
      const latest = normalizeAuctionDoc(snapshot.data(), listing);
      const refunds = { ...latest.refunds };
      refund = getAuctionRefundAmount(latest, state.cloud.user.uid);
      if (refund <= 0) throw new Error("受け取れる返金はありません。");
      delete refunds[state.cloud.user.uid];
      transaction.set(ref, {
        refunds,
        updatedAtMs: Date.now(),
        updatedAt: cloudApi.serverTimestamp()
      }, { merge: true });
    });
    state.gold += refund;
    saveGold();
    state.auctions.message = `${GOLD_NAME} ${refund} を返金しました。`;
    showToast(`返金 ${GOLD_NAME} ${refund} を受け取りました。`);
  } catch (error) {
    state.auctions.message = error?.message || "返金の受け取りに失敗しました。";
    showToast(state.auctions.message);
  } finally {
    state.auctions.busy = false;
    render();
  }
}

async function createUserAuctionListing(cardId) {
  const card = getCard(cardId);
  if (!card) return;
  if (!cloudApi || !state.cloud.user) {
    showToast("出品にはGoogleログインが必要です。");
    state.screen = "market";
    render();
    return;
  }
  if (getSellableCount(card.id) <= 0) {
    showToast("山札に入っていない余りカードだけ出品できます。");
    return;
  }
  const startPrice = Math.max(1, clampInteger(state.auctions.sellInputs[card.id] || getDefaultAuctionStartPrice(card), 1, 99999999));
  const id = createUid(`user-auction-${state.cloud.user.uid.slice(0, 8)}`);
  const now = Date.now();
  const listing = {
    id,
    cardId: card.id,
    price: startPrice,
    source: "user",
    sellerUid: state.cloud.user.uid,
    sellerName: getAuctionBidderName()
  };

  state.auctions.busy = true;
  state.auctions.message = "カードを出品しています。";
  render();

  try {
    await cloudApi.setDoc(getAuctionRef(id), {
      ...createAuctionDoc(listing, now),
      createdAt: cloudApi.serverTimestamp(),
      updatedAt: cloudApi.serverTimestamp()
    });
    state.inventory[card.id] = getOwnedCount(card.id) - 1;
    if (state.inventory[card.id] <= 0) delete state.inventory[card.id];
    saveInventory();
    state.auctions.sellInputs[card.id] = getDefaultAuctionStartPrice(card);
    state.auctions.message = `${card.name}をオークションに出品しました。`;
    showToast(`${card.name}を出品しました。`);
  } catch (error) {
    state.auctions.message = error?.message || "出品に失敗しました。";
    showToast(state.auctions.message);
  } finally {
    state.auctions.busy = false;
    render();
  }
}

async function forfeitAuctionListing(listingId) {
  const listing = findAuctionListing(listingId);
  if (!listing || !cloudApi || !state.cloud.user) return;
  const card = getCard(listing.cardId);
  if (!card) return;

  state.auctions.busy = true;
  state.auctions.message = "期限切れ処理をしています。";
  render();

  try {
    await cloudApi.runTransaction(cloudApi.db, async (transaction) => {
      const ref = getAuctionRef(listing.id);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("出品が見つかりません。");
      const latest = normalizeAuctionDoc(snapshot.data(), listing);
      const status = getAuctionStatus(latest);
      if (latest.kind !== "user") throw new Error("ユーザー出品だけ期限処理できます。");
      if (latest.sellerUid !== state.cloud.user.uid) throw new Error("自分の出品だけ期限処理できます。");
      if (status !== "overdue") throw new Error("まだ受け取り期限切れではありません。");
      const refunds = { ...latest.refunds };
      if (latest.highestBidderUid && latest.highestBid > 0) {
        refunds[latest.highestBidderUid] = Math.max(0, clampInteger(refunds[latest.highestBidderUid] || 0, 0, 99999999)) + latest.highestBid;
      }
      transaction.set(ref, {
        status: "forfeited",
        sellerPaid: true,
        refunds,
        forfeitedAtMs: Date.now(),
        updatedAtMs: Date.now(),
        updatedAt: cloudApi.serverTimestamp()
      }, { merge: true });
    });
    addInventory(card.id, 1);
    saveInventory();
    state.auctions.message = `${card.name}を手元に戻しました。`;
    showToast("期限切れ処理を行い、カードを戻しました。");
  } catch (error) {
    state.auctions.message = error?.message || "期限切れ処理に失敗しました。";
    showToast(state.auctions.message);
  } finally {
    state.auctions.busy = false;
    render();
  }
}

async function cancelAuctionListing(listingId) {
  const listing = findAuctionListing(listingId);
  if (!listing || !cloudApi || !state.cloud.user) return;
  const card = getCard(listing.cardId);
  if (!card) return;

  state.auctions.busy = true;
  state.auctions.message = "出品を取り消しています。";
  render();

  try {
    await cloudApi.runTransaction(cloudApi.db, async (transaction) => {
      const ref = getAuctionRef(listing.id);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("出品が見つかりません。");
      const latest = normalizeAuctionDoc(snapshot.data(), listing);
      if (latest.kind !== "user") throw new Error("この出品は取り消せません。");
      if (latest.sellerUid !== state.cloud.user.uid) throw new Error("自分の出品だけ取り消せます。");
      if (latest.highestBid > 0) throw new Error("入札が入った出品は取り消せません。");
      if (latest.status === "claimed") throw new Error("この出品はすでに完了しています。");
      transaction.set(ref, {
        status: "cancelled",
        sellerPaid: true,
        claimedByUid: state.cloud.user.uid,
        claimedAtMs: Date.now(),
        cancelledAtMs: Date.now(),
        updatedAtMs: Date.now(),
        updatedAt: cloudApi.serverTimestamp()
      }, { merge: true });
    });
    addInventory(card.id, 1);
    saveInventory();
    state.auctions.message = `${card.name}の出品を取り消しました。`;
    showToast("出品を取り消しました。");
  } catch (error) {
    state.auctions.message = error?.message || "出品の取り消しに失敗しました。";
    showToast(state.auctions.message);
  } finally {
    state.auctions.busy = false;
    render();
  }
}

async function claimAuctionPayout(listingId) {
  const listing = findAuctionListing(listingId);
  if (!listing || !cloudApi || !state.cloud.user) return;

  state.auctions.busy = true;
  state.auctions.message = "売上を受け取っています。";
  render();

  try {
    let payout = 0;
    await cloudApi.runTransaction(cloudApi.db, async (transaction) => {
      const ref = getAuctionRef(listing.id);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("出品が見つかりません。");
      const latest = normalizeAuctionDoc(snapshot.data(), listing);
      if (latest.kind !== "user") throw new Error("この出品には売上がありません。");
      if (latest.sellerUid !== state.cloud.user.uid) throw new Error("自分の出品の売上だけ受け取れます。");
      if (latest.status !== "claimed" || !latest.claimedByUid) throw new Error("まだ取引が完了していません。");
      if (latest.sellerPaid) throw new Error("売上は受け取り済みです。");
      payout = latest.highestBid;
      if (payout <= 0) throw new Error("受け取れる売上がありません。");
      transaction.set(ref, {
        sellerPaid: true,
        sellerPaidAtMs: Date.now(),
        updatedAtMs: Date.now(),
        updatedAt: cloudApi.serverTimestamp()
      }, { merge: true });
    });
    state.gold += payout;
    saveGold();
    state.auctions.message = `${GOLD_NAME} ${payout} を受け取りました。`;
    showToast(`売上 ${GOLD_NAME} ${payout} を受け取りました。`);
  } catch (error) {
    state.auctions.message = error?.message || "売上の受け取りに失敗しました。";
    showToast(state.auctions.message);
  } finally {
    state.auctions.busy = false;
    render();
  }
}

function calculateMarketCardPrice(card) {
  const rarityBase = { N: 70, R: 180, SR: 520, SSR: 1400, UR: 3600 };
  const rarity = card.rarity || "N";
  const statValue = card.type === "character"
    ? Math.ceil(((card.atk || 0) * 1.2 + (card.def || 0)) * 6)
    : 0;
  const abilityValue = (card.abilities?.length || 0) * 90 + characterEffectCostBonus(card.characterEffect) * 14;
  const spellValue = card.type === "spell" ? calculateSpellCost(card.spell?.effect, card.spell?.value || 1) * 45 : 0;
  return Math.max(40, (rarityBase[rarity] || 70) + card.cost * 35 + statValue + abilityValue + spellValue);
}

function getSellPrice(card) {
  return Math.max(15, Math.floor(calculateMarketCardPrice(card) * 0.38));
}

function getSellableCards() {
  return sortCardsByRarity(getCards())
    .map((card) => {
      const owned = getOwnedCount(card.id);
      const sellable = getSellableCount(card.id);
      return { card, sellable, price: getSellPrice(card) };
    })
    .filter((entry) => entry.sellable > 0);
}

function buyMarketListing(type, listingId) {
  const listings = type === "auction" ? getDailyAuctionListings() : getDailyShopListings();
  const listing = listings.find((entry) => entry.id === listingId);
  if (!listing) {
    showToast("この出品は見つかりませんでした。");
    return;
  }
  if (isMarketListingPurchased(type, listing.id)) {
    showToast("この出品は購入済みです。");
    return;
  }
  const card = getCard(listing.cardId);
  if (!card) return;
  if (state.gold < listing.price) {
    showToast(`${GOLD_NAME}が足りません。`);
    return;
  }
  state.gold -= listing.price;
  addInventory(card.id, 1);
  markMarketListingPurchased(type, listing.id);
  saveGold();
  saveInventory();
  setFx(type === "auction" ? "auction" : "shop", type === "auction" ? "落札成功" : "購入完了", card.name, card.rarity || "N");
  showToast(`${card.name}を1枚入手しました。${GOLD_NAME}を${listing.price}使いました。`);
  render();
}

function sellOwnedCard(cardId) {
  const card = getCard(cardId);
  if (!card) return;
  const owned = getOwnedCount(card.id);
  if (getSellableCount(card.id) <= 0) {
    showToast("デッキに必要な分は売却できません。");
    return;
  }
  const price = getSellPrice(card);
  state.inventory[card.id] = owned - 1;
  if (state.inventory[card.id] <= 0) delete state.inventory[card.id];
  state.gold += price;
  saveInventory();
  saveGold();
  showToast(`${card.name}を1枚売却し、${GOLD_NAME}を${price}入手しました。`);
  render();
}

function isMarketListingPurchased(type, listingId) {
  const purchases = getMarketPurchasesForToday();
  return purchases[type]?.includes(listingId);
}

function markMarketListingPurchased(type, listingId) {
  const day = localDateKey(new Date());
  const purchases = getMarketPurchasesForToday();
  if (!purchases[type].includes(listingId)) purchases[type].push(listingId);
  state.marketPurchases = { date: day, shop: purchases.shop, auction: purchases.auction };
  saveMarketPurchases();
}

function getMarketPurchasesForToday() {
  const day = localDateKey(new Date());
  if (state.marketPurchases?.date !== day) {
    return { date: day, shop: [], auction: [] };
  }
  return normalizeMarketPurchases(state.marketPurchases);
}

function seededShuffle(items, seedText) {
  const result = [...items];
  let seed = hashString(seedText);
  for (let i = result.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function seededRandom(seedText) {
  let seed = hashString(seedText);
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function hashString(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createQuestStage(area, stage) {
  const number = questStageToNumber(area, stage);
  return {
    id: `${area}-${stage}`,
    area,
    stage,
    number,
    enemyName: `${getQuestAreaName(area)} ${stage}`,
    enemyHp: MAX_HP + Math.floor(number * 12),
    enemyLevel: Math.floor(number * 1.4),
    rewardGold: 60 + area * 25 + stage * 12 + Math.floor(number / 5) * 10
  };
}

function getQuestStage(stageId) {
  const match = /^(\d+)-(\d+)$/.exec(stageId || "");
  if (!match) return null;
  const area = clampInteger(match[1], 1, QUEST_AREA_COUNT);
  const stage = clampInteger(match[2], 1, QUEST_STAGES_PER_AREA);
  const normalized = `${area}-${stage}`;
  if (normalized !== stageId) return null;
  return createQuestStage(area, stage);
}

function getQuestAreaName(area) {
  const names = ["芽吹きの道", "月影の森", "星読の塔", "天海の橋", "記憶の庭"];
  return names[area - 1] || `エリア${area}`;
}

function questStageToNumber(area, stage) {
  return (area - 1) * QUEST_STAGES_PER_AREA + stage;
}

function numberToQuestStage(number) {
  const max = QUEST_AREA_COUNT * QUEST_STAGES_PER_AREA;
  const safeNumber = Math.max(1, Math.min(max, number));
  const area = Math.floor((safeNumber - 1) / QUEST_STAGES_PER_AREA) + 1;
  const stage = ((safeNumber - 1) % QUEST_STAGES_PER_AREA) + 1;
  return createQuestStage(area, stage);
}

function formatQuestStageId(stage) {
  return stage?.id || "1-1";
}

function isQuestStageCleared(stageId) {
  return state.questClears.includes(stageId);
}

function isQuestStageUnlocked(stage) {
  return stage.number <= getHighestUnlockedQuestNumber();
}

function getHighestUnlockedQuestNumber() {
  const highestClear = state.questClears.reduce((max, stageId) => {
    const stage = getQuestStage(stageId);
    return stage ? Math.max(max, stage.number) : max;
  }, 0);
  return Math.min(QUEST_AREA_COUNT * QUEST_STAGES_PER_AREA, highestClear + 1);
}

function getActiveGachaSet() {
  return GACHA_SETS.find((set) => set.id === state.activeGachaSetId) || GACHA_SETS[0];
}

function getGachaSetCards(set) {
  if (!set) return [];
  const allCards = getCards();
  return set.cardIds
    .map((cardId) => allCards.find((card) => card.id === cardId))
    .filter(Boolean);
}

function getCreatorTier(tierId = state.creatorDraft.tierId) {
  return CREATOR_TIERS.find((tier) => tier.id === tierId) || CREATOR_TIERS[0];
}

function getCreatorSpellMax(effect, tier = getCreatorTier()) {
  return tier.spellMax[effect] || 1;
}

function getCharacterEffectOption(effectId) {
  return CHARACTER_EFFECT_OPTIONS.find((entry) => entry.id === effectId) || CHARACTER_EFFECT_OPTIONS[0];
}

function getCreatorCharacterEffectMax(effectId, tier = getCreatorTier()) {
  return getCharacterEffectOption(effectId).maxByTier[tier.id] || 0;
}

function buildCharacterEffect(effectId, value, tier = getCreatorTier()) {
  const option = getCharacterEffectOption(effectId);
  if (option.id === "none") return null;
  return {
    trigger: option.trigger,
    effect: option.effect,
    value: Math.max(1, clampInteger(value, 1, getCreatorCharacterEffectMax(option.id, tier)))
  };
}

function characterEffectCostBonus(characterEffect) {
  if (!characterEffect) return 0;
  const value = Math.max(1, clampInteger(characterEffect.value, 1, 999));
  if (characterEffect.effect === "draw") return value * 6;
  if (characterEffect.effect === "heal") return Math.ceil(value / 12);
  if (characterEffect.effect === "maxCost") return value * 8;
  if (characterEffect.effect === "level") return value * 5;
  if (characterEffect.effect === "damage") return value * 2;
  if (characterEffect.effect === "graveHand") return value * 8;
  if (characterEffect.effect === "absorb") return value * 12;
  return 0;
}

function characterEffectText(characterEffect) {
  if (!characterEffect) return "効果なし";
  const prefix = characterEffect.trigger === "summon" ? "召喚時" : "攻撃時";
  if (characterEffect.effect === "draw") return `${prefix}: 山札から${effectiveDrawValue(characterEffect.value)}枚ドロー`;
  if (characterEffect.effect === "heal") return `${prefix}: HPを${characterEffect.value}回復`;
  if (characterEffect.effect === "maxCost") return `${prefix}: 最大コストを${characterEffect.value}増やす`;
  if (characterEffect.effect === "level") return `${prefix}: レベルを${characterEffect.value}上げる`;
  if (characterEffect.effect === "damage") return `${prefix}: 相手プレイヤーに${characterEffect.value}追加ダメージ`;
  if (characterEffect.effect === "graveHand") return `${prefix}: 手札から${characterEffect.value}枚まで墓地へ送る`;
  if (characterEffect.effect === "absorb") return `${prefix}: 自分の攻撃力分、防御を回復`;
  return "効果なし";
}

function characterEffectShortText(characterEffect) {
  if (!characterEffect) return "";
  const prefix = characterEffect.trigger === "summon" ? "召喚" : "攻撃";
  if (characterEffect.effect === "draw") return `${prefix}: ${effectiveDrawValue(characterEffect.value)}ドロー`;
  if (characterEffect.effect === "heal") return `${prefix}: ${characterEffect.value}回復`;
  if (characterEffect.effect === "maxCost") return `${prefix}: コスト+${characterEffect.value}`;
  if (characterEffect.effect === "level") return `${prefix}: LV+${characterEffect.value}`;
  if (characterEffect.effect === "damage") return `${prefix}: ${characterEffect.value}追加`;
  if (characterEffect.effect === "graveHand") return `${prefix}: 手札${characterEffect.value}墓地`;
  if (characterEffect.effect === "absorb") return `${prefix}: 吸収`;
  return "";
}

function clampCreatorDraftToTier() {
  const draft = state.creatorDraft;
  const tier = getCreatorTier(draft.tierId);
  if (!draft.tierId) draft.tierId = tier.id;
  draft.attribute = normalizeCardAttribute(draft.attribute);
  if (draft.type === "character") {
    draft.atk = clampInteger(draft.atk, 0, tier.maxAtk);
    draft.def = clampInteger(draft.def, 0, tier.maxDef);
    const effectOption = getCharacterEffectOption(draft.characterEffect);
    draft.characterEffect = effectOption.id;
    draft.characterEffectValue = effectOption.id === "none"
      ? 1
      : Math.max(1, clampInteger(draft.characterEffectValue, 1, getCreatorCharacterEffectMax(effectOption.id, tier)));
    return;
  }
  draft.value = Math.max(1, clampInteger(draft.value, 1, getCreatorSpellMax(draft.effect, tier)));
}

function maxRarity(baseRarity, minRarity) {
  return RARITY_ORDER.indexOf(baseRarity) >= RARITY_ORDER.indexOf(minRarity) ? baseRarity : minRarity;
}

function previewDraftCard(cost, tier = getCreatorTier()) {
  const draft = state.creatorDraft;
  const rarity = calculateCreatedCardRarity(cost, tier);
  const characterEffect = buildCharacterEffect(draft.characterEffect, draft.characterEffectValue, tier);
  if (draft.type === "character") {
    return {
      id: "preview",
      type: "character",
      name: draft.name.trim() || "新しいキャラクター",
      icon: draft.icon || "札",
      attribute: normalizeCardAttribute(draft.attribute),
      cost,
      rarity,
      atk: clampInteger(draft.atk, 0, tier.maxAtk),
      def: clampInteger(draft.def, 0, tier.maxDef),
      abilities: draft.block ? ["block"] : [],
      ...(characterEffect ? { characterEffect } : {})
    };
  }
  return {
    id: "preview",
    type: "spell",
    name: draft.name.trim() || "新しい呪文",
    icon: draft.icon || "札",
    attribute: normalizeCardAttribute(draft.attribute),
    cost,
    rarity,
    spell: {
      effect: draft.effect,
      value: Math.max(1, clampInteger(draft.value, 1, getCreatorSpellMax(draft.effect, tier)))
    }
  };
}

function calculateCharacterCost(atk, def, block, characterEffect = null) {
  const blockBonus = block ? 5 : 0;
  const effectBonus = characterEffectCostBonus(characterEffect);
  return Math.max(1, Math.ceil((clampInteger(atk, 0, 999) * 1.15 + clampInteger(def, 0, 999) + blockBonus + effectBonus) / 5));
}

function calculateSpellCost(effect, value) {
  const amount = Math.max(1, clampInteger(value, 1, 999));
  if (effect === "draw") return Math.max(1, Math.ceil(amount * 1.4));
  if (effect === "maxCost") return Math.max(3, amount * 3);
  if (effect === "heal") return Math.max(1, Math.ceil(amount / 15));
  if (effect === "graveHand") return Math.max(2, amount * 2);
  return 1;
}

function effectiveDrawValue(value) {
  return Math.max(1, clampInteger(value, 1, 999) * DRAW_EFFECT_MULTIPLIER);
}

function calculateCreatedCardRarity(cost, tier = null) {
  let rarity = "N";
  if (cost >= 12) rarity = "UR";
  else if (cost >= 8) rarity = "SSR";
  else if (cost >= 5) rarity = "SR";
  else if (cost >= 3) rarity = "R";
  return tier ? maxRarity(rarity, tier.minRarity) : rarity;
}

function spellText(spell) {
  if (!spell) return "";
  if (spell.effect === "draw") return `山札から${effectiveDrawValue(spell.value)}枚ドロー`;
  if (spell.effect === "maxCost") return `最大コストを恒久的に${spell.value}増やす`;
  if (spell.effect === "heal") return `HPを${spell.value}回復`;
  if (spell.effect === "graveHand") return `手札から${spell.value}枚まで選んで墓地へ送る`;
  return "効果なし";
}

function getCardArtProfile(card) {
  const text = `${card.name}${card.icon || ""}`;
  const themes = {
    sakura: { a: "#ffe0ee", b: "#ff8fbd", c: "#ffffff" },
    moon: { a: "#e7e1ff", b: "#8fb7ff", c: "#fff7c7" },
    water: { a: "#dff6ff", b: "#80d8ff", c: "#ffffff" },
    wind: { a: "#e7ffe9", b: "#66d7a4", c: "#ffffff" },
    light: { a: "#fff8dc", b: "#ffd66f", c: "#ffffff" },
    sky: { a: "#e1f2ff", b: "#75b9ff", c: "#ffffff" },
    memory: { a: "#efe7ff", b: "#a58cff", c: "#ffffff" },
    neutral: { a: "#f4f6fb", b: "#b8c0d9", c: "#ffffff" },
    guard: { a: "#e4fbf2", b: "#56c8a5", c: "#ffffff" },
    gold: { a: "#fff2cf", b: "#f3b43f", c: "#ffffff" },
    spell: { a: "#dff6ff", b: "#a58cff", c: "#ffffff" }
  };
  const attributeTheme = themes[normalizeCardAttribute(card.attribute)] || themes.neutral;
  const set2Sheet = "./assets/card-photo-sheet-set2.png";

  const profiles = {
    "char-sprout-fairy": { ...themes.guard, kind: "fairy", features: ["wings", "sprout"], spriteIndex: 0 },
    "char-sakura-swordsman": { ...themes.sakura, kind: "swordsman", features: ["sword", "petals"], spriteIndex: 1 },
    "char-moon-fox": { ...themes.moon, kind: "fox", features: ["ears", "tail", "staff"], spriteIndex: 2 },
    "char-flower-knight": { ...themes.sakura, kind: "knight", features: ["sword", "shield", "petals"], spriteIndex: 3 },
    "char-sakura-dragon": { ...themes.gold, kind: "dragon", spriteIndex: 4 },
    "char-holy-wall": { ...themes.guard, kind: "guardian", features: ["shield", "spear"], spriteIndex: 5 },
    "char-wind-archer": { ...themes.water, kind: "archer", features: ["bow"], spriteIndex: 6 },
    "char-drop-mage": { ...themes.water, kind: "mage", features: ["staff"], spriteIndex: 7 },
    "spell-knowledge-book": { ...themes.spell, kind: "book", spriteIndex: 8 },
    "spell-star-ritual": { ...themes.moon, kind: "ritual", spriteIndex: 9 },
    "spell-mana-fountain": { ...themes.water, kind: "fountain", spriteIndex: 10 },
    "spell-life-prayer": { ...themes.sakura, kind: "prayer", spriteIndex: 11 },
    "char-crystal-lancer": { ...themes.gold, kind: "lancer", features: ["spear", "crown"], spriteIndex: 12 },
    "char-rainbow-guardian": { ...themes.guard, kind: "wing-guardian", features: ["wings", "shield", "spear"], spriteIndex: 13 },
    "char-starlight-queen": { ...themes.moon, kind: "queen", features: ["crown", "staff"], spriteIndex: 14 },
    "char-celestial-whale": { ...themes.water, kind: "whale", spriteIndex: 15 },
    "spell-grand-library": { ...themes.gold, kind: "library", spriteIndex: 16 },
    "spell-celestial-spring": { ...themes.water, kind: "fountain", spriteIndex: 17 },
    "char-mist-apprentice": { ...themes.wind, kind: "mage", features: ["staff"], spriteIndex: 0, spriteSheet: set2Sheet },
    "char-bell-recycler": { ...themes.light, kind: "mage", features: ["staff"], spriteIndex: 1, spriteSheet: set2Sheet },
    "char-azure-cleric": { ...themes.water, kind: "cleric", features: ["wings"], spriteIndex: 2, spriteSheet: set2Sheet },
    "char-twilight-alchemist": { ...themes.memory, kind: "alchemist", features: ["staff"], spriteIndex: 3, spriteSheet: set2Sheet },
    "char-comet-duelist": { ...themes.sky, kind: "duelist", features: ["sword"], spriteIndex: 4, spriteSheet: set2Sheet },
    "char-honeydew-absorber": { ...themes.water, kind: "absorber", features: ["sword"], spriteIndex: 5, spriteSheet: set2Sheet },
    "char-crimson-rose-vampire": { ...themes.moon, kind: "vampire", features: ["crown"], spriteIndex: 6, spriteSheet: set2Sheet },
    "char-lotus-oracle": { ...themes.light, kind: "oracle", features: ["staff"], spriteIndex: 7, spriteSheet: set2Sheet },
    "char-sky-archive-dragon": { ...themes.sky, kind: "dragon", spriteIndex: 8, spriteSheet: set2Sheet },
    "spell-parting-bloom": { ...themes.sakura, kind: "ritual", spriteIndex: 9, spriteSheet: set2Sheet },
    "spell-memory-river": { ...themes.memory, kind: "ritual", spriteIndex: 10, spriteSheet: set2Sheet },
    "spell-moonlit-release": { ...themes.moon, kind: "ritual", spriteIndex: 11, spriteSheet: set2Sheet },
    "spell-sunrise-hymn": { ...themes.light, kind: "ritual", spriteIndex: 12, spriteSheet: set2Sheet },
    "spell-angel-rest": { ...themes.sky, kind: "ritual", spriteIndex: 13, spriteSheet: set2Sheet },
    "spell-sage-contract": { ...themes.memory, kind: "book", spriteIndex: 14, spriteSheet: set2Sheet }
  };

  if (profiles[card.id]) return profiles[card.id];

  if (card.type === "spell") {
    if (card.spell?.effect === "draw") return { ...attributeTheme, kind: "book" };
    if (card.spell?.effect === "maxCost") return { ...attributeTheme, kind: "fountain" };
    if (card.spell?.effect === "heal") return { ...attributeTheme, kind: "prayer" };
    return { ...attributeTheme, kind: "ritual" };
  }

  if (text.includes("龍")) return { ...themes.gold, kind: "dragon" };
  if (text.includes("狐")) return { ...themes.moon, kind: "fox", features: ["ears", "tail", "staff"] };
  if (text.includes("盾") || text.includes("壁") || card.abilities?.includes("block")) return { ...themes.guard, kind: "guardian", features: ["shield", "spear"] };
  if (text.includes("弓") || text.includes("射")) return { ...attributeTheme, kind: "archer", features: ["bow"] };
  if (text.includes("姫") || text.includes("女王")) return { ...attributeTheme, kind: "queen", features: ["crown", "staff"] };
  if (text.includes("魔")) return { ...attributeTheme, kind: "mage", features: ["staff"] };
  return { ...attributeTheme, kind: "swordsman", features: ["sword"] };
}

function getEffectiveStats(unit, owner) {
  const card = getBattleCard(unit.cardId, owner);
  const multiplier = levelMultiplier(owner.level);
  const enhanceLevel = getBattleEnhanceLevel(unit);
  return {
    atk: Math.ceil((card.atk + enhanceLevel * BATTLE_ENHANCE_ATK_BONUS) * multiplier),
    def: Math.max(0, Math.ceil(unit.baseDefRemaining * multiplier))
  };
}

function getBattleEnhanceLevel(unit) {
  return clampInteger(unit?.battleEnhance || 0, 0, BATTLE_ENHANCE_MAX);
}

function getBattleEnhancedMaxDef(card, unit) {
  return Math.max(0, (card?.def || 0) + getBattleEnhanceLevel(unit) * BATTLE_ENHANCE_DEF_BONUS);
}

function levelMultiplier(level) {
  return Math.min(LEVEL_MULTIPLIER_CAP, 1 + level * LEVEL_MULTIPLIER_PER_LEVEL);
}

function formatMultiplier(value) {
  return `${value.toFixed(2)}倍`;
}

function buildDefaultDeck() {
  return Object.entries(DEFAULT_DECK_COUNTS).flatMap(([cardId, count]) => Array.from({ length: count }, () => cardId));
}

function createDeckRecord(name, deckIds = []) {
  return {
    id: createUid("deck"),
    name: String(name || "デッキ").slice(0, 24),
    deckIds: sanitizeDeck(deckIds)
  };
}

function initializeDecks() {
  const legacyDeck = sanitizeDeck(readDeck());
  state.decks = readDecks();
  if (!state.decks.length) {
    const firstDeck = legacyDeck.length ? legacyDeck : sanitizeDeck(buildDefaultDeck());
    state.decks = [createDeckRecord("デッキ1", firstDeck)];
  }
  state.activeDeckId = readActiveDeckId();
  if (!state.decks.some((deck) => deck.id === state.activeDeckId)) {
    state.activeDeckId = state.decks[0].id;
  }
  syncActiveDeckToState();
  saveDecks();
  saveActiveDeckId();
  saveDeck();
}

function getActiveDeck() {
  return state.decks.find((deck) => deck.id === state.activeDeckId) || state.decks[0] || null;
}

function syncActiveDeckToState() {
  const activeDeck = getActiveDeck();
  state.deckIds = activeDeck ? sanitizeDeck(activeDeck.deckIds) : [];
}

function syncStateToActiveDeck() {
  const activeDeck = getActiveDeck();
  if (!activeDeck) return;
  activeDeck.deckIds = sanitizeDeck(state.deckIds);
}

function selectDeck(deckId) {
  const deck = state.decks.find((entry) => entry.id === deckId);
  if (!deck) return;
  syncStateToActiveDeck();
  state.activeDeckId = deck.id;
  syncActiveDeckToState();
  saveDecks();
  saveActiveDeckId();
  localStorage.setItem(STORAGE_KEYS.deck, JSON.stringify(state.deckIds));
  render();
}

function createNewDeck() {
  syncStateToActiveDeck();
  const deckNumber = state.decks.length + 1;
  const newDeck = createDeckRecord(`デッキ${deckNumber}`, []);
  state.decks.push(newDeck);
  state.activeDeckId = newDeck.id;
  state.deckIds = [];
  saveDecks();
  saveActiveDeckId();
  saveDeck();
  render();
}

function duplicateActiveDeck() {
  const activeDeck = getActiveDeck();
  if (!activeDeck) return;
  syncStateToActiveDeck();
  const copy = createDeckRecord(`${activeDeck.name} コピー`, activeDeck.deckIds);
  state.decks.push(copy);
  state.activeDeckId = copy.id;
  syncActiveDeckToState();
  saveDecks();
  saveActiveDeckId();
  saveDeck();
  render();
}

function deleteActiveDeck() {
  if (state.decks.length <= 1) {
    showToast("最後のデッキは削除できません。");
    return;
  }
  const activeDeck = getActiveDeck();
  if (!activeDeck) return;
  if (!window.confirm(`${activeDeck.name}を削除しますか？`)) return;
  state.decks = state.decks.filter((deck) => deck.id !== activeDeck.id);
  state.activeDeckId = state.decks[0].id;
  syncActiveDeckToState();
  saveDecks();
  saveActiveDeckId();
  saveDeck();
  render();
}

function renameActiveDeck(name) {
  const activeDeck = getActiveDeck();
  if (!activeDeck) return;
  const cleaned = String(name || "").trim().slice(0, 24);
  activeDeck.name = cleaned || "デッキ";
  saveDecks();
}

function countDeckIds(deckIds) {
  return deckIds.reduce((counts, id) => {
    counts[id] = (counts[id] || 0) + 1;
    return counts;
  }, {});
}

function sanitizeDeck(deckIds) {
  if (!Array.isArray(deckIds)) return [];
  const validIds = new Set(getCards().map((card) => card.id));
  const used = {};
  const sanitized = [];
  for (const id of deckIds) {
    if (!validIds.has(id)) continue;
    const owned = getOwnedCount(id);
    const current = used[id] || 0;
    if (current >= owned) continue;
    used[id] = current + 1;
    sanitized.push(id);
    if (sanitized.length >= DECK_SIZE) break;
  }
  return sanitized;
}

async function initCloudSave() {
  try {
    const configModule = await import("./firebase-config.js");
    const firebaseConfig = configModule.firebaseConfig || window.LEVEL_LINK_FIREBASE_CONFIG;
    if (!isFirebaseConfigReady(firebaseConfig)) {
      state.cloud.status = "disabled";
      state.cloud.configured = false;
      state.cloud.message = "Firebase設定が未入力です。firebase-config.jsを設定するとGoogleログインが使えます。";
      render();
      return;
    }

    const [
      appModule,
      authModule,
      firestoreModule
    ] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`)
    ]);

    const firebaseApp = appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(firebaseApp);
    const db = firestoreModule.initializeFirestore(firebaseApp, {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false
    });
    const provider = new authModule.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    cloudApi = {
      auth,
      db,
      provider,
      collection: firestoreModule.collection,
      doc: firestoreModule.doc,
      getDoc: firestoreModule.getDoc,
      getDocFromServer: firestoreModule.getDocFromServer,
      enableNetwork: firestoreModule.enableNetwork,
      onSnapshot: firestoreModule.onSnapshot,
      query: firestoreModule.query,
      runTransaction: firestoreModule.runTransaction,
      setDoc: firestoreModule.setDoc,
      serverTimestamp: firestoreModule.serverTimestamp,
      where: firestoreModule.where,
      signInWithPopup: authModule.signInWithPopup,
      signInWithRedirect: authModule.signInWithRedirect,
      signOut: authModule.signOut
    };

    state.cloud.configured = true;
    state.cloud.status = "signedOut";
    state.cloud.message = "Googleでログインするとクラウド保存を開始できます。";
    render();

    authModule.onAuthStateChanged(auth, (user) => {
      handleCloudAuthState(user);
    });
  } catch (error) {
    state.cloud.status = "error";
    state.cloud.message = `Firebaseの読み込みに失敗しました。ネット接続か設定を確認してください。${error?.message ? ` ${error.message}` : ""}`;
    render();
  }
}

function isFirebaseConfigReady(config) {
  return Boolean(
    config &&
    typeof config === "object" &&
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.appId
  );
}

async function handleCloudAuthState(user) {
  if (!user) {
    leaveOnlineRoomSilently();
    unsubscribeAuctionFeed();
    state.auctions.docs = {};
    state.auctions.userFeedReady = false;
    state.auctions.message = "";
    state.online.roomId = "";
    state.online.playerIndex = null;
    state.online.room = null;
    state.cloud.user = null;
    state.cloud.remoteData = null;
    state.cloud.needsChoice = false;
    state.cloud.status = state.cloud.configured ? "signedOut" : "disabled";
    state.cloud.message = state.cloud.configured
      ? "Googleでログインするとクラウド保存を開始できます。"
      : "Firebase設定が未入力です。";
    render();
    return;
  }

  state.cloud.user = {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || ""
  };
  state.cloud.status = "syncing";
  state.cloud.message = "クラウドデータを確認しています。";
  render();

  try {
    const snapshot = await fetchCloudSaveSnapshot();
    if (snapshot.exists()) {
      const remoteData = sanitizeCloudSaveData(snapshot.data());
      if (remoteData && state.cloud.enabled) {
        applyCloudSaveData(remoteData);
        state.cloud.needsChoice = false;
        state.cloud.remoteData = null;
        state.cloud.status = "signedIn";
        state.cloud.message = "クラウドデータを読み込みました。以後は自動保存します。";
        state.cloud.lastSync = formatSyncTime(remoteData.savedAt);
        maybeScheduleAiTurn();
      } else if (remoteData) {
        state.cloud.needsChoice = true;
        state.cloud.remoteData = remoteData;
        state.cloud.status = "signedIn";
        state.cloud.message = "クラウドに保存データがあります。読み込むか、この端末のデータで上書きするか選んでください。";
      } else {
        await enableCloudAndUpload();
      }
    } else {
      await enableCloudAndUpload();
    }
    render();
  } catch (error) {
    state.cloud.status = "error";
    state.cloud.message = `クラウドデータの確認に失敗しました。${formatCloudError(error)}`;
    render();
  }
}

async function signInWithGoogle() {
  if (!cloudApi) {
    showToast("Firebase設定が未入力です。");
    return;
  }
  state.cloud.message = "Googleログインを開いています。";
  render();
  try {
    await cloudApi.signInWithPopup(cloudApi.auth, cloudApi.provider);
  } catch (error) {
    if (String(error?.code || "").includes("popup")) {
      await cloudApi.signInWithRedirect(cloudApi.auth, cloudApi.provider);
      return;
    }
    state.cloud.status = "error";
    state.cloud.message = `Googleログインに失敗しました。${error?.message || ""}`;
    render();
  }
}

async function signOutCloud() {
  if (!cloudApi) return;
  saveCloudEnabled(false);
  state.cloud.enabled = false;
  await cloudApi.signOut(cloudApi.auth);
  showToast("クラウド保存からログアウトしました。");
}

async function loadCloudSaveChoice() {
  if (!state.cloud.remoteData) return;
  applyCloudSaveData(state.cloud.remoteData);
  state.cloud.enabled = true;
  saveCloudEnabled(true);
  state.cloud.needsChoice = false;
  state.cloud.remoteData = null;
  state.cloud.status = "signedIn";
  state.cloud.message = "クラウドデータを読み込みました。以後は自動保存します。";
  state.cloud.lastSync = formatSyncTime(collectCloudSaveData().savedAt);
  showToast("クラウドデータを読み込みました。");
  render();
  maybeScheduleAiTurn();
}

async function uploadLocalSaveChoice() {
  await enableCloudAndUpload();
  showToast("この端末のデータをクラウドに保存しました。");
}

async function forceLoadCloudSave() {
  if (!cloudApi || !state.cloud.user) return;
  state.cloud.status = "syncing";
  state.cloud.message = "クラウドから最新データを読み込んでいます。";
  render();
  try {
    const snapshot = await fetchCloudSaveSnapshot();
    if (!snapshot.exists()) {
      state.cloud.status = "signedIn";
      state.cloud.message = "クラウドに保存データがまだありません。正しい端末でクラウドへ保存してください。";
      render();
      return;
    }
    const remoteData = sanitizeCloudSaveData(snapshot.data());
    if (!remoteData) {
      state.cloud.status = "error";
      state.cloud.message = "クラウドデータを読み込めませんでした。保存データの形式を確認してください。";
      render();
      return;
    }
    applyCloudSaveData(remoteData);
    state.cloud.enabled = true;
    saveCloudEnabled(true);
    state.cloud.needsChoice = false;
    state.cloud.remoteData = null;
    state.cloud.status = "signedIn";
    state.cloud.message = "クラウドから最新データを読み込みました。";
    state.cloud.lastSync = formatSyncTime(remoteData.savedAt);
    showToast("クラウドから再読み込みしました。");
    render();
    maybeScheduleAiTurn();
  } catch (error) {
    state.cloud.status = "error";
    state.cloud.message = `クラウドからの読み込みに失敗しました。${formatCloudError(error)}`;
    render();
  }
}

async function forceUploadCloudSave() {
  if (!cloudApi || !state.cloud.user) return;
  state.cloud.enabled = true;
  state.cloud.needsChoice = false;
  state.cloud.remoteData = null;
  saveCloudEnabled(true);
  await saveCloudData({ force: true });
  showToast("この端末のデータをクラウドへ保存しました。");
}

async function enableCloudAndUpload() {
  state.cloud.enabled = true;
  state.cloud.needsChoice = false;
  state.cloud.remoteData = null;
  saveCloudEnabled(true);
  await saveCloudData({ force: true });
}

function getCloudSaveRef() {
  return cloudApi.doc(cloudApi.db, "users", state.cloud.user.uid, "saves", "main");
}

async function fetchCloudSaveSnapshot() {
  if (cloudApi.enableNetwork) {
    try {
      await cloudApi.enableNetwork(cloudApi.db);
    } catch {
      // The SDK may already be online; continue to the read attempt.
    }
  }
  if (cloudApi.getDocFromServer) {
    return cloudApi.getDocFromServer(getCloudSaveRef());
  }
  return cloudApi.getDoc(getCloudSaveRef());
}

function queueCloudSave() {
  if (
    state.cloud.applyingRemote ||
    !state.cloud.enabled ||
    state.cloud.needsChoice ||
    !state.cloud.user ||
    !cloudApi
  ) {
    return;
  }
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(() => {
    saveCloudData();
  }, CLOUD_SAVE_DEBOUNCE_MS);
}

async function saveCloudData({ force = false } = {}) {
  if (
    !force &&
    (!state.cloud.enabled || state.cloud.needsChoice || !state.cloud.user || !cloudApi)
  ) {
    return;
  }
  if (!state.cloud.user || !cloudApi) return;

  window.clearTimeout(cloudSaveTimer);
  const data = collectCloudSaveData();
  state.cloud.saving = true;
  try {
    if (cloudApi.enableNetwork) {
      await cloudApi.enableNetwork(cloudApi.db);
    }
    await cloudApi.setDoc(getCloudSaveRef(), {
      ...data,
      updatedAt: cloudApi.serverTimestamp()
    }, { merge: true });
    state.cloud.saving = false;
    state.cloud.status = "signedIn";
    state.cloud.lastSync = formatSyncTime(data.savedAt);
    state.cloud.message = "クラウドへ保存しました。";
    render();
  } catch (error) {
    state.cloud.saving = false;
    state.cloud.status = "error";
    state.cloud.message = `クラウド保存に失敗しました。${error?.message || ""}`;
    render();
  }
}

function collectCloudSaveData() {
  return {
    version: CLOUD_SAVE_VERSION,
    savedAt: new Date().toISOString(),
    customCards: state.customCards,
    inventory: state.inventory,
    creatorTickets: state.creatorTickets,
    gachaBalls: state.gachaBalls,
    gold: state.gold,
    playerName: state.playerName,
    dailyMissions: state.dailyMissions,
    cardUpgrades: state.cardUpgrades,
    questClears: state.questClears,
    marketPurchases: state.marketPurchases,
    lastDailyReward: state.lastDailyReward,
    tutorialSeen: state.tutorialSeen,
    gachaHistory: state.gachaHistory.slice(0, GACHA_HISTORY_LIMIT),
    decks: state.decks,
    activeDeckId: state.activeDeckId,
    deckIds: state.deckIds,
    activeGachaSetId: state.activeGachaSetId,
    aiBattle: getSerializableAiBattle()
  };
}

function sanitizeCloudSaveData(data) {
  if (!data || typeof data !== "object") return null;
  return {
    version: CLOUD_SAVE_VERSION,
    savedAt: typeof data.savedAt === "string" ? data.savedAt : "",
    customCards: Array.isArray(data.customCards)
      ? data.customCards.filter(isValidCustomCard).map(upgradeCustomCard)
      : [],
    inventory: data.inventory && typeof data.inventory === "object" && !Array.isArray(data.inventory)
      ? data.inventory
      : {},
    creatorTickets: Math.max(0, clampInteger(data.creatorTickets, 0, 9999)),
    gachaBalls: Math.max(0, clampInteger(data.gachaBalls, 0, 9999)),
    gold: Math.max(0, clampInteger(data.gold, 0, 9999999)),
    playerName: sanitizePlayerName(data.playerName),
    dailyMissions: normalizeDailyMissions(data.dailyMissions),
    cardUpgrades: normalizeCardUpgrades(data.cardUpgrades),
    questClears: normalizeQuestClears(data.questClears),
    marketPurchases: normalizeMarketPurchases(data.marketPurchases),
    lastDailyReward: typeof data.lastDailyReward === "string" ? data.lastDailyReward : "",
    tutorialSeen: Boolean(data.tutorialSeen),
    gachaHistory: Array.isArray(data.gachaHistory) ? data.gachaHistory.slice(0, GACHA_HISTORY_LIMIT) : [],
    decks: normalizeDecks(data.decks),
    activeDeckId: typeof data.activeDeckId === "string" ? data.activeDeckId : "",
    deckIds: Array.isArray(data.deckIds) ? data.deckIds : [],
    activeGachaSetId: typeof data.activeGachaSetId === "string" ? data.activeGachaSetId : DEFAULT_GACHA_SET_ID,
    aiBattle: data.aiBattle || null
  };
}

function applyCloudSaveData(data) {
  state.cloud.applyingRemote = true;
  state.customCards = data.customCards;
  state.inventory = data.inventory;
  state.creatorTickets = data.creatorTickets;
  state.gachaBalls = data.gachaBalls;
  state.gold = data.gold;
  state.playerName = data.playerName;
  state.dailyMissions = data.dailyMissions;
  state.cardUpgrades = data.cardUpgrades;
  state.questClears = data.questClears;
  state.marketPurchases = data.marketPurchases;
  state.lastDailyReward = data.lastDailyReward;
  state.tutorialSeen = data.tutorialSeen;
  state.gachaHistory = data.gachaHistory;
  state.gachaResults = [];
  state.activeGachaSetId = GACHA_SETS.some((set) => set.id === data.activeGachaSetId)
    ? data.activeGachaSetId
    : DEFAULT_GACHA_SET_ID;
  normalizeInventory();
  state.decks = normalizeDecks(data.decks);
  if (!state.decks.length) {
    state.decks = [createDeckRecord("デッキ1", sanitizeDeck(data.deckIds))];
  }
  state.activeDeckId = state.decks.some((deck) => deck.id === data.activeDeckId)
    ? data.activeDeckId
    : state.decks[0].id;
  syncActiveDeckToState();
  if (state.deckIds.length === 0) {
    state.deckIds = sanitizeDeck(buildDefaultDeck());
    syncStateToActiveDeck();
  }
  state.battle = normalizeSavedAiBattle(data.aiBattle) || null;
  persistLocalSaveData();
  state.cloud.applyingRemote = false;
}

function persistLocalSaveData() {
  localStorage.setItem(STORAGE_KEYS.customCards, JSON.stringify(state.customCards));
  localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(state.inventory));
  localStorage.setItem(STORAGE_KEYS.creatorTickets, String(state.creatorTickets));
  localStorage.setItem(STORAGE_KEYS.gachaBalls, String(state.gachaBalls));
  localStorage.setItem(STORAGE_KEYS.gold, String(state.gold));
  localStorage.setItem(STORAGE_KEYS.playerName, state.playerName);
  localStorage.setItem(STORAGE_KEYS.dailyMissions, JSON.stringify(state.dailyMissions));
  localStorage.setItem(STORAGE_KEYS.cardUpgrades, JSON.stringify(state.cardUpgrades));
  localStorage.setItem(STORAGE_KEYS.questClears, JSON.stringify(normalizeQuestClears(state.questClears)));
  localStorage.setItem(STORAGE_KEYS.marketPurchases, JSON.stringify(normalizeMarketPurchases(state.marketPurchases)));
  localStorage.setItem(STORAGE_KEYS.lastDailyReward, state.lastDailyReward);
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, state.tutorialSeen ? "1" : "0");
  localStorage.setItem(STORAGE_KEYS.gachaHistory, JSON.stringify(state.gachaHistory.slice(0, GACHA_HISTORY_LIMIT)));
  localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(state.decks));
  localStorage.setItem(STORAGE_KEYS.activeDeckId, state.activeDeckId || "");
  localStorage.setItem(STORAGE_KEYS.deck, JSON.stringify(state.deckIds));
  const aiBattle = getSerializableAiBattle();
  if (aiBattle) {
    localStorage.setItem(STORAGE_KEYS.aiBattle, JSON.stringify(aiBattle));
  } else {
    localStorage.removeItem(STORAGE_KEYS.aiBattle);
  }
}

function getSerializableAiBattle() {
  const battle = state.battle;
  if (!battle || battle.mode !== "ai" || battle.phase === "over") return null;
  const copy = JSON.parse(JSON.stringify(battle));
  copy.aiScheduled = false;
  copy.aiThinking = copy.phase === "battle" && copy.activePlayer === copy.aiPlayer;
  copy.autoScheduled = false;
  copy.autoThinking = false;
  return copy;
}

function readCloudEnabled() {
  return localStorage.getItem(STORAGE_KEYS.cloudEnabled) === "1";
}

function saveCloudEnabled(enabled) {
  localStorage.setItem(STORAGE_KEYS.cloudEnabled, enabled ? "1" : "0");
}

function readAutoBattle() {
  return localStorage.getItem(STORAGE_KEYS.autoBattle) === "1";
}

function saveAutoBattle(enabled) {
  state.autoBattle = Boolean(enabled);
  localStorage.setItem(STORAGE_KEYS.autoBattle, state.autoBattle ? "1" : "0");
}

function readPlayerName() {
  return sanitizePlayerName(localStorage.getItem(STORAGE_KEYS.playerName) || "");
}

function savePlayerName(name) {
  state.playerName = sanitizePlayerName(name);
  localStorage.setItem(STORAGE_KEYS.playerName, state.playerName);
  queueCloudSave();
  scheduleOnlineProfileUpdate();
}

function readTutorialSeen() {
  return localStorage.getItem(STORAGE_KEYS.tutorialSeen) === "1";
}

function saveTutorialSeen(seen) {
  state.tutorialSeen = Boolean(seen);
  localStorage.setItem(STORAGE_KEYS.tutorialSeen, state.tutorialSeen ? "1" : "0");
  queueCloudSave();
}

function cloudStatusLabel() {
  if (state.cloud.saving) return "保存中";
  if (state.cloud.status === "signedIn") return state.cloud.enabled ? "自動保存ON" : "ログイン中";
  if (state.cloud.status === "signedOut") return "未ログイン";
  if (state.cloud.status === "syncing") return "同期中";
  if (state.cloud.status === "disabled") return "未設定";
  if (state.cloud.status === "error") return "要確認";
  return "確認中";
}

function cloudStatusClass() {
  if (state.cloud.status === "signedIn" && state.cloud.enabled) return "mint strong";
  if (state.cloud.status === "error") return "pink strong";
  if (state.cloud.status === "disabled") return "aqua";
  return "aqua strong";
}

function formatSyncTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" });
}

function formatCloudError(error) {
  const code = error?.code || "";
  const message = error?.message || "";
  if (code === "unavailable" || message.includes("client is offline")) {
    return "Firestoreへ接続できませんでした。通信方式を調整した最新版に更新後、ページを再読み込みしてください。続く場合はFirebaseのFirestore Databaseが作成済みか確認してください。";
  }
  if (code === "permission-denied" || message.includes("Missing or insufficient permissions")) {
    return "Firestoreルールで拒否されました。FIREBASE_SETUP.md のRulesを設定してください。";
  }
  if (code === "not-found") {
    return "Firestore Databaseがまだ作成されていない可能性があります。Firebase ConsoleでFirestore Databaseを作成してください。";
  }
  return message || "Firebase設定、Firestore Database、Rulesを確認してください。";
}

function readCustomCards() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.customCards) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isValidCustomCard).map(upgradeCustomCard) : [];
  } catch {
    return [];
  }
}

function saveCustomCards() {
  localStorage.setItem(STORAGE_KEYS.customCards, JSON.stringify(state.customCards));
  queueCloudSave();
}

function readInventory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.inventory) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveInventory() {
  localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(state.inventory));
  queueCloudSave();
}

function readCardUpgrades() {
  try {
    return normalizeCardUpgrades(JSON.parse(localStorage.getItem(STORAGE_KEYS.cardUpgrades) || "{}"));
  } catch {
    return {};
  }
}

function saveCardUpgrades() {
  state.cardUpgrades = normalizeCardUpgrades(state.cardUpgrades);
  localStorage.setItem(STORAGE_KEYS.cardUpgrades, JSON.stringify(state.cardUpgrades));
  queueCloudSave();
}

function readCreatorTickets() {
  const value = Number.parseInt(localStorage.getItem(STORAGE_KEYS.creatorTickets) || "0", 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function saveCreatorTickets() {
  localStorage.setItem(STORAGE_KEYS.creatorTickets, String(state.creatorTickets));
  queueCloudSave();
}

function readGachaBalls() {
  const value = Number.parseInt(localStorage.getItem(STORAGE_KEYS.gachaBalls) || "0", 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function saveGachaBalls() {
  localStorage.setItem(STORAGE_KEYS.gachaBalls, String(state.gachaBalls));
  queueCloudSave();
}

function readGold() {
  const value = Number.parseInt(localStorage.getItem(STORAGE_KEYS.gold) || "0", 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function saveGold() {
  localStorage.setItem(STORAGE_KEYS.gold, String(state.gold));
  queueCloudSave();
}

function readQuestClears() {
  try {
    return normalizeQuestClears(JSON.parse(localStorage.getItem(STORAGE_KEYS.questClears) || "[]"));
  } catch {
    return [];
  }
}

function readDailyMissions() {
  try {
    return normalizeDailyMissions(JSON.parse(localStorage.getItem(STORAGE_KEYS.dailyMissions) || "{}"));
  } catch {
    return { date: "", progress: {}, claimed: [] };
  }
}

function saveDailyMissions() {
  state.dailyMissions = normalizeDailyMissions(state.dailyMissions);
  localStorage.setItem(STORAGE_KEYS.dailyMissions, JSON.stringify(state.dailyMissions));
  queueCloudSave();
}

function normalizeDailyMissions(value) {
  if (!value || typeof value !== "object") return { date: "", progress: {}, claimed: [] };
  const missionIds = new Set(DAILY_MISSION_DEFINITIONS.map((mission) => mission.id));
  const progress = {};
  if (value.progress && typeof value.progress === "object" && !Array.isArray(value.progress)) {
    Object.entries(value.progress).forEach(([id, amount]) => {
      if (missionIds.has(id)) progress[id] = clampInteger(amount, 0, 9999);
    });
  }
  return {
    date: typeof value.date === "string" ? value.date : "",
    progress,
    claimed: Array.isArray(value.claimed) ? [...new Set(value.claimed.filter((id) => missionIds.has(id)))] : []
  };
}

function saveQuestClears() {
  state.questClears = normalizeQuestClears(state.questClears);
  localStorage.setItem(STORAGE_KEYS.questClears, JSON.stringify(state.questClears));
  queueCloudSave();
}

function readMarketPurchases() {
  try {
    return normalizeMarketPurchases(JSON.parse(localStorage.getItem(STORAGE_KEYS.marketPurchases) || "{}"));
  } catch {
    return { date: "", shop: [], auction: [] };
  }
}

function saveMarketPurchases() {
  state.marketPurchases = normalizeMarketPurchases(state.marketPurchases);
  localStorage.setItem(STORAGE_KEYS.marketPurchases, JSON.stringify(state.marketPurchases));
  queueCloudSave();
}

function normalizeMarketPurchases(value) {
  if (!value || typeof value !== "object") return { date: "", shop: [], auction: [] };
  return {
    date: typeof value.date === "string" ? value.date : "",
    shop: Array.isArray(value.shop) ? [...new Set(value.shop.filter((id) => typeof id === "string"))] : [],
    auction: Array.isArray(value.auction) ? [...new Set(value.auction.filter((id) => typeof id === "string"))] : []
  };
}

function normalizeQuestClears(clears) {
  if (!Array.isArray(clears)) return [];
  const valid = new Set();
  clears.forEach((stageId) => {
    const stage = getQuestStage(stageId);
    if (stage) valid.add(stage.id);
  });
  return [...valid].sort((a, b) => getQuestStage(a).number - getQuestStage(b).number);
}

function readLastDailyReward() {
  return localStorage.getItem(STORAGE_KEYS.lastDailyReward) || "";
}

function saveLastDailyReward() {
  localStorage.setItem(STORAGE_KEYS.lastDailyReward, state.lastDailyReward);
  queueCloudSave();
}

function grantDailyRewardIfAvailable() {
  const today = localDateKey(new Date());
  if (state.lastDailyReward === today) return;
  state.lastDailyReward = today;
  state.gachaBalls += DAILY_GACHA_BALL_REWARD;
  saveGachaBalls();
  saveLastDailyReward();
  state.gachaResults = [];
}

function initializeDailyMissions() {
  const today = localDateKey(new Date());
  if (!state.dailyMissions || state.dailyMissions.date !== today) {
    state.dailyMissions = { date: today, progress: {}, claimed: [] };
  }
  addDailyMissionProgress("dailyLogin", 1, { silent: true });
}

function getDailyMissionProgress(missionId) {
  initializeDailyMissionDateOnly();
  return Math.max(0, clampInteger(state.dailyMissions.progress?.[missionId] || 0, 0, 9999));
}

function initializeDailyMissionDateOnly() {
  const today = localDateKey(new Date());
  if (!state.dailyMissions || state.dailyMissions.date !== today) {
    state.dailyMissions = { date: today, progress: {}, claimed: [] };
  }
}

function addDailyMissionProgress(eventName, amount = 1, options = {}) {
  initializeDailyMissionDateOnly();
  let changed = false;
  DAILY_MISSION_DEFINITIONS
    .filter((mission) => mission.event === eventName)
    .forEach((mission) => {
      const before = getDailyMissionProgress(mission.id);
      const after = Math.min(mission.target, before + Math.max(1, amount));
      if (after !== before) {
        state.dailyMissions.progress[mission.id] = after;
        changed = true;
        if (!options.silent && after >= mission.target) {
          showToast(`デイリーミッション達成: ${mission.title}`);
        }
      }
    });
  if (changed) saveDailyMissions();
}

function isDailyMissionComplete(mission) {
  return getDailyMissionProgress(mission.id) >= mission.target;
}

function isDailyMissionClaimed(missionId) {
  initializeDailyMissionDateOnly();
  return Array.isArray(state.dailyMissions.claimed) && state.dailyMissions.claimed.includes(missionId);
}

function claimDailyMission(missionId) {
  initializeDailyMissionDateOnly();
  const mission = DAILY_MISSION_DEFINITIONS.find((entry) => entry.id === missionId);
  if (!mission || !isDailyMissionComplete(mission) || isDailyMissionClaimed(mission.id)) return;
  state.dailyMissions.claimed.push(mission.id);
  const reward = mission.reward || {};
  if (reward.gachaBalls) state.gachaBalls += reward.gachaBalls;
  if (reward.gold) state.gold += reward.gold;
  if (reward.creatorTickets) state.creatorTickets += reward.creatorTickets;
  saveDailyMissions();
  saveGachaBalls();
  saveGold();
  saveCreatorTickets();
  showToast(`${mission.title}の報酬を受け取りました。`);
  render();
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readGachaHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.gachaHistory) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, GACHA_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function saveGachaHistory() {
  localStorage.setItem(STORAGE_KEYS.gachaHistory, JSON.stringify(state.gachaHistory.slice(0, GACHA_HISTORY_LIMIT)));
  queueCloudSave();
}

function readDeck() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.deck) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readDecks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.decks) || "[]");
    return normalizeDecks(parsed);
  } catch {
    return [];
  }
}

function normalizeDecks(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map((deck, index) => {
      const id = typeof deck?.id === "string" && deck.id ? deck.id : createUid("deck");
      if (seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        name: typeof deck?.name === "string" && deck.name.trim() ? deck.name.trim().slice(0, 24) : `デッキ${index + 1}`,
        deckIds: sanitizeDeck(deck?.deckIds)
      };
    })
    .filter(Boolean);
}

function saveDecks() {
  localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(state.decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    deckIds: sanitizeDeck(deck.deckIds)
  }))));
  queueCloudSave();
}

function readActiveDeckId() {
  return localStorage.getItem(STORAGE_KEYS.activeDeckId) || "";
}

function saveActiveDeckId() {
  localStorage.setItem(STORAGE_KEYS.activeDeckId, state.activeDeckId || "");
  queueCloudSave();
}

function saveDeck() {
  syncStateToActiveDeck();
  saveDecks();
  saveActiveDeckId();
  localStorage.setItem(STORAGE_KEYS.deck, JSON.stringify(state.deckIds));
  queueCloudSave();
}

function resumeSavedAiBattle() {
  if (state.battle?.mode === "ai" && state.battle.phase !== "over") {
    state.screen = "battle";
    render();
    maybeScheduleAiTurn();
    maybeScheduleAutoBattle();
    return true;
  }

  const battle = readSavedAiBattle();
  if (!battle) return false;
  state.battle = battle;
  state.screen = "battle";
  state.cardDetailId = null;
  state.cardDetailHandUid = null;
  render();
  maybeScheduleAiTurn();
  maybeScheduleAutoBattle();
  showToast("保存されたAI戦を再開しました。");
  return true;
}

function readSavedAiBattle() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.aiBattle) || "null");
    const battle = normalizeSavedAiBattle(parsed);
    if (!battle) {
      clearSavedAiBattle();
      return null;
    }
    return battle;
  } catch {
    clearSavedAiBattle();
    return null;
  }
}

function syncAiBattleSave() {
  const battle = state.battle;
  if (!battle || battle.mode !== "ai") return;
  if (battle.phase === "over") {
    clearSavedAiBattle();
    return;
  }
  const copy = JSON.parse(JSON.stringify(battle));
  copy.aiScheduled = false;
  copy.aiThinking = copy.phase === "battle" && copy.activePlayer === copy.aiPlayer;
  copy.autoScheduled = false;
  copy.autoThinking = false;
  const serialized = JSON.stringify(copy);
  if (localStorage.getItem(STORAGE_KEYS.aiBattle) !== serialized) {
    localStorage.setItem(STORAGE_KEYS.aiBattle, serialized);
    queueCloudSave();
  }
}

function clearSavedAiBattle() {
  if (localStorage.getItem(STORAGE_KEYS.aiBattle) !== null) {
    localStorage.removeItem(STORAGE_KEYS.aiBattle);
    queueCloudSave();
  }
}

function normalizeSavedAiBattle(battle) {
  if (!battle || typeof battle !== "object" || battle.mode !== "ai" || battle.phase === "over") return null;
  if (!["roulette", "battle", "handoff"].includes(battle.phase)) return null;
  if (!Array.isArray(battle.players) || battle.players.length !== 2) return null;

  const players = battle.players.map((player, index) => normalizeSavedBattlePlayer(player, index === 0 ? "あなた" : "AI"));
  if (players.some((player) => !player)) return null;
  const initialDeckSize = normalizeBattleInitialDeckSize(battle.initialDeckSize, players);

  const normalized = {
    ...battle,
    mode: "ai",
    aiPlayer: 1,
    aiScheduled: false,
    aiThinking: false,
    autoScheduled: false,
    autoThinking: false,
    pendingAttackerUid: typeof battle.pendingAttackerUid === "string" ? battle.pendingAttackerUid : null,
    turnNumber: Math.max(0, clampInteger(battle.turnNumber, 0, 9999)),
    winner: null,
    rewardGranted: false,
    initialDeckSize,
    players,
    log: Array.isArray(battle.log) ? battle.log.filter((line) => typeof line === "string").slice(-80) : []
  };

  if (normalized.phase === "battle" && ![0, 1].includes(normalized.activePlayer)) return null;
  if (normalized.phase === "roulette") {
    normalized.activePlayer = Number.isInteger(normalized.firstPlayer) ? normalized.firstPlayer : null;
  }
  if (normalized.pendingAttackerUid) {
    const active = normalized.players[normalized.activePlayer];
    const exists = active?.field.some((unit) => unit.uid === normalized.pendingAttackerUid);
    if (!exists) normalized.pendingAttackerUid = null;
  }
  normalized.aiThinking = normalized.phase === "battle" && normalized.activePlayer === normalized.aiPlayer;
  return normalized;
}

function normalizeBattleInitialDeckSize(value, players) {
  const size = Number.parseInt(value, 10);
  if (Number.isFinite(size) && size > 0) return Math.min(DECK_SIZE, size);
  return Math.max(...players.map(countBattleCards));
}

function normalizeSavedBattlePlayer(player, fallbackName) {
  if (!player || typeof player !== "object") return null;
  const normalizeCardIds = (ids) => Array.isArray(ids) ? ids.filter((id) => typeof id === "string" && getCard(id)) : [];
  const normalizeHand = (hand) => Array.isArray(hand)
    ? hand
      .filter((entry) => entry && typeof entry.uid === "string" && typeof entry.cardId === "string" && getCard(entry.cardId))
      .map((entry) => ({ uid: entry.uid, cardId: entry.cardId }))
    : [];
  const normalizeField = (field) => Array.isArray(field)
    ? field
      .filter((unit) => unit && typeof unit.uid === "string" && typeof unit.cardId === "string" && getCard(unit.cardId))
      .map((unit) => ({
        uid: unit.uid,
        cardId: unit.cardId,
        baseDefRemaining: Math.max(0, Number(unit.baseDefRemaining) || 0),
        canAttack: Boolean(unit.canAttack)
      }))
    : [];
  const grave = normalizeCardIds(player.grave);
  const storedLevel = Math.max(0, clampInteger(player.level, 0, 9999));
  const minimumLevelFromGrave = grave.reduce((total, cardId) => total + (getCard(cardId)?.cost || 0), 0);

  return {
    name: typeof player.name === "string" && player.name.trim() ? player.name : fallbackName,
    hp: clampInteger(player.hp, -9999, MAX_HP),
    maxHp: Math.max(MAX_HP, clampInteger(player.maxHp, MAX_HP, 9999)),
    level: Math.max(storedLevel, minimumLevelFromGrave),
    maxCost: Math.max(0, clampInteger(player.maxCost, 0, 9999)),
    currentCost: Math.max(0, clampInteger(player.currentCost, 0, 9999)),
    ownTurns: Math.max(0, clampInteger(player.ownTurns, 0, 9999)),
    deck: normalizeCardIds(player.deck),
    hand: normalizeHand(player.hand),
    field: normalizeField(player.field),
    grave,
    cardUpgrades: normalizeCardUpgrades(player.cardUpgrades)
  };
}

function normalizeInventory() {
  const validIds = new Set(getCards().map((card) => card.id));
  const hasInventory = Object.keys(state.inventory).some((id) => validIds.has(id) && Number(state.inventory[id]) > 0);
  if (!hasInventory) {
    state.inventory = { ...DEFAULT_DECK_COUNTS };
  }

  for (const id of Object.keys(state.inventory)) {
    if (!validIds.has(id)) {
      delete state.inventory[id];
      continue;
    }
    state.inventory[id] = Math.max(0, clampInteger(state.inventory[id], 0, 9999));
  }

  for (const [id, count] of Object.entries(DEFAULT_DECK_COUNTS)) {
    if (validIds.has(id)) {
      state.inventory[id] = Math.max(state.inventory[id] || 0, count);
    }
  }

  for (const card of state.customCards) {
    if (!state.inventory[card.id]) {
      state.inventory[card.id] = 1;
    }
  }

  saveInventory();
}

function addInventory(cardId, count) {
  state.inventory[cardId] = getOwnedCount(cardId) + Math.max(1, count);
}

function getOwnedCount(cardId) {
  return Math.max(0, clampInteger(state.inventory[cardId] || 0, 0, 9999));
}

function sortCardsByRarity(cards) {
  return [...cards].sort((a, b) => {
    const rarityDiff = RARITY_ORDER.indexOf(b.rarity || "N") - RARITY_ORDER.indexOf(a.rarity || "N");
    if (rarityDiff !== 0) return rarityDiff;
    if (b.cost !== a.cost) return b.cost - a.cost;
    return a.name.localeCompare(b.name, "ja");
  });
}

function isValidCustomCard(card) {
  if (!card || typeof card !== "object") return false;
  if (typeof card.id !== "string" || typeof card.name !== "string") return false;
  if (!["character", "spell"].includes(card.type)) return false;
  if (!Number.isFinite(card.cost) || card.cost < 1) return false;
  return true;
}

function upgradeCustomCard(card) {
  return {
    ...card,
    rarity: card.rarity || calculateCreatedCardRarity(card.cost),
    attribute: normalizeCardAttribute(card.attribute)
  };
}

function shuffle(items) {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clampInteger(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function createUid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function setFx(type, title, detail = "", rarity = "") {
  state.fx = { type, title, detail, rarity };
  clearTimeout(fxTimer);
  fxTimer = setTimeout(() => {
    state.fx = null;
    render();
  }, 1150);
}

function gachaFxRarity(results) {
  const rarities = results
    .filter((result) => result.type === "card")
    .map((result) => getCard(result.cardId)?.rarity || "N");
  return rarities.sort((a, b) => RARITY_ORDER.indexOf(b) - RARITY_ORDER.indexOf(a))[0] || "SSR";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // PWA registration is optional; the game still runs without offline cache.
    });
  });
}
