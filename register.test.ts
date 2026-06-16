import crypto from 'crypto';

let createMock: jest.Mock;
let signMock: jest.Mock;

jest.mock('../common/database', () => ({}));

jest.mock('../common/models/User', () => {
  return jest.fn(() => ({
    create: createMock
  }));
});

jest.mock('jsonwebtoken', () => ({
  sign: (...args: any[]) => signMock(...args)
}));

describe('register handler', () => {
  let register: any;

  beforeEach(() => {
    jest.resetModules();
    createMock = jest.fn();
    signMock = jest.fn().mockReturnValue('token-abc');

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('./register');
      register = mod.register;
    });
  });

  it('creates user, returns 201 and token on success', async () => {
    const req: any = {
      body: {
        username: 'alice',
        email: 'alice@example.com',
        password: 's3cr3t',
        firstName: 'Alice',
        lastName: 'Liddell',
        age: 25
      }
    };

    const createdUser = { id: 42, username: 'alice', email: 'alice@example.com' };
    createMock.mockResolvedValue(createdUser);

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const expectedHash = crypto.createHash('sha256').update(req.body.password).digest('hex');

    await register(req, res);

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      username: 'alice',
      email: 'alice@example.com',
      password: expectedHash,
      firstName: 'Alice',
      lastName: 'Liddell',
      age: 25
    });

    expect(signMock).toHaveBeenCalledWith(
      { username: 'alice', userId: 42 },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: { id: 42, username: 'alice', email: 'alice@example.com' },
      token: 'token-abc'
    });
  });

  it('returns 500 and error message when creation fails', async () => {
    const req: any = {
      body: {
        username: 'bob',
        email: 'bob@example.com',
        password: 'pw',
        firstName: 'Bob',
        lastName: 'Builder',
        age: 31
      }
    };

    createMock.mockRejectedValue(new Error('DB down'));

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'DB down' });
  });
});
