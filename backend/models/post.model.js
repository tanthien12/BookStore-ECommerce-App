const { pool } = require("../config/db.config");

const TBL_POSTS = 'bookstore.posts';
const TBL_CATS = 'bookstore.blog_categories';
const TBL_USER = 'bookstore."user"';

const PostModel = {
    // --- CATEGORY ---
    async getAllCategories() {
        const { rows } = await pool.query(`SELECT * FROM ${TBL_CATS} ORDER BY name ASC`);
        return rows;
    },

    // --- POSTS ---
    async create(data) {
        const sql = `
            INSERT INTO ${TBL_POSTS} (title, slug, description, content, thumbnail, blog_category_id, status, author_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [data.title, data.slug, data.description, data.content, data.thumbnail, data.blog_category_id, data.status, data.author_id];
        const { rows } = await pool.query(sql, values);
        return rows[0];
    },

    async update(id, data) {
        const sql = `
            UPDATE ${TBL_POSTS}
            SET title = COALESCE($2, title),
                slug = COALESCE($3, slug),
                description = COALESCE($4, description),
                content = COALESCE($5, content),
                thumbnail = COALESCE($6, thumbnail),
                blog_category_id = COALESCE($7, blog_category_id),
                status = COALESCE($8, status),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const values = [id, data.title, data.slug, data.description, data.content, data.thumbnail, data.blog_category_id, data.status];
        const { rows } = await pool.query(sql, values);
        return rows[0];
    },

    async remove(id) {
        const { rowCount } = await pool.query(`DELETE FROM ${TBL_POSTS} WHERE id = $1`, [id]);
        return rowCount > 0;
    },

    // Lấy chi tiết (kèm tên tác giả và tên danh mục)
    async findBySlugOrId(slugOrId) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
        const whereClause = isUUID ? 'p.id = $1' : 'p.slug = $1';
        
        const sql = `
            SELECT p.*, 
                   u.name as author_name, u.avatar_url as author_avatar,
                   c.name as category_name, c.slug as category_slug
            FROM ${TBL_POSTS} p
            LEFT JOIN ${TBL_USER} u ON p.author_id = u.id
            LEFT JOIN ${TBL_CATS} c ON p.blog_category_id = c.id
            WHERE ${whereClause}
        `;
        const { rows } = await pool.query(sql, [slugOrId]);
        return rows[0];
    },

    async list({ page = 1, limit = 10, status, category_id, q }) {
        const offset = (page - 1) * limit;
        const params = [];
        let i = 1;
        let where = [];

        if (status) { where.push(`p.status = $${i++}`); params.push(status); }
        if (category_id) { where.push(`p.blog_category_id = $${i++}`); params.push(category_id); }
        if (q) { where.push(`(p.title ILIKE $${i} OR p.description ILIKE $${i})`); params.push(`%${q}%`); i++; }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

        const sql = `
            SELECT p.id, p.title, p.slug, p.description, p.thumbnail, p.status, p.views, p.created_at,
                   u.name as author_name,
                   c.name as category_name
            FROM ${TBL_POSTS} p
            LEFT JOIN ${TBL_USER} u ON p.author_id = u.id
            LEFT JOIN ${TBL_CATS} c ON p.blog_category_id = c.id
            ${whereSql}
            ORDER BY p.created_at DESC
            LIMIT $${i++} OFFSET $${i++}
        `;
        
        const countSql = `SELECT COUNT(*)::int as total FROM ${TBL_POSTS} p ${whereSql}`;

        const [listRes, countRes] = await Promise.all([
            pool.query(sql, [...params, limit, offset]),
            pool.query(countSql, params)
        ]);

        return { items: listRes.rows, total: countRes.rows[0].total };
    },
    
    async incrementView(id) {
        await pool.query(`UPDATE ${TBL_POSTS} SET views = views + 1 WHERE id = $1`, [id]);
    }
};

module.exports = PostModel;