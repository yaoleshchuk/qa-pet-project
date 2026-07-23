#!/usr/bin/env ts-node
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config();

const IS_MOCK = process.argv.includes('--mock');

const client = IS_MOCK
  ? null
  : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const COLORS = {
  cyan:   (s: string) => `\x1b[36m${s}\x1b[0m`,
  green:  (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  bold:   (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s: string) => `\x1b[2m${s}\x1b[0m`,
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, ans => resolve(ans.trim())));
}

function askWithDefault(question: string, defaultVal: string): Promise<string> {
  return new Promise(resolve =>
    rl.question(`${question} ${COLORS.dim(`(${defaultVal})`)} `, ans => {
      const trimmed = ans.trim();
      resolve(trimmed === '' ? defaultVal : trimmed);
    })
  );
}

function toFileName(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50);
}

function buildMockFeature(
  description: string,
  testType: 'e2e' | 'api',
  tags: string,
  technique: string,
): string {
  const techniqueComment = technique !== 'none'
    ? `# Technique: ${technique} (ISTQB)\n`
    : '';

  if (testType === 'api') {
    return `${tags}
${techniqueComment}Feature: ${toTitleCase(description)}
  As a developer
  I want to validate the API for ${description}
  So that the backend behaves correctly under all conditions

  @Smoke
  Scenario: Successful request returns expected data
    When I send GET request to /api/hotels with valid parameters
    Then the response status code should be 200
    And the response should contain field "hotels"
    And each hotel should have fields "id", "name", "city", "price"

  @Regression
  Scenario Outline: Filter hotels by price range
    When I send GET request to /api/hotels with min_price "<min>" and max_price "<max>"
    Then the response status code should be 200
    And all returned hotels should have price between <min> and <max>

    Examples:
      | min | max |
      | 50  | 150 |
      | 100 | 300 |
      | 200 | 500 |

  @Regression
  Scenario: Request with invalid parameters returns 400
    When I send GET request to /api/hotels with min_price "invalid"
    Then the response status code should be 400
    And the response should contain field "error"`;
  }

  return `${tags}
${techniqueComment}Feature: ${toTitleCase(description)}
  As a traveller
  I want to ${description.toLowerCase()}
  So that I can find and book suitable accommodation

  Background:
    Given I open the Booking.com homepage

  @Smoke
  Scenario: Happy path — feature works with valid inputs
    When I search for hotels in "Paris" from "2026-07-01" to "2026-07-05" for "2" adults
    Then I should see search results for "Paris" with availability

  @Regression
  Scenario Outline: Feature works across multiple cities and date ranges
    When I search for hotels in "<city>" from "<checkin>" to "<checkout>" for "<adults>" adults
    Then I should see search results for "<city>" with availability

    Examples:
      | city      | checkin    | checkout   | adults |
      | Paris     | 2026-07-01 | 2026-07-05 | 2      |
      | New York  | 2026-08-10 | 2026-08-15 | 1      |
      | Tokyo     | 2026-09-20 | 2026-09-25 | 3      |

  @Regression
  Scenario: Feature shows validation error for invalid inputs
    When I search for hotels in "" from "2026-07-01" to "2026-07-05" for "2" adults
    Then I should see a validation error message`;
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

async function generateFeature(
  description: string,
  testType: 'e2e' | 'api',
  tags: string,
  technique: string,
): Promise<string> {
  const tagList = tags
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(t => (t.startsWith('@') ? t : `@${t}`))
    .filter(tag => tag !== '@WIP');
  tagList.push('@WIP');
  const generatedTags = tagList.join(' ');

  const e2eExample = `@E2E @Acceptance @Smoke
Feature: Hotel Search by City
  As a traveller
  I want to search hotels by city
  So that I can find available accommodation

  Background:
    Given I open the Booking.com homepage

  @Smoke
  Scenario: Successful hotel search returns results
    When I search for hotels in "Paris" from "2026-07-01" to "2026-07-05" for "2" adults
    Then I should see search results for "Paris" with availability

  @Regression
  Scenario Outline: Search hotels in multiple cities
    When I search for hotels in "<city>" from "<checkin>" to "<checkout>" for "<adults>" adults
    Then I should see search results for "<city>" with availability

    Examples:
      | city      | checkin    | checkout   | adults |
      | Paris     | 2026-07-01 | 2026-07-05 | 2      |
      | New York  | 2026-08-10 | 2026-08-15 | 1      |`;

  const apiExample = `@API @Acceptance
Feature: Login API - Success

  Scenario Outline: Login with valid credentials returns token
    When I send POST request to /api/login with email "<email>" and password "<password>"
    Then the response status code should be 200
    And the response should contain field "token"

    Examples:
      | email               | password    |
      | user1@mail.com      | password123 |
      | tester@booking.com  | secretpass  |`;

  const techniqueNote = technique !== 'none'
    ? `\nApply the "${technique}" test design technique (ISTQB). Add a comment block explaining the technique.`
    : '';

  const prompt = `You are a senior QA engineer. Generate a Gherkin feature file for a Booking.com test suite.

Feature to test: "${description}"
Test type: ${testType === 'e2e' ? 'End-to-end UI test (Playwright/Cypress)' : 'API test (REST)'}
Tags to apply: ${generatedTags}${techniqueNote}

Requirements:
- Start with the tags line, then Feature keyword
- Always include @WIP until matching automation steps are implemented
- Include "As a / I want / So that" user story
- For e2e: include a Background with "Given I open the Booking.com homepage"
- Mix Scenario and Scenario Outline where appropriate
- Include positive (happy path) AND negative (error/edge) scenarios
- Add @Smoke to the most critical scenario, @Regression to the rest
- Use realistic dates in 2026, realistic hotel cities and data
- Keep step wording consistent with this style:
${testType === 'e2e' ? e2eExample : apiExample}

Output ONLY the raw Gherkin. No markdown fences, no explanation.`;

  if (IS_MOCK) return buildMockFeature(description, testType, generatedTags, technique);

  const message = await client!.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text.trim();
}

async function main() {
  console.log('\n' + COLORS.bold(COLORS.cyan('╔══════════════════════════════════════╗')));
  console.log(COLORS.bold(COLORS.cyan('║   AI Feature File Generator  🤖       ║')));
  console.log(COLORS.bold(COLORS.cyan('╚══════════════════════════════════════╝')) + '\n');

  if (IS_MOCK) {
    console.log(COLORS.yellow('  ⚠️   Running in mock mode — Claude API will not be called.\n'));
  } else if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌  ANTHROPIC_API_KEY is not set. Add it to your .env file.\n');
    process.exit(1);
  }

  const description = await ask(COLORS.cyan('? ') + COLORS.bold('Describe the feature to test: '));
  if (!description) { console.error('Description cannot be empty.'); process.exit(1); }

  const typeRaw = await askWithDefault(COLORS.cyan('? ') + COLORS.bold('Test type') + ' (e2e / api):', 'e2e');
  const testType = typeRaw === 'api' ? 'api' : 'e2e';

  const tags = await askWithDefault(COLORS.cyan('? ') + COLORS.bold('Tags') + ' (e.g. @Smoke @Regression):', '@Smoke @Regression');

  const techniques = ['none', 'BVA', 'EP', 'Decision Table', 'State Transition', 'Error Guessing'];
  console.log('\n' + COLORS.dim('  Techniques: ' + techniques.map((t, i) => `${i}) ${t}`).join('  ')));
  const techRaw = await askWithDefault(COLORS.cyan('? ') + COLORS.bold('Test design technique') + ' (0–5):', '0');
  const technique = techniques[parseInt(techRaw, 10)] ?? 'none';

  console.log('\n' + COLORS.yellow(IS_MOCK ? '  ⏳  Generating feature…' : '  ⏳  Calling Claude API…'));

  let featureContent: string;
  try {
    featureContent = await generateFeature(description, testType, tags, technique);
  } catch (err: any) {
    console.error('❌  Claude API error:', err.message);
    process.exit(1);
  }

  const baseName = toFileName(description);
  const folder = testType === 'e2e'
    ? path.join(__dirname, '..', 'tests', 'manual', 'features', 'e2e')
    : path.join(__dirname, '..', 'tests', 'manual', 'features', 'api');

  const prefix = technique !== 'none'
    ? technique.toLowerCase().replace(/\s+/g, '_') + '_'
    : 'ai_';

  const fileName = `${prefix}${baseName}.feature`;
  const filePath = path.join(folder, fileName);

  fs.writeFileSync(filePath, featureContent + '\n', 'utf-8');

  console.log('\n' + COLORS.green('  ✅  Feature file generated!'));
  console.log(COLORS.dim(`     → tests/manual/features/${testType}/${fileName}`) + '\n');
  console.log(COLORS.dim('─'.repeat(50)));
  console.log(featureContent);
  console.log(COLORS.dim('─'.repeat(50)) + '\n');

  rl.close();
}

main();
