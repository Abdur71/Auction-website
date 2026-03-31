const { SHEET_URL } = require("./config");

function getGoogleSheetCsvUrls(sheetUrl) {
    const match = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(sheetUrl);
    if (!match) {
        return [];
    }

    const sheetId = match[1];
    const url = new URL(sheetUrl);
    const rawGid = (url.searchParams.get("gid") || "0").replace(/[^0-9]/g, "") || "0";

    return [
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${rawGid}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${rawGid}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&gid=${rawGid}`,
    ];
}

async function fetchRemoteText(url) {
    if (!url) {
        return null;
    }

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Auction Sheet Loader",
            },
        });

        if (!response.ok) {
            return null;
        }

        return await response.text();
    } catch (error) {
        return null;
    }
}

function parseCsv(csvText) {
    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let index = 0; index < csvText.length; index += 1) {
        const char = csvText[index];
        const nextChar = csvText[index + 1];

        if (char === "\"") {
            if (insideQuotes && nextChar === "\"") {
                value += "\"";
                index += 1;
            } else {
                insideQuotes = !insideQuotes;
            }
            continue;
        }

        if (char === "," && !insideQuotes) {
            row.push(value);
            value = "";
            continue;
        }

        if ((char === "\n" || char === "\r") && !insideQuotes) {
            if (char === "\r" && nextChar === "\n") {
                index += 1;
            }
            row.push(value);
            rows.push(row);
            row = [];
            value = "";
            continue;
        }

        value += char;
    }

    if (value !== "" || row.length) {
        row.push(value);
        rows.push(row);
    }

    return rows.filter((entry) => entry.some((cell) => String(cell || "").trim() !== ""));
}

function getDriveFileId(value) {
    const input = String(value || "").trim();
    if (!input) {
        return "";
    }

    const patterns = [
        /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(input);
        if (match) {
            return match[1];
        }
    }

    return "";
}

function normalizeImagePath(rawImage) {
    const image = String(rawImage || "").trim();
    if (!image) {
        return "/image.png";
    }

    const driveFileId = getDriveFileId(image);
    if (driveFileId) {
        return `/api/drive_image?id=${encodeURIComponent(driveFileId)}`;
    }

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    return image.startsWith("/") ? image : `/${image}`;
}

async function loadSheetRows() {
    let csvContent = null;

    for (const csvUrl of getGoogleSheetCsvUrls(SHEET_URL)) {
        csvContent = await fetchRemoteText(csvUrl);
        if (csvContent && csvContent.trim()) {
            break;
        }
    }

    if (!csvContent || !csvContent.trim()) {
        throw new Error("Could not load Google Sheet CSV");
    }

    const trimmed = csvContent.trimStart().toLowerCase();
    if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
        throw new Error("Google Sheet is not publicly accessible as CSV");
    }

    const rows = parseCsv(csvContent);
    if (!rows.length) {
        return [];
    }

    return rows.slice(1);
}

async function loadBasePlayers() {
    const rows = await loadSheetRows();

    return rows.map((row, index) => ({
        id: index + 1,
        name: String(row[1] || "").trim(),
        series: String(row[2] || "").trim(),
        role: String(row[3] || "").trim(),
        category: String(row[3] || "").trim(),
        image: normalizeImagePath(row[4] || ""),
        price: "50k",
    }));
}

module.exports = {
    getDriveFileId,
    loadBasePlayers,
};
