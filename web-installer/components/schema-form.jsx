// ============ JSON Schema → 表单字段 渲染 ============

function getDeep(obj, path) {
  let cur = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[k];
  }
  return cur;
}

function setDeep(obj, path, value) {
  if (!path.length) return value;
  const [head, ...rest] = path;
  return { ...obj, [head]: setDeep(obj?.[head] || {}, rest, value) };
}

// 渲染整个 schema(object)→ 多个 field-group
function SchemaForm({ schema, values, onChange, uiSchema, rootPath = [] }) {
  if (!schema || schema.type !== "object" || !schema.properties) return null;
  return (
    <>
      {Object.entries(schema.properties).map(([key, sub]) => (
        <SchemaField
          key={key}
          name={key}
          schema={sub}
          values={values}
          onChange={onChange}
          required={schema.required?.includes(key)}
          uiSchema={uiSchema?.fields?.[key] || uiSchema?.[key]}
          path={[...rootPath, key]}
        />
      ))}
    </>
  );
}

function SchemaField({ name, schema, values, onChange, required, uiSchema, path }) {
  const title = schema.title || name;
  const desc = schema.description;
  const raw = getDeep(values, path);
  const value = raw !== undefined ? raw : schema.default;

  // 嵌套对象 → 分组
  if (schema.type === "object" && schema.properties) {
    return (
      <div className="field-group">
        <h4 className="field-group-title">{title}</h4>
        <SchemaForm
          schema={schema}
          values={values}
          onChange={onChange}
          uiSchema={uiSchema}
          rootPath={path}
        />
      </div>
    );
  }

  const set = (v) => onChange(path, v);
  const uiProps = uiSchema?.["ui:props"] || {};

  if (schema.type === "boolean") {
    return (
      <div className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          id={path.join(".")}
          type="checkbox"
          checked={!!value}
          onChange={(e) => set(e.target.checked)}
        />
        <label htmlFor={path.join(".")} className="field-label" style={{ margin: 0 }}>
          {title}
        </label>
      </div>
    );
  }

  if (Array.isArray(schema.enum)) {
    const names = schema.enumNames || schema.enum;
    return (
      <div className="field">
        <label className={`field-label ${required ? "field-required" : ""}`}>{title}</label>
        <select className="select" value={value ?? ""} onChange={(e) => set(e.target.value)}>
          {schema.enum.map((v, i) => (
            <option key={v} value={v}>{names[i]}</option>
          ))}
        </select>
        {desc && <div className="field-hint">{desc}</div>}
      </div>
    );
  }

  const inputType = uiProps.type || (schema.type === "integer" ? "number" : "text");
  const [showPwd, setShowPwd] = React.useState(false);

  const inputEl = inputType === "password" ? (
    <div className="password-input">
      <input
        className="input"
        type={showPwd ? "text" : "password"}
        value={value ?? ""}
        onChange={(e) => set(e.target.value)}
      />
      <span className="eye" onClick={() => setShowPwd((s) => !s)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      </span>
    </div>
  ) : (
    <input
      className="input"
      type={inputType}
      value={value ?? ""}
      min={schema.minimum}
      max={schema.maximum}
      onChange={(e) =>
        set(schema.type === "integer" ? +e.target.value : e.target.value)
      }
    />
  );

  return (
    <div className="field">
      <label className={`field-label ${required ? "field-required" : ""}`}>{title}</label>
      {inputEl}
      {desc && <div className="field-hint">{desc}</div>}
    </div>
  );
}

window.SchemaForm = SchemaForm;
window.getDeep = getDeep;
window.setDeep = setDeep;
