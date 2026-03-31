const fs = require("fs/promises");
const { kv } = require("@vercel/kv");
const { DEFAULTS, STORAGE_FILES } = require("./config");

function cloneDefault(value) {
    return JSON.parse(JSON.stringify(value));
}

function isKvEnabled() {
    return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function readJsonFile(filePath, fallback) {
    try {
        const content = await fs.readFile(filePath, "utf8");
        if (!content.trim()) {
            return cloneDefault(fallback);
        }

        const parsed = JSON.parse(content);
        return parsed && typeof parsed === "object" ? parsed : cloneDefault(fallback);
    } catch (error) {
        return cloneDefault(fallback);
    }
}

async function writeJsonFile(filePath, value) {
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function readState(key) {
    const fallback = DEFAULTS[key];
    if (typeof fallback === "undefined") {
        throw new Error(`Unknown state key: ${key}`);
    }

    if (isKvEnabled()) {
        const data = await kv.get(`auction:${key}`);
        return data && typeof data === "object" ? data : cloneDefault(fallback);
    }

    return readJsonFile(STORAGE_FILES[key], fallback);
}

async function writeState(key, value) {
    if (typeof DEFAULTS[key] === "undefined") {
        throw new Error(`Unknown state key: ${key}`);
    }

    if (isKvEnabled()) {
        await kv.set(`auction:${key}`, value);
        return;
    }

    await writeJsonFile(STORAGE_FILES[key], value);
}

module.exports = {
    isKvEnabled,
    readState,
    writeState,
    cloneDefault,
};
