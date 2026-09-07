import test from "node:test";
import assert from "node:assert/strict";
import { auditPaths, isMobilePath } from "./audit-paths.mjs";
test("clean and installed pnpm reports preserve all advisory paths", () => {
  const advisory = { id: 1, findings: [{ paths: ["packages/mobile>expo>parser"] }] };
  const report = { actions: [{ resolves: [{ id: 1, path: "server>parser" }, { id: 2, path: "unrelated" }] }] };
  assert.deepEqual(auditPaths(report, advisory), ["packages/mobile>expo>parser", "server>parser"]);
  assert.deepEqual(auditPaths(report, { id: 1, findings: [{ paths: [] }] }), ["server>parser"]);
  assert.deepEqual(auditPaths({}, { id: 5 }), []);
});
test("only exact mobile importer paths qualify for the store hold", () => {
  for (const path of ["packages/mobile>expo", "packages__mobile>expo"] ) assert.equal(isMobilePath(path), true);
  for (const path of ["packages/mobile-other>expo", "server>expo", "packages/web>expo", undefined, 7]) assert.equal(isMobilePath(path), false);
});
