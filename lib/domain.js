const { readState, writeState } = require("./storage");
const { loadBasePlayers } = require("./sheet");

function normalizeSoldStateEntry(entry) {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        return {
            sold: Boolean(entry.sold),
            soldPrice: String(entry.soldPrice || "").trim(),
            teamName: String(entry.teamName || "").trim(),
        };
    }

    return {
        sold: Boolean(entry),
        soldPrice: "",
        teamName: "",
    };
}

async function getSoldStates() {
    return readState("soldStates");
}

async function getPlayers() {
    const [basePlayers, soldStates] = await Promise.all([
        loadBasePlayers(),
        getSoldStates(),
    ]);

    return basePlayers.map((player) => {
        const soldState = normalizeSoldStateEntry(soldStates[String(player.id)]);
        return {
            ...player,
            sold: soldState.sold,
            soldPrice: soldState.soldPrice,
            teamName: soldState.teamName,
            status: soldState.sold ? "Sold" : "Unsold",
        };
    });
}

async function getPlayerById(id) {
    const players = await getPlayers();
    return players.find((player) => Number(player.id) === Number(id)) || null;
}

async function getTeams() {
    const teams = await readState("teams");
    return Array.isArray(teams) ? teams.filter((team) => team && typeof team === "object") : [];
}

async function saveTeams(teams) {
    await writeState("teams", teams);
}

async function getTeamsWithPlayers() {
    const [teams, players] = await Promise.all([
        getTeams(),
        getPlayers(),
    ]);

    const playersByTeamName = {};
    players.forEach((player) => {
        if (player.sold && player.teamName) {
            if (!playersByTeamName[player.teamName]) {
                playersByTeamName[player.teamName] = [];
            }

            playersByTeamName[player.teamName].push({
                id: player.id,
                name: player.name,
                soldPrice: player.soldPrice,
            });
        }
    });

    return teams.map((team) => ({
        id: Number(team.id) || 0,
        teamName: String(team.teamName || "").trim(),
        ownerName: String(team.ownerName || "").trim(),
        ownerPlayerId: Number(team.ownerPlayerId) || 0,
        players: playersByTeamName[String(team.teamName || "").trim()] || [],
    }));
}

async function getStageView() {
    const data = await readState("stageView");
    const mode = ["none", "player", "database", "teams", "team", "countdown"].includes(data.mode) ? data.mode : "none";
    const status = ["all", "sold", "unsold"].includes(data.status) ? data.status : "all";

    return {
        mode,
        playerId: Number(data.playerId) || 0,
        teamId: Number(data.teamId) || 0,
        search: String(data.search || "").trim(),
        status,
    };
}

async function setStageView(value) {
    await writeState("stageView", {
        ...value,
        updatedAt: new Date().toISOString(),
    });
}

async function getAuctionSettings() {
    const data = await readState("auctionSettings");
    return {
        startTime: String(data.startTime || "").trim(),
        endMessage: String(data.endMessage || "").trim() || "Auction has started.",
    };
}

async function setAuctionSettings(value) {
    await writeState("auctionSettings", {
        ...value,
        updatedAt: new Date().toISOString(),
    });
}

async function getCurrentPlayer() {
    const data = await readState("currentPlayer");
    return {
        id: Number(data.id) || 0,
    };
}

async function setCurrentPlayer(value) {
    await writeState("currentPlayer", {
        ...value,
        updatedAt: new Date().toISOString(),
    });
}

async function setSoldState(id, sold, soldPrice, teamName) {
    const states = await getSoldStates();
    const nextStates = { ...states };

    if (sold) {
        nextStates[String(id)] = {
            sold: true,
            soldPrice: String(soldPrice || "").trim(),
            teamName: String(teamName || "").trim(),
        };
    } else {
        delete nextStates[String(id)];
    }

    await writeState("soldStates", nextStates);
    return normalizeSoldStateEntry(nextStates[String(id)]);
}

module.exports = {
    getAuctionSettings,
    getCurrentPlayer,
    getPlayerById,
    getPlayers,
    getSoldStates,
    getStageView,
    getTeams,
    getTeamsWithPlayers,
    saveTeams,
    setAuctionSettings,
    setCurrentPlayer,
    setSoldState,
    setStageView,
};
