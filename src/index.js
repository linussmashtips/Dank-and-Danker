const tmi = require('tmi.js');
const cron = require('node-cron');
const models = require('./db/models');
const dungeonEngine = require('./engine/dungeon');
const combatEngine = require('./engine/combat');
const mobEngine = require('./engine/mobs');
const parser = require('./engine/parser');

require('dotenv').config();

// Twitch configuration
const config = {
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_TOKEN
  },
  channels: [process.env.TWITCH_CHANNEL]
};

// Create a client with our options
const client = new tmi.Client(config);

// Connect to Twitch
async function connect() {
  try {
    await client.connect();
    console.log('Connected to Twitch IRC');
    
    // Initialize database
    await models.initDatabase();
    
    // Start the gutter cycle
    startGutterCycle();
    
    console.log('Dank and Darker bot is ready!');
  } catch (error) {
    console.error('Connection error:', error);
  }
}

// Start the 30-minute gutter cycle
function startGutterCycle() {
  // Schedule gutter opening every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Starting new gutter cycle...');
    
    // Reset previous cycle
    combatEngine.clearAllTimeouts();
    dungeonEngine.resetGutter();
    
    // Open gutter
    const message = await dungeonEngine.openGutter();
    client.say(config.channels[0], message);
    
    // Announce in 2 minutes
    setTimeout(() => {
      client.say(config.channels[0], "The Gutter is open! Use !join to enter. Entry window closes in 3 minutes.");
    }, 120000);
    
    // Final announcement
    setTimeout(() => {
      client.say(config.channels[0], "Entry window closes in 1 minute!");
    }, 240000);
  }, {
    timezone: "Europe/Athens"
  });
}

// Handle chat messages
client.on('message', async (channel, tags, message, self) => {
  // Ignore bot messages
  if (self) return;

  const username = tags.username;
  const isMod = tags.mod || tags.badges?.broadcaster === '1';

  // Parse command
  if (message.startsWith('!')) {
    const { command, args } = parser.parseCommand(message);
    
    try {
      switch (command) {
        case '!join':
          await handleJoin(username);
          break;
          
        case '!cast':
          await handleCast(username, args);
          break;
          
        case '!stats':
          await handleStats(username);
          break;
          
        case '!heal':
        case '!slurp':
          await handleHeal(username);
          break;
          
        case '!bounty':
          await handleBounty(username, args);
          break;
          
        case '!search':
          await handleSearch(username);
          break;
          
        case '!fight':
          await handleFight(username, args);
          break;
          
        case '!gutter':
          await handleGutterStatus(username);
          break;
          
        case '!mobs':
          await handleMobsList(username);
          break;
          
        case '!fightmob':
          await handleFightMob(username, args);
          break;

        // Admin commands
        case '!reset':
          if (isMod) await handleReset(username);
          break;
          
        case '!forceopen':
          if (isMod) await handleForceOpen(username);
          break;
          
        case '!spawnmob':
          if (isMod) await handleSpawnMob(username);
          break;
      }
    } catch (error) {
      console.error(`Error handling command ${command}:`, error);
      client.say(channel, `@${username}, an error occurred. Try again later.`);
    }
  }
});

// Command handlers
async function handleJoin(username) {
  const result = await dungeonEngine.handleJoin(username);
  client.say(config.channels[0], result.message);
}

async function handleCast(username, args) {
  if (args.length === 0) {
    client.say(config.channels[0], `@${username}, usage: !cast @target`);
    return;
  }

  const targetUsername = args[0].replace('@', '');
  
  if (!parser.isValidUsername(targetUsername)) {
    client.say(config.channels[0], `@${username}, invalid target username.`);
    return;
  }

  const result = await combatEngine.handleCast(username, targetUsername);
  client.say(config.channels[0], result.message);
}

async function handleStats(username) {
  const result = await dungeonEngine.handleStats(username);
  client.say(config.channels[0], result.message);
}

async function handleHeal(username) {
  const result = await combatEngine.handleHeal(
    username, 
    parseInt(process.env.HEAL_COST || 50), 
    parseInt(process.env.HEAL_AMOUNT || 20)
  );
  client.say(config.channels[0], result.message);
}

async function handleBounty(username, args) {
  if (args.length < 2) {
    client.say(config.channels[0], `@${username}, usage: !bounty @target amount`);
    return;
  }

  const targetUsername = args[0].replace('@', '');
  const amount = parseInt(args[1]);

  if (!parser.isValidUsername(targetUsername) || isNaN(amount) || amount <= 0) {
    client.say(config.channels[0], `@${username}, invalid bounty format.`);
    return;
  }

  const result = await combatEngine.handleBounty(username, targetUsername, amount);
  client.say(config.channels[0], result.message);
}

async function handleSearch(username) {
  const result = await dungeonEngine.handleSearch(username);
  
  if (result.success && result.mobName) {
    // Send whisper with portal info
    await parser.sendWhisper(username, `You found Portal ${result.mobLetter}. Kill the ${result.mobName} to escape!`);
  }
  
  client.say(config.channels[0], result.message);
}

async function handleFight(username, args) {
  if (args.length === 0) {
    client.say(config.channels[0], `@${username}, usage: !fight [Letter]`);
    return;
  }

  const mobLetter = args[0].toUpperCase();
  
  if (!/^[A-E]$/.test(mobLetter)) {
    client.say(config.channels[0], `@${username}, invalid mob letter. Use A-E.`);
    return;
  }

  const result = await dungeonEngine.handleFight(username, mobLetter);
  client.say(config.channels[0], result.message);
  
  // If extracted, send congratulations whisper
  if (result.extracted) {
    await parser.sendWhisper(username, `Congratulations! You escaped the Gutter with your Scum intact!`);
  }
}

async function handleGutterStatus(username) {
  const status = dungeonEngine.getGutterStatus();
  client.say(config.channels[0], status);
}

// Mob command handlers
async function handleMobsList(username) {
  const mobsList = mobEngine.getMobsList();
  client.say(config.channels[0], mobsList);
}

async function handleFightMob(username, args) {
  if (args.length === 0) {
    client.say(config.channels[0], `@${username}, usage: !fightmob [mob_id]`);
    return;
  }

  const mobId = args[0];
  const result = await mobEngine.handleFightMob(username, mobId);
  client.say(config.channels[0], result.message);
}

async function handleSpawnMob(username) {
  const mob = mobEngine.spawnMob();
  const message = mobEngine.announceMobSpawn(mob);
  client.say(config.channels[0], message);
}

// Admin commands
async function handleReset(username) {
  combatEngine.clearAllTimeouts();
  dungeonEngine.resetGutter();
  mobEngine.stopSpawning();
  mobEngine.roamingMobs.clear();
  mobEngine.mobSpawns = [];
  client.say(config.channels[0], "System reset complete.");
}

async function handleForceOpen(username) {
  const message = await dungeonEngine.openGutter();
  client.say(config.channels[0], message);
  
  // Start mob spawning when gutter opens
  mobEngine.startSpawning();
  mobEngine.startCleanup();
}

// Handle connection events
client.on('connected', (address, port) => {
  console.log(`Connected to ${address}:${port}`);
});

client.on('disconnected', (reason) => {
  console.log(`Disconnected: ${reason}`);
});

// Start the bot
connect().catch(console.error);
