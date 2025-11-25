// backend/controllers/address.controller.js
const addressService = require('../services/address.service');
// const vnData = require("../data/vn-address.json");

// Lấy danh sách tỉnh/thành
exports.provinces = async (req, res, next) => {
  try {
    const provinces = vnData.map((p) => ({
      code: p.code,
      name: p.name,
    }));
    res.json({ success: true, data: provinces });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách quận/huyện theo tỉnh
exports.districts = async (req, res, next) => {
  try {
    const { provinceCode } = req.query;
    const province = vnData.find((p) => p.code === provinceCode);

    if (!province) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tỉnh/thành." });
    }

    const districts = province.districts.map((d) => ({
      code: d.code,
      name: d.name,
    }));

    res.json({ success: true, data: districts });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách phường/xã theo quận/huyện
exports.wards = async (req, res, next) => {
  try {
    const { provinceCode, districtCode } = req.query;
    const province = vnData.find((p) => p.code === provinceCode);
    const district = province?.districts.find((d) => d.code === districtCode);

    if (!province || !district) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy quận/huyện." });
    }

    const wards = district.wards.map((w) => ({
      code: w.code,
      name: w.name,
    }));

    res.json({ success: true, data: wards });
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const items = await addressService.list(userId);
        res.json({ success: true, items });
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const payload = req.body || {};
        const item = await addressService.create(userId, payload);
        res.status(201).json({ success: true, item });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        const payload = req.body || {};
        const item = await addressService.update(userId, id, payload);
        res.json({ success: true, item });
    } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        await addressService.remove(userId, id);
        res.json({ success: true });
    } catch (e) { next(e); }
};
