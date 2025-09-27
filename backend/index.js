// index.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { env } = require("./config");
const { pool } = require("./config/db.config");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// Health check
app.get("/health", async (req, res) => {
    const r = await pool.query("SELECT 1 as ok");
    res.json({ ok: r.rows[0].ok === 1 });
});

// Error handler - đặt cuối
app.use(errorHandler);

app.listen(env.PORT, () => {
    console.log(`Server listening on http://localhost:${env.PORT}`);
});
