import { State } from './quiz';
import fs from 'fs';
const DATABASE_FILE = 'database.json';

interface Admin {
  authUserId: number;
  nameFirst: string;
  nameLast: string;
  email: string;
  password: string;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  usedPassword: string[];
}

interface Answer {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface Question {
  questionId: number;
  quizId: number;
  question: string;
  duration: number;
  thumbnailUrl: string;
  points: number;
  answers: Answer[];
}

interface Quiz {
  quizId: number;
  ownerId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  duration: number;
  thumbnailUrl: string;
}

interface UserSession {
  authUserId: number;
  token: string;
}

interface QuizSession {
  sessionId: number;
  state: State;
  atQuestion: number;
  metadata: Quiz;
  questionCountDown?: NodeJS.Timeout;
  questionDuration?: NodeJS.Timeout;
}

interface Player {
  playerId: number;
  sessionId: number;
  name: string;
  score: number;
}

interface Result {
  questionId: number;
  playersCorrectList: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

interface Message {
  messageBody: string;
  playerId: number;
  playerName: string;
  timeSent: number;
}

interface DataStore {
  users: Admin[];
  quizzes: Quiz[];
  userSessions: UserSession[];
  quizSessions: QuizSession[];
  questions: Question[];
  results: Result[];
  players: Player[];
  trash: Quiz[];
  messages: Message[];
}

let dataStore: DataStore = {
  users: [],
  quizzes: [],
  userSessions: [],
  quizSessions: [],
  questions: [],
  results: [],
  players: [],
  trash: [],
  messages: [],
};

export const getData = () => dataStore;
export const setData = (newData: DataStore) => {
  dataStore = newData;
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(dataStore));
};
