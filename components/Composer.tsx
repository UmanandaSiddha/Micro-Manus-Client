"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import { apiUrl } from "@/lib/api";

interface Attachment {
  id: string;
  filename: string;
  mime: string;
  uploading?: boolean;
  error?: boolean;
}

export default function Composer({
  disabled,
  running,
  onSend,
  onCancel,
}: {
  disabled: boolean;
  running: boolean;
  onSend: (content: string, attachmentIds: string[]) => Promise<void>;
  onCancel?: () => void;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const tmpId = `tmp-${Math.random().toString(36).slice(2)}`;
      setAttachments((a) => [...a, { id: tmpId, filename: file.name, mime: file.type, uploading: true }]);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(apiUrl("/api/uploads"), {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!res.ok) throw new Error(String(res.status));
        const saved = (await res.json()) as { id: string; filename: string; mime: string };
        setAttachments((a) => a.map((x) => (x.id === tmpId ? { ...saved } : x)));
      } catch {
        setAttachments((a) => a.map((x) => (x.id === tmpId ? { ...x, uploading: false, error: true } : x)));
      }
    }
  };

  const send = async () => {
    const content = text.trim();
    const ready = attachments.filter((a) => !a.uploading && !a.error);
    if ((!content && !ready.length) || disabled || running) return;
    setText("");
    setAttachments([]);
    try {
      await onSend(content, ready.map((a) => a.id));
    } catch {
      setText(content); // restore on failure
      setAttachments(ready);
    }
  };

  const canAttach = !disabled && !running;

  return (
    <div className="shrink-0 px-7 pb-5 pt-[14px]">
      <div className="max-w-[760px] mx-auto">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="flex items-center gap-2 rounded-lg px-[10px] py-[6px] text-[12px]"
                style={{
                  border: `1px solid ${a.error ? "rgba(255,90,90,.3)" : "rgba(255,255,255,.1)"}`,
                  background: a.error ? "rgba(120,30,30,.14)" : "rgba(255,255,255,.04)",
                }}
              >
                {a.uploading ? (
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ border: "2px solid rgba(129,140,248,.3)", borderTopColor: "#818cf8", animation: "spin .7s linear infinite" }}
                  />
                ) : (
                  <Icon name="file-text" size={13} className={a.error ? "text-[#ff8a8a]" : "text-accent2"} />
                )}
                <span className="max-w-[180px] truncate text-ink-2">{a.filename}</span>
                <button
                  onClick={() => setAttachments((list) => list.filter((x) => x.id !== a.id))}
                  className="text-mut-3 hover:text-[#ff7a7a] bg-transparent border-none cursor-pointer flex items-center"
                >
                  <Icon name="x" size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div
          className="flex items-end gap-[10px] rounded-2xl pl-2 pr-[6px] py-[6px]"
          style={{
            border: focused ? "1px solid rgba(129,140,248,.45)" : "1px solid rgba(255,255,255,.11)",
            background: "rgba(20,20,26,.7)",
            backdropFilter: "blur(16px)",
            boxShadow: focused
              ? "0 0 0 3px rgba(129,140,248,.12), 0 8px 30px -8px rgba(0,0,0,.5)"
              : "0 8px 30px -8px rgba(0,0,0,.5)",
            transition: "border-color .15s, box-shadow .15s",
          }}
        >
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={!canAttach}
            title="Attach files (PDF, text, CSV, JSON…)"
            className="w-[34px] h-[34px] rounded-[10px] btn-ghost flex items-center justify-center self-end mb-[1px] disabled:opacity-40"
          >
            <Icon name="paperclip" size={16} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={running ? "Research in progress…" : "Ask MicroManus to research anything…"}
            disabled={disabled || running}
            rows={2}
            className="flex-1 bg-transparent border-none resize-none text-[14.5px] leading-[1.5] py-[10px] max-h-[120px] disabled:opacity-60"
          />
          <div className="flex items-center gap-[6px] pb-1">
            {running && onCancel ? (
              <button
                onClick={onCancel}
                className="h-[34px] px-[14px] rounded-[10px] cursor-pointer text-[12.5px] font-semibold text-[#ff8a8a] flex items-center gap-[6px]"
                style={{ border: "1px solid rgba(255,90,90,.3)", background: "rgba(120,30,30,.15)" }}
              >
                <Icon name="stop" size={12} />
                Stop
              </button>
            ) : (
              <button
                onClick={() => void send()}
                disabled={disabled || running || !text.trim()}
                className="w-[34px] h-[34px] rounded-[10px] border-none cursor-pointer grad text-[#0a0a12] flex items-center justify-center disabled:opacity-40"
                style={{ boxShadow: "0 4px 14px rgba(99,102,241,.4)" }}
                title="Send"
              >
                <Icon name="arrow-up" size={17} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>
        <div className="text-center mt-[9px] text-[11px] text-mut-4">
          1 credit per research run · failed runs refund automatically · verify important results
        </div>
      </div>
    </div>
  );
}
