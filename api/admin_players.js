const { getPlayers } = require("../lib/domain");
const { sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
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
};
