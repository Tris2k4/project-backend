import { requestHelper } from './HTTPRequest';
import { adminAuthRegister } from './auth.test';
import { adminQuizCreate, adminQuizInfo } from './quiz.test';
import { adminQuizQuestionCreate } from './quizQuestion.test';
import { clear } from './other.test';
import { AuthUserToken } from './auth';
import {
  QuizCreateReturn,
  QuestionCreateReturn,
  State,
  Action,
  SessionStatus,
} from './quiz';
import { QuestionInfo } from './player';

const ERROR = { error: expect.any(String) };

// Helper function to sort an array of number
function sortIdAscending(nums: number[]): number[] {
  return nums.sort((a: number, b: number) => a - b);
}

// Helper function to get the state of a particular quizSession
function getState(quizSession: SessionStatus): string {
  return quizSession.state;
}

// Helper function to get the players of a particular quizSession
function getPlayers(quizSession: SessionStatus): string[] {
  return quizSession.players;
}

// Helper function to get the answerIds of a particular question
function getAnswerIDs(question: QuestionInfo): number[] {
  return question.answers.map((a) => a.answerId);
}

const generateTimeStamp = () => Math.floor(Date.now() / 1000);

function checkTimestamp(timestamp: number, expectedTimestamp: number) {
  /**
   * Allow for 1 seconds offset
   */
  expect(timestamp).toBeGreaterThanOrEqual(expectedTimestamp - 1);
  expect(timestamp).toBeLessThan(expectedTimestamp + 1);
}

// Function to block execution (i.e. sleep)
// Not ideal (inefficent/poor performance) and should not be used often.
//
// Alternatives include:
// - https://www.npmjs.com/package/atomic-sleep
// - or use async (not covered in this course!)
function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

// Iteration 3 wrapper functions
function adminQuizThumbnailUpdate(
  token: string,
  quizId: number,
  imgUrl: string
) {
  return requestHelper(
    'PUT',
    `/v1/admin/quiz/${quizId}/thumbnail`,
    { imgUrl },
    { token }
  );
}

export function adminQuizSessionStart(
  token: string,
  quizId: number,
  autoStartNum: number
) {
  return requestHelper(
    'POST',
    `/v1/admin/quiz/${quizId}/session/start`,
    { autoStartNum },
    { token }
  );
}

export function adminQuizSessionState(
  token: string,
  quizId: number,
  sessionId: number,
  action: string
) {
  return requestHelper(
    'PUT',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { action },
    { token }
  );
}

function adminQuizSessionView(token: string, quizId: number) {
  return requestHelper(
    'GET',
    `/v1/admin/quiz/${quizId}/sessions`,
    {},
    { token }
  );
}

function adminQuizSessionStatus(
  token: string,
  quizId: number,
  sessionId: number
) {
  return requestHelper(
    'GET',
    `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    {},
    { token }
  );
}

function playerJoin(sessionId: number, name: string) {
  return requestHelper('POST', '/v1/player/join', { sessionId, name });
}

function playerQuestionInfo(playerId: number, questionPosition: number) {
  return requestHelper(
    'GET',
    `/v1/player/${playerId}/question/${questionPosition}`,
    {}
  );
}

function adminQuizSessionResults(
  token: string,
  quizId: number,
  sessionId: number
) {
  return requestHelper(
    'GET',
    `/v1/admin/quiz/${quizId}/session/${sessionId}/results`,
    {},
    { token }
  );
}

function playerAnswerSubmission(
  playerId: number,
  questionPosition: number,
  answerIds: number[]
) {
  return requestHelper(
    'PUT',
    `/v1/player/${playerId}/question/${questionPosition}/answer`,
    { answerIds }
  );
}

function playerStatus(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}`, {});
}

function getQuestionResults(playerId: number, questionPosition: number) {
  return requestHelper(
    'GET',
    `/v1/player/${playerId}/question/${questionPosition}/results`,
    {}
  );
}

function getPlayerSessionResults(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}/results`, {});
}

function showChat(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}/chat`, {});
}

function playerChatSend(playerId: number, messageBody: string) {
  return requestHelper('POST', `/v1/player/${playerId}/chat`, {
    message: { messageBody },
  });
}

beforeEach(clear);
afterAll(clear);

describe('/v1/admin/quiz/:quizid/thumbnail', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(
      user.token,
      'Chemistry Quiz',
      'Periodic Table questions'
    ).responseBody;
  });

  test.each([
    { url: '' },
    { url: 'https://example.com/invalid-image.gif' },
    { url: 'https://example.com/invalid-image.JPG' },
    { url: 'https://example.com/invalid-image.PNG' },
    { url: 'HTTP://example.com/invalid-image.jpg' },
    { url: 'HTTPS://example.com/invalid-image.png' },
    { url: 'example.com/invalid-image.jpg' },
    { url: 'ttps://example.com/invalid-image.jpg' },
  ])("Invalid url: '$url'", ({ url }) => {
    const { responseBody, statusCode } = adminQuizThumbnailUpdate(
      user.token,
      quiz.quizId,
      url
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('ERROR: Invalid user token', () => {
    const { responseBody, statusCode } = adminQuizThumbnailUpdate(
      user.token + 1,
      quiz.quizId,
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png/200px-Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('ERROR: Empty token', () => {
    const { responseBody, statusCode } = adminQuizThumbnailUpdate(
      '',
      quiz.quizId,
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizThumbnailUpdate(
      user.token,
      quiz.quizId + 1,
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png/200px-Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz:', () => {
    const user2 = adminAuthRegister(
      'abcd@gmail.com',
      '123abc!@#',
      'Ben',
      'Xa'
    ).responseBody;
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '').responseBody;
    const { responseBody, statusCode } = adminQuizThumbnailUpdate(
      user.token,
      quiz2.quizId,
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Correct return type with JPG image file', () => {
    const { responseBody, statusCode } = adminQuizThumbnailUpdate(
      user.token,
      quiz.quizId,
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Chemistry Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Periodic Table questions',
      numQuestions: 0,
      questions: [],
      duration: 0,
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg',
    });
  });

  test('Correct return type with PNG image file', () => {
    const { responseBody, statusCode } = adminQuizThumbnailUpdate(
      user.token,
      quiz.quizId,
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png/200px-Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png'
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Chemistry Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Periodic Table questions',
      numQuestions: 0,
      questions: [],
      duration: 0,
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png/200px-Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png',
    });
  });
});

describe('/v1/admin/quiz/:quizid/session/start', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
  });

  test.each([
    { autoStartNum: -1 },
    { autoStartNum: 0 },
    { autoStartNum: 51 },
    { autoStartNum: 123 },
  ])("Invalid autoStartNum: '$autoStartNum'", ({ autoStartNum }) => {
    const { responseBody, statusCode } = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      autoStartNum
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('quiz does not have any questions in it', () => {
    const { responseBody, statusCode } = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      3
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('maximum of 10 sessions that are not in END state currently exist', () => {
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);

    const { responseBody, statusCode } = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('ERROR: Invalid user token', () => {
    const { responseBody, statusCode } = adminQuizSessionStart(
      user.token + 1,
      quiz.quizId,
      3
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('ERROR: Empty token', () => {
    const { responseBody, statusCode } = adminQuizSessionStart(
      '',
      quiz.quizId,
      3
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizSessionStart(
      user.token,
      quiz.quizId + 1,
      3
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz:', () => {
    const user2 = adminAuthRegister(
      'abcd@gmail.com',
      '123abc!@#',
      'Ben',
      'Xa'
    ).responseBody;
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '').responseBody;
    const { responseBody, statusCode } = adminQuizSessionStart(
      user.token,
      quiz2.quizId,
      3
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Correct return type', () => {
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );

    const { responseBody, statusCode } = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    );
    expect(responseBody).toStrictEqual({ sessionId: expect.any(Number) });
    expect(statusCode).toStrictEqual(200);
  });
});

describe('/v1/admin/quiz/:quizid/sessionState', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
  });

  test('Invalid sessionId', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId + 123141289,
      Action.END
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Invalid action', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.END + 1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  describe('Action enum cannot be applied in the current state', () => {
    test('Action is NEXT_QUESTION but quiz state is not LOBBY/QUESTION_CLOSE/ANSWER_SHOW', () => {
      const session = adminQuizSessionStart(
        user.token,
        quiz.quizId,
        1
      ).responseBody;
      adminQuizSessionState(
        user.token,
        quiz.quizId,
        session.sessionId,
        Action.NEXT_QUESTION
      );
      const sessionStatus = adminQuizSessionStatus(
        user.token,
        quiz.quizId,
        session.sessionId
      ).responseBody;
      expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_COUNTDOWN);
      const { responseBody, statusCode } = adminQuizSessionState(
        user.token,
        quiz.quizId,
        session.sessionId,
        Action.NEXT_QUESTION
      );

      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    });
    test('Action is SKIP_COUNTDOWN but quiz state is not QUESTION_COUNTDOWN', () => {
      const session = adminQuizSessionStart(
        user.token,
        quiz.quizId,
        1
      ).responseBody;
      const sessionStatus = adminQuizSessionStatus(
        user.token,
        quiz.quizId,
        session.sessionId
      ).responseBody;
      expect(getState(sessionStatus)).toStrictEqual(State.LOBBY);
      const { responseBody, statusCode } = adminQuizSessionState(
        user.token,
        quiz.quizId,
        session.sessionId,
        Action.SKIP_COUNTDOWN
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    });
    test('Action is GO_TO_ANSWER but quiz state is not QUESTION_OPEN/QUESTION_CLOSE', () => {
      const session = adminQuizSessionStart(
        user.token,
        quiz.quizId,
        1
      ).responseBody;
      const sessionStatus = adminQuizSessionStatus(
        user.token,
        quiz.quizId,
        session.sessionId
      ).responseBody;
      expect(getState(sessionStatus)).toStrictEqual(State.LOBBY);
      const { responseBody, statusCode } = adminQuizSessionState(
        user.token,
        quiz.quizId,
        session.sessionId,
        Action.GO_TO_ANSWER
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    });
    test('Action is GO_TO_FINAL_RESULTS but quiz state is not QUESTION_CLOSE/ANSWER_SHOW', () => {
      const session = adminQuizSessionStart(
        user.token,
        quiz.quizId,
        1
      ).responseBody;
      const sessionStatus = adminQuizSessionStatus(
        user.token,
        quiz.quizId,
        session.sessionId
      ).responseBody;
      expect(getState(sessionStatus)).toStrictEqual(State.LOBBY);
      const { responseBody, statusCode } = adminQuizSessionState(
        user.token,
        quiz.quizId,
        session.sessionId,
        Action.GO_TO_FINAL_RESULTS
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    });
  });

  test('ERROR: Invalid user token', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionState(
      user.token + 1,
      quiz.quizId,
      session.sessionId,
      Action.END
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('ERROR: Empty token', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionState(
      '',
      quiz.quizId,
      session.sessionId,
      Action.END
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionState(
      user.token,
      quiz.quizId + 1,
      session.sessionId,
      Action.END
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz:', () => {
    const user2 = adminAuthRegister(
      'abcd@gmail.com',
      '123abc!@#',
      'Ben',
      'Xa'
    ).responseBody;
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '').responseBody;

    adminQuizQuestionCreate(
      user2.token,
      quiz2.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    const session2 = adminQuizSessionStart(
      user2.token,
      quiz2.quizId,
      1
    ).responseBody;

    const { responseBody, statusCode } = adminQuizSessionState(
      user.token,
      quiz2.quizId,
      session2.sessionId,
      Action.END
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Test END action', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.END
    );
    const sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.END);
  });
  test('Test NEXT_QUESTION action without SKIP_COUNTDOWN action', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    let sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_COUNTDOWN);
    sleepSync(3000);
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_OPEN);
    sleepSync(4000);
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_CLOSE);
  });
  test('Test NEXT_QUESTION action with SKIP_COUNTDOWN action', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    let sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_COUNTDOWN);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_OPEN);
    sleepSync(4000);
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_CLOSE);
  });
  test('Test GO_TO_ANSWER action', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    let sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_COUNTDOWN);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_OPEN);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.ANSWER_SHOW);
  });
  test('Test GO_TO_FINAL_RESULTS action', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    let sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_COUNTDOWN);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.QUESTION_OPEN);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.ANSWER_SHOW);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_FINAL_RESULTS
    );
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.FINAL_RESULTS);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.END
    );
    sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getState(sessionStatus)).toStrictEqual(State.END);
  });
});

describe('/v1/admin/quiz/sessionsView', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
  });

  test('ERROR: Invalid user token', () => {
    const { responseBody, statusCode } = adminQuizSessionView(
      user.token + 1,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('ERROR: Empty token', () => {
    const { responseBody, statusCode } = adminQuizSessionView('', quiz.quizId);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizSessionView(
      user.token,
      quiz.quizId + 1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz:', () => {
    const user2 = adminAuthRegister(
      'abcd@gmail.com',
      '123abc!@#',
      'Ben',
      'Xa'
    ).responseBody;
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '').responseBody;

    const { responseBody, statusCode } = adminQuizSessionView(
      user.token,
      quiz2.quizId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Quiz has no session', () => {
    const { responseBody, statusCode } = adminQuizSessionView(
      user.token,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual({
      activeSessions: [],
      inactiveSessions: [],
    });
    expect(statusCode).toStrictEqual(200);
  });

  test('Quiz has only active sessions', () => {
    const s1 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s2 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s3 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s4 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      s1.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      s3.sessionId,
      Action.NEXT_QUESTION
    );

    const { responseBody, statusCode } = adminQuizSessionView(
      user.token,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual({
      activeSessions: sortIdAscending([
        s1.sessionId,
        s2.sessionId,
        s3.sessionId,
        s4.sessionId,
      ]),
      inactiveSessions: [],
    });
    expect(statusCode).toStrictEqual(200);
  });
  test('Quiz has only inactive sessions', () => {
    const s1 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s2 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s3 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s4 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    adminQuizSessionState(user.token, quiz.quizId, s1.sessionId, Action.END);
    adminQuizSessionState(user.token, quiz.quizId, s2.sessionId, Action.END);
    adminQuizSessionState(user.token, quiz.quizId, s3.sessionId, Action.END);
    adminQuizSessionState(user.token, quiz.quizId, s4.sessionId, Action.END);

    const { responseBody, statusCode } = adminQuizSessionView(
      user.token,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual({
      activeSessions: [],
      inactiveSessions: sortIdAscending([
        s1.sessionId,
        s2.sessionId,
        s3.sessionId,
        s4.sessionId,
      ]),
    });
    expect(statusCode).toStrictEqual(200);
  });
  test('Quiz has mixed active and inactive sessions', () => {
    const s1 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s2 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s3 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s4 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    const s5 = adminQuizSessionStart(user.token, quiz.quizId, 1).responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      s1.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(user.token, quiz.quizId, s2.sessionId, Action.END);
    adminQuizSessionState(user.token, quiz.quizId, s4.sessionId, Action.END);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      s5.sessionId,
      Action.NEXT_QUESTION
    );

    const { responseBody, statusCode } = adminQuizSessionView(
      user.token,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual({
      activeSessions: sortIdAscending([
        s1.sessionId,
        s3.sessionId,
        s5.sessionId,
      ]),
      inactiveSessions: sortIdAscending([s2.sessionId, s4.sessionId]),
    });
    expect(statusCode).toStrictEqual(200);
  });
});

describe('/v1/admin/quiz/sessionStatus', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn, ques: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    ques = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    ).responseBody;
  });

  test('Invalid sessionId', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId + 123141289
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('ERROR: Invalid user token', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionStatus(
      user.token + 1,
      quiz.quizId,
      session.sessionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('ERROR: Empty token', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionStatus(
      '',
      quiz.quizId,
      session.sessionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionStatus(
      user.token,
      quiz.quizId + 1,
      session.sessionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz:', () => {
    const user2 = adminAuthRegister(
      'abcd@gmail.com',
      '123abc!@#',
      'Ben',
      'Xa'
    ).responseBody;
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '').responseBody;

    adminQuizQuestionCreate(
      user2.token,
      quiz2.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    const session2 = adminQuizSessionStart(
      user2.token,
      quiz2.quizId,
      1
    ).responseBody;

    const { responseBody, statusCode } = adminQuizSessionStatus(
      user.token,
      quiz2.quizId,
      session2.sessionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Correct return type', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    );
    expect(responseBody).toStrictEqual({
      state: State.LOBBY,
      atQuestion: expect.any(Number),
      players: [],
      metadata: {
        quizId: quiz.quizId,
        name: 'My Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: '',
        numQuestions: 1,
        questions: [
          {
            questionId: ques.questionId,
            question: 'Who is the Monarch of England',
            duration: 4,
            thumbnailUrl:
              'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg',
            points: 5,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'Princess Charles',
                colour: expect.any(String),
                correct: false,
              },
              {
                answerId: expect.any(Number),
                answer: 'Prince Charles',
                colour: expect.any(String),
                correct: true,
              },
            ],
          },
        ],
        duration: 4,
        thumbnailUrl: '',
      },
    });
    expect(statusCode).toStrictEqual(200);
  });
});

describe('playerJoin', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
  });

  test('Invalid sessionId', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = playerJoin(
      session.sessionId + 123141289,
      'Thomas'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Name of user entered is not unique:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    playerJoin(session.sessionId, 'Lucas');
    playerJoin(session.sessionId, 'Thomas');
    playerJoin(session.sessionId, 'Kevin');
    const { responseBody, statusCode } = playerJoin(
      session.sessionId,
      'Thomas'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Session is not in LOBBY state:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    const { responseBody, statusCode } = playerJoin(session.sessionId, 'Harry');
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return type with one player:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = playerJoin(session.sessionId, 'Harry');
    expect(responseBody).toStrictEqual({ playerId: expect.any(Number) });
    expect(statusCode).toStrictEqual(200);

    const sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getPlayers(sessionStatus)).toStrictEqual(['Harry']);
  });

  test('Correct return type with many players:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    playerJoin(session.sessionId, 'Harry');
    playerJoin(session.sessionId, 'Kevin');
    playerJoin(session.sessionId, 'Thomas');
    playerJoin(session.sessionId, 'Lucas');
    const sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getPlayers(sessionStatus)).toStrictEqual([
      'Harry',
      'Kevin',
      'Thomas',
      'Lucas',
    ]);
  });

  test('Correct return type with input as empty name:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = playerJoin(session.sessionId, '');
    expect(responseBody).toStrictEqual({ playerId: expect.any(Number) });
    expect(statusCode).toStrictEqual(200);

    const sessionStatus = adminQuizSessionStatus(
      user.token,
      quiz.quizId,
      session.sessionId
    ).responseBody;
    expect(getPlayers(sessionStatus)).toStrictEqual([expect.any(String)]);
  });
});

describe('/v1/admin/quiz/sessionFinalResults', () => {
  let user: AuthUserToken,
    quiz: QuizCreateReturn,
    question: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    question = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    ).responseBody;
  });

  test('Invalid sessionId', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionResults(
      user.token,
      quiz.quizId,
      session.sessionId + 123141289
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Session is not in FINAL_RESULTS state', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionResults(
      user.token,
      quiz.quizId,
      session.sessionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('ERROR: Invalid user token', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionResults(
      user.token + 1,
      quiz.quizId,
      session.sessionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('ERROR: Empty token', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionResults(
      '',
      quiz.quizId,
      session.sessionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const { responseBody, statusCode } = adminQuizSessionResults(
      user.token,
      quiz.quizId + 1,
      session.sessionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz:', () => {
    const user2 = adminAuthRegister(
      'abcd@gmail.com',
      '123abc!@#',
      'Ben',
      'Xa'
    ).responseBody;
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '').responseBody;

    adminQuizQuestionCreate(
      user2.token,
      quiz2.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    const session2 = adminQuizSessionStart(
      user2.token,
      quiz2.quizId,
      1
    ).responseBody;

    const { responseBody, statusCode } = adminQuizSessionResults(
      user.token,
      quiz2.quizId,
      session2.sessionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Correct return type', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const player2 = playerJoin(session.sessionId, 'Kevin').responseBody;
    const player3 = playerJoin(session.sessionId, 'Lucas').responseBody;
    const player4 = playerJoin(session.sessionId, 'Thomas').responseBody;
    const player5 = playerJoin(session.sessionId, 'Hanni').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );

    const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
    const answerIds = getAnswerIDs(questionInfo);
    playerAnswerSubmission(player.playerId, 1, [answerIds[0], answerIds[1]]);
    playerAnswerSubmission(player2.playerId, 1, [answerIds[0]]);
    playerAnswerSubmission(player3.playerId, 1, [answerIds[1]]);
    playerAnswerSubmission(player4.playerId, 1, [answerIds[0]]);
    playerAnswerSubmission(player5.playerId, 1, [answerIds[1], answerIds[0]]);

    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_FINAL_RESULTS
    );
    const { responseBody, statusCode } = adminQuizSessionResults(
      user.token,
      quiz.quizId,
      session.sessionId
    );
    expect(responseBody).toStrictEqual({
      usersRankedByScore: [
        { name: 'Harry', score: 5 },
        { name: 'Lucas', score: 2.5 },
        { name: 'Hanni', score: 1.7 },
        { name: 'Kevin', score: 0 },
        { name: 'Thomas', score: 0 },
      ],
      questionResults: [
        {
          questionId: question.questionId,
          playersCorrectList: ['Hanni', 'Harry', 'Lucas'],
          averageAnswerTime: 0,
          percentCorrect: 0,
        },
      ],
    });
    expect(statusCode).toStrictEqual(200);
  });
});

describe('/v1/player/statusPlayer', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
  });

  test('Invalid playerId:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;

    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerStatus(player.playerId + 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return type', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerStatus(player.playerId);
    expect(responseBody).toStrictEqual({
      state: 'LOBBY',
      numQuestions: 1,
      atQuestion: 0,
    });
    expect(statusCode).toStrictEqual(200);
  });
});

describe('/v1/player/questionInfo', () => {
  let user: AuthUserToken,
    quiz: QuizCreateReturn,
    question: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    question = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    ).responseBody;
  });

  test('player ID does not exist', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;

    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerQuestionInfo(
      player.playerId + 1,
      1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('question position is not valid for the session this player is in', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerQuestionInfo(player.playerId, 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test.each([{ pos: -3 }, { pos: 0 }, { pos: 2 }])(
    "Invalid pos: '$pos'",
    ({ pos }) => {
      const session = adminQuizSessionStart(
        user.token,
        quiz.quizId,
        1
      ).responseBody;
      const player = playerJoin(session.sessionId, 'Harry').responseBody;
      const { responseBody, statusCode } = playerQuestionInfo(
        player.playerId,
        pos
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    }
  );
  test('session is not currently on this question', () => {
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is ME',
      4,
      5,
      [
        {
          answer: 'ME',
          correct: false,
        },
        {
          answer: 'EM',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerQuestionInfo(player.playerId, 2);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('Session is in LOBBY state', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerQuestionInfo(player.playerId, 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('Session is in END state', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.END
    );
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerQuestionInfo(player.playerId, 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('Correct return type', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    const { responseBody, statusCode } = playerQuestionInfo(player.playerId, 1);
    expect(responseBody).toStrictEqual({
      questionId: question.questionId,
      question: 'Who is the Monarch of England',
      duration: 4,
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg',
      points: 5,
      answers: [
        {
          answerId: expect.any(Number),
          answer: 'Princess Charles',
          colour: expect.any(String),
        },
        {
          answerId: expect.any(Number),
          answer: 'Prince Charles',
          colour: expect.any(String),
        },
      ],
    });
    expect(statusCode).toStrictEqual(200);
  });
});

describe('/v1/player/question/answerSubmission', () => {
  let user: AuthUserToken,
    quiz: QuizCreateReturn,
    question: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    question = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'HANNI',
          correct: false,
        },
        {
          answer: 'ITS ME',
          correct: false,
        },
        {
          answer: 'NOPE',
          correct: false,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    ).responseBody;
  });

  test('player ID does not exist', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId + 1,
      1,
      getAnswerIDs(questionInfo)
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test.each([{ pos: -3 }, { pos: 0 }, { pos: 2 }])(
    "Invalid question position: '$pos'",
    ({ pos }) => {
      const session = adminQuizSessionStart(
        user.token,
        quiz.quizId,
        1
      ).responseBody;
      const player = playerJoin(session.sessionId, 'Harry').responseBody;
      adminQuizSessionState(
        user.token,
        quiz.quizId,
        session.sessionId,
        Action.NEXT_QUESTION
      );
      const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
      const { responseBody, statusCode } = playerAnswerSubmission(
        player.playerId,
        pos,
        getAnswerIDs(questionInfo)
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    }
  );
  test('Session is not in QUESTION_OPEN state', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      1,
      getAnswerIDs(questionInfo)
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('session is not yet up to this question', () => {
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is ME',
      4,
      5,
      [
        {
          answer: 'ME',
          correct: false,
        },
        {
          answer: 'EM',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      2,
      getAnswerIDs(questionInfo)
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('Answer IDs are not valid for this particular question', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
    const answerIds = getAnswerIDs(questionInfo);
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      1,
      [answerIds[0] + 1, answerIds[1]]
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('duplicate answer IDs provided', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
    const answerIds = getAnswerIDs(questionInfo);
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      1,
      [answerIds[0], answerIds[0], answerIds[1]]
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('Less than 1 answer ID was submitted', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      1,
      []
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('Do not get the question correct, 0 score', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
    const answerIds = getAnswerIDs(questionInfo);
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      1,
      [answerIds[0]]
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const result = getQuestionResults(player.playerId, 1).responseBody;
    expect(result).toStrictEqual({
      questionId: question.questionId,
      playersCorrectList: [],
      averageAnswerTime: 0,
      percentCorrect: 0,
    });
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_FINAL_RESULTS
    );
    const sessionResult = getPlayerSessionResults(player.playerId).responseBody;
    expect(sessionResult).toStrictEqual({
      usersRankedByScore: [{ name: 'Harry', score: 0 }],
      questionResults: [
        {
          questionId: question.questionId,
          playersCorrectList: [],
          averageAnswerTime: 0,
          percentCorrect: 0,
        },
      ],
    });
  });
  test('Single-correct-answer', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      1,
      getAnswerIDs(questionInfo)
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const result = getQuestionResults(player.playerId, 1).responseBody;
    expect(result).toStrictEqual({
      questionId: question.questionId,
      playersCorrectList: ['Harry'],
      averageAnswerTime: 0,
      percentCorrect: 0,
    });
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_FINAL_RESULTS
    );
    const sessionResult = getPlayerSessionResults(player.playerId).responseBody;
    expect(sessionResult).toStrictEqual({
      usersRankedByScore: [{ name: 'Harry', score: 5 }],
      questionResults: [
        {
          questionId: question.questionId,
          playersCorrectList: ['Harry'],
          averageAnswerTime: 0,
          percentCorrect: 0,
        },
      ],
    });
  });
  test('Multiple-correct-answers but not select all correct answers', () => {
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is ME',
      4,
      5,
      [
        {
          answer: 'EM',
          correct: true,
        },
        {
          answer: 'ME',
          correct: false,
        },
        {
          answer: 'EMM',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      2
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    const questionInfo = playerQuestionInfo(player.playerId, 2).responseBody;
    const answerIds = getAnswerIDs(questionInfo);
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      2,
      [answerIds[0], answerIds[1]]
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const result = getQuestionResults(player.playerId, 1).responseBody;
    expect(result).toStrictEqual({
      questionId: question.questionId,
      playersCorrectList: [],
      averageAnswerTime: 0,
      percentCorrect: 0,
    });
  });
  test('Multiple-correct-answers but select all correct answers', () => {
    const question2 = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is ME',
      4,
      5,
      [
        {
          answer: 'EM',
          correct: true,
        },
        {
          answer: 'ME',
          correct: false,
        },
        {
          answer: 'EMM',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    ).responseBody;
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      2
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    const questionInfo = playerQuestionInfo(player.playerId, 2).responseBody;
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      2,
      getAnswerIDs(questionInfo)
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const result = getQuestionResults(player.playerId, 2).responseBody;
    expect(result).toStrictEqual({
      questionId: question2.questionId,
      playersCorrectList: ['Harry'],
      averageAnswerTime: 0,
      percentCorrect: 0,
    });
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_FINAL_RESULTS
    );
    const sessionResult = getPlayerSessionResults(player.playerId).responseBody;
    expect(sessionResult).toStrictEqual({
      usersRankedByScore: [{ name: 'Harry', score: 5 }],
      questionResults: [
        {
          questionId: question.questionId,
          playersCorrectList: [],
          averageAnswerTime: 0,
          percentCorrect: 0,
        },
        {
          questionId: question2.questionId,
          playersCorrectList: ['Harry'],
          averageAnswerTime: 0,
          percentCorrect: 0,
        },
      ],
    });
  });

  test('Multiple players but only 1 correct answer in the current question', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const player2 = playerJoin(session.sessionId, 'Kevin').responseBody;
    const player3 = playerJoin(session.sessionId, 'Lucas').responseBody;
    const player4 = playerJoin(session.sessionId, 'Thomas').responseBody;
    const player5 = playerJoin(session.sessionId, 'Hanni').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    const questionInfo = playerQuestionInfo(player.playerId, 1).responseBody;
    const answerIds = getAnswerIDs(questionInfo);
    const { responseBody, statusCode } = playerAnswerSubmission(
      player.playerId,
      1,
      [answerIds[0], answerIds[1]]
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);
    playerAnswerSubmission(player2.playerId, 1, [answerIds[0]]);
    playerAnswerSubmission(player3.playerId, 1, [answerIds[1]]);
    playerAnswerSubmission(player4.playerId, 1, [answerIds[0]]);
    playerAnswerSubmission(player5.playerId, 1, [answerIds[1], answerIds[0]]);

    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const result = getQuestionResults(player.playerId, 1).responseBody;
    expect(result).toStrictEqual({
      questionId: question.questionId,
      playersCorrectList: ['Hanni', 'Harry', 'Lucas'],
      averageAnswerTime: 0,
      percentCorrect: 0,
    });
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_FINAL_RESULTS
    );
    const sessionResult = getPlayerSessionResults(player.playerId).responseBody;
    expect(sessionResult).toStrictEqual({
      usersRankedByScore: [
        { name: 'Harry', score: 5 },
        { name: 'Lucas', score: 2.5 },
        { name: 'Hanni', score: 1.7 },
        { name: 'Kevin', score: 0 },
        { name: 'Thomas', score: 0 },
      ],
      questionResults: [
        {
          questionId: question.questionId,
          playersCorrectList: ['Hanni', 'Harry', 'Lucas'],
          averageAnswerTime: 0,
          percentCorrect: 0,
        },
      ],
    });
  });
});

describe('iter3/v1/player/playerChatSend', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
  });

  test('Invalid playerId:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerChatSend(
      player.playerId + 1,
      'hihihihihi'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Message body is less than 1 character:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerChatSend(player.playerId, '');
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Message body is more than 100 character:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerChatSend(
      player.playerId,
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc,'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return type:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const { responseBody, statusCode } = playerChatSend(
      player.playerId,
      'hello'
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);
  });
});

describe('/v1/player/{playerid}/question/{questionposition}/results', () => {
  let user: AuthUserToken,
    quiz: QuizCreateReturn,
    question: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(
      user.token,
      'Monarch Quiz',
      'Quiz on Monarchs'
    ).responseBody;

    question = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    ).responseBody;
  });

  test('ERROR: Invalid player Id', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const { responseBody, statusCode } = getQuestionResults(
      player.playerId + 32323232,
      1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('ERROR: Invalid question position', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const { responseBody, statusCode } = getQuestionResults(
      player.playerId,
      23323
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('ERROR: Session is not yet up to this question', () => {
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who was the first emperor of Roman Empire',
      4,
      5,
      [
        {
          answer: 'Gaius Octavius',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: false,
        },
        {
          answer: 'Julius Caesar',
          correct: false,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const { responseBody, statusCode } = getQuestionResults(player.playerId, 2);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('ERROR: Session is not in ANSWER_SHOW state ', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    const { responseBody, statusCode } = getQuestionResults(player.playerId, 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return case', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const { responseBody, statusCode } = getQuestionResults(player.playerId, 1);
    expect(responseBody).toStrictEqual({
      questionId: question.questionId,
      playersCorrectList: [],
      averageAnswerTime: 0,
      percentCorrect: 0,
    });
    expect(statusCode).toStrictEqual(200);
  });
});

describe('/v1/player/:playerid/results', () => {
  let user: AuthUserToken,
    quiz: QuizCreateReturn,
    question: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(
      user.token,
      'Monarch Quiz',
      'Quiz on Monarchs'
    ).responseBody;

    question = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    ).responseBody;
  });

  test('ERROR: Invalid player Id', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_FINAL_RESULTS
    );
    const { responseBody, statusCode } = getPlayerSessionResults(
      player.playerId + 32323232
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Session is not in FINAL_RESULTS state', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    const { responseBody, statusCode } = getPlayerSessionResults(
      player.playerId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return case', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.NEXT_QUESTION
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.SKIP_COUNTDOWN
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_ANSWER
    );
    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.GO_TO_FINAL_RESULTS
    );
    const { responseBody, statusCode } = getPlayerSessionResults(
      player.playerId
    );
    expect(responseBody).toStrictEqual({
      usersRankedByScore: [{ name: 'Harry', score: 0 }],
      questionResults: [
        {
          questionId: question.questionId,
          playersCorrectList: [],
          averageAnswerTime: 0,
          percentCorrect: 0,
        },
      ],
    });
    expect(statusCode).toStrictEqual(200);
  });
});

describe('iter3/v1/showChat', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
  });

  test('Invalid playerId:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    playerChatSend(player.playerId, 'hello');
    const { responseBody, statusCode } = showChat(player.playerId + 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return type with 1 comment:', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const expectedTimestamp = generateTimeStamp();
    playerChatSend(player.playerId, 'hello');
    const { statusCode } = showChat(player.playerId);
    const { responseBody } = showChat(player.playerId);
    expect(responseBody).toStrictEqual({
      messages: [
        {
          messageBody: 'hello',
          playerId: expect.any(Number),
          playerName: 'Harry',
          timeSent: expect.any(Number),
        },
      ],
    });
    checkTimestamp(responseBody.messages[0].timeSent, expectedTimestamp);
    expect(statusCode).toStrictEqual(200);
  });

  test('Correct return type with more than 1 comments', () => {
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    const player = playerJoin(session.sessionId, 'Harry').responseBody;
    const player2 = playerJoin(session.sessionId, 'Ron').responseBody;
    const player3 = playerJoin(session.sessionId, 'Hermione').responseBody;
    const expectedTimestamp = generateTimeStamp();
    playerChatSend(player.playerId, 'hello');
    sleepSync(3000);
    const expectedTimestamp2 = generateTimeStamp();
    playerChatSend(player2.playerId, 'hi Harry');
    sleepSync(2000);
    const expectedTimestamp3 = generateTimeStamp();
    playerChatSend(player3.playerId, 'Hi guys');
    const { statusCode } = showChat(player2.playerId);
    const { responseBody } = showChat(player2.playerId);
    expect(responseBody).toStrictEqual({
      messages: [
        {
          messageBody: 'Hi guys',
          playerId: player3.playerId,
          playerName: 'Hermione',
          timeSent: expect.any(Number),
        },
        {
          messageBody: 'hi Harry',
          playerId: player2.playerId,
          playerName: 'Ron',
          timeSent: expect.any(Number),
        },
        {
          messageBody: 'hello',
          playerId: player.playerId,
          playerName: 'Harry',
          timeSent: expect.any(Number),
        },
      ],
    });
    checkTimestamp(responseBody.messages[2].timeSent, expectedTimestamp);
    checkTimestamp(responseBody.messages[1].timeSent, expectedTimestamp2);
    checkTimestamp(responseBody.messages[0].timeSent, expectedTimestamp3);
    expect(statusCode).toStrictEqual(200);
  });
});
