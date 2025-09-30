function validate(schema, pick = "body") {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req[pick]);
            req[pick] = parsed;
            next();
        } catch (err) {
            const issues = err?.issues?.map(i => ({ path: i.path?.join("."), message: i.message })) || [];
            res.status(400).json({ success: false, error: true, message: "Dữ liệu không hợp lệ", issues });
        }
    };
}
module.exports = { validate };
