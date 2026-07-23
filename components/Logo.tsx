export default function Logo({
  size = 24,
  withText = true,
  textSize = 14.5,
}: {
  size?: number;
  withText?: boolean;
  textSize?: number;
}) {
  return (
    <span className="inline-flex items-center gap-[9px]">
      <span
        className="grad inline-flex items-center justify-center"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.29),
          boxShadow: "0 6px 20px rgba(99,102,241,.4)",
        }}
      >
        <svg
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          viewBox="0 0 24 24"
          fill="#0a0a12"
          aria-hidden
        >
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
          <path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
        </svg>
      </span>
      {withText && (
        <span
          className="font-semibold tracking-[-0.01em]"
          style={{ fontSize: textSize }}
        >
          MicroManus
        </span>
      )}
    </span>
  );
}
