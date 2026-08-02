import { FillBlankExercise, FlashCard } from '../types';

export const BUILTIN_FILL_BLANK_EXERCISES: FillBlankExercise[] = [
  {
    id: 'fb_1',
    sentenceWithBlank: 'Comme tu ______ ?',
    targetWord: 'vas',
    fullSentence: 'Comme tu vas ?',
    translation: 'How are you?',
    options: ['vas', 'es', 'fais', 'appelles'],
    explanation: 'Verbe "aller" conjugué à la 2ème personne du singulier (tu vas).',
    hint: 'Verb aller (to go / to be)',
  },
  {
    id: 'fb_2',
    sentenceWithBlank: "Comment tu t'______ ?",
    targetWord: 'appelles',
    fullSentence: "Comment tu t'appelles ?",
    translation: 'What is your name?',
    options: ['appelles', 'parles', 'habites', 'souviens'],
    explanation: 'Verbe pronominal "s\'appeler".',
    hint: 'To be called',
  },
  {
    id: 'fb_3',
    sentenceWithBlank: 'Où ______ les toilettes ?',
    targetWord: 'sont',
    fullSentence: 'Où sont les toilettes ?',
    translation: 'Where are the restrooms?',
    options: ['sont', 'est', 'vont', 'font'],
    explanation: 'Verbe "être" au pluriel avec "les toilettes".',
    hint: 'Verb être in plural',
  },
  {
    id: 'fb_4',
    sentenceWithBlank: "Je ______ un verre de vin, s'il vous plaît.",
    targetWord: 'voudrais',
    fullSentence: "Je voudrais un verre de vin, s'il vous plaît.",
    translation: 'I would like a glass of wine, please.',
    options: ['voudrais', 'aime', 'mange', 'prends'],
    explanation: 'Formule de politesse avec le verbe "vouloir" au conditionnel.',
    hint: 'Would like (vouloir)',
  },
  {
    id: 'fb_5',
    sentenceWithBlank: 'Il est ______ dans un grand hôpital.',
    targetWord: 'médecin',
    fullSentence: 'Il est médecin dans un grand hôpital.',
    translation: 'He is a doctor in a big hospital.',
    options: ['médecin', 'dentiste', 'professeur', 'serveur'],
    explanation: 'Profession médicale masculine.',
    hint: 'Doctor',
  },
  {
    id: 'fb_6',
    sentenceWithBlank: 'Les étudiants sont ______ et le professeur aussi.',
    targetWord: 'contents',
    fullSentence: 'Les étudiants sont contents et le professeur aussi.',
    translation: 'The students are happy and the teacher too.',
    options: ['contents', 'fatigués', 'seuls', 'tristes'],
    explanation: 'Adjectif au masculin pluriel signifiant happy / content.',
    hint: 'Happy / Content',
  },
  {
    id: 'fb_7',
    sentenceWithBlank: 'Nous ______ lire un livre ce soir.',
    targetWord: 'voulons',
    fullSentence: 'Nous voulons lire un livre ce soir.',
    translation: 'We want to read a book tonight.',
    options: ['voulons', 'pouvons', 'devons', 'faisons'],
    explanation: 'Verbe "vouloir" avec "nous".',
    hint: 'We want (vouloir)',
  },
  {
    id: 'fb_8',
    sentenceWithBlank: "Aujourd'hui, le restaurant est ______.",
    targetWord: 'ouvert',
    fullSentence: "Aujourd'hui, le restaurant est ouvert.",
    translation: 'Today, the restaurant is open.',
    options: ['ouvert', 'fermé', 'cher', 'petit'],
    explanation: 'Adjectif signifiant open.',
    hint: 'Open',
  },
  {
    id: 'fb_9',
    sentenceWithBlank: 'Tu as un ______ blanc ou vert ?',
    targetWord: 'vélo',
    fullSentence: 'Tu as un vélo blanc ou vert ?',
    translation: 'Do you have a white or green bike?',
    options: ['vélo', 'livre', 'parc', 'sac'],
    explanation: 'Nom masculin pour la bicyclette.',
    hint: 'Bicycle / Bike',
  },
  {
    id: 'fb_10',
    sentenceWithBlank: 'Elle ______ aux États-Unis.',
    targetWord: 'travaille',
    fullSentence: 'Elle travaille aux États-Unis.',
    translation: 'She works in the United States.',
    options: ['travaille', 'habite', 'étudie', 'voyage'],
    explanation: 'Verbe travailler à la 3ème personne du singulier.',
    hint: 'Works',
  },
  {
    id: 'fb_11',
    sentenceWithBlank: 'Cette sculpture est très ______.',
    targetWord: 'ennuyeuse',
    fullSentence: 'Cette sculpture est très ennuyeuse.',
    translation: 'This sculpture is very boring.',
    options: ['ennuyeuse', 'gentille', 'verte', 'ouverte'],
    explanation: 'Adjectif féminin signifiant boring.',
    hint: 'Boring',
  },
  {
    id: 'fb_12',
    sentenceWithBlank: "J'aime bien les grandes ______, il y a plus de magasins.",
    targetWord: 'villes',
    fullSentence: "J'aime bien les grandes villes, il y a plus de magasins.",
    translation: 'I really like big cities, there are more stores.',
    options: ['villes', 'écoles', 'chaises', 'portes'],
    explanation: 'Nom féminin pluriel (cities).',
    hint: 'Cities',
  },
  {
    id: 'fb_13',
    sentenceWithBlank: "Voici ma ______, elle s'appelle Sophie.",
    targetWord: 'copine',
    fullSentence: "Voici ma copine, elle s'appelle Sophie.",
    translation: 'Here is my girlfriend, her name is Sophie.',
    options: ['copine', 'sœur', 'fille', 'mère'],
    explanation: 'Nom féminin pour petite amie ou amie proche.',
    hint: 'Girlfriend / Friend',
  },
  {
    id: 'fb_14',
    sentenceWithBlank: 'Il y a un grand ______ dans le jardin.',
    targetWord: 'arbre',
    fullSentence: 'Il y a un grand arbre dans le jardin.',
    translation: 'There is a big tree in the garden.',
    options: ['arbre', 'fleur', 'vélo', 'mur'],
    explanation: 'Nom masculin pour l\'arbre.',
    hint: 'Tree',
  },
  {
    id: 'fb_15',
    sentenceWithBlank: 'Vous ne pouvez pas ______ mon déjeuner.',
    targetWord: 'manger',
    fullSentence: 'Vous ne pouvez pas manger mon déjeuner.',
    translation: 'You cannot eat my lunch.',
    options: ['manger', 'boire', 'lire', 'faire'],
    explanation: 'Verbe à l\'infinitif après le verbe pouvoir (to eat).',
    hint: 'To eat',
  },
  {
    id: 'fb_16',
    sentenceWithBlank: "Je peux t'______ à trouver les mots.",
    targetWord: 'aider',
    fullSentence: "Je peux t'aider à trouver les mots.",
    translation: 'I can help you find the words.',
    options: ['aider', 'donner', 'parler', 'demander'],
    explanation: 'Verbe aider (to help).',
    hint: 'To help',
  },
  {
    id: 'fb_17',
    sentenceWithBlank: 'Ma voisine Alice est très ______.',
    targetWord: 'gentille',
    fullSentence: 'Ma voisine Alice est très gentille.',
    translation: 'My neighbor Alice is very kind.',
    options: ['gentille', 'médecin', 'seule', 'grande'],
    explanation: 'Adjectif féminin singulier (kind).',
    hint: 'Kind',
  },
  {
    id: 'fb_18',
    sentenceWithBlank: "C'est ______ de travailler beaucoup, non ?",
    targetWord: 'fatiguant',
    fullSentence: "C'est fatiguant de travailler beaucoup, non ?",
    translation: "It's tiring to work a lot, right?",
    options: ['fatiguant', 'content', 'ouvert', 'gentil'],
    explanation: 'Adjectif (tiring).',
    hint: 'Tiring',
  },
  {
    id: 'fb_19',
    sentenceWithBlank: "J'______ la porte de la maison.",
    targetWord: 'ouvre',
    fullSentence: "J'ouvre la porte de la maison.",
    translation: 'I open the door of the house.',
    options: ['ouvre', 'ferme', 'vois', 'tourne'],
    explanation: 'Verbe ouvrir (to open) au présent de l\'indicatif.',
    hint: 'I open (ouvrir)',
  },
  {
    id: 'fb_20',
    sentenceWithBlank: 'Il y a quatre ______ autour de la table.',
    targetWord: 'chaises',
    fullSentence: 'Il y a quatre chaises autour de la table.',
    translation: 'There are four chairs around the table.',
    options: ['chaises', 'portes', 'fenêtres', 'villes'],
    explanation: 'Nom féminin pluriel (chairs).',
    hint: 'Chairs',
  }
];

// Helper to generate dynamic fill-in-the-blank questions from user flashcards
export const generateExercisesFromCards = (cards: FlashCard[]): FillBlankExercise[] => {
  const dynamicExercises: FillBlankExercise[] = [];

  cards.forEach((card, index) => {
    // Check if card word or example contains suitable French text
    const textToUse = card.example || card.word;
    if (!textToUse || textToUse.length < 5) return;

    // Pick target word
    let target = card.word;
    let sentence = textToUse;

    // If card.word is a single word, try to mask it in card.example
    if (!card.word.includes(' ') && card.example.toLowerCase().includes(card.word.toLowerCase())) {
      target = card.word;
      sentence = card.example;
    } else {
      // Split into words and pick a key word
      const words = sentence.split(/\s+/).map(w => w.replace(/[.,!?:;"]/g, ''));
      const suitable = words.filter(w => w.length >= 3);
      if (suitable.length > 0) {
        target = suitable[Math.floor(Math.random() * suitable.length)];
      }
    }

    if (!target) return;

    // Create sentence with blank
    const regex = new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (!regex.test(sentence)) return;

    const sentenceWithBlank = sentence.replace(regex, '______');

    // Create distractors from other cards
    const distractors = Array.from(
      new Set(
        cards
          .map((c) => c.word.split(/\s+/)[0].replace(/[.,!?:;"]/g, ''))
          .filter((w) => w && w.toLowerCase() !== target.toLowerCase() && w.length >= 3)
      )
    );

    // Shuffle distractors and select 3
    const shuffled = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [target, ...shuffled].sort(() => 0.5 - Math.random());

    dynamicExercises.push({
      id: `dyn_${card.id}_${index}`,
      sentenceWithBlank,
      targetWord: target,
      fullSentence: sentence,
      translation: card.exampleTranslation || card.translation || 'Traduction',
      options,
      explanation: card.definition || `Focus sur le mot "${target}".`,
      deckId: card.deckId,
      hint: card.partOfSpeech || 'Mot clé',
    });
  });

  return dynamicExercises;
};
