import { getData, setData } from './dataStore';
import { randomColourGenerator } from './randomColourGenerator';
import { randomNumber } from './hash';
import HTTPError from 'http-errors';

export interface QuizCreateReturn {
  quizId: number;
}

export interface QuestionCreateReturn {
  questionId: number;
}

export interface Answer {
  answer: string;
  correct: boolean;
}

interface AnswerReturn {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

interface QuizList {
  quizId: number;
  name: string;
}

interface Question {
  questionId: number;
  question: string;
  duration: number;
  thumbnailUrl: string;
  points: number;
  answers: AnswerReturn[];
}

export interface QuizInfo {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: Question[];
  duration: number;
  thumbnailUrl: string;
}

export interface SessionView {
  activeSessions: number[];
  inactiveSessions: number[];
}

interface Metadata {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: Question[];
  duration: number;
  thumbnailUrl: string;
}

export interface SessionStatus {
  state: string;
  atQuestion: number;
  players: string[];
  metadata: Metadata;
}
export enum State {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END',
}

export enum Action {
  NEXT_QUESTION = 'NEXT_QUESTION',
  SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END',
}

/**
 * Provide a list of all quizzes that are owned by the currently logged in user.
 *
 * @param {string} token the user's email
 * @returns {object} the quizzes that are owned by the currently logged in user.
 */
export function adminQuizList(token: string): { quizzes: QuizList[] } {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);

  const quizzes = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => ({
      quizId: q.quizId,
      name: q.name,
    }));
  return { quizzes };
}

/**
 * Given basic details about a new quiz, create one for the logged in user.
 *
 * @param {integer} authUserId the user's id
 * @param {string} name the user's name
 * @param {string} description the description of the quiz
 * @returns {object} the id value of the quizz
 */
export function adminQuizCreate(
  token: string,
  name: string,
  description: string
): QuizCreateReturn {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);

  if (!/^[A-Za-z0-9\s]{3,30}$/.test(name) || description.length > 100) {
    throw HTTPError(400, 'Invalid name and/or invalid description.');
  }

  const alreadyUsedName = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .some((q) => q.name === name);
  if (alreadyUsedName) {
    throw HTTPError(
      400,
      'Name is already used by the current logged in user for another quiz.'
    );
  }

  const quizId = data.quizzes.length * -2 - 1531;
  const time = Math.floor(Date.now() / 1000);
  const ownerId = user.authUserId;
  data.quizzes.push({
    quizId,
    ownerId,
    name,
    timeCreated: time,
    timeLastEdited: time,
    description,
    numQuestions: 0,
    duration: 0,
    thumbnailUrl: '',
  });
  setData(data);
  return { quizId };
}

/**
 * Given a particular quiz, permanently remove the quiz.
 *
 * @param {string} token the token of logged in user session
 * @param {integer} authUserId the user's id
 * @param {integer} quizId the quiz's id
 *
 * @returns {object} on success
 * @returns {error} on error
 */
export function adminQuizRemove(token: string, quizId: number): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);

  const quizSession = data.quizSessions
    .filter((s) => s.metadata.quizId === quizId)
    .every((s) => s.state === State.END);
  if (!quizSession) {
    throw HTTPError(400, 'All sessions for this quiz must be in END state.');
  }

  data.trash.push(quiz);
  const index = data.quizzes.indexOf(quiz);
  data.quizzes.splice(index, 1);
  setData(data);
  return {};
}

/**
 * Get all of the relevant information about the current quiz.
 *
 * @param {integer} authUserId the user's id
 * @param {integer} quizId the quiz's id
 * @returns {object} all the relevant info about the current quiz
 */
export function adminQuizInfo(token: string, quizId: number): QuizInfo {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);

  const { ownerId, ...details } = quiz;
  const questions = data.questions
    .filter((q) => q.quizId === quizId)
    .map(({ quizId, ...details }) => details);
  return { ...details, questions };
}

/**
 * Get all of the relevant information about the admin quiz name update.
 *
 * @param {number} authUserId the user's id
 * @param {number} quizId the quiz's id
 * @param {string} name name of user
 *
 * @returns {object} return object
 * @returns {error} on error
 */
export function adminQuizNameUpdate(
  token: string,
  quizId: number,
  name: string
): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);

  if (!/^[A-Za-z0-9\s]{3,30}$/.test(name)) {
    throw HTTPError(400, 'Invalid quizId and/or invalid name.');
  }

  const alreadyUsedName = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .some((q) => q.name === name);
  if (alreadyUsedName) {
    throw HTTPError(400, 'Name is already used for another quiz.');
  }

  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.name = name;
  setData(data);
  return {};
}

/**
 * Get all of the relevant information about update description of admin quiz.
 *
 * @param {number} auth UserId the user's id
 * @param {number} quizId the quiz's id
 * @param {string} description update description
 * @returns {object}
 */
export function adminQuizDescriptionUpdate(
  token: string,
  quizId: number,
  description: string
): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);

  if (description.length > 100) {
    throw HTTPError(400, 'Description is more than 100 characters!');
  }

  quiz.description = description;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);
  return {};
}

/**
 * Get all of the relevant information about quiz's trash.
 * @param {string} token of user
 * @returns {object}
 */

export function adminQuizViewTrash(token: string): { quizzes: QuizList[] } {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);

  const quizzes = data.trash
    .filter((q) => q.ownerId === user.authUserId)
    .map((quiz) => ({
      quizId: quiz.quizId,
      name: quiz.name,
    }));
  return { quizzes };
}

/**
 * Restore the quiz from trash.
 *
 * @param {number} quizId the quiz's id
 * @param {string} token of user
 * @returns {object}
 */

export function adminQuizRestore(token: string, quizId: number): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);

  const quiz = data.trash.find((quiz) => quiz.quizId === quizId);
  if (!quiz) {
    throw HTTPError(
      400,
      'Quiz ID refers to a quiz that is not currently in the trash!'
    );
  }

  const quizNameExists = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .some((activeQuiz) => activeQuiz.name === quiz.name);
  if (quizNameExists) {
    throw HTTPError(
      400,
      `The quiz name "${quiz.name}" of the restored quiz is already used by another active quiz.`
    );
  }
  if (quiz.ownerId !== user.authUserId) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}`
    );
  }
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  data.quizzes.push(quiz);
  const index = data.trash.indexOf(quiz);
  data.trash.splice(index, 1);
  setData(data);
  return {};
}

/**
 * Empty the quiz from trash.
 *
 * @param {Array} quizId array
 * @param {string} token of user
 * @returns {object}
 */

export function adminQuizEmptyTrash(token: string, quizIds: number[]): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const allQuizIdsInTrash = data.trash.map((q) => q.quizId);
  for (const id of quizIds) {
    if (!allQuizIdsInTrash.includes(id)) {
      throw HTTPError(
        400,
        'One or more of the Quiz IDs is not currently in the trash.'
      );
    }
  }
  const allQuizOwnerIdInTrash = data.trash.map((q) => q.ownerId);
  for (const id of allQuizOwnerIdInTrash) {
    if (id !== user.authUserId) {
      throw HTTPError(
        403,
        'one or more of the Quiz IDs refers to a quiz that this current user does not own.'
      );
    }
  }

  for (const id of quizIds) {
    const quiz = data.trash.find((q) => q.quizId === id);
    data.trash.splice(data.trash.indexOf(quiz), 1);
  }
  setData(data);
  return {};
}

/**
 * Transfer quiz to the owner.
 *
 * @param {number} quizId the quiz's id
 * @param {string} token of user
 * @param {string} email of user
 * @returns {object}
 */

export function adminQuizTransfer(
  token: string,
  quizId: number,
  userEmail: string
): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);

  const newUser = data.users.find((u) => u.email === userEmail);
  if (!newUser) {
    throw HTTPError(400, 'userEmail is not a real user.');
  }
  if (newUser.authUserId === user.authUserId) {
    throw HTTPError(400, 'userEmail is the current logged in user.');
  }

  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);

  const targetUserQuiz = data.quizzes.filter(
    (q) => q.ownerId === newUser.authUserId
  );
  if (targetUserQuiz.some((q) => q.name === quiz.name)) {
    throw HTTPError(
      400,
      'Quiz ID refers to a quiz that has a name that is already used by the target user.'
    );
  }

  const quizSession = data.quizSessions
    .filter((s) => s.metadata.quizId === quizId)
    .every((s) => s.state === State.END);
  if (!quizSession) {
    throw HTTPError(400, 'All sessions for this quiz must be in END state.');
  }

  quiz.ownerId = newUser.authUserId;
  setData(data);
  return {};
}

// Helper function to check whethe an answer is duplicated in an array of answers
const containDuplicateAnswer = (answers: Answer[]): boolean => {
  const uniqueAnswers = new Set<string>();
  for (const { answer } of answers) {
    if (uniqueAnswers.has(answer)) {
      return true;
    }
    uniqueAnswers.add(answer);
  }
  return false;
};

/**
 * Create quiz question.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {string} question for the quiz
 * @param {number} duration of the question
 * @param {number} points of the question
 * @param {array} answers of the question
 * @param {string} thumbnailUrl of the quiz
 * @returns {object}
 */

export function adminQuizQuestionCreate(
  token: string,
  quizId: number,
  question: string,
  duration: number,
  points: number,
  answers: Answer[],
  thumbnailUrl: string
): { questionId: number } {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);

  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);

  if (
    question.length < 5 ||
    question.length > 50 ||
    answers.length < 2 ||
    answers.length > 6
  ) {
    throw HTTPError(400, 'Invalid question or invalid numbers of answers.');
  }

  if (duration < 1 || quiz.duration + duration > 180) {
    throw HTTPError(
      400,
      'Invalid duration, or the sum of the question durations in the quiz exceeds 3 minutes.'
    );
  }

  if (points < 1 || points > 10) {
    throw HTTPError(400, 'Invalid points.');
  }

  if (answers.some((a) => a.answer.length < 1 || a.answer.length > 30)) {
    throw HTTPError(400, 'Invalid answers.');
  }

  if (
    containDuplicateAnswer(answers) ||
    !answers.some((a) => a.correct === true)
  ) {
    throw HTTPError(
      400,
      'There exists answer string which is a duplicate of another answer, or there are no correct answers.'
    );
  }

  if (!thumbnailUrl) {
    throw HTTPError(400, 'The thumbnailUrl is an empty string');
  }

  if (!['jpg', 'jpeg', 'png'].some((s) => thumbnailUrl.endsWith(s))) {
    throw HTTPError(
      400,
      'The thumbnailUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png'
    );
  }

  if (!['http://', 'https://'].some((s) => thumbnailUrl.startsWith(s))) {
    throw HTTPError(
      400,
      "The thumbnailUrl does not begin with 'http://' or 'https://'"
    );
  }

  quiz.timeLastEdited = quiz.timeCreated;
  quiz.numQuestions++;
  quiz.duration += duration;

  const ans = [];
  for (const a of answers) {
    ans.push({
      answerId: ans.length * 3 + 2003,
      answer: a.answer,
      colour: randomColourGenerator(),
      correct: a.correct,
    });
  }
  const questionId = data.questions.length * 4 + 1999;
  data.questions.push({
    questionId,
    quizId,
    question,
    duration,
    thumbnailUrl,
    points,
    answers: ans,
  });

  data.results.push({
    questionId,
    playersCorrectList: [],
    averageAnswerTime: 0,
    percentCorrect: 0,
  });
  setData(data);
  return { questionId };
}

/**
 * Update quiz question.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {number} questionId of the question
 * @param {string} question for the quiz
 * @param {number} duration of the question
 * @param {number} points of the question
 * @param {array} answers of the question
 * @param {string} thumbnailUrl of the quiz
 * @returns {object}
 */

export function adminQuizQuestionUpdate(
  token: string,
  quizId: number,
  questionId: number,
  question: string,
  duration: number,
  points: number,
  answers: Answer[],
  thumbnailUrl: string
): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);
  const ques = data.questions
    .filter((q) => q.quizId === quizId)
    .find((q) => q.questionId === questionId);
  if (!ques) {
    throw HTTPError(400, `Invalid questionId ${questionId}.`);
  }

  if (
    question.length < 5 ||
    question.length > 50 ||
    answers.length < 2 ||
    answers.length > 6
  ) {
    throw HTTPError(400, 'Invalid question or invalid numbers of answers.');
  }

  if (duration < 1 || quiz.duration + duration > 180) {
    throw HTTPError(
      400,
      'Invalid duration, or the sum of the question durations in the quiz exceeds 3 minutes.'
    );
  }

  if (points < 1 || points > 10) {
    throw HTTPError(400, 'Invalid points.');
  }

  if (answers.some((a) => a.answer.length < 1 || a.answer.length > 30)) {
    throw HTTPError(400, 'Invalid answers.');
  }

  if (
    containDuplicateAnswer(answers) ||
    !answers.some((a) => a.correct === true)
  ) {
    throw HTTPError(
      400,
      'There exists answer string which is a duplicate of another answer, or there are no correct answers.'
    );
  }

  if (!thumbnailUrl) {
    throw HTTPError(400, 'The thumbnailUrl is an empty string');
  }

  if (!['jpg', 'jpeg', 'png'].some((s) => thumbnailUrl.endsWith(s))) {
    throw HTTPError(
      400,
      'The thumbnailUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png'
    );
  }

  if (!['http://', 'https://'].some((s) => thumbnailUrl.startsWith(s))) {
    throw HTTPError(
      400,
      "The thumbnailUrl does not begin with 'http://' or 'https://'"
    );
  }

  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  const ans = [];
  for (const a of answers) {
    ans.push({
      answerId: ans.length * 3 + 3123,
      answer: a.answer,
      colour: randomColourGenerator(),
      correct: a.correct,
    });
  }

  ques.question = question;
  ques.duration = duration;
  ques.thumbnailUrl = thumbnailUrl;
  ques.points = points;
  ques.answers = ans;
  setData(data);
  return {};
}

/**
 * Delete quiz question.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {number} questionId for the quiz
 * @returns {object}
 */

export function adminQuizQuestionDelete(
  token: string,
  quizId: number,
  questionId: number
): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((q) => q.quizId === quizId);
  const question = data.questions
    .filter((q) => q.quizId === quizId)
    .find((q) => q.questionId === questionId);
  if (!question) {
    throw HTTPError(
      400,
      'questionId does not refer to a valid question within this quiz'
    );
  }

  const quizSession = data.quizSessions
    .filter((s) => s.metadata.quizId === quizId)
    .every((s) => s.state === State.END);
  if (!quizSession) {
    throw HTTPError(400, 'All sessions for this quiz must be in END state.');
  }

  quiz.duration -= question.duration;
  quiz.numQuestions--;
  const index = data.questions.indexOf(question);
  data.questions.splice(index, 1);
  setData(data);
  return {};
}

/**
 * Move quiz question.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {number} questionId for the quiz
 * @param {number} newPosition of the quiz question
 * @returns {object}
 */

export function adminQuizQuestionMove(
  token: string,
  quizId: number,
  questionId: number,
  newPosition: number
): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((q) => q.quizId === quizId);
  const question = data.questions
    .filter((q) => q.quizId === quizId)
    .find((q) => q.questionId === questionId);
  if (!question) {
    throw HTTPError(400, 'Invalid questionId.');
  }

  const questionList = data.questions.filter((q) => q.quizId === quizId);
  if (newPosition < 0 || newPosition >= questionList.length) {
    throw HTTPError(400, 'Invalid newPosition.');
  }

  if (newPosition === questionList.indexOf(question)) {
    throw HTTPError(
      400,
      'newPosition is the position of the current question.'
    );
  }

  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  const index = questionList.indexOf(question);
  questionList.splice(index, 1);
  questionList.splice(newPosition, 0, question);

  for (let i = 0; i < questionList.length; i++) {
    const q = data.questions.find(
      (q) => q.questionId === questionList[i].questionId
    );
    data.questions.splice(data.questions.indexOf(q), 1);
  }
  data.questions.push(...questionList);
  setData(data);
  return {};
}

/**
 * Duplicate quiz question.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {number} questionId for the quiz
 * @returns {object}
 */

export function adminQuizQuestionDuplicate(
  token: string,
  quizId: number,
  questionId: number
): { newQuestionId: number } {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((q) => q.quizId === quizId);
  const question = data.questions
    .filter((q) => q.quizId === quizId)
    .find((q) => q.questionId === questionId);
  if (!question) {
    throw HTTPError(
      400,
      'Question Id does not refer to a valid question within this quiz.'
    );
  }

  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  const questionDup = { ...question };
  const newQuestionId = data.questions.length * 5 + 3121;
  questionDup.questionId = newQuestionId;
  data.questions.splice(data.questions.indexOf(question) + 1, 0, questionDup);
  quiz.numQuestions++;
  quiz.duration += question.duration;
  setData(data);
  return { newQuestionId };
}

/**
 * Update quiz thumbnail.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {string} thumbnail for the quiz
 * @returns {object}
 */

export function adminQuizThumbnailUpdate(
  token: string,
  quizId: number,
  imgUrl: string
) {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((q) => q.quizId === quizId);

  if (!['jpg', 'jpeg', 'png'].some((s) => imgUrl.endsWith(s))) {
    throw HTTPError(
      400,
      'The imgUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png'
    );
  }

  if (!['http://', 'https://'].some((s) => imgUrl.startsWith(s))) {
    throw HTTPError(
      400,
      "The imgUrl does not begin with 'http://' or 'https://'"
    );
  }

  quiz.thumbnailUrl = imgUrl;
  setData(data);
  return {};
}

/**
 * Start a quiz session.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {number} autoStartNum of a quiz session
 * @returns {object}
 */

export function adminQuizSessionStart(
  token: string,
  quizId: number,
  autoStartNum: number
): { sessionId: number } {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quiz = data.quizzes.find((q) => q.quizId === quizId);

  if (autoStartNum < 1 || autoStartNum > 50) {
    throw HTTPError(400, 'Invalid autoStartNum');
  }

  if (!quiz.numQuestions) {
    throw HTTPError(400, 'The quiz does not have any questions in it');
  }

  const quizSession = data.quizSessions
    .filter((s) => s.metadata.quizId === quizId)
    .filter((s) => s.state !== State.END);
  if (quizSession.length >= 10) {
    throw HTTPError(
      400,
      'A maximum of 10 sessions that are not in END state currently exist'
    );
  }

  const sessionId = randomNumber();
  data.quizSessions.push({
    sessionId,
    state: State.LOBBY,
    atQuestion: 0,
    metadata: { ...quiz },
    questionCountDown: undefined,
    questionDuration: undefined,
  });
  setData(data);
  return { sessionId };
}

/**
 * Update a quiz session state.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {number} sessionId of a quiz session
 * @param {string} action
 * @returns {object}
 */

export function adminQuizSessionState(
  token: string,
  quizId: number,
  sessionId: number,
  action: string
): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }

  const quizSession = data.quizSessions
    .filter((s) => s.metadata.quizId === quizId)
    .find((s) => s.sessionId === sessionId);
  if (!quizSession) {
    throw HTTPError(
      400,
      'Session Id does not refer to a valid session within this quiz'
    );
  }

  if (
    ![
      Action.END,
      Action.GO_TO_ANSWER,
      Action.GO_TO_FINAL_RESULTS,
      Action.NEXT_QUESTION,
      Action.SKIP_COUNTDOWN,
    ].includes(action as Action)
  ) {
    throw HTTPError(400, 'Action provided is not a valid Action enum');
  }

  const question = data.questions.filter(
    (q) => q.quizId === quizSession.metadata.quizId
  );

  if (action === Action.NEXT_QUESTION) {
    if (
      [State.LOBBY, State.QUESTION_CLOSE, State.ANSWER_SHOW].includes(
        quizSession.state as State
      )
    ) {
      quizSession.atQuestion++;
      quizSession.state = State.QUESTION_COUNTDOWN;
      // TODO setTimeOut to wait 3 seconds
      quizSession.questionCountDown = setTimeout(() => {
        quizSession.state = State.QUESTION_OPEN;
        console.log('Wait for 3 seconds then move to QUESTION_OPEN');

        quizSession.questionDuration = setTimeout(() => {
          quizSession.state = State.QUESTION_CLOSE;
          console.log('Wait for duration seconds then move to QUESTION_CLOSE');
        }, question[quizSession.atQuestion - 1].duration * 1000);
      }, 3 * 1000);
    } else {
      throw HTTPError(
        400,
        'Action enum cannot be applied in the current state'
      );
    }
  } else if (action === Action.SKIP_COUNTDOWN) {
    if (quizSession.state === State.QUESTION_COUNTDOWN) {
      // TODO clearTimeOut
      clearTimeout(quizSession.questionCountDown);
      clearTimeout(quizSession.questionDuration);
      quizSession.state = State.QUESTION_OPEN;
      quizSession.questionCountDown = undefined;
      quizSession.questionDuration = undefined;

      // TODO setTimeOut to wait questionDuration time
      quizSession.questionDuration = setTimeout(() => {
        quizSession.state = State.QUESTION_CLOSE;
        console.log('Wait for duration seconds then move to QUESTION_CLOSE');
      }, question[quizSession.atQuestion - 1].duration * 1000);
    } else {
      throw HTTPError(
        400,
        'Action enum cannot be applied in the current state'
      );
    }
  } else if (action === Action.GO_TO_ANSWER) {
    if (
      [State.QUESTION_OPEN, State.QUESTION_CLOSE].includes(
        quizSession.state as State
      )
    ) {
      clearTimeout(quizSession.questionDuration);
      quizSession.questionDuration = undefined;
      quizSession.state = State.ANSWER_SHOW;
    } else {
      throw HTTPError(
        400,
        'Action enum cannot be applied in the current state'
      );
    }
  } else if (action === Action.GO_TO_FINAL_RESULTS) {
    if (
      [State.QUESTION_CLOSE, State.ANSWER_SHOW].includes(
        quizSession.state as State
      )
    ) {
      quizSession.state = State.FINAL_RESULTS;
    } else {
      throw HTTPError(
        400,
        'Action enum cannot be applied in the current state'
      );
    }
  } else {
    clearTimeout(quizSession.questionCountDown);
    clearTimeout(quizSession.questionDuration);
    quizSession.questionCountDown = undefined;
    quizSession.questionDuration = undefined;
    quizSession.state = State.END;
  }
  return {};
}

/**
 * View a quiz session.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @returns {object}
 */

export function adminQuizSessionView(
  token: string,
  quizId: number
): SessionView {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quizSession = data.quizSessions.filter(
    (s) => s.metadata.quizId === quizId
  );
  const activeSessions = quizSession
    .filter((s) => s.state !== State.END)
    .map((s) => s.sessionId)
    .sort((a, b) => a - b);
  const inactiveSessions = quizSession
    .filter((s) => s.state === State.END)
    .map((s) => s.sessionId)
    .sort((a, b) => a - b);
  return { activeSessions, inactiveSessions };
}

/**
 * Get a quiz session status.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {number} sessionId of a quiz session
 * @returns {object}
 */

export function adminQuizSessionStatus(
  token: string,
  quizId: number,
  sessionId: number
): SessionStatus {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quizSession = data.quizSessions
    .filter((s) => s.metadata.quizId === quizId)
    .find((s) => s.sessionId === sessionId);
  if (!quizSession) {
    throw HTTPError(
      400,
      'Session Id does not refer to a valid session within this quiz'
    );
  }
  const { ownerId, ...details } = quizSession.metadata;
  const questions = data.questions
    .filter((q) => q.quizId === quizId)
    .map(({ quizId, ...details }) => details);
  const players = data.players
    .filter((p) => p.sessionId === sessionId)
    .map((p) => p.name);

  return {
    state: quizSession.state,
    atQuestion: quizSession.atQuestion,
    players,
    metadata: { ...details, questions },
  };
}

/**
 * Get a quiz session final result.
 *
 * @param {string} token of user
 * @param {number} quizId the quiz's id
 * @param {number} sessionId of a quiz session
 * @returns {object}
 */

export function adminQuizSessionResults(
  token: string,
  quizId: number,
  sessionId: number
) {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);
  const userQuiz = data.quizzes
    .filter((q) => q.ownerId === user.authUserId)
    .map((q) => q.quizId);
  if (!userQuiz.includes(quizId)) {
    throw HTTPError(
      403,
      `This user does not own the quiz with quizId ${quizId}.`
    );
  }
  const quizSession = data.quizSessions
    .filter((s) => s.metadata.quizId === quizId)
    .find((s) => s.sessionId === sessionId);
  if (!quizSession) {
    throw HTTPError(
      400,
      'Session Id does not refer to a valid session within this quiz'
    );
  }
  if (quizSession.state !== State.FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  const usersRankedByScore = data.players
    .filter((p) => p.sessionId === quizSession.sessionId)
    .map(({ playerId, sessionId, ...details }) => details)
    .sort((a, b) => b.score - a.score);

  const questionList = data.questions.filter(
    (q) => q.quizId === quizSession.metadata.quizId
  );
  const questionIdList = questionList.map((q) => q.questionId);
  const questionResults = data.results.filter((r) =>
    questionIdList.includes(r.questionId)
  );
  questionResults.forEach((r) =>
    r.playersCorrectList.sort((a, b) => a.localeCompare(b))
  );
  return { usersRankedByScore, questionResults };
}
