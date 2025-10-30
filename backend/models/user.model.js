// // backend/models/user.model.js
// const { query } = require("../config/db.config");

// /* ==========================
//  * PHẦN CŨ: GIỮ NGUYÊN
//  * ========================== */
// // Helpers dựng sẵn câu lệnh
// const USER_SELECT = `
//   SELECT id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at, password_hash
//   FROM "user"
// `;

// async function findByEmail(email) {
//   const sql = `${USER_SELECT} WHERE email = $1 LIMIT 1`;
//   const { rows } = await query(sql, [email]);
//   return rows[0] || null;
// }

// async function findById(id) {
//   const sql = `${USER_SELECT} WHERE id = $1 LIMIT 1`;
//   const { rows } = await query(sql, [id]);
//   return rows[0] || null;
// }

// async function createUser({ name, email, passwordHash, roleId }) {
//   const sql = `
//     INSERT INTO "user"(name, email, password_hash, is_active, role_id)
//     VALUES ($1,$2,$3,true,$4)
//     RETURNING id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at
//   `;
//   const { rows } = await query(sql, [name, email, passwordHash, roleId]);
//   return rows[0];
// }

// async function updateLastLogin(userId) {
//   const sql = `
//     UPDATE bookstore."user"
//     SET last_login_at = now(), updated_at = now()
//     WHERE id = $1
//     RETURNING id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at
//   `;
//   const { rows } = await query(sql, [userId]);
//   return rows[0];
// }

// /* Forgot/Reset Password tokens */
// async function createResetToken({ userId, token, expiresAt }) {
//   const sql = `
//     INSERT INTO bookstore.password_reset_tokens(user_id, token, expires_at)
//     VALUES ($1, $2, $3)
//     RETURNING id, user_id, token, expires_at, used_at, created_at
//   `;
//   const { rows } = await query(sql, [userId, token, expiresAt]);
//   return rows[0];
// }

// async function findResetToken(token) {
//   const sql = `
//     SELECT id, user_id, token, expires_at, used_at, created_at
//     FROM bookstore.password_reset_tokens
//     WHERE token = $1
//     LIMIT 1
//   `;
//   const { rows } = await query(sql, [token]);
//   return rows[0] || null;
// }

// async function markResetTokenUsed(id) {
//   const sql = `
//     UPDATE bookstore.password_reset_tokens
//     SET used_at = now()
//     WHERE id = $1
//   `;
//   await query(sql, [id]);
// }

// async function updateUserPassword(userId, newPasswordHash) {
//   const sql = `
//     UPDATE bookstore."user"
//     SET password_hash = $2, updated_at = now()
//     WHERE id = $1
//   `;
//   await query(sql, [userId, newPasswordHash]);
// }

// // Role select



// /* ==========================
//  * PHẦN MỚI CHO ADMIN (KHÔNG ĐỤNG HÀM CŨ)
//  * ========================== */

// const ADMIN_USER_SELECT = `
//   SELECT
//     u.id, u.email, u.name, u.avatar_url, u.is_active, u.last_login_at,
//     u.role_id, r.role_name, u.created_at, u.updated_at
//   FROM "user" u
//   LEFT JOIN role r ON r.id = u.role_id
// `;

// const ORDER_BY = {
//   newest: 'u.created_at DESC',
//   name: 'u.name ASC',
//   last_login: 'u.last_login_at DESC NULLS LAST',
// };

// function buildAdminFilter({ q, role_id, is_active, created_from, created_to }) {
//   const clauses = [];
//   const params = [];
//   let i = 1;

//   if (q) {
//     clauses.push(`(u.name ILIKE $${i} OR u.email ILIKE $${i})`);
//     params.push(`%${q}%`);
//     i++;
//   }
//   if (role_id) {
//     clauses.push(`u.role_id = $${i}`); params.push(role_id); i++;
//   }
//   if (typeof is_active !== 'undefined' && is_active !== null && is_active !== '') {
//     clauses.push(`u.is_active = $${i}`);
//     params.push(is_active === true || is_active === 'true');
//     i++;
//   }
//   if (created_from) {
//     clauses.push(`u.created_at >= $${i}`); params.push(created_from); i++;
//   }
//   if (created_to) {
//     clauses.push(`u.created_at < ($${i}::timestamptz + interval '1 day')`); params.push(created_to); i++;
//   }

//   const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
//   return { where, params };
// }

// async function adminFindMany({ page = 1, limit = 10, sort = 'newest', q, role_id, is_active, created_from, created_to }) {
//   const offset = (Math.max(+page, 1) - 1) * Math.max(+limit, 1);
//   const { where, params } = buildAdminFilter({ q, role_id, is_active, created_from, created_to });
//   const orderBy = ORDER_BY[sort] || ORDER_BY.newest;

//   const sql = `
//     ${ADMIN_USER_SELECT}
//     ${where}
//     ORDER BY ${orderBy}
//     LIMIT $${params.length + 1} OFFSET $${params.length + 2}
//   `;
//   const { rows } = await query(sql, [...params, limit, offset]);
//   return rows;
// }

// async function adminCountMany(filters) {
//   const { where, params } = buildAdminFilter(filters || {});
//   const sql = `SELECT COUNT(*)::int AS count FROM "user" u ${where}`;
//   const { rows } = await query(sql, params);
//   return rows[0]?.count || 0;
// }

// async function adminFindByIdWithRole(id) {
//   const sql = `${ADMIN_USER_SELECT} WHERE u.id = $1`;
//   const { rows } = await query(sql, [id]);
//   return rows[0] || null;
// }

// async function adminUpdateUser(id, { name, email, role_id, is_active, avatar_url }) {
//   const sets = [];
//   const params = [];
//   let i = 1;

//   if (typeof name !== 'undefined') { sets.push(`name = $${i++}`); params.push(name); }
//   if (typeof email !== 'undefined') { sets.push(`email = $${i++}`); params.push(email); }
//   if (typeof role_id !== 'undefined') { sets.push(`role_id = $${i++}`); params.push(role_id); }
//   if (typeof is_active !== 'undefined') { sets.push(`is_active = $${i++}`); params.push(!!is_active); }
//   if (typeof avatar_url !== 'undefined') { sets.push(`avatar_url = $${i++}`); params.push(avatar_url); }

//   if (!sets.length) {
//     // Không có gì để update -> trả về detail với role
//     return adminFindByIdWithRole(id);
//   }

//   sets.push(`updated_at = now()`);

//   const sql = `
//     UPDATE "user" SET ${sets.join(', ')}
//     WHERE id = $${i}
//     RETURNING id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at
//   `;
//   const { rows } = await query(sql, [...params, id]);
//   if (!rows[0]) return null;
//   // gắn role_name
//   const detail = await adminFindByIdWithRole(rows[0].id);
//   return detail;
// }

// async function adminBulkSetActive(ids = [], active) {
//   if (!ids?.length) return 0;
//   const sql = `
//     UPDATE "user"
//     SET is_active = $1, updated_at = now()
//     WHERE id = ANY($2::uuid[])
//   `;
//   const { rowCount } = await query(sql, [!!active, ids]);
//   return rowCount;
// }

// async function adminBulkAssignRole(ids = [], role_id) {
//   if (!ids?.length) return 0;
//   const sql = `
//     UPDATE "user"
//     SET role_id = $1, updated_at = now()
//     WHERE id = ANY($2::uuid[])
//   `;
//   const { rowCount } = await query(sql, [role_id, ids]);
//   return rowCount;
// }

// async function listAddresses(user_id) {
//   const sql = `
//     SELECT id, user_id, address_line1, address_line2, city, province,
//            postal_code, phone, is_default, created_at, updated_at
//     FROM address
//     WHERE user_id = $1
//     ORDER BY is_default DESC, created_at DESC
//   `;
//   const { rows } = await query(sql, [user_id]);
//   return rows;
// }

// /* ==========================
//  * EXPORT: GIỮ + BỔ SUNG
//  * ========================== */
// module.exports = {
//   // Giữ các hàm cũ
//   findByEmail,
//   findById,
//   createUser,
//   updateLastLogin,
//   createResetToken,
//   findResetToken,
//   markResetTokenUsed,
//   updateUserPassword,

//   // Bổ sung hàm admin (không đụng tên cũ)
//   adminFindMany,
//   adminCountMany,
//   adminFindByIdWithRole,
//   adminUpdateUser,
//   adminBulkSetActive,
//   adminBulkAssignRole,
//   listAddresses,
// };

//Code 2
// backend/models/user.model.js
const { query } = require("../config/db.config");

/** =========================
 *  SCHEMA & TABLE NAMES
 * ========================= */
const SCHEMA = "bookstore"; // đổi nếu bạn dùng schema khác
const TBL_USER = `${SCHEMA}."user"`; // "user" là keyword -> cần quote
const TBL_ROLE = `${SCHEMA}.role`;
const TBL_ADDRESS = `${SCHEMA}.address`;
const TBL_PWRESET = `${SCHEMA}.password_reset_tokens`;

/** =========================
 *  BASE SELECTS
 * ========================= */
const USER_SELECT = `
  SELECT
    id, email, name, avatar_url, is_active, last_login_at,
    role_id, created_at, updated_at, password_hash
  FROM ${TBL_USER}
`;

// Dùng cho đăng nhập (cần password_hash) + alias role_slug từ role_name
const USER_WITH_ROLE_SELECT = `
  SELECT
    u.id, u.email, u.name, u.avatar_url, u.is_active, u.last_login_at,
    u.role_id, u.created_at, u.updated_at, u.password_hash,
    r.role_name,
    lower(r.role_name) AS role_slug
  FROM ${TBL_USER} u
  LEFT JOIN ${TBL_ROLE} r ON r.id = u.role_id
`;

// Dùng cho trang Admin (không trả password_hash)
const ADMIN_USER_SELECT = `
  SELECT
    u.id, u.email, u.name, u.avatar_url, u.is_active, u.last_login_at,
    u.role_id, u.created_at, u.updated_at,
    r.role_name,
    lower(r.role_name) AS role_slug
  FROM ${TBL_USER} u
  LEFT JOIN ${TBL_ROLE} r ON r.id = u.role_id
`;

/** =========================
 *  HÀM CƠ BẢN (GIỮ API CŨ)
 * ========================= */
async function findByEmail(email) {
  const sql = `${USER_SELECT} WHERE email = $1 LIMIT 1`;
  const { rows } = await query(sql, [email]);
  return rows[0] || null;
}

async function findById(id) {
  const sql = `${USER_SELECT} WHERE id = $1 LIMIT 1`;
  const { rows } = await query(sql, [id]);
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, roleId }) {
  const sql = `
    INSERT INTO ${TBL_USER}(name, email, password_hash, is_active, role_id)
    VALUES ($1, $2, $3, true, $4)
    RETURNING id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at
  `;
  const { rows } = await query(sql, [name, email, passwordHash, roleId]);
  return rows[0];
}

async function updateLastLogin(userId) {
  const sql = `
    UPDATE ${TBL_USER}
    SET last_login_at = now(), updated_at = now()
    WHERE id = $1
    RETURNING id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at
  `;
  const { rows } = await query(sql, [userId]);
  return rows[0];
}

/** =========================
 *  FORGOT / RESET PASSWORD
 * ========================= */
async function createResetToken({ userId, token, expiresAt }) {
  const sql = `
    INSERT INTO ${TBL_PWRESET}(user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, token, expires_at, used_at, created_at
  `;
  const { rows } = await query(sql, [userId, token, expiresAt]);
  return rows[0];
}

async function findResetToken(token) {
  const sql = `
    SELECT id, user_id, token, expires_at, used_at, created_at
    FROM ${TBL_PWRESET}
    WHERE token = $1
    LIMIT 1
  `;
  const { rows } = await query(sql, [token]);
  return rows[0] || null;
}

async function markResetTokenUsed(id) {
  const sql = `
    UPDATE ${TBL_PWRESET}
    SET used_at = now()
    WHERE id = $1
  `;
  await query(sql, [id]);
}

async function updateUserPassword(userId, newPasswordHash) {
  const sql = `
    UPDATE ${TBL_USER}
    SET password_hash = $2, updated_at = now()
    WHERE id = $1
  `;
  await query(sql, [userId, newPasswordHash]);
}

/** =========================
 *  HÀM “KÈM ROLE” (MỚI)
 *  -> Không cần cột role_slug trong DB
 * ========================= */
async function findByEmailWithRole(email) {
  const sql = `${USER_WITH_ROLE_SELECT} WHERE lower(u.email) = lower($1) LIMIT 1`;
  const { rows } = await query(sql, [email]);
  return rows[0] || null;
}

async function findByIdWithRole(id) {
  const sql = `${USER_WITH_ROLE_SELECT} WHERE u.id = $1 LIMIT 1`;
  const { rows } = await query(sql, [id]);
  return rows[0] || null;
}

/** =========================
 *  ADMIN LIST/FILTER/PAGING
 * ========================= */
const ORDER_BY = {
  newest: "u.created_at DESC",
  name: "u.name ASC",
  last_login: "u.last_login_at DESC NULLS LAST",
};

function buildAdminFilter({ q, role_id, is_active, created_from, created_to }) {
  const clauses = [];
  const params = [];
  let i = 1;

  if (q) {
    clauses.push(`(u.name ILIKE $${i} OR u.email ILIKE $${i})`);
    params.push(`%${q}%`);
    i++;
  }
  if (role_id) {
    clauses.push(`u.role_id = $${i}`);
    params.push(role_id);
    i++;
  }
  if (typeof is_active !== "undefined" && is_active !== null && is_active !== "") {
    clauses.push(`u.is_active = $${i}`);
    params.push(is_active === true || is_active === "true");
    i++;
  }
  if (created_from) {
    clauses.push(`u.created_at >= $${i}`);
    params.push(created_from);
    i++;
  }
  if (created_to) {
    clauses.push(`u.created_at < ($${i}::timestamptz + interval '1 day')`);
    params.push(created_to);
    i++;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
}

async function adminFindMany({
  page = 1,
  limit = 10,
  sort = "newest",
  q,
  role_id,
  is_active,
  created_from,
  created_to,
}) {
  const offset = (Math.max(+page, 1) - 1) * Math.max(+limit, 1);
  const { where, params } = buildAdminFilter({ q, role_id, is_active, created_from, created_to });
  const orderBy = ORDER_BY[sort] || ORDER_BY.newest;

  const sql = `
    ${ADMIN_USER_SELECT}
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const { rows } = await query(sql, [...params, limit, offset]);
  return rows;
}

async function adminCountMany(filters) {
  const { where, params } = buildAdminFilter(filters || {});
  const sql = `SELECT COUNT(*)::int AS count FROM ${TBL_USER} u ${where}`;
  const { rows } = await query(sql, params);
  return rows[0]?.count || 0;
}

async function adminFindByIdWithRole(id) {
  const sql = `${ADMIN_USER_SELECT} WHERE u.id = $1`;
  const { rows } = await query(sql, [id]);
  return rows[0] || null;
}

async function adminUpdateUser(id, { name, email, role_id, is_active, avatar_url }) {
  const sets = [];
  const params = [];
  let i = 1;

  if (typeof name !== "undefined") { sets.push(`name = $${i++}`); params.push(name); }
  if (typeof email !== "undefined") { sets.push(`email = $${i++}`); params.push(email); }
  if (typeof role_id !== "undefined") { sets.push(`role_id = $${i++}`); params.push(role_id); }
  if (typeof is_active !== "undefined") { sets.push(`is_active = $${i++}`); params.push(!!is_active); }
  if (typeof avatar_url !== "undefined") { sets.push(`avatar_url = $${i++}`); params.push(avatar_url); }

  if (!sets.length) {
    // Không có gì để update -> trả lại detail với role
    return adminFindByIdWithRole(id);
  }

  sets.push(`updated_at = now()`);

  const sql = `
    UPDATE ${TBL_USER}
    SET ${sets.join(", ")}
    WHERE id = $${i}
    RETURNING id
  `;
  const { rows } = await query(sql, [...params, id]);
  if (!rows[0]) return null;

  return adminFindByIdWithRole(rows[0].id);
}

async function adminBulkSetActive(ids = [], active) {
  if (!ids?.length) return 0;
  const sql = `
    UPDATE ${TBL_USER}
    SET is_active = $1, updated_at = now()
    WHERE id = ANY($2::uuid[])
  `;
  const { rowCount } = await query(sql, [!!active, ids]);
  return rowCount;
}

async function adminBulkAssignRole(ids = [], role_id) {
  if (!ids?.length) return 0;
  const sql = `
    UPDATE ${TBL_USER}
    SET role_id = $1, updated_at = now()
    WHERE id = ANY($2::uuid[])
  `;
  const { rowCount } = await query(sql, [role_id, ids]);
  return rowCount;
}

/** =========================
 *  ADDRESSES (giữ API cũ)
 * ========================= */
async function listAddresses(user_id) {
  const sql = `
    SELECT id, user_id, address_line1, address_line2, city, province,
           postal_code, phone, is_default, created_at, updated_at
    FROM ${TBL_ADDRESS}
    WHERE user_id = $1
    ORDER BY is_default DESC, created_at DESC
  `;
  const { rows } = await query(sql, [user_id]);
  return rows;
}

async function findByGoogleId(googleId) {
  const sql = `${USER_SELECT} WHERE google_id = $1 LIMIT 1`;
  const { rows } = await query(sql, [googleId]);
  return rows[0] || null;
}

async function createByGoogle({ name, email, google_id, avatar_url, role_id }) {
  const sql = `
    INSERT INTO ${TBL_USER}(name, email, provider, google_id, avatar_url, is_active, role_id)
    VALUES ($1, $2, 'google', $3, $4, true, $5)
    RETURNING id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at
  `;
  const { rows } = await query(sql, [name, email, google_id, avatar_url, role_id]);
  return rows[0];
}

async function updateAvatar(userId, avatarUrl) {
  const sql = `
    UPDATE ${TBL_USER}
    SET avatar_url = $2, updated_at = now()
    WHERE id = $1
  `;
  await query(sql, [userId, avatarUrl]);
}

/** =========================
 *  EXPORT
 * ========================= */
module.exports = {
  // Hàm cũ (giữ nguyên API)
  findByEmail,
  findById,
  createUser,
  updateLastLogin,
  createResetToken,
  findResetToken,
  markResetTokenUsed,
  updateUserPassword,

  // Hàm mới kèm role
  findByEmailWithRole,
  findByIdWithRole,

  // Admin helpers
  adminFindMany,
  adminCountMany,
  adminFindByIdWithRole,
  adminUpdateUser,
  adminBulkSetActive,
  adminBulkAssignRole,

  // Addresses
  listAddresses,

  // ===== BỔ SUNG GOOGLE =====
  findByGoogleId,
  createByGoogle,
  updateAvatar,
};

