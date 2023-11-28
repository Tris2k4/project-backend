import { requestHelper } from './HTTPRequest';

export function clear() {
  return requestHelper('DELETE', '/v1/clear', {});
}

describe('test 404 error not found', () => {
  test('Error 404', () => {
    const res = requestHelper('DELETE', '/asdq/vasf/a', {});
    expect(res.statusCode).toStrictEqual(404);
  });
});

describe('/v1/clear', () => {
  test('Correct return object', () => {
    const { responseBody, statusCode } = clear();
    expect(responseBody).toStrictEqual({});
    expect(statusCode).toStrictEqual(200);
  });
});
