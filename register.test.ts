import crypto from 'crypto';

describe('register', () => {
  let originalJwtSecret: string | undefined;

  const mockJwt = { sign: jest.fn(() => 'signed.token') } as any;
  const mockDatabase = {} as any;

  // defineUser mock that returns a stable user model object with a create mock
  const userModel = { create: jest.fn() } as any;
  const defineUserMock = Object.assign(jest.fn(() => userModel), { __userModel: userModel });

  beforeAll(() => {
    originalJwtSecret = process.env.JWT_SECRET;

    jest.mock('jsonwebtoken', () => mockJwt);
    jest.mock('../common/database', () => mockDatabase, { virtual: true });
    jest.mock('../common/models/User', () => defineUserMock);
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    userModel.create.mockReset();
  });

  const getModule = () => {
    jest.resetModules();
    return require('./register');
  };

  const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return res;
  };

  test('successfully registers a user and returns token', async () => {
    process.env.JWT_SECRET = 'supersecret';
    const { register } = getModule();

    const req: any = {
      body: {
        username: 'alice',
        email: 'alice@example.com',
        password: 'P@ssw0rd',
        firstName: 'Alice',
        lastName: 'Liddell',
        age: 28
      }
    };
    const createdUser = { id: 42, username: 'alice', email: 'alice@example.com' };
    userModel.create.mockResolvedValue(createdUser);

    const res = makeRes();

    await register(req, res);

    // Ensure password was encrypted before create
    const expectedHash = crypto.createHash('sha256').update('P@ssw0rd').digest('hex');
    expect(userModel.create).toHaveBeenCalledWith({
      username: 'alice',
      email: 'alice@example.com',
      password: expectedHash,
      firstName: 'Alice',
      lastName: 'Liddell',
      age: 28
    });

    expect(mockJwt.sign).toHaveBeenCalledWith({ username: 'alice', userId: 42 }, 'supersecret', { expiresIn: '24h' });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: { id: 42, username: 'alice', email: 'alice@example.com' },
      token: 'signed.token'
    });
  });

  test('returns 500 if JWT secret is not configured', async () => {
    delete process.env.JWT_SECRET;
    const { register } = getModule();

    const req: any = {
      body: {
        username: 'bob',
        email: 'bob@example.com',
        password: 'secret',
        firstName: 'Bob',
        lastName: 'Builder',
        age: 35
      }
    };
    const createdUser = { id: 7, username: 'bob', email: 'bob@example.com' };
    userModel.create.mockResolvedValue(createdUser);

    const res = makeRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'JWT secret not configured' });
    // sign should not be called when secret is missing
    expect(mockJwt.sign).not.toHaveBeenCalled();
  });

  test('returns 500 if user creation fails', async () => {
    process.env.JWT_SECRET = 'anothersecret';
    const { register } = getModule();

    const req: any = {
      body: {
        username: 'charlie',
        email: 'charlie@example.com',
        password: 'failme',
        firstName: 'Charlie',
        lastName: 'Chaplin',
        age: 40
      }
    };

    userModel.create.mockRejectedValue(new Error('DB fail'));

    const res = makeRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'DB fail' });
    // sign should not be called if creation fails
    expect(mockJwt.sign).not.toHaveBeenCalled();
  });
});
