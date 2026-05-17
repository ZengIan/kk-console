// 集群配置表单 — 数据驱动: 从后端拉 schema, 渲染表单 / YAML
// 数据流:
//   schema (静态)  ←- kkApi.getSchema()  或  FALLBACK_SCHEMA
//   values (动态)  ←- kkApi.getSchemaConfig() 初始,用户编辑实时更新
//   YAML 文本       ←- 由 values 序列化, 编辑时反向解析回 values

function ClusterForm() {
  const [tab, setTab] = React.useState("kubernetes");
  const [mode, setMode] = React.useState("form"); // form | yaml
  const [schema, setSchema] = React.useState(null);
  const [uiSchema, setUiSchema] = React.useState({});
  const [values, setValues] = React.useState({});
  const [yaml, setYaml] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // 初次加载 schema + 已保存 config
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      let s, ui, cfg;
      try {
        const data = await window.kkApi.getSchema("kubernetes.json");
        s = data.dataSchema;
        ui = data.uiSchema || {};
      } catch (e) {
        console.warn("拉取 schema 失败,使用内置 fallback:", e.message);
        s = window.FALLBACK_SCHEMA.dataSchema;
        ui = window.FALLBACK_SCHEMA.uiSchema;
      }

      try {
        cfg = await window.kkApi.getSchemaConfig();
        // 后端返回的可能是 { "kubernetes.json": {...} }
        if (cfg && cfg["kubernetes.json"]) cfg = cfg["kubernetes.json"];
      } catch (e) {
        cfg = null;
      }

      if (cancelled) return;
      const initial = cfg && Object.keys(cfg).length ? cfg : extractDefaults(s);
      setSchema(s);
      setUiSchema(ui);
      setValues(initial);
      setYaml(jsonToYaml(initial));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // values 改变 → 同步 yaml(只在表单模式下,避免 yaml 编辑被打断)
  React.useEffect(() => {
    if (mode === "form") setYaml(jsonToYaml(values));
  }, [values, mode]);

  // YAML 直接编辑 → 反向同步 values
  const onYamlChange = (text) => {
    setYaml(text);
    try {
      const parsed = window.parseYaml(text);
      setValues(parsed);
    } catch (e) {
      // 语法错误时不更新 values,但保留文本编辑
    }
  };

  const onFieldChange = (path, v) => {
    setValues((prev) => setDeep(prev, path, v));
  };

  if (loading) {
    return (
      <section className="section">
        <div className="config-card" style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 48 }}>
          加载安装配置 Schema...
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <h3 className="section-title">安装配置</h3>

      <div className="tabs">
        <div className={`tab ${tab === "kubernetes" ? "active" : ""}`} onClick={() => setTab("kubernetes")}>
          {schema?.title || "Kubernetes"}
        </div>
      </div>

      <div className="segmented">
        <div className={`segmented-item ${mode === "form" ? "active" : ""}`} onClick={() => setMode("form")}>
          表单模式
        </div>
        <div className={`segmented-item ${mode === "yaml" ? "active" : ""}`} onClick={() => setMode("yaml")}>
          YAML 模式
        </div>
      </div>

      {mode === "form" ? (
        <div className="config-card">
          <SchemaForm schema={schema} values={values} onChange={onFieldChange} uiSchema={uiSchema} />
        </div>
      ) : (
        <YamlPreview yaml={yaml} onChange={onYamlChange} clusterName={values?.kubernetes?.cluster_name || "cluster"} />
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
