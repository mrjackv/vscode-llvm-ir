## Compilation Instructions

Make sure you have `node` and `npm` installed on the local machine

Then:

```
npm
./node_modules/.bin/vsce package
```

Now there should be a `llvm-ir-<version>.vsix` file present that can be installed via the menu option 'Install from VSIX' in the Extensions tab

## Running Tests

To run tests

```
npm run test
```
