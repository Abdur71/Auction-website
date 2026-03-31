const { requireAdminAuth } = require("../lib/auth");
const { getTeams, saveTeams } = require("../lib/domain");
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
        return sendJson(res, 400, { error: "Invalid team ID" });
    }

    try {
        const teams = await getTeams();
        const filteredTeams = teams.filter((team) => Number(team.id) !== id).map((team, index) => ({
            ...team,
            id: index + 1,
        }));

        if (filteredTeams.length === teams.length) {
            return sendJson(res, 404, { error: "Team not found" });
        }

        await saveTeams(filteredTeams);
        return sendJson(res, 200, { success: true });
    } catch (error) {
        return sendJson(res, 500, { error: "Could not delete team" });
    }
};
