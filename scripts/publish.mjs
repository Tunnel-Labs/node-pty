import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import childProcess from "node:child_process";
import { join } from "desm";

fs.writeFileSync(
  `${os.homedir()}/.npmrc`,
  `//registry.npmjs.org/:_authToken=${process.env["NPM_TOKEN"]}`
);

const shouldBuildUntargeted = process.argv.includes("--untargeted");

const monorepoDirpath = join(import.meta.url, "..");

const targetString = `${os.platform()}-${os.arch()}`;
const targetPackageDirpath = path.join(
  monorepoDirpath,
  shouldBuildUntargeted
    ? "targets/node-pty"
    : `targets/node-pty-${targetString}`
);

if (!fs.existsSync(targetPackageDirpath)) {
  throw new Error(`Unsupported target: "${targetString}"`);
}

// Build node-pty
childProcess.spawnSync("yarn", ["build"], { cwd: monorepoDirpath });

// Copy the distribution entries into the target package's directory
const distributionEntries = [
  shouldBuildUntargeted ? "binding.gyp" : "build/Release",
  "lib/",
  "scripts/",
  "src/",
  "deps/",
  "typings/",
];

for (const distributionEntry of distributionEntries) {
  fs.cpSync(
    path.join(monorepoDirpath, distributionEntry),
    path.join(targetPackageDirpath, distributionEntry),
    { recursive: true }
  );
}

childProcess
  .spawn("npm", ["publish", "--access=public"], {
    stdio: "inherit",
    cwd: targetPackageDirpath,
  })
  .on("exit", (code) => process.exit(code));
