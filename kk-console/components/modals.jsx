// ============ Modal 外壳 ============
function Modal({ title, onClose, footer, size, children }) {
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-mask" onClick={onClose}>
      <div
        className={`modal ${size === "lg" ? "modal-lg" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <span className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </span>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ============ 手动添加节点 ============
function ManualAddModal({ onClose }) {
  const [hostname, setHostname] = React.useState("");
  const [ipVersion, setIpVersion] = React.useState("ipv4");
  const [octets, setOctets] = React.useState(["", "", "", ""]);
  const [role, setRole] = React.useState("master");
  const [arch, setArch] = React.useState("amd64");
  const [sshHost, setSshHost] = React.useState("");
  const [sshPort, setSshPort] = React.useState(22);
  const [sshUser, setSshUser] = React.useState("root");
  const [authMethod, setAuthMethod] = React.useState("password");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);

  const setOctet = (i) => (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 3);
    setOctets((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  };

  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>取消</button>
      <button className="btn btn-primary">确认</button>
    </>
  );

  return (
    <Modal title="手动添加" onClose={onClose} footer={footer}>
      {/* 主机名 */}
      <div className="form-row">
        <div className="form-row-label required">主机名</div>
        <div className="form-row-control">
          <input
            className="input"
            placeholder="请输入主机名"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
          />
          <p className="form-row-hint">
            主机名只能包含字母、数字、连字符(-)和点(.),必须以字母或数字开头和结尾,最长 64 个字符。
          </p>
        </div>
      </div>

      {/* IP 地址 */}
      <div className="form-row">
        <div className="form-row-label required">IP 地址</div>
        <div className="form-row-control">
          <div className="choice-group" style={{ marginBottom: 12 }}>
            <button
              className={`choice-btn ${ipVersion === "ipv4" ? "active" : ""}`}
              onClick={() => setIpVersion("ipv4")}
            >
              IPv4
            </button>
            <button
              className={`choice-btn ${ipVersion === "ipv6" ? "active" : ""}`}
              onClick={() => setIpVersion("ipv6")}
            >
              IPv6
            </button>
          </div>
          {ipVersion === "ipv4" ? (
            <div className="ip-input">
              {octets.map((v, i) => (
                <React.Fragment key={i}>
                  <input
                    className="ip-octet"
                    value={v}
                    onChange={setOctet(i)}
                    placeholder=""
                    maxLength={3}
                  />
                  {i < 3 && <span className="ip-dot">·</span>}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <input className="input" placeholder="请输入 IPv6 地址" />
          )}
          <p className="form-row-hint">IP 地址范围应在 0.0.0.0 到 255.255.255.255。</p>
        </div>
      </div>

      {/* 节点角色 */}
      <div className="form-row">
        <div className="form-row-label">节点角色</div>
        <div className="form-row-control">
          <div className="choice-group">
            {[
              { v: "master", l: "Master" },
              { v: "worker", l: "Worker" },
              { v: "both", l: "Master & Worker" },
            ].map((o) => (
              <button
                key={o.v}
                className={`choice-btn ${role === o.v ? "active" : ""}`}
                onClick={() => setRole(o.v)}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CPU 架构 */}
      <div className="form-row">
        <div className="form-row-label">CPU 架构</div>
        <div className="form-row-control">
          <div className="choice-group">
            {[
              { v: "amd64", l: "AMD64" },
              { v: "arm64", l: "ARM64" },
            ].map((o) => (
              <button
                key={o.v}
                className={`choice-btn ${arch === o.v ? "active" : ""}`}
                onClick={() => setArch(o.v)}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SSH 地址 */}
      <div className="form-row">
        <div className="form-row-label">SSH 地址</div>
        <div className="form-row-control">
          <div className="host-port">
            <input
              className="input"
              placeholder="请输入 IP 地址"
              value={sshHost}
              onChange={(e) => setSshHost(e.target.value)}
            />
            <span className="sep">:</span>
            <input
              className="input port-input"
              type="number"
              value={sshPort}
              onChange={(e) => setSshPort(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SSH 用户名 */}
      <div className="form-row">
        <div className="form-row-label">SSH 用户名</div>
        <div className="form-row-control">
          <input
            className="input"
            value={sshUser}
            onChange={(e) => setSshUser(e.target.value)}
          />
          <p className="form-row-hint">
            SSH 用户名只能包含字母、数字、连字符(-),最长 32 个字符。
          </p>
        </div>
      </div>

      {/* SSH 认证 */}
      <div className="form-row">
        <div className="form-row-label">SSH 认证</div>
        <div className="form-row-control">
          <div className="choice-group" style={{ marginBottom: 12 }}>
            <button
              className={`choice-btn ${authMethod === "password" ? "active" : ""}`}
              onClick={() => setAuthMethod("password")}
            >
              密码
            </button>
            <button
              className={`choice-btn ${authMethod === "key" ? "active" : ""}`}
              onClick={() => setAuthMethod("key")}
            >
              密钥
            </button>
          </div>
          {authMethod === "password" ? (
            <div className="password-input">
              <input
                className="input"
                type={showPwd ? "text" : "password"}
                placeholder="请输入 SSH 认证密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="eye" onClick={() => setShowPwd((s) => !s)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </span>
            </div>
          ) : (
            <textarea
              className="input"
              rows="4"
              placeholder="请粘贴 SSH 私钥(PEM 格式)"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            />
          )}
        </div>
      </div>

      {/* 标签 */}
      <div className="form-row" style={{ marginBottom: 4 }}>
        <div className="form-row-label">标签</div>
        <div className="form-row-control">
          <span className="add-link">
            <Icons.Plus /> 添加标签
          </span>
        </div>
      </div>
    </Modal>
  );
}

// ============ 文件上传 ============
function FileUploadModal({ onClose }) {
  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>取消</button>
      <button className="btn btn-primary" disabled>确认</button>
    </>
  );

  return (
    <Modal title="文件上传" onClose={onClose} footer={footer} size="lg">
      <div className="info-banner">
        <p className="info-banner-title">文件上传说明</p>
        <p className="info-banner-text">
          请下载 CSV 格式的模板文件,表格内必须填写的内容为「主机名」、「节点 IP」、「节点角色」,可填内容「SSH 地址」、「SSH 用户」、「标签」。填写完毕后再进行文件上传。
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>上传文件</span>
        <button className="btn btn-secondary">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7M4 6l3 3 3-3M2 10v2h10v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          下载模板
        </button>
      </div>

      <div className="dropzone">
        <svg className="dropzone-icon" width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 24V8M12 14l6-6 6 6M6 28v4h24v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="dropzone-main">
          拖拽文件到此处,或 <span className="link">点击上传</span>
        </p>
        <p className="dropzone-hint">仅支持 CSV 格式,最多 1 个文件,文件大小不超过 5 MB</p>
      </div>
    </Modal>
  );
}

// ============ 节点扫描 ============
function NodeScanModal({ onClose }) {
  const [octets, setOctets] = React.useState(["", "", "", ""]);
  const [endRange, setEndRange] = React.useState("");
  const [port, setPort] = React.useState(22);

  const setOctet = (i) => (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 3);
    setOctets((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  };

  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>取消</button>
      <button className="btn btn-primary" disabled>开始扫描</button>
    </>
  );

  return (
    <Modal title="节点扫描" onClose={onClose} footer={footer} size="lg">
      <div className="form-row" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
        <div className="form-row-label" style={{ paddingTop: 0, fontWeight: 600 }}>
          节点 IP 地址
        </div>
        <div className="form-row-control">
          <div className="cidr-range">
            {octets.map((v, i) => (
              <React.Fragment key={i}>
                <input
                  className="ip-octet"
                  value={v}
                  onChange={setOctet(i)}
                  maxLength={3}
                />
                {i < 3 && <span className="ip-dot">·</span>}
              </React.Fragment>
            ))}
            <span className="ip-tilde">~</span>
            <input
              className="ip-octet"
              value={endRange}
              onChange={(e) => setEndRange(e.target.value.replace(/\D/g, "").slice(0, 3))}
              maxLength={3}
            />
            <span className="ip-dot">:</span>
            <input
              className="ip-octet"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>
          <p className="form-row-hint">
            请输入 CIDR 格式的节点 IP 地址段和 SSH 端口,系统将扫描可用节点
          </p>
        </div>
      </div>
    </Modal>
  );
}

window.ManualAddModal = ManualAddModal;
window.FileUploadModal = FileUploadModal;
window.NodeScanModal = NodeScanModal;
