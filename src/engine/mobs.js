const models = require('../db/models');

class MobEngine {
  constructor() {
    this.roamingMobs = new Map(); // mobId -> mob data
    this.mobSpawns = []; // active spawn locations
    this.spawnInterval = null;
  }

  // Initialize mob types
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
        name: 'The Moldy Sandwich Golem', 
        letter: 'B',
        hp: 120,
        damage: { min: 8, max: 18 },
        scumReward: { min: 25, max: 55 },
        description: 'A towering abomination of expired lunch meats'
      },
      { 
        name: 'The Dust Bunny Behemoth', 
        letter: 'C',
        hp: 80,
        damage: { min: 3, max: 12 },
        scumReward: { min: 15, max: 40 },
        description: 'A fluffly but surprisingly aggressive creature'
      },
      { 
        name: 'The Forgotten Left Sock', 
        letter: 'D',
        hp: 60,
        damage: { min: 2, max: 10 },
        scumReward: { min: 10, max: 30 },
        description: 'Lonely and bitter, seeks revenge on all feet'
      },
      { 
        name: 'The Sticky Floor Horror', 
        letter: 'E',
        hp: 150,
        damage: { min: 10, max: 25 },
        scumReward: { min: 30, max: 60 },
        description: 'A viscous nightmare that traps the unwary'
      },
      { 
        name: 'The Keyboard Crumb Swarm', 
        letter: 'F',
        hp: 40,
        damage: { min: 1, max: 8 },
        scumReward: { min: 5, max: 20 },
        description: 'A skittering mass of snack debris and regret'
      },
      { 
        name: 'The Empty Energy Drink Can', 
        letter: 'G',
        hp: 90,
        damage: { min: 6, max: 16 },
        scumReward: { min: 18, max: 45 },
        description: 'Caffeinated and ready for violence'
      },
      { 
        name: 'The Passive Aggressive Note', 
        letter: 'H',
        hp: 70,
        damage: { min: 4, max: 14 },
        scumReward: { min: 12, max: 35 },
        description: 'Hurts more than it should'
      }
    ];
  }

  // Spawn a random mob
  spawnMob() {
    const mobTypes = this.getMobTypes();
    const randomType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
    
    const mob = {
      id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: randomType,
      currentHp: randomType.hp,
      spawnedAt: new Date(),
      location: this.getRandomLocation()
    };

    this.roamingMobs.set(mob.id, mob);
    this.mobSpawns.push(mob.id);

    console.log(`👹 Mob spawned: ${mob.type.name} at ${mob.location}`);
    return mob;
  }

  // Get random spawn location
  getRandomLocation() {
    const locations = [
      'near the stream chat',
      'behind the donation goal',
      'in the mod queue',
      'under the stream title',
      'by the follower count',
      'in the emote pool',
      'near the subscriber list',
      'by the viewer count'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  // Start mob spawning cycle
  startSpawning() {
    if (this.spawnInterval) return;

    // Spawn a mob every 2-5 minutes
    this.spawnInterval = setInterval(() => {
      if (this.mobSpawns.length < 3) { // Limit to 3 active mobs
        const mob = this.spawnMob();
        this.announceMobSpawn(mob);
      }
    }, this.getRandomSpawnDelay());
  }

  // Stop mob spawning
  stopSpawning() {
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
  }

  // Get random spawn delay (2-5 minutes)
  getRandomSpawnDelay() {
    return Math.floor(Math.random() * (5 * 60000 - 2 * 60000 + 1)) + (2 * 60000);
  }

  // Announce mob spawn to chat
  announceMobSpawn(mob) {
    // This would be called from the main index.js to send to Twitch chat
    const message = `👹 A ${mob.type.name} has appeared ${mob.location}! Type !fightmob ${mob.id.substring(0, 8)} to attack it!`;
    return message;
  }

  // Handle !fightmob command
  async handleFightMob(username, mobId) {
    const user = await models.getUser(username);
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
      await models.addScum(username, scumReward);
      
      this.roamingMobs.delete(fullMobId);
      this.mobSpawns = this.mobSpawns.filter(id => id !== fullMobId);

      message += ` The ${mob.type.name} is defeated! ${username} gains ${scumReward} Scum!`;
    } else {
      // Mob fights back
      const mobDamage = Math.floor(Math.random() * (mob.type.damage.max - mob.type.damage.min + 1)) + mob.type.damage.min;
      const newHp = Math.max(0, user.hp - mobDamage);
      await models.updateUserStats(username, { hp: newHp });

      message += ` The ${mob.type.name} counterattacks for ${mobDamage} damage! ${username} has ${newHp} HP remaining.`;

      if (newHp === 0) {
        // User died
        message += ` ${username} has been defeated by the ${mob.type.name}!`;
      }
    }

    return {
      success: true,
      message: message,
      mobDefeated: mob.currentHp <= 0,
      userDefeated: user.hp <= 0
    };
  }

  // Get list of active mobs
  getActiveMobs() {
    return Array.from(this.roamingMobs.values()).map(mob => ({
      id: mob.id.substring(0, 8),
      name: mob.type.name,
      hp: mob.currentHp,
      maxHp: mob.type.hp,
      location: mob.location,
      description: mob.type.description
    }));
  }

  // Handle !mobs command
  getMobsList() {
    const activeMobs = this.getActiveMobs();
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

  // Clean up old mobs (after 10 minutes)
  cleanupOldMobs() {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);

    for (const [mobId, mob] of this.roamingMobs) {
      if (mob.spawnedAt < tenMinutesAgo) {
        this.roamingMobs.delete(mobId);
        this.mobSpawns = this.mobSpawns.filter(id => id !== mobId);
        console.log(`🧹 Cleaned up old mob: ${mob.type.name}`);
      }
    }
  }

  // Start periodic cleanup
  startCleanup() {
    setInterval(() => {
      this.cleanupOldMobs();
    }, 60000); // Clean up every minute
  }
}

module.exports = new MobEngine();
