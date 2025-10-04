// backend/models/role.model.js
const { query } = require('../config/db.config');
const db = require('../config/db.config');

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
async function findAllRoles() {
  const sql = `SELECT id, role_name FROM role ORDER BY role_name ASC`;
  const { rows } = await db.query(sql);
  return rows;
}

async function countUsersByRole() {
  const sql = `
    SELECT r.id, r.role_name, COUNT(u.id)::int AS user_count
    FROM role r
    LEFT JOIN "user" u ON u.role_id = r.id
    GROUP BY r.id, r.role_name
    ORDER BY r.role_name ASC
  `;
  const { rows } = await db.query(sql);
  return rows;
}

module.exports = { findIdByName, findAllRoles, countUsersByRole };
