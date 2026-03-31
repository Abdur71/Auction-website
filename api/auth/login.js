const { authenticateAdminCredentials, setSessionCookie } = require("../../lib/auth");
const { methodNotAllowed, parseRequestBody, sendJson } = require("../../lib/http");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return methodNotAllowed(req, res, ["POST"]);
    }

    const body = await parseRequestBody(req);
    if (body === null) {
        return sendJson(res, 400, { error: "Invalid request" });
    }

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!authenticateAdminCredentials(username, password)) {
        return sendJson(res, 401, { error: "Invalid username or password" });
    }

    setSessionCookie(res);
    return sendJson(res, 200, { success: true });
};
