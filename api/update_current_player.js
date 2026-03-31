const { requireAdminAuth } = require("../lib/auth");
const { getPlayerById, setCurrentPlayer } = require("../lib/domain");
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
    if (id <= 0) {
        return sendJson(res, 400, { error: "Invalid player ID" });
    }

    try {
        const player = await getPlayerById(id);
        if (!player) {
            return sendJson(res, 404, { error: "Player not found" });
        }

        await setCurrentPlayer({ id });
        return sendJson(res, 200, { success: true, id });
    } catch (error) {
        return sendJson(res, 500, { error: "Could not save current player" });
    }
};
