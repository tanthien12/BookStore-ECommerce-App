// backend/models/category.model.js
const pool = require("../config/db.config");

// Helper: map row -> DTO
function mapRow(r) {
    return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        image_url: r.image_url,
        created_at: r.created_at,
        updated_at: r.updated_at,
    };
}

const CategoryModel = {
    async create(data, { client } = {}) {
        const q = `
      INSERT INTO category (name, slug, description, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
        const params = [
            data.name,
            data.slug,
            data.description ?? null,
            data.image_url ?? null,
        ];
        const db = client || pool;
        const { rows } = await db.query(q, params);
        return mapRow(rows[0]);
    },

    async update(id, data, { client } = {}) {
        // chỉ update field được gửi lên
        const fields = [];
        const params = [];
        let idx = 1;

        for (const [k, v] of Object.entries({
            name: data.name,
            slug: data.slug,
            description: data.description ?? null,
            image_url: data.image_url ?? null,
        })) {
            if (typeof v !== "undefined") {
                fields.push(`${k}=$${idx++}`);
                params.push(v);
            }
        }
        if (!fields.length) return await this.findById(id, { client });

        params.push(id);
        const q = `UPDATE category SET ${fields.join(", ")}, updated_at=NOW() WHERE id=$${idx} RETURNING *`;
        const db = client || pool;
        const { rows } = await db.query(q, params);
        return rows[0] ? mapRow(rows[0]) : null;
    },

    async remove(id, { client } = {}) {
        const db = client || pool;
        const { rowCount } = await db.query("DELETE FROM category WHERE id=$1", [id]);
        return rowCount > 0;
    },

    async findById(id, { client } = {}) {
        const db = client || pool;
        const { rows } = await db.query("SELECT * FROM category WHERE id=$1", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    },

    async list(params = {}) {
        const {
            q, page = 1, limit = 20, sort = "newest",
        } = params;

        const sorts = {
            newest: "created_at DESC",
            name_asc: "name ASC",
            name_desc: "name DESC",
        };
        const orderBy = sorts[sort] || sorts.newest;

        const where = [];
        const args = [];
        let i = 1;

        if (q) {
            where.push(`(LOWER(name) LIKE $${i} OR LOWER(slug) LIKE $${i})`);
            args.push(`%${q.toLowerCase()}%`);
            i++;
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const offset = (page - 1) * limit;

        const sql = `
      SELECT * FROM category
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}`;
        const countSql = `SELECT COUNT(*)::int AS cnt FROM category ${whereSql}`;

        const db = pool;
        const [{ rows }, countRes] = await Promise.all([
            db.query(sql, args),
            db.query(countSql, args),
        ]);

        return {
            items: rows.map(mapRow),
            total: countRes.rows[0].cnt,
            page,
            limit,
        };
    },
};

module.exports = CategoryModel;
