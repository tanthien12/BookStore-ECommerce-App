// // backend/controllers/me.controller.js
// const { z } = require("zod");
// const UserService = require("../services/user.service");

// // Cho phép update nhẹ: name/phone/avatar_url
// const UpdateMeSchema = z.object({
//     name: z.string().min(1, "Tên không được để trống").optional(),
//     phone: z.string().optional(),
//     avatar_url: z.string().url("avatar_url không hợp lệ").optional(),
// });

// async function getMe(req, res, next) {
//     try {
//         // authGuard đã gắn req.user = { id, email }
//         const me = await UserService.findById(req.user.id);
//         if (!me) {
//             return res.status(404).json({ message: "User not found", error: true, success: false });
//         }
//         // không trả password_hash
//         delete me.password_hash;
//         res.json({
//             message: "Lấy thông tin tài khoản thành công",
//             data: me,
//             error: false,
//             success: true,
//         });
//     } catch (err) { next(err); }
// }

// async function updateMe(req, res, next) {
//     try {
//         const payload = UpdateMeSchema.parse(req.body || {});
//         const updated = await UserService.updateById(req.user.id, payload);
//         delete updated?.password_hash;
//         res.json({
//             message: "Cập nhật hồ sơ thành công",
//             data: updated,
//             error: false,
//             success: true,
//         });
//     } catch (err) { next(err); }
// }

// module.exports = { getMe, updateMe };
