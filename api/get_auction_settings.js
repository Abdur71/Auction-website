const { getAuctionSettings } = require("../lib/domain");
const { sendJson } = require("../lib/http");

module.exports = async function handler(req, res) {
    try {
        return sendJson(res, 200, await getAuctionSettings());
    } catch (error) {
        return sendJson(res, 500, { error: "Could not load auction settings" });
    }
};
