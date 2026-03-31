function sendJson(res, statusCode, payload) {
    res.status(statusCode).json(payload);
}

function methodNotAllowed(req, res, methods) {
    res.setHeader("Allow", methods.join(", "));
    sendJson(res, 405, { error: `Method ${req.method} not allowed` });
}

async function parseRequestBody(req) {
    if (req.body && typeof req.body === "object") {
        return req.body;
    }

    if (typeof req.body === "string" && req.body.trim()) {
        try {
            return JSON.parse(req.body);
        } catch (error) {
            return null;
        }
    }

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (!chunks.length) {
        return {};
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch (error) {
        return null;
    }
}

module.exports = {
    parseRequestBody,
    sendJson,
    methodNotAllowed,
};
