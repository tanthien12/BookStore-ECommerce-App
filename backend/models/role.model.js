// // backend/models/role.model.js
// const { query } = require('../config/db.config');
// const db = require('../config/db.config');

// async function findIdByName(name) {
//   const sql = `
//     SELECT id
//     FROM bookstore.role
//     WHERE lower(role_name) = lower($1)
//     LIMIT 1
//   `;
//   const { rows } = await query(sql, [name]);
//   return rows[0]?.id || null;
// }
// async function findAllRoles() {
//   const sql = `SELECT id, role_name FROM role ORDER BY role_name ASC`;
//   const { rows } = await db.query(sql);
//   return rows;
// }

// async function countUsersByRole() {
//   const sql = `
//     SELECT r.id, r.role_name, COUNT(u.id)::int AS user_count
//     FROM role r
//     LEFT JOIN "user" u ON u.role_id = r.id
//     GROUP BY r.id, r.role_name
//     ORDER BY r.role_name ASC
//   `;
//   const { rows } = await db.query(sql);
//   return rows;
// }

// module.exports = { findIdByName, findAllRoles, countUsersByRole };
// Code 2
// backend/models/role.model.js
const { query } = require('../config/db.config');

const SCHEMA = 'bookstore';                  // đổi nếu bạn dùng schema khác
const TBL_ROLE = `${SCHEMA}.role`;
const TBL_USER = `${SCHEMA}."user"`;        // "user" là keyword -> cần quote

async function findIdByName(name) {
  const sql = `
    SELECT id
    FROM ${TBL_ROLE}
    WHERE lower(role_name) = lower($1)
    LIMIT 1
  `;
  const { rows } = await query(sql, [name]);
  return rows[0]?.id || null;
}

async function findById(id) {
  const sql = `
    SELECT id,
           role_name,
           lower(role_name) AS role_slug   -- alias, không cần cột
    FROM ${TBL_ROLE}
    WHERE id = $1
    LIMIT 1
  `;
  const { rows } = await query(sql, [id]);
  return rows[0] || null;
}

async function findAllRoles() {
  const sql = `
    SELECT id,
           role_name,
           lower(role_name) AS role_slug   -- alias, không cần cột
    FROM ${TBL_ROLE}
    ORDER BY role_name ASC
  `;
  const { rows } = await query(sql);
  return rows;
}

async function countUsersByRole() {
  const sql = `
    SELECT r.id,
           r.role_name,
           lower(r.role_name) AS role_slug,     -- alias cho FE
           COUNT(u.id)::int AS user_count
    FROM ${TBL_ROLE} r
    LEFT JOIN ${TBL_USER} u ON u.role_id = r.id
    GROUP BY r.id, r.role_name                  -- group theo cột gốc
    ORDER BY r.role_name ASC
  `;
  const { rows } = await query(sql);
  return rows;
}

async function getAdmins() {
  const sql = `
    SELECT u.id, u.name, u.email
    FROM ${TBL_USER} u
    JOIN ${TBL_ROLE} r ON u.role_id = r.id
    WHERE lower(r.role_name) = 'admin';
  `;
  const { rows } = await query(sql);
  return rows;
}

module.exports = { findIdByName, findById, findAllRoles, countUsersByRole, getAdmins };
