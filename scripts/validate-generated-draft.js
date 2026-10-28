#!/usr/bin/env node
'use strict';
const fs = require('fs'); const path = require('path'); const { spawnSync } = require('child_process');
const { generateMessages } = require('@cucumber/gherkin'); const { IdGenerator } = require('@cucumber/messages');
const root = path.resolve(__dirname, '..'); const args = process.argv.slice(2); const value = flag => args[args.indexOf(flag) + 1];
const file = value('--file'); const type = value('--type');
if (!file || !['api', 'e2e'].includes(type)) { console.error('Usage: validate-generated-draft.js --file <draft.feature> --type <api|e2e>'); process.exit(2); }
const draftRoot = path.resolve(root, 'tests/manual/features/drafts', type); const target = path.resolve(file);
if (!fs.existsSync(draftRoot) || fs.realpathSync.native(draftRoot) !== draftRoot || !target.startsWith(`${draftRoot}${path.sep}`) || path.extname(target) !== '.feature') { console.error('Draft must be a .feature file inside its non-symlink type-specific drafts directory.'); process.exit(2); }
if (fs.lstatSync(target).isSymbolicLink()) { console.error('Draft file must not be a symbolic link.'); process.exit(2); }
const messages = generateMessages(fs.readFileSync(target, 'utf8'), path.relative(root, target), 'text/x.cucumber.gherkin+plain', { includeSource: false, includeGherkinDocument: true, includePickles: true, newId: IdGenerator.uuid() });
const errors = messages.filter(message => message.parseError).map(message => message.parseError.message); const pickles = messages.filter(message => message.pickle);
if (errors.length || !pickles.length) { console.error(`Gherkin syntax validation failed: ${errors.join('; ') || 'no scenarios were parsed'}`); process.exit(1); }
const report = path.join(root, 'reports', `generated-draft-${process.pid}.json`); fs.mkdirSync(path.dirname(report), { recursive: true });
const profile = type === 'api' ? 'draft-api-matching' : 'draft-e2e-matching'; const cucumber = path.join(root, 'node_modules/@cucumber/cucumber/bin/cucumber.js');
const result = spawnSync(process.execPath, [cucumber, '--profile', profile, '--dry-run', '--strict', '--force-exit', '--tags', `@WIP and @GeneratedDraft and @${type.toUpperCase()}`, '--format', 'summary', '--format', `json:${report}`, target], { cwd: root, encoding: 'utf8' });
process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
if (result.error || !fs.existsSync(report)) { console.error(`Matching check could not produce a report: ${result.error?.message || 'missing JSON report'}`); process.exit(1); }
const features = JSON.parse(fs.readFileSync(report, 'utf8')); fs.rmSync(report, { force: true }); const scenarios = features.flatMap(feature => feature.elements || []); const statuses = scenarios.flatMap(scenario => (scenario.steps || []).map(step => step.result?.status || 'unknown'));
if (!scenarios.length || !statuses.length) { console.error('Matching check selected zero scenarios or steps; this is not a successful validation.'); process.exit(1); }
const undefinedCount = statuses.filter(status => status === 'undefined').length; const ambiguousCount = statuses.filter(status => status === 'ambiguous').length;
if (undefinedCount || ambiguousCount || result.status !== 0) { console.error(`Step matching failed: ${undefinedCount} undefined, ${ambiguousCount} ambiguous.`); process.exit(1); }
console.log(`Draft syntax and matching passed for ${scenarios.length} scenario(s), ${statuses.length} step(s); dry-run only, no steps or browser executed.`);
