const express = require("express");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  max: 10,              // connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.get("/", (req, res) => {
  res.status(200).send("API is running 🚀");
});

app.get("/users", async (req, res) => {
  let client;

  try {
    client = await pool.connect();

    const result = await client.query(
      "SELECT id, name FROM users ORDER BY id ASC"
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("Database Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database query failed",
      error: error.message,
    });

  } finally {
    if (client) client.release();
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});