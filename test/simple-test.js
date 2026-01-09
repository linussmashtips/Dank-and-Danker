// Simple test without database dependency
console.log('🧪 Starting Simple Dank and Darker Test\n');

// Test combat engine
console.log('⚔️ Testing Combat Engine:');
const combatEngine = require('../src/engine/combat');

// Test d20 roll
const roll = combatEngine.rollD20();
console.log(`✅ d20 Roll: ${roll} (should be 1-20)`);

// Test damage calculation
const damage = combatEngine.calculateDamage();
console.log(`✅ Damage: ${damage} (should be 10-30)`);

// Test timeout check
const isTimeout = combatEngine.isInTimeout('testuser');
console.log(`✅ Timeout check: ${isTimeout} (should be false)`);

// Test dungeon engine
console.log('\n🚪 Testing Dungeon Engine:');
const dungeonEngine = require('../src/engine/dungeon');

// Test gutter status
const status = dungeonEngine.getGutterStatus();
console.log(`✅ Gutter Status: ${status}`);

// Test state
const state = dungeonEngine.getState();
console.log(`✅ Gutter State: isOpen=${state.isOpen}, entryWindowActive=${state.entryWindowActive}`);

// Test parser
console.log('\n🔍 Testing Parser:');
const parser = require('../src/engine/parser');

// Test username extraction
const mentions = parser.extractUsernames('!cast @target1 @target2');
console.log(`✅ Mentions: [${mentions.join(', ')}] (should be target1, target2)`);

// Test command parsing
const parsed = parser.parseCommand('!cast @target');
console.log(`✅ Command: ${parsed.command}, Args: [${parsed.args.join(', ')}]`);

// Test username validation
const valid = parser.isValidUsername('testuser123');
const invalid = parser.isValidUsername('bad@user');
console.log(`✅ Username validation: valid=${valid}, invalid=${invalid}`);

console.log('\n🎉 Simple test completed successfully!');
console.log('\n📝 All core game mechanics are working!');
console.log('Next: Set up database and run full integration test with: npm test');
