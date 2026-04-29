const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// The file is currently very messy.
// I will rewrite the first 100 lines entirely to ensure they are correct.

const newBeginning = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu as MenuIcon, X, LogIn, ChevronRight, Play, UtensilsCrossed, Calendar, Sparkles, User, LogOut, Search, Globe, Moon, Sun } from 'lucide-react';
import { cn } from './lib/utils';
import { MENU_ITEMS, MenuItem } from './constants';
import { getSensoryRecommendation } from './services/geminiService';

// --- Types ---
type View = 'landing' | 'menu' | 'reservation' | 'ai-discovery' | 'auth';
type Language = 'en' | 'fr' | 'jp';
type Theme = 'dark' | 'light';

const TRANSLATIONS = {
  en: {
    nav: { menu: 'Menu', reservations: 'Reservations', discovery: 'Discovery', member: 'Member Access', logout: 'Logout' },
    hero: { subtitle: 'A Rare Gastronomic Experience', title: 'Culinary Alchemy.', desc: 'Where heritage meets the avant-garde. Our system intelligently pairs seasonal availability with your unique flavor profile to curate a non-repeatable dining journey.', btn: 'Book Your Table', guests: '400+ Guests Today' },
    menu: { subtitle: 'The Selection', title: 'Curated Fare.', all: 'All', starter: 'Starter', main: 'Main', dessert: 'Dessert', drink: 'Drink' },
    discovery: { subtitle: 'Innovation Suite', title: 'Sensory Algorithm.', desc: 'Describe a mood, a feeling, or an occasion, and our Intelligence will orchestrate a non-repeatable dining journey.', placeholder: "e.g. 'Starlit city memories'" },
    reservation: { title: 'Secure Your Table', desc: 'Experience Lumière at its finest. We recommend booking at least two weeks in advance.' },
    auth: { login: 'Authentication', signup: 'Registration', email: 'Email Address', code: 'Secure Access Code', btn: 'Authenticate Access' },
    footer: { essence: 'The Essence of Parisian Gastronomy' },
    philosophy: { subtitle: 'Our Philosophy', title: 'Ethereal Fragments.', desc: 'We believe dining is more than sustenance—it\'s a dialogue with the senses. Every ingredient is sourced from artisanal producers who share our devotion to excellence.', btn: 'Discover the Intangible' },
    chef: { subtitle: 'Meet the Maître', title: 'The Visionary.', desc: 'Chef Julian Lumière blends traditional French techniques with bold, avant-garde experimentation.' },
    signatures: { subtitle: 'The Icons', title: 'Signature Creations.', desc: 'A curated selection of our most revered seasonal masterpieces.' }
  },
  fr: {
    nav: { menu: 'Menu', reservations: 'Réservations', discovery: 'Découverte', member: 'Accès Membre', logout: 'Déconnexion' },
    hero: { subtitle: 'Une Expérience Gastronomique Rare', title: 'Alchimie Culinaire.', desc: 'Là où l\'héritage rencontre l\'avant-garde. Notre système associe intelligemment la saisonnalité à votre profil de saveur unique.', btn: 'Réserver Votre Table', guests: '400+ Invités Aujourd\'hui' },
    menu: { subtitle: 'La Sélection', title: 'Plats Curatés.', all: 'Tout', starter: 'Entrée', main: 'Plat', dessert: 'Dessert', drink: 'Boisson' },
    discovery: { subtitle: 'Suite Innovation', title: 'Algorithme Sensoriel.', desc: 'Décrivez une humeur, un sentiment ou une occasion, et notre Intelligence orchestrera un voyage culinaire unique.', placeholder: "ex. 'Souvenirs de ville étoilée'" },
    reservation: { title: 'Réserver Votre Table', desc: 'Découvrez Lumière sous son meilleur jour. Nous recommandons de réserver au moins deux semaines à l\'avance.' },
    auth: { login: 'Authentification', signup: 'Inscription', email: 'Adresse E-mail', code: 'Code d\'Accès Sécurisé', btn: 'Authentifier l\'Accès' },
    footer: { essence: 'L\'essence de la gastronomie parisienne' },
    philosophy: { subtitle: 'Notre Philosophie', title: 'Fragments Éthérés.', desc: 'Nous croyons que dîner est plus qu\'une simple subsistance—c\'est un dialogue avec les sens.', btn: 'Découvrir l\'Intangible' },
    chef: { subtitle: 'Rencontrez le Maître', title: 'Le Visionnaire.', desc: 'Le chef Julian Lumière allie techniques françaises traditionnelles et expérimentation audacieuse.' },
    signatures: { subtitle: 'Les Icônes', title: 'Créations Signatures.', desc: 'Une sélection curatée de nos chefs-d\'œuvre saisonniers les plus vénérés.' }
  },
  jp: {
    nav: { menu: 'メニュー', reservations: '予約', discovery: '発見', member: 'メンバーアクセス', logout: 'ログアウト' },
    hero: { subtitle: '稀有な美食体験', title: '料理の錬金術', desc: '伝統とアバンギャルドが融合する場所。AIが季節の食材とあなたの好みを独自のプロファイルで組み合わせます。', btn: 'テーブルを予約する', guests: '本日400名以上の来客' },
    menu: { subtitle: 'セレクション', title: '厳選された料理', all: 'すべて', starter: 'スターター', main: 'メイン', dessert: 'デザート', drink: 'ドリンク' },
    discovery: { subtitle: 'イノベーションスイート', title: '感覚アルゴリズム', desc: '気分や感情、場面を伝えてください。私たちのAIがあなただけの特別な料理体験を演出します。', placeholder: "例：'星空の街の思い出'" },
    reservation: { title: 'お席を確保する', desc: 'リュミエールの最高のおもてなしをご体験ください。2週間前までのご予約をお勧めします。' },
    auth: { login: '認証', signup: '登録', email: 'メールアドレス', code: 'セキュリティコード', btn: 'アクセスを認証' },
    footer: { essence: 'パリの美食の粋' },
    philosophy: { subtitle: '私たちの哲学', title: '空想の断片', desc: '食事は単なる栄養補給ではなく、五感との対話であると私たちは信じています。', btn: '無形を発見する' },
    chef: { subtitle: '巨匠に会う', title: '先見の明', desc: 'シェフ・ジュリアン・リュミエールは、伝統的なフランス料理の技法と大胆で前衛的な実験を融合させています。' },
    signatures: { subtitle: 'アイコン', title: 'シグネチャー作品', desc: '最も尊敬されている季節の傑作の厳選されたセレクション。' }
  }
};

const Navigation = ({ 
  currentView, 
  setView, 
  user, 
  onLogout, 
  lang, 
  setLang, 
  theme, 
  toggleTheme 
}: { 
  currentView: View, 
  setView: (v: View) => void, 
  user: any, 
  onLogout: () => void,
  lang: Language,
  setLang: (l: Language) => void,
  theme: Theme,
  toggleTheme: () => void
}) => {`;

// I need to find the start of the "real" Navigation component content.
// Looking at the view_file output, the real content starts with "  const [isScrolled, setIsScrolled] = useState(false);"
// In the current file, this is around line 96.

const scIndex = lines.findIndex(l => l.includes('const [isScrolled, setIsScrolled] = useState(false);'));
if (scIndex === -1) {
    console.error('Could not find isScrolled');
    process.exit(1);
}

const restOfFile = lines.slice(scIndex).join('\n');
fs.writeFileSync('src/App.tsx', newBeginning + '\n' + restOfFile);
