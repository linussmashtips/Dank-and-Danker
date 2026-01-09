# 🧪 Testing Dank and Darker Locally

This guide will help you test the game locally before deploying to production.

## Quick Start Testing

### Option 1: In-Memory Testing (No Database Required)

For the fastest testing without any setup:

```bash
# Just run the local test
npm test
```

This will test all the core game mechanics using mock data.

### Option 2: Local Database Testing

For more realistic testing with persistent data:

1. **Set up local PostgreSQL:**
   ```bash
   # Run the setup script
   node test/setup-local-db.js
   ```

2. **Update your .env file:**
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/dank_and_darker_test
   ```

3. **Run the tests:**
   ```bash
   npm test
   ```

### Option 3: Online Database Testing

Use a free PostgreSQL service like:
- [Supabase](https://supabase.com/) (Recommended)
- [Neon](https://neon.tech/)
- [Railway](https://railway.app/)

1. **Create a free database**
2. **Update your .env with the connection string**
3. **Run tests:**
   ```bash
   npm test
   ```

## Testing Commands

### Core Game Mechanics
```bash
# Test all game mechanics
npm test

# Watch for changes and re-run tests
npm run test:watch
```

### Individual Component Testing

You can also test individual components:

```bash
# Test database models
node -e "require('./src/db/models').initDatabase().then(() => console.log('Database OK'))"

# Test combat engine
node -e "const combat = require('./src/engine/combat'); console.log('Roll:', combat.rollD20())"

# Test dungeon engine
node -e "const dungeon = require('./src/engine/dungeon'); console.log('Status:', dungeon.getGutterStatus())"
```

## Manual Testing with Twitch

Once you have the basic components working:

### 1. Set Up Twitch Credentials

Get your credentials from:
- **Twitch OAuth Token:** [Twitch Dev Console](https://dev.twitch.tv/console)
- **Twitch Client ID:** Same place as OAuth token
- **StreamElements JWT:** [StreamElements Dashboard](https://streamelements.com/dashboard/account/jwt)

### 2. Update .env File

```env
TWITCH_USERNAME=your_bot_name
TWITCH_TOKEN=oauth:your_token_here
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CHANNEL=your_channel_name
STE_JWT_TOKEN=your_jwt_token_here
STE_CHANNEL_ID=your_channel_id_here
```

### 3. Test Commands in Chat

Start the bot:
```bash
npm run dev
```

Then in your Twitch chat, use these admin commands:

```twitch
!forceopen          # Open the Gutter immediately
!join               # Join as a test user
!cast @target       # Test combat
!search             # Test portal system
!fight A            # Test mob fighting
!heal               # Test healing
!bounty @user 100   # Test bounties
!stats              # Check stats
!reset              # Reset everything
```

## Expected Test Output

When you run `npm test`, you should see:

```
🧪 Starting Dank and Darker Local Test

✅ Database initialized

👤 Testing User System:
✅ Created users: testuser1, testuser2

📊 Testing Stats:
✅ Stats: testuser1 | HP: 100/100 | Scum: 0 | Status: IN LOBBY

🚪 Testing Gutter System:
✅ Join: testuser1 enters the Gutter with 100 HP!

⚔️ Testing Combat System:
✅ Cast: testuser1 hits testuser2 for 25 damage! Stole 35 Scum. testuser2 has 75 HP remaining.

💚 Testing Heal System:
✅ Heal: testuser1 spends 50 Scum to heal 20 HP. Now at 100 HP.

🔍 Testing Search System:
✅ Search: You found Portal C. Kill the Dust Bunny Behemoth to escape!

🗡️ Testing Fight System:
✅ Fight 1: testuser1 strikes the C! Hit 1/3 needed.
✅ Fight 2: testuser1 strikes the C! Hit 2/3 needed.
✅ Fight 3: testuser1 defeated the C and escaped the Gutter!

💰 Testing Bounty System:
✅ Bounty: testuser1 placed a 100 Scum bounty on testuser2!

📊 Final Stats:
✅ User1: testuser1 | HP: 100/100 | Scum: 45 | Status: IN LOBBY
✅ User2: testuser2 | HP: 75/100 | Scum: 65 | Status: IN GUTTER | Bounty: 100 Scum

🎉 Local test completed successfully!
```

## Troubleshooting

### Common Issues

**Database Connection Failed:**
- Check if PostgreSQL is running
- Verify your DATABASE_URL format
- Try using an online database service

**Twitch Connection Failed:**
- Verify your OAuth token format (should start with `oauth:`)
- Check that your bot has joined your channel
- Ensure your Twitch username matches the bot account

**StreamElements Whispers Not Working:**
- Verify your JWT token is valid
- Check that your channel ID is correct
- Test with the mock parser first

**Commands Not Responding:**
- Check that the bot is connected to your channel
- Verify the bot has necessary permissions
- Check the console for error messages

### Debug Mode

Enable debug logging by adding to your .env:

```env
DEBUG=true
```

### Test Database Cleanup

To reset your test database:

```bash
# Drop and recreate test database
dropdb dank_and_darker_test
createdb dank_and_darker_test
```

Or use the admin command in chat:
```twitch
!reset
```

## Next Steps

Once local testing is successful:

1. **Deploy to Koyeb** using the Procfile
2. **Set up production database** (Supabase recommended)
3. **Configure production environment variables**
4. **Test with real Twitch chat**

Happy testing! 🎮
