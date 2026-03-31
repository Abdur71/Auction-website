const { requireAdminAuth } = require("../lib/auth");
const { getAuctionSettings, setAuctionSettings } = require("../lib/domain");
const { methodNotAllowed, parseRequestBody, sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
    const action = String(req.query.action || "").trim();

    if (action === "getAuctionSettings") {
        try {
            return sendJson(res, 200, await getAuctionSettings());
        } catch (error) {
            return sendJson(res, 500, { error: "Could not load auction settings" });
        }
    }

    if (action === "saveAuctionSettings") {
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
    }

    return sendJson(res, 404, { error: "Unknown settings action" });
};
