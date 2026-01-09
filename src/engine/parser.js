const fetch = require('node-fetch');

class StreamElementsParser {
  constructor() {
    this.jwtToken = process.env.STE_JWT_TOKEN;
    this.channelId = process.env.STE_CHANNEL_ID;
  }

  // Send whisper to user via StreamElements
  async sendWhisper(username, message) {
    if (!this.jwtToken || !this.channelId) {
      console.log(`[WHISPER] ${username}: ${message}`);
      return false;
    }

    try {
      const response = await fetch(`https://api.streamelements.com/kappa/v2/bot/whispers/${this.channelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          message: message
        })
      });

      if (response.ok) {
        console.log(`[WHISPER SENT] ${username}: ${message}`);
        return true;
      } else {
        console.error(`[WHISPER ERROR] ${username}: ${response.status} - ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`[WHISPER ERROR] ${username}:`, error.message);
      return false;
    }
  }

  // Extract usernames from message (for !cast @target)
  extractUsernames(message) {
    const mentions = message.match(/@(\w+)/g);
    if (!mentions) return [];
    
    return mentions.map(mention => mention.substring(1).toLowerCase());
  }

  // Parse command arguments
  parseCommand(message) {
    const parts = message.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    return { command, args };
  }

  // Validate username format
  isValidUsername(username) {
    return /^[a-zA-Z0-9_]{3,25}$/.test(username);
  }

  // Format mob name for display
  formatMobName(mobName) {
    // Remove any special characters and make it title case
    return mobName
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

module.exports = new StreamElementsParser();
