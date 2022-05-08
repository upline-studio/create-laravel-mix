#!/usr/bin/env node

import fs from "fs-extra";
import replace from "replace";
import prompts from "prompts";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mix-"));

const prompt = async (config) => {
  return (
    await prompts(
      {
        ...config,
        name: "value",
      },
      {
        onCancel: () => {
          process.exit(0);
        },
      }
    )
  ).value;
};

const projectName = await prompt({
  type: "text",
  message: "Project name (empty to use this directory)",
});

const source = await prompt({
  type: "text",
  message: "Source dir",
  initial: "assets",
  validate: (value) => value.length > 0,
});

const destination = await prompt({
  type: "text",
  message: "Project root directory",
  initial: "public",
  validate: (value) => value.length > 0,
});

const projectPath = path.resolve(process.cwd(), projectName);

const confirm = await prompt({
  type: "confirm",
  message: `\nProject will be in ${projectPath},\n source files will be in ${source},\n public dir is ${destination}`,
  validate: (value) => value.length > 0,
});

console.log("\n");

if (!confirm) {
  console.log("As you wish.\nCreating process is aborted.");
}

await fs.copy(path.resolve(__dirname, "config-files"), tempDir);

await replace({
  regex: "##SOURCE_PATH##",
  replacement: source,
  paths: [tempDir],
  recursive: true,
  silent: false,
});

await replace({
  regex: "##TARGET_PATH##",
  replacement: destination,
  paths: [tempDir],
  recursive: true,
  silent: false,
});

await fs.copy(tempDir, projectPath);

console.log("Now run:");
if (projectName) {
  console.log(`cd ${projectName} && npm i`);
} else {
  console.log("npm i");
}
