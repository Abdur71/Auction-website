const path = require("path");

const ROOT_DIR = process.cwd();

const STORAGE_FILES = {
    teams: path.join(ROOT_DIR, "teams.json"),
    soldStates: path.join(ROOT_DIR, "sold_states.json"),
    stageView: path.join(ROOT_DIR, "stage_view.json"),
    auctionSettings: path.join(ROOT_DIR, "auction_settings.json"),
    currentPlayer: path.join(ROOT_DIR, "current_player.json"),
};

const DEFAULTS = {
    teams: [],
    soldStates: {},
    stageView: {
        mode: "none",
        playerId: 0,
        teamId: 0,
        search: "",
        status: "all",
    },
    auctionSettings: {
        startTime: "",
        endMessage: "Auction has started.",
    },
    currentPlayer: {
        id: 0,
    },
};

const SHEET_URL = process.env.AUCTION_SHEET_URL || "https://docs.google.com/spreadsheets/d/1BFWNKZK8t230bL2XwHEJfCr2kqr1nCuZnihwmv1UFQE/edit?usp=sharing";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const SESSION_COOKIE_NAME = "auction_admin_session";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "change-this-secret-before-production";

module.exports = {
    STORAGE_FILES,
    DEFAULTS,
    SHEET_URL,
    ADMIN_USERNAME,
    ADMIN_PASSWORD,
    SESSION_COOKIE_NAME,
    SESSION_SECRET,
};
