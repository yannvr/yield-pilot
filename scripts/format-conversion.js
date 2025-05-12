#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Utility to convert between JSON and YAML formats
 * Useful for working with configuration files in the preferred format
 */
async function convertFormats() {
  if (process.argv.length < 4) {
    console.log(chalk.blue('YieldPilot Format Converter'));
    console.log(chalk.gray('Converts between JSON and YAML formats\n'));
    console.log('Usage:');
    console.log('  node format-conversion.js json-to-yaml <input.json> [output.yaml]');
    console.log('  node format-conversion.js yaml-to-json <input.yaml> [output.json]');
    return;
  }

  const command = process.argv[2];
  const inputFile = process.argv[3];
  const outputFile = process.argv[4] || getDefaultOutputName(inputFile, command);

  try {
    // Read the input file
    const content = await fs.readFile(inputFile, 'utf-8');

    let result;
    if (command === 'json-to-yaml') {
      // Parse JSON and convert to YAML
      const jsonData = JSON.parse(content);
      result = YAML.stringify(jsonData);
      console.log(chalk.green(`Converting JSON to YAML: ${inputFile} → ${outputFile}`));
    } else if (command === 'yaml-to-json') {
      // Parse YAML and convert to JSON
      const yamlData = YAML.parse(content);
      result = JSON.stringify(yamlData, null, 2);
      console.log(chalk.green(`Converting YAML to JSON: ${inputFile} → ${outputFile}`));
    } else {
      console.error(chalk.red(`Unknown command: ${command}`));
      return;
    }

    // Write the result to the output file
    await fs.writeFile(outputFile, result);
    console.log(chalk.green('Conversion completed successfully!'));

  } catch (error) {
    console.error(chalk.red('Error during conversion:'), error.message);
  }
}

/**
 * Generate a default output filename based on the input filename and conversion direction
 *
 * @param {string} inputFile Input filename
 * @param {string} command Conversion command
 * @returns {string} Default output filename
 */
function getDefaultOutputName(inputFile, command) {
  const parsedPath = path.parse(inputFile);

  if (command === 'json-to-yaml') {
    return path.join(parsedPath.dir, `${parsedPath.name}.yaml`);
  } else if (command === 'yaml-to-json') {
    return path.join(parsedPath.dir, `${parsedPath.name}.json`);
  }

  return inputFile; // Fallback
}

// Run the script
convertFormats();
