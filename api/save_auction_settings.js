const { requireAdminAuth } = require("../lib/auth");
const { setAuctionSettings } = require("../lib/domain");
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

    const startTime = String(body.start_time || "").trim();
    let endMessage = String(body.end_message || "").trim();

    if (!startTime) {
        return sendJson(res, 400, { error: "Auction start time is required" });
    }

    if (!endMessage) {
        endMessage = "Auction has started.";
    }

    try {
        await setAuctionSettings({ startTime, endMessage });
        return sendJson(res, 200, { success: true, startTime, endMessage });
    } catch (error) {
        return sendJson(res, 500, { error: "Could not save auction settings" });
    }
};
