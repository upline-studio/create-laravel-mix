#!/usr/bin/env node

import fs from "fs-extra";
import replace from "replace";
import prompts from "prompts";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function copyAndReplace(from, to) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mix-"));
  await fs.copy(from, tempDir);

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

  await fs.copy(tempDir, to, {
    filter: (file) => file !== "package.json",
  });
  const packageJson = await mergeJsonFile(
    path.resolve(destination, "package.json"),
    path.resolve(tempDir, "package.json")
  );
  fs.writeJson(path.resolve(destination, "package.json"), packageJson);
}

async function mergeJsonFile(...files) {
  const promises = files.map(async (file) => {
    try {
      return await fs.readJson(file);
    } catch (e) {
      return {};
    }
  });
  const fileContents = await Promise.all(promises);
  return fileContents.reduce((result, json) => {
    return {
      ...result,
      ...json,
    };
  }, {});
}

await copyAndReplace(
  path.resolve(__dirname, "src/template/linters", projectPath)
);

await copyAndReplace(path.resolve(__dirname, "src/template/mix", projectPath));

console.log("Now run:");
if (projectName) {
  console.log(`cd ${projectName} && npm i`);
} else {
  console.log("npm i");
}
