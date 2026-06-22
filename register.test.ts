import crypto from 'crypto';

jest.mock('../common/database', () => ({}));

let mockUserModel: any;
const defineUserMock = jest.fn(() => mockUserModel);
jest.mock('../common/models/User', () => defineUserMock);

let signMock: jest.Mock;
jest.mock('jsonwebtoken', () => ({
  sign: (...args: any[]) => signMock(...args)
}));

describe('register', () => {
  let register: any;
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.resetModules();

    signMock = jest.fn().mockReturnValue('signedtoken');

    mockUserModel = {
      create: jest.fn()
    };

    req = {
      body: {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'PlainPass123',
        firstName: 'John',
        lastName: 'Doe',
        age: 30
      }
    };

    res = {
      status: jest.fn(function (this: any) { return this; }),
      json: jest.fn()
    };

    process.env.JWT_SECRET = 'supersecret';

    ({ register } = require('./register'));
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('creates user, hashes password, and returns 201 with token', async () => {
    const createdUser = { id: 42, username: 'johndoe', email: 'john@example.com' };
    mockUserModel.create.mockResolvedValue(createdUser);

    await register(req, res);

    // Password hashing
    const expectedHash = crypto.createHash('sha256').update('PlainPass123').digest('hex');
    expect(mockUserModel.create).toHaveBeenCalledWith({
      username: 'johndoe',
      email: 'john@example.com',
      password: expectedHash,
      firstName: 'John',
      lastName: 'Doe',
      age: 30
    });

    // JWT signing
    expect(signMock).toHaveBeenCalledWith(
      { username: 'johndoe', userId: 42 },
      'supersecret',
      { expiresIn: '24h' }
    );

    // Response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: { id: 42, username: 'johndoe', email: 'john@example.com' },
      token: 'signedtoken'
    });
  });

  it('returns 500 when JWT secret is missing', async () => {
    delete process.env.JWT_SECRET;

    const createdUser = { id: 5, username: 'johndoe', email: 'john@example.com' };
    mockUserModel.create.mockResolvedValue(createdUser);

    await register(req, res);

    expect(signMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'JWT secret not configured' });
  });

  it('returns 500 when user creation fails', async () => {
    const err = new Error('DB failure');
    mockUserModel.create.mockRejectedValue(err);

    await register(req, res);

    expect(signMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'DB failure' });
  });
});
