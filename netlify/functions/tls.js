// netlify/functions/tls.js
"use strict";

const tls = require("tls");

function json(statusCode, body) {
    return {
        statusCode,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
        },
        body: JSON.stringify(body),
    };
}

function isValidHost(host) {
    if (!host || typeof host !== "string") return false;
    if (host.length > 253) return false;
    if (!/^[a-zA-Z0-9.-]+$/.test(host)) return false;
    if (host.startsWith(".") || host.endsWith(".")) return false;
    return true;
}

function getCertInfo(host) {
    return new Promise((resolve, reject) => {
        const socket = tls.connect(
            {
                host,
                port: 443,
                servername: host, // SNI
                timeout: 6000,
            },
            () => {
                try {
                    const cert = socket.getPeerCertificate(true);
                    const protocol = socket.getProtocol();
                    const authorized = socket.authorized;
                    const authorizationError = socket.authorizationError || null;

                    socket.end();

                    resolve({
                        host,
                        authorized,
                        authorizationError,
                        protocol,
                        subject: cert.subject || null,
                        issuer: cert.issuer || null,
                        valid_from: cert.valid_from || null,
                        valid_to: cert.valid_to || null,
                        fingerprint256: cert.fingerprint256 || null,
                        serialNumber: cert.serialNumber || null,
                    });
                } catch (e) {
                    socket.end();
                    reject(e);
                }
            }
        );

        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error("TLS connect timeout"));
        });

        socket.on("error", (err) => {
            reject(err);
        });
    });
}

exports.handler = async (event) => {
    try {
        const host = (event.queryStringParameters && event.queryStringParameters.host) || "";
        if (!isValidHost(host)) {
            return json(400, { error: "Invalid host. Use letters, digits, dot and hyphen." });
        }

        const info = await getCertInfo(host);

        // extra: simpele expiry indicatie
        let daysLeft = null;
        if (info.valid_to) {
            const end = new Date(info.valid_to).getTime();
            if (!Number.isNaN(end)) {
                const diff = end - Date.now();
                daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
            }
        }

        return json(200, { ...info, daysLeft, timestamp: new Date().toISOString() });
    } catch (err) {
        return json(500, { error: "TLS check failed", details: String(err && err.message ? err.message : err) });
    }
};
