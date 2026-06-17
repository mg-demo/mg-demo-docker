describe('api.ts side-effect fetchUserData', () => {
  const originalFetch = (global as any).fetch;

  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const waitForAsyncTasks = async () => {
    // Flush microtasks to allow async function body to complete
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    jest.resetModules();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
    logSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('calls fetch and logs expected messages on success', async () => {
    const mockData = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      company: { name: 'Acme Inc.' },
    };

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockData),
    });

    await jest.isolateModulesAsync(async () => {
      await import('./api');
    });
    await waitForAsyncTasks();

    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    expect((global as any).fetch).toHaveBeenCalledWith('https://typicode.com');

    expect(console.log).toHaveBeenCalledWith('API Integration Successful! Data received:');
    expect(console.log).toHaveBeenCalledWith(`Name: ${mockData.name}`);
    expect(console.log).toHaveBeenCalledWith(`Email: ${mockData.email}`);
    expect(console.log).toHaveBeenCalledWith(`Company: ${mockData.company.name}`);

    expect(console.error).not.toHaveBeenCalled();
  });

  it('logs an error when response is not ok', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn(),
    });

    await jest.isolateModulesAsync(async () => {
      await import('./api');
    });
    await waitForAsyncTasks();

    expect(console.error).toHaveBeenCalledWith(
      'Error integrating with the API:',
      'HTTP error! Status: 500'
    );
    expect(console.log).not.toHaveBeenCalled();
  });

  it('logs an error when fetch rejects (network error)', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('Network down'));

    await jest.isolateModulesAsync(async () => {
      await import('./api');
    });
    await waitForAsyncTasks();

    expect(console.error).toHaveBeenCalledWith(
      'Error integrating with the API:',
      'Network down'
    );
    expect(console.log).not.toHaveBeenCalled();
  });
});
