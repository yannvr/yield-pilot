import { describe, it } from 'node:test';
import assert from 'node:assert';
import { metadata } from '../index.js';

describe('Aave protocol plugin', () => {
  it('should have correct metadata', () => {
    assert.strictEqual(metadata.type, 'protocol');
    assert.strictEqual(typeof metadata.name, 'string');
    assert.strictEqual(typeof metadata.version, 'string');
    assert.strictEqual(typeof metadata.description, 'string');
  });

  // Add more tests for your plugin functionality
});
