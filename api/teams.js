const { requireAdminAuth } = require("../lib/auth");
const { getTeams, getTeamsWithPlayers, saveTeams } = require("../lib/domain");
const { methodNotAllowed, parseRequestBody, sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
    const action = String(req.query.action || "").trim();

    if (action === "list") {
        try {
            return sendJson(res, 200, { teams: await getTeams() });
        } catch (error) {
            return sendJson(res, 500, { error: "Could not load teams" });
        }
    }

    if (action === "withPlayers") {
        try {
            return sendJson(res, 200, { teams: await getTeamsWithPlayers() });
        } catch (error) {
            return sendJson(res, 500, { error: "Could not load teams" });
        }
    }

    if (action === "save") {
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
    }

    if (action === "delete") {
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
    }

    return sendJson(res, 404, { error: "Unknown teams action" });
};
