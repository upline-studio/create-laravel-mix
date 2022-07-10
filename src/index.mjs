#!/usr/bin/env node

import fs from 'fs-extra';
import replace from 'replace';
import prompts from 'prompts';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import merge from 'lodash.merge';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prompt = async (config) => {
  return (
    await prompts(
      {
        ...config,
        name: 'value',
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
  type: 'text',
  message: 'Project name (empty to use this directory)',
});

const source = await prompt({
  type: 'text',
  message: 'Source dir',
  initial: 'assets',
  validate: (value) => value.length > 0,
});

const destination = await prompt({
  type: 'text',
  message: 'Project root directory',
  initial: 'public',
  validate: (value) => value.length > 0,
});

const projectPath = path.resolve(process.cwd(), projectName);

const confirm = await prompt({
  type: 'confirm',
  message: `\nProject will be in ${projectPath},\n source files will be in ${source},\n public dir is ${destination}`,
  validate: (value) => value.length > 0,
});

console.log('\n');

if (!confirm) {
  console.log('As you wish.\nCreating process is aborted.');
  process.exit(0);
}

async function copyAndReplace(from, to) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mix-'));
  await fs.copy(from, tempDir);

  await replace({
    regex: '##SOURCE_PATH##',
    replacement: source,
    paths: [tempDir],
    recursive: true,
    silent: false,
  });

  await replace({
    regex: '##TARGET_PATH##',
    replacement: destination,
    paths: [tempDir],
    recursive: true,
    silent: false,
  });

  await fs.copy(tempDir, to, {
    filter: (file) => {
      return path.basename(file) !== 'package.json';
    },
  });

  await addToPackageJson(tempDir);
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
    return merge(result, json);
  }, {});
}

async function addToPackageJson(filePath) {
  const packageJson = await mergeJsonFile(
    path.resolve(projectPath, 'package.json'),
    path.resolve(filePath, 'package.json')
  );
  await fs.writeJson(path.resolve(projectPath, 'package.json'), packageJson, {
    spaces: 4,
  });
}

await copyAndReplace(path.resolve(__dirname, 'templates/linters'), projectPath);

await copyAndReplace(path.resolve(__dirname, 'templates/mix'), projectPath);

const isScaffoldNeeded = await prompt({
  type: 'confirm',
  message: `\nCreate scaffold asset files`,
  validate: (value) => value.length > 0,
});

if (isScaffoldNeeded) {
  await copyAndReplace(
    path.resolve(__dirname, 'templates/mix-scaffold'),
    path.resolve(projectPath, source)
  );
}
const isEleventyNeeded = await prompt({
  type: 'confirm',
  message: `\nInstall 11ty`,
  validate: (value) => value.length > 0,
});

if (isEleventyNeeded) {
  await copyAndReplace(
    path.resolve(__dirname, 'templates/eleventy'),
    path.resolve(projectPath)
  );
}

console.log('Now run:');
if (projectName) {
  console.log(`cd ${projectName} && npm i`);
} else {
  console.log('npm i');
}
