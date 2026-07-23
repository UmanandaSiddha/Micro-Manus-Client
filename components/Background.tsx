/** Ambient blobs + grid from the design — sits behind every screen. */
export default function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute rounded-full"
        style={{
          top: "-18%",
          left: "8%",
          width: "52vw",
          height: "52vw",
          background: "radial-gradient(circle, rgba(99,102,241,.20), transparent 62%)",
          filter: "blur(38px)",
          animation: "floatBlob 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: "-22%",
          right: "2%",
          width: "46vw",
          height: "46vw",
          background: "radial-gradient(circle, rgba(34,211,238,.13), transparent 62%)",
          filter: "blur(40px)",
          animation: "floatBlob 22s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: "30%",
          right: "26%",
          width: "34vw",
          height: "34vw",
          background: "radial-gradient(circle, rgba(167,139,250,.12), transparent 62%)",
          filter: "blur(46px)",
          animation: "floatBlob 26s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 40%, #000, transparent 82%)",
        }}
      />
    </div>
  );
}
