const express = require("express");
const mysql   = require("mysql2/promise");
const cors    = require("cors");

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ── YOUR MySQL CREDENTIALS ──────────────────────
const DB_CONFIG = {
  host     : process.env.MYSQLHOST,
  user     : process.env.MYSQLUSER,
  password : process.env.MYSQLPASSWORD,
  database : process.env.MYSQLDATABASE,
  port     : process.env.MYSQLPORT
};
// ───────────────────────────────────────────────

// Auto-create table on first run
(async () => {
  try {
    const db = await mysql.createConnection(DB_CONFIG);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS health_entries (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        participant_id  VARCHAR(100),
        recorded_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

        -- Section 1: PSS
        pss_score       INT,

        -- Section 2: Sleep Behaviour
        sleep_bedtime   VARCHAR(50),
        sleep_onset     VARCHAR(50),
        phone_after_bed VARCHAR(50),
        notif_wake      VARCHAR(50),
        phone_freq_bed  VARCHAR(50),
        time_outside    VARCHAR(50),
        daily_travel    VARCHAR(50),
        organization    VARCHAR(50),
        motivation      VARCHAR(50),
        wake_time       VARCHAR(50),
        sleep_quality   VARCHAR(50)
      )
    `);
    console.log("✅ Database & table ready!");
    await db.end();
  } catch (err) {
    console.error("❌ DB Error:", err.message);
  }
})();

// ── SAVE a new entry ────────────────────────────
app.post("/api/entries", async (req, res) => {
  const {
    participant_id, pss_score,
    sleep_bedtime, sleep_onset, phone_after_bed,
    notif_wake, phone_freq_bed, time_outside,
    daily_travel, organization, motivation,
    wake_time, sleep_quality
  } = req.body;

  try {
    const db = await mysql.createConnection(DB_CONFIG);
    const [result] = await db.execute(
      `INSERT INTO health_entries
        (participant_id, pss_score,
         sleep_bedtime, sleep_onset, phone_after_bed,
         notif_wake, phone_freq_bed, time_outside,
         daily_travel, organization, motivation,
         wake_time, sleep_quality)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [participant_id, pss_score,
       sleep_bedtime, sleep_onset, phone_after_bed,
       notif_wake, phone_freq_bed, time_outside,
       daily_travel, organization, motivation,
       wake_time, sleep_quality]
    );
    await db.end();
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// ── GET all entries ─────────────────────────────
app.get("/api/entries", async (req, res) => {
  try {
    const db = await mysql.createConnection(DB_CONFIG);
    const [rows] = await db.execute(
      "SELECT * FROM health_entries ORDER BY recorded_at DESC"
    );
    await db.end();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE an entry ─────────────────────────────
app.delete("/api/entries/:id", async (req, res) => {
  try {
    const db = await mysql.createConnection(DB_CONFIG);
    await db.execute("DELETE FROM health_entries WHERE id = ?", [req.params.id]);
    await db.end();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
