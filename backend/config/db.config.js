// // src/config/data.js
// const { Pool } = require("pg");

// const connectDB = async () => {
//     try {
//         const pool = new Pool({
//             host: process.env.PGHOST || "localhost",
//             port: parseInt(process.env.PGPORT || "5433", 10),
//             database: process.env.PGDATABASE,
//             user: process.env.PGUSER,
//             password: process.env.PGPASSWORD,
//             ssl:
//                 process.env.PGSSLMODE === "require"
//                     ? { rejectUnauthorized: false }
//                     : false,
//         });

//         // test kết nối
//         const client = await pool.connect();
//         console.log(
//             `PostgreSQL Connected: ${client.host}:${client.port}/${client.database}`
//         );
//         client.release();

//         return pool;
//     } catch (error) {
//         console.error(`PostgreSQL Connection Error: ${error.message}`);
//         process.exit(1); // Dừng server nếu kết nối thất bại
//     }
// };

// module.exports = connectDB;
// config/db.config.js
// config/db.js
const { Pool } = require("pg");
const { env } = require("./index");

const pool = new Pool({
    host: env.PGHOST,
    port: env.PGPORT,
    database: env.PGDATABASE,
    user: env.PGUSER,
    password: env.PGPASSWORD,
    ssl: env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
    // Tùy chọn: ép search_path bằng options (cách 2)
    // options: '-c search_path=bookstore,public'
});

// Đảm bảo mỗi phiên có search_path đúng
pool.on("connect", (client) => {
    client.query('SET search_path TO bookstore, public').catch(console.error);
    console.log("[DB] Connected to PostgreSQL");
});

pool.on("error", (err) => console.error("[DB] Error", err));

const query = (text, params) => pool.query(text, params);
module.exports = { pool, query };
