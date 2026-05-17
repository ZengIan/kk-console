// 节点设置 — 管理节点列表,空状态显示引导卡片
// nodes: 节点数组,onNodesChange: 更新回调
function NodeSettings({ nodes = [], onNodesChange }) {
  const [openModal, setOpenModal] = React.useState(null);

  const addNodes = (newNodes) => {
    const list = Array.isArray(newNodes) ? newNodes : [newNodes];
    onNodesChange?.([...nodes, ...list]);
  };

  const removeNode = (i) => {
    onNodesChange?.(nodes.filter((_, idx) => idx !== i));
  };

  return (
    <section className="section">
      <h3 className="section-title">节点设置</h3>

      {nodes.length === 0 ? (
        <div className="empty-node-card">
          <Icons.NodeAdd />
          <h4 className="empty-title">添加节点</h4>
          <p className="empty-desc">
            通过手动配置主机名、节点 IP、节点角色、CPU 架构等信息,文件上传和节点 IP 地址网络扫描来添加节点
          </p>
          <div className="button-row">
            <button className="btn btn-primary" onClick={() => setOpenModal("manual")}>
              <Icons.Plus /> 手动添加
            </button>
            <button className="btn btn-secondary" onClick={() => setOpenModal("upload")}>
              <Icons.Upload /> 文件上传
            </button>
            <button className="btn btn-secondary" onClick={() => setOpenModal("scan")}>
              <Icons.Scan /> 节点扫描
            </button>
          </div>
        </div>
      ) : (
        <div className="config-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>节点列表 ({nodes.length})</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => setOpenModal("scan")}>
                <Icons.Scan /> 节点扫描
              </button>
              <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setOpenModal("manual")}>
                <Icons.Plus /> 手动添加
              </button>
            </div>
          </div>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 500 }}>主机名</th>
                <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 500 }}>IP</th>
                <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 500 }}>角色</th>
                <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 500 }}>架构</th>
                <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 500 }}>SSH 端口</th>
                <th style={{ padding: "6px 8px", width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 8px", fontFamily: "var(--font-mono)", fontSize: 12 }}>{node.name}</td>
                  <td style={{ padding: "8px 8px", fontFamily: "var(--font-mono)", fontSize: 12 }}>{node.address}</td>
                  <td style={{ padding: "8px 8px" }}>{node.role}</td>
                  <td style={{ padding: "8px 8px" }}>{node.arch}</td>
                  <td style={{ padding: "8px 8px" }}>{node.port || 22}</td>
                  <td style={{ padding: "8px 8px" }}>
                    <span
                      style={{ cursor: "pointer", color: "var(--text-tertiary)", fontSize: 18, lineHeight: 1 }}
                      onClick={() => removeNode(i)}
                      title="移除"
                    >
                      ×
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openModal === "manual" && <ManualAddModal onClose={() => setOpenModal(null)} onAdd={addNodes} />}
      {openModal === "upload" && <FileUploadModal onClose={() => setOpenModal(null)} />}
      {openModal === "scan"   && <NodeScanModal   onClose={() => setOpenModal(null)} onAdd={addNodes} />}
    </section>
  );
}

window.NodeSettings = NodeSettings;
