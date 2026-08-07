# Anki - Vocabulaire Français 🇫🇷

Application d'apprentissage du vocabulaire français basée sur la répétition espacée (algorithme SM-2), avec cartes mémoire interactives, exercices à trous, défis générés par IA et prononciation audio multi-tier (SpeechSynthesis & APIs TTS streaming).

---

## 📌 Sommaire
- [Aperçu de l'Application](#-aperçu-de-lapplication)
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Architecture Technique](#-architecture-technique)
- [Structure du Projet](#-structure-du-projet)
- [Algorithme SM-2 (Répétition Espacée)](#-algorithme-sm-2-répétition-espacée)
- [Moteur Audio Multi-Tier & WebView](#-moteur-audio-multi-tier--webview)
- [Intégration IA (Gemini API)](#-intégration-ia-gemini-api)
- [Installation et Lancement](#-installation-et-lancement)

---

## 🇫🇷 Aperçu de l'Application

**Anki - Vocabulaire Français** est une plateforme web moderne et responsive conçue pour maximiser la mémorisation du vocabulaire français. Elle combine des techniques prouvées de répétition espacée, des visualisations sémantiques enrichies et un générateur d'exercices alimenté par l'IA Gemini.

L'application est également optimisée pour fonctionner sur les navigateurs web modernes, sur Vercel, et en tant qu'application mobile native via WebView (ex: Median.co / GoNative).

---

## ⚡ Fonctionnalités Principales

1. **Cartes Mémoire (Flashcards) & Répétition Espacée (SM-2)**
   - Révision quotidienne basée sur la difficulté perçue (Nouveau, Difficile, Bon, Facile).
   - Calcul dynamique des intervalles de répétition et du facteur de facilité (EF factor).
   - Cartes enrichies : classe grammaticale, genre, prononciation IPA, exemples en contexte, synonymes, mots de la même famille et notes culturelles/grammaticales.

2. **Mode Explorar (Visualisation Sémantique)**
   - Exploration interactive des liens entre mots (familles de mots, expressions, synonymes).
   - Réglage de la vitesse de lecture audio (Normal, 0.8x, 0.5x).

3. **Exercices à Trous (Fill-in-the-Blank)**
   - Construction de phrases mot par mot avec vérification instantanée.
   - Génération dynamique d'exercices à partir des cartes de vocabulaire.

4. **Défis & Quiz Générés par IA (Gemini)**
   - Génération de questions à choix multiples ciblées sur les mots difficiles de l'utilisateur.
   - Explications pédagogiques immédiates pour chaque réponse.

5. **Génération Automatique de Cartes avec IA**
   - Saisie d'un simple mot français pour générer automatiquement la carte complète (définition, exemples, IPA, classe grammaticale, synonymes).

6. **Gestion des Paquets (Decks)**
   - Création, édition et filtrage des cartes par thèmes/paquets.
   - Recherche rapide et filtre par étiquettes.

---

## 🛠️ Architecture Technique

- **Frontend** : React 19, TypeScript, Tailwind CSS v4, Motion (animations layout & micro-interactions), Lucide React (icônes).
- **Backend / Serveur API** : Express (v4), esbuild, tsx.
- **Intégration IA** : `@google/genai` (Google Gemini 2.5 Flash API sur le serveur Express `/api/gemini/*`).
- **Moteur Audio** : Multi-tier failover (`window.speechSynthesis` + StreamElements Amazon Polly + Google Translate TTS) avec gestion du chargement des vozes pour Android/iOS WebView.

---

## 📂 Structure du Projet

```text
├── server.ts                   # Serveur Express & routes API Gemini
├── src/
│   ├── main.tsx                # Point d'entrée React
│   ├── App.tsx                 # Composant principal & gestionnaire d'état
│   ├── types.ts                # Types TypeScript (FlashCard, Deck, etc.)
│   ├── index.css               # Configuration Tailwind CSS v4
│   ├── lib/
│   │   ├── sm2.ts              # Algorithme SuperMemo-2 (répétition espacée)
│   │   └── audio.ts            # Player audio multi-source & hook useVoicesReady
│   ├── data/
│   │   ├── initialDecks.ts     # Paquets et cartes initiales de vocabulaire
│   │   └── fillBlankExercises.ts# Exercices à trous initiaux & générateurs
│   └── components/
│       ├── CardView.tsx        # Vue interactive de la carte mémoire
│       ├── ExplorarMode.tsx    # Vue de graphe sémantique
│       ├── FillBlankView.tsx   # Vue des exercices à trous
│       ├── ChallengeTab.tsx    # Vue des défis générés par IA
│       ├── SearchTab.tsx       # Vue de recherche et filtrage des cartes
│       ├── AddEditCardModal.tsx# Modal de création/édition de cartes (avec auto-fill IA)
│       └── Header.tsx / Navbar # Éléments de navigation
├── package.json
├── vite.config.ts
└── metadata.json
```

---

## 🧠 Algorithme SM-2 (Répétition Espacée)

Situé dans `src/lib/sm2.ts`, l'algorithme est basé sur **SuperMemo 2** :

- **Évaluation (0 à 5)** :
  - `0` (Nouveau) / `1` / `2` : Échec (remise à zéro de l'intervalle `interval = 1`).
  - `3` (Difficile) / `4` (Bon) / `5` (Facile) : Succès.
- **Formule du facteur de facilité (EF)** :
  $$\text{EF}' = \text{EF} + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$$
- **Calcul de l'intervalle ($I$)** :
  - $I_1 = 1$ jour
  - $I_2 = 6$ jours
  - $I_n = I_{n-1} \times \text{EF}$ pour $n > 2$

---

## 🔊 Moteur Audio Multi-Tier & WebView

Situé dans `src/lib/audio.ts` :

1. **Stratégie de secours (Multi-tier Failover)** :
   - **Tier 1** : Web Speech API (`window.speechSynthesis`) exécutée de façon synchrone dans le contexte du geste utilisateur.
   - **Tier 2** : Flux MP3 StreamElements (Amazon Polly).
   - **Tier 3** : Google Translate TTS (`client=gtx` et `client=tw-ob`).
2. **Support Median.co / WebView Android & iOS** :
   - Un écouteur sur l'événement `voiceschanged` et un hook `useVoicesReady()` désactivent proprement les boutons d'écoute tant que le moteur TTS natif du système n'a pas chargé les voix.

---

## 🤖 Intégration IA (Gemini API)

Le serveur Express proxy (`server.ts`) gère en toute sécurité les requêtes Gemini côté serveur :

1. `/api/gemini/generate-card` : Génère le contenu complet d'une carte à partir d'un simple mot.
2. `/api/gemini/generate-challenge` : Génère des quiz interactifs personnalisés basés sur les cartes difficiles de l'utilisateur.

---

## 🚀 Installation et Lancement

### Prérequis
- Node.js (v18+)
- Clé API Gemini (optionnelle pour la génération IA, via la variable d'environnement `GEMINI_API_KEY`)

### Développement
```bash
# Lancement du serveur de développement
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

### Production
```bash
# Compilation du client Vite & du serveur Express
npm run build

# Démarrage du serveur de production
npm run start
```
