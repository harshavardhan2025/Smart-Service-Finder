

function SkeletonLoader({ type = "card", count = 1 }) {
  const shimmerAnimation = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;

  const itemStyle = {
    background: "linear-gradient(90deg, var(--bg-card-hover) 25%, var(--primary-light) 50%, var(--bg-card-hover) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite linear",
    borderRadius: "8px",
  };

  const renderSkeleton = (key) => {
    if (type === "circle") {
      return (
        <div
          key={key}
          style={{
            ...itemStyle,
            width: "60px",
            height: "60px",
            borderRadius: "50%",
          }}
        />
      );
    }

    if (type === "list") {
      return (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "16px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            marginBottom: "12px",
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          <div style={{ ...itemStyle, width: "50px", height: "50px", borderRadius: "50%" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ ...itemStyle, width: "40%", height: "14px" }} />
            <div style={{ ...itemStyle, width: "80%", height: "10px" }} />
          </div>
        </div>
      );
    }

    if (type === "profile") {
      return (
        <div
          key={key}
          style={{
            padding: "24px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "16px",
            border: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            width: "100%",
            maxWidth: "320px",
            boxSizing: "border-box"
          }}
        >
          <div style={{ ...itemStyle, width: "90px", height: "90px", borderRadius: "50%", marginBottom: "16px" }} />
          <div style={{ ...itemStyle, width: "60%", height: "16px", marginBottom: "8px" }} />
          <div style={{ ...itemStyle, width: "40%", height: "12px", marginBottom: "16px" }} />
          <div style={{ width: "100%", display: "flex", gap: "8px", justifyContent: "center" }}>
            <div style={{ ...itemStyle, width: "30%", height: "32px" }} />
            <div style={{ ...itemStyle, width: "30%", height: "32px" }} />
          </div>
        </div>
      );
    }

    // Default "card" shape
    return (
      <div
        key={key}
        style={{
          padding: "20px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "250px",
          flex: 1,
          boxSizing: "border-box"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...itemStyle, width: "120px", height: "16px" }} />
          <div style={{ ...itemStyle, width: "50px", height: "18px", borderRadius: "20px" }} />
        </div>
        <div style={{ ...itemStyle, width: "70%", height: "12px" }} />
        <div style={{ ...itemStyle, width: "90%", height: "12px" }} />
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <div style={{ ...itemStyle, width: "60px", height: "10px" }} />
          <div style={{ ...itemStyle, width: "80px", height: "10px" }} />
        </div>
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerAnimation }} />
      <div style={{ display: "flex", flexDirection: type === "list" ? "column" : "row", gap: "16px", flexWrap: "wrap", width: "100%" }}>
        {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
      </div>
    </>
  );
}

export default SkeletonLoader;
