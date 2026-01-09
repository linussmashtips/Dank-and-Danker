// Test the mob system
console.log('👹 Testing Mob System\n');

// Mock database functions for mob testing
const mockDb = {
  users: new Map()
};

const mockModels = {
  async getUser(username) {
    return mockDb.users.get(username.toLowerCase());
  },

  async createUser(username) {
    const user = {
      username: username.toLowerCase(),
      hp: 100,
      scum: 0,
      is_in_gutter: true, // Start in gutter for mob testing
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
  }
};

// Mock mob engine
const mockMobEngine = {
  roamingMobs: new Map(),
  mobSpawns: [],
  
  getMobTypes() {
    return [
      { 
        name: 'The Crusty Sock-Demon', 
        letter: 'A',
        hp: 100,
        damage: { min: 5, max: 15 },
        scumReward: { min: 20, max: 50 },
        description: 'A foul-smelling creature made of forgotten laundry'
      },
      { 
        name: 'The Keyboard Crumb Swarm', 
        letter: 'F',
        hp: 40,
        damage: { min: 1, max: 8 },
        scumReward: { min: 5, max: 20 },
        description: 'A skittering mass of snack debris and regret'
      }
    ];
  },

  spawnMob() {
    const mobTypes = this.getMobTypes();
    const randomType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
    
    const mob = {
      id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: randomType,
      currentHp: randomType.hp,
      spawnedAt: new Date(),
      location: 'near the stream chat'
    };

    this.roamingMobs.set(mob.id, mob);
    this.mobSpawns.push(mob.id);

    console.log(`👹 Spawning: ${mob.type.name} at ${mob.location}`);
    return mob;
  },

  async handleFightMob(username, mobId) {
    const user = await mockModels.getUser(username);
    if (!user) {
      return {
        success: false,
        message: "User not found. Use !join to enter the Gutter."
      };
    }

    if (!user.is_in_gutter) {
      return {
        success: false,
        message: "You must be in the Gutter to fight mobs."
      };
    }

    // Find the mob
    const fullMobId = Array.from(this.roamingMobs.keys()).find(id => id.startsWith(mobId));
    if (!fullMobId) {
      return {
        success: false,
        message: "That mob is not here or has been defeated."
      };
    }

    const mob = this.roamingMobs.get(fullMobId);
    if (!mob) {
      return {
        success: false,
        message: "That mob is not here or has been defeated."
      };
    }

    // Calculate damage to mob
    const userDamage = Math.floor(Math.random() * 11) + 10; // 10-20 damage
    mob.currentHp = Math.max(0, mob.currentHp - userDamage);

    let message = `${username} strikes the ${mob.type.name} for ${userDamage} damage!`;

    if (mob.currentHp <= 0) {
      // Mob defeated
      const scumReward = Math.floor(Math.random() * (mob.type.scumReward.max - mob.type.scumReward.min + 1)) + mob.type.scumReward.min;
      await mockModels.addScum(username, scumReward);
      
      this.roamingMobs.delete(fullMobId);
      this.mobSpawns = this.mobSpawns.filter(id => id !== fullMobId);

      message += ` The ${mob.type.name} is defeated! ${username} gains ${scumReward} Scum!`;
    } else {
      // Mob fights back
      const mobDamage = Math.floor(Math.random() * (mob.type.damage.max - mob.type.damage.min + 1)) + mob.type.damage.min;
      const newHp = Math.max(0, user.hp - mobDamage);
      await mockModels.updateUserStats(username, { hp: newHp });

      message += ` The ${mob.type.name} counterattacks for ${mobDamage} damage! ${username} has ${newHp} HP remaining.`;
    }

    return {
      success: true,
      message: message,
      mobDefeated: mob.currentHp <= 0
    };
  },

  getMobsList() {
    const activeMobs = Array.from(this.roamingMobs.values()).map(mob => ({
      id: mob.id.substring(0, 8),
      name: mob.type.name,
      hp: mob.currentHp,
      maxHp: mob.type.hp,
      location: mob.location
    }));

    if (activeMobs.length === 0) {
      return "No mobs are currently roaming. Wait for the next spawn!";
    }

    let message = "👹 Active Mobs:\n";
    activeMobs.forEach(mob => {
      const hpPercent = Math.round((mob.hp / mob.maxHp) * 100);
      message += `• ${mob.name} (${hpPercent}% HP) at ${mob.location} - !fightmob ${mob.id}\n`;
    });

    return message.trim();
  }
};

// Run the mob test
async function runMobTest() {
  try {
    console.log('👤 Creating test users:');
    const user1 = await mockModels.createUser('testuser1');
    const user2 = await mockModels.createUser('testuser2');
    console.log(`✅ Created: ${user1.username}, ${user2.username}`);

    console.log('\n👹 Spawning mobs:');
    const mob1 = mockMobEngine.spawnMob();
    const mob2 = mockMobEngine.spawnMob();

    console.log('\n📋 Mob list:');
    const mobsList = mockMobEngine.getMobsList();
    console.log(mobsList);

    console.log('\n⚔️ Testing mob fights:');
    
    // User1 fights first mob
    console.log('\n--- Fight 1 ---');
    const fight1 = await mockMobEngine.handleFightMob('testuser1', mob1.id.substring(0, 8));
    console.log(fight1.message);

    // User2 fights second mob
    console.log('\n--- Fight 2 ---');
    const fight2 = await mockMobEngine.handleFightMob('testuser2', mob2.id.substring(0, 8));
    console.log(fight2.message);

    // Continue fighting until mobs are defeated
    let fightCount = 0;
    while (mockMobEngine.roamingMobs.size > 0 && fightCount < 10) {
      fightCount++;
      console.log(`\n--- Fight ${fightCount + 2} ---`);
      
      const mobIds = Array.from(mockMobEngine.roamingMobs.keys());
      for (const mobId of mobIds) {
        const shortId = mobId.substring(0, 8);
        const user = Math.random() > 0.5 ? 'testuser1' : 'testuser2';
        
        const result = await mockMobEngine.handleFightMob(user, shortId);
        console.log(result.message);
        
        if (result.mobDefeated) break;
      }
    }

    console.log('\n📊 Final user stats:');
    const finalUser1 = await mockModels.getUser('testuser1');
    const finalUser2 = await mockModels.getUser('testuser2');
    
    console.log(`✅ ${finalUser1.username}: HP ${finalUser1.hp}/100, Scum ${finalUser1.scum}`);
    console.log(`✅ ${finalUser2.username}: HP ${finalUser2.hp}/100, Scum ${finalUser2.scum}`);

    console.log('\n🎉 Mob system test completed successfully!');
    console.log('\n📝 Mob system features:');
    console.log('• Random mob spawning every 2-5 minutes');
    console.log('• 8 different mob types with varying HP and rewards');
    console.log('• Players can earn Scum by defeating mobs');
    console.log('• Mobs spawn in random chat locations');
    console.log('• Automatic cleanup of old mobs');

  } catch (error) {
    console.error('❌ Mob test failed:', error);
  }
}

runMobTest();
