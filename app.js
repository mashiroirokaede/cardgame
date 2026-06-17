"use strict";

const STORAGE_KEYS = {
  customCards: "levelLink.customCards.v2",
  deck: "levelLink.deck.v2",
  inventory: "levelLink.inventory.v1",
  creatorTickets: "levelLink.creatorTickets.v1",
  gachaHistory: "levelLink.gachaHistory.v1",
  gachaBalls: "levelLink.gachaBalls.v1",
  lastDailyReward: "levelLink.lastDailyReward.v1",
  aiBattle: "levelLink.aiBattle.v1",
  cloudEnabled: "levelLink.cloudEnabled.v1"
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

const RARITY_ORDER = ["N", "R", "SR", "SSR"];
const RARITY_LABELS = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR"
};

const RARITY_RATES = [
  { rarity: "N", weight: 62 },
  { rarity: "R", weight: 25 },
  { rarity: "SR", weight: 10 },
  { rarity: "SSR", weight: 3 }
];

const CREATOR_TIERS = [
  {
    id: "n",
    label: "N作成",
    tickets: 1,
    minRarity: "N",
    maxAtk: 8,
    maxDef: 12,
    spellMax: { draw: 2, maxCost: 1, heal: 8 },
    description: "低コストの基本カード向け"
  },
  {
    id: "r",
    label: "R作成",
    tickets: 3,
    minRarity: "R",
    maxAtk: 14,
    maxDef: 20,
    spellMax: { draw: 3, maxCost: 2, heal: 18 },
    description: "序盤から中盤で使いやすいカード向け"
  },
  {
    id: "sr",
    label: "SR作成",
    tickets: 6,
    minRarity: "SR",
    maxAtk: 22,
    maxDef: 32,
    spellMax: { draw: 5, maxCost: 3, heal: 36 },
    description: "主力になる強力なカード向け"
  },
  {
    id: "ssr",
    label: "SSR作成",
    tickets: 10,
    minRarity: "SSR",
    maxAtk: 34,
    maxDef: 48,
    spellMax: { draw: 7, maxCost: 4, heal: 60 },
    description: "切り札級のカード向け"
  }
];

const CHARACTER_EFFECT_OPTIONS = [
  {
    id: "none",
    label: "効果なし",
    trigger: "none",
    effect: "none",
    maxByTier: { n: 0, r: 0, sr: 0, ssr: 0 },
    description: "効果を持たないかわりにコストを抑えられます。"
  },
  {
    id: "summonDraw",
    label: "召喚時ドロー",
    trigger: "summon",
    effect: "draw",
    maxByTier: { n: 1, r: 1, sr: 2, ssr: 3 },
    description: "召喚した時、山札からカードを引きます。"
  },
  {
    id: "summonHeal",
    label: "召喚時HP回復",
    trigger: "summon",
    effect: "heal",
    maxByTier: { n: 4, r: 10, sr: 20, ssr: 35 },
    description: "召喚した時、自分のHPを回復します。"
  },
  {
    id: "summonMaxCost",
    label: "召喚時最大コスト増加",
    trigger: "summon",
    effect: "maxCost",
    maxByTier: { n: 1, r: 1, sr: 2, ssr: 3 },
    description: "召喚した時、最大コストを増やします。"
  },
  {
    id: "attackLevel",
    label: "攻撃時レベル上昇",
    trigger: "attack",
    effect: "level",
    maxByTier: { n: 1, r: 2, sr: 3, ssr: 5 },
    description: "攻撃した時、自分のレベルを上げます。"
  },
  {
    id: "attackDamage",
    label: "攻撃時追加ダメージ",
    trigger: "attack",
    effect: "damage",
    maxByTier: { n: 3, r: 7, sr: 12, ssr: 20 },
    description: "攻撃した時、相手プレイヤーに追加ダメージを与えます。"
  }
];

const DEFAULT_CARDS = [
  {
    id: "char-sprout-fairy",
    source: "default",
    type: "character",
    name: "芽吹きの精",
    icon: "芽",
    rarity: "N",
    cost: 1,
    atk: 2,
    def: 3,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "heal", value: 4 }
  },
  {
    id: "char-sakura-swordsman",
    source: "default",
    type: "character",
    name: "桜の剣士",
    icon: "桜",
    rarity: "R",
    cost: 4,
    atk: 8,
    def: 8,
    abilities: [],
    characterEffect: { trigger: "attack", effect: "level", value: 1 }
  },
  {
    id: "char-moon-fox",
    source: "default",
    type: "character",
    name: "月影の狐",
    icon: "月",
    rarity: "R",
    cost: 4,
    atk: 10,
    def: 6,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "draw", value: 1 }
  },
  {
    id: "char-flower-knight",
    source: "default",
    type: "character",
    name: "花守の騎士",
    icon: "花",
    rarity: "R",
    cost: 4,
    atk: 6,
    def: 12,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "heal", value: 8 }
  },
  {
    id: "char-sakura-dragon",
    source: "default",
    type: "character",
    name: "桜天龍",
    icon: "龍",
    rarity: "SSR",
    cost: 8,
    atk: 18,
    def: 18,
    abilities: [],
    characterEffect: { trigger: "attack", effect: "damage", value: 15 }
  },
  {
    id: "char-holy-wall",
    source: "default",
    type: "character",
    name: "聖壁の守護者",
    icon: "盾",
    rarity: "R",
    cost: 4,
    atk: 5,
    def: 16,
    abilities: ["block"],
    characterEffect: { trigger: "summon", effect: "heal", value: 8 }
  },
  {
    id: "char-wind-archer",
    source: "default",
    type: "character",
    name: "風鈴の射手",
    icon: "風",
    rarity: "N",
    cost: 3,
    atk: 7,
    def: 6,
    abilities: [],
    characterEffect: { trigger: "attack", effect: "damage", value: 4 }
  },
  {
    id: "char-drop-mage",
    source: "default",
    type: "character",
    name: "雫の魔導士",
    icon: "雫",
    rarity: "SR",
    cost: 5,
    atk: 9,
    def: 13,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "draw", value: 1 }
  },
  {
    id: "spell-knowledge-book",
    source: "default",
    type: "spell",
    name: "知識の書",
    icon: "書",
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
    rarity: "N",
    cost: 2,
    spell: { effect: "heal", value: 8 }
  },
  {
    id: "char-crystal-lancer",
    source: "default",
    type: "character",
    name: "水晶の槍姫",
    icon: "晶",
    rarity: "SR",
    cost: 6,
    atk: 15,
    def: 14,
    abilities: [],
    characterEffect: { trigger: "attack", effect: "level", value: 2 }
  },
  {
    id: "char-rainbow-guardian",
    source: "default",
    type: "character",
    name: "虹翼の守護者",
    icon: "虹",
    rarity: "SR",
    cost: 6,
    atk: 10,
    def: 22,
    abilities: ["block"],
    characterEffect: { trigger: "summon", effect: "maxCost", value: 1 }
  },
  {
    id: "char-starlight-queen",
    source: "default",
    type: "character",
    name: "星灯の女王",
    icon: "灯",
    rarity: "SSR",
    cost: 9,
    atk: 24,
    def: 20,
    abilities: [],
    characterEffect: { trigger: "summon", effect: "draw", value: 2 }
  },
  {
    id: "char-celestial-whale",
    source: "default",
    type: "character",
    name: "天海の大鯨",
    icon: "海",
    rarity: "SSR",
    cost: 10,
    atk: 18,
    def: 32,
    abilities: ["block"],
    characterEffect: { trigger: "summon", effect: "maxCost", value: 2 }
  },
  {
    id: "spell-grand-library",
    source: "default",
    type: "spell",
    name: "大図書館の扉",
    icon: "扉",
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
    rarity: "SR",
    cost: 6,
    spell: { effect: "maxCost", value: 2 }
  }
];

const GACHA_SETS = [
  {
    id: "set-1",
    label: "第1弾",
    name: "はじまりの桜星ガチャ",
    description: "桜、月、星海をテーマにした最初のカードパックです。",
    cardIds: DEFAULT_CARDS.map((card) => card.id)
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
  lastDailyReward: "",
  gachaHistory: [],
  gachaResults: [],
  activeGachaSetId: DEFAULT_GACHA_SET_ID,
  deckIds: [],
  battleHandSort: "draw",
  cardDetailId: null,
  cardDetailHandUid: null,
  creatorDraft: {
    type: "character",
    tierId: "n",
    name: "",
    icon: "桜",
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
  }
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer = null;
let fxTimer = null;
let cloudSaveTimer = null;
let cloudApi = null;

init();
registerServiceWorker();

function init() {
  state.customCards = readCustomCards();
  state.inventory = readInventory();
  state.creatorTickets = readCreatorTickets();
  state.gachaBalls = readGachaBalls();
  state.lastDailyReward = readLastDailyReward();
  state.gachaHistory = readGachaHistory();
  normalizeInventory();
  grantDailyRewardIfAvailable();
  state.deckIds = sanitizeDeck(readDeck());
  if (state.deckIds.length === 0) {
    state.deckIds = buildDefaultDeck();
    state.deckIds = sanitizeDeck(state.deckIds);
    saveDeck();
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
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "screen") {
    state.cardDetailId = null;
    state.cardDetailHandUid = null;
    state.screen = button.dataset.screen;
    render();
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

  if (action === "reset-deck") {
    state.deckIds = buildDefaultDeck();
    state.deckIds = sanitizeDeck(state.deckIds);
    saveDeck();
    showToast("所持カード内で標準デッキを作り直しました。");
    render();
    return;
  }

  if (action === "gacha") {
    runGacha(Number(button.dataset.count) || 1);
    return;
  }

  if (action === "select-gacha-set") {
    state.activeGachaSetId = button.dataset.setId || DEFAULT_GACHA_SET_ID;
    state.gachaResults = [];
    render();
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

  if (action === "spin-roulette") {
    spinRoulette();
    return;
  }

  if (action === "ready-next-turn") {
    readyNextTurn();
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
    state.battle = null;
    if (previousMode === "ai") clearSavedAiBattle();
    startBattle(previousMode, { forceNew: true });
  }
}

function handleInput(event) {
  const field = event.target.dataset.field;
  if (!field) return;

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
        <button class="ghost" data-action="screen" data-screen="gacha">ガチャ</button>
        <button class="ghost" data-action="screen" data-screen="deck">山札編成</button>
        <button class="ghost" data-action="screen" data-screen="creator">カード作成</button>
        <button class="ghost" data-action="screen" data-screen="cloud">クラウド保存</button>
        <button class="${battleMode ? "accent" : "ghost"}" data-action="start-battle">バトル開始</button>
        <button class="ghost" data-action="start-ai-battle">AI戦</button>
      </nav>
    </header>
  `;
}

function renderScreen() {
  if (state.screen === "gacha") return renderGacha();
  if (state.screen === "deck") return renderDeckBuilder();
  if (state.screen === "creator") return renderCardCreator();
  if (state.screen === "battle") return renderBattle();
  if (state.screen === "cloud") return renderCloudSave();
  if (state.screen === "online") return renderOnlinePlaceholder();
  return renderMenu();
}

function renderMenu() {
  return `
    <section class="menu-grid">
      ${renderMenuTile("ガチャ", "ガチャ玉を使ってカードと創造チケットを入手します。", "召", "gacha")}
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
      ${renderMenuTile("オンライン対戦", "Firebase連携用の画面枠です。第3段階で部屋ID対戦に拡張します。", "通", "online")}
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
        <div class="notice cloud-message">${escapeHtml(cloud.message || "")}</div>
        ${cloud.lastSync ? `<div class="notice">最終同期: ${escapeHtml(cloud.lastSync)}</div>` : ""}
      </div>

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
            <p>現在は${escapeHtml(activeSet.label)}です。あとから第2弾、第3弾を追加できる形にしています。</p>
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
          ${GACHA_BALL_NAME}はAI戦報酬と1日1回ボーナスで入手できます。1個で${GACHA_CARDS_PER_BALL}枚、10個で${GACHA_TEN_COST * GACHA_CARDS_PER_BALL}枚入手できます。AI戦勝利で${AI_WIN_GACHA_BALL_REWARD}個、敗北でも${AI_LOSE_GACHA_BALL_REWARD}個。${escapeHtml(activeSet.label)}のカード枠提供割合: N 62%、R 25%、SR 10%、SSR 3%。各排出枠${CREATOR_TICKET_CHANCE}%の確率でカード枠の代わりに${CREATOR_TICKET_NAME}が出ます。
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
  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>山札編成</h2>
            <p>山札は100〜300枚です。現在の山札はlocalStorageに保存されます。</p>
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
    ${effectOption.id === "none" ? `<div class="notice">効果なしの場合、コストを抑えたカードを作れます。</div>` : `
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
      </select>
    </label>
    <label>
      効果量
      <input data-field="value" type="number" min="1" max="${getCreatorSpellMax(draft.effect, tier)}" value="${Math.max(1, draft.value)}">
    </label>
  `;
}

function renderOnlinePlaceholder() {
  return `
    <section class="stack">
      <div class="band">
        <div class="section-title">
          <div>
            <h2>オンライン対戦</h2>
            <p>第3段階でFirebase Firestoreを接続するための画面枠です。</p>
          </div>
        </div>
        <div class="notice">
          予定機能：部屋作成、4〜6文字の部屋ID発行、部屋ID参加、公開状態と手札・山札の非公開データ分離、ターン同期、勝敗同期。
        </div>
      </div>
      <div class="split">
        <div class="band stack">
          <h3>部屋を作る</h3>
          <button class="primary" disabled>Firebase接続後に有効化</button>
        </div>
        <div class="band stack">
          <h3>部屋IDで参加</h3>
          <input value="" placeholder="例：A7K2" disabled>
          <button disabled>参加</button>
        </div>
      </div>
      <div class="band">
        <h3>保存予定パス</h3>
        <p class="notice">rooms/{roomId}/public/state と rooms/{roomId}/private/{playerId}/hand・deck に分離します。</p>
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
  const waitingText = battle.mode === "ai" ? "YOU / AI" : "P1 / P2";
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
  if (battle.mode === "ai") {
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
    const card = getCard(handCard.cardId);
    if (!card) return null;
    const actionsEnabled = isBattleActive() && !isAiTurn(battle) && playerIndex === battle.activePlayer;
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
  const handCard = battle.players.flatMap((player) => player.hand).find((entry) => entry.uid === uid);
  if (!handCard || !getCard(handCard.cardId)) return;
  state.cardDetailId = handCard.cardId;
  state.cardDetailHandUid = uid;
  render();
}

function getSortedHand(hand) {
  if (state.battleHandSort === "draw") return hand;
  const direction = state.battleHandSort === "costDesc" ? -1 : 1;
  return hand
    .map((handCard, index) => ({ handCard, index, card: getCard(handCard.cardId) }))
    .sort((a, b) => {
      const costDiff = ((a.card?.cost || 999) - (b.card?.cost || 999)) * direction;
      return costDiff || a.index - b.index;
    })
    .map((entry) => entry.handCard);
}

function renderBattleBoard(battle) {
  if (battle.mode === "ai") {
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

function renderAiBattleBoard(battle) {
  const human = battle.players[0];
  const ai = battle.players[1];
  const humanActive = battle.activePlayer === 0;
  return `
    <section class="battle-layout">
      ${renderScoreboard(battle)}
      <div class="band battle-actions">
        <span class="pill pink strong">${escapeHtml(battle.players[battle.activePlayer].name)}のターン</span>
        <span class="pill aqua">ターン ${battle.turnNumber}</span>
        <span class="pill mint">倍率 ${formatMultiplier(levelMultiplier(battle.players[battle.activePlayer].level))}</span>
        ${battle.pendingAttackerUid && humanActive ? `<button data-action="cancel-attack">攻撃選択を解除</button>` : ""}
        ${isAiTurn(battle) ? `<span class="pill aqua strong">AIが行動中</span>` : `<button class="accent" data-action="end-turn">ターンエンド</button>`}
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
              <h3>AIの手札</h3>
              <p>AIの手札は非公開です。枚数だけ表示します。</p>
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
      ${battle.players.map((player, index) => renderPlayerPanel(player, index === battle.activePlayer)).join("")}
    </div>
  `;
}

function renderPlayerPanel(player, active) {
  const hpRate = Math.max(0, Math.min(100, (player.hp / MAX_HP) * 100));
  return `
    <div class="player-panel ${active ? "active" : ""}">
      <div class="player-top">
        <h3>${escapeHtml(player.name)}</h3>
        <span class="pill ${active ? "pink strong" : ""}">${active ? "手番" : "待機"}</span>
      </div>
      <div class="hp-bar"><div class="hp-fill" style="width: ${hpRate}%"></div></div>
      <div class="toolbar">
        <span class="pill strong">HP ${Math.max(0, Math.ceil(player.hp))}/${MAX_HP}</span>
        <span class="pill aqua">コスト ${player.currentCost}/${player.maxCost}</span>
        <span class="pill pink">LV ${player.level}</span>
        <span class="pill mint">倍率 ${formatMultiplier(levelMultiplier(player.level))}</span>
        <span class="pill">山札 ${player.deck.length}</span>
        <span class="pill">墓地 ${player.grave.length}</span>
      </div>
    </div>
  `;
}

function renderFieldZone(battle, ownerIndex) {
  const owner = battle.players[ownerIndex];
  const isActiveOwner = ownerIndex === battle.activePlayer;
  const opponentIndex = 1 - battle.activePlayer;
  const canDirect = !isAiTurn(battle) && battle.pendingAttackerUid && ownerIndex === opponentIndex && owner.field.length === 0;
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
  const card = getCard(unit.cardId);
  const stats = getEffectiveStats(unit, owner);
  const pending = battle.pendingAttackerUid;
  const canSelect = !isAiTurn(battle) && isActiveOwner && unit.canAttack && !pending;
  const canTarget = !isAiTurn(battle) && pending && ownerIndex !== battle.activePlayer;
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
        <span class="pill">${unit.canAttack ? "攻撃可" : "待機"}</span>
      </div>
      ${canSelect ? `<button class="accent" data-action="select-attacker" data-uid="${unit.uid}">攻撃する</button>` : ""}
      ${canTarget ? `<button class="primary" data-action="attack-card" data-uid="${unit.uid}">対象にする</button>` : ""}
    </div>
  `;
}

function renderHandCard(handCard, player, actionsEnabled = true) {
  const card = getCard(handCard.cardId);
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
  return "効果";
}

function renderMiniCardHeader(card) {
  return `
    <div class="card-head">
      <div class="card-art">${escapeHtml(card.icon || "札")}</div>
      <div class="card-name">
        <strong>${escapeHtml(card.name)}</strong>
        <small>${card.type === "character" ? "キャラクター" : "呪文"} / ${escapeHtml(card.rarity || "N")}</small>
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
    return `
      <div class="card-illustration photo-art ${card.type} rarity-${rarity}${compactClass}" style="--sprite-x: ${spriteX}; --sprite-y: ${spriteY};">
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
  const pills = [
    `<span class="pill rarity-pill rarity-${rarity}">${escapeHtml(RARITY_LABELS[rarity] || rarity)}</span>`,
    `<span class="pill strong">コスト ${card.cost}</span>`
  ];
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
    pendingAttackerUid: null,
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
  render();
}

function spinRoulette() {
  const battle = state.battle;
  if (!battle) return;
  if (Number.isInteger(battle.firstPlayer)) {
    battle.phase = "battle";
    startTurn(battle, battle.firstPlayer);
    render();
    maybeScheduleAiTurn();
    return;
  }
  battle.firstPlayer = Math.random() < 0.5 ? 0 : 1;
  battle.activePlayer = battle.firstPlayer;
  battle.log.push(`${battle.players[battle.firstPlayer].name}が先攻に決まりました。`);
  setFx("battle", "先攻決定", `${battle.players[battle.firstPlayer].name}が先攻`);
  render();
}

function readyNextTurn() {
  const battle = state.battle;
  if (!battle || battle.phase !== "handoff") return;
  battle.phase = "battle";
  startTurn(battle, battle.nextActivePlayer);
  render();
  maybeScheduleAiTurn();
}

function startTurn(battle, playerIndex) {
  if (battle.phase === "over") return;
  const player = battle.players[playerIndex];
  battle.activePlayer = playerIndex;
  battle.nextActivePlayer = null;
  battle.pendingAttackerUid = null;
  battle.aiThinking = battle.mode === "ai" && playerIndex === battle.aiPlayer;
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
  battle.pendingAttackerUid = null;
  battle.nextActivePlayer = 1 - battle.activePlayer;
  battle.log.push(`${battle.players[battle.activePlayer].name}がターンエンドしました。`);
  if (battle.mode === "ai") {
    startTurn(battle, battle.nextActivePlayer);
    render();
    maybeScheduleAiTurn();
    return;
  }
  battle.phase = "handoff";
  render();
}

function playHandCard(uid) {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (isAiTurn(battle)) return;
  const player = battle.players[battle.activePlayer];
  const handIndex = player.hand.findIndex((card) => card.uid === uid);
  if (handIndex === -1) return;
  const handCard = player.hand[handIndex];
  const card = getCard(handCard.cardId);
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
      canAttack: false
    });
    battle.log.push(`${player.name}が${card.name}を召喚しました。`);
    resolveCharacterEffect(battle, player, battle.players[1 - battle.activePlayer], card, "summon");
    setFx("summon", "召喚", card.name, card.rarity || "N");
  } else {
    player.currentCost -= card.cost;
    player.hand.splice(handIndex, 1);
    player.grave.push(card.id);
    resolveSpell(battle, player, card);
    setFx("spell", "呪文発動", card.name, card.rarity || "N");
  }

  state.cardDetailId = null;
  state.cardDetailHandUid = null;
  checkBattleEnd(battle);
  render();
}

function sendHandCardToGrave(uid) {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (isAiTurn(battle)) return;
  const player = battle.players[battle.activePlayer];
  const handIndex = player.hand.findIndex((card) => card.uid === uid);
  if (handIndex === -1) return;
  const handCard = player.hand[handIndex];
  const card = getCard(handCard.cardId);
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
}

function selectAttacker(uid) {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (isAiTurn(battle)) return;
  const player = battle.players[battle.activePlayer];
  const unit = player.field.find((fieldUnit) => fieldUnit.uid === uid);
  if (!unit || !unit.canAttack) return;
  battle.pendingAttackerUid = uid;
  battle.log.push(`${player.name}が${getCard(unit.cardId).name}で攻撃対象を選んでいます。`);
  render();
}

function attackCard(targetUid) {
  const battle = state.battle;
  if (!isBattleActive() || !battle.pendingAttackerUid) return;
  if (isAiTurn(battle)) return;
  const attackerPlayer = battle.players[battle.activePlayer];
  const defenderPlayer = battle.players[1 - battle.activePlayer];
  const attacker = attackerPlayer.field.find((unit) => unit.uid === battle.pendingAttackerUid);
  if (!attacker || !attacker.canAttack) return;

  let target = defenderPlayer.field.find((unit) => unit.uid === targetUid);
  if (!target) return;

  const blocker = findBlocker(defenderPlayer, target.uid);
  if (blocker && blocker.uid !== target.uid) {
    battle.log.push(`ブロックにより攻撃対象が${getCard(blocker.cardId).name}へ変更されました。`);
    target = blocker;
  }

  const attackerCard = getCard(attacker.cardId);
  const targetCard = getCard(target.cardId);
  const atkStats = getEffectiveStats(attacker, attackerPlayer);
  const defStats = getEffectiveStats(target, defenderPlayer);

  damageUnit(target, defenderPlayer, atkStats.atk);
  damageUnit(attacker, attackerPlayer, defStats.atk);
  attacker.canAttack = false;
  battle.pendingAttackerUid = null;

  battle.log.push(`${attackerPlayer.name}の${attackerCard.name}が${targetCard.name}を攻撃しました。双方が反撃ダメージを受けました。`);
  resolveCharacterEffect(battle, attackerPlayer, defenderPlayer, attackerCard, "attack");
  destroyDefeatedUnits(battle, attackerPlayer, defenderPlayer);
  setFx("attack", "攻撃", `${attackerCard.name} → ${targetCard.name}`, attackerCard.rarity || "N");
  checkBattleEnd(battle);
  render();
}

function attackPlayer() {
  const battle = state.battle;
  if (!isBattleActive() || !battle.pendingAttackerUid) return;
  if (isAiTurn(battle)) return;
  const attackerPlayer = battle.players[battle.activePlayer];
  const defenderPlayer = battle.players[1 - battle.activePlayer];
  if (defenderPlayer.field.length > 0) {
    showToast("相手フィールドにキャラクターがいるため直接攻撃できません。");
    return;
  }
  const attacker = attackerPlayer.field.find((unit) => unit.uid === battle.pendingAttackerUid);
  if (!attacker || !attacker.canAttack) return;
  const card = getCard(attacker.cardId);
  const damage = getEffectiveStats(attacker, attackerPlayer).atk;
  defenderPlayer.hp -= damage;
  attacker.canAttack = false;
  battle.pendingAttackerUid = null;
  battle.log.push(`${attackerPlayer.name}の${card.name}が直接攻撃し、${damage}ダメージを与えました。`);
  resolveCharacterEffect(battle, attackerPlayer, defenderPlayer, card, "attack");
  setFx("attack", "直接攻撃", `${card.name} / ${damage}ダメージ`, card.rarity || "N");
  checkBattleEnd(battle);
  render();
}

function surrender() {
  const battle = state.battle;
  if (!isBattleActive()) return;
  if (battle.mode === "ai") {
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
  }
}

function resolveCharacterEffect(battle, owner, opponent, card, trigger) {
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
      const card = getCard(unit.cardId);
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

function runAiTurn() {
  const battle = state.battle;
  if (!isAiTurn(battle)) return;

  let actionCount = 0;
  while (actionCount < 12 && battle.phase !== "over") {
    const acted = tryAiUseSpell(battle) || tryAiSummon(battle) || tryAiLevelUp(battle);
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
}

function tryAiUseSpell(battle) {
  const ai = battle.players[battle.aiPlayer];
  const playable = ai.hand
    .map((handCard, index) => ({ handCard, index, card: getCard(handCard.cardId) }))
    .filter((entry) => entry.card?.type === "spell" && entry.card.cost <= ai.currentCost);

  const maxCostSpell = playable.find((entry) => entry.card.spell.effect === "maxCost");
  if (maxCostSpell) return aiPlayHandIndex(battle, maxCostSpell.index);

  const healSpell = playable.find((entry) => entry.card.spell.effect === "heal" && ai.hp <= MAX_HP - entry.card.spell.value);
  if (healSpell) return aiPlayHandIndex(battle, healSpell.index);

  const drawSpell = playable.find((entry) => entry.card.spell.effect === "draw" && ai.hand.length <= 7 && ai.deck.length >= effectiveDrawValue(entry.card.spell.value));
  if (drawSpell) return aiPlayHandIndex(battle, drawSpell.index);

  return false;
}

function tryAiSummon(battle) {
  const ai = battle.players[battle.aiPlayer];
  if (ai.field.length >= FIELD_LIMIT) return false;
  const candidates = ai.hand
    .map((handCard, index) => ({ handCard, index, card: getCard(handCard.cardId) }))
    .filter((entry) => entry.card?.type === "character" && entry.card.cost <= ai.currentCost)
    .sort((a, b) => aiCardScore(b.card) - aiCardScore(a.card));
  if (!candidates.length) return false;
  return aiPlayHandIndex(battle, candidates[0].index);
}

function tryAiLevelUp(battle) {
  const ai = battle.players[battle.aiPlayer];
  if (ai.currentCost < 1 || ai.hand.length < 4 || ai.level >= LEVEL_FOR_MULTIPLIER_CAP) return false;
  const candidates = ai.hand
    .map((handCard, index) => ({ handCard, index, card: getCard(handCard.cardId) }))
    .filter((entry) => entry.card && entry.card.cost <= ai.currentCost)
    .sort((a, b) => b.card.cost - a.card.cost);
  if (!candidates.length) return false;
  return aiSendHandIndexToGrave(battle, candidates[0].index);
}

function aiPlayHandIndex(battle, handIndex) {
  const ai = battle.players[battle.aiPlayer];
  const handCard = ai.hand[handIndex];
  const card = getCard(handCard?.cardId);
  if (!card || ai.currentCost < card.cost) return false;

  if (card.type === "character") {
    if (ai.field.length >= FIELD_LIMIT) return false;
    ai.currentCost -= card.cost;
    ai.hand.splice(handIndex, 1);
    ai.field.push({
      uid: createUid("unit"),
      cardId: card.id,
      baseDefRemaining: card.def,
      canAttack: false
    });
    battle.log.push(`AIが${card.name}を召喚しました。`);
    resolveCharacterEffect(battle, ai, battle.players[0], card, "summon");
    setFx("summon", "AI召喚", card.name, card.rarity || "N");
  } else {
    ai.currentCost -= card.cost;
    ai.hand.splice(handIndex, 1);
    ai.grave.push(card.id);
    resolveSpell(battle, ai, card);
    setFx("spell", "AI呪文", card.name, card.rarity || "N");
  }

  checkBattleEnd(battle);
  return true;
}

function aiSendHandIndexToGrave(battle, handIndex) {
  const ai = battle.players[battle.aiPlayer];
  const handCard = ai.hand[handIndex];
  const card = getCard(handCard?.cardId);
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
  const blockers = human.field.filter((unit) => getCard(unit.cardId).abilities?.includes("block"));
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
    battle.log.push(`ブロックによりAIの攻撃対象が${getCard(blocker.cardId).name}へ変更されました。`);
    actualTarget = blocker;
  }

  const attackerCard = getCard(attacker.cardId);
  const targetCard = getCard(actualTarget.cardId);
  const atkStats = getEffectiveStats(attacker, ai);
  const defStats = getEffectiveStats(actualTarget, human);
  damageUnit(actualTarget, human, atkStats.atk);
  damageUnit(attacker, ai, defStats.atk);
  attacker.canAttack = false;
  battle.log.push(`AIの${attackerCard.name}が${targetCard.name}を攻撃しました。`);
  resolveCharacterEffect(battle, ai, human, attackerCard, "attack");
  destroyDefeatedUnits(battle, ai, human);
  setFx("attack", "AI攻撃", `${attackerCard.name} → ${targetCard.name}`, attackerCard.rarity || "N");
  checkBattleEnd(battle);
}

function aiAttackPlayer(battle, attacker) {
  const ai = battle.players[battle.aiPlayer];
  const human = battle.players[0];
  if (!attacker || !attacker.canAttack) return;
  const card = getCard(attacker.cardId);
  const damage = getEffectiveStats(attacker, ai).atk;
  human.hp -= damage;
  attacker.canAttack = false;
  battle.log.push(`AIの${card.name}が直接攻撃し、${damage}ダメージを与えました。`);
  resolveCharacterEffect(battle, ai, human, card, "attack");
  setFx("attack", "AI直接攻撃", `${card.name} / ${damage}ダメージ`, card.rarity || "N");
  checkBattleEnd(battle);
}

function aiCardScore(card) {
  const blockBonus = card.abilities?.includes("block") ? 8 : 0;
  const effectBonus = characterEffectCostBonus(card.characterEffect);
  return card.cost * 4 + card.atk * 2 + card.def + blockBonus + effectBonus;
}

function isAiTurn(battle = state.battle) {
  return Boolean(battle && battle.mode === "ai" && battle.phase === "battle" && battle.activePlayer === battle.aiPlayer);
}

function findBlocker(player, targetUid) {
  const blockers = player.field.filter((unit) => getCard(unit.cardId).abilities?.includes("block"));
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
  if (!battle || battle.mode !== "ai" || battle.rewardGranted || !Number.isInteger(battle.winner)) return;
  const reward = battle.winner === 0 ? AI_WIN_GACHA_BALL_REWARD : AI_LOSE_GACHA_BALL_REWARD;
  battle.rewardGranted = true;
  state.gachaBalls += reward;
  saveGachaBalls();
  battle.log.push(`${GACHA_BALL_NAME}を${reward}個入手しました。`);
}

function isBattleActive() {
  return state.battle && state.battle.phase === "battle";
}

function createPlayer(name, deck) {
  return {
    name,
    hp: MAX_HP,
    level: 0,
    maxCost: 0,
    currentCost: 0,
    ownTurns: 0,
    deck,
    hand: [],
    field: [],
    grave: []
  };
}

function getCards() {
  return [...DEFAULT_CARDS, ...state.customCards];
}

function getCard(cardId) {
  return getCards().find((card) => card.id === cardId);
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
  if (characterEffect.effect === "heal") return Math.ceil(value / 2);
  if (characterEffect.effect === "maxCost") return value * 8;
  if (characterEffect.effect === "level") return value * 5;
  if (characterEffect.effect === "damage") return value * 2;
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
  return "";
}

function clampCreatorDraftToTier() {
  const draft = state.creatorDraft;
  const tier = getCreatorTier(draft.tierId);
  if (!draft.tierId) draft.tierId = tier.id;
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
  if (effect === "heal") return Math.max(1, Math.ceil(amount / 4));
  return 1;
}

function effectiveDrawValue(value) {
  return Math.max(1, clampInteger(value, 1, 999) * DRAW_EFFECT_MULTIPLIER);
}

function calculateCreatedCardRarity(cost, tier = null) {
  let rarity = "N";
  if (cost >= 8) rarity = "SSR";
  else if (cost >= 5) rarity = "SR";
  else if (cost >= 3) rarity = "R";
  return tier ? maxRarity(rarity, tier.minRarity) : rarity;
}

function spellText(spell) {
  if (!spell) return "";
  if (spell.effect === "draw") return `山札から${effectiveDrawValue(spell.value)}枚ドロー`;
  if (spell.effect === "maxCost") return `最大コストを恒久的に${spell.value}増やす`;
  if (spell.effect === "heal") return `HPを${spell.value}回復`;
  return "効果なし";
}

function getCardArtProfile(card) {
  const text = `${card.name}${card.icon || ""}`;
  const themes = {
    sakura: { a: "#ffe0ee", b: "#ff8fbd", c: "#ffffff" },
    moon: { a: "#e7e1ff", b: "#8fb7ff", c: "#fff7c7" },
    water: { a: "#dff6ff", b: "#80d8ff", c: "#ffffff" },
    guard: { a: "#e4fbf2", b: "#56c8a5", c: "#ffffff" },
    gold: { a: "#fff2cf", b: "#f3b43f", c: "#ffffff" },
    spell: { a: "#dff6ff", b: "#a58cff", c: "#ffffff" }
  };

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
    "spell-celestial-spring": { ...themes.water, kind: "fountain", spriteIndex: 17 }
  };

  if (profiles[card.id]) return profiles[card.id];

  if (card.type === "spell") {
    if (card.spell?.effect === "draw") return { ...themes.spell, kind: "book" };
    if (card.spell?.effect === "maxCost") return { ...themes.water, kind: "fountain" };
    if (card.spell?.effect === "heal") return { ...themes.sakura, kind: "prayer" };
    return { ...themes.spell, kind: "ritual" };
  }

  if (text.includes("龍")) return { ...themes.gold, kind: "dragon" };
  if (text.includes("狐")) return { ...themes.moon, kind: "fox", features: ["ears", "tail", "staff"] };
  if (text.includes("盾") || text.includes("壁") || card.abilities?.includes("block")) return { ...themes.guard, kind: "guardian", features: ["shield", "spear"] };
  if (text.includes("弓") || text.includes("射")) return { ...themes.water, kind: "archer", features: ["bow"] };
  if (text.includes("姫") || text.includes("女王")) return { ...themes.moon, kind: "queen", features: ["crown", "staff"] };
  if (text.includes("魔")) return { ...themes.water, kind: "mage", features: ["staff"] };
  return { ...themes.sakura, kind: "swordsman", features: ["sword"] };
}

function getEffectiveStats(unit, owner) {
  const card = getCard(unit.cardId);
  const multiplier = levelMultiplier(owner.level);
  return {
    atk: Math.ceil(card.atk * multiplier),
    def: Math.max(0, Math.ceil(unit.baseDefRemaining * multiplier))
  };
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
    const db = firestoreModule.getFirestore(firebaseApp);
    const provider = new authModule.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    cloudApi = {
      auth,
      db,
      provider,
      doc: firestoreModule.doc,
      getDoc: firestoreModule.getDoc,
      setDoc: firestoreModule.setDoc,
      serverTimestamp: firestoreModule.serverTimestamp,
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
    const snapshot = await cloudApi.getDoc(getCloudSaveRef());
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
    state.cloud.message = `クラウドデータの確認に失敗しました。Firestoreのルールや設定を確認してください。${error?.message ? ` ${error.message}` : ""}`;
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
    lastDailyReward: state.lastDailyReward,
    gachaHistory: state.gachaHistory.slice(0, GACHA_HISTORY_LIMIT),
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
    lastDailyReward: typeof data.lastDailyReward === "string" ? data.lastDailyReward : "",
    gachaHistory: Array.isArray(data.gachaHistory) ? data.gachaHistory.slice(0, GACHA_HISTORY_LIMIT) : [],
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
  state.lastDailyReward = data.lastDailyReward;
  state.gachaHistory = data.gachaHistory;
  state.gachaResults = [];
  state.activeGachaSetId = GACHA_SETS.some((set) => set.id === data.activeGachaSetId)
    ? data.activeGachaSetId
    : DEFAULT_GACHA_SET_ID;
  normalizeInventory();
  state.deckIds = sanitizeDeck(data.deckIds);
  if (state.deckIds.length === 0) state.deckIds = sanitizeDeck(buildDefaultDeck());
  state.battle = normalizeSavedAiBattle(data.aiBattle) || null;
  persistLocalSaveData();
  state.cloud.applyingRemote = false;
}

function persistLocalSaveData() {
  localStorage.setItem(STORAGE_KEYS.customCards, JSON.stringify(state.customCards));
  localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(state.inventory));
  localStorage.setItem(STORAGE_KEYS.creatorTickets, String(state.creatorTickets));
  localStorage.setItem(STORAGE_KEYS.gachaBalls, String(state.gachaBalls));
  localStorage.setItem(STORAGE_KEYS.lastDailyReward, state.lastDailyReward);
  localStorage.setItem(STORAGE_KEYS.gachaHistory, JSON.stringify(state.gachaHistory.slice(0, GACHA_HISTORY_LIMIT)));
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
  return copy;
}

function readCloudEnabled() {
  return localStorage.getItem(STORAGE_KEYS.cloudEnabled) === "1";
}

function saveCloudEnabled(enabled) {
  localStorage.setItem(STORAGE_KEYS.cloudEnabled, enabled ? "1" : "0");
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

function saveDeck() {
  localStorage.setItem(STORAGE_KEYS.deck, JSON.stringify(state.deckIds));
  queueCloudSave();
}

function resumeSavedAiBattle() {
  if (state.battle?.mode === "ai" && state.battle.phase !== "over") {
    state.screen = "battle";
    render();
    maybeScheduleAiTurn();
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

  const normalized = {
    ...battle,
    mode: "ai",
    aiPlayer: 1,
    aiScheduled: false,
    aiThinking: false,
    pendingAttackerUid: typeof battle.pendingAttackerUid === "string" ? battle.pendingAttackerUid : null,
    turnNumber: Math.max(0, clampInteger(battle.turnNumber, 0, 9999)),
    winner: null,
    rewardGranted: false,
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

  return {
    name: typeof player.name === "string" && player.name.trim() ? player.name : fallbackName,
    hp: clampInteger(player.hp, -9999, MAX_HP),
    level: Math.max(0, clampInteger(player.level, 0, 9999)),
    maxCost: Math.max(0, clampInteger(player.maxCost, 0, 9999)),
    currentCost: Math.max(0, clampInteger(player.currentCost, 0, 9999)),
    ownTurns: Math.max(0, clampInteger(player.ownTurns, 0, 9999)),
    deck: normalizeCardIds(player.deck),
    hand: normalizeHand(player.hand),
    field: normalizeField(player.field),
    grave: normalizeCardIds(player.grave)
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
  if (card.rarity) return card;
  return {
    ...card,
    rarity: calculateCreatedCardRarity(card.cost)
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
