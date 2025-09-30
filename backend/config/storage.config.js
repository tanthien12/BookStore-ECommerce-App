// backend/config/storage.config.js
require('dotenv').config();

const mb = Number(process.env.MAX_UPLOAD_MB || 5);

module.exports = {
    driver: 'local',
    baseUrl: process.env.BASE_URL || 'http://localhost:4000',
    localDir: process.env.UPLOAD_LOCAL_DIR || 'uploads',
    limits: { fileSize: mb * 1024 * 1024 },
    allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    buckets: ['products', 'users', 'categories'],
};
