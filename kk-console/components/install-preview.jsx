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
      try { cfg = (await window.kkApi.getSchemaConfig()) || {}; } catch (e) { cfg = {}; }
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
