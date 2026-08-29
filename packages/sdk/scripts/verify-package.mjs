import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const packDir = path.resolve(".tmp-pack");
const packMetadataPath = path.join(packDir, "pack.json");

if (!existsSync(packMetadataPath)) {
  throw new Error("Missing .tmp-pack/pack.json. Run npm pack first.");
}

const packMetadata = JSON.parse(readFileSync(packMetadataPath, "utf8"));
const artifact = packMetadata[0];

if (!artifact || !artifact.filename) {
  throw new Error("npm pack did not produce a tarball in .tmp-pack/pack.json.");
}

const tarballPath = path.join(packDir, artifact.filename);
if (!existsSync(tarballPath)) {
  throw new Error(`Tarball not found at ${tarballPath}`);
}

const fileList = execSync(`tar -tf "${tarballPath}"`, { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const requiredFiles = [
  "package/package.json",
  "package/dist/index.js",
  "package/dist/index.cjs",
  "package/dist/index.d.ts",
];

for (const requiredFile of requiredFiles) {
  if (!fileList.includes(requiredFile)) {
    throw new Error(`Expected tarball to contain ${requiredFile}.`);
  }
}

const packageJson = JSON.parse(
  execSync(`tar -xOf "${tarballPath}" package/package.json`, {
    encoding: "utf8",
  }),
);

if (!packageJson.exports || !packageJson.exports["."]) {
  throw new Error("Package exports map is missing the root export.");
}

if (!packageJson.main || !packageJson.module || !packageJson.types) {
  throw new Error("Package manifest is missing bundle metadata.");
}

if (!(packageJson.files && packageJson.files.includes("dist"))) {
  throw new Error("Package files list does not include the dist directory.");
}

const importEntry = packageJson.exports["."].import;
const requireEntry = packageJson.exports["."].require;
const typesEntry = packageJson.exports["."].types;

if (!importEntry || !requireEntry || !typesEntry) {
  throw new Error(
    "Package exports must include import, require, and types entries.",
  );
}

if (
  packageJson.main !== "./dist/index.cjs" ||
  packageJson.module !== "./dist/index.js"
) {
  throw new Error(
    "Package main/module fields must reflect the real tsup ESM/CJS outputs.",
  );
}

console.log(`Package verification passed for ${artifact.filename}`);
console.log(`Files present: ${fileList.length}`);
console.log(`Entry points: ${importEntry}, ${requireEntry}, ${typesEntry}`);
