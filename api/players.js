const { requireAdminAuth } = require("../lib/auth");
const { getCurrentPlayer, getPlayerById, getPlayers, setCurrentPlayer, setSoldState } = require("../lib/domain");
const { methodNotAllowed, parseRequestBody, sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
    const action = String(req.query.action || "").trim();

    if (action === "getPlayer") {
        const id = Number(req.query.id) || 0;

        if (id <= 0) {
            return sendJson(res, 400, { error: "Invalid ID" });
        }

        try {
            const player = await getPlayerById(id);
            if (!player) {
                return sendJson(res, 404, { error: "Player not found" });
            }

            return sendJson(res, 200, {
                name: player.name,
                series: player.series,
                role: player.role,
                price: player.price,
                image: player.image || "image.png",
                sold: player.sold,
                soldPrice: player.soldPrice,
                teamName: player.teamName,
            });
        } catch (error) {
            return sendJson(res, 500, { error: error.message || "Could not load player" });
        }
    }

    if (action === "list") {
        try {
            const players = await getPlayers();
            return sendJson(res, 200, {
                players: players.map((player) => ({
                    id: player.id,
                    name: player.name,
                    series: player.series,
                    category: player.category,
                    status: player.status,
                    soldPrice: player.soldPrice,
                    teamName: player.teamName,
                })),
                total: players.length,
                sold: players.filter((player) => player.status === "Sold").length,
            });
        } catch (error) {
            return sendJson(res, 500, { error: error.message || "Could not load players" });
        }
    }

    if (action === "current") {
        if (req.method === "GET") {
            try {
                const currentPlayer = await getCurrentPlayer();
                return sendJson(res, 200, { id: Number(currentPlayer.id) || 0 });
            } catch (error) {
                return sendJson(res, 500, { error: "Could not load current player" });
            }
        }

        if (req.method !== "POST") {
            return methodNotAllowed(req, res, ["GET", "POST"]);
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
    }

    if (action === "soldState") {
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
    }

    return sendJson(res, 404, { error: "Unknown players action" });
};
