# 🏰 Game Title: Dank and Darker

## The "Extraction-Disgust" RPG for your Twitch chat

This setup is designed to run for free using Node.js on Koyeb, PostgreSQL for storage, and StreamElements for the AI flavor.

---

## 1. The Game Loop (The "Dungeon" Cycle)

The game operates in two phases to prevent it from becoming spammy and to keep the "stakes" high.

### Phase 1: The Lobby (Peaceful)

- Chat is normal.
- Users can check `!stats` or `!heal` using Scum (Gold).

### Phase 2: The Gutter Opens (30 min intervals)

- The bot announces:  
  **"The Gutter is open! Use !join to enter."**
- Players have 5 minutes to enter.
- Once inside:
  - Their HP is locked at 100
  - They are "in the zone"

---

## 2. The Mechanics of Filth

### Combat (`!cast @target`)

- Triggered by your existing StreamElements AI command.

**The Roll:**  
- Your Koyeb bot calculates a `d20` roll.

**The Damage:**  
- Hits deal 10–30 HP damage.

**The Reward:**  
- Landing a hit steals Scum (Gold) from the target.

---

### The "Hospital Wing" (Timeouts)

- If a player hits 0 HP:
  - They are automatically timed out for 60 seconds.
  - They lose 50% of the Scum they were carrying in that run.

---

## 3. The Extraction (Getting Out Alive)

To keep the "Extraction Shooter" vibe, you don't just win; you have to leave.

### The Search

- After 10 minutes in the Gutter, players can type `!search`.

### The Whisper

- StreamElements whispers the player:  
  **"You found Portal [Letter]. Kill the [Disgusting Mob] to escape!"**

### The Mob Fight

- The player must type `!fight [Letter]` in chat.
- This "aggros" a mob (e.g. The Crusty Sock-Demon).
- The player has to hit the mob 3 times to win.

### The Risk

- Every time they type `!fight`, they are vulnerable.
- Other players see them fighting and can try to "Grief" them with a `!cast`.

### Successful Extraction

- If the mob dies:
  - The player is removed from the "active" list
  - Keeps 100% of their Scum
  - Gets a Survivor Bonus

---

## 4. Economy & "Degen" Features

### Scum (Gold)

- The primary currency.

### Heal

- `!slurp` – Spend 50 Scum to regain 20 HP.

### Bounties

- `!bounty @user 100` – Put a price on someone’s head.

### Future Web3

- Because this is on Node.js/Koyeb, we can later add a command to "Mint" your Scum into a token if the stream grows.

---

## 🛠️ The Technical Blueprint (Folders & Files)

As per your instruction, we won't run code until we know where it lives.

```plaintext
/dank-and-danker
├── src/
│   ├── index.js        # The Entry Point (Connects to Twitch IRC)
│   ├── engine/
│   │   ├── combat.js   # Logic: d20 rolls, Damage calc, Timeouts
│   │   ├── dungeon.js  # Logic: Gutter timers, Portal/Mob spawning
│   │   └── parser.js   # Extracts "UserA" and "UserB" from SE messages
│   ├── db/
│   │   ├── connect.js  # Database connection to Koyeb Postgres
│   │   └── models.js   # Functions to UpdateHP(), AddScum(), GetStats()
├── .env                # Secret Keys (TWITCH_TOKEN, DB_URL, CLIENT_ID)
├── package.json        # Dependencies (tmi.js, pg, dotenv)
└── Procfile            # Koyeb deployment instructions
