# Restful-Booker API Test Suite

This project contains automated tests for the Restful-Booker API platform. It includes tests for authentication, booking operations, and performance monitoring.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Git

## Setup Instructions

1. Clone the repository:
```
git clone https://github.com/Okonu/booker_test.git
cd booker_test
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory:
```env
API_BASE_URL=https://restful-booker.herokuapp.com
USERNAME=admin
PASSWORD=password123
```

## Running Tests

1. Run all tests:
```
npm test

#or run
npm run test:watch
```
2. Run specific test suites:
```
# Run auth tests only
npm run test:auth

# Run booking tests only
npm run test:booking

# Run performance tests only
npm run test:performance
```

3. Run tests with coverage:
```
npm run test:coverage
```

## Scripts Available

```json
{
  "scripts": {
    "test": "jest --detectOpenHandles",
    "test:auth": "jest auth.test.js",
    "test:booking": "jest booking.test.js",
    "test:performance": "jest performance.test.js",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watchAll"
  }
}
```

## Test Report

After running tests, a HTML report is generated at `./test-report.html`
