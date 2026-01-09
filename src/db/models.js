const db = require('./connect');

// Initialize database tables
async function initDatabase() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        hp INTEGER DEFAULT 100,
        scum INTEGER DEFAULT 0,
        is_in_gutter BOOLEAN DEFAULT FALSE,
        gutter_joined_at TIMESTAMP,
        mob_target VARCHAR(50),
        mob_kills INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create bounties table
    await db.query(`
      CREATE TABLE IF NOT EXISTS bounties (
        id SERIAL PRIMARY KEY,
        target_username VARCHAR(50) NOT NULL,
        amount INTEGER NOT NULL,
        placed_by VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create mob types table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mob_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        letter VARCHAR(10) NOT NULL UNIQUE
      )
    `);

    // Insert default mob types if they don't exist
    const mobTypes = [
      { name: 'The Crusty Sock-Demon', letter: 'A' },
      { name: 'The Moldy Sandwich Golem', letter: 'B' },
      { name: 'The Dust Bunny Behemoth', letter: 'C' },
      { name: 'The Forgotten Left Sock', letter: 'D' },
      { name: 'The Sticky Floor Horror', letter: 'E' }
    ];

    for (const mob of mobTypes) {
      await db.query(`
        INSERT INTO mob_types (name, letter)
        VALUES ($1, $2)
        ON CONFLICT (letter) DO NOTHING
      `, [mob.name, mob.letter]);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// User operations
async function getUser(username) {
  const result = await db.query(
    'SELECT * FROM users WHERE username = $1',
    [username.toLowerCase()]
  );
  return result.rows[0];
}

async function createUser(username) {
  const result = await db.query(
    `INSERT INTO users (username, hp, scum)
     VALUES ($1, 100, 0)
     ON CONFLICT (username) DO NOTHING
     RETURNING *`,
    [username.toLowerCase()]
  );
  return result.rows[0];
}

async function updateUserStats(username, updates) {
  const setClause = Object.keys(updates)
    .map((key, index) => `${key} = $${index + 2}`)
    .join(', ');

  const values = [username.toLowerCase(), ...Object.values(updates)];

  const result = await db.query(
    `UPDATE users
     SET ${setClause}, updated_at = NOW()
     WHERE username = $1
     RETURNING *`,
    values
  );

  return result.rows[0];
}

async function addScum(username, amount) {
  const result = await db.query(
    `UPDATE users
     SET scum = scum + $2, updated_at = NOW()
     WHERE username = $1
     RETURNING *`,
    [username.toLowerCase(), amount]
  );
  return result.rows[0];
}

async function removeScum(username, amount) {
  const result = await db.query(
    `UPDATE users
     SET scum = GREATEST(0, scum - $2), updated_at = NOW()
     WHERE username = $1
     RETURNING *`,
    [username.toLowerCase(), amount]
  );
  return result.rows[0];
}

// Gutter operations
async function joinGutter(username) {
  return await updateUserStats(username, {
    is_in_gutter: true,
    hp: 100,
    gutter_joined_at: new Date()
  });
}

async function leaveGutter(username) {
  return await updateUserStats(username, {
    is_in_gutter: false,
    mob_target: null,
    mob_kills: 0
  });
}

async function setMobTarget(username, mobLetter) {
  return await updateUserStats(username, {
    mob_target: mobLetter,
    mob_kills: 0
  });
}

// Bounty operations
async function placeBounty(targetUsername, amount, placedByUsername) {
  const result = await db.query(
    `INSERT INTO bounties (target_username, amount, placed_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [targetUsername.toLowerCase(), amount, placedByUsername.toLowerCase()]
  );
  return result.rows[0];
}

async function getBounties(targetUsername) {
  const result = await db.query(
    `SELECT SUM(amount) as total_bounty
     FROM bounties
     WHERE target_username = $1`,
    [targetUsername.toLowerCase()]
  );
  return result.rows[0]?.total_bounty || 0;
}

async function clearBounties(targetUsername) {
  await db.query(
    'DELETE FROM bounties WHERE target_username = $1',
    [targetUsername.toLowerCase()]
  );
}

// Get random mob
async function getRandomMob() {
  const result = await db.query(
    'SELECT * FROM mob_types ORDER BY RANDOM() LIMIT 1'
  );
  return result.rows[0];
}

// Get all users in gutter
async function getActivePlayers() {
  const result = await db.query(
    'SELECT * FROM users WHERE is_in_gutter = true'
  );
  return result.rows;
}

module.exports = {
  initDatabase,
  getUser,
  createUser,
  updateUserStats,
  addScum,
  removeScum,
  joinGutter,
  leaveGutter,
  setMobTarget,
  placeBounty,
  getBounties,
  clearBounties,
  getRandomMob,
  getActivePlayers
};
