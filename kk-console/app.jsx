// 主 App — 安装向导,支持步骤切换
function App() {
  const [step, setStep] = React.useState(0);

  const titles = ["基本信息", "安装预览", "安装", "安装校验"];

  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => setStep((s) => Math.min(3, s + 1));

  return (
    <div className="app">
      <Sidebar currentStep={step} onSelect={setStep} />

      <main className="main">
        <div className="content">
          <h1 className="page-title">{titles[step]}</h1>

          {step === 0 &&
          <>
              <NodeSettings />
              <ClusterForm />
            </>
          }
          {step === 1 && <InstallPreview />}
          {step === 2 &&
          <div className="config-card" style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-tertiary)" }}>
              安装阶段 — 实时日志/进度待加入
            </div>
          }
          {step === 3 &&
          <div className="config-card" style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-tertiary)" }}>
              安装校验阶段 — 检查项待加入
            </div>
          }
        </div>

        <div className="footer" style={{ gap: "12px", padding: "14px 56px" }}>
          {step > 0 &&
          <button className="btn btn-secondary" onClick={goPrev}>上一步</button>
          }
          {step < 3 &&
          <button className="btn btn-primary" onClick={goNext}>
              {step === 1 ? "下一步: 执行安装" : "下一步"}
            </button>
          }
          {step === 3 &&
          <button className="btn btn-primary">完成</button>
          }
        </div>
      </main>

      <TweaksPanel />
    </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);