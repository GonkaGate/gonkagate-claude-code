import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ALIAS_PACKAGE_NAME = "@gonkagate/claude-code-setup";
const ALIAS_BIN_NAME = "claude-code-setup";
const dryRun = process.argv.includes("--dry-run");
const allowCreatePackage = process.argv.includes("--allow-create-package")
  || process.env.ALLOW_ALIAS_PACKAGE_CREATE === "1";
const requireExistingPackage = process.argv.includes("--require-package")
  || process.env.REQUIRE_ALIAS_PACKAGE === "1";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function isNpmNotFound(output) {
  return output.includes("E404") || output.includes("404 Not Found");
}

function npmView(args) {
  const result = spawnSync("npm", ["view", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.status === 0) {
    return {
      exists: true,
      output: result.stdout
    };
  }

  const output = `${result.stdout}\n${result.stderr}`;
  if (isNpmNotFound(output)) {
    return {
      exists: false,
      output
    };
  }

  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

function canViewPackage(packageName) {
  return npmView([packageName, "name"]).exists;
}

function isVersionPublished(packageName, version) {
  return npmView([`${packageName}@${version}`, "version"]).exists;
}

async function assertExists(path) {
  await access(path, fsConstants.R_OK);
}

const rootPackage = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
const packageVersion = rootPackage.version;

if (!dryRun && !canViewPackage(ALIAS_PACKAGE_NAME)) {
  console.warn(`${ALIAS_PACKAGE_NAME} is not visible on npm yet, or this publisher cannot access it.`);

  if (allowCreatePackage) {
    console.warn("Attempting first publish because alias package creation was explicitly allowed.");
  } else if (requireExistingPackage) {
    console.warn(`Bootstrap ${ALIAS_PACKAGE_NAME} on npm and configure Trusted Publishing for this workflow, then rerun npm run publish:alias.`);
    console.warn("Alias package publishing is required for this run, so failing now.");
    process.exit(1);
  } else {
    console.warn(`Bootstrap ${ALIAS_PACKAGE_NAME} on npm and configure Trusted Publishing for this workflow, then rerun npm run publish:alias.`);
    console.warn("Skipping alias publish so the primary @gonkagate/claude-code release can complete.");
    process.exit(0);
  }
}

if (!dryRun && isVersionPublished(ALIAS_PACKAGE_NAME, packageVersion)) {
  console.log(`${ALIAS_PACKAGE_NAME}@${packageVersion} is already published; skipping alias publish.`);
  process.exit(0);
}

for (const path of ["bin", "dist", "docs", "README.md", "CHANGELOG.md", "LICENSE"]) {
  await assertExists(join(repoRoot, path));
}

const tempRoot = await mkdtemp(join(tmpdir(), "gonkagate-claude-code-setup-"));
const packageRoot = join(tempRoot, "package");

try {
  await mkdir(packageRoot, { recursive: true });

  for (const path of ["bin", "dist", "docs", "README.md", "CHANGELOG.md", "LICENSE"]) {
    await cp(join(repoRoot, path), join(packageRoot, path), { recursive: true });
  }

  const aliasPackage = {
    name: ALIAS_PACKAGE_NAME,
    version: packageVersion,
    description: "Setup-style alias for the GonkaGate Claude Code installer.",
    homepage: rootPackage.homepage,
    bugs: rootPackage.bugs,
    repository: rootPackage.repository,
    type: rootPackage.type,
    bin: {
      [ALIAS_BIN_NAME]: "bin/gonkagate-claude-code.js"
    },
    files: ["bin", "dist", "docs", "README.md", "CHANGELOG.md", "LICENSE"],
    engines: rootPackage.engines,
    keywords: Array.from(new Set([...rootPackage.keywords, ALIAS_BIN_NAME, "setup"])),
    license: rootPackage.license,
    dependencies: rootPackage.dependencies
  };

  await writeFile(join(packageRoot, "package.json"), `${JSON.stringify(aliasPackage, null, 2)}\n`, "utf8");

  const publishArgs = ["publish", "--access", "public"];
  if (dryRun) {
    publishArgs.push("--dry-run");
  } else {
    publishArgs.push("--provenance");
  }

  run("npm", publishArgs, { cwd: packageRoot });
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
