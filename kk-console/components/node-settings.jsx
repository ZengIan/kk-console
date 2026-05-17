// 节点设置 — 空状态卡片,三个添加按钮
function NodeSettings() {
  const [openModal, setOpenModal] = React.useState(null);

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

      {openModal === "manual" && <ManualAddModal onClose={() => setOpenModal(null)} />}
      {openModal === "upload" && <FileUploadModal onClose={() => setOpenModal(null)} />}
      {openModal === "scan"   && <NodeScanModal   onClose={() => setOpenModal(null)} />}
    </section>
  );
}

window.NodeSettings = NodeSettings;
