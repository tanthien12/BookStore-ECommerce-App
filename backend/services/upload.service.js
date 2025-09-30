// backend/services/upload.service.js
const path = require('path');
const fs = require('fs');
const cfg = require('../config/storage.config');

function buildLocalUrl(bucket, fileName) {
    return `${cfg.baseUrl}/${cfg.localDir}/${bucket}/${fileName}`;
}

function removeLocal(bucket, fileName) {
    const full = path.join(process.cwd(), cfg.localDir, bucket, fileName);
    if (fs.existsSync(full)) fs.unlinkSync(full);
}

module.exports = {
    // single
    async uploadOne(bucket, file) {
        if (!file) throw Object.assign(new Error('Không nhận được file'), { code: 'UPLOAD_NO_FILE' });
        // (tuỳ chọn) xử lý sharp ở đây
        return {
            bucket,
            url: buildLocalUrl(bucket, file.filename),
            fileName: file.filename,
            size: file.size,
            mime: file.mimetype,
        };
    },

    // multiple
    async uploadMany(bucket, files) {
        if (!files?.length) throw Object.assign(new Error('Không nhận được files'), { code: 'UPLOAD_NO_FILE' });
        return files.map(f => ({
            bucket,
            url: buildLocalUrl(bucket, f.filename),
            fileName: f.filename,
            size: f.size,
            mime: f.mimetype,
        }));
    },

    // delete
    async removeOne({ bucket, fileName }) {
        if (!bucket || !fileName) {
            throw Object.assign(new Error('Thiếu bucket hoặc fileName'), { code: 'UPLOAD_BAD_REQUEST' });
        }
        removeLocal(bucket, fileName);
        return true;
    },
};
