// 安装预览 — 展示安装所需组件清单
function InstallPreview() {
  // 后续可从 ClusterForm 的状态传入,先用静态数据
  const components = [
    {
      name: "Kubernetes",
      desc: "Kubernetes 集群配置",
      version: "v1.29.15",
      namespace: "kube-system",
      logo: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 3L34 11V29L20 37L6 29V11L20 3Z" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.4" strokeLinejoin="round"/>
          <g stroke="#1d4ed8" strokeWidth="1.2" strokeLinecap="round">
            <path d="M20 11v18M11 16l18 8M11 24l18-8M14 13l12 14M26 13L14 27"/>
          </g>
          <circle cx="20" cy="20" r="3.2" fill="#fff" stroke="#1d4ed8" strokeWidth="1.4"/>
        </svg>
      ),
    },
  ];

  return (
    <section className="section">
      <h3 className="section-title">安装所需组件</h3>

      <div className="component-list">
        {components.map((c) => (
          <div key={c.name} className="component-row">
            <div className="component-logo">{c.logo}</div>

            <div className="component-meta primary">
              <div className="component-name">{c.name}</div>
              <div className="component-desc">{c.desc}</div>
            </div>

            <div className="component-meta">
              <div className="component-value">{c.version}</div>
              <div className="component-key">版本</div>
            </div>

            <div className="component-meta">
              <div className="component-value">{c.namespace}</div>
              <div className="component-key">命名空间</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

window.InstallPreview = InstallPreview;
