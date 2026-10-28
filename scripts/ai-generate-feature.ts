#!/usr/bin/env ts-node
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();
type TestType = 'api' | 'e2e';
type MockCase = 'valid' | 'empty' | 'truncated' | 'provider-error';
const root = path.resolve(__dirname, '..');
const draftsRoot = path.join(root, 'tests', 'manual', 'features', 'drafts');
const args = process.argv.slice(2);
const valueFor = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
};
const isMock = args.includes('--mock');
const COLORS = { green: (s: string) => `\x1b[32m${s}\x1b[0m`, yellow: (s: string) => `\x1b[33m${s}\x1b[0m`, dim: (s: string) => `\x1b[2m${s}\x1b[0m` };

const API_STEPS = `- When I send POST request to /api/login with email "..." and password "..."
- When I send GET request to /api/hotels?city=...
- When I send GET request to /api/hotels?city=...&checkin=...&checkout=...
- Then the response status code should be {int}
- Then the response should contain field {string}
- Then response should contain hotels in {string}`;
const E2E_STEPS = `- Given I open the Booking.com homepage
- When I search for hotels in "..." from "..." to "..." for "..." adults
- Then I should see search results for "..." with availability
- When I change currency to "..."
- Then prices should be displayed in "..."`;

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}
function slug(value: string): string {
  const result = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50);
  return result || 'generated_feature';
}
function title(value: string): string { return value.replace(/\b\w/g, char => char.toUpperCase()); }
function requiredTags(type: TestType, requested: string): string {
  const extras = requested.split(/[\s,]+/).filter(Boolean).map(tag => tag.startsWith('@') ? tag : `@${tag}`)
    .filter(tag => !['@WIP', '@API', '@E2E', '@GeneratedDraft', '@LocalUI'].includes(tag));
  return ['@WIP', '@GeneratedDraft', type === 'api' ? '@API' : '@E2E', ...extras].join(' ');
}
function mockFeature(description: string, type: TestType): string {
  if (type === 'api') return `Feature: ${title(description)}
  As a test author
  I want to review a login API draft
  So that it can be assessed before execution

  Scenario: Successful login returns a token
    When I send POST request to /api/login with email "testuser@example.com" and password "correct_password"
    Then the response status code should be 200
    And the response should contain field "token"`;
  return `Feature: ${title(description)}
  As a traveller
  I want to search by city
  So that I can review available accommodation

  Scenario: Search results are available
    Given I open the Booking.com homepage
    When I search for hotels in "Paris" from "2030-07-01" to "2030-07-05" for "2" adults
    Then I should see search results for "Paris" with availability`;
}
function normalize(raw: string, type: TestType, tags: string): string {
  const start = raw.search(/^\s*Feature:/m);
  return start < 0 ? raw.trim() : `${requiredTags(type, tags)}\n${raw.slice(start).trim()}`;
}
function nextPath(type: TestType, description: string, technique: string): string {
  const dir = path.join(draftsRoot, type);
  fs.mkdirSync(dir, { recursive: true });
  const expectedDirectory = path.resolve(dir);
  if (fs.realpathSync.native(expectedDirectory) !== expectedDirectory) {
    throw new Error('Drafts directory must not be a symbolic link.');
  }
  const stem = `${technique === 'none' ? 'ai' : slug(technique)}_${slug(description)}`;
  for (let index = 1; ; index += 1) {
    const candidate = path.resolve(expectedDirectory, `${stem}${index === 1 ? '' : `_${index}`}.feature`);
    if (path.dirname(candidate) !== expectedDirectory) throw new Error('Generated draft path must stay inside its drafts directory.');
    if (!fs.existsSync(candidate)) return candidate;
  }
}
function validate(file: string, type: TestType): void {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-generated-draft.js'), '--file', file, '--type', type], { cwd: root, encoding: 'utf8' });
  process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  if (result.error || result.status !== 0) throw new Error(`Draft validation failed (exit ${result.status ?? 1}).`);
}
async function contentFor(description: string, type: TestType, tags: string, technique: string): Promise<string> {
  const mockCase = valueFor('--mock-case') as MockCase | undefined;
  if (isMock) {
    if (!mockCase || mockCase === 'valid') return normalize(mockFeature(description, type), type, tags);
    if (mockCase === 'empty') return '';
    if (mockCase === 'truncated') return `${requiredTags(type, tags)}\nFeature: ${title(description)}`;
    if (mockCase === 'provider-error') throw new Error('Mock provider error (prepared negative response).');
    throw new Error(`Unknown mock case: ${mockCase}`);
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set. Use --mock for offline validation.');
  const contract = type === 'api' ? fs.readFileSync(path.join(root, 'docs', 'api-contract.md'), 'utf8') : 'Local teaching UI has no booking, checkout, cancellation, ownership, or guest capacity. Never add @LocalUI without independently verifying support.';
  const prompt = `Generate only complete raw Gherkin beginning with Feature:. Feature: ${JSON.stringify(description)}. Type: ${type}.
This is a review-only draft; caller adds tags and it must not use @LocalUI. Use dates independent of a particular year.
Contract/stand constraints:\n${contract}\nAvailable exact step forms:\n${type === 'api' ? API_STEPS : E2E_STEPS}\n${technique === 'none' ? '' : `Use ${technique} and explain it in a Gherkin comment.`}`;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({ model: 'claude-opus-4-7', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] });
  const block = response.content[0];
  if (block?.type !== 'text') throw new Error('Provider returned no text feature.');
  return normalize(block.text, type, tags);
}
async function main(): Promise<void> {
  if (isMock) console.log(COLORS.yellow('Mock mode: no external AI API will be called.'));
  const nonInteractive = args.includes('--non-interactive');
  const description = valueFor('--description') ?? (nonInteractive ? '' : await ask('Describe the feature to test: '));
  const rawType = valueFor('--type') ?? (nonInteractive ? 'e2e' : await ask('Test type (e2e / api) [e2e]: '));
  const type: TestType = rawType === 'api' ? 'api' : rawType === 'e2e' || !rawType ? 'e2e' : (() => { throw new Error('Test type must be api or e2e.'); })();
  if (!description.trim()) throw new Error('Description cannot be empty.');
  const tags = valueFor('--tags') ?? '@Smoke @Regression';
  const technique = valueFor('--technique') ?? 'none';
  let content: string;
  try { content = await contentFor(description, type, tags, technique); }
  catch (error) { throw new Error(`Provider request failed: ${(error as Error).message}`); }
  if (!content.trim()) throw new Error('Provider returned an empty feature; no file was written.');
  if (!/^@WIP\b[\s\S]*^Feature:/m.test(content)) throw new Error('Provider returned an incomplete or truncated feature; no file was written.');
  const destination = nextPath(type, description, technique);
  fs.writeFileSync(destination, `${content.trim()}\n`, { encoding: 'utf8', flag: 'wx' });
  try { validate(destination, type); } catch (error) { fs.rmSync(destination, { force: true }); throw error; }
  console.log(COLORS.green(`Draft created and validated: ${path.relative(root, destination)}`));
  console.log(COLORS.dim('Syntax and matching do not prove correctness; review intent and run the local stand before promotion.'));
}
main().catch(error => { console.error(`❌ ${error.message}`); process.exitCode = 1; });
