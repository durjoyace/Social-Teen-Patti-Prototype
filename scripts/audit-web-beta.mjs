import { spawnSync } from 'node:child_process';

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(pnpmCommand, ['audit', '--prod', '--json'], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});

if (result.error) {
  console.error('Unable to run the pnpm production audit:', result.error.message);
  process.exit(2);
}

const output = result.stdout.trim();
let report;

try {
  report = JSON.parse(output);
} catch {
  console.error('The pnpm audit did not return valid JSON; failing closed.');
  if (result.stderr.trim()) console.error(result.stderr.trim());
  process.exit(2);
}

if (!report || typeof report !== 'object' || !report.advisories || typeof report.advisories !== 'object') {
  console.error('The pnpm audit JSON schema was not recognized; failing closed.');
  process.exit(2);
}

const mobilePathPattern = /^packages\/mobile(?:\s*>|$)/;
const blocked = [];
let mobileOnlyCount = 0;

for (const advisory of Object.values(report.advisories)) {
  const paths = Array.isArray(advisory.findings)
    ? advisory.findings.flatMap((finding) => Array.isArray(finding.paths) ? finding.paths : [])
    : [];

  const nonMobilePaths = paths.filter((path) => (
    typeof path !== 'string' || !mobilePathPattern.test(path.trim())
  ));

  if (paths.length === 0 || nonMobilePaths.length > 0) {
    blocked.push({
      id: advisory.github_advisory_id ?? advisory.id ?? 'unknown',
      module: advisory.module_name ?? 'unknown',
      severity: advisory.severity ?? 'unknown',
      title: advisory.title ?? 'Untitled advisory',
      paths: nonMobilePaths.length > 0 ? nonMobilePaths : ['<missing dependency path>'],
      url: advisory.url,
    });
  } else {
    mobileOnlyCount += 1;
  }
}

if (blocked.length > 0) {
  console.error('The web beta dependency gate found advisories outside the held mobile-only graph:');
  for (const advisory of blocked) {
    console.error(JSON.stringify(advisory, null, 2));
  }
  process.exit(1);
}

if (result.status !== 0 && result.status !== 1) {
  console.error(`pnpm audit exited unexpectedly with status ${result.status}.`);
  if (result.stderr.trim()) console.error(result.stderr.trim());
  process.exit(2);
}

if (mobileOnlyCount > 0) {
  console.log(
    `Web/shared pnpm runtime audit passed. ${mobileOnlyCount} mobile-only advisory set(s) remain visible in the separate store-release hold.`,
  );
} else {
  console.log('Web/shared pnpm runtime audit passed with no production advisories.');
}
