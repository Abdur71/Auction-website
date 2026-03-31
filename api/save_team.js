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

    const teamName = String(body.team_name || "").trim();
    const ownerName = String(body.owner_name || "").trim();
    const ownerPlayerId = Number(body.owner_player_id) || 0;

    if (!teamName || !ownerName) {
        return sendJson(res, 400, { error: "Team name and owner name are required" });
    }

    try {
        const teams = await getTeams();
        const newTeam = {
            id: teams.length + 1,
            teamName,
            ownerName,
            ownerPlayerId: ownerPlayerId > 0 ? ownerPlayerId : null,
            createdAt: new Date().toISOString(),
        };

        teams.push(newTeam);
        await saveTeams(teams);
        return sendJson(res, 200, { success: true, team: newTeam });
    } catch (error) {
        return sendJson(res, 500, { error: "Could not save team" });
    }
};
