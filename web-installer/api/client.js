// ============ API 客户端 ============
// 同源访问 kk web 后端:
//   /resources/...                          — Schema / IP / Config
//   /kapis/kubekey.kubesphere.io/v1/...     — Inventory / Playbook

const API_BASE = "";   // 同源, 空前缀
const KAPIS = `${API_BASE}/kapis/kubekey.kubesphere.io/v1`;
const RES = `${API_BASE}/resources`;

// 全局: 是否启用 mock(后端没起时回退到本地静态数据)
window.__USE_MOCK__ = window.__USE_MOCK__ ?? true;

async function http(method, url, body, headers = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${url} → ${res.status} ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

// 自动 mock 包装: 真实请求失败时回退到 mockFn 返回
function withFallback(realFn, mockFn) {
  return async (...args) => {
    if (window.__USE_MOCK__) {
      try {
        return await realFn(...args);
      } catch (e) {
        console.warn("[api] fallback to mock:", e.message);
        return mockFn(...args);
      }
    }
    return realFn(...args);
  };
}

// ============ Resources ============
const api = {
  // Schema 列表
  listSchema: withFallback(
    (cluster = "default") =>
      http("GET", `${RES}/schema?cluster=${cluster}&limit=50`),
    () => MOCKS.listSchema()
  ),

  // 获取单个 schema
  getSchema: withFallback(
    (name) => http("GET", `${RES}/schema/${name}`),
    (name) => MOCKS.getSchema(name)
  ),

  // 保存配置
  postConfig: withFallback(
    (body, cluster = "default", inventory = "default") =>
      http("POST", `${RES}/schema/config?cluster=${cluster}&inventory=${inventory}`, body),
    (body) => MOCKS.postConfig(body)
  ),

  // 读取配置
  getConfig: withFallback(
    () => http("GET", `${RES}/schema/config`),
    () => MOCKS.getConfig()
  ),

  // 节点扫描: IP CIDR 列表
  listIP: withFallback(
    (cidr, sshPort = 22) =>
      http("GET", `${RES}/ip?cidr=${encodeURIComponent(cidr)}&sshPort=${sshPort}`),
    (cidr) => MOCKS.listIP(cidr)
  ),

  // SSH 预检
  preCheckHosts: withFallback(
    (hosts) => http("POST", `${RES}/ip`, hosts),
    (hosts) => MOCKS.preCheckHosts(hosts)
  ),

  // ============ Inventories ============
  listInventories: withFallback(
    (ns) =>
      http("GET", ns ? `${KAPIS}/namespaces/${ns}/inventories` : `${KAPIS}/inventories`),
    () => MOCKS.listInventories()
  ),

  getInventory: withFallback(
    (ns, name) => http("GET", `${KAPIS}/namespaces/${ns}/inventories/${name}`),
    (ns, name) => MOCKS.getInventory(ns, name)
  ),

  listInventoryHosts: withFallback(
    (ns, name) => http("GET", `${KAPIS}/namespaces/${ns}/inventories/${name}/hosts`),
    (ns, name) => MOCKS.listInventoryHosts(ns, name)
  ),

  createInventory: withFallback(
    (body) => http("POST", `${KAPIS}/inventories`, body),
    (body) => MOCKS.createInventory(body)
  ),

  patchInventory: withFallback(
    (ns, name, patch, promise = true) =>
      http(
        "PATCH",
        `${KAPIS}/namespaces/${ns}/inventories/${name}?promise=${promise}`,
        patch,
        { "Content-Type": "application/merge-patch+json" }
      ),
    (ns, name, patch) => MOCKS.patchInventory(ns, name, patch)
  ),

  // ============ Playbooks ============
  listPlaybooks: withFallback(
    (ns) =>
      http("GET", ns ? `${KAPIS}/namespaces/${ns}/playbooks` : `${KAPIS}/playbooks`),
    () => MOCKS.listPlaybooks()
  ),

  getPlaybook: withFallback(
    (ns, name) => http("GET", `${KAPIS}/namespaces/${ns}/playbooks/${name}`),
    (ns, name) => MOCKS.getPlaybook(ns, name)
  ),

  createPlaybook: withFallback(
    (body) => http("POST", `${KAPIS}/playbooks?promise=true`, body),
    (body) => MOCKS.createPlaybook(body)
  ),

  deletePlaybook: withFallback(
    (ns, name) => http("DELETE", `${KAPIS}/namespaces/${ns}/playbooks/${name}`),
    () => ({ message: "success" })
  ),

  getPlaybookLog: withFallback(
    (ns, name) => http("GET", `${KAPIS}/namespaces/${ns}/playbooks/${name}/log`),
    (ns, name) => MOCKS.getPlaybookLog(ns, name)
  ),
};

window.api = api;
