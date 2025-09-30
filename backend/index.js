// index.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { env } = require("./config");
const { pool } = require("./config/db.config");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");
const cfg = require("./config/storage.config");
const path = require("path");

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// Serve static: http://localhost:4000/uploads/<bucket>/<fileName>
app.use(`/${cfg.localDir}`, express.static(path.join(process.cwd(), cfg.localDir)));

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
