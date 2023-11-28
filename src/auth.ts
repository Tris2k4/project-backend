import { getData } from './dataStore';
import { v4 as uuidv4 } from 'uuid';
import { getHashOf } from './hash';
import validator from 'validator';
import HTTPError from 'http-errors';

export interface AuthUserToken {
  token: string;
}

export interface UserDetails {
  user: {
    userId: number;
    name: string;
    email: string;
    numSuccessfulLogins: number;
    numFailedPasswordsSinceLastLogin: number;
  };
}

/**
 * Register a user with an email, password, and names, and then return their
 * authUserId value.
 *
 * @param {string} email - the user's email
 * @param {string} password - the user's password
 * @param {string} nameFirst - the user's first name
 * @param {string} nameLast - the user's last name
 *
 * @returns {token: string, authUserId: number}  - return the token/sessionId and the user's id
 * @returns {error: string}  - if invalid email, password, nameFirst, nameLast or account already existed
 */
export function adminAuthRegister(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
): AuthUserToken {
  const data = getData();
  const emailALreadyUsed = data.users.find((u) => u.email === email);
  if (emailALreadyUsed) {
    throw HTTPError(400, 'This email is already used by another user.');
  }

  const validExt =
    email.includes('.com') || email.includes('.net') || email.includes('.org');
  if (!validator.isEmail(email) || !validExt) {
    throw HTTPError(400, 'Invalid email address.');
  }

  if (
    !/^[A-Za-z-'\s]{2,20}$/.test(nameFirst) ||
    !/^[A-Za-z-'\s]{2,20}$/.test(nameLast) ||
    !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)
  ) {
    throw HTTPError(
      400,
      'Invalid first name and/or invalid last name and/or invalid password.'
    );
  }

  const authUserId = data.users.length + 1;
  data.users.push({
    authUserId,
    nameFirst,
    nameLast,
    email,
    password: getHashOf(password),
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    usedPassword: [],
  });

  const token = uuidv4();
  data.userSessions.push({
    authUserId,
    token,
  });

  return { token };
}

/**
 * Given a user email and password, login the user, and return their
 * authUserId value.
 *
 * @param {string} email - the user's email
 * @param {string} password - the user's password
 *
 * @returns {token: string, authUserId: number} - return the token of the login session
 * and user's id
 */
export function adminAuthLogin(email: string, password: string): AuthUserToken {
  const data = getData();
  const user = data.users.find((u) => u.email === email);
  if (!user) {
    throw HTTPError(400, 'Email address does not exist.');
  }

  if (getHashOf(password) !== user.password) {
    user.numFailedPasswordsSinceLastLogin++;
    throw HTTPError(400, 'Password is not correct for the given email.');
  }

  user.numSuccessfulLogins++;
  user.numFailedPasswordsSinceLastLogin = 0;
  const token = uuidv4();
  data.userSessions.push({
    authUserId: user.authUserId,
    token,
  });
  return { token };
}

/**
 * Given an admin user's authUserId, return details about the user.
 * "name" is the first and last concated with a single space between them.
 *
 * @param {string} token the token of a user's session
 * @returns {user} a User object
 */
export function adminUserDetails(token: string): UserDetails {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  const user = data.users.find((u) => u.authUserId === session.authUserId);

  const name = `${user.nameFirst} ${user.nameLast}`;
  return {
    user: {
      userId: user.authUserId,
      name,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    },
  };
}

/**
 * Given a user email and password, log out the user, and return an empty object
 *
 * @param {string} token - the user's email
 *
 * @returns {error} - on error
 * @returns {object} - on success
 */
export function adminAuthLogout(token: string): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  const index = data.userSessions.indexOf(session);
  data.userSessions.splice(index, 1);
  return {};
}

/**
 * Update user detail
 *
 * @param {string} token - the user's token
 * @param {string} email - the user's email
 * @param {string} nameFirst - user's first name
 * @param {string} nameLast - user's last name
 * @returns {error} - on error
 * @returns {object} - on success
 */

export function adminUserDetailsUpdate(
  token: string,
  email: string,
  nameFirst: string,
  nameLast: string
): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }

  const emailALreadyUsed = data.users.find((u) => u.email === email);
  if (emailALreadyUsed) {
    throw HTTPError(
      400,
      'This email is already used by another user (excluding the current authorised user).'
    );
  }
  const validExt =
    email.includes('.com') || email.includes('.net') || email.includes('.org');
  if (!validator.isEmail(email) || !validExt) {
    throw HTTPError(400, 'Invalid email address.');
  }
  if (
    !/^[A-Za-z-'\s]{2,20}$/.test(nameFirst) ||
    !/^[A-Za-z-'\s]{2,20}$/.test(nameLast)
  ) {
    throw HTTPError(400, 'Invalid first name and/or invalid last name.');
  }

  const user = data.users.find((u) => u.authUserId === session.authUserId);
  user.email = email;
  user.nameFirst = nameFirst;
  user.nameLast = nameLast;
  return {};
}

/**
 * Update user's password
 *
 * @param {string} token - the user's token
 * @param {string} old password - the user's old password
 * @param {string} newPassword - the user's new password
 * @returns {error} - on error
 * @returns {object} - on success
 */

export function adminUserPasswordUpdate(
  token: string,
  oldPassword: string,
  newPassword: string
): object {
  const data = getData();
  const session = data.userSessions.find((s) => s.token === token);
  if (!token || !session) {
    throw HTTPError(401, 'Token is empty or invalid.');
  }
  const user = data.users.find((u) => u.authUserId === session.authUserId);

  if (
    user.password !== getHashOf(oldPassword) ||
    getHashOf(newPassword) === getHashOf(oldPassword)
  ) {
    throw HTTPError(
      400,
      'Not the correct old password, or old password and new password match exactly'
    );
  }

  if (
    user.usedPassword.includes(getHashOf(newPassword)) ||
    !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)
  ) {
    throw HTTPError(
      400,
      'New Password has already been used before by this user, or invalid new password'
    );
  }

  user.usedPassword.push(getHashOf(oldPassword));
  user.password = getHashOf(newPassword);
  return {};
}
