export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

export type FileKind = "pdf" | "image" | "sheet" | "doc" | "other";

export const kindOf = (name: string, type?: string): FileKind => {
  const ext = extensionOf(name);
  if (type === "application/pdf" || ext === "pdf") return "pdf";
  if (type?.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
  if (["doc", "docx", "txt", "rtf"].includes(ext)) return "doc";
  return "other";
};

export type Accept = Record<string, string[]>;

export function matchesAccept(file: File, accept?: Accept): boolean {
  if (!accept) return true;
  const entries = Object.entries(accept);
  if (entries.length === 0) return true;
  const ext = `.${extensionOf(file.name)}`;
  const mime = (file.type || "").toLowerCase();

  return entries.some(([mimePattern, extensions]) => {
    const pattern = mimePattern.toLowerCase();
    if (pattern === "*/*") return true;
    if (pattern.endsWith("/*")) {
      const base = pattern.slice(0, -1);
      if (mime.startsWith(base)) return true;
    } else if (mime && mime === pattern) {
      return true;
    }
    if (extensions?.some((e) => e.toLowerCase() === ext)) {
      return true;
    }
    return false;
  });
}

export function acceptToInputAttr(accept?: Accept): string | undefined {
  if (!accept) return undefined;
  const tokens: string[] = [];
  for (const [mime, exts] of Object.entries(accept)) {
    if (mime) tokens.push(mime);
    if (exts?.length) tokens.push(...exts);
  }
  return tokens.length > 0 ? tokens.join(",") : undefined;
}
