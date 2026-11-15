/**
 * MacPherson Ventures website Worker.
 * Serves static assets, records email opt-outs, and exposes a protected
 * list so outreach can be checked before anything is sent.
 */
import { renderUnsubscribePage } from "./unsubscribe-page.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const JSON_HEADERS = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow"
};
const HTML_HEADERS = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow"
};


const EMAIL_ASSET_PREFIX = "/assets/email/";
const EMAIL_ASSET_HEADERS = {
    "content-type": "image/png",
    "cache-control": "public, max-age=31536000, immutable",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "cross-origin-resource-policy": "cross-origin",
    "timing-allow-origin": "*"
};


function normalisePath(pathname) {
    if (pathname.length > 1 && pathname.endsWith("/")) {
        return pathname.slice(0, -1);
    }
    return pathname;
}

function normaliseEmail(raw) {
    if (typeof raw !== "string") return null;
    const email = raw.trim().toLowerCase();
    if (!email || email.length > MAX_EMAIL_LENGTH) return null;
    if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) return null;
    if (!EMAIL_RE.test(email)) return null;
    return email;
}

function readEmailParam(url) {
    return normaliseEmail(url.searchParams.get("e") || url.searchParams.get("email") || "");
}

function htmlPage(opts, status = 200) {
    return new Response(renderUnsubscribePage(opts), { status, headers: HTML_HEADERS });
}

function json(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function wantsJson(request) {
    const accept = request.headers.get("accept") || "";
    return accept.includes("application/json") && !accept.includes("text/html");
}

function safeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string") return false;
    const len = Math.max(a.length, b.length);
    let mismatch = a.length === b.length ? 0 : 1;
    for (let i = 0; i < len; i++) {
        mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return mismatch === 0;
}

function bearerToken(request) {
    const header = request.headers.get("authorization") || "";
    const match = header.match(/^Bearer\s+(\S+)$/i);
    return match ? match[1] : "";
}

async function recordOptOut(env, email, source) {
    const existing = await env.OPTOUTS.get(email, { type: "json" });
    if (existing && existing.optedOutAt) {
        return { record: existing, already: true };
    }
    const record = {
        email,
        optedOutAt: new Date().toISOString(),
        source: source || "form"
    };
    await env.OPTOUTS.put(email, JSON.stringify(record));
    return { record, already: false };
}

async function listOptOuts(env) {
    const records = [];
    let cursor;
    do {
        const page = await env.OPTOUTS.list({ cursor, limit: 1000 });
        for (const key of page.keys) {
            const value = await env.OPTOUTS.get(key.name, { type: "json" });
            if (value && value.email && value.optedOutAt) {
                records.push({
                    email: value.email,
                    optedOutAt: value.optedOutAt,
                    source: value.source || ""
                });
            }
        }
        cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    records.sort(function (a, b) {
        if (a.optedOutAt < b.optedOutAt) return -1;
        if (a.optedOutAt > b.optedOutAt) return 1;
        return a.email < b.email ? -1 : a.email > b.email ? 1 : 0;
    });
    return records;
}

function toCsv(records) {
    const lines = ["email,opted_out_at,source"];
    for (const row of records) {
        lines.push([row.email, row.optedOutAt, row.source].map(csvCell).join(","));
    }
    return lines.join("\r\n") + "\r\n";
}

function csvCell(value) {
    const text = String(value ?? "");
    if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
}

function isOneClickBody(text) {
    const trimmed = text.trim();
    // RFC 8058: the POST body is List-Unsubscribe=One-Click
    return /^List-Unsubscribe=One-Click$/i.test(trimmed) ||
        /(?:^|&)List-Unsubscribe=One-Click(?:&|$)/i.test(trimmed);
}

async function parseRequestEmail(request, url) {
    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    const rawBody = request.method === "POST" || request.method === "PUT"
        ? await request.text()
        : "";

    if (isOneClickBody(rawBody)) {
        return { email: readEmailParam(url), source: "one-click", oneClick: true };
    }

    let formEmail = "";
    let formSource = "";
    if (rawBody && (contentType.includes("application/x-www-form-urlencoded") || contentType === "")) {
        const params = new URLSearchParams(rawBody);
        formEmail = params.get("email") || params.get("e") || "";
        formSource = params.get("source") || "";
    } else if (rawBody && contentType.includes("application/json")) {
        try {
            const body = JSON.parse(rawBody);
            formEmail = body.email || body.e || "";
            formSource = body.source || "";
        } catch (err) {
            return { error: "That request could not be read.", oneClick: false };
        }
    } else if (rawBody && contentType.includes("multipart/form-data")) {
        // Re-parse from a cloned body is awkward once consumed; this path is
        // uncommon. Ask the client to use a standard form encoding.
        return { error: "Please submit the form as a normal form post.", oneClick: false };
    }

    const email = normaliseEmail(formEmail) || readEmailParam(url);
    const source = formSource === "one-click" ? "one-click" : "form";
    return { email, source, oneClick: false };
}

async function handleUnsubscribe(request, url, env) {
    if (request.method === "GET" || request.method === "HEAD") {
        const email = readEmailParam(url) || (url.searchParams.get("e") || url.searchParams.get("email") || "").trim();
        const done = url.searchParams.get("done") === "1";
        const page = htmlPage({
            email: normaliseEmail(email) || "",
            done
        });
        if (request.method === "HEAD") {
            return new Response(null, { status: page.status, headers: page.headers });
        }
        return page;
    }

    if (request.method !== "POST") {
        return new Response("Method not allowed", {
            status: 405,
            headers: { allow: "GET, HEAD, POST", "cache-control": "no-store" }
        });
    }

    if (!env.OPTOUTS) {
        return htmlPage({
            email: readEmailParam(url) || "",
            error: "The unsubscribe list is not available at the moment. Please email andrew@macphersonventures.com and we'll take you off the list."
        }, 503);
    }

    const parsed = await parseRequestEmail(request, url);
    if (parsed.error) {
        if (parsed.oneClick || wantsJson(request)) {
            return json({ ok: false, error: parsed.error }, 400);
        }
        return htmlPage({ email: "", error: parsed.error }, 400);
    }

    if (!parsed.email) {
        const message = "Please enter a valid email address.";
        if (parsed.oneClick) {
            return new Response(message + "\n", {
                status: 400,
                headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
            });
        }
        if (wantsJson(request)) {
            return json({ ok: false, error: message }, 400);
        }
        return htmlPage({ email: "", error: message }, 400);
    }

    const { record } = await recordOptOut(env, parsed.email, parsed.source);

    if (parsed.oneClick) {
        return new Response("OK\n", {
            status: 200,
            headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
        });
    }

    if (wantsJson(request)) {
        return json({ ok: true, email: record.email, optedOutAt: record.optedOutAt, source: record.source });
    }

    const location = new URL("/unsubscribe", url.origin);
    location.searchParams.set("done", "1");
    location.searchParams.set("e", record.email);
    return new Response(null, {
        status: 303,
        headers: {
            location: location.pathname + location.search,
            "cache-control": "no-store"
        }
    });
}

function authoriseApi(request, env) {
    const expected = env.OPTOUT_API_TOKEN;
    if (!expected) {
        return json({ error: "The opt-out API token has not been configured." }, 503);
    }
    if (!safeEqual(bearerToken(request), expected)) {
        return json({ error: "Unauthorised." }, 401);
    }
    return null;
}

async function handleOptoutsApi(request, url, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
            status: 405,
            headers: { allow: "GET, HEAD", "cache-control": "no-store" }
        });
    }

    const denied = authoriseApi(request, env);
    if (denied) return denied;

    if (!env.OPTOUTS) {
        return json({ error: "The unsubscribe list is not available at the moment." }, 503);
    }

    const rawQuery = url.searchParams.get("e") || url.searchParams.get("email");
    if (rawQuery !== null && rawQuery !== undefined && String(rawQuery).length > 0) {
        const email = normaliseEmail(rawQuery);
        if (!email) return json({ error: "Please provide a valid email address." }, 400);
        const record = await env.OPTOUTS.get(email, { type: "json" });
        const body = record && record.optedOutAt
            ? { email, optedOut: true, optedOutAt: record.optedOutAt, source: record.source || "" }
            : { email, optedOut: false };
        if (request.method === "HEAD") {
            return new Response(null, { status: 200, headers: JSON_HEADERS });
        }
        return json(body);
    }

    const records = await listOptOuts(env);
    const format = (url.searchParams.get("format") || "").toLowerCase();
    const accept = request.headers.get("accept") || "";
    const asCsv = format === "csv" || (accept.includes("text/csv") && format !== "json");

    if (asCsv) {
        const headers = {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": 'attachment; filename="optouts.csv"',
            "cache-control": "no-store",
            "x-robots-tag": "noindex, nofollow"
        };
        if (request.method === "HEAD") {
            return new Response(null, { status: 200, headers });
        }
        return new Response(toCsv(records), { status: 200, headers });
    }

    if (request.method === "HEAD") {
        return new Response(null, { status: 200, headers: JSON_HEADERS });
    }
    return json({ optouts: records, count: records.length });
}


async function handleEmailAsset(request, env) {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "access-control-allow-origin": "*",
                "access-control-allow-methods": "GET, HEAD, OPTIONS",
                "access-control-max-age": "86400",
                "cache-control": "public, max-age=86400"
            }
        });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
            status: 405,
            headers: { allow: "GET, HEAD, OPTIONS", "cache-control": "no-store" }
        });
    }
    const assetRequest = request.method === "HEAD"
        ? new Request(request, { method: "GET" })
        : request;
    const res = await env.ASSETS.fetch(assetRequest);
    if (res.status !== 200) {
        return res;
    }
    const headers = new Headers(res.headers);
    for (const [key, value] of Object.entries(EMAIL_ASSET_HEADERS)) {
        headers.set(key, value);
    }
    // Do not restrict embedding or hotlinking from email clients
    headers.delete("content-security-policy");
    headers.delete("x-frame-options");
    if (request.method === "HEAD") {
        return new Response(null, { status: 200, headers });
    }
    return new Response(res.body, { status: 200, headers });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = normalisePath(url.pathname);

        try {
            if (path === "/unsubscribe") {
                return await handleUnsubscribe(request, url, env);
            }
            if (path === "/api/optouts") {
                return await handleOptoutsApi(request, url, env);
            }
            if (path.startsWith(EMAIL_ASSET_PREFIX)) {
                return await handleEmailAsset(request, env);
            }
        } catch (err) {
            const message = "Something went wrong. Please email andrew@macphersonventures.com and we'll take you off the list.";
            if (path === "/api/optouts") {
                return json({ error: "Something went wrong." }, 500);
            }
            if (path === "/unsubscribe" && request.method === "POST") {
                const accept = request.headers.get("accept") || "";
                if (accept.includes("application/json") && !accept.includes("text/html")) {
                    return json({ ok: false, error: message }, 500);
                }
            }
            return htmlPage({ email: "", error: message }, 500);
        }

        return env.ASSETS.fetch(request);
    }
};
