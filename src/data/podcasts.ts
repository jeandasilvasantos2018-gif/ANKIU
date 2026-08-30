import { PodcastEpisode } from '../types';

export const PODCAST_EPISODES: PodcastEpisode[] = [
  {
    id: 'podcast-formal-conversation',
    title: 'Une conversation formelle',
    description: 'Écoutez un court dialogue en français et repérez les formules utilisées dans une situation plus formelle.',
    podcastName: 'French Wikibooks Audio',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c4/French_Dialogue_-_A_Formal_Conversation.ogg/French_Dialogue_-_A_Formal_Conversation.ogg.mp3',
    level: 'A2',
    category: 'Conversations',
    duration: 15.4,
    vocabulary: ['bonjour', 'monsieur', 'madame', 'vous', 'merci'],
    objective: 'Comprendre les formules de politesse et le registre formel dans un dialogue court.',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:French_Dialogue_-_A_Formal_Conversation.ogg',
    license: 'CC BY-SA 3.0 / GFDL',
  },
  {
    id: 'podcast-school-conversation',
    title: 'À l’école : parler avec le principal',
    description: 'Un extrait de dialogue authentique pour entraîner votre oreille au rythme naturel du français parlé.',
    podcastName: 'French Wikibooks Audio',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/21/French_Dialogue_-_The_Principal.ogg/French_Dialogue_-_The_Principal.ogg.mp3',
    level: 'B1',
    category: 'Études',
    duration: 37,
    vocabulary: ['le principal', 'l’école', 'parler', 'demander', 'répondre'],
    objective: 'Suivre les idées principales d’un échange dans un contexte scolaire.',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:French_Dialogue_-_The_Principal.ogg',
    license: 'Public domain',
  },
];

export const PODCAST_CATEGORIES = ['Tous', 'Vie quotidienne', 'Voyage', 'Culture', 'Actualités', 'Histoires', 'Conversations', 'Travail', 'Études'] as const;
