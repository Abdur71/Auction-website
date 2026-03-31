const {
    authenticateAdminCredentials,
    clearSessionCookie,
    isAuthenticated,
    setSessionCookie,
} = require("../lib/auth");
const { methodNotAllowed, parseRequestBody, sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
    const action = String(req.query.action || "").trim();

    if (action === "session") {
        return sendJson(res, 200, { authenticated: isAuthenticated(req) });
    }

    if (action === "login") {
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
    }

    if (action === "logout") {
        if (req.method !== "POST") {
            return methodNotAllowed(req, res, ["POST"]);
        }

        clearSessionCookie(res);
        return sendJson(res, 200, { success: true });
    }

    return sendJson(res, 404, { error: "Unknown auth action" });
};
