const { getPlayerById, setSoldState } = require("../lib/domain");
const { requireAdminAuth } = require("../lib/auth");
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

    const id = Number(body.id) || 0;
    const sold = Boolean(body.sold);
    const soldPrice = String(body.sold_price || "").trim();
    const teamName = String(body.team_name || "").trim();

    if (id <= 0) {
        return sendJson(res, 400, { error: "Invalid player ID" });
    }

    try {
        const player = await getPlayerById(id);
        if (!player) {
            return sendJson(res, 404, { error: "Player not found" });
        }

        const state = await setSoldState(id, sold, soldPrice, teamName);
        return sendJson(res, 200, {
            success: true,
            id,
            sold,
            soldPrice: sold ? state.soldPrice : "",
            teamName: sold ? state.teamName : "",
        });
    } catch (error) {
        return sendJson(res, 500, { error: "Could not save sold status" });
    }
};
