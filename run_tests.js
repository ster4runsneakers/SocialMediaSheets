const fs = require('fs');
const vm = require('vm');

// Create a sandbox to run the code in
const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
};
sandbox.global = sandbox; // Make the sandbox the global object
vm.createContext(sandbox);

// Function to run a file's content in the sandbox
function runInSandbox(filepath) {
  const code = fs.readFileSync(filepath, 'utf8');
  vm.runInContext(code, sandbox);
}

// Load QUnit
runInSandbox('qunit.js');
const QUnit = sandbox.QUnit; // QUnit should now be attached to the sandbox

// Configure QUnit to not start automatically and to log results.
QUnit.config.autostart = false;

let failures = 0;
QUnit.log(function(details) {
    if (details.result) {
        process.stdout.write('.');
        return;
    }
    process.stdout.write('F');
    let msg = "\nTest failed: " + (details.module || '') + ": " + details.name;
    if (details.message) {
        msg += "\n    " + details.message;
    }
    if (details.expected !== undefined) {
        msg += "\n    Expected: " + details.expected + ", Actual: " + details.actual;
    }
    console.error(msg);
    failures++;
});

QUnit.done(function(details) {
    console.log(`\n\nFinished in ${details.runtime}ms`);
    console.log(`${details.total} assertions, ${details.failed} failed, ${details.passed} passed`);
    if (failures > 0 || details.failed > 0) {
        process.exit(1); // Exit with error code if tests failed
    }
});

// Load the main script and the tests
try {
    const codeGs = fs.readFileSync('Code.gs', 'utf8');
    vm.runInContext(codeGs, sandbox);

    const testsHtml = fs.readFileSync('tests.html', 'utf8');
    // Extract the content of the last script tag, which contains all our tests and mocks
    const scriptTagContent = testsHtml.match(/<script>([\s\S]*?)<\/script>/g).pop();
    const testScript = scriptTagContent.replace(/<\/?script>/g, '');

    vm.runInContext(testScript, sandbox);

} catch (e) {
    console.error("Error running tests:", e);
    process.exit(1);
}

// Manually start the tests
QUnit.start();
