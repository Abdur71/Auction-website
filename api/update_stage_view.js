const { requireAdminAuth } = require("../lib/auth");
const { setStageView } = require("../lib/domain");
const { methodNotAllowed, parseRequestBody, sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return methodNotAllowed(req, res, ["POST"]);
    }

    if (!requireAdminAuth(req, res)) {
        return;
    }

    const body = await parseRequestBody(req);
    if (body === null) {
        return sendJson(res, 400, { error: "Invalid request" });
    }

    const mode = String(body.mode || "player").trim();
    if (!["none", "player", "database", "teams", "team", "countdown"].includes(mode)) {
        return sendJson(res, 400, { error: "Invalid mode" });
    }

    const status = ["all", "sold", "unsold"].includes(body.status) ? body.status : "all";
    const data = {
        mode,
        playerId: Number(body.playerId) || 0,
        teamId: Number(body.teamId) || 0,
        search: String(body.search || "").trim(),
        status,
    };

    try {
        await setStageView(data);
        return sendJson(res, 200, { success: true, ...data });
    } catch (error) {
        return sendJson(res, 500, { error: "Could not save stage view" });
    }
};
