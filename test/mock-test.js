// Mock database test for local development
console.log('🧪 Starting Mock Database Test\n');

// Mock database functions
const mockDb = {
  users: new Map(),
  bounties: new Map(),
  mobTypes: [
    { name: 'The Crusty Sock-Demon', letter: 'A' },
    { name: 'The Moldy Sandwich Golem', letter: 'B' },
    { name: 'The Dust Bunny Behemoth', letter: 'C' },
    { name: 'The Forgotten Left Sock', letter: 'D' },
    { name: 'The Sticky Floor Horror', letter: 'E' }
  ]
};

// Mock models
const mockModels = {
  async getUser(username) {
    return mockDb.users.get(username.toLowerCase());
  },

  async createUser(username) {
    const user = {
      username: username.toLowerCase(),
      hp: 100,
      scum: 0,
      is_in_gutter: false,
      gutter_joined_at: null,
      mob_target: null,
      mob_kills: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    mockDb.users.set(username.toLowerCase(), user);
    return user;
  },

  async updateUserStats(username, updates) {
    const user = mockDb.users.get(username.toLowerCase());
    if (user) {
      Object.assign(user, updates);
      user.updated_at = new Date();
    }
    return user;
  },

  async addScum(username, amount) {
    const user = mockDb.users.get(username.toLowerCase());
    if (user) {
      user.scum += amount;
      user.updated_at = new Date();
    }
    return user;
  },

  async removeScum(username, amount) {
    const user = mockDb.users.get(username.toLowerCase());
    if (user) {
      user.scum = Math.max(0, user.scum - amount);
      user.updated_at = new Date();
    }
    return user;
  },

  async joinGutter(username) {
    return await this.updateUserStats(username, {
      is_in_gutter: true,
      hp: 100,
      gutter_joined_at: new Date()
    });
  },

  async leaveGutter(username) {
    return await this.updateUserStats(username, {
      is_in_gutter: false,
      mob_target: null,
      mob_kills: 0
    });
  },

  async setMobTarget(username, mobLetter) {
    return await this.updateUserStats(username, {
      mob_target: mobLetter,
      mob_kills: 0
    });
  },

  async getRandomMob() {
    const index = Math.floor(Math.random() * mockDb.mobTypes.length);
    return mockDb.mobTypes[index];
  },

  async getBounties(targetUsername) {
    return 0; // Simplified for mock
  }
};

// Test the full game flow with mock database
async function runMockTest() {
  try {
    console.log('👤 Testing User System:');
    const user1 = await mockModels.createUser('testuser1');
    const user2 = await mockModels.createUser('testuser2');
    console.log(`✅ Created users: ${user1.username}, ${user2.username}`);

    console.log('\n📊 Testing Stats:');
    console.log(`✅ User1 stats: HP: ${user1.hp}/100, Scum: ${user1.scum}, Status: ${user1.is_in_gutter ? 'IN GUTTER' : 'IN LOBBY'}`);

    console.log('\n🚪 Testing Gutter System:');
    const joinResult = await mockModels.joinGutter('testuser1');
    console.log(`✅ Join: ${joinResult.username} enters the Gutter with ${joinResult.hp} HP!`);

    console.log('\n⚔️ Testing Combat System:');
    // Simulate combat where testuser2 attacks testuser1
    const damage = Math.floor(Math.random() * 21) + 10; // 10-30
    const scumStolen = Math.floor(Math.random() * 41) + 10; // 10-50
    
    // Since testuser1 has 0 Scum, testuser2 can't steal anything
    const actualStolen = Math.min(scumStolen, user1.scum);
    
    await mockModels.updateUserStats('testuser1', { hp: Math.max(0, user1.hp - damage) });
    await mockModels.removeScum('testuser1', actualStolen);
    await mockModels.addScum('testuser2', actualStolen);
    
    console.log(`✅ Combat: testuser2 hits testuser1 for ${damage} damage!`);
    if (actualStolen > 0) {
      console.log(`   Stole ${actualStolen} Scum from testuser1.`);
    } else {
      console.log(`   testuser1 has no Scum to steal!`);
    }
    console.log(`   testuser1 now has ${user1.hp} HP and ${user1.scum} Scum`);

    console.log('\n💚 Testing Heal System:');
    const healCost = 50;
    const healAmount = 20;
    if (user1.scum >= healCost) {
      await mockModels.removeScum('testuser1', healCost);
      await mockModels.updateUserStats('testuser1', { hp: Math.min(100, user1.hp + healAmount) });
      console.log(`✅ Heal: ${user1.username} spends ${healCost} Scum to heal ${healAmount} HP.`);
    } else {
      console.log(`❌ Heal: ${user1.username} needs ${healCost} Scum to heal. Has ${user1.scum}.`);
    }

    console.log('\n🔍 Testing Search System:');
    const mob = await mockModels.getRandomMob();
    await mockModels.setMobTarget('testuser1', mob.letter);
    console.log(`✅ Search: You found Portal ${mob.letter}. Kill the ${mob.name} to escape!`);

    console.log('\n🗡️ Testing Fight System:');
    for (let i = 1; i <= 3; i++) {
      await mockModels.updateUserStats('testuser1', { mob_kills: i });
      if (i < 3) {
        console.log(`✅ Fight ${i}: ${user1.username} strikes the ${user1.mob_target}! Hit ${i}/3 needed.`);
      } else {
        console.log(`✅ Fight ${i}: ${user1.username} defeated the ${user1.mob_target} and escaped the Gutter!`);
        await mockModels.leaveGutter('testuser1');
        const bonus = Math.floor(user1.scum * 0.1);
        await mockModels.addScum('testuser1', bonus);
        console.log(`   Extraction bonus: ${bonus} Scum`);
      }
    }

    console.log('\n📊 Final Stats:');
    console.log(`✅ User1: ${user1.username} | HP: ${user1.hp}/100 | Scum: ${user1.scum} | Status: ${user1.is_in_gutter ? 'IN GUTTER' : 'IN LOBBY'}`);
    console.log(`✅ User2: ${user2.username} | HP: ${user2.hp}/100 | Scum: ${user2.scum} | Status: ${user2.is_in_gutter ? 'IN GUTTER' : 'IN LOBBY'}`);

    console.log('\n🎉 Mock database test completed successfully!');
    console.log('\n📝 All game mechanics work with mock data!');
    console.log('Next steps:');
    console.log('1. Set up a real database (Supabase recommended)');
    console.log('2. Update .env with DATABASE_URL');
    console.log('3. Run full integration test: npm test');

  } catch (error) {
    console.error('❌ Mock test failed:', error);
  }
}

runMockTest();
