// ============ Schemas 共享加载器 ============
// 所有组件共用同一份 schema 列表 + 用户配置,避免重复请求
// 用法: const schemas = await window.loadSchemas();
//       后端 schema 文件夹下新增 json 会被自动发现,前端 0 改动

let _schemasPromise = null;

window.loadSchemas = function loadSchemas() {
  if (_schemasPromise) return _schemasPromise;

  _schemasPromise = (async () => {
    // 1. 列出 schema 文件
    let list = [];
    try {
      const data = await window.kkApi.listSchemas();
      list = Array.isArray(data) ? data : (data.items || []);
      // product.json 不是表单 schema,过滤掉
      list = list.filter((s) => s.name && s.name !== "product.json");
    } catch (e) {
      console.warn("listSchemas 失败,使用默认列表:", e.message);
      list = [{ name: "kubernetes.json" }];
    }

    // 2. 并发拉每个 schema 内容
    const schemas = (await Promise.all(
      list.map(async (s) => {
        try {
          const raw = await window.kkApi.getSchema(s.name);
          // 后端可能返回 { dataSchema, uiSchema, playbookPath } 或裸 schema
          const dataSchema    = raw?.dataSchema    || raw;
          const uiSchema      = raw?.uiSchema      || {};
          const playbookPath  = raw?.playbookPath  || {};
          return { name: s.name, dataSchema, uiSchema, playbookPath };
        } catch (e) {
          console.warn(`getSchema(${s.name}) 失败:`, e.message);
          return null;
        }
      })
    )).filter(Boolean);

    // 3. 全失败时回退到内置 schema
    if (!schemas.length && window.FALLBACK_SCHEMA) {
      schemas.push({
        name: "kubernetes.json",
        dataSchema: window.FALLBACK_SCHEMA.dataSchema,
        uiSchema: window.FALLBACK_SCHEMA.uiSchema,
      });
    }

    // 4. 按 priority 排序,数字小的在前(kubernetes priority=1 排首位)
    schemas.sort((a, b) =>
      (a.dataSchema?.priority ?? 999) - (b.dataSchema?.priority ?? 999)
    );

    return schemas;
  })();

  return _schemasPromise;
};

// 强制重新加载 — 后端 schema 文件更新后调用
window.reloadSchemas = function reloadSchemas() {
  _schemasPromise = null;
  return window.loadSchemas();
};

// 从 values 或 schema 默认值里找版本号(用于 InstallPreview 展示)
window.extractVersion = function extractVersion(values, schema) {
  const probe = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    for (const key of ["kube_version", "version", "image_tag"]) {
      if (typeof obj[key] === "string") return obj[key];
    }
    for (const v of Object.values(obj)) {
      const hit = probe(v);
      if (hit) return hit;
    }
    return null;
  };
  return probe(values) || probe(extractDefaultsFromSchema(schema)) || "";
};

// 辅助: 从 schema 的 default 字段递归提取一棵默认值树
function extractDefaultsFromSchema(schema) {
  if (!schema || typeof schema !== "object") return null;
  if (schema.type === "object" && schema.properties) {
    const obj = {};
    for (const [k, sub] of Object.entries(schema.properties)) {
      const v = extractDefaultsFromSchema(sub);
      if (v !== null && (typeof v !== "object" || Object.keys(v).length)) obj[k] = v;
      else if (sub.default !== undefined) obj[k] = sub.default;
    }
    return obj;
  }
  return schema.default ?? null;
}
