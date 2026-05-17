// 侧边栏: Logo + 版本徽章 + 安装向导步骤
function Sidebar({ currentStep = 0, onSelect }) {
  const steps = [
  {
    label: "基本信息",
    desc: "配置节点、容器、网络和镜像仓库等",
    icon: <Icons.StepBasic />
  },
  {
    label: "安装预览",
    desc: "预览产品安装所需的组件信息",
    icon: <Icons.StepPreview />
  },
  {
    label: "安装",
    desc: "执行产品安装部署并监控安装进度",
    icon: <Icons.StepInstall />
  },
  {
    label: "安装校验",
    desc: "运行产品安装检查并验证系统可用性",
    icon: <Icons.StepVerify />
  }];


  return (
    <aside className="sidebar">
      <div className="logo">
        <Icons.Logo />
        <span className="logo-text">企业级人工智能平台部署</span>
      </div>

      <div className="version-badge">
        <Icons.VersionDot />
        版本 v2.0.0
      </div>

      <h2 className="sidebar-title">安装向导</h2>

      <div className="stepper">
        {steps.map((s, i) => {
          const state =
          i < currentStep ? "done" : i === currentStep ? "active" : "pending";
          return (
            <div key={i} className={`step ${state}`} onClick={() => onSelect?.(i)}>
              <span className="step-dot" />
              <span className="step-icon">{s.icon}</span>
              <span className="step-text">
                <span className="step-label">{s.label}</span>
                <span className="step-desc">{s.desc}</span>
              </span>
            </div>);

        })}
      </div>

      <button className="init-button" disabled>
        <Icons.Refresh />
        初始化
      </button>
    </aside>);

}

window.Sidebar = Sidebar;