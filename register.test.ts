import crypto from 'crypto';

const userModel: { create: jest.Mock } = { create: jest.fn() };

jest.mock('../common/models/User', () => {
  return jest.fn(() => userModel);
});

jest.mock('../common/database', () => ({}));

const jwtSignMock = jest.fn(() => 'mock-token');
jest.mock('jsonwebtoken', () => ({ sign: jwtSignMock }));

describe('register handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userModel.create.mockReset();
  });

  test('creates user, hashes password, returns 201 with token', async () => {
    const { register } = require('./register');

    const body = {
      username: 'alice',
      email: 'alice@example.com',
      password: 's3cr3t',
      firstName: 'Alice',
      lastName: 'Doe',
      age: 30
    };

    const createdUser = { id: 123, username: body.username, email: body.email };
    userModel.create.mockResolvedValue(createdUser);

    const req: any = { body };
    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    const res: any = { status: statusMock, json: jsonMock };

    await register(req, res);

    const expectedHash = crypto.createHash('sha256').update(body.password).digest('hex');

    expect(userModel.create).toHaveBeenCalledWith({
      username: body.username,
      email: body.email,
      password: expectedHash,
      firstName: body.firstName,
      lastName: body.lastName,
      age: body.age
    });

    expect(jwtSignMock).toHaveBeenCalledWith(
      { username: body.username, userId: createdUser.id },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      user: { id: createdUser.id, username: createdUser.username, email: createdUser.email },
      token: 'mock-token'
    });
  });

  test('handles errors and returns 500 with message', async () => {
    const { register } = require('./register');

    const err = new Error('db fail');
    userModel.create.mockRejectedValue(err);

    const req: any = { body: { username: 'bob', email: 'b@e.com', password: 'p', firstName: 'Bob', lastName: 'B', age: 25 } };
    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    const res: any = { status: statusMock, json: jsonMock };

    await register(req, res);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ success: false, error: 'db fail' });
  });
});
