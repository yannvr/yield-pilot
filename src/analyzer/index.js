import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateYield } from '../projections/index.js';
import { getProtocolData } from '../protocols/index.js';
import { generateInsights } from '../insights/index.js';
import { mockAIStrategy } from './mockAI.js';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Analyze a strategy based on user inputs
 * In production, this would call a real AI model with the prompt
 *
 * @param {Object} strategyInput User input defining strategy requirements
 * @returns {Promise<Object>} Strategy analysis results
 */
export async function analyzeStrategy(strategyInput) {
  try {
    // Load the strategy agent prompt
    const promptPath = path.join(__dirname, '../../strategyAgentPrompt.txt');
    const promptTemplate = await fs.readFile(promptPath, 'utf-8');

    // Load schema (now in YAML format)
    const schemaPath = path.join(__dirname, '../../simulationPromptSchema.yaml');
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    const schema = YAML.parse(schemaContent);

    // Get current protocol data
    const protocolData = await getProtocolData();

    // Prepare input for AI model according to the schema
    const aiInput = {
      userInput: strategyInput,
      protocolData: protocolData,
      marketContext: {
        marketTrend: "neutral",
        riskWarnings: []
      }
    };

    // Format the AI input using the schema structure
    const formattedInput = formatInputAccordingToSchema(aiInput, schema);

    // In production, this would call the AI service with the prompt and formatted input
    // For development, we use a mock AI response
    const strategy = await mockAIStrategy(strategyInput);

    // Post-process: Calculate more precise yields
    const yieldEnhancedStrategy = await calculateYield(strategy, strategyInput);

    // Add market insights
    const finalStrategy = await generateInsights(yieldEnhancedStrategy, protocolData);

    return finalStrategy;
  } catch (error) {
    console.error('Strategy analysis error:', error);
    throw new Error(`Failed to analyze strategy: ${error.message}`);
  }
}

/**
 * Format input according to our YAML schema
 *
 * @param {Object} input The raw input data
 * @param {Object} schema The YAML schema to validate against
 * @returns {Object} Formatted input that matches schema
 */
function formatInputAccordingToSchema(input, schema) {
  // For now, we'll do a simple pass-through
  // In production, we would validate against the schema and ensure all required fields
  return input;
}

/**
 * Format user input for the AI model
 *
 * @param {Object} strategyInput User input object
 * @returns {string} Formatted input for the prompt
 */
function formatInputForPrompt(strategyInput) {
  return YAML.stringify(strategyInput);
}
