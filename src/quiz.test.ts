import { requestHelper } from './HTTPRequest';
import { adminAuthRegister } from './auth.test';
import { adminQuizQuestionCreate } from './quizQuestion.test';
import { adminQuizSessionStart, adminQuizSessionState } from './it3_quiz.test';
import { clear } from './other.test';
import { AuthUserToken } from './auth';
import { QuizCreateReturn, Action } from './quiz';

const ERROR = { error: expect.any(String) };

// Iteration 2 wrapper functions
function adminQuizList(token: string) {
  return requestHelper('GET', '/v2/admin/quiz/list', {}, { token });
}

export function adminQuizCreate(
  token: string,
  name: string,
  description: string
) {
  return requestHelper(
    'POST',
    '/v2/admin/quiz',
    {
      name,
      description,
    },
    { token }
  );
}

export function adminQuizRemove(token: string, quizId: number) {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizId}`, {}, { token });
}

export function adminQuizInfo(token: string, quizId: number) {
  return requestHelper('GET', `/v2/admin/quiz/${quizId}`, {}, { token });
}

function adminQuizNameUpdate(token: string, quizId: number, name: string) {
  return requestHelper(
    'PUT',
    `/v2/admin/quiz/${quizId}/name`,
    { name },
    { token }
  );
}

function adminQuizDescriptionUpdate(
  token: string,
  quizId: number,
  description: string
) {
  return requestHelper(
    'PUT',
    `/v2/admin/quiz/${quizId}/description`,
    { description },
    { token }
  );
}

export function adminQuizViewTrash(token: string) {
  return requestHelper('GET', '/v2/admin/quiz/trash', {}, { token });
}

function adminQuizRestore(token: string, quizId: number) {
  return requestHelper(
    'POST',
    `/v2/admin/quiz/${quizId}/restore`,
    {},
    { token }
  );
}

export function adminQuizEmptyTrash(token: string, quizIds: number[]) {
  return requestHelper(
    'DELETE',
    '/v2/admin/quiz/trash/empty',
    {
      quizIds,
    },
    { token }
  );
}

function adminQuizTransfer(token: string, quizId: number, userEmail: string) {
  return requestHelper(
    'POST',
    `/v2/admin/quiz/${quizId}/transfer`,
    {
      userEmail,
    },
    { token }
  );
}

beforeEach(clear);
afterAll(clear);

describe('/v1/admin/quiz/list', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn, quiz2: QuizCreateReturn;
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
    quiz2 = adminQuizCreate(
      user.token,
      'Physics Quiz',
      'Kinematics questions'
    ).responseBody;
  });

  test('ERROR: Invalid user token', () => {
    const { responseBody, statusCode } = adminQuizList(user.token + 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('ERROR: Empty token', () => {
    const { responseBody, statusCode } = adminQuizList('');
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Success', () => {
    const expected = new Set([
      {
        quizId: quiz.quizId,
        name: 'Chemistry Quiz',
      },
      {
        quizId: quiz2.quizId,
        name: 'Physics Quiz',
      },
    ]);

    const { responseBody, statusCode } = adminQuizList(user.token);
    const received = new Set(responseBody.quizzes);
    expect(received).toStrictEqual(expected);
    expect(statusCode).toStrictEqual(200);
  });

  test('Success: Added another quiz', () => {
    const res3 = adminQuizCreate(
      user.token,
      'Mathematics Quiz',
      'Calculus questions'
    );
    const quiz3 = res3.responseBody;

    const expected = new Set([
      {
        quizId: quiz.quizId,
        name: 'Chemistry Quiz',
      },
      {
        quizId: quiz2.quizId,
        name: 'Physics Quiz',
      },
      {
        quizId: quiz3.quizId,
        name: 'Mathematics Quiz',
      },
    ]);

    const { responseBody, statusCode } = adminQuizList(user.token);
    const received = new Set(responseBody.quizzes);
    expect(received).toStrictEqual(expected);
    expect(statusCode).toStrictEqual(200);
  });
});

describe('/v1/admin/quizCreate', () => {
  let user: AuthUserToken;
  beforeEach(() => {
    user = adminAuthRegister(
      'ab123@gmail.com',
      'abcd12345',
      'Johnny',
      'Dang'
    ).responseBody;
  });

  test('ERROR: Invalid user token', () => {
    const { responseBody, statusCode } = adminQuizCreate(
      user.token + 1,
      'Quiz Quiz',
      ''
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('ERROR: Empty token', () => {
    const { responseBody, statusCode } = adminQuizCreate('', 'Quiz Quiz', '');
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test.each([
    { name: '' },
    { name: 'ab' },
    { name: 'ajsdhajkshdakjshakjcbksjbaksjdjdafhdjs' },
    { name: 'Johnny Dang!' },
  ])("Invalid name: '$name'", ({ name }) => {
    const { responseBody, statusCode } = adminQuizCreate(user.token, name, '');
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    {
      description:
        'asdjkfh woqueyqwoi8efasjkdkjasdnfaskljdfhopwurljksdffsjsfjsfdjfsdjalsdkjfajqwoieurqwejaslkdjfaslkdjfwpqfs',
    },
  ])("Invalid description addresses: '$description'", ({ description }) => {
    const { responseBody, statusCode } = adminQuizCreate(
      user.token,
      'Johnny Dang',
      description
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Name is already used by the current logged in user for another quiz', () => {
    adminQuizCreate(user.token, 'My Quiz', '');
    const { responseBody, statusCode } = adminQuizCreate(
      user.token,
      'My Quiz',
      'OSKELUON'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return type', () => {
    const { responseBody, statusCode } = adminQuizCreate(
      user.token,
      'My Quiz',
      ''
    );
    expect(responseBody).toStrictEqual({
      quizId: expect.any(Number),
    });
    expect(statusCode).toStrictEqual(200);
  });
});

describe('adminQuizRemove base case tests:', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
  });

  test('All sessions for this quiz must be in END state', () => {
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
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);

    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.END
    );
    const { responseBody, statusCode } = adminQuizRemove(
      user.token,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminQuizRemove(
      user.token + 1,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminQuizRemove('', quiz.quizId);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizRemove(
      user.token,
      quiz.quizId + 1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz:', () => {
    const user2 = adminAuthRegister('abcd@gmail.com', '123abc!@#', 'Ben', 'Xa');
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '');
    const { responseBody, statusCode } = adminQuizRemove(
      user.token,
      quiz2.quizId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });
});

describe('adminQuizRemove normal tests:', () => {
  test('Test with adminQuizInfo:', () => {
    const user = adminAuthRegister(
      'hiihih@gmail.com',
      '2321abdd!A@',
      'Hehe',
      'Haha'
    ).responseBody;
    const quiz = adminQuizCreate(user.token, 'Quiz 1', '').responseBody;
    const { responseBody, statusCode } = adminQuizRemove(
      user.token,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);

    expect(adminQuizInfo(user.token, quiz.quizId).statusCode).toStrictEqual(
      403
    );
  });
});

describe('adminQuizInfo base case tests:', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminQuizInfo('fjljfaaa', quiz.quizId);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminQuizInfo('', quiz.quizId);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizInfo(
      user.token,
      quiz.quizId + 1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz:', () => {
    const user2 = adminAuthRegister(
      'hiihih@gmail.com',
      '2321abdd!A@',
      'Hehe',
      'Haha'
    );
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '');
    const { responseBody, statusCode } = adminQuizInfo(
      user.token,
      quiz2.quizId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });
});

describe('adminQuizInfo normal test cases:', () => {
  test('Test 1:', () => {
    const user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    const quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;

    const expected = {
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 0,
      questions: expect.any(Array),
      duration: 0,
      thumbnailUrl: '',
    };

    const received = adminQuizInfo(user.token, quiz.quizId);
    expect(received.responseBody.timeCreated).toStrictEqual(
      received.responseBody.timeLastEdited
    );
    expect(received.responseBody).toStrictEqual(expected);
    expect(received.statusCode).toStrictEqual(200);
  });
});

describe('/v1/admin/quiz/:quizid/name', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
  });

  test.each([
    { name: '' },
    { name: 'ab' },
    { name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    { name: 'as@bd1 123ajdn' },
    { name: 'asbd1123!jdn' },
  ])("Invalid name: '$name'", ({ name }) => {
    const { responseBody, statusCode } = adminQuizNameUpdate(
      user.token,
      quiz.quizId,
      name
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Name is already used', () => {
    const { responseBody, statusCode } = adminQuizNameUpdate(
      user.token,
      quiz.quizId,
      'My Quiz'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminQuizNameUpdate(
      '',
      quiz.quizId,
      'Quiz 1'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminQuizNameUpdate(
      'aefaaf',
      quiz.quizId,
      'Quiz 1'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizNameUpdate(
      user.token,
      quiz.quizId + 1,
      'Quiz 1'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('quizID does not refer to a quiz that the user owns', () => {
    const user2 = adminAuthRegister(
      'hahahehe@gmail.com',
      '456abc!@#',
      'Kevin',
      'Ngo'
    );
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '');
    const { responseBody, statusCode } = adminQuizNameUpdate(
      user.token,
      quiz2.quizId,
      'Quiz 2'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Corret return type', () => {
    const quiz2 = adminQuizCreate(user.token, 'Quiz 2', '').responseBody;
    const { responseBody, statusCode } = adminQuizNameUpdate(
      user.token,
      quiz.quizId,
      'Quiz 1'
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);

    const expected = new Set([
      {
        quizId: quiz.quizId,
        name: 'Quiz 1',
      },
      {
        quizId: quiz2.quizId,
        name: 'Quiz 2',
      },
    ]);

    const received = new Set(adminQuizList(user.token).responseBody.quizzes);

    expect(received).toStrictEqual(expected);

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 0,
      questions: expect.any(Array),
      duration: 0,
      thumbnailUrl: '',
    });
  });
});

describe('adminQuizDescriptionUpdate base case tests:', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminQuizDescriptionUpdate(
      'jadaljasd',
      quiz.quizId,
      'fjljaf'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminQuizDescriptionUpdate(
      '',
      quiz.quizId,
      'fjljaf'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizDescriptionUpdate(
      user.token,
      quiz.quizId + 1,
      'fjljaf'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('quizID does not refer to a quiz that the user owns', () => {
    const user2 = adminAuthRegister(
      'hiihih@gmail.com',
      '2321abdd!A@',
      'Hehe',
      'Haha'
    );
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '');
    const { responseBody, statusCode } = adminQuizDescriptionUpdate(
      user.token,
      quiz2.quizId,
      'fjljaf'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test("Invalid description's length", () => {
    const { responseBody, statusCode } = adminQuizDescriptionUpdate(
      user.token,
      quiz.quizId,
      'fjljafaskjdfhskjdhfskjldhfasjkhafskjdhjashdkjfasdkjaskjdfhasjdajsdfhakjshfksjdhfksjdhfkjwheouirqwesadjhfajskdhfkja'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
});

describe('adminQuizDescriptionUpdate normal tests', () => {
  test('Test 1: ', () => {
    const user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    const quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 0,
      questions: expect.any(Array),
      duration: 0,
      thumbnailUrl: '',
    });

    const { responseBody, statusCode } = adminQuizDescriptionUpdate(
      user.token,
      quiz.quizId,
      'this is a description!'
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'this is a description!',
      numQuestions: 0,
      questions: expect.any(Array),
      duration: 0,
      thumbnailUrl: '',
    });
  });
});

describe('adminQuizViewTrash base case tests:', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
  });

  test('Invalid token:', () => {
    adminQuizRemove(user.token, quiz.quizId);
    const { responseBody, statusCode } = adminQuizViewTrash(user.token + 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Empty token:', () => {
    adminQuizRemove(user.token, quiz.quizId);
    const { responseBody, statusCode } = adminQuizViewTrash('');
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });
});

describe('adminQuizViewTrash normal tests:', () => {
  test('Test 1:', () => {
    const user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    const quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    const quiz2 = adminQuizCreate(user.token, 'My Quiz2', '').responseBody;
    const quiz3 = adminQuizCreate(user.token, 'My Quiz3', '').responseBody;

    let expected = new Set([
      {
        quizId: quiz.quizId,
        name: 'My Quiz',
      },
      {
        quizId: quiz2.quizId,
        name: 'My Quiz2',
      },
      {
        quizId: quiz3.quizId,
        name: 'My Quiz3',
      },
    ]);

    let received = new Set(adminQuizList(user.token).responseBody.quizzes);

    expect(received).toStrictEqual(expected);

    adminQuizRemove(user.token, quiz2.quizId);
    adminQuizRemove(user.token, quiz3.quizId);

    expect(adminQuizList(user.token).responseBody.quizzes).toStrictEqual([
      {
        quizId: quiz.quizId,
        name: 'My Quiz',
      },
    ]);

    expected = new Set([
      {
        quizId: quiz2.quizId,
        name: 'My Quiz2',
      },
      {
        quizId: quiz3.quizId,
        name: 'My Quiz3',
      },
    ]);

    received = new Set(adminQuizViewTrash(user.token).responseBody.quizzes);
    expect(received).toStrictEqual(expected);
  });
});

describe('adminQuizRestore base case tests:', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
  });

  test('Quiz is not in trash', () => {
    const { responseBody, statusCode } = adminQuizRestore(
      user.token,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Invalid quizId', () => {
    adminQuizRemove(user.token, quiz.quizId);
    const { responseBody, statusCode } = adminQuizRestore(
      user.token,
      quiz.quizId + 1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Quiz name is already used by another active quiz', () => {
    adminQuizRemove(user.token, quiz.quizId);
    adminQuizCreate(user.token, 'My Quiz', '');
    const { responseBody, statusCode } = adminQuizRestore(
      user.token,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Empty token:', () => {
    adminQuizRemove(user.token, quiz.quizId);
    const { responseBody, statusCode } = adminQuizRestore('', quiz.quizId);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token:', () => {
    adminQuizRemove(user.token, quiz.quizId);
    const { responseBody, statusCode } = adminQuizRestore(
      user.token + 1,
      quiz.quizId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('user is not an owner of this quiz', () => {
    const user2 = adminAuthRegister(
      'hiihih@gmail.com',
      '2321abdd!A@',
      'Hehe',
      'Haha'
    ).responseBody;
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '').responseBody;
    adminQuizRemove(user2.token, quiz2.quizId);
    const res = adminQuizRestore(user.token, quiz2.quizId);
    expect(res.responseBody).toStrictEqual(ERROR);
    expect(res.statusCode).toStrictEqual(403);
  });
});

describe('adminQuizRestore normal tests:', () => {
  test('Test 1:', () => {
    const user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    const quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    adminQuizRemove(user.token, quiz.quizId);

    expect(adminQuizList(user.token).responseBody.quizzes).toStrictEqual([]);

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual(
      ERROR
    );

    expect(adminQuizViewTrash(user.token).responseBody.quizzes).toStrictEqual([
      {
        quizId: quiz.quizId,
        name: 'My Quiz',
      },
    ]);

    expect(
      adminQuizRestore(user.token, quiz.quizId).responseBody
    ).toStrictEqual({});

    expect(adminQuizViewTrash(user.token).responseBody.quizzes).toStrictEqual(
      []
    );

    expect(adminQuizList(user.token).responseBody.quizzes).toStrictEqual([
      {
        quizId: quiz.quizId,
        name: 'My Quiz',
      },
    ]);

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 0,
      questions: expect.any(Array),
      duration: 0,
      thumbnailUrl: '',
    });
  });
});

describe('adminQuizEmptyTrash base case tests:', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
  });

  test('QuizId is not in the trash:', () => {
    const quiz2 = adminQuizCreate(user.token, 'My Quiz2', '').responseBody;
    adminQuizRemove(user.token, quiz.quizId);
    adminQuizRemove(user.token, quiz2.quizId);
    const { responseBody, statusCode } = adminQuizEmptyTrash(user.token, [
      quiz.quizId + 1,
      quiz2.quizId,
    ]);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Empty token:', () => {
    adminQuizRemove(user.token, quiz.quizId);
    const { responseBody, statusCode } = adminQuizEmptyTrash('', [quiz.quizId]);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token:', () => {
    adminQuizRemove(user.token, quiz.quizId);
    const { responseBody, statusCode } = adminQuizEmptyTrash(user.token + 1, [
      quiz.quizId,
    ]);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Valid token but user does not own this quiz:', () => {
    const user2 = adminAuthRegister(
      'anotheremail@gmail.com',
      'password123',
      'Another',
      'User'
    ).responseBody;
    const quiz2 = adminQuizCreate(user2.token, 'Another Quiz', '').responseBody;
    const quiz3 = adminQuizCreate(
      user2.token,
      'Another another Quiz',
      ''
    ).responseBody;
    adminQuizRemove(user2.token, quiz2.quizId);
    adminQuizRemove(user2.token, quiz3.quizId);
    const { responseBody, statusCode } = adminQuizEmptyTrash(user.token, [
      quiz2.quizId,
      quiz3.quizId,
    ]);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });
});

describe('adminQuizEmptyTrash normal tests:', () => {
  test('Test 1:', () => {
    const user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    const quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    const quiz2 = adminQuizCreate(user.token, 'My Quiz2', '').responseBody;
    const quiz3 = adminQuizCreate(user.token, 'hello', 'Yeahhhhh').responseBody;
    adminQuizRemove(user.token, quiz.quizId);
    adminQuizRemove(user.token, quiz2.quizId);
    adminQuizRemove(user.token, quiz3.quizId);
    expect(
      adminQuizEmptyTrash(user.token, [quiz.quizId, quiz2.quizId, quiz3.quizId])
        .responseBody
    ).toStrictEqual({});

    expect(adminQuizViewTrash(user.token).responseBody.quizzes).toStrictEqual(
      []
    );
  });
});

describe('adminQuizTransfer base case tests:', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
  });

  test('User email is not a real user', () => {
    const { responseBody, statusCode } = adminQuizTransfer(
      user.token,
      quiz.quizId,
      'hihi@gmail.com'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('User email is the current logged in user', () => {
    const { responseBody, statusCode } = adminQuizTransfer(
      user.token,
      quiz.quizId,
      'validemail@gmail.com'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Quiz ID refers to a quiz that has a name that is already used by the target user', () => {
    const user2 = adminAuthRegister(
      'hiihih@gmail.com',
      '2321abdd!A@',
      'Hehe',
      'Haha'
    ).responseBody;
    adminQuizCreate(user2.token, 'My Quiz', '');
    adminQuizCreate(user2.token, 'My Quiz2', '');
    const { responseBody, statusCode } = adminQuizTransfer(
      user.token,
      quiz.quizId,
      'hiihih@gmail.com'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('All sessions for this quiz must be in END state', () => {
    adminAuthRegister('hiihih@gmail.com', '2321abdd!A@', 'Hehe', 'Haha');
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
    const session = adminQuizSessionStart(
      user.token,
      quiz.quizId,
      1
    ).responseBody;
    adminQuizSessionStart(user.token, quiz.quizId, 1);
    adminQuizSessionStart(user.token, quiz.quizId, 1);

    adminQuizSessionState(
      user.token,
      quiz.quizId,
      session.sessionId,
      Action.END
    );
    const { responseBody, statusCode } = adminQuizTransfer(
      user.token,
      quiz.quizId,
      'hiihih@gmail.com'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Invalid token', () => {
    adminAuthRegister('hiihih@gmail.com', '2321abdd!A@', 'Hehe', 'Haha');
    const { responseBody, statusCode } = adminQuizTransfer(
      user.token + 1,
      quiz.quizId,
      'hiihih@gmail.com'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Empty token', () => {
    adminAuthRegister('hiihih@gmail.com', '2321abdd!A@', 'Hehe', 'Haha');
    const { responseBody, statusCode } = adminQuizTransfer(
      '',
      quiz.quizId,
      'hiihih@gmail.com'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    adminAuthRegister('hiihih@gmail.com', '2321abdd!A@', 'Hehe', 'Haha');
    const { responseBody, statusCode } = adminQuizTransfer(
      user.token,
      quiz.quizId + 1,
      'hiihih@gmail.com'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('user is not an owner of this quiz', () => {
    const user2 = adminAuthRegister(
      'hiihih@gmail.com',
      '2321abdd!A@',
      'Hehe',
      'Haha'
    );
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '');

    const { responseBody, statusCode } = adminQuizTransfer(
      user.token,
      quiz2.quizId,
      'hiihih@gmail.com'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });
});

describe('adminQuizTransfer normal tests:', () => {
  test('Test 1:', () => {
    const user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
    ).responseBody;
    const quiz = adminQuizCreate(user.token, 'My Quiz', '').responseBody;
    const user2 = adminAuthRegister(
      'hiihih@gmail.com',
      '2321abdd!A@',
      'Hehe',
      'Haha'
    ).responseBody;

    expect(adminQuizList(user.token).responseBody.quizzes).toStrictEqual([
      {
        quizId: quiz.quizId,
        name: 'My Quiz',
      },
    ]);

    expect(adminQuizList(user2.token).responseBody.quizzes).toStrictEqual([]);

    expect(
      adminQuizTransfer(user.token, quiz.quizId, 'hiihih@gmail.com')
        .responseBody
    ).toStrictEqual({});

    expect(adminQuizList(user.token).responseBody.quizzes).toStrictEqual([]);

    expect(adminQuizList(user2.token).responseBody.quizzes).toStrictEqual([
      {
        quizId: quiz.quizId,
        name: 'My Quiz',
      },
    ]);
  });
});
