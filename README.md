# FlyDreamAir Test Suite

Unit and integration tests for the FlyDreamAir prototype, written with
**Jest** and **React Testing Library**.

## What is covered

The suite has 45+ test cases grouped by feature:

| Group | What it checks |
|-------|----------------|
| Helper functions | `money()`, `durStr()`, `bucket()` formatting and boundary cases |
| Registration & login | sign-in, register toggle, logged-in nav state, log out |
| Flight search results | search widget, navigation to results, traveller stepper, trip toggle |
| Filtering & sorting | sort controls, stops filter, cabin-class fare labels |
| Flight details & seat map | seat map renders, taken seats disabled, Continue gating |
| Seat selection & booking | seat highlight, extras, price summary, full booking flow, reference generation |
| My bookings / manage | seeded list, row expansion, cancel button, new booking appears |
| Admin booking view | table renders, row count, column sort, status dropdown |
| Navigation | brand logo home, mobile menu, footer links |

## Install

```bash
npm install --save-dev jest @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom jest-environment-jsdom \
  @babel/preset-env @babel/preset-react babel-jest
```

## Config

Add these two files to the project root.

**babel.config.js**
```js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
```

**jest.config.js**
```js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootdir>/jest.setup.js"],
};
```

**jest.setup.js**
```js
import "@testing-library/jest-dom";
```

Then in `package.json`:
```json
"scripts": { "test": "jest" }
```

## Run

```bash
npm test
```

## Note

These are front-end tests. The login and registration tests verify the
UI state and flow, not real credential checking, because the prototype
has no backend. Likewise the booking and admin tests work against the
in-memory state that resets on page reload.
