// models/user.model.js
const { query } = require("../config/db.config");

// Helpers dựng sẵn câu lệnh
const USER_SELECT = `
  SELECT id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at, password_hash
  FROM "user"
`;

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
    INSERT INTO "user"(name, email, password_hash, is_active, role_id)
    VALUES ($1,$2,$3,true,$4)
    RETURNING id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at
  `;
    const { rows } = await query(sql, [name, email, passwordHash, roleId]);
    return rows[0];
}

async function updateLastLogin(userId) {
    const sql = `
    UPDATE bookstore."user"
    SET last_login_at = now(), updated_at = now()
    WHERE id = $1
    RETURNING id, email, name, avatar_url, is_active, last_login_at, role_id, created_at, updated_at
  `;
    const { rows } = await query(sql, [userId]);
    return rows[0];
}

/* Forgot/Reset Password tokens */
async function createResetToken({ userId, token, expiresAt }) {
    const sql = `
    INSERT INTO bookstore.password_reset_tokens(user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, token, expires_at, used_at, created_at
  `;
    const { rows } = await query(sql, [userId, token, expiresAt]);
    return rows[0];
}

async function findResetToken(token) {
    const sql = `
    SELECT id, user_id, token, expires_at, used_at, created_at
    FROM bookstore.password_reset_tokens
    WHERE token = $1
    LIMIT 1
  `;
    const { rows } = await query(sql, [token]);
    return rows[0] || null;
}

async function markResetTokenUsed(id) {
    const sql = `
    UPDATE bookstore.password_reset_tokens
    SET used_at = now()
    WHERE id = $1
  `;
    await query(sql, [id]);
}

async function updateUserPassword(userId, newPasswordHash) {
    const sql = `
    UPDATE bookstore."user"
    SET password_hash = $2, updated_at = now()
    WHERE id = $1
  `;
    await query(sql, [userId, newPasswordHash]);
}

module.exports = {
    findByEmail,
    findById,
    createUser,
    updateLastLogin,
    createResetToken,
    findResetToken,
    markResetTokenUsed,
    updateUserPassword,
};
