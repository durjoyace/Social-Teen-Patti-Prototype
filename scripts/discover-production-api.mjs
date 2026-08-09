import { appendFile } from 'node:fs/promises';

const webUrl = process.env.WEB_URL?.replace(/\/$/, '');
if (!webUrl?.startsWith('https://')) {
  throw new Error('WEB_URL must be an HTTPS URL');
}

async function fetchText(url) {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
    headers: { 'User-Agent': 'TeenPatti-production-smoke/1.0' },
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

const html = await fetchText(webUrl);
const scriptSources = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/gi)]
  .map((match) => new URL(match[1], webUrl).href);

if (scriptSources.length === 0) {
  throw new Error('No JavaScript assets were found in the production web page');
}

const bundles = await Promise.all(scriptSources.map(fetchText));
const compiled = bundles.join('\n').replaceAll('\\/', '/').replaceAll('\\u002F', '/');
const discoveredUrls = [...compiled.matchAll(/https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/api)?/gi)]
  .map((match) => match[0]);

const candidates = [...new Set(discoveredUrls)]
  .map((value) => value.endsWith('/api') ? value.slice(0, -4) : value)
  .filter((value) => {
    const candidate = new URL(value);
    const web = new URL(webUrl);
    return candidate.origin !== web.origin && (
      candidate.hostname.includes('railway') ||
      discoveredUrls.includes(`${candidate.origin}/api`)
    );
  })
  .sort((left, right) => Number(!left.includes('railway')) - Number(!right.includes('railway')));

if (candidates.length === 0) {
  throw new Error('No production API candidate was found in the deployed web bundle');
}

let selected;
let health;
let ready;

for (const candidate of candidates) {
  try {
    const [healthResponse, readyResponse] = await Promise.all([
      fetch(`${candidate}/health`, { signal: AbortSignal.timeout(10_000) }),
      fetch(`${candidate}/ready`, { signal: AbortSignal.timeout(10_000) }),
    ]);
    const [healthBody, readyBody] = await Promise.all([
      healthResponse.json(),
      readyResponse.json(),
    ]);
    if (
      healthResponse.ok &&
      readyResponse.ok &&
      healthBody.status === 'ok' &&
      readyBody.status === 'ready'
    ) {
      selected = candidate;
      health = healthBody;
      ready = readyBody;
      break;
    }
  } catch {
    // Continue through public endpoint candidates; the checks below fail closed.
  }
}

if (!selected) {
  throw new Error(`None of the discovered API candidates passed /health and /ready: ${candidates.join(', ')}`);
}

console.log(`Production API: ${selected}`);
console.log(`Health: ${JSON.stringify(health)}`);
console.log(`Readiness: ${JSON.stringify(ready)}`);

if (process.env.GITHUB_ENV) {
  await appendFile(process.env.GITHUB_ENV, `SMOKE_BASE_URL=${selected}\nSMOKE_WEB_URL=${webUrl}\n`);
}
