// Tweaks 面板 — 主色调切换
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": "blue-500",
  "density": "comfortable"
}/*EDITMODE-END*/;

// 4 种蓝色方案: 浅(天蓝) / 标准 / 靛蓝 / 深海
const PALETTES = {
  "blue-400": { name: "天蓝", main: "#60a5fa", dark: "#3b82f6", light: "#dbeafe", lighter: "#eff6ff", deep: "#1d4ed8" },
  "blue-500": { name: "标准蓝", main: "#3b82f6", dark: "#2563eb", light: "#bfdbfe", lighter: "#eff6ff", deep: "#1d4ed8" },
  "indigo":   { name: "靛蓝", main: "#6366f1", dark: "#4f46e5", light: "#c7d2fe", lighter: "#eef2ff", deep: "#3730a3" },
  "sky":      { name: "天空", main: "#0ea5e9", dark: "#0284c7", light: "#bae6fd", lighter: "#f0f9ff", deep: "#075985" },
};

function TweaksPanel() {
  const [visible, setVisible] = React.useState(false);
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);

  // 监听 host 消息
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "__activate_edit_mode") setVisible(true);
      if (e.data?.type === "__deactivate_edit_mode") setVisible(false);
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  // 应用调色板到 CSS vars
  React.useEffect(() => {
    const p = PALETTES[tweaks.primary] || PALETTES["blue-500"];
    const root = document.documentElement;
    root.style.setProperty("--primary-50", p.lighter);
    root.style.setProperty("--primary-100", p.light);
    root.style.setProperty("--primary-200", p.light);
    root.style.setProperty("--primary-300", p.main);
    root.style.setProperty("--primary-400", p.main);
    root.style.setProperty("--primary-500", p.main);
    root.style.setProperty("--primary-600", p.dark);
    root.style.setProperty("--primary-700", p.deep);

    // 密度
    if (tweaks.density === "compact") {
      root.style.setProperty("--field-pad", "6px 10px");
    }
  }, [tweaks]);

  const setKey = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: { [k]: v } },
      "*"
    );
  };

  const close = () => {
    setVisible(false);
    window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*");
  };

  if (!visible) return null;

  return (
    <div className="tweaks-panel">
      <div className="tweaks-title">
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icons.Sliders /> Tweaks
        </span>
        <span className="tweaks-close" onClick={close}>×</span>
      </div>

      <div className="tweak-row">
        <span>主色</span>
        <div className="swatches">
          {Object.entries(PALETTES).map(([k, p]) => (
            <div
              key={k}
              className={`swatch ${tweaks.primary === k ? "active" : ""}`}
              style={{ background: p.main }}
              title={p.name}
              onClick={() => setKey("primary", k)}
            />
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <span>密度</span>
        <div className="segmented" style={{ margin: 0 }}>
          <div
            className={`segmented-item ${tweaks.density === "comfortable" ? "active" : ""}`}
            onClick={() => setKey("density", "comfortable")}
          >
            舒适
          </div>
          <div
            className={`segmented-item ${tweaks.density === "compact" ? "active" : ""}`}
            onClick={() => setKey("density", "compact")}
          >
            紧凑
          </div>
        </div>
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
        切换主色实时预览,设置会自动持久化。
      </p>
    </div>
  );
}

window.TweaksPanel = TweaksPanel;
