"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

export default function Composer({
  disabled,
  running,
  onSend,
  onCancel,
}: {
  disabled: boolean;
  running: boolean;
  onSend: (content: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  const send = async () => {
    const content = text.trim();
    if (!content || disabled || running) return;
    setText("");
    try {
      await onSend(content);
    } catch {
      setText(content); // restore on failure
    }
  };

  return (
    <div className="shrink-0 px-7 pb-5 pt-[14px]">
      <div className="max-w-[760px] mx-auto">
        <div
          className="flex items-end gap-[10px] rounded-2xl pl-4 pr-[6px] py-[6px]"
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
