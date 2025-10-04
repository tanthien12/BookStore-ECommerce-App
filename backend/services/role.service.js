// backend/services/role.service.js
const roleModel = require('../models/role.model');

async function listRoles(withCounts = false) {
    return withCounts ? roleModel.countUsersByRole() : roleModel.findAllRoles();
}

module.exports = { listRoles };
