const models = require('../src/db/models');
const dungeonEngine = require('../src/engine/dungeon');
const combatEngine = require('../src/engine/combat');

// Mock StreamElements parser for local testing
const mockParser = {
  sendWhisper: async (username, message) => {
    console.log(`[WHISPER] ${username}: ${message}`);
    return true;
  },
  extractUsernames: (message) => {
    const mentions = message.match(/@(\w+)/g);
    return mentions ? mentions.map(mention => mention.substring(1).toLowerCase()) : [];
  },
  parseCommand: (message) => {
    const parts = message.split(' ');
    return { command: parts[0].toLowerCase(), args: parts.slice(1) };
  },
  isValidUsername: (username) => /^[a-zA-Z0-9_]{3,25}$/.test(username),
  formatMobName: (mobName) => mobName
};

// Test the game mechanics
async function runLocalTest() {
  console.log('🧪 Starting Dank and Darker Local Test\n');

  try {
    // Initialize database
    await models.initDatabase();
    console.log('✅ Database initialized');

    // Test user creation
    console.log('\n👤 Testing User System:');
    const user1 = await models.createUser('testuser1');
    const user2 = await models.createUser('testuser2');
    console.log(`✅ Created users: ${user1.username}, ${user2.username}`);

    // Test stats
    console.log('\n📊 Testing Stats:');
    const stats1 = await dungeonEngine.handleStats('testuser1');
    console.log(`✅ Stats: ${stats1.message}`);

    // Test gutter mechanics
    console.log('\n🚪 Testing Gutter System:');
    const joinResult = await dungeonEngine.handleJoin('testuser1');
    console.log(`✅ Join: ${joinResult.message}`);

    // Test combat
    console.log('\n⚔️ Testing Combat System:');
    const castResult = await combatEngine.handleCast('testuser1', 'testuser2');
    console.log(`✅ Cast: ${castResult.message}`);

    // Test heal
    console.log('\n💚 Testing Heal System:');
    const healResult = await combatEngine.handleHeal('testuser1');
    console.log(`✅ Heal: ${healResult.message}`);

    // Test search and fight
    console.log('\n🔍 Testing Search System:');
    // Manually set search window active for testing
    dungeonEngine.gutterState.searchWindowActive = true;
    
    const searchResult = await dungeonEngine.handleSearch('testuser1');
    console.log(`✅ Search: ${searchResult.message}`);

    if (searchResult.success && searchResult.mobLetter) {
      console.log('\n🗡️ Testing Fight System:');
      const fightResult1 = await dungeonEngine.handleFight('testuser1', searchResult.mobLetter);
      console.log(`✅ Fight 1: ${fightResult1.message}`);
      
      const fightResult2 = await dungeonEngine.handleFight('testuser1', searchResult.mobLetter);
      console.log(`✅ Fight 2: ${fightResult2.message}`);
      
      const fightResult3 = await dungeonEngine.handleFight('testuser1', searchResult.mobLetter);
      console.log(`✅ Fight 3: ${fightResult3.message}`);
    }

    // Test bounty system
    console.log('\n💰 Testing Bounty System:');
    const bountyResult = await combatEngine.handleBounty('testuser1', 'testuser2', 100);
    console.log(`✅ Bounty: ${bountyResult.message}`);

    // Test stats again to see changes
    console.log('\n📊 Final Stats:');
    const finalStats1 = await dungeonEngine.handleStats('testuser1');
    const finalStats2 = await dungeonEngine.handleStats('testuser2');
    console.log(`✅ User1: ${finalStats1.message}`);
    console.log(`✅ User2: ${finalStats2.message}`);

    console.log('\n🎉 Local test completed successfully!');
    console.log('\n📝 To test with real Twitch integration:');
    console.log('1. Set up your .env file with real credentials');
    console.log('2. Run: npm run dev');
    console.log('3. Use the admin commands in your Twitch chat:');
    console.log('   - !forceopen (to open the Gutter)');
    console.log('   - !join (to join as testuser1)');
    console.log('   - !cast @target (to test combat)');
    console.log('   - !search (to test portal system)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
runLocalTest();
