import { requestHelper } from './HTTPRequest';
import { adminAuthRegister } from './auth.test';
import { adminQuizCreate, adminQuizInfo } from './quiz.test';
import { adminQuizSessionStart, adminQuizSessionState } from './it3_quiz.test';
import { clear } from './other.test';
import { AuthUserToken } from './auth';
import { QuizCreateReturn, QuestionCreateReturn, Action } from './quiz';

const ERROR = { error: expect.any(String) };

interface Answer {
  answer: string;
  correct: boolean;
}

export function adminQuizQuestionCreate(
  token: string,
  quizId: number,
  question: string,
  duration: number,
  points: number,
  answers: Answer[],
  thumbnailUrl: string
) {
  return requestHelper(
    'POST',
    `/v2/admin/quiz/${quizId}/question`,
    {
      questionBody: { question, duration, points, answers, thumbnailUrl },
    },
    { token }
  );
}

function adminQuizQuestionUpdate(
  token: string,
  quizId: number,
  questionId: number,
  question: string,
  duration: number,
  points: number,
  answers: Answer[],
  thumbnailUrl: string
) {
  return requestHelper(
    'PUT',
    `/v2/admin/quiz/${quizId}/question/${questionId}`,
    { questionBody: { question, duration, points, answers, thumbnailUrl } },
    { token }
  );
}

function adminQuizQuestionDelete(
  token: string,
  quizId: number,
  questionId: number
) {
  return requestHelper(
    'DELETE',
    `/v2/admin/quiz/${quizId}/question/${questionId}`,
    {},
    { token }
  );
}

function adminQuizQuestionMove(
  token: string,
  quizId: number,
  questionId: number,
  newPosition: number
) {
  return requestHelper(
    'PUT',
    `/v2/admin/quiz/${quizId}/question/${questionId}/move`,
    { newPosition },
    { token }
  );
}

function adminQuizQuestionDuplicate(
  token: string,
  quizId: number,
  questionId: number
) {
  return requestHelper(
    'POST',
    `/v2/admin/quiz/${quizId}/question/${questionId}/duplicate`,
    {},
    { token }
  );
}

beforeEach(clear);
afterAll(clear);

describe('/v2/admin/quiz/questionCreate', () => {
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
    { question: '' },
    { question: 'inv' },
    {
      question:
        'invalid@wqeiruoipqweurqwoiejskbasjkbvasjkdfhjlkasdhfuiowqeroiwqeurqwoiuqwroieurqwoieurwqoiweuwoiquroweiusdhfsakjdanbasdfhwqeuiorqwoeurwoiweuioeueiewururuwuweirueiuwopoqwqjlkhjkdfasfkjhaslkjashdfjkashasjkhdfsajkhqwoeiuruqwoieuasidjfaskdjflkjqowieuriowerudshjncbnx',
    },
  ])("Invalid question: '$question'", ({ question }) => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Invalid numbers of anwers', () => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('Invalid numbers of anwers', () => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([{ duration: 0 }, { duration: -123 }])(
    "Invalid duration: '$duration'",
    ({ duration }) => {
      const { responseBody, statusCode } = adminQuizQuestionCreate(
        user.token,
        quiz.quizId,
        'Who is the Monarch of England',
        duration,
        5,
        [
          {
            answer: 'Prince Charles',
            correct: true,
          },
          {
            answer: 'Prince Charles',
            correct: false,
          },
        ],
        'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    }
  );

  test('Sum of duration exceeds 3 mins', () => {
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      100,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      80,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([{ points: 0 }, { points: 11 }])(
    "Invalid points: '$points'",
    ({ points }) => {
      const { responseBody, statusCode } = adminQuizQuestionCreate(
        user.token,
        quiz.quizId,
        'Who is the Monarch of England',
        4,
        points,
        [
          {
            answer: 'Prince Charles',
            correct: true,
          },
          {
            answer: 'Prince Charles',
            correct: false,
          },
        ],
        'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    }
  );

  test('Invalid answers', () => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: false,
        },
        {
          answer: '',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Invalid answers', () => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: false,
        },
        {
          answer: 'sdafnbasejhowisldjnfasjdnfalkjsdflkj',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Duplicate answers', () => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: false,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('No correct answers', () => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
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
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: false,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
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
    const { responseBody, statusCode } = adminQuizQuestionCreate(
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
      url
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      '',
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
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token + 1,
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
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId', () => {
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token,
      quiz.quizId + 1,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz', () => {
    const user2 = adminAuthRegister('abcd@gmail.com', '123abc!@#', 'Ben', 'Xa');
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '');
    const { responseBody, statusCode } = adminQuizQuestionCreate(
      user.token,
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
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Correct return type', () => {
    const q = adminQuizQuestionCreate(
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
    expect(q).toStrictEqual({
      questionId: expect.any(Number),
    });

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 1,
      questions: [
        {
          questionId: q.questionId,
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
    });
  });
});

describe('/v2/admin/quiz/questionUpdate', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn, ques: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
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

  test('Invalid questionId', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId + 1,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    { question: '' },
    { question: 'inv' },
    {
      question:
        'invalid@wqeiruoipqweurqwoiejskbasjkbvasjkdfhjlkasdhfuiowqeroiwqeurqwoiuqwroieurqwoieurwqoiweuwoiquroweiusdhfsakjdanbasdfhwqeuiorqwoeurwoiweuioeueiewururuwuweirueiuwopoqwqjlkhjkdfasfkjhaslkjashdfjkashasjkhdfsajkhqwoeiuruqwoieuasidjfaskdjflkjqowieuriowerudshjncbnx',
    },
  ])("Invalid question: '$question'", ({ question }) => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Invalid numbers of anwers', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('Invalid numbers of anwers', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([{ duration: 0 }, { duration: -123 }])(
    "Invalid duration: '$duration'",
    ({ duration }) => {
      const { responseBody, statusCode } = adminQuizQuestionUpdate(
        user.token,
        quiz.quizId,
        ques.questionId,
        'Who is the Monarch of England',
        duration,
        5,
        [
          {
            answer: 'Prince Charles',
            correct: true,
          },
          {
            answer: 'Prince Charles',
            correct: false,
          },
        ],
        'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    }
  );

  test('Sum of duration exceeds 3 mins', () => {
    adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      100,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      80,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([{ points: 0 }, { points: 11 }])(
    "Invalid points: '$points'",
    ({ points }) => {
      const { responseBody, statusCode } = adminQuizQuestionUpdate(
        user.token,
        quiz.quizId,
        ques.questionId,
        'Who is the Monarch of England',
        4,
        points,
        [
          {
            answer: 'Prince Charles',
            correct: true,
          },
          {
            answer: 'Prince Charles',
            correct: false,
          },
        ],
        'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    }
  );

  test('Invalid answers', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: false,
        },
        {
          answer: '',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Invalid answers', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: false,
        },
        {
          answer: 'sdafnbasejhowisldjnfasjdnfalkjsdflkj',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Duplicate answers', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Princess Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Charles',
          correct: false,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('No correct answers', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
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
          correct: false,
        },
        {
          answer: 'Prince Charles',
          correct: false,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
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
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
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
      url
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      '',
      quiz.quizId,
      ques.questionId,
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
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token + 1,
      quiz.quizId,
      ques.questionId,
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
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId', () => {
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId + 1,
      ques.questionId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz', () => {
    const user2 = adminAuthRegister('abcd@gmail.com', '123abc!@#', 'Ben', 'Xa');
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '');
    const { responseBody, statusCode } = adminQuizQuestionUpdate(
      user.token,
      quiz2.quizId,
      ques.questionId,
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
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Correct return type', () => {
    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
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
    });

    const q = adminQuizQuestionUpdate(
      user.token,
      quiz.quizId,
      ques.questionId,
      'Who is the Monarch of England',
      4,
      5,
      [
        {
          answer: 'Harry McGuire',
          correct: false,
        },
        {
          answer: 'Harry Kane',
          correct: false,
        },
        {
          answer: 'Harry POTTER',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Coach_Harry_Marra.jpg/90px-Coach_Harry_Marra.jpg'
    );
    expect(q.responseBody).toStrictEqual({});

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
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
            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Coach_Harry_Marra.jpg/90px-Coach_Harry_Marra.jpg',
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Harry McGuire',
              colour: expect.any(String),
              correct: false,
            },
            {
              answerId: expect.any(Number),
              answer: 'Harry Kane',
              colour: expect.any(String),
              correct: false,
            },
            {
              answerId: expect.any(Number),
              answer: 'Harry POTTER',
              colour: expect.any(String),
              correct: true,
            },
          ],
        },
      ],
      duration: 4,
      thumbnailUrl: '',
    });
  });
});

describe('/v2/admin/quiz/questionDelete', () => {
  let user: AuthUserToken, quiz: QuizCreateReturn, ques: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
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

  test('Invalid questionId', () => {
    const { responseBody, statusCode } = adminQuizQuestionDelete(
      user.token,
      quiz.quizId,
      ques.questionId + 1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
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
    const { responseBody, statusCode } = adminQuizQuestionDelete(
      user.token,
      quiz.quizId,
      ques.questionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminQuizQuestionDelete(
      '',
      quiz.quizId,
      ques.questionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminQuizQuestionDelete(
      user.token + 1,
      quiz.quizId,
      ques.questionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizQuestionDelete(
      user.token,
      quiz.quizId + 1,
      ques.questionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('User does not own quiz', () => {
    const user2 = adminAuthRegister('abcd@gmail.com', '123abc!@#', 'Ben', 'Xa');
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '');

    const question2 = adminQuizQuestionCreate(
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

    const { responseBody, statusCode } = adminQuizQuestionDelete(
      user.token,
      quiz2.quizId,
      question2.questionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Correct return type', () => {
    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
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
    });

    const q = adminQuizQuestionDelete(user.token, quiz.quizId, ques.questionId);
    expect(q.responseBody).toStrictEqual({});

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 0,
      questions: [],
      duration: 0,
      thumbnailUrl: '',
    });
  });
});

describe('/v2/admin/quiz/:quizid/question/:questionId/move', () => {
  let user: AuthUserToken,
    quiz: QuizCreateReturn,
    question: QuestionCreateReturn,
    question2: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
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
    question2 = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the GOAT of soccer',
      4,
      5,
      [
        {
          answer: 'Rolnado',
          correct: false,
        },
        {
          answer: 'Messi',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png/200px-Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png'
    ).responseBody;
  });

  test('Invalid questionId', () => {
    const { responseBody, statusCode } = adminQuizQuestionMove(
      user.token,
      quiz.quizId,
      question.questionId + 1,
      1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([{ newPosition: -1 }, { newPosition: 2 }, { newPosition: 0 }])(
    "Invalid newPosition: '$newPosition'",
    ({ newPosition }) => {
      const { responseBody, statusCode } = adminQuizQuestionMove(
        user.token,
        quiz.quizId,
        question.questionId,
        newPosition
      );
      expect(responseBody).toStrictEqual(ERROR);
      expect(statusCode).toStrictEqual(400);
    }
  );

  test('Empty token', () => {
    const { responseBody, statusCode } = adminQuizQuestionMove(
      '',
      quiz.quizId,
      question.questionId,
      1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminQuizQuestionMove(
      user.token + 1,
      quiz.quizId,
      question.questionId,
      1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizQuestionMove(
      user.token,
      quiz.quizId + 1,
      question.questionId,
      1
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

    const questionn2 = adminQuizQuestionCreate(
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

    adminQuizQuestionCreate(
      user2.token,
      quiz2.quizId,
      'Who is the GOAT of soccer',
      4,
      5,
      [
        {
          answer: 'Rolnado',
          correct: false,
        },
        {
          answer: 'Messi',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/HNL_Wiki_Wiki_Bus.jpg/220px-HNL_Wiki_Wiki_Bus.jpg'
    );

    const { responseBody, statusCode } = adminQuizQuestionMove(
      user.token,
      quiz2.quizId,
      questionn2.questionId,
      1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Correct return type', () => {
    const question3 = adminQuizQuestionCreate(
      user.token,
      quiz.quizId,
      'Who is the KING of badminton',
      4,
      5,
      [
        {
          answer: 'Viktor Axelsen',
          correct: false,
        },
        {
          answer: 'LEE ZII JIA',
          correct: true,
        },
      ],
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Coach_Harry_Marra.jpg/180px-Coach_Harry_Marra.jpg'
    ).responseBody;

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 3,
      questions: [
        {
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
        {
          questionId: question2.questionId,
          question: 'Who is the GOAT of soccer',
          duration: 4,
          thumbnailUrl:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png/200px-Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png',
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Rolnado',
              colour: expect.any(String),
              correct: false,
            },
            {
              answerId: expect.any(Number),
              answer: 'Messi',
              colour: expect.any(String),
              correct: true,
            },
          ],
        },
        {
          questionId: question3.questionId,
          question: 'Who is the KING of badminton',
          duration: 4,
          thumbnailUrl:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Coach_Harry_Marra.jpg/180px-Coach_Harry_Marra.jpg',
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Viktor Axelsen',
              colour: expect.any(String),
              correct: false,
            },
            {
              answerId: expect.any(Number),
              answer: 'LEE ZII JIA',
              colour: expect.any(String),
              correct: true,
            },
          ],
        },
      ],
      duration: 12,
      thumbnailUrl: '',
    });

    expect(
      adminQuizQuestionMove(user.token, quiz.quizId, question.questionId, 2)
        .responseBody
    ).toStrictEqual({});

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 3,
      questions: [
        {
          questionId: question2.questionId,
          question: 'Who is the GOAT of soccer',
          duration: 4,
          thumbnailUrl:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png/200px-Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png',
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Rolnado',
              colour: expect.any(String),
              correct: false,
            },
            {
              answerId: expect.any(Number),
              answer: 'Messi',
              colour: expect.any(String),
              correct: true,
            },
          ],
        },
        {
          questionId: question3.questionId,
          question: 'Who is the KING of badminton',
          duration: 4,
          thumbnailUrl:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Coach_Harry_Marra.jpg/180px-Coach_Harry_Marra.jpg',
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'Viktor Axelsen',
              colour: expect.any(String),
              correct: false,
            },
            {
              answerId: expect.any(Number),
              answer: 'LEE ZII JIA',
              colour: expect.any(String),
              correct: true,
            },
          ],
        },
        {
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
      duration: 12,
      thumbnailUrl: '',
    });
  });
});

describe('/v2/admin/quiz/:quizid/question/:questionId/duplicate', () => {
  let user: AuthUserToken,
    quiz: QuizCreateReturn,
    question: QuestionCreateReturn;
  beforeEach(() => {
    user = adminAuthRegister(
      'validemail@gmail.com',
      '123abc!@#',
      'Jake',
      'Renzella'
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
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Coach_Harry_Marra.jpg/90px-Coach_Harry_Marra.jpg'
    ).responseBody;
  });

  test('Invalid questionId', () => {
    const { responseBody, statusCode } = adminQuizQuestionDuplicate(
      user.token,
      quiz.quizId,
      question.questionId + 1
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminQuizQuestionDuplicate(
      '',
      quiz.quizId,
      question.questionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminQuizQuestionDuplicate(
      user.token + 1,
      quiz.quizId,
      question.questionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid quizId has to be 403', () => {
    const { responseBody, statusCode } = adminQuizQuestionDuplicate(
      user.token,
      quiz.quizId + 1,
      question.questionId
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
    ).responseBody;
    const quiz2 = adminQuizCreate(user2.token, 'My Quiz2', '').responseBody;
    const question2 = adminQuizQuestionCreate(
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
    ).responseBody;

    const { responseBody, statusCode } = adminQuizQuestionDuplicate(
      user.token,
      quiz2.quizId,
      question2.questionId
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(403);
  });

  test('Correct return type', () => {
    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 1,
      questions: [
        {
          questionId: question.questionId,
          question: 'Who is the Monarch of England',
          duration: 4,
          thumbnailUrl:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Coach_Harry_Marra.jpg/90px-Coach_Harry_Marra.jpg',
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
    });

    const newQuestion = adminQuizQuestionDuplicate(
      user.token,
      quiz.quizId,
      question.questionId
    ).responseBody;
    expect(newQuestion).toStrictEqual({
      newQuestionId: expect.any(Number),
    });

    expect(adminQuizInfo(user.token, quiz.quizId).responseBody).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 2,
      questions: [
        {
          questionId: question.questionId,
          question: 'Who is the Monarch of England',
          duration: 4,
          thumbnailUrl:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Coach_Harry_Marra.jpg/90px-Coach_Harry_Marra.jpg',
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
        {
          questionId: newQuestion.newQuestionId,
          question: 'Who is the Monarch of England',
          duration: 4,
          thumbnailUrl:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Coach_Harry_Marra.jpg/90px-Coach_Harry_Marra.jpg',
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
      duration: 8,
      thumbnailUrl: '',
    });
  });
});
