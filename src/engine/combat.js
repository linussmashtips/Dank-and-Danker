const models = require('../db/models');

class CombatEngine {
  constructor() {
    this.timeoutQueue = new Map(); // username -> timeout timer
  }

  // Roll a d20
  rollD20() {
    return Math.floor(Math.random() * 20) + 1;
  }

  // Calculate damage (10-30)
  calculateDamage() {
    return Math.floor(Math.random() * 21) + 10; // 10 to 30
  }

  // Check if user is in timeout
  isInTimeout(username) {
    return this.timeoutQueue.has(username.toLowerCase());
  }

  // Apply timeout to user
  async applyTimeout(username, durationSeconds = 60) {
    const user = await models.getUser(username);
    if (!user) return false;

    // Set user to timeout state
    await models.updateUserStats(username, {
      hp: 0,
      is_in_gutter: false
    });

    // Schedule timeout removal
    const timer = setTimeout(async () => {
      await models.updateUserStats(username, {
        hp: 100,
        is_in_gutter: true
      });
      this.timeoutQueue.delete(username.toLowerCase());
      console.log(`Timeout expired for ${username}`);
    }, durationSeconds * 1000);

    this.timeoutQueue.set(username.toLowerCase(), timer);
    return true;
  }

  // Handle !cast command
  async handleCast(attackerUsername, targetUsername) {
    const attacker = await models.getUser(attackerUsername);
    const target = await models.getUser(targetUsername);

    if (!attacker || !target) {
      return {
        success: false,
        message: `Both users must exist. Use !join to enter the Gutter.`
      };
    }

    // Check if attacker is in timeout
    if (this.isInTimeout(attackerUsername)) {
      return {
        success: false,
        message: `You are in timeout for ${this.getTimeoutRemaining(attackerUsername)} seconds.`
      };
    }

    // Check if target is in timeout
    if (this.isInTimeout(targetUsername)) {
      return {
        success: false,
        message: `${targetUsername} is currently in timeout.`
      };
    }

    // Check if both are in gutter
    if (!attacker.is_in_gutter || !target.is_in_gutter) {
      return {
        success: false,
        message: `Both players must be in the Gutter to fight.`
      };
    }

    // Roll d20
    const roll = this.rollD20();
    const isHit = roll >= 10; // 50% hit chance (10-20)

    if (isHit) {
      const damage = this.calculateDamage();
      const newHp = Math.max(0, target.hp - damage);

      // Update target HP
      await models.updateUserStats(targetUsername, { hp: newHp });

      // Calculate scum steal (10-50)
      const scumStolen = Math.floor(Math.random() * 41) + 10;
      
      // Transfer scum
      await models.removeScum(targetUsername, scumStolen);
      await models.addScum(attackerUsername, scumStolen);

      // Check if target died
      if (newHp === 0) {
        await this.applyTimeout(targetUsername);
        return {
          success: true,
          message: `${attackerUsername} hits ${targetUsername} for ${damage} damage! Stole ${scumStolen} Scum. ${targetUsername} died and is in timeout for 60 seconds!`
        };
      }

      return {
        success: true,
        message: `${attackerUsername} hits ${targetUsername} for ${damage} damage! Stole ${scumStolen} Scum. ${targetUsername} has ${newHp} HP remaining.`
      };
    } else {
      return {
        success: true,
        message: `${attackerUsername} swings at ${targetUsername} but misses! Roll was ${roll}.`
      };
    }
  }

  // Handle !heal command
  async handleHeal(username, healCost = 50, healAmount = 20) {
    const user = await models.getUser(username);
    if (!user) {
      return {
        success: false,
        message: `User not found. Use !join to enter the Gutter.`
      };
    }

    if (!user.is_in_gutter) {
      return {
        success: false,
        message: `You must be in the Gutter to heal.`
      };
    }

    if (user.hp >= 100) {
      return {
        success: false,
        message: `You already have full HP.`
      };
    }

    if (user.scum < healCost) {
      return {
        success: false,
        message: `You need ${healCost} Scum to heal. You have ${user.scum}.`
      };
    }

    const newHp = Math.min(100, user.hp + healAmount);
    await models.removeScum(username, healCost);
    await models.updateUserStats(username, { hp: newHp });

    return {
      success: true,
      message: `${username} spends ${healCost} Scum to heal ${healAmount} HP. Now at ${newHp} HP.`
    };
  }

  // Handle !bounty command
  async handleBounty(placedByUsername, targetUsername, amount) {
    const placer = await models.getUser(placedByUsername);
    const target = await models.getUser(targetUsername);

    if (!placer || !target) {
      return {
        success: false,
        message: `Both users must exist.`
      };
    }

    if (placer.scum < amount) {
      return {
        success: false,
        message: `You need ${amount} Scum to place this bounty. You have ${placer.scum}.`
      };
    }

    // Deduct scum and place bounty
    await models.removeScum(placedByUsername, amount);
    await models.placeBounty(targetUsername, amount, placedByUsername);

    return {
      success: true,
      message: `${placedByUsername} placed a ${amount} Scum bounty on ${targetUsername}!`
    };
  }

  // Get timeout remaining time
  getTimeoutRemaining(username) {
    const timer = this.timeoutQueue.get(username.toLowerCase());
    if (!timer) return 0;
    
    // This is a rough estimate since we can't easily get remaining time from setTimeout
    return 60; // Default to full timeout duration
  }

  // Clear all timeouts (for testing/reset)
  clearAllTimeouts() {
    for (const [username, timer] of this.timeoutQueue) {
      clearTimeout(timer);
    }
    this.timeoutQueue.clear();
  }
}

module.exports = new CombatEngine();
