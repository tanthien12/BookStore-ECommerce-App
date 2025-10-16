// backend/services/address.service.js
const { pool } = require('../config/db.config');

function validate(p) {
    if (!p.address_line1 || !p.city || !p.province) {
        const err = new Error('Thiếu địa chỉ / thành phố / tỉnh');
        err.status = 400; throw err;
    }
}

async function list(userId) {
    const sql = `SELECT * FROM address WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`;
    const r = await pool.query(sql, [userId]);
    return r.rows;
}

async function create(userId, p) {
    validate(p);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        if (p.is_default) {
            await client.query(`UPDATE address SET is_default = FALSE WHERE user_id = $1`, [userId]);
        }
        const sql = `
      INSERT INTO address (user_id, address_line1, address_line2, city, province, postal_code, phone, is_default)
      VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,false))
      RETURNING *;
    `;
        const v = [
            userId, p.address_line1 || '', p.address_line2 || null, p.city || '', p.province || '',
            p.postal_code || null, p.phone || null, !!p.is_default
        ];
        const r = await client.query(sql, v);
        await client.query('COMMIT');
        return r.rows[0];
    } catch (e) {
        await client.query('ROLLBACK'); throw e;
    } finally {
        client.release();
    }
}

async function update(userId, id, p) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        if (p.is_default) {
            await client.query(`UPDATE address SET is_default = FALSE WHERE user_id = $1`, [userId]);
        }
        const fields = [];
        const params = [];
        let i = 1;

        const set = (col, val) => { fields.push(`${col} = $${i++}`); params.push(val); };

        if (p.address_line1 != null) set('address_line1', p.address_line1);
        if (p.address_line2 != null) set('address_line2', p.address_line2);
        if (p.city != null) set('city', p.city);
        if (p.province != null) set('province', p.province);
        if (p.postal_code != null) set('postal_code', p.postal_code);
        if (p.phone != null) set('phone', p.phone);
        if (p.is_default != null) set('is_default', !!p.is_default);

        if (!fields.length) {
            const r0 = await client.query(`SELECT * FROM address WHERE id = $1 AND user_id = $2`, [id, userId]);
            await client.query('COMMIT');
            return r0.rows[0] || null;
        }

        const sql = `
      UPDATE address SET ${fields.join(', ')}, updated_at = now()
      WHERE id = $${i++} AND user_id = $${i++}
      RETURNING *;
    `;
        params.push(id, userId);
        const r = await client.query(sql, params);
        await client.query('COMMIT');
        return r.rows[0] || null;
    } catch (e) {
        await client.query('ROLLBACK'); throw e;
    } finally {
        client.release();
    }
}

async function remove(userId, id) {
    await pool.query(`DELETE FROM address WHERE id = $1 AND user_id = $2`, [id, userId]);
    return true;
}

module.exports = { list, create, update, remove };
