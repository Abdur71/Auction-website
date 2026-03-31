const { sendJson } = require("../lib/http");

async function fetchImage(url) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Auction Image Proxy",
                Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            },
        });

        if (!response.ok) {
            return null;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (!buffer.length) {
            return null;
        }

        return {
            body: buffer,
            contentType: response.headers.get("content-type") || "image/jpeg",
        };
    } catch (error) {
        return null;
    }
}

module.exports = async function handler(req, res) {
    const fileId = String(req.query.id || "").trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
        res.redirect(307, "/image.png");
        return;
    }

    const driveUrls = [
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
    ];

    for (const url of driveUrls) {
        const image = await fetchImage(url);
        if (image) {
            res.setHeader("Cache-Control", "public, max-age=300");
            res.setHeader("Content-Type", image.contentType);
            res.status(200).send(image.body);
            return;
        }
    }

    res.redirect(307, "/image.png");
};
