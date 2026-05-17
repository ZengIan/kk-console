// 集群配置表单 — 完全数据驱动
//   - 通过 listSchemas 自动发现所有可用 schema(kubernetes.json / camp.json / ...)
//   - 每个 schema 渲染为一个 tab,各自维护表单值
//   - 保存时整体 map 提交: { "kubernetes.json": {...}, "camp.json": {...} }
//   - 新增组件: 后端 schema/ 目录扔一个 .json 即可,前端 0 改动

function ClusterForm({ saveRef }) {
  const [schemas, setSchemas] = React.useState([]);     // [{ name, dataSchema, uiSchema }]
  const [activeName, setActiveName] = React.useState(null);
  const [mode, setMode] = React.useState("form");
  const [valuesMap, setValuesMap] = React.useState({}); // { name → values }
  const [yamlMap, setYamlMap] = React.useState({});     // { name → yaml text }
  const [loading, setLoading] = React.useState(true);
  const [saveError, setSaveError] = React.useState(null);

  // 初次加载: 拉 schemas + 已保存 config
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await window.loadSchemas();

      let cfg = {};
      try {
        cfg = (await window.kkApi.getSchemaConfig()) || {};
      } catch (e) {
        cfg = {};
      }

      const vMap = {};
      const yMap = {};
      for (const s of list) {
        const saved = cfg[s.name];
        const initial = saved && Object.keys(saved).length
          ? saved
          : extractDefaults(s.dataSchema);
        vMap[s.name] = initial;
        yMap[s.name] = jsonToYaml(initial);
      }

      if (cancelled) return;
      setSchemas(list);
      setActiveName(list[0]?.name || null);
      setValuesMap(vMap);
      setYamlMap(yMap);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // values 变化时同步当前 tab 的 yaml(form 模式下)
  React.useEffect(() => {
    if (!activeName || mode !== "form") return;
    setYamlMap((prev) => ({ ...prev, [activeName]: jsonToYaml(valuesMap[activeName] || {}) }));
  }, [valuesMap, mode, activeName]);

  // 保存: 整体 map 提交到后端
  const saveConfig = React.useCallback(async () => {
    if (!Object.keys(valuesMap).length) return;
    setSaveError(null);
    try {
      await window.kkApi.saveSchemaConfig(valuesMap);
    } catch (e) {
      console.warn("保存配置失败:", e.message);
      setSaveError(e.message);
      throw e;
    }
  }, [valuesMap]);

  React.useEffect(() => {
    if (saveRef) saveRef.current = saveConfig;
  }, [saveRef, saveConfig]);

  // YAML 直接编辑 → 反向同步当前 tab 的 values
  const onYamlChange = (text) => {
    setYamlMap((prev) => ({ ...prev, [activeName]: text }));
    try {
      const parsed = window.parseYaml(text);
      setValuesMap((prev) => ({ ...prev, [activeName]: parsed }));
    } catch (e) {
      // 语法错误不阻断文本编辑
    }
  };

  const onFieldChange = (path, v) => {
    setValuesMap((prev) => ({
      ...prev,
      [activeName]: setDeep(prev[activeName] || {}, path, v),
    }));
  };

  if (loading) {
    return (
      <section className="section">
        <div className="config-card" style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 48 }}>
          加载安装模块配置...
        </div>
      </section>
    );
  }

  const active = schemas.find((s) => s.name === activeName);
  if (!active) {
    return (
      <section className="section">
        <div className="config-card" style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 48 }}>
          未发现可用配置 Schema
        </div>
      </section>
    );
  }

  const values = valuesMap[activeName] || {};
  const yaml   = yamlMap[activeName]   || "";

  return (
    <section className="section">
      <h3 className="section-title">安装配置</h3>

      {/* tabs — schema 列表动态生成 */}
      <div className="tabs">
        {schemas.map((s) => (
          <div
            key={s.name}
            className={`tab ${activeName === s.name ? "active" : ""}`}
            onClick={() => setActiveName(s.name)}
          >
            {s.dataSchema?.title || s.name.replace(/\.json$/, "")}
          </div>
        ))}
      </div>

      <div className="segmented">
        <div className={`segmented-item ${mode === "form" ? "active" : ""}`} onClick={() => setMode("form")}>
          表单模式
        </div>
        <div className={`segmented-item ${mode === "yaml" ? "active" : ""}`} onClick={() => {
          if (activeName) {
            setYamlMap((prev) => ({ ...prev, [activeName]: jsonToYaml(valuesMap[activeName] || {}) }));
          }
          setMode("yaml");
        }}>
          YAML 模式
        </div>
      </div>

      {mode === "form" ? (
        <div className="config-card">
          <SchemaForm
            schema={active.dataSchema}
            values={values}
            onChange={onFieldChange}
            uiSchema={active.uiSchema}
          />
        </div>
      ) : (
        <YamlEditor value={yaml} onChange={onYamlChange} />
      )}

      {saveError && (
        <div style={{ marginTop: 8, color: "var(--danger, #ef4444)", fontSize: 13 }}>
          保存失败: {saveError}
        </div>
      )}
    </section>
  );
}

// 从 schema 提取所有 default 值,构造初始 values 对象
function extractDefaults(schema) {
  if (!schema) return {};
  if (schema.type === "object" && schema.properties) {
    const obj = {};
    for (const [k, sub] of Object.entries(schema.properties)) {
      const v = extractDefaults(sub);
      if (v !== undefined && (typeof v !== "object" || Object.keys(v).length)) {
        obj[k] = v;
      } else if (sub.default !== undefined) {
        obj[k] = sub.default;
      }
    }
    return obj;
  }
  return schema.default;
}

// 把 values 对象序列化成 YAML 文本(浅层缩进 + 标量行)
function jsonToYaml(obj, indent = 0) {
  if (obj == null || typeof obj !== "object") return String(obj);
  const lines = [];
  const pad = "  ".repeat(indent);
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) {
      lines.push(`${pad}${k}: null`);
    } else if (typeof v === "object" && !Array.isArray(v)) {
      lines.push(`${pad}${k}:`);
      lines.push(jsonToYaml(v, indent + 1));
    } else {
      lines.push(`${pad}${k}: ${v}`);
    }
  }
  return lines.join("\n");
}

window.ClusterForm = ClusterForm;
window.extractDefaults = extractDefaults;
window.jsonToYaml = jsonToYaml;
