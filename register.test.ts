import * as crypto from 'crypto';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocktoken')
}));

const mockCreate = jest.fn();

jest.mock('../common/models/User', () => {
  return jest.fn(() => ({
    create: mockCreate
  }));
});

jest.mock('../common/database', () => ({}));

const jwt = require('jsonwebtoken');

describe('register handler', () => {
  let register: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require module after mocks are set/cleared
    ({ register } = require('./register'));
  });

  const makeRes = () => {
    const res: any = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn();
    return res;
  };

  it('creates user, hashes password, returns 201 with token', async () => {
    const req: any = {
      body: {
        username: 'alice',
        email: 'alice@example.com',
        password: 'P@ssw0rd',
        firstName: 'Alice',
        lastName: 'Doe',
        age: 30
      }
    };
    const res = makeRes();

    mockCreate.mockResolvedValue({ id: 42, username: 'alice', email: 'alice@example.com' });

    await register(req, res);

    const expectedHash = crypto.createHash('sha256').update('P@ssw0rd').digest('hex');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      username: 'alice',
      email: 'alice@example.com',
      password: expectedHash,
      firstName: 'Alice',
      lastName: 'Doe',
      age: 30
    });

    expect(jwt.sign).toHaveBeenCalledWith(
      { username: 'alice', userId: 42 },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: { id: 42, username: 'alice', email: 'alice@example.com' },
      token: 'mocktoken'
    });
  });

  it('handles errors from User.create and returns 500', async () => {
    const req: any = {
      body: {
        username: 'bob',
        email: 'bob@example.com',
        password: 'secret',
        firstName: 'Bob',
        lastName: 'Smith',
        age: 25
      }
    };
    const res = makeRes();

    mockCreate.mockRejectedValue(new Error('db fail'));

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'db fail' });
  });
});
