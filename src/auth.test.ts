import { requestHelper } from './HTTPRequest';
import { AuthUserToken } from './auth';
import { clear } from './other.test';

const ERROR = { error: expect.any(String) };

// Iteration 2 wrapper function
export function adminAuthRegister(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
) {
  return requestHelper('POST', '/v1/admin/auth/register', {
    email,
    password,
    nameFirst,
    nameLast,
  });
}

export function adminAuthLogin(email: string, password: string) {
  return requestHelper('POST', '/v1/admin/auth/login', { email, password });
}

export function adminUserDetails(token: string) {
  return requestHelper('GET', '/v2/admin/user/details', {}, { token });
}

function adminAuthLogout(token: string) {
  return requestHelper('POST', '/v2/admin/auth/logout', {}, { token });
}

function adminUserDetailsUpdate(
  token: string,
  email: string,
  nameFirst: string,
  nameLast: string
) {
  return requestHelper(
    'PUT',
    '/v2/admin/user/details',
    {
      email,
      nameFirst,
      nameLast,
    },
    {
      token,
    }
  );
}

function adminUserPasswordUpdate(
  token: string,
  oldPassword: string,
  newPassword: string
) {
  return requestHelper(
    'PUT',
    '/v2/admin/user/password',
    {
      oldPassword,
      newPassword,
    },
    {
      token,
    }
  );
}

beforeEach(clear);
afterAll(clear);

// Iteration 2 tests
// Admin register
describe('/v1/admin/auth/register', () => {
  test('Email address is already used by another user', () => {
    adminAuthRegister('kevinngo123@gmail.com', 'abcd1234', 'Kevin', 'Ngo');
    const { responseBody, statusCode } = adminAuthRegister(
      'kevinngo123@gmail.com',
      'dbca431',
      'Lucas',
      'Nguyen'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    { email: 'invalidgmail.com' },
    { email: 'inva@lid@gmail.com' },
    { email: 'invalid@' },
    { email: 'invalid@.com' },
    { email: 'invalid@gmailcom.' },
    { email: 'invalid@gmail.abcd' },
    {
      email:
        'dsafhjasjkdhfwueyhuoweiyrnbvmzxcnbvskjdhfjhsjahfuweyhouiwqjksaaskjdfsakj@gmail.com',
    },
    {
      email:
        'invalid@wqeiruoipqweurqwoiejskbasjkbvasjkdfhjlkasdhfuiowqeroiwqeurqwoiuqwroieurqwoieurwqoiweuwoiquroweiusdhfsakjdanbasdfhwqeuiorqwoeurwoiweuioeueiewururuwuweirueiuwopoqwqjlkhjkdfasfkjhaslkjashdfjkashasjkhdfsajkhqwoeiuruqwoieuasidjfaskdjflkjqowieuriowerudshjncbnxcc.com',
    },
    { email: ' invalid@gmail.com' },
    { email: 'invalid@gmail.com ' },
    { email: '"invalid@gmail.com"' },
  ])("Invalid email addresses: '$email'", ({ email }) => {
    const { responseBody, statusCode } = adminAuthRegister(
      email,
      'abcd1234',
      'Harry',
      'Pham'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    { name: '' },
    { name: 'd' },
    { name: 'hsadkjhfsdjkhfsjdkshdfjkshsjkh' },
    { name: 'dat1' },
    { name: 'ming!' },
    { name: '&haha.' },
  ])("Invalid First Name: '$name'", ({ name }) => {
    const { responseBody, statusCode } = adminAuthRegister(
      'valid@gmail.com',
      'ffff123',
      name,
      'Pham'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    { name: '' },
    { name: 'd' },
    { name: 'hsadkjhfsdjkhfsjdkshdfjkshsjkh' },
    { name: 'Dat-1' },
    { name: "m'ing!" },
    { name: 'haha $Ngo' },
  ])("Invalid Last Name: '$name'", ({ name }) => {
    const { responseBody, statusCode } = adminAuthRegister(
      'valid@gmail.com',
      'ffff123',
      'Harry',
      name
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    { pass: '' },
    { pass: 'asdbf' },
    { pass: 'ngoquocdat' },
    { pass: '123124525' },
    { pass: '!!@@%^&^%' },
  ])("Invalid Password: '$pass'", ({ pass }) => {
    const { responseBody, statusCode } = adminAuthRegister(
      'valid@gmail.com',
      pass,
      'Harry',
      'Pham'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return type', () => {
    const { responseBody, statusCode } = adminAuthRegister(
      'valid@gmail.com',
      'abcd1234',
      'Harry',
      'Pham'
    );
    expect(responseBody).toStrictEqual({ token: expect.any(String) });
    expect(statusCode).toStrictEqual(200);
  });
});

// Admin login
describe('/v1/admin/auth/login', () => {
  test('Email does not exist', () => {
    const { responseBody, statusCode } = adminAuthLogin(
      'abcde123@gmail.com',
      'abcd1234'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Incorrect password for the given email', () => {
    adminAuthRegister('abcd123@gmail.com', 'abcd1234', 'Kevin', 'Ngo');
    const { responseBody, statusCode } = adminAuthLogin(
      'abcd123@gmail.com',
      'ab121323'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return type', () => {
    adminAuthRegister('datngo2k3@gmail.com', 'abcd1234', 'Kevin', 'Ngo');
    const { responseBody, statusCode } = adminAuthLogin(
      'datngo2k3@gmail.com',
      'abcd1234'
    );
    expect(responseBody).toStrictEqual({ token: expect.any(String) });
    expect(statusCode).toStrictEqual(200);
  });
});

// User's details get
describe('v1/admin/user/details', () => {
  let user: AuthUserToken;
  beforeEach(() => {
    const res = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    );
    user = res.responseBody;
    expect(res.statusCode).toStrictEqual(200);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminUserDetails(user.token + 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminUserDetails('');
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Success', () => {
    const { responseBody, statusCode } = adminUserDetails(user.token);
    expect(responseBody).toStrictEqual({
      user: {
        userId: responseBody.user.userId,
        name: 'Joshua Zhang',
        email: 'hello@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
    expect(statusCode).toStrictEqual(200);
  });
});

// User details get
describe('v2/admin/user/details : Login attempts', () => {
  let user: AuthUserToken;
  beforeEach(() => {
    const res = adminAuthRegister(
      'hello@gmail.com',
      'hellohi123',
      'Joshua',
      'Zhang'
    );
    user = res.responseBody;
    expect(res.statusCode).toStrictEqual(200);
    adminAuthLogin('hello@gmail.com', 'hello'); // fail
    adminAuthLogin('hello1@gmailcom', 'hello'); // fail
    adminAuthLogin('hello@gmail.com', 'hellohi123'); // login success
    adminAuthLogin('hello@gmail.com', 'hello123'); // fail
    adminAuthLogin('hello@gmail.com', 'hello2'); // fail
  });

  test('Success', () => {
    const { responseBody, statusCode } = adminUserDetails(user.token);
    expect(responseBody).toStrictEqual({
      user: {
        userId: responseBody.user.userId,
        name: 'Joshua Zhang',
        email: 'hello@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 2,
      },
    });
    expect(statusCode).toStrictEqual(200);
  });

  test('Success//extra login', () => {
    // successful login resets numFailedPasswordsSinceLastLogin
    adminAuthLogin('hello@gmail.com', 'hellohi123');

    const { responseBody, statusCode } = adminUserDetails(user.token);
    expect(responseBody).toStrictEqual({
      user: {
        userId: responseBody.user.userId,
        name: 'Joshua Zhang',
        email: 'hello@gmail.com',
        numSuccessfulLogins: 3,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
    expect(statusCode).toStrictEqual(200);
  });
  test('Success with another user', () => {
    const res1 = adminAuthRegister(
      'abcdefg@gmail.com',
      'abcdefg1234',
      'Hi',
      'Hello'
    );
    const user1 = res1.responseBody;
    adminAuthLogin('abcdefg@gmail.com', 'dsa'); // failed login
    adminAuthLogin('abcdefg@gmail.com', 'abcdefg1234'); // login success

    const { responseBody, statusCode } = adminUserDetails(user1.token);
    expect(responseBody).toStrictEqual({
      user: {
        userId: responseBody.user.userId,
        name: 'Hi Hello',
        email: 'abcdefg@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
    expect(statusCode).toStrictEqual(200);
  });

  test("Login with different user doesn't affect first user counts", () => {
    adminAuthRegister('abcdefg@gmail.com', 'abcdefg1234', 'Hi', 'Hello');
    adminAuthLogin('abcdefg@gmail.com', 'dsa'); // failed login
    adminAuthLogin('abcdefg@gmail.com', 'd2323231273dbhsaa'); // failed login
    adminAuthLogin('abcdefg@gmail.com', 'abcdefg1234'); // login success
    adminAuthLogin('abcdefg@gmail.com', 'abcdefg1234'); // login success
    adminAuthLogin('abcdefg@gmail.com', 'abcdefg1234'); // login success

    const { responseBody, statusCode } = adminUserDetails(user.token);
    expect(responseBody).toStrictEqual({
      user: {
        userId: responseBody.user.userId,
        name: 'Joshua Zhang',
        email: 'hello@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 2,
      },
    });
    expect(statusCode).toStrictEqual(200);
  });
});

// Admin logout
describe('/v2/admin/auth/logout', () => {
  let user: AuthUserToken;
  beforeEach(() => {
    user = adminAuthRegister(
      'valid@gmail.com',
      'abcd1234',
      'Harry',
      'Pham'
    ).responseBody;
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminAuthLogout('');
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });
  test('Invalid token', () => {
    const { responseBody, statusCode } = adminAuthLogout(user.token + 1);
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });
  test('Correct return type', () => {
    const login1 = adminAuthLogin('valid@gmail.com', 'abcd1234').responseBody;

    const { responseBody, statusCode } = adminUserDetails(login1.token);
    expect(responseBody).toStrictEqual({
      user: {
        userId: responseBody.user.userId,
        name: 'Harry Pham',
        email: 'valid@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
    expect(statusCode).toStrictEqual(200);

    const res = adminAuthLogout(login1.token);
    expect(res.responseBody).toStrictEqual({});
    expect(res.statusCode).toStrictEqual(200);

    expect(adminUserDetails(login1.token).statusCode).toStrictEqual(401);

    const res1 = adminUserDetails(user.token);
    expect(res1.responseBody).toStrictEqual({
      user: {
        userId: res1.responseBody.user.userId,
        name: 'Harry Pham',
        email: 'valid@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
    expect(res1.statusCode).toStrictEqual(200);
  });
});

// User's details update
describe('/v2/admin/user/detailsUpdate', () => {
  let user: AuthUserToken;
  beforeEach(() => {
    const res = adminAuthRegister(
      'valid@gmail.com',
      'abcd1234',
      'Harry',
      'Pham'
    );
    user = res.responseBody;
  });

  test('Email address is already used by another user', () => {
    const user2 = adminAuthRegister(
      'hihhaha@gmail.com',
      'dbca43152',
      'Lucas',
      'Nguyen'
    );
    expect(user2.responseBody).toStrictEqual({ token: expect.any(String) });
    const { responseBody, statusCode } = adminUserDetailsUpdate(
      user.token,
      'hihhaha@gmail.com',
      'Dat',
      'Ngo'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    { email: 'invalidgmail.com' },
    { email: 'inva@lid@gmail.com' },
    { email: 'invalid@' },
    { email: 'invalid@.com' },
    { email: 'invalid@gmailcom.' },
    { email: 'invalid@gmail.abcd' },
    {
      email:
        'dsafhjasjkdhfwueyhuoweiyrnbvmzxcnbvskjdhfjhsjahfuweyhouiwqjksaaskjdfsakj@gmail.com',
    },
    {
      email:
        'invalid@wqeiruoipqweurqwoiejskbasjkbvasjkdfhjlkasdhfuiowqeroiwqeurqwoiuqwroieurqwoieurwqoiweuwoiquroweiusdhfsakjdanbasdfhwqeuiorqwoeurwoiweuioeueiewururuwuweirueiuwopoqwqjlkhjkdfasfkjhaslkjashdfjkashasjkhdfsajkhqwoeiuruqwoieuasidjfaskdjflkjqowieuriowerudshjncbnxcc.com',
    },
    { email: ' invalid@gmail.com' },
    { email: 'invalid@gmail.com ' },
    { email: '"invalid@gmail.com"' },
  ])("Invalid email addresses: '$email'", ({ email }) => {
    const { responseBody, statusCode } = adminUserDetailsUpdate(
      user.token,
      email,
      'Harry',
      'Pham'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    { name: '' },
    { name: 'd' },
    { name: 'hsadkjhfsdjkhfsjdkshdfjkshsjkh' },
    { name: 'dat1' },
    { name: 'ming!' },
    { name: '&haha.' },
  ])("Invalid First Name: '$name'", ({ name }) => {
    const { responseBody, statusCode } = adminUserDetailsUpdate(
      user.token,
      'hihhaha@gmail.com',
      name,
      'Pham'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    { name: '' },
    { name: 'd' },
    { name: 'hsadkjhfsdjkhfsjdkshdfjkshsjkh' },
    { name: 'Dat-1' },
    { name: "m'ing!" },
    { name: 'haha $Ngo' },
  ])("Invalid Last Name: '$name'", ({ name }) => {
    const { responseBody, statusCode } = adminUserDetailsUpdate(
      user.token,
      'valid@gmail.com',
      'Harry',
      name
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminUserDetailsUpdate(
      '',
      'valid@gmail.com',
      'Harry',
      'Pham'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminUserDetailsUpdate(
      user.token + 1,
      'valid@gmail.com',
      'Harry',
      'Pham'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Correct return type', () => {
    const { responseBody, statusCode } = adminUserDetailsUpdate(
      user.token,
      'hahaahhehe@gmail.com',
      'Dat',
      'GNO'
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);

    const res = adminUserDetails(user.token).responseBody.user;
    expect(res).toStrictEqual({
      userId: res.userId,
      name: 'Dat GNO',
      email: 'hahaahhehe@gmail.com',
      numSuccessfulLogins: 1,
      numFailedPasswordsSinceLastLogin: 0,
    });
  });
});

describe('/v2/admin/user/password', () => {
  let user: AuthUserToken;
  beforeEach(() => {
    const res = adminAuthRegister(
      'valid@gmail.com',
      'abcd1234',
      'Harry',
      'Pham'
    );
    user = res.responseBody;
  });

  test('Empty token', () => {
    const { responseBody, statusCode } = adminUserPasswordUpdate(
      '',
      'acbd1234',
      'okok1111'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Invalid token', () => {
    const { responseBody, statusCode } = adminUserPasswordUpdate(
      user.token + 1,
      'acbd1234',
      'okok1111'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(401);
  });

  test('Old Password is not the correct old password', () => {
    const { responseBody, statusCode } = adminUserPasswordUpdate(
      user.token,
      'ghfudd565',
      'okok1111'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });
  test('Old Password and New Password match exactly', () => {
    const { responseBody, statusCode } = adminUserPasswordUpdate(
      user.token,
      'acbd1234',
      'acbd1234'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('New Password has already been used before by this user', () => {
    adminUserPasswordUpdate(user.token, 'abcd1234', 'koko2222');
    const { responseBody, statusCode } = adminUserPasswordUpdate(
      user.token,
      'koko2222',
      'abcd1234'
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test.each([
    { newPass: '' },
    { newPass: 'asdbf' },
    { newPass: 'ngoquocdat' },
    { newPass: '123124525' },
    { newPass: '!!@@%^&^%' },
  ])("Invalid newPassword: '$newPass'", ({ newPass }) => {
    const { responseBody, statusCode } = adminUserPasswordUpdate(
      user.token,
      'acbd1234',
      newPass
    );
    expect(responseBody).toStrictEqual(ERROR);
    expect(statusCode).toStrictEqual(400);
  });

  test('Correct return type with using adminAuthLogin to check', () => {
    const { responseBody, statusCode } = adminUserPasswordUpdate(
      user.token,
      'abcd1234',
      'okok1111'
    );
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);

    expect(
      adminAuthLogin('valid@gmail.com', 'abcd1234').statusCode
    ).toStrictEqual(400);
    expect(
      adminAuthLogin('valid@gmail.com', 'okok1111').responseBody
    ).toStrictEqual({
      token: expect.any(String),
    });
  });
});
