const models = require('../db/models');
const combatEngine = require('./combat');

class DungeonEngine {
  constructor() {
    this.gutterState = {
      isOpen: false,
      entryWindowActive: false,
      searchWindowActive: false,
      entryEndTime: null,
      searchStartTime: null,
      searchEndTime: null
    };

    this.gutterTimer = null;
    this.entryTimer = null;
    this.searchTimer = null;
  }

  // Start the gutter cycle
  async openGutter() {
    if (this.gutterState.isOpen) {
      return "The Gutter is already open!";
    }

    this.gutterState.isOpen = true;
    this.gutterState.entryWindowActive = true;
    this.gutterState.entryEndTime = new Date(Date.now() + (process.env.GUTTER_ENTRY_WINDOW_MINUTES || 5) * 60000);

    // Clear any existing timers
    this.clearTimers();

    // Set entry window timer
    this.entryTimer = setTimeout(() => {
      this.gutterState.entryWindowActive = false;
      console.log("Gutter entry window closed");
    }, (process.env.GUTTER_ENTRY_WINDOW_MINUTES || 5) * 60000);

    // Set search window timer
    const searchStartDelay = (process.env.GUTTER_SEARCH_WINDOW_MINUTES || 10) * 60000;
    this.searchTimer = setTimeout(() => {
      this.gutterState.searchWindowActive = true;
      this.gutterState.searchStartTime = new Date();
      this.gutterState.searchEndTime = new Date(Date.now() + 600000); // 10 minutes search window
      console.log("Gutter search window opened");
    }, searchStartDelay);

    return "The Gutter is open! Use !join to enter. Entry window closes in 5 minutes.";
  }

  // Handle !join command
  async handleJoin(username) {
    if (!this.gutterState.isOpen) {
      return {
        success: false,
        message: "The Gutter is not open. Wait for the next cycle."
      };
    }

    if (!this.gutterState.entryWindowActive) {
      return {
        success: false,
        message: "Entry window is closed. Wait for the next cycle."
      };
    }

    // Create user if doesn't exist
    let user = await models.getUser(username);
    if (!user) {
      user = await models.createUser(username);
    }

    // Check if already in gutter
    if (user.is_in_gutter) {
      return {
        success: false,
        message: "You are already in the Gutter!"
      };
    }

    // Join gutter
    await models.joinGutter(username);

    return {
      success: true,
      message: `${username} enters the Gutter with 100 HP!`
    };
  }

  // Handle !search command
  async handleSearch(username) {
    if (!this.gutterState.searchWindowActive) {
      return {
        success: false,
        message: "Search window is not active. Wait for the signal."
      };
    }

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
        message: "You must be in the Gutter to search."
      };
    }

    if (user.mob_target) {
      return {
        success: false,
        message: `You are already hunting ${user.mob_target}. Use !fight ${user.mob_target} to engage.`
      };
    }

    // Get random mob
    const mob = await models.getRandomMob();
    if (!mob) {
      return {
        success: false,
        message: "No mobs available. Try again later."
      };
    }

    // Set mob target
    await models.setMobTarget(username, mob.letter);

    return {
      success: true,
      message: `You found Portal ${mob.letter}. Kill the ${mob.name} to escape!`,
      mobName: mob.name,
      mobLetter: mob.letter
    };
  }

  // Handle !fight command
  async handleFight(username, mobLetter) {
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
        message: "You must be in the Gutter to fight."
      };
    }

    if (!user.mob_target) {
      return {
        success: false,
        message: "You haven't found a portal yet. Use !search first."
      };
    }

    if (user.mob_target !== mobLetter) {
      return {
        success: false,
        message: `You are hunting Portal ${user.mob_target}, not ${mobLetter}.`
      };
    }

    // Increment mob kills
    const newKills = user.mob_kills + 1;
    await models.updateUserStats(username, { mob_kills: newKills });

    // Check if mob is defeated (3 hits required)
    if (newKills >= 3) {
      // Successful extraction
      await this.handleExtraction(username);
      return {
        success: true,
        message: `${username} defeated the ${user.mob_target} and escaped the Gutter!`,
        extracted: true
      };
    }

    return {
      success: true,
      message: `${username} strikes the ${user.mob_target}! Hit ${newKills}/3 needed.`,
      extracted: false
    };
  }

  // Handle successful extraction
  async handleExtraction(username) {
    const user = await models.getUser(username);
    if (!user) return;

    // Leave gutter
    await models.leaveGutter(username);

    // Calculate survivor bonus (10% of current scum)
    const bonus = Math.floor(user.scum * 0.1);
    await models.addScum(username, bonus);

    // Clear any bounties on this user
    await models.clearBounties(username);

    console.log(`${username} successfully extracted with ${user.scum + bonus} Scum (including ${bonus} bonus)`);
  }

  // Handle !stats command
  async handleStats(username) {
    const user = await models.getUser(username);
    if (!user) {
      return {
        success: false,
        message: "User not found. Use !join to enter the Gutter."
      };
    }

    const bounties = await models.getBounties(username);
    const status = user.is_in_gutter ? "IN GUTTER" : "IN LOBBY";

    let mobInfo = "";
    if (user.mob_target) {
      mobInfo = ` | Hunting: ${user.mob_target} (${user.mob_kills}/3)`;
    }

    return {
      success: true,
      message: `${username} | HP: ${user.hp}/100 | Scum: ${user.scum} | Status: ${status}${mobInfo}${bounties > 0 ? ` | Bounty: ${bounties} Scum` : ''}`
    };
  }

  // Get gutter status
  getGutterStatus() {
    if (!this.gutterState.isOpen) {
      return "The Gutter is closed. Next opening in 30 minutes.";
    }

    if (this.gutterState.entryWindowActive) {
      const remaining = Math.ceil((this.gutterState.entryEndTime - new Date()) / 60000);
      return `The Gutter is open! Entry window closes in ${remaining} minutes.`;
    }

    if (this.gutterState.searchWindowActive) {
      return "The Gutter is open! Search for portals to escape.";
    }

    return "The Gutter is open but entry window has closed.";
  }

  // Clear all timers
  clearTimers() {
    if (this.gutterTimer) {
      clearTimeout(this.gutterTimer);
      this.gutterTimer = null;
    }
    if (this.entryTimer) {
      clearTimeout(this.entryTimer);
      this.entryTimer = null;
    }
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  // Reset gutter state
  resetGutter() {
    this.gutterState.isOpen = false;
    this.gutterState.entryWindowActive = false;
    this.gutterState.searchWindowActive = false;
    this.gutterState.entryEndTime = null;
    this.gutterState.searchStartTime = null;
    this.gutterState.searchEndTime = null;
    this.clearTimers();
  }

  // Get current state
  getState() {
    return { ...this.gutterState };
  }
}

module.exports = new DungeonEngine();
