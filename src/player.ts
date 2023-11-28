import { getData } from './dataStore';
import { State } from './quiz';
import HTTPError from 'http-errors';

export interface PlayerJoinReturn {
  playerId: number;
}

interface Answer {
  answerId: number;
  answer: string;
  colour: string;
}

export interface QuestionInfo {
  questionId: number;
  question: string;
  duration: number;
  thumbnailUrl: string;
  points: number;
  answers: Answer[];
}

interface QuestionResult {
  questionId: number;
  playersCorrectList: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

// Helper function to generate random name that conforms to [5 letters][3 numbers]
function generateRandomName() {
  const generateRandomString = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 5; i++) {
      let randomCharacter;
      do {
        randomCharacter = characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      } while (result.includes(randomCharacter));
      result += randomCharacter;
    }
    return result;
  };

  const generateRandomNumbers = () => {
    let result = '';
    for (let i = 0; i < 3; i++) {
      let randomNumber;
      do {
        randomNumber = Math.floor(Math.random() * 10);
      } while (result.includes(randomNumber.toString()));
      result += randomNumber;
    }
    return result;
  };
  return generateRandomString() + generateRandomNumbers();
}

/**
 * Get player to join the quiz.
 *
 * @param {string} name of user
 * @param {number} sessionId of a quiz session
 * @returns {object}
 */

export function playerJoin(sessionId: number, name: string): PlayerJoinReturn {
  const data = getData();
  const quizSession = data.quizSessions.find((s) => s.sessionId === sessionId);
  if (!quizSession) {
    throw HTTPError(400, 'Invalid sessionId');
  }
  const sessionPlayers = data.players
    .filter((p) => p.sessionId === sessionId)
    .some((p) => p.name === name);
  if (sessionPlayers) {
    throw HTTPError(400, 'Name of user entered is not unique.');
  }

  if (quizSession.state !== State.LOBBY) {
    throw HTTPError(400, 'Session is not in Lobby state');
  }

  if (!name) {
    name = generateRandomName();
  }
  const playerId = data.players.length * -3 - 5413;
  data.players.push({ playerId, sessionId, name, score: 0 });
  return { playerId };
}

/**
 * Get player status.
 * @param {number} playerId of a quiz session
 * @returns {object}
 */

export function playerStatus(playerId: number) {
  const data = getData();
  const player = data.players.find((player) => player.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'Player Id is not found!');
  }
  const session = data.quizSessions.find(
    (p) => p.sessionId === player.sessionId
  );
  return {
    state: session.state,
    numQuestions: session.metadata.numQuestions,
    atQuestion: session.atQuestion,
  };
}

/**
 * Current questiion information for a player
 * @param {number} playerId of the player
 * @param {number} questionPosition of the player
 * @returns {object}
 */

export function playerQuestionInfo(
  playerId: number,
  questionPosition: number
): QuestionInfo {
  const data = getData();
  const player = data.players.find((p) => p.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'player ID does not exist');
  }

  const session = data.quizSessions.find(
    (s) => s.sessionId === player.sessionId
  );
  if (
    !session ||
    questionPosition < 1 ||
    questionPosition > session.metadata.numQuestions
  ) {
    throw HTTPError(
      400,
      'question position is not valid for the session this player is in!'
    );
  }

  if (
    session.atQuestion !== questionPosition ||
    session.state === State.LOBBY ||
    session.state === State.END
  ) {
    throw HTTPError(
      400,
      'session is not currently on this question or session is in LOBBY/END state'
    );
  }

  const question = data.questions.filter(
    (q) => q.quizId === session.metadata.quizId
  );

  const questionInfo = { ...question[questionPosition - 1] };
  const answer = questionInfo.answers.map(({ correct, ...details }) => details);
  const { quizId, answers, ...details } = questionInfo;
  return { ...details, answers: answer };
}

/**
 * Player submission of answer(s).
 * @param {number} playerId of the player
 * @param {questionPosition} questionPosition of the player
 * @param {answerIds: Array} answerIds of the player
 * @returns {object}
 */

export function playerAnswerSubmission(
  playerId: number,
  questionPosition: number,
  answerIds: number[]
): object {
  const data = getData();
  const player = data.players.find((p) => p.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'Player ID does not exist');
  }
  const session = data.quizSessions.find(
    (s) => s.sessionId === player.sessionId
  );
  if (
    !session ||
    questionPosition < 1 ||
    questionPosition > session.metadata.numQuestions
  ) {
    throw HTTPError(
      400,
      'question position is not valid for the session this player is in'
    );
  }
  if (session.state !== State.QUESTION_OPEN) {
    throw HTTPError(400, 'Session is not in QUESTION_OPEN state');
  }

  if (session.atQuestion < questionPosition) {
    throw HTTPError(400, 'session is not yet up to this question');
  }

  const question = data.questions.filter(
    (q) => q.quizId === session.metadata.quizId
  );

  const targetQuestion = question[questionPosition - 1];
  const validAnswerIds = targetQuestion.answers.map((a) => a.answerId);
  if (!answerIds.every((i) => validAnswerIds.includes(i))) {
    throw HTTPError(
      400,
      'Answer IDs are not valid for this particular question'
    );
  }

  // Check for duplicate answer IDs
  const uniqueAnswerIds = Array.from(new Set(answerIds));
  if (uniqueAnswerIds.length !== answerIds.length) {
    throw HTTPError(400, 'Duplicate answer IDs provided');
  }

  // Check if at least 1 answer ID was submitted
  if (answerIds.length < 1) {
    throw HTTPError(400, 'Less than 1 answer ID was submitted');
  }

  const answerSubmit: boolean[] = [];
  for (const i of answerIds) {
    const answer = targetQuestion.answers.find((a) => a.answerId === i);
    answerSubmit.push(answer.correct);
  }

  const result = data.results.find(
    (r) => r.questionId === targetQuestion.questionId
  );

  if (!answerSubmit.some((a) => a === true)) {
    player.score += 0;
  } else {
    const isMultipleCorrect = targetQuestion.answers.filter(
      (a) => a.correct === true
    );
    if (isMultipleCorrect.length !== 1) {
      if (
        answerSubmit.filter((a) => a === true).length !==
        isMultipleCorrect.length
      ) {
        player.score += 0;
        return {};
      }
    }
    const correctPlayers = result.playersCorrectList.length + 1;
    const scalingFactor = 1 / correctPlayers;
    player.score += targetQuestion.points * scalingFactor;
    player.score = parseFloat(player.score.toFixed(1));
    result.playersCorrectList.push(player.name);
  }
  return {};
}

/**
 * Get the question results
 * @param {number} playerId of the player
 * @param {number} questionPosition
 * @returns {object}
 */

export function getQuestionResults(
  playerId: number,
  questionPosition: number
): QuestionResult {
  const data = getData();
  const player = data.players.find((p) => p.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'Invalid playerId!');
  }
  const session = data.quizSessions.find(
    (s) => s.sessionId === player.sessionId
  );

  if (
    questionPosition < 1 ||
    questionPosition > session.metadata.numQuestions
  ) {
    throw HTTPError(400, 'Invalid Question Position!');
  }

  if (session.state !== State.ANSWER_SHOW) {
    throw HTTPError(400, 'Session state is not set to show answers!');
  }

  if (session.atQuestion < questionPosition) {
    throw HTTPError(400, 'Session is not up to question yet!');
  }

  const question = data.questions.filter(
    (q) => q.quizId === session.metadata.quizId
  )[questionPosition - 1];
  const result = data.results.find((r) => r.questionId === question.questionId);
  result.playersCorrectList.sort((a, b) => a.localeCompare(b));
  return result;
}

/**
 * Get the player session results
 * @param {number} playerId of the player
 * @returns {object}
 */

export function getPlayerSessionResults(playerId: number) {
  const data = getData();
  const player = data.players.find((p) => p.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'Invalid playerId!');
  }
  const session = data.quizSessions.find(
    (s) => s.sessionId === player.sessionId
  );

  if (session.state !== State.FINAL_RESULTS) {
    throw HTTPError(400, 'Session state is not FINAL_RESULTS');
  }

  const usersRankedByScore = data.players
    .filter((p) => p.sessionId === session.sessionId)
    .map(({ playerId, sessionId, ...details }) => details)
    .sort((a, b) => b.score - a.score);

  const questionList = data.questions.filter(
    (q) => q.quizId === session.metadata.quizId
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

/**
 * Send a chat messsage in a session
 * @param {number} playerId of the player
 * @param {string} messageBody
 * @returns {object}
 */

export function playerChatSend(playerId: number, messageBody: string) {
  const data = getData();
  const player = data.players.find((p) => p.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'Invalid playerId!');
  }
  if (messageBody.length < 1 || messageBody.length > 100) {
    throw HTTPError(
      400,
      'Message body is less than 1 character or more than 100 characters'
    );
  }
  const timeSent = Math.floor(Date.now() / 1000);
  data.messages.push({
    messageBody,
    playerId: player.playerId,
    playerName: player.name,
    timeSent,
  });
  return {};
}

/**
 * Show chat messsage in a session
 * @param {number} playerId of the player
 * @returns {object}
 */

export function showChat(playerId: number) {
  const data = getData();
  const player = data.players.find((p) => p.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'Invalid playerId!');
  }
  const allPlayerInSession = data.players
    .filter((p) => p.sessionId === player.sessionId)
    .map((p) => p.playerId);
  const messages = data.messages
    .filter((m) => allPlayerInSession.includes(m.playerId))
    .sort((a, b) => b.timeSent - a.timeSent);
  return { messages };
}
