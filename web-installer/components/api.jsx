// ============ kk-console 后端 API 客户端 ============
// 对应 pkg/web/service.go 定义的路由
// 部署时前端和后端同源,所有调用都用相对路径

const API = {
  CORE: "/kapis/kubekey.kubesphere.io/v1",
  RES:  "/resources",
};

// 统一 fetch 封装 — 自动 JSON, 错误抛出
async function request(url, options = {}) {
  const opts = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };
  // body 自动序列化
  if (opts.body && typeof opts.body !== "string") {
    opts.body = JSON.stringify(opts.body);
  }
  const resp = await fetch(url, opts);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`${resp.status} ${resp.statusText}: ${text}`);
  }
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) return resp.json();
  return resp.text();
}

const kkApi = {
  // ============ Schema ============
  /** 列出所有 schema(Kubernetes / KubeSphere)*/
  listSchemas({ cluster = "default", page, limit, orderBy, ascending } = {}) {
    const q = new URLSearchParams({ cluster });
    if (page) q.set("page", page);
    if (limit) q.set("limit", limit);
    if (orderBy) q.set("orderBy", orderBy);
    if (ascending != null) q.set("ascending", ascending);
    return request(`${API.RES}/schema?${q}`);
  },

  /** 获取某个 schema 的完整 JSON Schema 定义 */
  getSchema(name) {
    return request(`${API.RES}/schema/${name}`);
  },

  /** 保存用户填写的表单值(对应 schema 内的字段) */
  saveSchemaConfig(payload, { cluster = "default", inventory = "default" } = {}) {
    const q = new URLSearchParams({ cluster, inventory });
    return request(`${API.RES}/schema/config?${q}`, {
      method: "POST",
      body: payload,
    });
  },

  /** 读取已保存的表单配置 */
  getSchemaConfig() {
    return request(`${API.RES}/schema/config`);
  },

  // ============ IP / 节点扫描 ============
  /** 扫描 CIDR 段内的可用 IP */
  scanIP({ cidr, sshPort = 22, page, limit } = {}) {
    const q = new URLSearchParams({ cidr });
    if (sshPort) q.set("sshPort", sshPort);
    if (page) q.set("page", page);
    if (limit) q.set("limit", limit);
    return request(`${API.RES}/ip?${q}`);
  },

  /** SSH 连接预检 */
  preCheckHosts(hosts) {
    return request(`${API.RES}/ip`, { method: "POST", body: hosts });
  },

  // ============ Inventory(主机清单) ============
  listInventories({ namespace, page, limit, orderBy, ascending } = {}) {
    const path = namespace
      ? `${API.CORE}/namespaces/${namespace}/inventories`
      : `${API.CORE}/inventories`;
    const q = new URLSearchParams();
    if (page) q.set("page", page);
    if (limit) q.set("limit", limit);
    if (orderBy) q.set("orderBy", orderBy);
    if (ascending != null) q.set("ascending", ascending);
    const s = q.toString();
    return request(s ? `${path}?${s}` : path);
  },

  getInventory(namespace, name) {
    return request(`${API.CORE}/namespaces/${namespace}/inventories/${name}`);
  },

  listInventoryHosts(namespace, name, opts = {}) {
    const q = new URLSearchParams();
    if (opts.page) q.set("page", opts.page);
    if (opts.limit) q.set("limit", opts.limit);
    if (opts.orderBy) q.set("orderBy", opts.orderBy);
    if (opts.ascending != null) q.set("ascending", opts.ascending);
    const s = q.toString();
    const url = `${API.CORE}/namespaces/${namespace}/inventories/${name}/hosts`;
    return request(s ? `${url}?${s}` : url);
  },

  createInventory(inv) {
    return request(`${API.CORE}/inventories`, { method: "POST", body: inv });
  },

  /** PATCH inventory — promise=true 会触发 host_check 流程 */
  patchInventory(namespace, name, patch, { promise = true, type = "merge" } = {}) {
    const ct = {
      merge:  "application/merge-patch+json",
      json:   "application/json-patch+json",
      apply:  "application/apply-patch+yaml",
    }[type] || "application/merge-patch+json";
    const q = new URLSearchParams({ promise: String(promise) });
    return request(
      `${API.CORE}/namespaces/${namespace}/inventories/${name}?${q}`,
      { method: "PATCH", body: patch, headers: { "Content-Type": ct } }
    );
  },

  // ============ Playbook(任务流) ============
  listPlaybooks(opts = {}) {
    const path = opts.namespace
      ? `${API.CORE}/namespaces/${opts.namespace}/playbooks`
      : `${API.CORE}/playbooks`;
    const q = new URLSearchParams();
    if (opts.page) q.set("page", opts.page);
    if (opts.limit) q.set("limit", opts.limit);
    if (opts.orderBy) q.set("orderBy", opts.orderBy);
    if (opts.ascending != null) q.set("ascending", opts.ascending);
    const s = q.toString();
    return request(s ? `${path}?${s}` : path);
  },

  createPlaybook(pb, { promise = true } = {}) {
    const q = new URLSearchParams({ promise: String(promise) });
    return request(`${API.CORE}/playbooks?${q}`, { method: "POST", body: pb });
  },

  getPlaybook(namespace, name, { watch = false } = {}) {
    const q = new URLSearchParams();
    if (watch) q.set("watch", "true");
    const s = q.toString();
    const url = `${API.CORE}/namespaces/${namespace}/playbooks/${name}`;
    return request(s ? `${url}?${s}` : url);
  },

  getPlaybookLog(namespace, name) {
    return request(`${API.CORE}/namespaces/${namespace}/playbooks/${name}/log`);
  },

  deletePlaybook(namespace, name) {
    return request(
      `${API.CORE}/namespaces/${namespace}/playbooks/${name}`,
      { method: "DELETE" }
    );
  },

  /** 流式读取 Playbook 日志 — 返回 ReadableStream reader */
  async streamPlaybookLog(namespace, name, onChunk, signal) {
    const url = `${API.CORE}/namespaces/${namespace}/playbooks/${name}/log`;
    const resp = await fetch(url, { signal });
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
  },

  /** Watch Playbook 状态变化 — 长轮询封装 */
  async watchPlaybook(namespace, name, onUpdate, { signal, intervalMs = 1500 } = {}) {
    while (!signal?.aborted) {
      try {
        const data = await this.getPlaybook(namespace, name);
        onUpdate(data);
        const phase = data?.status?.phase;
        if (phase === "Succeeded" || phase === "Failed") return data;
      } catch (e) {
        if (signal?.aborted) return;
        console.warn("watchPlaybook poll failed:", e);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  },
};

window.kkApi = kkApi;
