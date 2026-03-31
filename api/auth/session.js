const { isAuthenticated } = require("../../lib/auth");
const { sendJson } = require("../../lib/http");

module.exports = async function handler(req, res) {
    return sendJson(res, 200, { authenticated: isAuthenticated(req) });
};
