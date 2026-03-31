const { getPlayerById } = require("../lib/domain");
const { sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
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
};
