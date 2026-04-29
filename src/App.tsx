import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu as MenuIcon, X, LogIn, ChevronRight, Play, UtensilsCrossed, Calendar, Sparkles, User, LogOut, Search, Globe, Moon, Sun, Instagram, Twitter, MapPin } from 'lucide-react';
import { cn } from './lib/utils';
import { MENU_ITEMS, MenuItem } from './constants';
import { getSensoryRecommendation } from './services/geminiService';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      btn: "BOOK A TABLE", 
      menuBtn: "OUR MENU" 
    },
    menu: { subtitle: "THE SELECTION", title: "Curated Fare.", all: "ALL", starter: "TAPAS", main: "MAIN", dessert: "DESSERT", drink: "COCKTAILS" },
    discovery: { subtitle: "Innovation Suite", title: "Sensory Algorithm.", desc: "Describe a mood, a feeling, or an occasion, and our Intelligence will orchestrate a non-repeatable dining journey.", placeholder: "e.g. 'Starlit city memories'" },
    reservation: { title: "Secure Your Table", desc: "Experience KIMCHI at its finest. We recommend booking at least two weeks in advance." },
    auth: { login: "Authentication", signup: "Registration", email: "Email Address", code: "Secure Access Code", btn: "Authenticate Access" },
    footer: { essence: "AN EXQUISITE CULINARY SAGA - TAPAS AND COCKTAILS" },
    about: { title: "OUR STORY", content: "Born from a passion for excellence, KIMCHI brings together vibrant spices and delicate techniques to redefine the modern dining experience." },
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
      btn: "RÉSERVER UNE TABLE", 
      menuBtn: "NOTRE CARTE" 
    },
    menu: { subtitle: "LA SÉLECTION", title: "Plats Curatés.", all: "TOUT", starter: "TAPAS", main: "PLAT", dessert: "DESSERT", drink: "COCKTAILS" },
    discovery: { subtitle: "Suite Innovation", title: "Algorithme Sensoriel.", desc: "Décrivez une humeur, un sentiment ou une occasion, et notre Intelligence orchestrera un voyage culinaire unique.", placeholder: "ex. 'Souvenirs de ville étoilée'" },
    reservation: { title: "Réserver Votre Table", desc: "Découvrez KIMCHI sous son meilleur jour. Nous recommandons de réserver au moins deux semaines à l'avance." },
    auth: { login: "Authentification", signup: "Inscription", email: "Adresse E-mail", code: "Code d'Accès Sécurisé", btn: "Authentifier l'Accès" },
    footer: { essence: "UNE SAGA CULINAIRE EXQUISE - TAPAS ET COCKTAILS" },
    about: { title: "NOTRE HISTOIRE", content: "Née d'une passion pour l'excellence, KIMCHI réunit des épices vibrantes et des techniques délicates pour redéfinir l'expérience culinaire moderne." },
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
      btn: "テーブルを予約する", 
      menuBtn: "メニューを見る" 
    },
    menu: { subtitle: "セレクション", title: "厳選された料理", all: "すべて", starter: "タパス", main: "メイン", dessert: "デザート", drink: "カクテル" },
    discovery: { subtitle: "イノベーションスイート", title: "感覚アルゴリズム", desc: "気分や感情、場面を伝えてください。私たちのAIがあなただけの特別な料理体験を演出します。", placeholder: "例：'星空の街の思い出'" },
    reservation: { title: "お席を確保する", desc: "KIMCHIの最高のおもてなしをご体験ください。2週間前までのご予約をお勧めします。" },
    auth: { login: "認証", signup: "登録", email: "メールアドレス", code: "セキュリティコード", btn: "アクセスを認証" },
    footer: { essence: "絶妙な料理の佐賀 - タパスとカクテル" },
    about: { title: "私たちの物語", content: "卓越した情熱から生まれたKIMCHIは、活気に満ちたスパイスと繊細な技術を融合させ、現代のダイニング体験を再定義します。" },
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
}: { 
  currentView: View, 
  setView: (v: View) => void, 
  lang: Language,
  setLang: (l: Language) => void,
  theme: Theme,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
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
      "fixed top-0 left-0 right-0 z-50 transition-all duration-700 px-6 py-6 md:px-12",
      isScrolled ? "bg-black/95 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent"
    )} aria-label="Main Navigation">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <button onClick={() => setView('landing')} className="flex items-center gap-2 group" aria-label="Go to Seoul Flame Homepage">
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
                "text-[10px] tracking-[0.2em] font-bold transition-all hover:text-[#f5d38a]",
                (currentView === item.id || (currentView === 'landing' && item.id === 'home')) ? "text-[#f5d38a]" : "text-white/50"
              )}
            >
              {item.label}
            </button>
          ))}

          <div className="flex items-center gap-4 border-l border-white/10 pl-10 ml-4" role="group" aria-label="Language Selector">
            {(['en', 'fr', 'jp'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                aria-label={`Change language to ${l === 'en' ? 'English' : l === 'fr' ? 'French' : 'Japanese'}`}
                className={cn(
                  "text-[9px] font-bold transition-all uppercase",
                  lang === l ? "text-[#f5d38a]" : "text-white/30 hover:text-white"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setView('reservation')}
          aria-label={t.book}
          className="px-6 py-2.5 border border-[#f5d38a]/50 text-[#f5d38a] rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#f5d38a] hover:text-black transition-all"
        >
          {t.book}
        </button>
      </div>
    </nav>
  );
};

const Hero = ({ lang, theme, setView }: { lang: Language, theme: Theme, setView: (v: View) => void }) => {
  const t = TRANSLATIONS[lang].hero;
  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fm=webp&fit=crop&w=1920&q=80" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
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
          style={{ filter: 'brightness(0.7)' }}
          onCanPlay={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <source src="https://videos.pexels.com/video-files/857195/857195-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
          Seoul Flame
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-6">
          Authentic Korean BBQ & Street Food Experience
        </p>

        <div className="flex gap-4">
          <button 
            onClick={() => setView('menu')}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-semibold transition shadow-xl hover:scale-105 active:scale-95"
          >
            View Menu
          </button>
          <button 
            onClick={() => setView('reservation')}
            className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-black transition shadow-xl hover:scale-105 active:scale-95"
          >
            Book Table
          </button>
        </div>
      </motion.div>
    </section>
  );
};

const AuthPage = ({ mode: initialMode, onAuthSuccess, lang, theme }: { mode: 'login' | 'signup', onAuthSuccess: (user: any) => void, lang: Language, theme: Theme }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const t = TRANSLATIONS[lang].auth;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthSuccess({ email, name: email.split('@')[0] });
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
          <h2 className={cn("text-6xl italic mb-12", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>
            {mode === 'login' ? 'Welcome Back' : 'Join the Inner Circle'}
          </h2>

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
          src={mode === 'login' ? "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fm=webp&fit=crop&w=1200&q=80" : "https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?auto=format&fm=webp&fit=crop&w=1200&q=80"}
          alt="Atmosphere" 
          className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-1000"
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
  const [loading, setLoading] = useState(false);
  const t = TRANSLATIONS[lang].discovery;

  const handleDiscovery = async () => {
    if (!prompt) return;
    setLoading(true);
    const result = await getSensoryRecommendation(prompt);
    setRecommendation(result);
    setLoading(false);
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
                "p-12 rounded-[40px] space-y-12 backdrop-blur-xl border",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
              )}
            >
              <div className="text-left">
                <span className={cn("uppercase tracking-widest text-[10px] mb-6 block opacity-30", theme === 'dark' ? "text-white" : "text-black")}>Atmospheric Setting</span>
                <p className={cn("italic text-xl leading-relaxed font-light", theme === 'dark' ? "text-white/80" : "text-neutral-800")}>"{recommendation.atmosphere}"</p>
              </div>

              <div className="space-y-8 text-left">
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
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/30 max-w-sm leading-relaxed text-center md:text-left">{t.essence}</p>
        </div>
        <nav className="flex flex-col items-center md:items-end gap-8" aria-label="Footer Navigation">
           <div className="flex gap-8 text-[11px] uppercase tracking-[0.3em] font-bold text-stone-500 items-center">
             <motion.button 
               whileHover={{ y: -2, color: '#f5d38a' }}
               onClick={() => setView('feedback')} 
               className="transition-colors"
               aria-label="Go to Feedback Section"
             >
               Feedback
             </motion.button>
             <motion.button 
               whileHover={{ y: -2, color: '#f5d38a' }}
               onClick={() => setView('feedback-stats')} 
               className="transition-colors"
               aria-label="View Service Quality Statistics"
             >
               Service Quality
             </motion.button>
             <motion.a 
               whileHover={{ scale: 1.2, y: -2, color: '#f5d38a' }}
               href="https://instagram.com/kimchi.rw?igshid=YmMyMTA2M2Y=" 
               target="_blank" 
               rel="noopener noreferrer" 
               aria-label="Follow us on Instagram" 
               className="transition-all flex items-center gap-1"
             >
               <Instagram size={14} />
             </motion.a>
             <motion.a 
               whileHover={{ scale: 1.2, y: -2, color: '#f5d38a' }}
               href="https://www.threads.com/@kimchi.rw?xmt=AQF0GbNfkZzXfDU3SgGpUjliliuD2rzVOJrAjm1IkdGjW0Q" 
               target="_blank" 
               rel="noopener noreferrer" 
               aria-label="Follow us on Threads" 
               className="transition-all flex items-center gap-1"
             >
               <Twitter size={14} />
             </motion.a>
             <motion.a 
               whileHover={{ scale: 1.2, y: -2, color: '#f5d38a' }}
               href="https://maps.google.com/?cid=3988189707950359476" 
               target="_blank" 
               rel="noopener noreferrer" 
               aria-label="Find us on Google Maps" 
               className="transition-all flex items-center gap-1"
             >
               <MapPin size={14} />
             </motion.a>
           </div>
           <div className="text-[10px] uppercase tracking-[0.2em] text-stone-700">
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
  const t = TRANSLATIONS[lang].menu;

  const categories = ['all', 'starter', 'main', 'dessert', 'drink'];

  const handleGenerateArt = async (item: MenuItem) => {
    setGeneratingIds(prev => new Set(prev).add(item.id));
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Hyper-artistic, fine-dining plating of a dish called "${item.name}". Description: ${item.description}. Elegant composition, cinematic lighting, shallow depth of field, vibrant colors, photorealistic macro photography, stone background.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedImages(prev => ({ ...prev, [item.id]: imageUrl }));
          break;
        }
      }
    } catch (error) {
      console.error("Art generation failed:", error);
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const filteredMenu = activeCategory === 'all' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === activeCategory);

  return (
    <section className="relative min-h-screen pt-40 pb-24 px-8">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-10 brightness-[0.2]"
        >
          <source src="https://player.vimeo.com/external/369796016.sd.mp4?s=3465b83907a974b94fcf900ee3b3e70d45330364&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-[11px] uppercase tracking-[0.6em] font-bold text-[#f5d38a] mb-6 block">{t.subtitle}</span>
          <h2 className="text-8xl font-serif italic text-white flex flex-col items-center gap-4">
             {t.title.split('.')[0]}
             <div className="w-24 h-px bg-[#f5d38a]/40" />
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
                activeCategory === cat ? "text-[#f5d38a]" : "text-white/40 hover:text-white"
              )}
            >
              {(t as any)[cat]}
              {activeCategory === cat && <motion.div layoutId="menu_underline" className="absolute bottom-0 left-0 right-0 h-px bg-[#f5d38a]" />}
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
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden mb-8 border border-white/5 bg-white/5">
                <img 
                  src={generatedImages[item.id] || `${item.image}&fm=webp`} 
                  alt={item.name} 
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110",
                    generatingIds.has(item.id) ? "opacity-30 blur-2xl" : "opacity-100"
                  )}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                     onClick={() => handleGenerateArt(item)}
                     disabled={generatingIds.has(item.id)}
                     className="p-6 bg-[#f5d38a] text-black rounded-full shadow-2xl hover:scale-110 transition-transform disabled:opacity-50"
                     title="Re-visualize with AI"
                   >
                     {generatingIds.has(item.id) ? (
                       <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" />
                     ) : (
                       <Sparkles size={24} />
                     )}
                   </button>
                </div>
                {generatingIds.has(item.id) && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <span className="text-[10px] text-[#f5d38a] uppercase tracking-[0.4em] animate-pulse">Designing Plate...</span>
                   </div>
                )}
              </div>
              <div className="flex justify-between items-end mb-3">
                <h3 className="text-3xl font-serif italic text-white">{item.name}</h3>
                <span className="text-[#f5d38a] font-mono text-sm">${item.price}</span>
              </div>
              <p className="text-sm font-light leading-relaxed text-white/40 mb-6">
                {item.description}
              </p>
              <div className="flex gap-2">
                 {item.tags?.map(tag => (
                   <span key={tag} className="text-[9px] uppercase tracking-widest text-[#f5d38a]/40 border border-[#f5d38a]/10 px-2 py-1 rounded-sm">{tag}</span>
                 ))}
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
      <section className="min-h-screen pt-32 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <div className={cn("w-24 h-24 rounded-full border flex items-center justify-center mx-auto mb-12", theme === 'dark' ? "border-stone-100" : "border-neutral-900")}>
            <Sparkles className={theme === 'dark' ? "text-stone-100" : "text-neutral-900"} size={40} />
          </div>
          <h2 className={cn("text-6xl italic", theme === 'dark' ? "text-stone-100" : "text-neutral-900")}>
            {lang === 'jp' ? '予約が完了しました' : (lang === 'fr' ? 'Réservation Confirmée' : 'Reservation Confirmed')}
          </h2>
          <p className={cn("text-xl max-w-md mx-auto", theme === 'dark' ? "text-white/50" : "text-neutral-500")}>
            {lang === 'jp' ? `${formData.name}様、確認メールを送信しました。お越しをお待ちしております。` : 
             (lang === 'fr' ? `Une confirmation a été envoyée. Nous avons hâte de vous recevoir, ${formData.name}.` : 
             `A confirmation has been sent to your email. We look forward to hosting you, ${formData.name}.`)}
          </p>
          <button
             onClick={() => setSubmitted(false)}
             className={cn("uppercase tracking-[0.3em] text-xs font-bold pt-12 block mx-auto underline underline-offset-8", theme === 'dark' ? "text-stone-100" : "text-neutral-950")}
          >
            {lang === 'jp' ? '別の予約をする' : (lang === 'fr' ? 'Faire une autre réservation' : 'Make Another Reservation')}
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-40 pb-24 px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-24 items-center justify-center">
      <div className="max-w-xl text-left">
        <span className="text-[11px] uppercase tracking-[0.6em] font-bold text-[#f5d38a] mb-6 block">
          {t.title ? "BOOKING" : "RESERVATIONS"}
        </span>
        <h2 className="text-7xl font-serif italic text-white mb-10 leading-tight">
          {t.title.split(' ')[0]} <br /><span className="text-[#f5d38a]">{t.title.split(' ').slice(1).join(' ')}</span>
        </h2>
        <p className="text-white/40 text-lg font-light leading-relaxed mb-12">
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
      <section className="min-h-screen flex items-center justify-center p-6 bg-black">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-10">
          <Sparkles className="mx-auto text-[#f5d38a]" size={60} />
          <h2 className="text-5xl font-serif italic text-white">{t.success}</h2>
          <button onClick={() => setIsSuccess(false)} className="text-[#f5d38a] uppercase text-[10px] tracking-widest mt-12 block mx-auto underline">Back to Home</button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-40 pb-24 px-8 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <span className="text-[11px] uppercase tracking-[0.6em] font-bold text-[#f5d38a] mb-4 block">{t.subtitle}</span>
        <h2 className="text-6xl font-serif italic text-white mb-6 uppercase">{t.title}</h2>
        <p className="text-white/40 max-w-xl mx-auto font-light leading-relaxed">{t.desc}</p>
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
              <label id={`${key}-label`} className="block text-[10px] uppercase tracking-widest text-[#f5d38a]">{label}</label>
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
                      (formData as any)[key] >= star ? "bg-[#f5d38a] text-black border-[#f5d38a]" : "border-white/10 text-white/30 hover:border-white/40"
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
          <label className="block text-[10px] uppercase tracking-widest text-[#f5d38a]">{t.comments}</label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white min-h-[200px] outline-none focus:border-[#f5d38a]/50 transition-colors"
            placeholder="..."
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          />
        </div>

        <div className="space-y-4 text-left">
          <label className="block text-[10px] uppercase tracking-widest text-[#f5d38a]">Your Name (Optional)</label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-[#f5d38a]/50 transition-colors"
            placeholder="John Doe"
            value={formData.guestName}
            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-6 bg-[#f5d38a] text-black font-bold uppercase tracking-[0.4em] text-xs transition-all hover:bg-white disabled:opacity-50"
        >
          {isSubmitting ? "Submitting Reflection..." : t.submit}
        </button>
      </form>
    </section>
  );
};

const FeedbackStatsView = ({ lang }: { lang: Language }) => {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Sparkles className="animate-pulse text-[#f5d38a]" /></div>;

  return (
    <section className="min-h-screen pt-40 pb-24 px-8 max-w-7xl mx-auto">
      <div className="text-center mb-24">
        <span className="text-[11px] uppercase tracking-[0.6em] font-bold text-[#f5d38a] mb-4 block">{t.statsSubtitle}</span>
        <h2 className="text-7xl font-serif italic text-white mb-6 uppercase">{t.statsTitle}</h2>
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
              <div key={i} className="p-8 border border-white/10 bg-white/5 rounded-3xl text-center">
                <span className="text-[10px] text-white/30 uppercase tracking-widest block mb-4">{s.label}</span>
                <span className="text-6xl font-serif italic text-[#f5d38a]">{s.val}</span>
                <span className="text-white/20 text-xs ml-2">/ 5.0</span>
              </div>
            ))}
          </div>

          <div className="space-y-12 text-left">
            <h3 className="text-2xl italic text-white border-b border-white/10 pb-4">Recent Reflections</h3>
            <div className="grid gap-8">
              {stats.recent.map((f: any, i: number) => (
                <div key={i} className="p-8 bg-white/5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#f5d38a] font-serif italic text-xl">"{f.guestName || 'Anonymous Guest'}"</span>
                    <span className="text-white/20 text-[10px] uppercase tracking-widest">{new Date(f.visitDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white/50 italic font-light leading-relaxed">"{f.comments || 'No comment provided.'}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-white/20 uppercase tracking-widest">No data available for aggregation.</div>
      )}
    </section>
  );
};

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setView('landing');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className={cn(
      "min-h-screen selection:bg-stone-500/30 transition-colors duration-700",
      theme === 'dark' ? "bg-dark text-stone-100" : "bg-stone-50 text-neutral-900"
    )}>
      <Navigation 
        currentView={view} 
        setView={setView} 
        lang={lang} 
        setLang={setLang}
        theme={theme}
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
              
              <section className="bg-black py-40 px-8 text-center relative overflow-hidden">
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
                   <h2 className="text-6xl md:text-8xl font-serif italic text-white mb-10 leading-tight">A Symphony of <br/><span className="text-[#f5d38a]">Senses</span></h2>
                   <p className="text-white/40 text-lg font-light leading-relaxed max-w-2xl mx-auto mb-16">
                      Explore our curated selection of tapas and cocktails, where every bite is a narrative of heritage and innovation.
                   </p>
                   <button onClick={() => setView('menu')} className="text-[#f5d38a] border-b border-[#f5d38a]/30 pb-2 text-[11px] tracking-[0.4em] uppercase font-bold hover:text-white hover:border-white transition-all">
                      Discover the Full Menu
                   </button>
                 </motion.div>
              </section>

              {/* Enhanced Gallery Fragment */}
               <section className="bg-black py-20 px-4 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1800px] mx-auto">
                  {[
                    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fm=webp&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fm=webp&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?auto=format&fm=webp&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fm=webp&fit=crop&w=600&q=80"
                  ].map((src, i) => (
                    <div key={i} className="aspect-[3/4] overflow-hidden group border border-white/5">
                       <img 
                         src={src} 
                         className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000 scale-110 group-hover:scale-100" 
                         alt="Atmosphere" 
                         loading="lazy"
                         decoding="async"
                       />
                    </div>
                  ))}
               </section>
            </motion.div>
          )}

          {view === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <MenuSection lang={lang} theme={theme} />
              <section className="bg-gray-900 text-white py-16 px-6 text-center">
                <h2 className="text-4xl font-bold mb-4">Our Story</h2>
                <p className="max-w-2xl mx-auto text-gray-400">
                  Inspired by the vibrant streets of Seoul, Seoul Flame brings authentic Korean
                  flavors to your table. From sizzling BBQ to traditional recipes, we celebrate
                  Korean culture through food.
                </p>
              </section>
              <section className="bg-black text-white py-16 px-6 text-center">
                <h2 className="text-4xl font-bold mb-6">Contact Us</h2>
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
              className="min-h-screen pt-40 px-6 flex flex-col items-center bg-black"
            >
               <KimchiLogo theme={theme} className="mb-20 opacity-20 scale-75" />
               <div className="max-w-6xl w-full text-center">
                  <span className="text-[#f5d38a] text-[12px] tracking-[0.6em] uppercase font-bold mb-6 block">
                    {(TRANSLATIONS[lang] as any)[view].title}
                  </span>
                  <h2 className="text-6xl md:text-8xl font-serif italic text-white mb-12 capitalize">{view}</h2>
                  
                  {view === 'gallery' && (
                    <div className="space-y-20 pb-40">
                      <p className="text-white/50 text-xl md:text-2xl font-light leading-relaxed max-w-2xl mx-auto italic mb-20">
                        "{(TRANSLATIONS[lang] as any)[view].content}"
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                          "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1550966841-39fbd6dcda02?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1543007630-983ce91bc787?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1577214224026-cc9c78c5d540?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1551218808-94e220e031eb?auto=format&fm=webp&fit=crop&w=800&q=80",
                          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fm=webp&fit=crop&w=800&q=80"
                        ].map((src, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="aspect-[3/4] overflow-hidden group border border-white/5 bg-white/5"
                          >
                             <img 
                               src={src} 
                               className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000 scale-110 group-hover:scale-100" 
                               alt="Gallery Item" 
                               loading="lazy"
                               decoding="async"
                             />
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
                               <span className="text-[10px] text-[#f5d38a] uppercase tracking-widest block mb-2 font-bold">Address</span>
                               <p className="text-white text-lg font-light leading-relaxed">
                                 Kigali City Center, Rwanda<br/>
                                 KN 4 Ave, Building 12
                               </p>
                             </div>
                             <a 
                               href="https://maps.google.com/?cid=3988189707950359476" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="inline-block text-[#f5d38a] text-sm hover:text-white transition-colors underline underline-offset-4 tracking-wide"
                             >
                               Get Directions
                             </a>
                          </div>
                          <div className="text-left">
                             <span className="text-[10px] text-[#f5d38a] uppercase tracking-widest block mb-2 font-bold">Reservations</span>
                             <p className="text-white text-3xl font-serif italic">+250 788 000 000</p>
                             <p className="text-white/40 text-sm mt-2">booking@kimchi.rw</p>
                          </div>
                          <div className="text-left">
                             <span className="text-[10px] text-[#f5d38a] uppercase tracking-widest block mb-2 font-bold">Social</span>
                             <div className="flex gap-4 mt-2">
                                <a href="#" className="p-3 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Instagram size={18} /></a>
                                <a href="#" className="p-3 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"><Twitter size={18} /></a>
                             </div>
                          </div>
                       </div>

                       <div className="w-full max-w-2xl bg-white/5 border border-white/10 p-10 rounded-sm">
                          <h3 className="text-2xl font-serif italic text-white mb-8 text-left">Send us a Message</h3>
                          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                             <div className="grid grid-cols-2 gap-6">
                                <input type="text" placeholder="Name" className="bg-transparent border-b border-white/20 py-3 text-white outline-none focus:border-[#f5d38a] transition-all" />
                                <input type="email" placeholder="Email" className="bg-transparent border-b border-white/20 py-3 text-white outline-none focus:border-[#f5d38a] transition-all" />
                             </div>
                             <textarea placeholder="Message" rows={4} className="w-full bg-transparent border-b border-white/20 py-3 text-white outline-none focus:border-[#f5d38a] transition-all resize-none"></textarea>
                             <button className="w-full py-4 border border-[#f5d38a] text-[#f5d38a] uppercase text-[10px] tracking-widest font-bold hover:bg-[#f5d38a] hover:text-black transition-all">Submit Inquiry</button>
                          </form>
                       </div>

                       <div className="flex gap-8 mt-10">
                         <button onClick={() => setView('reservation')} className="px-12 py-4 border border-[#f5d38a] text-[#f5d38a] uppercase text-[10px] tracking-widest font-bold hover:bg-[#f5d38a] hover:text-black transition-all">
                            Book Your Experience
                         </button>
                         <button onClick={() => setView('feedback')} className="px-12 py-4 border border-white/20 text-white/60 uppercase text-[10px] tracking-widest font-bold hover:bg-white hover:text-black transition-all">
                            Share Your Feedback
                         </button>
                       </div>
                    </div>
                  )}

                  {view === 'about' && (
                    <div className="pb-40 max-w-3xl mx-auto">
                       <p className="text-white/50 text-xl md:text-2xl font-light leading-relaxed mb-20 italic">
                        "{(TRANSLATIONS[lang] as any)[view].content}"
                      </p>
                      <img 
                        src="https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?auto=format&fm=webp&fit=crop&w=1200&q=80"
                        className="w-full aspect-video object-cover rounded-sm border border-white/10 mb-20"
                        alt="Kimchi Interior"
                      />
                      <button onClick={() => setView('landing')} className="text-white/30 hover:text-[#f5d38a] transition-all text-[10px] tracking-widest uppercase py-4 border-b border-white/10">Return to Exploration</button>
                    </div>
                  )}

                  {view === 'events' && (
                    <div className="pb-40 max-w-4xl mx-auto">
                       <p className="text-white/50 text-xl md:text-2xl font-light leading-relaxed mb-10 italic">
                        "{(TRANSLATIONS[lang] as any)[view].content}"
                      </p>
                      <div className="grid md:grid-cols-2 gap-8 text-left mt-20">
                         <div className="p-8 border border-white/10 bg-white/5 space-y-4">
                            <h3 className="text-[#f5d38a] text-xl font-serif">Private Dinners</h3>
                            <p className="text-white/40 text-sm">Host your intimate gatherings in our bespoke dining halls.</p>
                         </div>
                         <div className="p-8 border border-white/10 bg-white/5 space-y-4">
                            <h3 className="text-[#f5d38a] text-xl font-serif">Cultural Nights</h3>
                            <p className="text-white/40 text-sm">Join us for monthly celebrations of Korean arts and music.</p>
                         </div>
                      </div>
                      <button onClick={() => setView('landing')} className="text-white/30 hover:text-[#f5d38a] transition-all text-[10px] tracking-widest uppercase py-4 border-b border-white/10 mt-20">Return to Exploration</button>
                    </div>
                  )}
               </div>
            </motion.div>
          )}

          {view === 'feedback' && <FeedbackSection lang={lang} theme={theme} />}
          {view === 'feedback-stats' && <FeedbackStatsView lang={lang} />}
        </AnimatePresence>
      </main>

      <Footer lang={lang} theme={theme} setView={setView} />
    </div>
  );
}
