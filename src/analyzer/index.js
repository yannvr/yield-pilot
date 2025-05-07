import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateYield } from '../projections/index.js';
import { getProtocolData } from '../protocols/index.js';
import { generateInsights } from '../insights/index.js';
import { mockAIStrategy } from './mockAI.js';

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

    // Get current protocol data
    const protocolData = await getProtocolData();

    // Prepare input for AI model
    const aiInput = {
      prompt: promptTemplate,
      strategyInput: strategyInput,
      protocolData: protocolData
    };

    // In production, this would call the AI service
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
 * Format user input for the AI model
 *
 * @param {Object} strategyInput User input object
 * @returns {string} Formatted input for the prompt
 */
function formatInputForPrompt(strategyInput) {
  return JSON.stringify(strategyInput, null, 2);
}
