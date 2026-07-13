export type GoogleImportKind = "sheets" | "docs";

export interface ParsedGoogleImportUrl {
  kind: GoogleImportKind;
  id: string;
  gid?: string;
}

export interface GoogleExportTarget {
  kind: GoogleImportKind;
  exportUrl: string;
  fileName: string;
  contentType: string;
}

function extractId(pathname: string, marker: string): string | undefined {
  const markerIndex = pathname.indexOf(marker);
  if (markerIndex < 0) return undefined;
  const afterMarker = pathname.slice(markerIndex + marker.length);
  return afterMarker.split("/").filter(Boolean)[0];
}

function extractGid(url: URL): string | undefined {
  const fromSearch = url.searchParams.get("gid");
  if (fromSearch) return fromSearch;

  const fromHash = url.hash.match(/gid=(\d+)/)?.[1];
  return fromHash;
}

export function parseGoogleImportUrl(input: string): ParsedGoogleImportUrl {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Paste a valid Google Sheets or Google Docs link.");
  }

  if (url.hostname !== "docs.google.com") {
    throw new Error("Only Google Sheets and Google Docs links are supported.");
  }

  const sheetsId = extractId(url.pathname, "/spreadsheets/d/");
  if (sheetsId) {
    return {
      kind: "sheets",
      id: sheetsId,
      gid: extractGid(url)
    };
  }

  const docsId = extractId(url.pathname, "/document/d/");
  if (docsId) {
    return {
      kind: "docs",
      id: docsId
    };
  }

  throw new Error("Paste a valid Google Sheets or Google Docs link.");
}

export function buildGoogleExportTarget(parsed: ParsedGoogleImportUrl): GoogleExportTarget {
  if (parsed.kind === "sheets") {
    const exportUrl = new URL(`https://docs.google.com/spreadsheets/d/${parsed.id}/export`);
    exportUrl.searchParams.set("format", "csv");
    if (parsed.gid) exportUrl.searchParams.set("gid", parsed.gid);

    return {
      kind: "sheets",
      exportUrl: exportUrl.toString(),
      fileName: "google-sheets-import.csv",
      contentType: "text/csv; charset=utf-8"
    };
  }

  const exportUrl = new URL(`https://docs.google.com/document/d/${parsed.id}/export`);
  exportUrl.searchParams.set("format", "pdf");

  return {
    kind: "docs",
    exportUrl: exportUrl.toString(),
    fileName: "google-docs-import.pdf",
    contentType: "application/pdf"
  };
}
