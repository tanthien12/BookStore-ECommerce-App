// backend/controllers/notification.controller.js

const { z } = require("zod");
const NotificationService = require("../services/notification.service");

// validate query ?limit=&offset=&unreadOnly=
const listQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
    offset: z.coerce.number().int().min(0).default(0),
    unreadOnly: z
        .enum(["true", "false"])
        .optional(),
});

// validate params :id
const paramsIdSchema = z.object({
    id: z.string().uuid(),
});

module.exports = {
    // GET /notifications
    async list(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res
                    .status(401)
                    .json({ success: false, message: "Yêu cầu đăng nhập" });
            }

            const query = listQuerySchema.parse(req.query);
            const notifications = await NotificationService.getUserNotifications(
                userId,
                {
                    limit: query.limit,
                    offset: query.offset,
                    unreadOnly: query.unreadOnly === "true",
                }
            );

            return res.json(notifications);
        } catch (err) {
            next(err);
        }
    },

    // GET /notifications/unread-count
    async unreadCount(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res
                    .status(401)
                    .json({ success: false, message: "Yêu cầu đăng nhập" });
            }

            const count = await NotificationService.countUnread(userId);
            return res.json({ count });
        } catch (err) {
            next(err);
        }
    },

    // POST /notifications/:id/read
    async markRead(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res
                    .status(401)
                    .json({ success: false, message: "Yêu cầu đăng nhập" });
            }

            const { id } = paramsIdSchema.parse(req.params);
            const updated = await NotificationService.markAsRead(userId, id);

            if (!updated) {
                return res
                    .status(404)
                    .json({ success: false, message: "Không tìm thấy thông báo" });
            }

            return res.json(updated);
        } catch (err) {
            next(err);
        }
    },

    // POST /notifications/read-all
    async markAllRead(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res
                    .status(401)
                    .json({ success: false, message: "Yêu cầu đăng nhập" });
            }

            await NotificationService.markAllAsRead(userId);
            return res.json({ success: true });
        } catch (err) {
            next(err);
        }
    },
};
