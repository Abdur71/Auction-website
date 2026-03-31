const crypto = require("crypto");
const {
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    SESSION_COOKIE_NAME,
    SESSION_SECRET,
} = require("./config");

function parseCookies(req) {
    const cookieHeader = req.headers.cookie || "";
    const pairs = cookieHeader.split(";").map((part) => part.trim()).filter(Boolean);
    const cookies = {};

    pairs.forEach((pair) => {
        const separatorIndex = pair.indexOf("=");
        if (separatorIndex === -1) {
            return;
        }

        const name = pair.slice(0, separatorIndex);
        const value = pair.slice(separatorIndex + 1);
        cookies[name] = decodeURIComponent(value);
    });

    return cookies;
}

function createSessionToken(payload) {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");
    return `${encodedPayload}.${signature}`;
}

function readSessionToken(token) {
    if (!token || !token.includes(".")) {
        return null;
    }

    const [encodedPayload, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");

    if (signature !== expectedSignature) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
        if (!payload || payload.username !== ADMIN_USERNAME || Number(payload.expiresAt) <= Date.now()) {
            return null;
        }

        return payload;
    } catch (error) {
        return null;
    }
}

function setSessionCookie(res) {
    const expiresAt = Date.now() + (1000 * 60 * 60 * 12);
    const token = createSessionToken({
        username: ADMIN_USERNAME,
        expiresAt,
    });

    const maxAge = 60 * 60 * 12;
    const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secureFlag}`);
}

function clearSessionCookie(res) {
    const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureFlag}`);
}

function isAuthenticated(req) {
    const cookies = parseCookies(req);
    return Boolean(readSessionToken(cookies[SESSION_COOKIE_NAME]));
}

function requireAdminAuth(req, res) {
    if (isAuthenticated(req)) {
        return true;
    }

    res.status(401).json({ error: "Unauthorized" });
    return false;
}

function authenticateAdminCredentials(username, password) {
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

module.exports = {
    authenticateAdminCredentials,
    clearSessionCookie,
    isAuthenticated,
    requireAdminAuth,
    setSessionCookie,
};
