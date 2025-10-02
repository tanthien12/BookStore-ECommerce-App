const service = require('../services/upload.service');

exports.uploadSingle = (bucket) => async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: true, message: "Thiếu file upload" });
        }
        const fileInfo = await service.uploadOne(bucket, req.file);
        return res.status(201).json({ success: true, data: fileInfo }); // ✅ đồng bộ: data
    } catch (e) { next(e); }
};

exports.uploadMultiple = (bucket) => async (req, res, next) => {
    try {
        if (!req.files?.length) {
            return res.status(400).json({ success: false, error: true, message: "Thiếu danh sách file upload" });
        }
        const data = await service.uploadMany(bucket, req.files);
        return res.status(201).json({ success: true, data }); // ✅ dùng data thay vì items
    } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
    try {
        const { bucket, fileName } = req.body || {};
        if (!bucket || !fileName) {
            return res.status(400).json({ success: false, error: true, message: "Cần { bucket, fileName }" });
        }
        await service.removeOne({ bucket, fileName });
        res.json({ success: true, removed: true });
    } catch (e) { next(e); }
};
