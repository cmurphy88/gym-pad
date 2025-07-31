# Gym Pad API Testing Suite

This comprehensive testing suite provides complete coverage for all API endpoints in the Gym Pad application. The tests are built using Jest and custom utilities to ensure reliability, maintainability, and thorough validation.

## Overview

### Test Coverage
- **Authentication API** (`/api/auth/*`): Login, register, me, logout
- **Exercises API** (`/api/exercises/*`): CRUD operations and history
- **Templates API** (`/api/templates/*`): CRUD operations and latest-data
- **Weight API** (`/api/weight/*`): Weight entries and goals
- **Workouts API** (`/api/workouts/*`): CRUD operations, calendar, from-template

### Key Features
- ✅ **Complete API Coverage**: All endpoints tested with multiple scenarios
- ✅ **Authentication Testing**: Session-based auth with comprehensive security tests
- ✅ **Input Validation**: Extensive validation testing for all data inputs
- ✅ **Error Handling**: Database errors, network issues, and edge cases
- ✅ **Security Testing**: SQL injection prevention, XSS protection, authorization
- ✅ **Performance Testing**: Large datasets, concurrent requests, boundary conditions
- ✅ **Integration Testing**: End-to-end workflows and data consistency

## Test Structure

```
tests/
├── setup/
│   ├── setupTests.js          # Global test configuration
│   └── jest.config.js         # Jest configuration
├── helpers/
│   ├── authHelpers.js         # Authentication utilities
│   ├── databaseHelpers.js     # Database test utilities
│   ├── requestHelpers.js      # HTTP request utilities
│   └── validationHelpers.js   # Input validation utilities
├── api/
│   ├── auth/                  # Authentication tests
│   ├── exercises/             # Exercise API tests
│   ├── templates/             # Template API tests
│   ├── weight/                # Weight tracking tests
│   └── workouts/              # Workout API tests
└── integration/               # End-to-end tests
```

## Running Tests

### All Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### Specific Test Suites
```bash
npm run test:auth          # Authentication tests only
npm run test:exercises     # Exercise API tests only
npm run test:templates     # Template API tests only
npm run test:weight        # Weight API tests only
npm run test:workouts      # Workout API tests only
npm run test:integration   # Integration tests only
```

## Test Database Setup

### Prerequisites
- PostgreSQL test database
- Environment variable: `DATABASE_URL` for test database
- Prisma schema migrations applied

### Database Configuration
```javascript
// Set in tests/setup/setupTests.js
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/gym_pad_test';
```

### Test Isolation
- Each test runs in isolation with clean database state
- Automatic cleanup after each test
- No cross-test data pollution

## Authentication Testing

### Coverage Areas
- **Login Flow**: Valid/invalid credentials, session creation
- **Registration**: User creation, validation, duplicate handling
- **Session Management**: Token validation, expiration, cleanup
- **Security**: Password hashing, timing attacks, cookie security

### Example Test
```javascript
test('should login with valid credentials', async () => {
  const loginData = {
    username: testUser.username,
    password: testUser.plainPassword,
  };

  const response = await tester.post(loginData);

  expect(response.status).toBe(200);
  expect(response.data).toHaveProperty('success', true);
  expect(response.data.user).not.toHaveProperty('password');
});
```

## Input Validation Testing

### Validation Scenarios
- **Required Fields**: Missing, null, empty, whitespace-only values
- **Data Types**: String, number, boolean, array, object validation
- **Boundaries**: Min/max values, length limits, special characters
- **Formats**: Email, date, URL format validation

### Validation Helper Usage
```javascript
testValidationScenarios(tester, 'post', validData, [
  {
    field: 'name',
    values: [
      { value: '', description: 'empty name' },
      { value: null, description: 'null name' },
      { value: 123, description: 'numeric name' },
    ],
  },
]);
```

## Database Testing

### Mock Strategies
- **Prisma Mocking**: Mock database operations for error scenarios
- **Transaction Testing**: Verify atomic operations and rollbacks
- **Constraint Testing**: Foreign keys, unique constraints, cascades

### Test Data Management
```javascript
// Create test data
const user = await createTestUser();
const workout = await createTestWorkout(user.id);
const exercise = await createTestExercise(workout.id);

// Comprehensive test data
const testData = await seedTestDatabase(user.id);
```

## Error Handling Tests

### Error Categories
- **Client Errors (4xx)**: Validation, authentication, authorization
- **Server Errors (5xx)**: Database failures, internal errors
- **Network Errors**: Timeouts, connection issues
- **Edge Cases**: Malformed data, boundary conditions

### Error Testing Pattern
```javascript
test('should handle database connection errors', async () => {
  // Mock database to throw error
  prisma.workout.findMany = jest.fn().mockRejectedValue(new Error('DB Error'));

  const response = await tester.get();
  expectErrorResponse(response, 500, 'Internal server error');
});
```

## Security Testing

### Security Measures
- **SQL Injection**: Parameterized queries, input sanitization
- **XSS Prevention**: Output encoding, CSP headers
- **Authentication**: Session validation, token security
- **Authorization**: User data isolation, permission checks

### Security Test Example
```javascript
test('should prevent SQL injection', async () => {
  const maliciousInput = "'; DROP TABLE users; --";
  
  const response = await tester.get({
    params: { name: maliciousInput }
  });

  // Should handle safely without SQL injection
  expect(response.status).toBe(200);
  // Verify database is still intact
  const users = await prisma.user.findMany();
  expect(users).toBeDefined();
});
```

## Performance Testing

### Performance Scenarios
- **Large Datasets**: Handling many records efficiently
- **Concurrent Requests**: Multiple simultaneous operations
- **Memory Usage**: Preventing memory leaks
- **Response Times**: Acceptable performance thresholds

## Integration Testing

### End-to-End Workflows
- **User Registration → Login → Workout Creation → Exercise Logging**
- **Template Creation → Workout from Template → Exercise Completion**
- **Weight Entry → Goal Setting → Progress Tracking**

### Data Consistency Testing
```javascript
test('should maintain data consistency across operations', async () => {
  // Create user and workout
  const user = await createTestUser();
  const workout = await createTestWorkout(user.id);
  
  // Add exercises
  await createTestExercise(workout.id);
  
  // Delete workout
  await deleteWorkout(workout.id);
  
  // Verify exercises were cascade deleted
  const exercises = await prisma.exercise.findMany({
    where: { workoutId: workout.id }
  });
  expect(exercises).toHaveLength(0);
});
```

## Custom Test Utilities

### ApiTester Class
Simplifies API endpoint testing with consistent request/response handling:

```javascript
const tester = new ApiTester(routeHandler);

// HTTP methods
await tester.get(options);
await tester.post(body, options);
await tester.put(body, options);
await tester.delete(options);
```

### Helper Functions
- `createTestUser()`: Generate authenticated test users
- `createTestWorkout()`: Create workout test data
- `expectErrorResponse()`: Validate error responses
- `validateResponseStructure()`: Check response format

## Best Practices

### Test Organization
- One test file per API route
- Group related tests in describe blocks
- Use descriptive test names
- Clean setup and teardown

### Test Data
- Use factories for consistent test data
- Isolate test data between tests
- Use realistic but predictable data
- Clean up after each test

### Assertions
- Test both success and failure scenarios
- Validate response structure and content
- Check database state changes
- Verify side effects

### Performance
- Keep tests fast and focused
- Use appropriate timeouts
- Mock external dependencies
- Parallel test execution where safe

## Troubleshooting

### Common Issues
- **Database Connection**: Ensure test database is running
- **Environment Variables**: Check DATABASE_URL is set correctly
- **Permissions**: Verify database user has required permissions
- **Port Conflicts**: Ensure test database port is available

### Debug Mode
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/api/auth/login.test.js

# Debug with node inspect
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Reports

### Coverage Metrics
- **Lines**: Individual lines of code executed
- **Functions**: Functions called during tests
- **Branches**: Conditional branches taken
- **Statements**: Individual statements executed

### Target Coverage
- **80%+ across all metrics**
- **Critical paths: 95%+ coverage**
- **Error handling: Comprehensive coverage**

### Viewing Coverage
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Contributing

### Adding New Tests
1. Create test file in appropriate directory
2. Use existing helpers and utilities
3. Follow established patterns
4. Include both success and error scenarios
5. Update this documentation

### Test Standards
- All tests must pass
- New features require comprehensive tests
- Bug fixes require regression tests
- Performance tests for critical paths

## Maintenance

### Regular Tasks
- Update test data as schema changes
- Review and update test scenarios
- Monitor test performance
- Update dependencies

### Schema Changes
1. Update test helpers for new fields
2. Add validation tests for new constraints
3. Update integration tests for new workflows
4. Verify backward compatibility