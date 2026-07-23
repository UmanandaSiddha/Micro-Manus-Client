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
        className="grad inline-block"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.29),
          boxShadow: "0 6px 20px rgba(99,102,241,.4)",
        }}
      />
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
