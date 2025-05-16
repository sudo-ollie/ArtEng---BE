import { ADMIN_USER_ID } from './src/shared/testing/mockClerkMiddleware';

process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_ZW5nYWdlZC1tb3JheS0yOS5jbGVyay5hY2NvdW50cy5kZXYk';
process.env.CLERK_SECRET_KEY = 'sk_test_SvZ8bknWdLpeUu6btaq9gCZnILQYLwtXiy3Y15wsvf';
process.env.ADMIN_USER_ID = ADMIN_USER_ID;
const testDatabaseUrl = 'postgresql://postgres:adminpw@localhost:5432/ArtEngTest';
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = testDatabaseUrl;

//  Mocking Clerk SDK
jest.mock('@clerk/clerk-sdk-node', () => {
  return {
    clerkClient: {
      users: {
        getUser: jest.fn().mockImplementation((userId) => {
          return Promise.resolve({
            id: userId,
            firstName: 'Test',
            lastName: 'User',
            emailAddresses: [{ emailAddress: 'test@example.com' }],
            publicMetadata: {
              role: userId === ADMIN_USER_ID ? 'admin' : 'user'
            }
          });
        })
      }
    }
  };
});

const originalConsoleError = console.error;
console.error = (...args) => {
  //  Filtering Out Clerk Key Errors
  if (args[0] && 
      typeof args[0] === 'object' && 
      args[0].message && 
      typeof args[0].message === 'string' &&
      args[0].message.includes('Publishable key is missing')) {
    return;
  }
  originalConsoleError(...args);
};

//  Resets Mock MW Between Tests
afterEach(() => {
  jest.clearAllMocks();
});