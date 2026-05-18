// ============ 全局 Toast 通知 ============
function Toaster() {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    window.showToast = (message, type = "info", details = null) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, details, expanded: false }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), type === "error" ? 8000 : 4000);
    };
    return () => { delete window.showToast; };
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const toggleExpand = (id) => setToasts((prev) => prev.map((t) => t.id === id ? { ...t, expanded: !t.expanded } : t));

  if (!toasts.length) return null;

  const colors = {
    success: { bg: "#eff6ff", border: "#93c5fd", icon: "#2563eb", bar: "#2563eb" },
    error:   { bg: "#fef2f2", border: "#fca5a5", icon: "#dc2626", bar: "#dc2626" },
    info:    { bg: "#eff6ff", border: "#93c5fd", icon: "#2563eb", bar: "#2563eb" },
  };

  const icons = {
    success: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#2563eb" strokeWidth="1.4"/><path d="M5 8l2 2 4-4" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    error:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    info:    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  };

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 400, width: "100%" }}>
      {toasts.map((t) => {
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{
            background: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.bar}`,
            borderRadius: 8, padding: "12px 14px", boxShadow: "0 4px 12px rgba(0,0,0,.10)",
            animation: "slideIn .2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ color: c.icon, flexShrink: 0, marginTop: 1 }}>{icons[t.type] || icons.info}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.4 }}>{t.message}</div>
                {t.details && (
                  <>
                    <button
                      onClick={() => toggleExpand(t.id)}
                      style={{ fontSize: 11, color: c.icon, background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 4 }}
                    >
                      {t.expanded ? "收起详情 ▲" : "查看详情 ▼"}
                    </button>
                    {t.expanded && (
                      <pre style={{
                        marginTop: 6, padding: "8px 10px", background: "rgba(0,0,0,.04)",
                        borderRadius: 4, fontSize: 11, fontFamily: "var(--font-mono)",
                        color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-all",
                        maxHeight: 200, overflowY: "auto",
                      }}>{t.details}</pre>
                    )}
                  </>
                )}
              </div>
              <span onClick={() => dismiss(t.id)} style={{ cursor: "pointer", color: "#94a3b8", flexShrink: 0, fontSize: 16, lineHeight: 1 }}>×</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ Playbook 日志查看(通用) ============
function PlaybookLogModal({ namespace, name, title, onClose }) {
  const [phase, setPhase] = React.useState("Pending");
  const [log, setLog] = React.useState("");
  const logRef = React.useRef(null);

  React.useEffect(() => {
    if (!name || !namespace) return;
    const ctrl = new AbortController();

    window.kkApi.watchPlaybook(namespace, name, (data) => {
      const p = data?.status?.phase;
      if (p) setPhase(p);
    }, { signal: ctrl.signal, intervalMs: 2000 }).catch(() => {});

    window.kkApi.streamPlaybookLog(namespace, name, (chunk) => {
      setLog((prev) => prev + chunk);
    }, ctrl.signal).catch(() => {});

    return () => ctrl.abort();
  }, [namespace, name]);

  React.useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const phaseColor = {
    Succeeded: "var(--success)",
    Failed:    "var(--danger)",
    Running:   "var(--primary-500)",
  }[phase] || "var(--text-secondary)";

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal modal-lg" style={{ width: 900 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title || `Playbook: ${name}`}</h3>
          <span className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </span>
        </div>
        <div className="modal-body" style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Playbook:</span>
            <code style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{namespace}/{name}</code>
            <span style={{ fontSize: 13, fontWeight: 600, color: phaseColor }}>{phase}</span>
          </div>
          <div
            ref={logRef}
            style={{
              background: "#0d1117", color: "#e2e8f0",
              fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6,
              padding: "12px 16px", borderRadius: 8,
              minHeight: 480, maxHeight: 640, overflowY: "auto",
              whiteSpace: "pre-wrap", wordBreak: "break-all",
            }}
          >
            {log || "等待日志输出..."}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

// ============ Playbook 安装进度 ============
function InstallStep({ namespace, name, onDone }) {
  const [phase, setPhase] = React.useState("Pending");
  const [log, setLog] = React.useState("");
  const logRef = React.useRef(null);
  const [showAbortConfirm, setShowAbortConfirm] = React.useState(false);

  React.useEffect(() => {
    if (!name || !namespace) return;
    const ctrl = new AbortController();

    window.kkApi.watchPlaybook(namespace, name, (data) => {
      const p = data?.status?.phase;
      if (p) setPhase(p);
    }, { signal: ctrl.signal, intervalMs: 2000 }).catch(() => {});

    window.kkApi.streamPlaybookLog(namespace, name, (chunk) => {
      setLog((prev) => prev + chunk);
    }, ctrl.signal).catch(() => {});

    return () => ctrl.abort();
  }, [namespace, name]);

  React.useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const handleAbort = async () => {
    setShowAbortConfirm(false);
    try {
      await window.kkApi.deletePlaybook(namespace, name);
      setPhase("Failed");
      window.showToast?.("安装已强制终止", "error");
    } catch (e) {
      window.showToast?.("终止失败: " + e.message, "error");
    }
  };

  const phaseColor = {
    Succeeded: "var(--success, #22c55e)",
    Failed:    "var(--danger, #ef4444)",
    Running:   "var(--primary-500, #3b82f6)",
  }[phase] || "var(--text-secondary)";

  return (
    <section className="section">
      <h3 className="section-title">安装进度</h3>
      <div className="config-card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>状态:</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: phaseColor }}>{phase}</span>
          {phase === "Running" && (
            <>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>安装中,请勿关闭页面</span>
              <button
                className="btn btn-danger"
                style={{ marginLeft: "auto", fontSize: 12 }}
                onClick={() => setShowAbortConfirm(true)}
              >
                强制终止
              </button>
            </>
          )}
          {phase === "Succeeded" && (
            <button className="btn btn-primary" style={{ marginLeft: "auto", fontSize: 12 }} onClick={onDone}>
              安装完成,下一步
            </button>
          )}
        </div>
        <div
          ref={logRef}
          style={{
            background: "#0d1117", color: "#e2e8f0",
            fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6,
            padding: "12px 16px", borderRadius: 8,
            minHeight: 480, maxHeight: 640, overflowY: "auto",
            whiteSpace: "pre-wrap", wordBreak: "break-all",
          }}
        >
          {log || "等待日志输出..."}
        </div>
      </div>

      {/* 强制终止确认弹窗 */}
      {showAbortConfirm && (
        <ConfirmDialog
          title="强制终止安装"
          description="强制终止将直接终止当前安装流程，终止后需要重新安装部署。确定要终止吗？"
          confirmText="确认终止"
          cancelText="取消"
          onCancel={() => setShowAbortConfirm(false)}
          onConfirm={handleAbort}
        />
      )}
    </section>
  );
}

// ============ Inventory 持久化工具 ============

// 把 UI nodes 构建成符合后端 CRD 结构的 Inventory
// 宿主机字段: internal_ipv4 + connector.{ host, port(string), user, password, private_key_content }
function buildInventory(nodes) {
  const hosts = {};
  const masters = [];
  const workers = [];

  for (const node of nodes) {
    const connector = {
      host: node.sshHost || node.address,
      port: String(node.port || 22),
      user: node.user || "root",
    };
    if (node.password)   connector.password = node.password;
    if (node.privateKey) connector.private_key_content = node.privateKey;

    hosts[node.name] = {
      internal_ipv4: node.internalIP || node.address,
      connector,
      ...(node.arch       ? { arch: node.arch }             : {}),
      ...(node.archLocked ? { archLocked: node.archLocked } : {}),
    };

    if (node.role === "master" || node.role === "both") masters.push(node.name);
    if (node.role === "worker" || node.role === "both") workers.push(node.name);
  }

  return {
    apiVersion: "core.kubekey.kubesphere.io/v1",
    kind: "Inventory",
    metadata: { name: "default", namespace: "default" },
    spec: {
      hosts,
      groups: {
        kube_control_plane: { hosts: masters },
        kube_worker:        { hosts: workers.length ? workers : masters },
        etcd:               { hosts: masters },
        k8s_cluster:        { groups: ["kube_control_plane", "kube_worker"], hosts: [] },
        nfs:                { hosts: [] },
        image_registry:     { hosts: [] },
        all:                { hosts: Object.keys(hosts) },
      },
    },
  };
}

// 从后端 InventoryHostTable 列表恢复 UI nodes
function inventoryHostsToNodes(items) {
  return items.map((h) => {
    const groups  = (h.groups || []).map((g) => g.role);
    const isMaster = groups.includes("kube_control_plane");
    const isWorker = groups.includes("kube_worker");
    const role = (isMaster && isWorker) ? "both"
               : isMaster               ? "master"
               : isWorker               ? "worker"
               : "";
    return {
      name:       h.hostname || h.name,
      address:    h.internalIPV4 || h.sshHost || "",
      sshHost:    h.sshHost || h.internalIPV4 || "",
      internalIP: h.internalIPV4 || "",
      port:       parseInt(h.sshPort, 10) || 22,
      user:       h.sshUser || "root",
      password:   h.sshPassword || "",
      privateKey: h.sshPrivateKeyContent || "",
      arch:       h.arch || "amd64",
      archLocked: h.archLocked || false,
      os:         h.os || "",
      role,
      status:     "ok",
    };
  });
}

// 持久化节点到 Inventory(upsert，同时将已删除的 host 显式置 null)
async function saveNodesToInventory(nodes) {
  const inv = buildInventory(nodes);

  try {
    // 先拉当前 Inventory，算出被删除的 host 名，merge patch 需要显式置 null 才能删除
    let removedHosts = {};
    try {
      const cur = await window.kkApi.getInventory("default", "default");
      const curHostNames = Object.keys(cur?.spec?.hosts || {});
      const newHostNames = new Set(Object.keys(inv.spec.hosts));
      curHostNames.forEach((name) => {
        if (!newHostNames.has(name)) removedHosts[name] = null;
      });
    } catch (_) { /* 404 时忽略 */ }

    const patch = {
      spec: {
        ...inv.spec,
        hosts: { ...inv.spec.hosts, ...removedHosts },
      },
    };
    await window.kkApi.patchInventory("default", "default", patch, { promise: false, type: "merge" });
  } catch (e) {
    if (String(e.message).includes("404") || String(e.message).toLowerCase().includes("not found")) {
      if (nodes.length) await window.kkApi.createInventory(inv);
    }
  }
}

// 启动时从 Inventory 读回节点列表
async function loadNodesFromInventory() {
  try {
    const data = await window.kkApi.listInventoryHosts("default", "default");
    const items = Array.isArray(data) ? data : (data.items || []);
    return inventoryHostsToNodes(items);
  } catch (e) {
    return [];
  }
}

// ============ 主 App — 安装向导 ============
function App() {
  const [step, setStep] = React.useState(0);
  const [nodes, setNodes] = React.useState([]);
  const [nodesLoaded, setNodesLoaded] = React.useState(false);
  const [playbook, setPlaybook] = React.useState(null); // { name, namespace }
  const [installing, setInstalling] = React.useState(false);
  const [installError, setInstallError] = React.useState(null);
  const [precheckErrors, setPrecheckErrors] = React.useState(null); // { filename: msg }
  const [logModal, setLogModal] = React.useState(null); // { namespace, name, title }
  const clusterSaveRef = React.useRef(null);
  const clusterValidateRef = React.useRef(null);
  const saveTimerRef   = React.useRef(null);

  const titles = ["基本信息", "安装预览", "安装", "安装校验"];

  // 启动时恢复节点
  React.useEffect(() => {
    loadNodesFromInventory().then((loaded) => {
      if (loaded.length) setNodes(loaded);
      setNodesLoaded(true);
    });
  }, []);

  // 节点变化时防抖保存到 Inventory
  React.useEffect(() => {
    if (!nodesLoaded) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveNodesToInventory(nodes).catch(() => {});
    }, 800);
    return () => clearTimeout(saveTimerRef.current);
  }, [nodes, nodesLoaded]);

  const goPrev = () => {
    setInstallError(null);
    setPrecheckErrors(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const goNext = async () => {
    setInstallError(null);
    setPrecheckErrors(null);

    // step 0→1: 校验 + 保存集群配置 + 等待 precheck
    if (step === 0) {
      const errMsg = clusterValidateRef.current?.();
      if (errMsg) {
        window.showToast?.(errMsg, "error");
        return;
      }
      if (!clusterSaveRef.current) return;
      setInstalling(true);
      try {
        // 确保 Inventory 已存在（precheck playbook 需要引用 inventory）
        await saveNodesToInventory(nodes);
        await clusterSaveRef.current();
      } catch (e) {
        // 422 precheck 失败: e.data 包含 { filename: failureMessage }
        if (e.status === 422 && e.data) {
          setPrecheckErrors(e.data);
          setInstalling(false);
          window.showToast?.("配置预检失败，请修正后重试", "error",
            Object.entries(e.data).map(([f, m]) => `[${f}] ${m}`).join("\n"));
          return;
        }
        console.warn("保存配置失败(非阻断):", e.message);
        window.showToast?.("配置保存失败（非阻断）", "error", e.message);
      } finally {
        setInstalling(false);
      }
    }

    // step 1→2: 确保 Inventory 已更新,再创建安装 Playbook
    if (step === 1) {
      setInstalling(true);
      setInstallError(null);
      try {
        await saveNodesToInventory(nodes);

        // 从 schema 里取 install playbook 路径
        const schemas = await window.loadSchemas();
        const INSTALL_LABEL = "install.kubekey.kubesphere.io/schema";
        let playbookFile = "";
        for (const s of schemas) {
          if (s.playbookPath?.[INSTALL_LABEL]) {
            playbookFile = s.playbookPath[INSTALL_LABEL];
            break;
          }
        }
        if (!playbookFile) {
          throw new Error("schema 中未配置 install playbook 路径（install.kubekey.kubesphere.io/schema）");
        }

        // 从 localStorage 读取最新的 schema 配置（含 kube_version 等）
        let schemaConfig = {};
        try {
          const local = localStorage.getItem("kkSchemaConfig");
          if (local) {
            const parsed = JSON.parse(local);
            // 取第一个 schema 的配置（如 kubernetes.json 的内容）
            const firstKey = Object.keys(parsed)[0];
            if (firstKey) schemaConfig = parsed[firstKey];
          }
        } catch (_) {}

        const pb = await window.kkApi.createPlaybook({
          apiVersion: "core.kubekey.kubesphere.io/v1",
          kind: "Playbook",
          metadata: { generateName: "install-", namespace: "default" },
          spec: {
            playbook: playbookFile,
            inventoryRef: {
              kind: "Inventory",
              namespace: "default",
              name: "default",
            },
            config: { spec: schemaConfig },
          },
        });

        setPlaybook({
          name:      pb?.metadata?.name,
          namespace: pb?.metadata?.namespace || "default",
        });
        window.showToast?.("安装任务已启动", "success");
        setStep(2);
      } catch (e) {
        setInstallError(`启动安装失败: ${e.message}`);
        window.showToast?.("启动安装失败", "error", e.message);
      } finally {
        setInstalling(false);
      }
      return;
    }

    setStep((s) => Math.min(3, s + 1));
  };

  return (
    <div className="app">
      <Sidebar currentStep={step} onSelect={setStep} />

      <main className="main">
        <div className="content">
          <h1 className="page-title">{titles[step]}</h1>

          {step === 0 && (
            <>
              <NodeSettings
                nodes={nodes}
                onNodesChange={setNodes}
                onRefresh={async () => {
                  // 从 Inventory 加载节点，但若返回空则保留当前状态（防止未保存时误清空）
                  let nodeList = nodes;
                  try {
                    const loaded = await loadNodesFromInventory();
                    if (loaded.length > 0) {
                      nodeList = loaded;
                      setNodes(loaded);
                    }
                  } catch (e) {
                    // 加载失败，保留当前节点
                  }
                  if (!nodeList.length) { window.showToast?.("节点列表已刷新", "success"); return; }
                  // 用保存的凭据重新验证 SSH 连接并更新状态
                  try {
                    const hosts = nodeList.map((n) => ({
                      ip: n.address, sshPort: String(n.port || 22),
                      sshUser: n.user || "root",
                      sshPwd: n.password || "",
                      sshPrivateKeyContent: n.privateKey || "",
                    }));
                    const resp = await window.kkApi.preCheckHosts(hosts);
                    const list = Array.isArray(resp) ? resp : (resp.items || []);
                    const statusMap = {};
                    list.forEach((r) => {
                      const ip = r.address || r.ip;
                      const ok = ["ok", "succeeded", "reachable", "success"].includes(String(r.status).toLowerCase());
                      statusMap[ip] = ok ? "ok" : "error";
                    });
                    setNodes((prev) => prev.map((n) => statusMap[n.address] != null ? { ...n, status: statusMap[n.address] } : n));
                    const failCount = Object.values(statusMap).filter((v) => v === "error").length;
                    if (failCount > 0) window.showToast?.(`${failCount} 个节点 SSH 连接失败`, "error");
                    else window.showToast?.("节点列表已刷新，所有节点 SSH 连接正常", "success");
                  } catch (e) {
                    window.showToast?.("节点连接验证失败", "error", e.message);
                  }
                }}
              />
              <ClusterForm saveRef={clusterSaveRef} validateRef={clusterValidateRef} />

              {/* Precheck 失败详情 */}
              {precheckErrors && (
                <div style={{
                  marginTop: 16, padding: "14px 18px",
                  background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.25)",
                  borderRadius: 8,
                }}>
                  <div style={{ fontWeight: 600, color: "var(--danger)", marginBottom: 8, fontSize: 14 }}>
                    预检失败,请修正以下问题后重试
                  </div>
                  {Object.entries(precheckErrors).map(([schema, msg]) => (
                    <div key={schema} style={{ fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginRight: 8 }}>{schema}</span>
                      <span style={{ color: "var(--danger)" }}>{msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <InstallPreview />
              {/* 最近运行的 Playbook 列表(供查日志) */}
              <RecentPlaybooks onViewLog={(ns, name, title) => setLogModal({ namespace: ns, name, title })} />
            </>
          )}

          {step === 2 && playbook && (
            <InstallStep
              namespace={playbook.namespace}
              name={playbook.name}
              onDone={() => setStep(3)}
            />
          )}
          {step === 2 && !playbook && (
            <div className="config-card" style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-tertiary)" }}>
              安装信息不完整,请返回上一步重新提交
            </div>
          )}

          {step === 3 && (
            <div className="config-card" style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-tertiary)" }}>
              安装校验阶段 — 检查项待加入
            </div>
          )}
        </div>

        <div className="footer" style={{ gap: "12px", padding: "14px 56px" }}>
          {step > 0 && step !== 2 && (
            <button className="btn btn-secondary" onClick={goPrev}>上一步</button>
          )}
          {step < 3 && step !== 2 && (
            <button className="btn btn-primary" onClick={goNext} disabled={installing}>
              {installing ? (step === 0 ? "配置检查中..." : "启动中...") : step === 1 ? "下一步: 执行安装" : "下一步"}
            </button>
          )}
          {installError && (
            <span style={{ fontSize: 13, color: "var(--danger, #ef4444)", maxWidth: 480 }}>{installError}</span>
          )}
          {step === 3 && (
            <button className="btn btn-primary">完成</button>
          )}
        </div>
      </main>

      <TweaksPanel />
      <Toaster />

      {logModal && (
        <PlaybookLogModal
          namespace={logModal.namespace}
          name={logModal.name}
          title={logModal.title}
          onClose={() => setLogModal(null)}
        />
      )}
    </div>
  );
}

// ============ 最近 Playbook 列表 — 供安装预览页查看日志 ============
function RecentPlaybooks({ onViewLog }) {
  const [playbooks, setPlaybooks] = React.useState([]);
  const [inventoryIps, setInventoryIps] = React.useState({}); // hostname → ip

  React.useEffect(() => {
    window.kkApi.listPlaybooks({ namespace: "default", limit: 200, orderBy: "creationTimestamp", ascending: false })
      .then((data) => {
        const items = Array.isArray(data) ? data : (data.items || []);
        // 按创建时间倒序排列
        const sorted = items.slice().sort((a, b) => {
          const ta = new Date(a.metadata?.creationTimestamp || 0).getTime();
          const tb = new Date(b.metadata?.creationTimestamp || 0).getTime();
          return tb - ta;
        });
        // 按 playbook 类型去重：去掉末尾 kubernetes generate-name 随机后缀（4-6位字母数字）
        const getType = (name) => {
          const m = name.match(/^(.+)-([a-z0-9]{4,6})$/);
          return m ? m[1] : name;
        };
        const seen = new Set();
        const deduped = [];
        for (const pb of sorted) {
          const type = getType(pb.metadata?.name || "");
          if (!seen.has(type)) {
            seen.add(type);
            deduped.push(pb);
            if (deduped.length >= 10) break;
          }
        }
        setPlaybooks(deduped);
      })
      .catch(() => {});
    // 加载默认 inventory 的主机 IP 映射，用于 host-check 显示
    window.kkApi.listInventoryHosts("default", "default")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.items || []);
        const m = {};
        list.forEach((h) => { m[h.name || h.hostname] = h.internalIPV4 || h.sshHost || ""; });
        setInventoryIps(m);
      })
      .catch(() => {});
  }, []);

  if (!playbooks.length) return null;

  const phaseColor = {
    Succeeded: "var(--success)",
    Failed:    "var(--danger)",
    Running:   "var(--primary-500)",
    Pending:   "var(--text-tertiary)",
  };

  return (
    <section className="section">
      <h3 className="section-title">最近执行记录</h3>
      <div className="config-card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
              {["Playbook", "命名空间", "状态", "创建时间", "操作"].map((h) => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playbooks.map((pb) => {
              const name = pb.metadata?.name || "";
              const ns   = pb.metadata?.namespace || "default";
              const phase = pb.status?.phase || "Pending";
              const created = pb.metadata?.creationTimestamp || "";
              const fmtTime = created ? created.replace("T", " ").split(".")[0] : "";
              // host-check playbook 名称旁显示节点 IP
              const isHostCheck = name.startsWith("host-check-");
              const hostIps = isHostCheck ? Object.values(inventoryIps).filter(Boolean).join(", ") : "";
              const ipSuffix = isHostCheck && hostIps ? ` (${hostIps})` : "";
              return (
                <tr key={name} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 12 }}>{name}{ipSuffix}</td>
                  <td style={{ padding: "8px 14px" }}>{ns}</td>
                  <td style={{ padding: "8px 14px" }}>
                    <span style={{ color: phaseColor[phase] || "var(--text-secondary)", fontWeight: 500 }}>{phase}</span>
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{fmtTime}</td>
                  <td style={{ padding: "8px 14px" }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: "3px 8px", color: "var(--primary-600)" }}
                      onClick={() => onViewLog(ns, name, `日志: ${name}`)}
                    >
                      查看日志
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
