import request, { HttpVerb } from 'sync-request-curl';
import { url, port } from './config.json';
import { IncomingHttpHeaders } from 'http';
import { Answer } from './quiz';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 10000;

interface QuestionBody {
  [key: string]: number | string | Answer[];
}

interface Payload {
  [key: string]: number | string | number[] | QuestionBody;
}

export const requestHelper = (
  method: HttpVerb,
  path: string,
  payload: Payload,
  headers: IncomingHttpHeaders = {}
): any => {
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method)) {
    qs = payload;
  } else {
    // PUT/POST
    json = payload;
  }

  const url = SERVER_URL + path;
  const res = request(method, url, { qs, json, headers, timeout: TIMEOUT_MS });

  let responseBody;
  let error = '';
  let hint = '';

  try {
    responseBody = JSON.parse(res.body.toString());
  } catch (e) {
    error = e.message;
  }

  if ([400, 401, 403, 404, 500].includes(res.statusCode)) {
    error = `Error with status code ${res.statusCode}`;
    if (res.statusCode === 400) {
      error += ' (Bad Request)';
    } else if (res.statusCode === 401) {
      error += ' (Unauthorized)';
    } else if (res.statusCode === 403) {
      error += ' (Forbidden)';
    } else if (res.statusCode === 404) {
      error += ' (Not Found)';
    } else if (res.statusCode === 500) {
      hint =
        'Your server has crashed. Check the terminal running the server to see the error stack trace';
    }
  } else if (res.statusCode !== 200) {
    hint = `\n\nSorry, no idea! Look up the status code ${res.statusCode} online!\n`;
  }

  return { responseBody, statusCode: res.statusCode, error, hint };
};
