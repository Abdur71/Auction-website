const { getTeamsWithPlayers } = require("../lib/domain");
const { sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
    try {
        return sendJson(res, 200, { teams: await getTeamsWithPlayers() });
    } catch (error) {
        return sendJson(res, 500, { error: error.message || "Could not load teams" });
    }
};
