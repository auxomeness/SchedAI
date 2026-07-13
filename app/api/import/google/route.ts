import { NextResponse } from "next/server";
import { buildGoogleExportTarget, parseGoogleImportUrl } from "@/lib/google-import";

export const runtime = "nodejs";

function isLikelyHtml(contentType: string, text: string): boolean {
  return contentType.includes("text/html") || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let rawUrl = "";

  try {
    const body = (await request.json()) as { url?: unknown };
    rawUrl = typeof body.url === "string" ? body.url : "";
  } catch {
    return jsonError("Paste a valid Google Sheets or Google Docs link.");
  }

  try {
    const parsed = parseGoogleImportUrl(rawUrl);
    const target = buildGoogleExportTarget(parsed);
    const upstream = await fetch(target.exportUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "SchedAI/0.0.1"
      }
    });

    if (!upstream.ok) {
      return jsonError('We could not access this Google file. Set sharing to "Anyone with the link can view," then try again.', 403);
    }

    const contentType = upstream.headers.get("content-type")?.toLowerCase() ?? "";

    if (target.kind === "sheets") {
      const text = await upstream.text();
      if (isLikelyHtml(contentType, text)) {
        return jsonError('We could not access this Google Sheet. Set sharing to "Anyone with the link can view," then try again.', 403);
      }

      return new Response(text, {
        headers: {
          "content-type": target.contentType,
          "content-disposition": `attachment; filename="${target.fileName}"`,
          "x-schedai-filename": target.fileName,
          "cache-control": "no-store"
        }
      });
    }

    const bytes = await upstream.arrayBuffer();
    if (!contentType.includes("application/pdf")) {
      const preview = new TextDecoder().decode(bytes.slice(0, 200));
      if (isLikelyHtml(contentType, preview)) {
        return jsonError('We could not access this Google Doc. Set sharing to "Anyone with the link can view," then try again.', 403);
      }
    }

    return new Response(bytes, {
      headers: {
        "content-type": target.contentType,
        "content-disposition": `attachment; filename="${target.fileName}"`,
        "x-schedai-filename": target.fileName,
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "We could not import this Google file.");
  }
}
