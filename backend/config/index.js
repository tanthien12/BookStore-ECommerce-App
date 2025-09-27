// config/index.js
require("dotenv").config();

const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "4000", 10),

    PGHOST: process.env.PGHOST,
    PGPORT: parseInt(process.env.PGPORT || "5432", 10),
    PGDATABASE: process.env.PGDATABASE,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGSSLMODE: process.env.PGSSLMODE || "disable",

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",

    APP_URL: process.env.APP_URL || "http://localhost:5173",
};

module.exports = { env };
