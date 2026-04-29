import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Menu, X, LogIn, ChevronRight, Play, UtensilsCrossed, Calendar, Sparkles, User, LogOut, Search, Globe, Moon, Sun, Instagram, Twitter, MapPin, Apple, Wine } from 'lucide-react';
import { cn } from './lib/utils';
import { MENU_ITEMS, MenuItem, GALLERY_IMAGES, GALLERY_CATEGORIES } from './constants';
import { getSensoryRecommendation, generateDiscoveryImage, getMenuItemArt } from './services/geminiService';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider 
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Types ---
type View = 'landing' | 'menu' | 'reservation' | 'ai-discovery' | 'auth' | 'about' | 'events' | 'gallery' | 'contact' | 'feedback' | 'feedback-stats';
type Language = 'en' | 'fr' | 'jp';
type Theme = 'dark' | 'light';

const TRANSLATIONS = {
  en: {
    nav: { 
      home: "HOME",
      about: "ABOUT US",
      restaurant: "RESTAURANT",
      events: "EVENTS",
      gallery: "GALLERY",
      contact: "CONTACT",
      book: "BOOK A TABLE",
      reservations: "RESERVATIONS"
    },
    hero: { 
      subtitle: "AN EXQUISITE CULINARY SAGA - TAPAS AND COCKTAILS", 
      desc: "At Seoul Flame, we merge ancient fermentation secrets with contemporary fire, creating a dialogue between Korea's earthy heritage and the urban pulse.",
      btn: "BOOK A TABLE", 
      menuBtn: "OUR MENU",
      aboutBtn: "OUR PHILOSOPHY"
    },
    menu: { subtitle: "THE SELECTION", title: "Curated Fare.", all: "ALL", starter: "TAPAS", main: "MAIN", dessert: "DESSERT", drink: "COCKTAILS" },
    discovery: { subtitle: "Innovation Suite", title: "Sensory Algorithm.", desc: "Describe a mood, a feeling, or an occasion, and our Intelligence will orchestrate a non-repeatable dining journey.", placeholder: "e.g. 'Starlit city memories'" },
    reservation: { title: "Secure Your Table", desc: "Experience KIMCHI at its finest. We recommend booking at least two weeks in advance." },
    auth: { login: "Authentication", signup: "Registration", email: "Email Address", code: "Secure Access Code", btn: "Authenticate Access" },
    footer: { essence: "AN EXQUISITE CULINARY SAGA - TAPAS AND COCKTAILS" },
    about: { 
      title: "OUR STORY", 
      content: "Born from a passion for excellence, KIMCHI brings together vibrant spices and delicate techniques to redefine the modern dining experience.",
      history_title: "A Vision Forged in Senses",
      history_content: "Established in 2018, Kimchi began as a small culinary experiment in the heart of the city. Our mission was simple: to honor the complexities of Korean heritage while embracing the avant-garde. Over the years, we have evolved into a sanctuary where tradition meets transformation.",
      philosophy_title: "The Culinary Philosophy",
      philosophy_content: "We believe that dining is an act of storytelling. Our kitchen is a laboratory of flavors where fermented traditions are balanced with seasonal precision. Every dish is a dialogue between the earth's purity and the chef's imagination, aimed at evoking memories yet to be made.",
      chef_title: "Master of the Flame",
      chef_content: "Led by Executive Chef Ji-Hoon Kim, our team brings decades of global experience. Chef Kim's journey from the coastal kitchens of Busan to the Michelin-starred tables of Paris defines our unique perspective. His signature approach—'Respecting the Root, Polishing the Stone'—is the heartbeat of every plate."
    },
    events: { title: "PRIVATE SOIRÉES", content: "From intimate celebrations to grand corporate gatherings, our space is yours to transform." },
    gallery: { title: "VISUAL FEAST", content: "A glimpse into the artisan plates and atmospheric moments at KIMCHI." },
    contact: { title: "GET IN TOUCH", content: "Experience KIMCHI at https://maps.google.com/?cid=3988189707950359476 or reach out via ntwalipaccy360gmail.com" },
    feedback: {
      title: "GASTRONOMIC REFLECTION",
      subtitle: "GUEST EXPERIENCE",
      desc: "Your insights refine our craft. Please share your reflections on your recent journey at KIMCHI.",
      rating: "Overall Experience",
      food: "Culinary Execution",
      service: "Hospitality & Pace",
      ambience: "Atmospheric Resonance",
      comments: "Additional Reflections",
      submit: "Submit Reflections",
      success: "Thank you for your contribution to our evolving saga.",
      statsTitle: "SERVICE IMPROVEMENT INSIGHTS",
      statsSubtitle: "AGGREGATED FEEDBACK"
    },
    sommelier: {
      pairing: "Drink Pairing",
      secret: "Secret Ingredient",
      ask: "Ask Sommelier",
      close: "Close"
    }
  },
  fr: {
    nav: { 
      home: "ACCUEIL",
      about: "À PROPOS",
      restaurant: "RESTAURANT",
      events: "ÉVÉNEMENTS",
      gallery: "GALERIE",
      contact: "CONTACT",
      book: "RÉSERVER",
      reservations: "RÉSERVATIONS"
    },
    hero: { 
      subtitle: "UNE SAGA CULINAIRE EXQUISE - TAPAS ET COCKTAILS", 
      desc: "Chez Seoul Flame, nous fusionnons les secrets de fermentation ancestraux avec le feu contemporain, créant un dialogue entre l'héritage terreux de la Corée et le pouls urbain.",
      btn: "RÉSERVER UNE TABLE", 
      menuBtn: "NOTRE CARTE",
      aboutBtn: "NOTRE PHILOSOPHIE"
    },
    menu: { subtitle: "LA SÉLECTION", title: "Plats Curatés.", all: "TOUT", starter: "TAPAS", main: "PLAT", dessert: "DESSERT", drink: "COCKTAILS" },
    discovery: { subtitle: "Suite Innovation", title: "Algorithme Sensoriel.", desc: "Décrivez une humeur, un sentiment ou une occasion, et notre Intelligence orchestrera un voyage culinaire unique.", placeholder: "ex. 'Souvenirs de ville étoilée'" },
    reservation: { title: "Réserver Votre Table", desc: "Découvrez KIMCHI sous son meilleur jour. Nous recommandons de réserver au moins deux semaines à l'avance." },
    auth: { login: "Authentification", signup: "Inscription", email: "Adresse E-mail", code: "Code d'Accès Sécurisé", btn: "Authentifier l'Accès" },
    footer: { essence: "UNE SAGA CULINAIRE EXQUISE - TAPAS ET COCKTAILS" },
    about: { 
      title: "NOTRE HISTOIRE", 
      content: "Née d'une passion pour l'excellence, KIMCHI réunit des épices vibrantes et des techniques délicates pour redéfinir l'expérience culinaire moderne.",
      history_title: "Une Vision Forgée dans les Sens",
      history_content: "Fondé en 2018, Kimchi a commencé comme une petite expérience culinaire au cœur de la ville. Notre mission était simple : honorer les complexités de l'héritage coréen tout en embrassant l'avant-garde. Au fil des ans, nous sommes devenus un sanctuaire où la tradition rencontre la transformation.",
      philosophy_title: "La Philosophie Culinaire",
      philosophy_content: "Nous croyons que dîner est un acte de narration. Notre cuisine est un laboratoire de saveurs où les traditions fermentées sont équilibrées avec une précision saisonnière. Chaque plat est un dialogue entre la pureté de la terre et l'imagination du chef, visant à évoquer des souvenirs encore à naître.",
      chef_title: "Maître de la Flamme",
      chef_content: "Dirigée par le chef exécutif Ji-Hoon Kim, notre équipe apporte des décennies d'expérience mondiale. Le parcours du chef Kim, des cuisines côtières de Busan aux tables étoilées Michelin de Paris, définit notre perspective unique. Son approche signature — 'Respecter la Racine, Polir la Pierre' — est le battement de cœur de chaque assiette."
    },
    events: { title: "SOIRÉES PRIVÉES", content: "De célébrations intimes aux grands rassemblements corporatifs, notre espace est à vous pour transformer." },
    gallery: { title: "FESTIN VISUEL", content: "Un aperçu des plats artisanaux et des moments atmosphériques chez KIMCHI." },
    contact: { title: "CONTACTEZ-NOUS", content: "Découvrez KIMCHI sur https://maps.google.com/?cid=3988189707950359476 ou contactez-nous via ntwalipaccy360gmail.com" },
    feedback: {
      title: "RÉFLEXION GASTRONOMIQUE",
      subtitle: "EXPÉRIENCE CLIENT",
      desc: "Vos impressions affinent notre art. Veuillez partager vos réflexions sur votre récent voyage chez KIMCHI.",
      rating: "Expérience Globale",
      food: "Exécution Culinaire",
      service: "Hospitalité & Rythme",
      ambience: "Résonance Atmosphérique",
      comments: "Réflexions Additionnelles",
      submit: "Envoyer les Réflexions",
      success: "Merci pour votre contribution à notre saga en constante évolution.",
      statsTitle: "CONSEILS D'AMÉLIORATION DU SERVICE",
      statsSubtitle: "COMMENTAIRES AGRÉGÉS"
    },
    sommelier: {
      pairing: "Accord Boisson",
      secret: "Ingrédient Secret",
      ask: "Demander au Sommelier",
      close: "Fermer"
    }
  },
  jp: {
    nav: { 
      home: "ホーム",
      about: "私たちについて",
      restaurant: "レストラン",
      events: "イベント",
      gallery: "ギャラリー",
      contact: "お問い合わせ",
      book: "予約する",
      reservations: "予約"
    },
    hero: { 
      subtitle: "絶妙な料理の佐賀 - タパスとカクテル", 
      desc: "Seoul Flameでは、古代の発酵の秘密と現代の「炎」を融合させ、韓国の大地の伝統と都市の鼓動との対話を生み出しています。",
      btn: "テーブルを予約する", 
      menuBtn: "メニューを見る",
      aboutBtn: "私たちの哲学"
    },
    menu: { subtitle: "セレクション", title: "厳選された料理", all: "すべて", starter: "タパス", main: "メイン", dessert: "デザート", drink: "カクテル" },
    discovery: { subtitle: "イノベーションスイート", title: "感覚アルゴリズム", desc: "気分や感情、場面を伝えてください。私たちのAIがあなただけの特別な料理体験を演出します。", placeholder: "例：'星空の街の思い出'" },
    reservation: { title: "お席を確保する", desc: "KIMCHIの最高のおもてなしをご体験ください。2週間前までのご予約をお勧めします。" },
    auth: { login: "認証", signup: "登録", email: "メールアドレス", code: "セキュリティコード", btn: "アクセスを認証" },
    footer: { essence: "絶妙な料理の佐賀 - タパスとカクテル" },
    about: { 
      title: "私たちの物語", 
      content: "卓越した情熱から生まれたKIMCHIは、活気に満ちたスパイスと繊細な技術を融合させ、現代のダイニング体験を再定義します。",
      history_title: "五感で研ぎ澄まされたビジョン",
      history_content: "2018年に設立されたキムチは、街の中心部での小さな料理実験として始まりました。私たちの使命はシンプルでした。韓国の伝統の複雑さを尊重しながら、アヴァンギャルドを取り入れることです。長年にわたり、私たちは伝統と変革が融合する聖域へと進化してきました。",
      philosophy_title: "料理の哲学",
      philosophy_content: "私たちは、食事は物語を語る行為であると信じています。私たちのキッチンは、発酵の伝統と季節の正確さがバランスを保つフレーバーの研究室です。すべての一皿は、大地の純粋さとシェフの想像力の対話であり、まだ見ぬ思い出を呼び起こすことを目的としています。",
      chef_title: "炎の巨匠",
      chef_content: "エグゼクティブ・シェフのキム・ジフン率いる私たちのチームは、数十年にわたるグローバルな経験を持っています。釜山の海岸沿いのキッチンからパリのミシュラン星付きテーブルに至るシェフ・キムの旅が、私たちのユニークな視点を定義しています。彼のシグネチャーアプローチである「根を尊重し、石を磨く」は、すべての料理の鼓動です。"
    },
    events: { title: "プライベートイベント", content: "親密なお祝いから盛大な企業イベントまで、私たちのスペースを自由にご利用いただけます。" },
    gallery: { title: "視覚的な饗宴", content: "KIMCHIの芸術的な一皿と雰囲気のある瞬間を垣間見ることができます。" },
    contact: { title: "お問い合わせ", content: "https://maps.google.com/?cid=3988189707950359476 でKIMCHIをご体験ください。または ntwalipaccy360gmail.com までご連絡ください。" },
    feedback: {
      title: "美食の反映",
      subtitle: "お客様の体験",
      desc: "皆様のご意見が私たちの技を磨きます。KIMCHIでの最近の体験について、ぜひご感想をお聞かせください。",
      rating: "全体の体験",
      food: "料理の完成度",
      service: "ホスピタリティと間合い",
      ambience: "雰囲気の響き",
      comments: "追加のご感想",
      submit: "感想を送信する",
      success: "私たちの進化し続ける物語へのご協力に感謝いたします。",
      statsTitle: "サービス向上のための洞察",
      statsSubtitle: "集計されたフィードバック"
    },
    sommelier: {
      pairing: "おすすめの飲み物",
      secret: "秘密の隠し味",
      ask: "ソムリエに聞く",
      close: "閉じる"
    }
  }
};

const KimchiLogo = ({ className, theme, size = "md" }: { className?: string, theme: Theme, size?: "sm" | "md" | "lg" }) => {
  const isSm = size === "sm";
  const isLg = size === "lg";
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", isSm ? "w-8 h-8" : isLg ? "w-32 h-32" : "w-20 h-20")}>
         <svg viewBox="0 0 100 100" className="w-full h-full fill-none">
           <circle cx="50" cy="50" r="45" stroke="#f5d38a" strokeWidth="1" />
           <path d="M50 10 Q 70 20 80 50 Q 70 80 50 90 Q 30 80 20 50 Q 30 20 50 10" stroke="#f5d38a" strokeWidth="0.5" className="opacity-40" />
           <path d="M10 50 Q 20 30 50 20 Q 80 30 90 50 Q 80 70 50 80 Q 20 70 10 50" stroke="#f5d38a" strokeWidth="0.5" className="opacity-40" />
         </svg>
         <span className={cn("absolute font-serif italic text-[#f5d38a]", isSm ? "text-[10px]" : isLg ? "text-4xl" : "text-2xl")}>K</span>
      </div>
      <span className={cn("text-[#f5d38a] font-sans font-light uppercase tracking-[0.3em]", isSm ? "text-sm" : isLg ? "text-7xl" : "text-4xl")}>Kimchi</span>
    </div>
  );
};


const Navigation = ({ 
  currentView, 
  setView, 
  lang, 
  setLang,
  theme, 
  toggleTheme,
}: { 
  currentView: View, 
  setView: (v: View) => void, 
  lang: Language,
  setLang: (l: Language) => void,
  theme: Theme,
  toggleTheme: () => void,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[lang].nav;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: t.home },
    { id: 'about', label: t.about },
    { id: 'menu', label: t.restaurant },
    { id: 'events', label: t.events },
    { id: 'gallery', label: t.gallery },
    { id: 'contact', label: t.contact },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[60] transition-all duration-700 px-6 py-6 md:px-12",
      isScrolled 
        ? (theme === 'dark' ? "bg-black/95 backdrop-blur-md border-b border-white/5 py-4" : "bg-white/95 backdrop-blur-md border-b border-black/5 py-4") 
        : "bg-transparent"
    )} aria-label="Main Navigation">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <button onClick={() => { setView('landing'); setMobileMenuOpen(false); }} className="flex items-center gap-2 group" aria-label="Go to Seoul Flame Homepage">
          <KimchiLogo size="sm" theme={theme} />
        </button>

        <div className="hidden lg:flex items-center gap-10" role="menubar" aria-label="Main Menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              aria-label={`Navigate to ${item.label}`}
              aria-current={(currentView === item.id || (currentView === 'landing' && item.id === 'home')) ? 'page' : undefined}
              onClick={() => {
                if (item.id === 'home') setView('landing');
                else setView(item.id as View);
              }}
              className={cn(
                "text-[10px] tracking-[0.2em] font-bold transition-all",
                (currentView === item.id || (currentView === 'landing' && item.id === 'home')) 
                  ? (theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800") 
                  : (theme === 'dark' ? "text-white/50 hover:text-[#f5d38a]" : "text-black/40 hover:text-amber-800")
              )}
            >
              {item.label}
            </button>
          ))}

          <div className="flex items-center gap-4 border-l border-white/10 pl-10 ml-4" role="group" aria-label="Language Selector">
            <button
              onClick={() => {
                const langs: Language[] = ['en', 'fr', 'jp'];
                const nextIndex = (langs.indexOf(lang) + 1) % langs.length;
                setLang(langs[nextIndex]);
              }}
              className={cn(
                "flex items-center gap-2 transition-all group/lang",
                theme === 'dark' ? "text-white/50 hover:text-[#f5d38a]" : "text-black/40 hover:text-amber-800"
              )}
              aria-label={`Change language from ${lang}. Currently ${lang === 'en' ? 'English' : lang === 'fr' ? 'French' : 'Japanese'}`}
            >
              <Globe size={14} className="opacity-50 group-hover/lang:opacity-100 transition-opacity" />
              <span className="text-[10px] font-bold uppercase tracking-widest min-w-[24px]">
                {lang}
              </span>
            </button>
          </div>

          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className={cn(
              "p-2 rounded-full transition-all border ml-4",
              theme === 'dark' 
                ? "border-white/10 text-white/50 hover:text-[#f5d38a] hover:border-[#f5d38a]/50" 
                : "border-black/10 text-black/50 hover:text-amber-600 hover:border-amber-600/50"
            )}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile/Tablet Toggles */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => {
                const langs: Language[] = ['en', 'fr', 'jp'];
                const nextIndex = (langs.indexOf(lang) + 1) % langs.length;
                setLang(langs[nextIndex]);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all border",
                theme === 'dark' ? "border-white/10 text-white/70" : "border-black/10 text-black/70"
              )}
              aria-label="Toggle Language"
            >
              <Globe size={14} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{lang}</span>
            </button>
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-full transition-all border",
                theme === 'dark' ? "border-white/10 text-white/50" : "border-black/10 text-black/50"
              )}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <button
            onClick={() => { setView('reservation'); setMobileMenuOpen(false); }}
            aria-label={t.book}
            className={cn(
              "hidden md:block px-6 py-2.5 border rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold transition-all",
              theme === 'dark' 
                ? "border-[#f5d38a]/50 text-[#f5d38a] hover:bg-[#f5d38a] hover:text-black" 
                : "border-amber-800/50 text-amber-900 hover:bg-amber-900 hover:text-white"
            )}
          >
            {t.book}
          </button>

          <button 
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? (
              <X size={24} className={theme === 'dark' ? "text-white" : "text-black"} />
            ) : (
              <Menu size={24} className={theme === 'dark' ? "text-white" : "text-black"} />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-0 z-50 flex flex-col pt-32 px-12 pb-12",
              theme === 'dark' ? "bg-black" : "bg-white"
            )}
          >
            <div className="flex flex-col gap-8 mb-12">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'home') setView('landing');
                    else setView(item.id as View);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "text-4xl font-serif italic text-left",
                    (currentView === item.id || (currentView === 'landing' && item.id === 'home')) 
                      ? (theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800") 
                      : (theme === 'dark' ? "text-white/40" : "text-black/40")
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-auto space-y-12">
              <div className="flex items-center justify-between border-t border-current opacity-10 pt-8">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      const langs: Language[] = ['en', 'fr', 'jp'];
                      const nextIndex = (langs.indexOf(lang) + 1) % langs.length;
                      setLang(langs[nextIndex]);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 border rounded-full transition-all",
                      theme === 'dark' ? "border-white/10 text-white" : "border-black/10 text-black"
                    )}
                  >
                    <Globe size={14} className={theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800"} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : '日本語'}
                    </span>
                  </button>
                </div>
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "p-4 rounded-full border",
                    theme === 'dark' ? "border-white/10 text-white" : "border-black/10 text-black"
                  )}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>

              <button
                onClick={() => { setView('reservation'); setMobileMenuOpen(false); }}
                className={cn(
                  "w-full py-6 font-bold uppercase tracking-[0.4em] text-xs transition-all",
                  theme === 'dark' ? "bg-[#f5d38a] text-black" : "bg-neutral-950 text-white"
                )}
              >
                {t.book}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ lang, theme, setView }: { lang: Language, theme: Theme, setView: (v: View) => void }) => {
  const t = (TRANSLATIONS[lang] as any).hero;
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className={cn("relative h-[110vh] md:h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-700", theme === 'dark' ? "bg-black" : "bg-stone-100")}>
      <motion.div style={{ y: y1 }} className="absolute inset-0 z-0">
        <img 
          src="https://images.pexels.com/photos/2092906/pexels-photo-2092906.jpeg?auto=compress&cs=tinysrgb&w=1920" 
          className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-700", theme === 'dark' ? "opacity-70" : "opacity-60")}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="sync"
        />
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1000"
          style={{ filter: theme === 'dark' ? 'brightness(0.8)' : 'brightness(1.0) contrast(1.1)' }}
          onCanPlay={(e) => (e.currentTarget.style.opacity = theme === 'dark' ? '0.8' : '0.4')}
        >
          <source src="https://videos.pexels.com/video-files/857195/857195-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
        <div className={cn("absolute inset-0", theme === 'dark' ? "bg-black/40" : "bg-white/10")} />
        <div className={cn("absolute inset-0", theme === 'dark' ? "bg-gradient-to-b from-black/60 via-transparent to-black/60" : "bg-gradient-to-b from-stone-100/60 via-transparent to-stone-100/60")} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ opacity }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center justify-center text-center z-10 px-6 max-w-4xl"
      >
        <span className={cn(
          "text-[10px] md:text-[12px] uppercase tracking-[0.6em] font-bold mb-6 block",
          theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800"
        )}>
          {t.subtitle}
        </span>
        <h1 className={cn(
          "text-6xl md:text-9xl font-serif italic mb-8 tracking-tight transition-colors duration-700",
          theme === 'dark' ? "text-white" : "text-neutral-950"
        )}>
          Seoul Flame
        </h1>
        <p className={cn(
          "text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-light transition-colors duration-700",
          theme === 'dark' ? "text-white/70" : "text-stone-600"
        )}>
          {t.desc}
        </p>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
          <button 
            onClick={() => setView('reservation')}
            className="group relative px-10 py-5 overflow-hidden rounded-full transition-all"
          >
            <div className={cn("absolute inset-0 transition-transform group-hover:scale-105", theme === 'dark' ? "bg-[#f5d38a]" : "bg-neutral-950")} />
            <span className={cn("relative text-[11px] font-bold uppercase tracking-[0.3em]", theme === 'dark' ? "text-black" : "text-white")}>{t.btn}</span>
          </button>
          
          <button 
            onClick={() => setView('menu')}
            className={cn(
              "group relative px-10 py-5 overflow-hidden rounded-full border transition-all",
              theme === 'dark' ? "border-white/30 hover:border-white text-white" : "border-black/30 hover:border-black text-black"
            )}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.3em]">{t.menuBtn}</span>
          </button>

          <button 
            onClick={() => setView('about')}
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.4em] transition-colors flex items-center gap-2 group",
              theme === 'dark' ? "text-white/60 hover:text-[#f5d38a]" : "text-black/60 hover:text-amber-800"
            )}
          >
            {t.aboutBtn}
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 hidden md:block">
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "w-[1px] h-12 mx-auto",
            theme === 'dark' ? "bg-gradient-to-b from-white/60 to-transparent" : "bg-gradient-to-b from-black/60 to-transparent"
          )}
        />
      </div>
    </section>
  );
};

const AuthPage = ({ mode: initialMode, onAuthSuccess, lang, theme }: { mode: 'login' | 'signup', onAuthSuccess: (user: any) => void, lang: Language, theme: Theme }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = TRANSLATIONS[lang].auth;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthSuccess({ email, name: email.split('@')[0] });
  };

  const handleSocialLogin = async (providerName: 'google' | 'apple') => {
    setLoading(providerName);
    setError(null);
    try {
      const provider = providerName === 'google' 
        ? new GoogleAuthProvider() 
        : new OAuthProvider('apple.com');
      
      const result = await signInWithPopup(auth, provider);
      onAuthSuccess(result.user);
    } catch (err: any) {
      console.error(`${providerName} login failed:`, err);
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      <div className={cn("w-full lg:w-1/2 p-12 md:p-24 flex flex-col justify-center", theme === 'dark' ? "bg-neutral-950" : "bg-white")}>
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="max-w-md mx-auto w-full"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-stone-500 mb-4 block">{mode === 'login' ? t.login : t.signup}</span>
          <h2 className={cn("text-6xl italic mb-8", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>
            {mode === 'login' ? 'Welcome Back' : 'Join the Inner Circle'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs tracking-wider">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-10">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={!!loading}
              className={cn(
                "flex items-center justify-center gap-3 py-4 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50",
                theme === 'dark' ? "border-white/10 hover:bg-white/5 text-white" : "border-stone-200 hover:bg-stone-50 text-black"
              )}
            >
              {loading === 'google' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Google
            </button>
            <button
              onClick={() => handleSocialLogin('apple')}
              disabled={!!loading}
              className={cn(
                "flex items-center justify-center gap-3 py-4 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50",
                theme === 'dark' ? "border-white/10 hover:bg-white/5 text-white" : "border-stone-200 hover:bg-stone-50 text-black"
              )}
            >
              {loading === 'apple' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
              ) : (
                <Apple size={16} />
              )}
              Apple
            </button>
          </div>

          <div className="relative mb-10 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className={cn("w-full border-t", theme === 'dark' ? "border-white/10" : "border-stone-200")}></div>
            </div>
            <span className={cn("relative px-4 text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "bg-neutral-950 text-stone-500" : "bg-white text-stone-400")}>
              Or continue with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="text-left">
              <label className={cn("block text-[10px] uppercase tracking-widest mb-3", theme === 'dark' ? "text-white/40" : "text-neutral-500")}>{t.email}</label>
              <input
                type="email"
                required
                className={cn(
                  "w-full bg-transparent border-b py-4 outline-none transition-all placeholder:text-stone-800",
                  theme === 'dark' ? "border-stone-800 focus:border-stone-100 text-white" : "border-stone-200 focus:border-neutral-900 text-black"
                )}
                placeholder="email@kimchi.paris"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            {mode === 'login' && (
              <div className="text-left">
                <label className={cn("block text-[10px] uppercase tracking-widest mb-3", theme === 'dark' ? "text-white/40" : "text-neutral-500")}>{t.code}</label>
                <input
                  type="password"
                  required
                  className={cn(
                    "w-full bg-transparent border-b py-4 outline-none transition-all placeholder:text-stone-800",
                    theme === 'dark' ? "border-stone-800 focus:border-stone-100 text-white" : "border-stone-200 focus:border-neutral-900 text-black"
                  )}
                  placeholder="••••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              className={cn(
                "w-full py-6 rounded-full text-xs uppercase tracking-[0.4em] transition-all font-bold mt-8 shadow-2xl",
                theme === 'dark' ? "bg-[#f5d38a] text-black hover:bg-white" : "bg-neutral-950 text-white hover:bg-neutral-800"
              )}
            >
              {t.btn}
            </button>
          </form>

          <div className="mt-12 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors"
            >
              {mode === 'login' ? "Don't have access? Request Membership" : "Already a member? Sign In"}
            </button>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:block w-1/2 relative">
        <div className={cn("absolute inset-0 z-10 opacity-30", theme === 'dark' ? "bg-black" : "bg-stone-100")} />
        <img 
          src={mode === 'login' ? "https://images.pexels.com/photos/1449773/pexels-photo-1449773.jpeg?auto=compress&cs=tinysrgb&w=1200" : "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1200"}
          alt="Atmosphere" 
          className="w-full h-full object-cover grayscale-0 brightness-100 hover:brightness-110 transition-all duration-1000"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-neutral-950/80 to-transparent" />
      </div>
    </section>
  );
};

const AIDiscovery = ({ lang, theme }: { lang: Language, theme: Theme }) => {
  const [prompt, setPrompt] = useState('');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const t = TRANSLATIONS[lang].discovery;

  const handleDiscovery = async () => {
    if (!prompt) return;
    setLoading(true);
    setRecommendation(null);
    setGeneratedImage(null);
    
    const result = await getSensoryRecommendation(prompt);
    setRecommendation(result);
    setLoading(false);

    if (result && result.visualPrompt) {
      setImageLoading(true);
      const imageUrl = await generateDiscoveryImage(result.visualPrompt);
      setGeneratedImage(imageUrl);
      setImageLoading(false);
    }
  };

  return (
    <section className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-20 items-start">
        <div className="text-left">
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-500 mb-4 block">{t.subtitle}</span>
          <h2 className={cn("text-7xl md:text-8xl mb-8 leading-[0.9]", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>
            {t.subtitle.split(' ')[0]} <br /><span className="italic">{t.title}</span>
          </h2>
          <p className={cn("text-sm md:text-base mb-12 font-light leading-relaxed max-w-sm", theme === 'dark' ? "text-stone-400" : "text-stone-600")}>
            {t.desc}
          </p>

          <div className="relative group max-w-md">
            <input
              id="discovery-prompt"
              type="text"
              aria-label={t.placeholder}
              className={cn(
                "w-full bg-transparent border-b py-6 pr-16 text-2xl font-serif italic outline-none transition-colors",
                theme === 'dark' ? "border-stone-800 focus:border-stone-200 text-stone-100 placeholder:text-stone-800" : "border-stone-200 focus:border-neutral-900 text-neutral-900 placeholder:text-stone-300"
              )}
              placeholder={t.placeholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleDiscovery()}
            />
            <button
              onClick={handleDiscovery}
              disabled={loading}
              aria-label="Search discovery"
              className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-stone-500 hover:text-white transition-colors disabled:opacity-50"
            >
              <Search size={28} />
            </button>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4">
            {['Romantic Date', 'Business Victory', 'Lazy Sunday', 'Electric Night'].map(tag => (
              <button
                key={tag}
                onClick={() => setPrompt(tag)}
                className={cn(
                  "text-[10px] uppercase tracking-widest border px-4 py-2 rounded-full transition-colors",
                  theme === 'dark' ? "border-white/10 hover:border-stone-100 hover:text-white" : "border-black/10 hover:border-neutral-900 hover:text-neutral-950"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {recommendation ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={cn(
                "p-8 md:p-12 rounded-[40px] space-y-12 backdrop-blur-xl border overflow-hidden",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
              )}
            >
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 group">
                {generatedImage ? (
                  <motion.img 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={generatedImage} 
                    alt="AI Recommended Experience"
                    className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                  />
                ) : imageLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20">
                    <div className="w-12 h-12 border-2 border-[#f5d38a] border-t-transparent animate-spin rounded-full" />
                    <span className="text-[10px] uppercase tracking-widest text-[#f5d38a] font-bold animate-pulse">Orchestrating Visuals...</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20">
                    <Sparkles size={32} className="text-white/10" />
                    <span className="text-[10px] uppercase tracking-widest text-white/20">Visual pending</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6 right-6">
                   <span className={cn("uppercase tracking-widest text-[9px] mb-2 block font-bold", theme === 'dark' ? "text-[#f5d38a]" : "text-[#f5d38a]")}>Atmospheric Genesis</span>
                   <p className="text-white text-sm font-light italic line-clamp-2">"{recommendation.atmosphere}"</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 text-left">
                {[
                  { label: (lang === 'fr' ? 'Pour Commencer' : (lang === 'jp' ? 'はじめに' : 'To Begin')), data: recommendation.starter },
                  { label: (lang === 'fr' ? 'Plat Principal' : (lang === 'jp' ? 'メインディッシュ' : 'The Main Event')), data: recommendation.main },
                  { label: (lang === 'fr' ? 'Le Final' : (lang === 'jp' ? 'デザート' : 'The Finale')), data: recommendation.dessert },
                  { label: (lang === 'fr' ? 'Accords Signature' : (lang === 'jp' ? 'ペアリング' : 'Signature Pairing')), data: recommendation.drink },
                ].map((item, idx) => (
                  <div key={idx} className="group">
                    <span className={cn("uppercase tracking-widest text-[9px] mb-1 block opacity-30", theme === 'dark' ? "text-white" : "text-black")}>{item.label}</span>
                    <h4 className={cn("text-2xl mb-1 transition-colors", theme === 'dark' ? "group-hover:text-stone-100 text-stone-100" : "group-hover:text-neutral-950 text-neutral-900")}>{item.data.name}</h4>
                    <p className={cn("text-sm font-light leading-relaxed", theme === 'dark' ? "text-white/50" : "text-neutral-500")}>{item.data.description}</p>
                  </div>
                ))}
              </div>

              <button className={cn(
                "w-full py-5 rounded-full text-[10px] uppercase tracking-widest font-bold border transition-all",
                theme === 'dark' ? "border-white/10 hover:bg-stone-100 hover:text-black" : "border-black/10 hover:bg-neutral-900 hover:text-white"
              )}>
                {lang === 'jp' ? 'このセットで予約する' : (lang === 'fr' ? 'Réserver ce Voyage' : 'Book This Journey')}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "h-full min-h-[500px] border border-dashed rounded-[40px] flex items-center justify-center p-12 text-center",
                theme === 'dark' ? "border-white/10" : "border-black/10"
              )}
            >
              <div className="space-y-4">
                <Sparkles size={48} className={cn("mx-auto", theme === 'dark' ? "text-white/10" : "text-black/10")} />
                <p className={cn("uppercase tracking-[0.2em] text-xs font-bold", theme === 'dark' ? "text-white/20" : "text-black/20")}>Awaiting your sensation</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const Footer = ({ lang, theme, setView }: { lang: Language, theme: Theme, setView: (v: View) => void }) => {
  const t = TRANSLATIONS[lang].footer;
  return (
    <footer className={cn("py-32 px-12 border-t", theme === 'dark' ? "bg-black border-white/5" : "bg-stone-50 border-black/5")}>
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-20">
        <div className="flex flex-col items-center md:items-start text-left">
          <KimchiLogo theme={theme} size="sm" className="mb-8" />
          <p className={cn(
            "text-[11px] uppercase tracking-[0.4em] max-w-sm leading-relaxed text-center md:text-left",
            theme === 'dark' ? "text-white/30" : "text-stone-400"
          )}>{t.essence}</p>
        </div>
        <nav className="flex flex-col items-center md:items-end gap-8" aria-label="Footer Navigation">
           <div className={cn(
             "flex gap-8 text-[11px] uppercase tracking-[0.3em] font-bold items-center",
             theme === 'dark' ? "text-stone-500" : "text-stone-400"
           )}>
             <motion.button 
               whileHover={{ y: -2, color: theme === 'dark' ? '#f5d38a' : '#b45309' }}
               onClick={() => setView('feedback')} 
               className="transition-colors"
               aria-label="Go to Feedback Section"
             >
               Feedback
             </motion.button>
             <motion.button 
               whileHover={{ y: -2, color: theme === 'dark' ? '#f5d38a' : '#b45309' }}
               onClick={() => setView('feedback-stats')} 
               className="transition-colors"
               aria-label="View Service Quality Statistics"
             >
               Service Quality
             </motion.button>
             <motion.a 
               whileHover={{ scale: 1.2, y: -2, color: theme === 'dark' ? '#f5d38a' : '#b45309' }}
               href="https://instagram.com/kimchi.rw?igshid=YmMyMTA2M2Y=" 
               target="_blank" 
               rel="noopener noreferrer" 
               aria-label="Follow us on Instagram" 
               className="transition-all flex items-center gap-1"
             >
               <Instagram size={14} />
             </motion.a>
             <motion.a 
               whileHover={{ scale: 1.2, y: -2, color: theme === 'dark' ? '#f5d38a' : '#b45309' }}
               href="https://www.threads.com/@kimchi.rw?xmt=AQF0GbNfkZzXfDU3SgGpUjliliuD2rzVOJrAjm1IkdGjW0Q" 
               target="_blank" 
               rel="noopener noreferrer" 
               aria-label="Follow us on Threads" 
               className="transition-all flex items-center gap-1"
             >
               <Twitter size={14} />
             </motion.a>
             <motion.a 
               whileHover={{ scale: 1.2, y: -2, color: theme === 'dark' ? '#f5d38a' : '#b45309' }}
               href="https://maps.google.com/?cid=3988189707950359476" 
               target="_blank" 
               rel="noopener noreferrer" 
               aria-label="Find us on Google Maps" 
               className="transition-all flex items-center gap-1"
             >
               <MapPin size={14} />
             </motion.a>
           </div>
           <div className={cn(
             "text-[10px] uppercase tracking-[0.2em]",
             theme === 'dark' ? "text-stone-700" : "text-stone-300"
           )}>
             © KIMCHI. All rights reserved.
           </div>
        </nav>
      </div>
    </footer>
  );
};

const MenuSection = ({ lang, theme }: { lang: Language, theme: Theme }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [pairingData, setPairingData] = useState<Record<string, any>>({});
  const [loadingPairingId, setLoadingPairingId] = useState<string | null>(null);
  const t = TRANSLATIONS[lang].menu;
  const st = (TRANSLATIONS[lang] as any).sommelier;

  const categories = ['all', 'starter', 'main', 'dessert', 'drink'];

  const handleGenerateArt = async (item: MenuItem) => {
    setGeneratingIds(prev => new Set(prev).add(item.id.toString()));
    try {
      const imageUrl = await getMenuItemArt(item.name, item.description);
      if (imageUrl) {
        setGeneratedImages(prev => ({ ...prev, [item.id]: imageUrl }));
      }
    } catch (error) {
      console.error("Art generation failed:", error);
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id.toString());
        return next;
      });
    }
  };

  const handleGetPairing = async (item: MenuItem) => {
    if (pairingData[item.id]) {
      setPairingData(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }
    
    setLoadingPairingId(item.id.toString());
    try {
      const { getPairingRecommendation } = await import('./services/geminiService');
      const result = await getPairingRecommendation(item.name, item.description);
      if (result) {
        setPairingData(prev => ({ ...prev, [item.id]: result }));
      }
    } catch (error) {
      console.error("Pairing failed:", error);
    } finally {
      setLoadingPairingId(null);
    }
  };

  const filteredMenu = activeCategory === 'all' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === activeCategory);

  return (
    <section className={cn("relative min-h-screen pt-40 pb-24 px-8 transition-colors duration-700", theme === 'dark' ? "bg-black" : "bg-white")}>
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className={cn(
            "w-full h-full object-cover",
            theme === 'dark' ? "opacity-10 brightness-[0.2]" : "opacity-5"
          )}
        >
          <source src="https://player.vimeo.com/external/369796016.sd.mp4?s=3465b83907a974b94fcf900ee3b3e70d45330364&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
        </video>
        <div className={cn("absolute inset-0 ", theme === 'dark' ? "bg-black/60" : "bg-white/60")} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className={cn(
            "text-[11px] uppercase tracking-[0.6em] font-bold mb-6 block",
            theme === 'dark' ? "text-[#f5d38a]" : "text-amber-700"
          )}>{t.subtitle}</span>
          <h2 className={cn(
            "text-8xl font-serif italic flex flex-col items-center gap-4",
            theme === 'dark' ? "text-white" : "text-neutral-900"
          )}>
             {t.title.split('.')[0]}
             <div className={cn("w-24 h-px", theme === 'dark' ? "bg-[#f5d38a]/40" : "bg-amber-700/40")} />
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-12 mb-24" role="tablist" aria-label="Menu Categories">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "text-[11px] uppercase tracking-[0.4em] font-bold transition-all relative pb-2",
                activeCategory === cat ? (theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800") : (theme === 'dark' ? "text-white/40 hover:text-white" : "text-neutral-400 hover:text-black")
              )}
            >
              {(t as any)[cat]}
              {activeCategory === cat && <motion.div layoutId="menu_underline" className={cn("absolute bottom-0 left-0 right-0 h-px", theme === 'dark' ? "bg-[#f5d38a]" : "bg-amber-800")} />}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
          {filteredMenu.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className={cn(
                "relative aspect-[4/5] rounded-lg overflow-hidden mb-8 border transition-all",
                theme === 'dark' ? "border-white/5 bg-white/5" : "border-black/5 bg-black/5"
              )}>
                <img 
                  src={generatedImages[item.id] || `${item.image}&fm=webp`} 
                  alt={item.name} 
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110",
                    generatingIds.has(item.id.toString()) ? "opacity-30 blur-2xl" : "opacity-100"
                  )}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                     onClick={() => handleGenerateArt(item)}
                     disabled={generatingIds.has(item.id.toString())}
                     className={cn(
                       "p-6 rounded-full shadow-2xl hover:scale-110 transition-transform disabled:opacity-50",
                       theme === 'dark' ? "bg-[#f5d38a] text-black" : "bg-neutral-950 text-white"
                     )}
                     title="Re-visualize with AI"
                   >
                     {generatingIds.has(item.id.toString()) ? (
                       <div className={cn("w-6 h-6 border-2 border-t-transparent animate-spin rounded-full", theme === 'dark' ? "border-black" : "border-white")} />
                     ) : (
                       <Sparkles size={24} />
                     )}
                   </button>
                </div>
                {generatingIds.has(item.id.toString()) && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <span className={cn(
                        "text-[10px] uppercase tracking-[0.4em] animate-pulse font-bold",
                        theme === 'dark' ? "text-[#f5d38a]" : "text-neutral-900"
                      )}>Designing Plate...</span>
                   </div>
                )}
              </div>
              <div className="flex justify-between items-end mb-3">
                <h3 className={cn("text-3xl font-serif italic", theme === 'dark' ? "text-white" : "text-neutral-900")}>{item.name}</h3>
                <span className={cn("font-mono text-sm", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-700")}>${item.price}</span>
              </div>
              <p className={cn("text-sm font-light leading-relaxed mb-6", theme === 'dark' ? "text-white/40" : "text-stone-500")}>
                {item.description}
              </p>

              <AnimatePresence>
                {pairingData[item.id] && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "mb-6 p-4 rounded-lg text-left overflow-hidden border",
                      theme === 'dark' ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                    )}
                  >
                    <div className="space-y-4">
                      <div>
                        <span className={cn("text-[9px] uppercase tracking-widest font-bold block mb-1", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}>{st.pairing}</span>
                        <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/70" : "text-stone-600")}>{pairingData[item.id].pairing}</p>
                      </div>
                      <div>
                        <span className={cn("text-[9px] uppercase tracking-widest font-bold block mb-1", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}>{st.secret}</span>
                        <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/70" : "text-stone-600")}>{pairingData[item.id].secretSpice}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-auto">
                 <div className="flex gap-2">
                    {item.tags?.map(tag => (
                      <span key={tag} className={cn(
                        "text-[9px] uppercase tracking-widest border px-2 py-1 rounded-sm",
                        theme === 'dark' ? "text-[#f5d38a]/40 border-[#f5d38a]/10" : "text-amber-800/40 border-amber-800/10"
                      )}>{tag}</span>
                    ))}
                 </div>
                 <button 
                  onClick={() => handleGetPairing(item)}
                  className={cn(
                    "flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold transition-all",
                    theme === 'dark' ? "text-white/50 hover:text-[#f5d38a]" : "text-black/50 hover:text-amber-800"
                  )}
                >
                  {loadingPairingId === item.id.toString() ? (
                    <div className="w-3 h-3 border border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <Wine size={12} className={pairingData[item.id] ? (theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800") : ""} />
                  )}
                  {pairingData[item.id] ? st.close : st.ask}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ReservationSection = ({ lang, theme }: { lang: Language, theme: Theme }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: 2,
    name: '',
    email: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const t = TRANSLATIONS[lang].reservation;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className={cn("min-h-screen pt-40 px-6 flex flex-col items-center transition-colors duration-700", theme === 'dark' ? "bg-black" : "bg-white")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full text-center space-y-12"
        >
          <div className={cn("w-20 h-20 rounded-full border flex items-center justify-center mx-auto mb-8", theme === 'dark' ? "border-stone-100" : "border-neutral-900")}>
            <Sparkles className={theme === 'dark' ? "text-stone-100" : "text-neutral-900"} size={32} />
          </div>
          
          <div className="space-y-4">
            <h2 className={cn("text-6xl italic", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>
              {lang === 'jp' ? '予約が完了しました' : (lang === 'fr' ? 'Réservation Confirmée' : 'Reservation Confirmed')}
            </h2>
            <p className={cn("text-lg", theme === 'dark' ? "text-white/50" : "text-neutral-500")}>
              {lang === 'jp' ? `${formData.name}様、確認メールを送信しました。` : 
               (lang === 'fr' ? `Une confirmation a été envoyée à votre email, ${formData.name}.` : 
               `A confirmation has been sent to your email, ${formData.name}.`)}
            </p>
          </div>

          <div className={cn(
            "p-8 md:p-12 rounded-[32px] border text-left space-y-8 backdrop-blur-sm",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10 shadow-2xl"
          )}>
            <div className="flex justify-between items-center border-b border-current pb-4 opacity-20">
              <span className="text-[10px] uppercase tracking-widest font-bold">Booking Details</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">#KMC-{Math.floor(Math.random() * 9000) + 1000}</span>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-12">
              <div className="space-y-1">
                <span className={cn("text-[10px] uppercase tracking-[0.2em] opacity-40 block", theme === 'dark' ? "text-stone-400" : "text-stone-600")}>Date</span>
                <p className={cn("text-xl font-serif italic", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>{formData.date}</p>
              </div>
              <div className="space-y-1">
                <span className={cn("text-[10px] uppercase tracking-[0.2em] opacity-40 block", theme === 'dark' ? "text-stone-400" : "text-stone-600")}>Time</span>
                <p className={cn("text-xl font-serif italic", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>{formData.time}</p>
              </div>
              <div className="space-y-1">
                <span className={cn("text-[10px] uppercase tracking-[0.2em] opacity-40 block", theme === 'dark' ? "text-stone-400" : "text-stone-600")}>Guest Count</span>
                <p className={cn("text-xl font-serif italic", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>{formData.guests} {formData.guests === 1 ? 'Guest' : 'Guests'}</p>
              </div>
              <div className="space-y-1">
                <span className={cn("text-[10px] uppercase tracking-[0.2em] opacity-40 block", theme === 'dark' ? "text-stone-400" : "text-stone-600")}>Email</span>
                <p className={cn("text-lg font-light leading-none pt-2", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>{formData.email}</p>
              </div>
            </div>

            <div className="pt-4">
              <span className={cn("text-[10px] uppercase tracking-[0.2em] opacity-40 block mb-1", theme === 'dark' ? "text-stone-400" : "text-stone-600")}>Reservation Name</span>
              <p className={cn("text-2xl font-serif italic", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}>{formData.name}</p>
            </div>
          </div>

          <button
             onClick={() => setSubmitted(false)}
             className={cn("uppercase tracking-[0.4em] text-[10px] font-bold pt-8 block mx-auto underline underline-offset-8 decoration-1 hover:opacity-70 transition-opacity", theme === 'dark' ? "text-stone-100" : "text-neutral-950")}
          >
            {lang === 'jp' ? '別の予約をする' : (lang === 'fr' ? 'Faire une autre réservation' : 'Modify or New Booking')}
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className={cn("min-h-screen pt-40 pb-24 px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-24 items-center justify-center transition-colors duration-700", theme === 'dark' ? "bg-black" : "bg-white")}>
      <div className="max-w-xl text-left">
        <span className={cn(
          "text-[11px] uppercase tracking-[0.6em] font-bold mb-6 block",
          theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800"
        )}>
          {t.title ? "BOOKING" : "RESERVATIONS"}
        </span>
        <h2 className={cn(
          "text-7xl font-serif italic mb-10 leading-tight",
          theme === 'dark' ? "text-white" : "text-neutral-950"
        )}>
          {t.title.split(' ')[0]} <br /><span className={cn(theme === 'dark' ? "text-[#f5d38a]" : "text-amber-700")}>{t.title.split(' ').slice(1).join(' ')}</span>
        </h2>
        <p className={cn(
          "text-lg font-light leading-relaxed mb-12",
          theme === 'dark' ? "text-white/40" : "text-neutral-500"
        )}>
          {t.desc}
        </p>
        
        <div className="space-y-12">
          <div className="flex items-start gap-4">
            <div className={cn("w-px h-12", theme === 'dark' ? "bg-stone-100/20" : "bg-neutral-900/20")} />
            <div>
              <h4 className={cn("uppercase tracking-widest text-xs font-bold mb-2", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>Dress Code</h4>
              <p className={cn("text-sm", theme === 'dark' ? "text-white/40" : "text-neutral-500")}>Smart Elegant. Gentlemen are requested to wear jackets.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className={cn("w-px h-12", theme === 'dark' ? "bg-stone-100/20" : "bg-neutral-900/20")} />
            <div>
              <h4 className={cn("uppercase tracking-widest text-xs font-bold mb-2", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>Location</h4>
              <a 
                href="https://maps.google.com/?cid=3988189707950359476" 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn("text-sm hover:text-[#f5d38a] transition-colors underline underline-offset-4", theme === 'dark' ? "text-white/40" : "text-neutral-500")}
              >
                View on Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(
        "w-full max-w-lg p-12 rounded-[40px] backdrop-blur-xl border transition-all",
        theme === 'dark' ? "bg-white/5 border-white/10 shadow-stone-950/50 shadow-2xl" : "bg-black/5 border-black/10 shadow-stone-200 shadow-2xl"
      )}>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-left">
              <label className={cn("block text-[10px] uppercase tracking-widest mb-3", theme === 'dark' ? "text-white/40" : "text-neutral-500")}>Date</label>
              <input
                type="date"
                required
                className={cn(
                  "w-full bg-transparent border rounded-2xl px-4 py-4 transition-colors pointer-events-auto outline-none",
                  theme === 'dark' ? "border-white/10 text-white hover:border-white/30" : "border-black/10 text-neutral-950 hover:border-black/30"
                )}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="text-left">
              <label className={cn("block text-[10px] uppercase tracking-widest mb-3", theme === 'dark' ? "text-white/40" : "text-neutral-500")}>Time</label>
              <select
                className={cn(
                  "w-full bg-transparent border rounded-2xl px-4 py-4 appearance-none outline-none transition-colors",
                  theme === 'dark' ? "border-white/10 text-white focus:border-stone-400" : "border-black/10 text-neutral-950 focus:border-neutral-900"
                )}
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              >
                <option value="" disabled>Select Time</option>
                {['18:00', '19:00', '20:00', '21:00', '22:00'].map(t => (
                  <option key={t} value={t} className={theme === 'dark' ? "bg-stone-900 text-white" : "bg-white text-neutral-950"}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-left">
            <label id="guests-label" className={cn("block text-[10px] uppercase tracking-widest mb-3", theme === 'dark' ? "text-white/40" : "text-neutral-500")}>Guests</label>
            <div className={cn(
              "flex items-center justify-between border rounded-2xl px-8 py-4",
              theme === 'dark' ? "border-white/10" : "border-black/10"
            )} role="group" aria-labelledby="guests-label">
              <button type="button" onClick={() => setFormData({ ...formData, guests: Math.max(1, formData.guests - 1) })} aria-label="Decrease guest count" className="text-amber-600 text-2xl font-light">-</button>
              <span className={cn("text-2xl font-serif", theme === 'dark' ? "text-stone-100" : "text-neutral-950")} aria-live="polite">{formData.guests}</span>
              <button type="button" onClick={() => setFormData({ ...formData, guests: formData.guests + 1 })} aria-label="Increase guest count" className="text-amber-600 text-2xl font-light">+</button>
            </div>
          </div>

          <div className="text-left">
            <label className={cn("block text-[10px] uppercase tracking-widest mb-3", theme === 'dark' ? "text-white/40" : "text-neutral-500")}>Your Name</label>
            <input
              type="text"
              required
              placeholder="Full Name"
              className={cn(
                "w-full bg-transparent border rounded-2xl px-4 py-4 outline-none transition-colors",
                theme === 'dark' ? "border-white/10 text-white focus:border-stone-400" : "border-black/10 text-neutral-950 focus:border-neutral-900"
              )}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="text-left">
            <label className={cn("block text-[10px] uppercase tracking-widest mb-3", theme === 'dark' ? "text-white/40" : "text-neutral-500")}>Email</label>
            <input
              type="email"
              required
              placeholder="email@example.com"
              className={cn(
                "w-full bg-transparent border rounded-2xl px-4 py-4 outline-none transition-colors",
                theme === 'dark' ? "border-white/10 text-white focus:border-stone-400" : "border-black/10 text-neutral-950 focus:border-neutral-900"
              )}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className={cn(
              "w-full font-bold uppercase tracking-widest py-5 rounded-2xl transition-all transform hover:-translate-y-1 shadow-xl",
              theme === 'dark' ? "bg-stone-100 text-black hover:bg-white" : "bg-neutral-950 text-white hover:bg-neutral-800"
            )}
          >
            {lang === 'jp' ? '予約を確定する' : (lang === 'fr' ? 'Confirmer la Réservation' : 'Confirm Reservation')}
          </button>
        </form>
      </div>
    </section>
  );
};

// --- Main App ---

const FeedbackSection = ({ lang, theme }: { lang: Language, theme: Theme }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    foodRating: 5,
    serviceRating: 5,
    ambienceRating: 5,
    comments: '',
    guestName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const t = (TRANSLATIONS[lang] as any).feedback;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const path = 'feedback';
      await addDoc(collection(db, path), {
        ...formData,
        visitDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section className={cn("min-h-screen flex items-center justify-center p-6 transition-colors duration-700", theme === 'dark' ? "bg-black" : "bg-white")}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-10">
          <Sparkles className={cn("mx-auto", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")} size={60} />
          <h2 className={cn("text-5xl font-serif italic", theme === 'dark' ? "text-white" : "text-neutral-950")}>{t.success}</h2>
          <button 
            onClick={() => setIsSuccess(false)} 
            className={cn("uppercase text-[10px] tracking-widest mt-12 block mx-auto underline", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}
          >
            Back to Home
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className={cn("min-h-screen pt-40 pb-24 px-8 max-w-4xl mx-auto transition-colors duration-700", theme === 'dark' ? "bg-black" : "bg-white")}>
      <div className="text-center mb-16">
        <span className={cn("text-[11px] uppercase tracking-[0.6em] font-bold mb-4 block", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}>{t.subtitle}</span>
        <h2 className={cn("text-6xl font-serif italic mb-6 uppercase", theme === 'dark' ? "text-white" : "text-neutral-950")}>{t.title}</h2>
        <p className={cn("max-w-xl mx-auto font-light leading-relaxed", theme === 'dark' ? "text-white/40" : "text-stone-500")}>{t.desc}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="grid md:grid-cols-2 gap-12 text-left">
          {[
            { key: 'rating', label: t.rating },
            { key: 'foodRating', label: t.food },
            { key: 'serviceRating', label: t.service },
            { key: 'ambienceRating', label: t.ambience },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-4">
              <label id={`${key}-label`} className={cn("block text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}>{label}</label>
              <div className="flex gap-4" role="radiogroup" aria-labelledby={`${key}-label`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={(formData as any)[key] === star}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    onClick={() => setFormData({ ...formData, [key]: star })}
                    className={cn(
                      "w-10 h-10 rounded-full border transition-all flex items-center justify-center text-sm font-serif",
                      (formData as any)[key] >= star 
                        ? (theme === 'dark' ? "bg-[#f5d38a] text-black border-[#f5d38a]" : "bg-neutral-900 text-white border-neutral-900") 
                        : (theme === 'dark' ? "border-white/10 text-white/30 hover:border-white/40" : "border-black/10 text-black/30 hover:border-black/40")
                    )}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 text-left">
          <label className={cn("block text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}>{t.comments}</label>
          <textarea
            className={cn(
              "w-full border rounded-2xl p-6 min-h-[200px] outline-none transition-colors",
              theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-[#f5d38a]/50" : "bg-black/5 border-black/10 text-black focus:border-neutral-900/50"
            )}
            placeholder="..."
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          />
        </div>

        <div className="space-y-4 text-left">
          <label className={cn("block text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}>Your Name (Optional)</label>
          <input
            type="text"
            className={cn(
              "w-full border rounded-2xl p-6 outline-none transition-colors",
              theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-[#f5d38a]/50" : "bg-black/5 border-black/10 text-black focus:border-neutral-900/50"
            )}
            placeholder="John Doe"
            value={formData.guestName}
            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full py-6 font-bold uppercase tracking-[0.4em] text-xs transition-all disabled:opacity-50",
            theme === 'dark' ? "bg-[#f5d38a] text-black hover:bg-white" : "bg-neutral-950 text-white hover:bg-neutral-800"
          )}
        >
          {isSubmitting ? "Submitting Reflection..." : t.submit}
        </button>
      </form>
    </section>
  );
};

const FeedbackStatsView = ({ lang, theme }: { lang: Language, theme: Theme }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const t = (TRANSLATIONS[lang] as any).feedback;

  useEffect(() => {
    async function fetchStats() {
      try {
        const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        const feedbacks = snapshot.docs.map(doc => doc.data());
        
        if (feedbacks.length === 0) {
          setStats(null);
          return;
        }

        const totals = feedbacks.reduce((acc: any, curr: any) => ({
          rating: acc.rating + curr.rating,
          food: acc.food + curr.foodRating,
          service: acc.service + curr.serviceRating,
          ambience: acc.ambience + curr.ambienceRating,
        }), { rating: 0, food: 0, service: 0, ambience: 0 });

        setStats({
          avgRating: (totals.rating / feedbacks.length).toFixed(1),
          avgFood: (totals.food / feedbacks.length).toFixed(1),
          avgService: (totals.service / feedbacks.length).toFixed(1),
          avgAmbience: (totals.ambience / feedbacks.length).toFixed(1),
          total: feedbacks.length,
          recent: feedbacks.slice(0, 5)
        });
      } catch (error) {
        console.error("Failed to fetch statistics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className={cn("min-h-screen flex items-center justify-center transition-colors duration-700", theme === 'dark' ? "bg-black" : "bg-white")}><Sparkles className={cn("animate-pulse", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")} /></div>;

  return (
    <section className={cn("min-h-screen pt-40 pb-24 px-8 max-w-7xl mx-auto transition-colors duration-700", theme === 'dark' ? "bg-black" : "bg-white")}>
      <div className="text-center mb-24">
        <span className={cn("text-[11px] uppercase tracking-[0.6em] font-bold mb-4 block", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}>{t.statsSubtitle}</span>
        <h2 className={cn("text-7xl font-serif italic mb-6 uppercase", theme === 'dark' ? "text-white" : "text-neutral-950")}>{t.statsTitle}</h2>
      </div>

      {stats ? (
        <div className="space-y-24">
          <div className="grid md:grid-cols-4 gap-12">
            {[
              { label: t.rating, val: stats.avgRating },
              { label: t.food, val: stats.avgFood },
              { label: t.service, val: stats.avgService },
              { label: t.ambience, val: stats.avgAmbience },
            ].map((s, i) => (
              <div key={i} className={cn("p-8 border rounded-3xl text-center", theme === 'dark' ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5")}>
                <span className={cn("text-[10px] uppercase tracking-widest block mb-4", theme === 'dark' ? "text-white/30" : "text-stone-400")}>{s.label}</span>
                <span className={cn("text-6xl font-serif italic", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-700")}>{s.val}</span>
                <span className={cn("text-xs ml-2", theme === 'dark' ? "text-white/20" : "text-black/20")}>/ 5.0</span>
              </div>
            ))}
          </div>

          <div className="space-y-12 text-left">
            <h3 className={cn("text-2xl italic border-b pb-4", theme === 'dark' ? "text-white border-white/10" : "text-neutral-950 border-black/10")}>Recent Reflections</h3>
            <div className="grid gap-8">
              {stats.recent.map((f: any, i: number) => (
                <div key={i} className={cn("p-8 rounded-2xl space-y-4", theme === 'dark' ? "bg-white/5" : "bg-black/5")}>
                  <div className="flex justify-between items-center">
                    <span className={cn("font-serif italic text-xl", theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800")}>"{f.guestName || 'Anonymous Guest'}"</span>
                    <span className={cn("text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-white/20" : "text-black/20")}>{new Date(f.visitDate).toLocaleDateString()}</span>
                  </div>
                  <p className={cn("italic font-light leading-relaxed", theme === 'dark' ? "text-white/50" : "text-stone-600")}>"{f.comments || 'No comment provided.'}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={cn("text-center uppercase tracking-widest", theme === 'dark' ? "text-white/20" : "text-black/20")}>No data available for aggregation.</div>
      )}
    </section>
  );
};

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<Language>('en');
  const [galleryTab, setGalleryTab] = useState('all');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kimchi-theme');
      return (saved as Theme) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('kimchi-theme', theme);
  }, [theme]);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setView('landing');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const t = TRANSLATIONS[lang];

  return (
    <div className={cn(
      "min-h-screen selection:bg-stone-500/30 transition-colors duration-700",
      theme === 'dark' ? "bg-neutral-950 text-stone-100" : "bg-stone-50 text-neutral-900"
    )}>
      <Navigation 
        currentView={view} 
        setView={setView} 
        lang={lang} 
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main>
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero setView={setView} lang={lang} theme={theme} />
              
              <section className={cn(
                "py-40 px-8 text-center relative overflow-hidden transition-colors duration-700",
                theme === 'dark' ? "bg-black" : "bg-white"
              )}>
                 <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f5d38a]/20 to-transparent" />
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   className="max-w-4xl mx-auto"
                 >
                   <KimchiLogo theme={theme} className="mb-16 opacity-50" />
                   <div className="flex items-center gap-10 justify-center mb-12">
                      <div className="w-12 h-px bg-[#f5d38a]/40" />
                      <span className="text-[#f5d38a] text-[13px] tracking-[0.5em] uppercase font-light">The Master Collection</span>
                      <div className="w-12 h-px bg-[#f5d38a]/40" />
                   </div>
                   <h2 className={cn(
                     "text-6xl md:text-8xl font-serif italic mb-10 leading-tight",
                     theme === 'dark' ? "text-white" : "text-neutral-900"
                   )}>A Symphony of <br/><span className="text-[#f5d38a]">Senses</span></h2>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                      {[
                        "https://images.pexels.com/photos/1055058/pexels-photo-1055058.jpeg?auto=compress&cs=tinysrgb&w=800",
                        "https://images.pexels.com/photos/2092906/pexels-photo-2092906.jpeg?auto=compress&cs=tinysrgb&w=800",
                        "https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=800",
                        "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800"
                      ].map((url, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="aspect-[3/4] rounded-sm overflow-hidden border border-white/10"
                        >
                           <img src={url} className="w-full h-full object-cover grayscale-0 transition-transform duration-[2s] hover:scale-110" alt="Restaurant Dish" />
                        </motion.div>
                      ))}
                   </div>
                   <p className={cn(
                     "text-lg font-light leading-relaxed max-w-2xl mx-auto mb-16",
                     theme === 'dark' ? "text-white/40" : "text-stone-500"
                   )}>
                      Explore our curated selection of tapas and cocktails, where every bite is a narrative of heritage and innovation.
                   </p>
                   <button onClick={() => setView('menu')} className={cn(
                     "pb-2 text-[11px] tracking-[0.4em] uppercase font-bold transition-all border-b",
                     theme === 'dark' ? "text-[#f5d38a] border-[#f5d38a]/30 hover:text-white hover:border-white" : "text-amber-700 border-amber-700/30 hover:text-black hover:border-black"
                   )}>
                      Discover the Full Menu
                   </button>
                 </motion.div>
              </section>
            </motion.div>
          )}

          {view === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <MenuSection lang={lang} theme={theme} />
              <section className={cn(
                "py-16 px-6 text-center transition-colors duration-700",
                theme === 'dark' ? "bg-neutral-900 text-white" : "bg-stone-100 text-neutral-900"
              )}>
                <h2 className="text-4xl font-bold mb-4 font-serif italic">Our Story</h2>
                <p className={cn("max-w-2xl mx-auto", theme === 'dark' ? "text-gray-400" : "text-stone-600")}>
                  Inspired by the vibrant streets of Seoul, Seoul Flame brings authentic Korean
                  flavors to your table. From sizzling BBQ to traditional recipes, we celebrate
                  Korean culture through food.
                </p>
              </section>
              <section className={cn(
                "py-16 px-6 text-center transition-colors duration-700",
                theme === 'dark' ? "bg-black text-white" : "bg-white text-neutral-950"
              )}>
                <h2 className="text-4xl font-bold mb-6 font-serif italic">Contact Us</h2>
                <p className="mb-2">📍 Kigali City Center</p>
                <p className="mb-2">📞 +250 795465143</p>
                <p className="mb-2">🕒 Open Daily: 10AM – 10PM</p>
              </section>
            </motion.div>
          )}

          {view === 'reservation' && (
            <motion.div key="reservation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ReservationSection lang={lang} theme={theme} />
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AuthPage mode="login" onAuthSuccess={handleAuthSuccess} lang={lang} theme={theme} />
            </motion.div>
          )}

          {(view === 'about' || view === 'events' || view === 'gallery' || view === 'contact') && (
            <motion.div 
              key={view} 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -30 }}
              className={cn(
                "min-h-screen pt-40 px-6 flex flex-col items-center transition-colors duration-700",
                theme === 'dark' ? "bg-black" : "bg-stone-50"
              )}
            >
               <KimchiLogo theme={theme} className="mb-20 opacity-20 scale-75" />
               <div className="max-w-6xl w-full text-center">
                  <span className={cn(
                    "text-[12px] tracking-[0.6em] uppercase font-bold mb-6 block",
                    theme === 'dark' ? "text-[#f5d38a]" : "text-amber-700"
                  )}>
                    {(TRANSLATIONS[lang] as any)[view].title}
                  </span>
                  <h2 className={cn(
                    "text-6xl md:text-8xl font-serif italic mb-12 capitalize",
                    theme === 'dark' ? "text-white" : "text-neutral-950"
                  )}>{view}</h2>
                  
                  {view === 'gallery' && (
                    <div className="space-y-12 pb-40">
                      <p className={cn(
                        "text-xl md:text-2xl font-light leading-relaxed max-w-2xl mx-auto italic mb-12",
                        theme === 'dark' ? "text-white/50" : "text-stone-500"
                      )}>
                        "{(t as any).gallery.content}"
                      </p>

                      <div className="flex flex-wrap justify-center gap-6 mb-12">
                        {GALLERY_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setGalleryTab(cat)}
                            className={cn(
                              "text-[10px] uppercase tracking-[0.3em] font-bold px-6 py-2 transition-all border rounded-full",
                              galleryTab === cat
                                ? (theme === 'dark' ? "bg-[#f5d38a] text-black border-[#f5d38a]" : "bg-amber-800 text-white border-amber-800")
                                : (theme === 'dark' ? "text-white/40 border-white/10 hover:border-white/30" : "text-black/40 border-black/10 hover:border-black/30")
                            )}
                          >
                            {(t as any).menu[cat] || cat.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {GALLERY_IMAGES.filter(img => galleryTab === 'all' || img.category === galleryTab).map((img, i) => (
                          <motion.div 
                            key={img.id} 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                              "aspect-video md:aspect-[4/5] overflow-hidden group rounded-sm relative shadow-2xl transition-all duration-700 hover:shadow-amber-500/10",
                              theme === 'dark' ? "bg-white/5" : "bg-black/5"
                            )}
                          >
                             <img 
                               src={img.src} 
                               className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" 
                               alt="Gallery Item" 
                               loading="lazy"
                             />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-[10px] uppercase tracking-[0.5em] font-light border-b border-white/30 pb-2">
                                  {img.category}
                                </span>
                             </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {view === 'contact' && (
                    <div className="flex flex-col items-center gap-16 pb-40">
                       <div className="grid md:grid-cols-3 gap-20 w-full mb-10">
                          <div className="text-left space-y-6">
                             <div>
                               <span className={cn(
                                 "text-[10px] uppercase tracking-widest block mb-2 font-bold",
                                 theme === 'dark' ? "text-[#f5d38a]" : "text-amber-700"
                               )}>Address</span>
                               <p className={cn(
                                 "text-lg font-light leading-relaxed",
                                 theme === 'dark' ? "text-white" : "text-neutral-900"
                               )}>
                                 Kigali City Center, Rwanda<br/>
                                 KN 4 Ave, Building 12
                               </p>
                             </div>
                             <a 
                               href="https://maps.google.com/?cid=3988189707950359476" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className={cn(
                                 "inline-block text-sm transition-colors underline underline-offset-4 tracking-wide",
                                 theme === 'dark' ? "text-[#f5d38a] hover:text-white" : "text-amber-700 hover:text-black"
                               )}
                             >
                               Get Directions
                             </a>
                          </div>
                          <div className="text-left">
                             <span className={cn(
                               "text-[10px] uppercase tracking-widest block mb-2 font-bold",
                               theme === 'dark' ? "text-[#f5d38a]" : "text-amber-700"
                             )}>Reservations</span>
                             <p className={cn(
                               "text-3xl font-serif italic",
                               theme === 'dark' ? "text-white" : "text-neutral-900"
                             )}>+250 788 000 000</p>
                             <p className={cn(
                               "text-sm mt-2",
                               theme === 'dark' ? "text-white/40" : "text-neutral-400"
                             )}>booking@kimchi.rw</p>
                          </div>
                          <div className="text-left">
                             <span className={cn(
                               "text-[10px] uppercase tracking-widest block mb-2 font-bold",
                               theme === 'dark' ? "text-[#f5d38a]" : "text-amber-700"
                             )}>Social</span>
                             <div className="flex gap-4 mt-2">
                                <a href="#" className={cn(
                                  "p-3 border rounded-full transition-all",
                                  theme === 'dark' ? "border-white/10 text-white hover:bg-white hover:text-black" : "border-black/10 text-black hover:bg-black hover:text-white"
                                )}><Instagram size={18} /></a>
                                <a href="#" className={cn(
                                  "p-3 border rounded-full transition-all",
                                  theme === 'dark' ? "border-white/10 text-white hover:bg-white hover:text-black" : "border-black/10 text-black hover:bg-black hover:text-white"
                                )}><Twitter size={18} /></a>
                             </div>
                          </div>
                       </div>

                       <div className={cn(
                         "w-full max-w-2xl border p-10 rounded-sm",
                         theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-black/10 shadow-xl"
                       )}>
                          <h3 className={cn(
                            "text-2xl font-serif italic mb-8 text-left",
                            theme === 'dark' ? "text-white" : "text-neutral-900"
                          )}>Send us a Message</h3>
                          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                             <div className="grid grid-cols-2 gap-6">
                                <input type="text" placeholder="Name" className={cn(
                                  "bg-transparent border-b py-3 outline-none transition-all",
                                  theme === 'dark' ? "border-white/20 text-white focus:border-[#f5d38a]" : "border-black/20 text-black focus:border-amber-700"
                                )} />
                                <input type="email" placeholder="Email" className={cn(
                                  "bg-transparent border-b py-3 outline-none transition-all",
                                  theme === 'dark' ? "border-white/20 text-white focus:border-[#f5d38a]" : "border-black/20 text-black focus:border-amber-700"
                                )} />
                             </div>
                             <textarea placeholder="Message" rows={4} className={cn(
                               "w-full bg-transparent border-b py-3 outline-none transition-all resize-none",
                               theme === 'dark' ? "border-white/20 text-white focus:border-[#f5d38a]" : "border-black/20 text-black focus:border-amber-700"
                             )}></textarea>
                             <button className={cn(
                               "w-full py-4 border uppercase text-[10px] tracking-widest font-bold transition-all",
                               theme === 'dark' ? "border-[#f5d38a] text-[#f5d38a] hover:bg-[#f5d38a] hover:text-black" : "border-amber-700 text-amber-700 hover:bg-amber-700 hover:text-white"
                             )}>Submit Inquiry</button>
                          </form>
                       </div>

                       <div className="flex gap-8 mt-10">
                         <button onClick={() => setView('reservation')} className={cn(
                           "px-12 py-4 border uppercase text-[10px] tracking-widest font-bold transition-all",
                           theme === 'dark' ? "border-[#f5d38a] text-[#f5d38a] hover:bg-[#f5d38a] hover:text-black" : "border-amber-700 text-amber-700 hover:bg-amber-700 hover:text-white"
                         )}>
                            Book Your Experience
                         </button>
                         <button onClick={() => setView('feedback')} className={cn(
                           "px-12 py-4 border uppercase text-[10px] tracking-widest font-bold transition-all",
                           theme === 'dark' ? "border-white/20 text-white/60 hover:bg-white hover:text-black" : "border-black/20 text-black/60 hover:bg-black hover:text-white"
                         )}>
                            Share Your Feedback
                         </button>
                       </div>
                    </div>
                  )}

                  {view === 'about' && (
                    <div className="pb-40 max-w-5xl mx-auto text-left space-y-40">
                       <div className="grid md:grid-cols-2 gap-20 items-center">
                          <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                            className="space-y-8"
                          >
                             <span className={cn(
                               "text-[10px] tracking-[0.4em] uppercase font-bold opacity-40",
                               theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800"
                             )}>01 — The Genesis</span>
                             <h3 className={cn(
                               "text-5xl font-serif italic leading-tight",
                               theme === 'dark' ? "text-white" : "text-neutral-900"
                             )}>{(TRANSLATIONS[lang] as any)[view].history_title}</h3>
                             <p className={cn(
                               "text-lg font-light leading-relaxed",
                               theme === 'dark' ? "text-white/50" : "text-stone-500"
                             )}>
                               {(TRANSLATIONS[lang] as any)[view].history_content}
                             </p>
                          </motion.div>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2 }}
                            className={cn(
                              "aspect-[4/5] overflow-hidden border rounded-sm",
                              theme === 'dark' ? "border-white/10" : "border-black/10"
                            )}
                          >
                             <img 
                                src="https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1200"
                                className="w-full h-full object-cover grayscale-0 brightness-100 transition-all duration-1000"
                                alt="Restaurant History"
                             />
                          </motion.div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-20 items-center">
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2 }}
                            className={cn(
                              "order-2 md:order-1 aspect-[4/5] overflow-hidden border rounded-sm",
                              theme === 'dark' ? "border-white/10" : "border-black/10"
                            )}
                          >
                             <img 
                                src="https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=1200"
                                className="w-full h-full object-cover grayscale-0 brightness-100 transition-all duration-1000"
                                alt="Culinary Philosophy"
                             />
                          </motion.div>
                          <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                            className="order-1 md:order-2 space-y-8"
                          >
                             <span className={cn(
                               "text-[10px] tracking-[0.4em] uppercase font-bold opacity-40",
                               theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800"
                             )}>02 — The Craft</span>
                             <h3 className={cn(
                               "text-5xl font-serif italic leading-tight",
                               theme === 'dark' ? "text-white" : "text-neutral-900"
                             )}>{(TRANSLATIONS[lang] as any)[view].philosophy_title}</h3>
                             <p className={cn(
                               "text-lg font-light leading-relaxed",
                               theme === 'dark' ? "text-white/50" : "text-stone-500"
                             )}>
                               {(TRANSLATIONS[lang] as any)[view].philosophy_content}
                             </p>
                             <div className="pt-4">
                                <button onClick={() => setView('menu')} className={cn(
                                  "text-[10px] tracking-widest uppercase font-bold border-b pb-1 transition-all",
                                  theme === 'dark' ? "text-[#f5d38a] border-[#f5d38a]/40 hover:text-white hover:border-white" : "text-amber-700 border-amber-700/40 hover:text-black hover:border-black"
                                )}>Explore the Palette</button>
                             </div>
                          </motion.div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-20 items-center">
                          <motion.div 
                             initial={{ opacity: 0, x: -30 }}
                             whileInView={{ opacity: 1, x: 0 }}
                             transition={{ duration: 1 }}
                             className="space-y-8"
                          >
                             <span className={cn(
                               "text-[10px] tracking-[0.4em] uppercase font-bold opacity-40",
                               theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800"
                             )}>03 — The Visionary</span>
                             <h3 className={cn(
                               "text-5xl font-serif italic leading-tight",
                               theme === 'dark' ? "text-white" : "text-neutral-900"
                             )}>{(TRANSLATIONS[lang] as any)[view].chef_title}</h3>
                             <p className={cn(
                               "text-lg font-light leading-relaxed",
                               theme === 'dark' ? "text-white/50" : "text-stone-500"
                             )}>
                               {(TRANSLATIONS[lang] as any)[view].chef_content}
                             </p>
                          </motion.div>
                          <motion.div 
                             initial={{ opacity: 0, scale: 0.95 }}
                             whileInView={{ opacity: 1, scale: 1 }}
                             transition={{ duration: 1.2 }}
                             className={cn(
                               "aspect-[4/5] overflow-hidden border rounded-sm relative group",
                               theme === 'dark' ? "border-white/10" : "border-black/10"
                             )}
                          >
                             <img 
                                src="https://images.pexels.com/photos/2102934/pexels-photo-2102934.jpeg?auto=compress&cs=tinysrgb&w=1200"
                                className="w-full h-full object-cover grayscale-0 brightness-105 transition-all duration-1000"
                                alt="Chef Ji-Hoon Kim"
                             />
                             <div className="absolute bottom-8 left-8">
                                <span className="text-white font-serif italic text-2xl">Ji-Hoon Kim</span>
                                <div className={cn(
                                  "h-px w-12 mt-2",
                                  theme === 'dark' ? "bg-[#f5d38a]" : "bg-amber-700"
                                )} />
                             </div>
                          </motion.div>
                       </div>

                       <div className="pt-20 text-center w-full">
                          <button onClick={() => setView('landing')} className={cn(
                            "transition-all text-[10px] tracking-widest uppercase py-4 border-b",
                            theme === 'dark' ? "text-white/30 hover:text-[#f5d38a] border-white/10" : "text-black/30 hover:text-amber-700 border-black/10"
                          )}>Return to Exploration</button>
                       </div>
                    </div>
                  )}

                  {view === 'events' && (
                    <div className="pb-40 max-w-5xl mx-auto space-y-20">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "w-full aspect-[21/9] rounded-2xl overflow-hidden border relative",
                          theme === 'dark' ? "border-white/10" : "border-black/5"
                        )}
                      >
                         <img 
                           src="https://images.pexels.com/photos/2313686/pexels-photo-2313686.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                           className="w-full h-full object-cover grayscale-0 brightness-90 transition-all duration-1000"
                           alt="Events Atmosphere"
                         />
                         <div className="absolute inset-0 bg-black/20" />
                      </motion.div>

                      <div className="max-w-4xl mx-auto">
                        <p className={cn(
                          "text-xl md:text-3xl font-light leading-relaxed mb-10 italic text-center",
                          theme === 'dark' ? "text-white/70" : "text-stone-600"
                        )}>
                          "{(TRANSLATIONS[lang] as any)[view].content}"
                        </p>
                        <div className="grid md:grid-cols-2 gap-8 text-left mt-20">
                         <div className={cn(
                           "p-8 border space-y-4",
                           theme === 'dark' ? "border-white/10 bg-white/5" : "border-black/5 bg-black/5"
                         )}>
                            <h3 className={cn(
                              "text-xl font-serif",
                              theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800"
                            )}>Private Dinners</h3>
                            <p className={cn(
                              "text-sm",
                              theme === 'dark' ? "text-white/40" : "text-stone-500"
                            )}>Host your intimate gatherings in our bespoke dining halls.</p>
                         </div>
                         <div className={cn(
                           "p-8 border space-y-4",
                           theme === 'dark' ? "border-white/10 bg-white/5" : "border-black/5 bg-black/5"
                         )}>
                            <h3 className={cn(
                              "text-xl font-serif",
                              theme === 'dark' ? "text-[#f5d38a]" : "text-amber-800"
                            )}>Cultural Nights</h3>
                            <p className={cn(
                              "text-sm",
                              theme === 'dark' ? "text-white/40" : "text-stone-500"
                            )}>Join us for monthly celebrations of Korean arts and music.</p>
                         </div>
                      </div>
                      <button onClick={() => setView('landing')} className={cn(
                        "transition-all text-[10px] tracking-widest uppercase py-4 border-b mt-20",
                        theme === 'dark' ? "text-white/30 hover:text-[#f5d38a] border-white/10" : "text-black/30 hover:text-amber-700 border-black/10"
                      )}>Return to Exploration</button>
                    </div>
                  </div>
                )}
               </div>
            </motion.div>
          )}

          {view === 'feedback' && <FeedbackSection lang={lang} theme={theme} />}
          {view === 'feedback-stats' && <FeedbackStatsView lang={lang} theme={theme} />}
        </AnimatePresence>
      </main>

      <Footer lang={lang} theme={theme} setView={setView} />
    </div>
  );
}
