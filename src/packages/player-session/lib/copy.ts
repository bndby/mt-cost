import type { ColumnRow } from "./session";

export const LANGUAGES = [
  { id: "cs", native: "Čeština" },
  { id: "de", native: "Deutsch" },
  { id: "en", native: "English" },
  { id: "es", native: "Español" },
  { id: "fi", native: "Suomi" },
  { id: "fr", native: "Français" },
  { id: "hu", native: "Magyar" },
  { id: "it", native: "Italiano" },
  { id: "ja", native: "日本語" },
  { id: "ko", native: "한국어" },
  { id: "nl", native: "Nederlands" },
  { id: "pl", native: "Polski" },
  { id: "pt-BR", native: "Português" },
  { id: "ro", native: "Română" },
  { id: "ru", native: "Русский" },
  { id: "sv", native: "Svenska" },
  { id: "tr", native: "Türkçe" },
  { id: "uk", native: "Українська" },
  { id: "zh-CN", native: "简体中文" },
  { id: "zh-TW", native: "繁體中文" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

const ENCYCLOPEDIA: Partial<Record<LanguageId, string>> = {
  cs: "cs",
  de: "de",
  en: "en",
  es: "es",
  fr: "fr",
  ko: "ko",
  pl: "pl",
  ru: "ru",
  tr: "tr",
  "zh-CN": "zh-cn",
  "zh-TW": "zh-tw",
};

export function isLanguageId(value: string): value is LanguageId {
  return LANGUAGES.some((item) => item.id === value);
}

export function encyclopediaLanguage(id: LanguageId): string {
  return ENCYCLOPEDIA[id] ?? "en";
}

export function languageFromDevice(tags: readonly string[]): LanguageId {
  for (const tag of tags) {
    const norm = tag.trim().toLowerCase().replace(/_/g, "-");
    if (!norm) continue;
    if (norm.startsWith("zh")) {
      if (
        norm.includes("hant") ||
        norm.includes("-tw") ||
        norm.includes("-hk") ||
        norm.includes("-mo")
      ) {
        return "zh-TW";
      }
      return "zh-CN";
    }
    if (norm.startsWith("pt")) return "pt-BR";
    if (norm.startsWith("es")) return "es";
    const primary = norm.split("-")[0];
    const hit = LANGUAGES.find((item) => item.id.toLowerCase() === primary);
    if (hit) return hit.id;
  }
  return "ru";
}

export type RowNames = Record<ColumnRow["line"], string>;

export type Copy = {
  title: string;
  subtitle: string;
  signIn: string;
  realmKicker: string;
  realmTitle: string;
  back: string;
  signOut: string;
  retry: string;
  settings: string;
  rows: RowNames;
};

const COPY: Record<LanguageId, Copy> = {
  ru: {
    title: "Оценка",
    subtitle: "Имущество танкового аккаунта.",
    signIn: "Войти",
    realmKicker: "Войти",
    realmTitle: "Выберите Реалм",
    back: "Назад",
    signOut: "Выйти",
    retry: "Повторить",
    settings: "Настройки",
    rows: {
      bonds: "Боны",
      gold: "Золото",
      silver: "Серебро",
      freeXp: "Своб. опыт",
      boosters: "Резервы",
      premiumAccount: "Прем. акк",
      premium: "Прем. танки",
      researchable: "Танки",
    },
  },
  en: {
    title: "Valuation",
    subtitle: "Tank account property.",
    signIn: "Sign in",
    realmKicker: "Sign in",
    realmTitle: "Choose a realm",
    back: "Back",
    signOut: "Sign out",
    retry: "Retry",
    settings: "Settings",
    rows: {
      bonds: "Bonds",
      gold: "Gold",
      silver: "Silver",
      freeXp: "Free XP",
      boosters: "Reserves",
      premiumAccount: "Prem. account",
      premium: "Prem. tanks",
      researchable: "Tanks",
    },
  },
  de: {
    title: "Bewertung",
    subtitle: "Besitz des Panzerkontos.",
    signIn: "Anmelden",
    realmKicker: "Anmelden",
    realmTitle: "Realm wählen",
    back: "Zurück",
    signOut: "Abmelden",
    retry: "Wiederholen",
    settings: "Einstellungen",
    rows: {
      bonds: "Anleihen",
      gold: "Gold",
      silver: "Silber",
      freeXp: "Freie EP",
      boosters: "Reserven",
      premiumAccount: "Prem.-Konto",
      premium: "Prem.-Panzer",
      researchable: "Panzer",
    },
  },
  fr: {
    title: "Estimation",
    subtitle: "Biens du compte de chars.",
    signIn: "Connexion",
    realmKicker: "Connexion",
    realmTitle: "Choisir un royaume",
    back: "Retour",
    signOut: "Déconnexion",
    retry: "Réessayer",
    settings: "Réglages",
    rows: {
      bonds: "Obligations",
      gold: "Or",
      silver: "Argent",
      freeXp: "XP libre",
      boosters: "Réserves",
      premiumAccount: "Compte prem.",
      premium: "Chars prem.",
      researchable: "Chars",
    },
  },
  pl: {
    title: "Wycena",
    subtitle: "Majątek konta czołgów.",
    signIn: "Zaloguj",
    realmKicker: "Zaloguj",
    realmTitle: "Wybierz realm",
    back: "Wstecz",
    signOut: "Wyloguj",
    retry: "Ponów",
    settings: "Ustawienia",
    rows: {
      bonds: "Bony",
      gold: "Złoto",
      silver: "Srebro",
      freeXp: "Wolne PD",
      boosters: "Rezerwy",
      premiumAccount: "Konto prem.",
      premium: "Czołgi prem.",
      researchable: "Czołgi",
    },
  },
  cs: {
    title: "Odhad",
    subtitle: "Majetek tankového účtu.",
    signIn: "Přihlásit",
    realmKicker: "Přihlásit",
    realmTitle: "Vyberte realm",
    back: "Zpět",
    signOut: "Odhlásit",
    retry: "Znovu",
    settings: "Nastavení",
    rows: {
      bonds: "Bony",
      gold: "Zlato",
      silver: "Stříbro",
      freeXp: "Volné ZK",
      boosters: "Rezervy",
      premiumAccount: "Prem. účet",
      premium: "Prem. tanky",
      researchable: "Tanky",
    },
  },
  es: {
    title: "Valoración",
    subtitle: "Bienes de la cuenta de tanques.",
    signIn: "Entrar",
    realmKicker: "Entrar",
    realmTitle: "Elige un reino",
    back: "Atrás",
    signOut: "Salir",
    retry: "Reintentar",
    settings: "Ajustes",
    rows: {
      bonds: "Bonos",
      gold: "Oro",
      silver: "Plata",
      freeXp: "EXP libre",
      boosters: "Reservas",
      premiumAccount: "Cuenta prem.",
      premium: "Tanques prem.",
      researchable: "Tanques",
    },
  },
  tr: {
    title: "Değerleme",
    subtitle: "Tank hesabının varlığı.",
    signIn: "Giriş",
    realmKicker: "Giriş",
    realmTitle: "Realm seçin",
    back: "Geri",
    signOut: "Çıkış",
    retry: "Yeniden",
    settings: "Ayarlar",
    rows: {
      bonds: "Tahvil",
      gold: "Altın",
      silver: "Gümüş",
      freeXp: "Serbest TP",
      boosters: "Yedekler",
      premiumAccount: "Prem. hesap",
      premium: "Prem. tanklar",
      researchable: "Tanklar",
    },
  },
  uk: {
    title: "Оцінка",
    subtitle: "Майно танкового акаунта.",
    signIn: "Увійти",
    realmKicker: "Увійти",
    realmTitle: "Оберіть реалм",
    back: "Назад",
    signOut: "Вийти",
    retry: "Повторити",
    settings: "Налаштування",
    rows: {
      bonds: "Бони",
      gold: "Золото",
      silver: "Срібло",
      freeXp: "Вільний досвід",
      boosters: "Резерви",
      premiumAccount: "Прем. акаунт",
      premium: "Прем. танки",
      researchable: "Танки",
    },
  },
  it: {
    title: "Valutazione",
    subtitle: "Beni dell'account carri.",
    signIn: "Accedi",
    realmKicker: "Accedi",
    realmTitle: "Scegli il reame",
    back: "Indietro",
    signOut: "Esci",
    retry: "Riprova",
    settings: "Impostazioni",
    rows: {
      bonds: "Buoni",
      gold: "Oro",
      silver: "Argento",
      freeXp: "XP libera",
      boosters: "Riserve",
      premiumAccount: "Account prem.",
      premium: "Carri prem.",
      researchable: "Carri",
    },
  },
  nl: {
    title: "Schatting",
    subtitle: "Bezit van het tankaccount.",
    signIn: "Inloggen",
    realmKicker: "Inloggen",
    realmTitle: "Kies een realm",
    back: "Terug",
    signOut: "Uitloggen",
    retry: "Opnieuw",
    settings: "Instellingen",
    rows: {
      bonds: "Obligaties",
      gold: "Goud",
      silver: "Zilver",
      freeXp: "Vrije XP",
      boosters: "Reserves",
      premiumAccount: "Prem.-account",
      premium: "Prem.-tanks",
      researchable: "Tanks",
    },
  },
  fi: {
    title: "Arvio",
    subtitle: "Tankkitilin omaisuus.",
    signIn: "Kirjaudu",
    realmKicker: "Kirjaudu",
    realmTitle: "Valitse realm",
    back: "Takaisin",
    signOut: "Kirjaudu ulos",
    retry: "Yritä uudelleen",
    settings: "Asetukset",
    rows: {
      bonds: "Bondit",
      gold: "Kulta",
      silver: "Hopea",
      freeXp: "Vapaa XP",
      boosters: "Reservit",
      premiumAccount: "Prem.-tili",
      premium: "Prem.-tankit",
      researchable: "Tankit",
    },
  },
  hu: {
    title: "Értékelés",
    subtitle: "A tankfiók vagyona.",
    signIn: "Belépés",
    realmKicker: "Belépés",
    realmTitle: "Válassz realmet",
    back: "Vissza",
    signOut: "Kilépés",
    retry: "Újra",
    settings: "Beállítások",
    rows: {
      bonds: "Kötvények",
      gold: "Arany",
      silver: "Ezüst",
      freeXp: "Szabad XP",
      boosters: "Tartalékok",
      premiumAccount: "Prem. fiók",
      premium: "Prem. tankok",
      researchable: "Tankok",
    },
  },
  ro: {
    title: "Evaluare",
    subtitle: "Bunurile contului de tancuri.",
    signIn: "Intră",
    realmKicker: "Intră",
    realmTitle: "Alege realm-ul",
    back: "Înapoi",
    signOut: "Ieși",
    retry: "Reîncearcă",
    settings: "Setări",
    rows: {
      bonds: "Bonuri",
      gold: "Aur",
      silver: "Argint",
      freeXp: "XP liber",
      boosters: "Rezerve",
      premiumAccount: "Cont prem.",
      premium: "Tancuri prem.",
      researchable: "Tancuri",
    },
  },
  sv: {
    title: "Värdering",
    subtitle: "Pansarkontots egendom.",
    signIn: "Logga in",
    realmKicker: "Logga in",
    realmTitle: "Välj en realm",
    back: "Tillbaka",
    signOut: "Logga ut",
    retry: "Försök igen",
    settings: "Inställningar",
    rows: {
      bonds: "Obligationer",
      gold: "Guld",
      silver: "Silver",
      freeXp: "Fri XP",
      boosters: "Reserver",
      premiumAccount: "Prem.-konto",
      premium: "Prem.-vagnar",
      researchable: "Stridsvagnar",
    },
  },
  "pt-BR": {
    title: "Avaliação",
    subtitle: "Bens da conta de tanques.",
    signIn: "Entrar",
    realmKicker: "Entrar",
    realmTitle: "Escolha o reino",
    back: "Voltar",
    signOut: "Sair",
    retry: "Tentar de novo",
    settings: "Ajustes",
    rows: {
      bonds: "Bônus",
      gold: "Ouro",
      silver: "Prata",
      freeXp: "XP livre",
      boosters: "Reservas",
      premiumAccount: "Conta prem.",
      premium: "Tanques prem.",
      researchable: "Tanques",
    },
  },
  ja: {
    title: "評価",
    subtitle: "戦車アカウントの財産。",
    signIn: "ログイン",
    realmKicker: "ログイン",
    realmTitle: "レルムを選択",
    back: "戻る",
    signOut: "ログアウト",
    retry: "再試行",
    settings: "設定",
    rows: {
      bonds: "債券",
      gold: "ゴールド",
      silver: "シルバー",
      freeXp: "フリーXP",
      boosters: "リザーブ",
      premiumAccount: "プレミア口座",
      premium: "プレミア戦車",
      researchable: "戦車",
    },
  },
  ko: {
    title: "평가",
    subtitle: "전차 계정의 재산.",
    signIn: "로그인",
    realmKicker: "로그인",
    realmTitle: "렐름 선택",
    back: "뒤로",
    signOut: "로그아웃",
    retry: "다시 시도",
    settings: "설정",
    rows: {
      bonds: "채권",
      gold: "골드",
      silver: "실버",
      freeXp: "자유 경험치",
      boosters: "예비",
      premiumAccount: "프리미엄 계정",
      premium: "프리미엄 전차",
      researchable: "전차",
    },
  },
  "zh-CN": {
    title: "估价",
    subtitle: "坦克账号的财产。",
    signIn: "登录",
    realmKicker: "登录",
    realmTitle: "选择区服",
    back: "返回",
    signOut: "退出",
    retry: "重试",
    settings: "设置",
    rows: {
      bonds: "债券",
      gold: "金币",
      silver: "银币",
      freeXp: "自由经验",
      boosters: "预备",
      premiumAccount: "高级账号",
      premium: "高级坦克",
      researchable: "坦克",
    },
  },
  "zh-TW": {
    title: "估價",
    subtitle: "戰車帳號的財產。",
    signIn: "登入",
    realmKicker: "登入",
    realmTitle: "選擇區服",
    back: "返回",
    signOut: "登出",
    retry: "重試",
    settings: "設定",
    rows: {
      bonds: "債券",
      gold: "金幣",
      silver: "銀幣",
      freeXp: "自由經驗",
      boosters: "預備",
      premiumAccount: "高級帳號",
      premium: "高級戰車",
      researchable: "戰車",
    },
  },
};

export function copy(id: LanguageId): Copy {
  return COPY[id];
}
