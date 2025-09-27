// models/role.model.js
const { query } = require("../config/db.config");

async function findIdByName(name) {
    const sql = `
    SELECT id
    FROM bookstore.role
    WHERE lower(role_name) = lower($1)
    LIMIT 1
  `;
    const { rows } = await query(sql, [name]);
    return rows[0]?.id || null;
}

module.exports = { findIdByName };
