// 安装预览 — 数据驱动: 从 schemas 自动生成要装的组件列表
// 后端 schema/ 下加一个 json 文件,这里自动多一条
function InstallPreview() {
  const [schemas, setSchemas] = React.useState([]);
  const [config, setConfig] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const list = await window.loadSchemas();
      let cfg = {};

      // 优先从后端加载（config.json 是权威数据源）
      try {
        const remote = await window.kkApi.getSchemaConfig();
        // 判断是否真的返回了 schema 配置数据（必须有 schema 文件名作为 key）
        if (remote && typeof remote === "object") {
          const hasSchemaKey = list.some((s) => s.name in remote);
          if (hasSchemaKey) {
            cfg = remote;
            localStorage.setItem("kkSchemaConfig", JSON.stringify(remote));
          }
        }
      } catch (e) {
        console.warn("[InstallPreview] getSchemaConfig 失败:", e?.message);
      }

      // 后端没有数据时，从 localStorage 读取
      if (!Object.keys(cfg).length) {
        try {
          const local = localStorage.getItem("kkSchemaConfig");
          if (local) cfg = JSON.parse(local);
        } catch (_) {}
      }

      // 调试：打印实际读取到的配置摘要
      for (const s of list) {
        const vals = cfg[s.name];
        const version = vals ? window.extractVersion(vals, s.dataSchema) : "(no config)";
        console.log(`[InstallPreview] schema=${s.name}, hasConfig=${!!vals}, version=${version}`);
      }

      setSchemas(list);
      setConfig(cfg);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <section className="section">
        <div className="config-card" style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 48 }}>
          加载安装清单...
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <h3 className="section-title">安装所需组件</h3>

      <div className="component-list">
        {schemas.map((s) => {
          const ds = s.dataSchema || {};
          const values = config[s.name] || {};
          const name = ds.title || s.name.replace(/\.json$/, "");
          const desc = ds.description || "";
          const namespace = ds.namespace || "default";
          const version = window.extractVersion(values, ds);

          return (
            <div key={s.name} className="component-row">
              <div className="component-logo">
                {ds.logo ? (
                  <img src={ds.logo} alt={name} width={40} height={40} />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: "var(--primary-100, #dbeafe)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--primary-600, #2563eb)", fontWeight: 600, fontSize: 14,
                  }}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="component-meta primary">
                <div className="component-name">{name}</div>
                <div className="component-desc">{desc}</div>
              </div>

              {version && (
                <div className="component-meta">
                  <div className="component-value">{version}</div>
                  <div className="component-key">版本</div>
                </div>
              )}

              <div className="component-meta">
                <div className="component-value">{namespace}</div>
                <div className="component-key">命名空间</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

window.InstallPreview = InstallPreview;
