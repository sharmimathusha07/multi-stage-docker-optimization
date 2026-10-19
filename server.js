const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
  max: 10
});

app.use(express.json());

app.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");
    res.status(200).json({
      app: "Task 03 Node.js + PostgreSQL",
      status: "running",
      database: "connected",
      databaseTime: result.rows[0].database_time,
      endpoints: ["/", "/health", "/api/visits"]
    });
  } catch (error) {
    console.error("Database query failed:", error.message);
    res.status(503).json({ status: "database unavailable" });
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get("/api/visits", async (_req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const inserted = await pool.query(
      "INSERT INTO visits DEFAULT VALUES RETURNING id, created_at"
    );
    const count = await pool.query("SELECT COUNT(*)::int AS total FROM visits");
    res.status(200).json({
      message: "Visit recorded",
      visit: inserted.rows[0],
      totalVisits: count.rows[0].total
    });
  } catch (error) {
    console.error("Visit operation failed:", error.message);
    res.status(503).json({ status: "database unavailable" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Task 03 app listening on port ${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
