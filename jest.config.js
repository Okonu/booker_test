module.exports = {
    testEnvironment: 'node',
    testTimeout: 15000,
    setupFiles: ['<rootDir>/jest.setup.js'],
    verbose: true,
    reporters: [
        'default',
        ['jest-html-reporter', {
            pageTitle: 'Test Report',
            outputPath: './test-report.html'
        }]
    ]
};