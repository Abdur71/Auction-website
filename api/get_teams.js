const { getTeams } = require("../lib/domain");
const { sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
    try {
        return sendJson(res, 200, { teams: await getTeams() });
    } catch (error) {
        return sendJson(res, 500, { error: "Could not load teams" });
    }
};
