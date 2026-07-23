"use client";

import { useEffect, useMemo, useState } from "react";
import Icon, { ARTIFACT_ICON } from "./Icon";
import Markdown from "./Markdown";
import { api, apiUrl } from "@/lib/api";
import type { ArtifactRef } from "@/lib/useThread";

export const ART_COLOR: Record<string, string> = {
  pdf: "#f472b6",
  html: "#22d3ee",
  csv: "#4ade80",
  md: "#818cf8",
  json: "#fbbf24",
  txt: "#9a9aa6",
};

/** Fetch the binary with credentials → object URL (cookie-safe in any CORS setup). */
function useBlobUrl(artifactId: string, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let revoke: string | null = null;
    let cancelled = false;
    void fetch(apiUrl(`/api/artifacts/${artifactId}/file`), { credentials: "include" })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((b) => {
        if (cancelled) return;
        revoke = URL.createObjectURL(b);
        setUrl(revoke);
      })
      .catch(() => !cancelled && setUrl(null));
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [artifactId, enabled]);
  return url;
}

function useArtifactContent(artifactId: string, enabled: boolean) {
  const [content, setContent] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void api<{ content: string | null }>(`/api/artifacts/${artifactId}`)
      .then((a) => !cancelled && setContent(a.content ?? ""))
      .catch(() => !cancelled && setContent(""));
    return () => {
      cancelled = true;
    };
  }, [artifactId, enabled]);
  return content;
}

function Spinner() {
  return (
    <div className="flex-1 grid place-items-center py-16">
      <div
        className="w-[18px] h-[18px] rounded-full"
        style={{
          border: "2px solid rgba(129,140,248,.3)",
          borderTopColor: "#818cf8",
          animation: "spin .7s linear infinite",
        }}
      />
    </div>
  );
}

function PdfPreview({ id }: { id: string }) {
  const url = useBlobUrl(id, true);
  if (!url) return <Spinner />;
  return (
    <iframe
      src={url}
      className="w-full h-full border-none rounded-[10px] bg-[#f6f5f2]"
      style={{ boxShadow: "0 20px 50px -12px rgba(0,0,0,.6)" }}
      title="PDF preview"
    />
  );
}

function HtmlPreview({ id, title }: { id: string; title: string }) {
  const content = useArtifactContent(id, true);
  if (content === null) return <Spinner />;
  return (
    <div
      className="rounded-[10px] overflow-hidden h-full flex flex-col"
      style={{ border: "1px solid rgba(255,255,255,.1)", boxShadow: "0 20px 50px -12px rgba(0,0,0,.6)" }}
    >
      <div
        className="flex items-center gap-[6px] px-3 py-[9px] shrink-0"
        style={{ background: "#1c1c22", borderBottom: "1px solid rgba(255,255,255,.07)" }}
      >
        <span className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
        <span
          className="flex-1 ml-2 px-[10px] py-1 rounded-md mono text-[10px] text-mut-2 truncate"
          style={{ background: "rgba(0,0,0,.3)" }}
        >
          {title.toLowerCase().replace(/\s+/g, "-")}.microm.site
        </span>
      </div>
      <iframe
        srcDoc={content}
        sandbox=""
        className="flex-1 w-full border-none bg-white"
        title="Website preview"
      />
    </div>
  );
}

function CsvPreview({ id }: { id: string }) {
  const content = useArtifactContent(id, true);
  const rows = useMemo(() => {
    if (!content) return [];
    // Simple CSV split — quoted commas are rare in agent output; good enough for preview.
    return content
      .trim()
      .split(/\r?\n/)
      .slice(0, 200)
      .map((line) => line.split(","));
  }, [content]);
  if (content === null) return <Spinner />;
  if (!rows.length) return <p className="text-mut text-sm p-4">Empty file.</p>;
  const [head, ...body] = rows;
  return (
    <div>
      <div className="rounded-[10px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,.09)" }}>
        <div
          className="flex px-3 py-[9px] mono text-[10.5px] text-mut-2"
          style={{ background: "rgba(34,211,238,.08)", borderBottom: "1px solid rgba(255,255,255,.08)" }}
        >
          <span className="w-[38px] shrink-0">#</span>
          {head.map((c, i) => (
            <span key={i} className="flex-1 truncate pr-2">{c}</span>
          ))}
        </div>
        {body.map((r, ri) => (
          <div
            key={ri}
            className="flex px-3 py-[9px] text-[12.5px] text-ink-2"
            style={{
              borderBottom: "1px solid rgba(255,255,255,.05)",
              background: ri % 2 ? "rgba(255,255,255,.015)" : "transparent",
            }}
          >
            <span className="w-[38px] shrink-0 mono text-mut-4">{ri + 1}</span>
            {r.map((c, ci) => (
              <span key={ci} className={`flex-1 truncate pr-2 mono ${ci === 1 ? "text-accent2" : ""}`}>
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="mono text-[10.5px] text-mut-3 mt-3">
        {body.length} rows · {head.length} columns
      </div>
    </div>
  );
}

function MarkdownPreview({ id }: { id: string }) {
  const content = useArtifactContent(id, true);
  if (content === null) return <Spinner />;
  return (
    <div
      className="rounded-[10px] p-[18px]"
      style={{ border: "1px solid rgba(255,255,255,.09)", background: "#0d0d12", animation: "stepIn .3s ease both" }}
    >
      <div className="prose-mm">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
}

function JsonPreview({ id }: { id: string }) {
  const content = useArtifactContent(id, true);
  if (content === null) return <Spinner />;
  let pretty = content;
  try {
    pretty = JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    /* show raw */
  }
  return (
    <pre
      className="rounded-[10px] p-[18px] mono text-xs leading-[1.7] text-ink-3 whitespace-pre-wrap break-all"
      style={{ border: "1px solid rgba(255,255,255,.09)", background: "#0d0d12" }}
    >
      {pretty}
    </pre>
  );
}

function TxtPreview({ id }: { id: string }) {
  const content = useArtifactContent(id, true);
  if (content === null) return <Spinner />;
  return (
    <pre
      className="rounded-[10px] p-[18px] mono text-xs leading-[1.85] text-ink-3 whitespace-pre-wrap"
      style={{ border: "1px solid rgba(255,255,255,.09)", background: "#0d0d12" }}
    >
      {content}
    </pre>
  );
}

/**
 * Artifact-specific preview panel: opens for ONE artifact — when the user
 * clicks its card or the agent just produced it. Not a gallery.
 */
export default function ArtifactPanel({
  artifact,
  onClose,
  overlay,
}: {
  artifact: ArtifactRef;
  onClose: () => void;
  overlay: boolean;
}) {
  const color = ART_COLOR[artifact.type] ?? "#818cf8";
  const fillHeight = artifact.type === "pdf" || artifact.type === "html";
  const [wide, setWide] = useState(false);

  return (
    <div
      className="shrink-0 overflow-hidden flex flex-col"
      style={{
        width: overlay
          ? `min(${wide ? 900 : 432}px, 92vw)`
          : wide
            ? "min(58vw, 900px)"
            : 432,
        transition: "width .25s ease",
        borderLeft: "1px solid rgba(255,255,255,.07)",
        background: "rgba(11,11,15,.96)",
        backdropFilter: "blur(14px)",
        ...(overlay
          ? { position: "absolute", right: 0, top: 0, bottom: 0, zIndex: 45, boxShadow: "-24px 0 60px rgba(0,0,0,.5)" }
          : {}),
        animation: "stepIn .25s ease both",
      }}
    >
      <div
        className="h-[53px] shrink-0 flex items-center gap-[10px] px-[14px]"
        style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}
      >
        <span
          className="w-[22px] h-[22px] rounded-md shrink-0 flex items-center justify-center"
          style={{ background: `${color}1f`, color }}
        >
          <Icon name={ARTIFACT_ICON[artifact.type] ?? "file-text"} size={13} />
        </span>
        <span className="text-[13px] font-semibold flex-1 truncate">{artifact.title}</span>
        <span className="mono text-[10px] uppercase text-mut-3">{artifact.type}</span>
        <button
          onClick={() => setWide((w) => !w)}
          className="btn-ghost w-7 h-7 rounded-lg flex items-center justify-center text-[#b9b9c4]"
          title={wide ? "Collapse panel" : "Expand panel"}
        >
          <Icon name={wide ? "collapse" : "expand"} size={14} />
        </button>
        <a
          href={apiUrl(`/api/artifacts/${artifact.id}/file`)}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost w-7 h-7 rounded-lg flex items-center justify-center text-[#b9b9c4]"
          title="Open in new tab"
        >
          <Icon name="external" size={14} />
        </a>
        <a
          href={apiUrl(`/api/artifacts/${artifact.id}/download`)}
          className="btn-ghost w-7 h-7 rounded-lg flex items-center justify-center text-[#b9b9c4]"
          title="Download"
        >
          <Icon name="download" size={14} />
        </a>
        <button
          onClick={onClose}
          className="btn-ghost w-7 h-7 rounded-lg flex items-center justify-center text-[#b9b9c4]"
          title="Close preview"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden p-[18px] ${fillHeight ? "flex flex-col" : ""}`}>
        {artifact.type === "pdf" && <PdfPreview id={artifact.id} />}
        {artifact.type === "html" && <HtmlPreview id={artifact.id} title={artifact.title} />}
        {artifact.type === "csv" && <CsvPreview id={artifact.id} />}
        {artifact.type === "md" && <MarkdownPreview id={artifact.id} />}
        {artifact.type === "json" && <JsonPreview id={artifact.id} />}
        {artifact.type === "txt" && <TxtPreview id={artifact.id} />}
      </div>
    </div>
  );
}
