# 🏰 Dank and Danker

The "Extraction-Disgust" RPG for your Twitch chat. Built with Node.js, PostgreSQL, and StreamElements integration.

## 🎮 Game Overview

Dank and Danker is a Twitch chat-based RPG where viewers can:
- Join timed "Gutter" cycles every 30 minutes
- Fight each other for Scum (gold) using `!cast @target`
- Search for portals and fight disgusting mobs to escape
- Place bounties on other players
- Heal using Scum

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- PostgreSQL database
- Twitch bot account
- StreamElements account

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd dank-and-darker
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file:**
   ```env
   # Twitch Configuration
   TWITCH_USERNAME=your_bot_username
   TWITCH_TOKEN=oauth:your_oauth_token
   TWITCH_CLIENT_ID=your_client_id
   TWITCH_CHANNEL=your_channel_name

   # Database Configuration
   DATABASE_URL=postgresql://user:password@host:port/database

   # StreamElements Configuration
   STE_JWT_TOKEN=your_streamelements_jwt_token
   STE_CHANNEL_ID=your_streamelements_channel_id

   # Game Configuration (optional)
   GUTTER_INTERVAL_MINUTES=30
   GUTTER_ENTRY_WINDOW_MINUTES=5
   GUTTER_SEARCH_WINDOW_MINUTES=10
   TIMEOUT_DURATION_SECONDS=60
   HEAL_COST=50
   HEAL_AMOUNT=20
   ```

### Running Locally

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### Deployment to Koyeb

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Deploy on Koyeb:**
   - Go to [Koyeb](https://www.koyeb.com/)
   - Create new application
   - Connect your GitHub repository
   - Set environment variables in Koyeb dashboard
   - Deploy!

## 🎯 Commands

### Player Commands
- `!join` - Enter the Gutter (during entry window)
- `!cast @target` - Attack another player
- `!stats` - Check your stats
- `!heal` or `!slurp` - Heal for 50 Scum
- `!bounty @target amount` - Place a bounty
- `!search` - Find a portal to escape (during search window)
- `!fight [Letter]` - Fight your assigned mob
- `!gutter` - Check Gutter status
- `!mobs` - See active roaming mobs
- `!fightmob [id]` - Fight a roaming mob for Scum

### Admin Commands (Mods only)
- `!reset` - Reset the system
- `!forceopen` - Force open the Gutter

## 🏗️ Architecture

```
src/
├── index.js              # Main entry point - Twitch IRC integration
├── engine/
│   ├── combat.js         # Combat logic (d20 rolls, damage, timeouts)
│   ├── dungeon.js        # Gutter mechanics (timers, portals, extraction)
│   └── parser.js         # StreamElements integration & message parsing
└── db/
    ├── connect.js        # PostgreSQL connection
    └── models.js         # Database models & queries
```

## 🎮 Game Mechanics

### The Gutter Cycle
1. **Lobby Phase** (29 minutes) - Normal chat
2. **Gutter Opens** - Players can join for 5 minutes
3. **Combat Phase** - Players fight for Scum
4. **Search Window** (10 minutes in) - Find portals to escape
5. **Extraction** - Fight mobs to escape with rewards

### Combat System
- d20-based attack rolls (50% hit chance)
- 10-30 damage per hit
- Steal 10-50 Scum on successful hits
- 60-second timeout on death
- 50% Scum loss on death

### Extraction System
- Find portals using `!search`
- StreamElements whispers portal location
- Fight assigned mob 3 times to escape
- Keep 100% of Scum + 10% bonus on successful extraction

## 🔧 Development

### Adding New Mobs
Edit the mob types in `src/db/models.js`:

```javascript
const mobTypes = [
  { name: 'Your New Mob', letter: 'F' },
  // Add more mobs...
];
```

### Customizing Game Balance
Adjust values in `.env` or directly in the engine files:
- Combat damage ranges
- Timeout durations
- Heal costs/amounts
- Gutter timing

### Testing
Use the admin commands to test functionality:
- `!forceopen` - Open Gutter immediately
- `!reset` - Clear all state

## 🐛 Troubleshooting

### Common Issues
1. **Twitch Connection Failed** - Check OAuth token and username
2. **Database Connection** - Verify DATABASE_URL format
3. **StreamElements Whispers** - Ensure JWT token is valid
4. **Commands Not Working** - Check bot has necessary permissions

### Logs
The bot outputs detailed logs for debugging:
- Connection status
- Command execution
- Database operations
- StreamElements API calls

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Made with 💩 for the degenerate Twitch community.**
