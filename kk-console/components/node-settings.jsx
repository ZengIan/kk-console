// 节点设置 — 完整工具栏 + 表格(操作系统/SSH端口/IP/用户名/CPU架构/角色/标签/操作)
function NodeSettings({ nodes = [], onNodesChange, onRefresh }) {
  const [openModal, setOpenModal] = React.useState(null); // "manual"|"upload"|"scan"|"edit"
  const [editIndex, setEditIndex] = React.useState(null);
  const [selectedRows, setSelectedRows] = React.useState(new Set()); // Set of node indices (in full list)
  const [search, setSearch] = React.useState("");
  const [curPage, setCurPage] = React.useState(1);
  // 删除确认: { type: "single", idx } | { type: "batch", indices: number[] } | null
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const PAGE_SIZE = 10;

  const addNodes = (newNodes) => {
    const list = Array.isArray(newNodes) ? newNodes : [newNodes];
    onNodesChange?.([...nodes, ...list]);
  };

  const removeNode = (idx) => setConfirmDelete({ type: "single", idx });

  const removeBatch = () => {
    if (!selectedRows.size) return;
    setConfirmDelete({ type: "batch", indices: [...selectedRows] });
  };

  const doConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "single") {
      const idx = confirmDelete.idx;
      const removed = nodes[idx];
      onNodesChange?.(nodes.filter((_, i) => i !== idx));
      setSelectedRows((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
      window.showToast?.(`节点 ${removed?.address || removed?.name || ""} 已删除`, "success");
    } else {
      const indices = new Set(confirmDelete.indices);
      const next = nodes.filter((_, i) => !indices.has(i));
      onNodesChange?.(next);
      setSelectedRows(new Set());
      window.showToast?.(`已删除 ${indices.size} 个节点`, "success");
    }
    setConfirmDelete(null);
  };

  const updateNode = (idx, data) => {
    const next = nodes.map((n, i) => (i === idx ? data : n));
    onNodesChange?.(next);
  };

  const filteredNodes = nodes.map((n, i) => ({ ...n, _idx: i })).filter((n) => {
    if (!search) return true;
    return (n.name || "").includes(search) || (n.address || "").includes(search);
  });
  const totalPages = Math.max(1, Math.ceil(filteredNodes.length / PAGE_SIZE));
  const pageNodes = filteredNodes.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const allPageSelected = pageNodes.length > 0 && pageNodes.every((n) => selectedRows.has(n._idx));
  const toggleAllPage = () => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageNodes.forEach((n) => next.delete(n._idx));
      } else {
        pageNodes.forEach((n) => next.add(n._idx));
      }
      return next;
    });
  };

  const toggleRow = (idx) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const roleLabel = { master: "Master", worker: "Worker", both: "Master & Worker" };

  // ---- 空状态 ----
  if (nodes.length === 0) {
    return (
      <section className="section">
        <h3 className="section-title">节点设置</h3>
        <div className="empty-node-card">
          <Icons.NodeAdd />
          <h4 className="empty-title">添加节点</h4>
          <p className="empty-desc">
            通过手动配置主机名、节点 IP、节点角色、CPU 架构等信息,文件上传和节点 IP 地址网络扫描来添加节点
          </p>
          <div className="button-row">
            <button className="btn btn-primary" onClick={() => setOpenModal("manual")}><Icons.Plus /> 手动添加</button>
            <button className="btn btn-secondary" onClick={() => setOpenModal("upload")}><Icons.Upload /> 文件上传</button>
            <button className="btn btn-secondary" onClick={() => setOpenModal("scan")}><Icons.Scan /> 节点扫描</button>
          </div>
        </div>
        {openModal === "manual" && <ManualAddModal onClose={() => setOpenModal(null)} onAdd={addNodes} />}
        {openModal === "upload" && <FileUploadModal onClose={() => setOpenModal(null)} />}
        {openModal === "scan"   && <NodeScanModal   onClose={() => setOpenModal(null)} onAdd={addNodes} existingNodes={nodes} />}
      </section>
    );
  }

  // ---- 有节点时 ----
  return (
    <section className="section">
      <h3 className="section-title">节点设置</h3>

      {/* 工具栏 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setOpenModal("manual")}>
          手动添加
        </button>
        <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => setOpenModal("upload")}>
          文件上传
        </button>
        <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => setOpenModal("scan")}>
          节点扫描
        </button>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 13, color: selectedRows.size > 0 ? "var(--danger)" : undefined }}
          disabled={selectedRows.size === 0}
          onClick={removeBatch}
        >
          批量删除
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className="input"
            style={{ paddingLeft: 28, width: 200, fontSize: 13 }}
            placeholder="请输入节点名称搜索"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurPage(1); }}
          />
        </div>

        {/* 刷新 */}
        <button
          className="btn btn-ghost"
          style={{ padding: "7px 10px" }}
          title="刷新"
          onClick={() => { setSearch(""); setCurPage(1); setSelectedRows(new Set()); onRefresh?.(); }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M13 2v4H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 12v-4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.65 5A6 6 0 1 0 12 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* 表格 */}
      <div className="config-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ width: 40, padding: "10px 12px", textAlign: "center" }}>
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAllPage} />
                </th>
                {["主机名", "状态", "操作系统", "SSH 端口", "节点 IP 地址", "用户名", "CPU 架构", "角色", "标签", "操作"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageNodes.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-tertiary)" }}>
                    未找到匹配节点
                  </td>
                </tr>
              ) : pageNodes.map((node) => {
                const idx = node._idx;
                const isOk = node.status !== "error";
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <input type="checkbox" checked={selectedRows.has(idx)} onChange={() => toggleRow(idx)} />
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {node.name || "-"}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: isOk ? "var(--success)" : "var(--danger)", flexShrink: 0 }} />
                        <span style={{ color: isOk ? "var(--success)" : "var(--danger)", fontSize: 12 }}>{isOk ? "正常" : "异常"}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, whiteSpace: "nowrap", color: node.os ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                      {node.os || "-"}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {node.port || 22}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 12, whiteSpace: "nowrap" }}>{node.address || "-"}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{node.user || "root"}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{node.arch || "-"}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{roleLabel[node.role] || "-"}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, color: "var(--text-secondary)" }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 3h8M2 6h8M2 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        0
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: "3px 8px", color: "var(--primary-600)" }}
                        onClick={() => { setEditIndex(idx); setOpenModal("edit"); }}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: "3px 8px", color: "var(--danger)" }}
                        onClick={() => removeNode(idx)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {filteredNodes.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border-light)", fontSize: 13, color: "var(--text-secondary)" }}>
            <span>共 {filteredNodes.length} 条</span>
            <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 16 }} disabled={curPage <= 1} onClick={() => setCurPage((p) => p - 1)}>‹</button>
            <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600, color: "var(--primary-600)", background: "var(--primary-50)", padding: "2px 8px", borderRadius: 4 }}>{curPage}</span>
            <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 16 }} disabled={curPage >= totalPages} onClick={() => setCurPage((p) => p + 1)}>›</button>
            <span>跳转到</span>
            <input
              className="input"
              style={{ width: 48, textAlign: "center", padding: "4px 6px" }}
              onKeyDown={(e) => { if (e.key === "Enter") { const n = parseInt(e.target.value); if (n >= 1 && n <= totalPages) { setCurPage(n); e.target.value = ""; } } }}
            />
            <span>页</span>
          </div>
        )}
      </div>

      {/* 弹窗 */}
      {openModal === "manual" && <ManualAddModal onClose={() => setOpenModal(null)} onAdd={addNodes} />}
      {openModal === "upload" && <FileUploadModal onClose={() => setOpenModal(null)} />}
      {openModal === "scan"   && <NodeScanModal   onClose={() => setOpenModal(null)} onAdd={addNodes} existingNodes={nodes} />}
      {openModal === "edit" && editIndex !== null && (
        <EditNodeModal
          node={nodes[editIndex]}
          onClose={() => { setOpenModal(null); setEditIndex(null); }}
          onConfirm={(data) => updateNode(editIndex, data)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={
            confirmDelete.type === "single"
              ? `确定要删除节点 ${nodes[confirmDelete.idx]?.address || nodes[confirmDelete.idx]?.name || ""} 吗?`
              : `确定要删除选中的 ${confirmDelete.indices.length} 个节点吗?`
          }
          description="删除后,节点相关配置将丢失。确定要删除吗?"
          confirmText="删除"
          cancelText="取消"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={doConfirmDelete}
        />
      )}
    </section>
  );
}

window.NodeSettings = NodeSettings;
