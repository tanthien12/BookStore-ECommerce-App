// backend/middlewares/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cfg = require('../config/storage.config');

const ALLOWED_MIME = cfg.allowedMime;

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Tạo uploader cho 1 bucket (subfolder dưới /uploads)
 * - bucket phải nằm trong cfg.buckets
 * - field single: 'file', multiple: 'files'
 */
function makeUploader(bucket) {
    if (!cfg.buckets.includes(bucket)) {
        throw new Error(`Bucket không hợp lệ: ${bucket}`);
    }
    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => {
            const dir = path.join(process.cwd(), cfg.localDir, bucket);
            ensureDir(dir);
            cb(null, dir);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            cb(null, name);
        },
    });

    const fileFilter = (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
            return cb(Object.assign(new Error('Chỉ cho phép ảnh (jpg, png, webp, gif)'), { code: 'UNSUPPORTED_MIME' }));
        }
        cb(null, true);
    };

    return multer({ storage, fileFilter, limits: cfg.limits });
}

module.exports = {
    makeUploader,
};
