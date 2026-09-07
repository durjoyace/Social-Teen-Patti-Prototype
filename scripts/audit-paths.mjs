// pnpm 9 reports paths in findings with installed modules, or actions in a clean checkout.
export function auditPaths(report, advisory) {
  const findings = Array.isArray(advisory.findings) ? advisory.findings : [];
  const paths = findings.flatMap(f => Array.isArray(f.paths) ? f.paths : []);
  const actions = Array.isArray(report.actions) ? report.actions : [];
  const resolved = actions.flatMap(a => Array.isArray(a.resolves) ? a.resolves : [])
    .filter(r => String(r.id) === String(advisory.id))
    .map(r => r.path);
  return [...new Set([...paths, ...resolved])];
}
export function isMobilePath(path) {
  return typeof path === "string" && /^packages(?:\/|__)mobile(?:\s*>|$)/.test(path.trim());
}
