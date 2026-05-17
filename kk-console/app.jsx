// ============ Playbook 安装进度 ============
function InstallStep({ namespace, name, onDone }) {
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

  // 日志自动滚到底
  React.useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

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
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>安装中,请勿关闭页面</span>
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
            background: "var(--bg-dark, #0f172a)",
            color: "#e2e8f0",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            lineHeight: 1.6,
            padding: "12px 16px",
            borderRadius: 8,
            minHeight: 320,
            maxHeight: 480,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {log || "等待日志输出..."}
        </div>
      </div>
    </section>
  );
}

// 把 nodes 数组组装成 Inventory Kubernetes 对象
function buildInventory(nodes) {
  const hosts = {};
  const masters = [];
  const workers = [];

  for (const node of nodes) {
    hosts[node.name] = {
      address: node.address,
      port: node.port || 22,
      user: node.user || "root",
      ...(node.password   ? { password: node.password }     : {}),
      ...(node.privateKey ? { privateKey: node.privateKey } : {}),
      ...(node.arch       ? { arch: node.arch }             : {}),
    };
    if (node.role === "master" || node.role === "both") masters.push(node.name);
    if (node.role === "worker" || node.role === "both") workers.push(node.name);
  }

  return {
    apiVersion: "core.kubekey.kubesphere.io/v1",
    kind: "Inventory",
    metadata: { generateName: "inventory-" },
    spec: {
      hosts,
      groups: {
        kube_control_plane: { hosts: masters },
        kube_node: { hosts: workers.length ? workers : masters },
        all: { hosts: Object.keys(hosts) },
      },
    },
  };
}

// ============ 主 App — 安装向导 ============
function App() {
  const [step, setStep] = React.useState(0);
  const [nodes, setNodes] = React.useState([]);
  const [playbook, setPlaybook] = React.useState(null); // { name, namespace }
  const [installing, setInstalling] = React.useState(false);
  const [installError, setInstallError] = React.useState(null);
  const clusterSaveRef = React.useRef(null);

  const titles = ["基本信息", "安装预览", "安装", "安装校验"];

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const goNext = async () => {
    // step 0→1: 保存集群配置(失败不阻断)
    if (step === 0 && clusterSaveRef.current) {
      await clusterSaveRef.current().catch((e) =>
        console.warn("goNext: 保存配置失败(非阻断):", e.message)
      );
    }

    // step 1→2: 创建 Inventory + Playbook,成功后才推进步骤
    if (step === 1) {
      setInstalling(true);
      setInstallError(null);
      try {
        const created = await window.kkApi.createInventory(buildInventory(nodes));
        const invName = created?.metadata?.name || "default";
        const invNs   = created?.metadata?.namespace || "default";

        const pb = await window.kkApi.createPlaybook({
          apiVersion: "core.kubekey.kubesphere.io/v1",
          kind: "Playbook",
          metadata: { generateName: "install-", namespace: invNs },
          spec: { playbook: "kubernetes.yaml", inventory: invName },
        });

        setPlaybook({ name: pb?.metadata?.name, namespace: pb?.metadata?.namespace || invNs });
        setStep(2);
      } catch (e) {
        setInstallError(`启动安装失败: ${e.message}`);
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
              <NodeSettings nodes={nodes} onNodesChange={setNodes} />
              <ClusterForm saveRef={clusterSaveRef} />
            </>
          )}

          {step === 1 && <InstallPreview />}

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
              {installing ? "启动中..." : step === 1 ? "下一步: 执行安装" : "下一步"}
            </button>
          )}
          {installError && (
            <span style={{ fontSize: 13, color: "var(--danger, #ef4444)" }}>{installError}</span>
          )}
          {step === 3 && (
            <button className="btn btn-primary">完成</button>
          )}
        </div>
      </main>

      <TweaksPanel />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
