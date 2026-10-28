import { Given } from '@cucumber/cucumber';

// Test-only negative fixture. This wording is intentionally absent from the
// generator prompt and exists solely to prove that the validator rejects an
// actual Cucumber ambiguous match; it cannot make a generated draft pass.
Given('I deliberately trigger an ambiguous draft step', () => undefined);
Given(/^I deliberately trigger an ambiguous draft step$/, () => undefined);
