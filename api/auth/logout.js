const { clearSessionCookie } = require("../../lib/auth");
const { methodNotAllowed, sendJson } = require("../../lib/http");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return methodNotAllowed(req, res, ["POST"]);
    }

    clearSessionCookie(res);
    return sendJson(res, 200, { success: true });
};
