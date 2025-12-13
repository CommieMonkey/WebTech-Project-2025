// netlify/functions/dns.js
"use strict";

const dns = require("dns").promises;

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

exports.handler = async (event) => {
    try {
        const host = (event.queryStringParameters && event.queryStringParameters.host) || "";
        if (!isValidHost(host)) {
            return json(400, { error: "Invalid host. Use letters, digits, dot and hyphen." });
        }

        const [a, aaaa, cname, mx, txt] = await Promise.allSettled([
            dns.resolve4(host),
            dns.resolve6(host),
            dns.resolveCname(host),
            dns.resolveMx(host),
            dns.resolveTxt(host),
        ]);

        const result = {
            host,
            A: a.status === "fulfilled" ? a.value : [],
            AAAA: aaaa.status === "fulfilled" ? aaaa.value : [],
            CNAME: cname.status === "fulfilled" ? cname.value : [],
            MX: mx.status === "fulfilled" ? mx.value : [],
            TXT: txt.status === "fulfilled" ? txt.value.flat() : [],
            timestamp: new Date().toISOString(),
        };

        return json(200, result);
    } catch (err) {
        return json(500, { error: "DNS lookup failed", details: String(err && err.message ? err.message : err) });
    }
};
