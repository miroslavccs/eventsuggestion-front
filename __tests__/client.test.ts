import { ApiError, request, setAuthToken, setUnauthorizedHandler } from '@/api/client';

const respond = (status: number, body?: unknown) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  } as Response);

describe('api client', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    setAuthToken(null);
    setUnauthorizedHandler(null);
  });

  it('sends the bearer token and JSON body, returns parsed JSON', async () => {
    setAuthToken('tok');
    fetchMock.mockReturnValue(respond(200, { ok: 1 }));
    await expect(request('PUT', '/x', { a: 1 })).resolves.toEqual({ ok: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/x$/);
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });

  it('does not send Authorization when signed out', async () => {
    fetchMock.mockReturnValue(respond(200, {}));
    await request('GET', '/x');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('returns undefined for 204', async () => {
    fetchMock.mockReturnValue(respond(204));
    await expect(request('PUT', '/suggestions/1/read')).resolves.toBeUndefined();
  });

  it('surfaces ProblemDetail.detail as the error message', async () => {
    fetchMock.mockReturnValue(respond(400, { detail: 'Email already in use' }));
    await expect(request('POST', '/auth/register', {})).rejects.toMatchObject({ status: 400, message: 'Email already in use' });
  });

  it('joins validation errors', async () => {
    fetchMock.mockReturnValue(respond(400, { errors: { email: 'must be a well-formed email address' } }));
    await expect(request('POST', '/auth/login', {})).rejects.toThrow('must be a well-formed email address');
  });

  it('falls back to a generic message when the body is not JSON', async () => {
    fetchMock.mockReturnValue(respond(500));
    await expect(request('GET', '/x')).rejects.toThrow(/server had a problem/i);
  });

  it('calls the unauthorized handler on 401 only when a token was sent', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockReturnValue(respond(401, { detail: 'Bad credentials' }));

    await expect(request('POST', '/auth/login', {})).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled(); // wrong password on the login screen is not a session expiry

    setAuthToken('expired');
    await expect(request('GET', '/customers/me')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('explains a 200 with an empty body (API URL pointing at the wrong server)', async () => {
    fetchMock.mockReturnValue(respond(200));
    await expect(request('POST', '/auth/login', {})).rejects.toMatchObject({
      status: 200,
      message: expect.stringMatching(/EXPO_PUBLIC_API_URL/),
    });
  });

  it('reports network failures as status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(request('GET', '/x')).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/cannot reach/i) });
  });
});
