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
function ManualAddModal({ onClose, onAdd }) {
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
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const setOctet = (i) => (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 3);
    setOctets((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  };

  const handleConfirm = async () => {
    const ip = octets.join(".");
    const host = {
      name: hostname,
      address: ip,
      role,
      arch,
      port: Number(sshPort),
      user: sshUser,
      status: "ok",
      ...(authMethod === "password" ? { password } : { privateKey: password }),
    };
    setLoading(true);
    setError(null);
    try {
      await window.kkApi.preCheckHosts([{
        address: sshHost || ip,
        port: Number(sshPort),
        user: sshUser,
        password: authMethod === "password" ? password : undefined,
        privateKey: authMethod === "key" ? password : undefined,
      }]);
      onAdd?.(host);
      onClose();
    } catch (e) {
      setError(`SSH 预检失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const canConfirm = hostname && octets.every(Boolean) && !loading;

  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>取消</button>
      <button className="btn btn-primary" onClick={handleConfirm} disabled={!canConfirm}>
        {loading ? "检测中..." : "确认"}
      </button>
    </>
  );

  return (
    <Modal title="手动添加" onClose={onClose} footer={footer}>
      <div className="form-row">
        <div className="form-row-label required">主机名</div>
        <div className="form-row-control">
          <input className="input" placeholder="请输入主机名" value={hostname} onChange={(e) => setHostname(e.target.value)} />
          <p className="form-row-hint">主机名只能包含字母、数字、连字符(-)和点(.),必须以字母或数字开头和结尾,最长 64 个字符。</p>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label required">IP 地址</div>
        <div className="form-row-control">
          <div className="choice-group" style={{ marginBottom: 12 }}>
            <button className={`choice-btn ${ipVersion === "ipv4" ? "active" : ""}`} onClick={() => setIpVersion("ipv4")}>IPv4</button>
            <button className={`choice-btn ${ipVersion === "ipv6" ? "active" : ""}`} onClick={() => setIpVersion("ipv6")}>IPv6</button>
          </div>
          {ipVersion === "ipv4" ? (
            <div className="ip-input">
              {octets.map((v, i) => (
                <React.Fragment key={i}>
                  <input className="ip-octet" value={v} onChange={setOctet(i)} maxLength={3} />
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

      <div className="form-row">
        <div className="form-row-label">节点角色</div>
        <div className="form-row-control">
          <div className="choice-group">
            {[{ v: "master", l: "Master" }, { v: "worker", l: "Worker" }, { v: "both", l: "Master & Worker" }].map((o) => (
              <button key={o.v} className={`choice-btn ${role === o.v ? "active" : ""}`} onClick={() => setRole(o.v)}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label">CPU 架构</div>
        <div className="form-row-control">
          <div className="choice-group">
            {[{ v: "amd64", l: "AMD64" }, { v: "arm64", l: "ARM64" }].map((o) => (
              <button key={o.v} className={`choice-btn ${arch === o.v ? "active" : ""}`} onClick={() => setArch(o.v)}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label">SSH 地址</div>
        <div className="form-row-control">
          <div className="host-port">
            <input className="input" placeholder="请输入 IP 地址" value={sshHost} onChange={(e) => setSshHost(e.target.value)} />
            <span className="sep">:</span>
            <input className="input port-input" type="number" value={sshPort} onChange={(e) => setSshPort(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label">SSH 用户名</div>
        <div className="form-row-control">
          <input className="input" value={sshUser} onChange={(e) => setSshUser(e.target.value)} />
          <p className="form-row-hint">SSH 用户名只能包含字母、数字、连字符(-),最长 32 个字符。</p>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label">SSH 认证</div>
        <div className="form-row-control">
          <div className="choice-group" style={{ marginBottom: 12 }}>
            <button className={`choice-btn ${authMethod === "password" ? "active" : ""}`} onClick={() => setAuthMethod("password")}>密码</button>
            <button className={`choice-btn ${authMethod === "key" ? "active" : ""}`} onClick={() => setAuthMethod("key")}>密钥</button>
          </div>
          {authMethod === "password" ? (
            <div className="password-input">
              <input className="input" type={showPwd ? "text" : "password"} placeholder="请输入 SSH 认证密码" value={password} onChange={(e) => setPassword(e.target.value)} />
              <span className="eye" onClick={() => setShowPwd((s) => !s)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </span>
            </div>
          ) : (
            <textarea className="input" rows="4" placeholder="请粘贴 SSH 私钥(PEM 格式)" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </div>
      </div>

      <div className="form-row" style={{ marginBottom: 4 }}>
        <div className="form-row-label">标签</div>
        <div className="form-row-control">
          <span className="add-link"><Icons.Plus /> 添加标签</span>
        </div>
      </div>

      {error && <div style={{ marginTop: 8, color: "var(--danger)", fontSize: 13 }}>{error}</div>}
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
        <p className="dropzone-main">拖拽文件到此处,或 <span className="link">点击上传</span></p>
        <p className="dropzone-hint">仅支持 CSV 格式,最多 1 个文件,文件大小不超过 5 MB</p>
      </div>
    </Modal>
  );
}

// ============ 节点扫描 (2步: 选择节点 → SSH认证) ============
function NodeScanModal({ onClose, onAdd }) {
  const [step, setStep] = React.useState("select"); // "select" | "auth"

  // 扫描输入
  const [ipText, setIpText] = React.useState(""); // 多行粘贴，每行一个 IP
  const [scanPort, setScanPort] = React.useState(22);
  const [scanning, setScanning] = React.useState(false);
  const [scanError, setScanError] = React.useState(null);
  const [results, setResults] = React.useState(null); // null=未扫描

  // 选择
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState(new Set());
  const [curPage, setCurPage] = React.useState(1);
  const PAGE_SIZE = 10;

  // SSH认证
  const [activeNode, setActiveNode] = React.useState(null);
  const [authUser, setAuthUser] = React.useState("root");
  const [authMethod, setAuthMethod] = React.useState("password");
  const [authSecret, setAuthSecret] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [verifyStatus, setVerifyStatus] = React.useState({}); // { ip: "ok"|"error"|"pending" }
  const [authError, setAuthError] = React.useState(null);

  // 解析多行 IP 文本，支持 IP 或 IP/CIDR
  const parseIpText = (text) => {
    return text.split(/[\n,；;]+/)
      .map((s) => s.trim())
      .filter((s) => /^[\d.:/]+$/.test(s));
  };

  const handleScan = async () => {
    const ips = parseIpText(ipText);
    if (!ips.length) {
      setScanError("请输入至少一个 IP 地址");
      return;
    }
    setScanning(true);
    setScanError(null);
    setSelected(new Set());
    setResults(null);
    try {
      // 单 IP 和 CIDR 都走 scanIP，单 IP 转为 /32
      const all = [];
      for (const entry of ips) {
        const cidr = entry.includes("/") ? entry : `${entry}/32`;
        const data = await window.kkApi.scanIP({ cidr, sshPort: Number(scanPort) });
        const list = Array.isArray(data) ? data : (data.items || []);
        all.push(...list);
      }
      // 去重
      const seen = new Set();
      setResults(all.filter((r) => {
        const ip = r.address || r.ip;
        if (seen.has(ip)) return false;
        seen.add(ip);
        return true;
      }));
      setCurPage(1);
    } catch (e) {
      setScanError(`扫描失败: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const filteredResults = (results || []).filter((r) => {
    const ip = r.address || r.ip || "";
    return !search || ip.includes(search);
  });
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE));
  const pageItems = filteredResults.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const toggleSelect = (ip) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(ip) ? next.delete(ip) : next.add(ip);
      return next;
    });
  };

  const allSelected = filteredResults.length > 0 && filteredResults.every((r) => selected.has(r.address || r.ip));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredResults.map((r) => r.address || r.ip)));
    }
  };

  const goToAuth = () => {
    const ips = [...selected];
    setActiveNode(ips[0] || null);
    setVerifyStatus({});
    setAuthError(null);
    setStep("auth");
  };

  const handleVerify = async () => {
    const ips = [...selected];
    setVerifying(true);
    setAuthError(null);
    const init = {};
    ips.forEach((ip) => (init[ip] = "pending"));
    setVerifyStatus(init);
    try {
      const hosts = ips.map((ip) => ({
        address: ip,
        port: Number(scanPort),
        user: authUser,
        ...(authMethod === "password" ? { password: authSecret } : { privateKey: authSecret }),
      }));
      const resp = await window.kkApi.preCheckHosts(hosts);
      const list = Array.isArray(resp) ? resp : (resp.items || []);
      const st = {};
      list.forEach((r) => {
        const ip = r.address || r.ip;
        const ok = ["ok", "succeeded", "reachable", "success"].includes(String(r.status).toLowerCase());
        st[ip] = ok ? "ok" : "error";
      });
      ips.forEach((ip) => { if (!st[ip]) st[ip] = "error"; });
      setVerifyStatus(st);
    } catch (e) {
      setAuthError(`验证失败: ${e.message}`);
      const st = {};
      ips.forEach((ip) => (st[ip] = "error"));
      setVerifyStatus(st);
    } finally {
      setVerifying(false);
    }
  };

  const handleAuthConfirm = () => {
    const nodes = [...selected].map((ip) => {
      const r = (results || []).find((x) => (x.address || x.ip) === ip) || {};
      return {
        name: r.hostname || ip.replace(/\./g, "-"),
        address: ip,
        port: Number(scanPort),
        user: authUser,
        arch: r.arch || "amd64",
        role: "",
        status: "ok",
        ...(authMethod === "password" ? { password: authSecret } : { privateKey: authSecret }),
      };
    });
    onAdd?.(nodes);
    onClose();
  };

  // ---- Step: 选择节点 ----
  if (step === "select") {
    const selectFooter = (
      <>
        <button className="btn btn-ghost" onClick={onClose}>取消</button>
        <button className="btn btn-primary" disabled={selected.size === 0} onClick={goToAuth}>
          选择节点
        </button>
      </>
    );

    return (
      <Modal title="选择节点" onClose={onClose} footer={selectFooter} size="lg">
        <div className="info-banner" style={{ marginBottom: 20 }}>
          <p className="info-banner-title">节点认证说明</p>
          <p className="info-banner-text">
            如果已设置节点 SSH 认证为免密,则可直接完成节点的添加;如未设置节点 SSH 认证为免密,则需要完成节点 SSH 认证设置方可完成节点的添加。
          </p>
        </div>

        {/* 扫描输入(未扫描时显示) */}
        {results === null && !scanning && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <textarea
                className="input"
                rows={4}
                placeholder=""
                value={ipText}
                onChange={(e) => setIpText(e.target.value)}
                style={{ width: 420, fontFamily: "var(--font-mono)", fontSize: 13, resize: "vertical" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, alignSelf: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: 13, whiteSpace: "nowrap" }}>SSH 端口</span>
                  <input className="input" style={{ width: 72 }} value={scanPort} onChange={(e) => setScanPort(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={handleScan} disabled={!ipText.trim() || scanning}>
                  扫描
                </button>
              </div>
            </div>
            <div style={{ color: "var(--text-tertiary)", fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
              请输入节点 IP 地址，每行一个，支持 CIDR 格式<br />
              例如：192.168.1.10<br />
              10.0.0.0/24
            </div>
            {scanError && <div style={{ color: "var(--danger)", fontSize: 13 }}>{scanError}</div>}
          </div>
        )}

        {scanning && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-tertiary)" }}>扫描中,请稍候...</div>
        )}

        {results !== null && (
          <>
            {/* 搜索 + 重新扫描 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
                <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input className="input" style={{ paddingLeft: 30 }} placeholder="请输入节点名称搜索" value={search} onChange={(e) => { setSearch(e.target.value); setCurPage(1); }} />
              </div>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { setResults(null); setScanError(null); }} disabled={scanning}>
                重新输入
              </button>
            </div>

            {/* 表格 */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ width: 48, padding: "10px 16px", textAlign: "left" }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, fontSize: 13 }}>节点 IP 地址</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: "center", padding: "32px 0", color: "var(--text-tertiary)" }}>未发现可用节点</td></tr>
                ) : pageItems.map((r) => {
                  const ip = r.address || r.ip;
                  return (
                    <tr key={ip} style={{ borderBottom: "1px solid var(--border-light)", cursor: "pointer" }} onClick={() => toggleSelect(ip)}>
                      <td style={{ padding: "10px 16px" }}>
                        <input type="checkbox" checked={selected.has(ip)} onChange={() => toggleSelect(ip)} onClick={(e) => e.stopPropagation()} />
                      </td>
                      <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)" }}>{ip}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 分页 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 12, fontSize: 13, color: "var(--text-secondary)" }}>
              <span>共 {filteredResults.length} 条</span>
              <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 16 }} disabled={curPage <= 1} onClick={() => setCurPage((p) => p - 1)}>‹</button>
              <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600, color: "var(--primary-600)", background: "var(--primary-50)", padding: "2px 8px", borderRadius: 4 }}>{curPage}</span>
              <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 16 }} disabled={curPage >= totalPages} onClick={() => setCurPage((p) => p + 1)}>›</button>
              <span>跳转到</span>
              <input className="input" style={{ width: 48, textAlign: "center", padding: "4px 6px" }}
                onKeyDown={(e) => { if (e.key === "Enter") { const n = parseInt(e.target.value); if (n >= 1 && n <= totalPages) { setCurPage(n); e.target.value = ""; } } }}
              />
              <span>页</span>
            </div>

            {/* 已选标签 */}
            {selected.size > 0 && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-hover)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                  已选择 <span style={{ color: "var(--success)" }}>{selected.size}</span> 个节点
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[...selected].map((ip) => (
                    <span key={ip} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", background: "#fff", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, fontFamily: "var(--font-mono)" }}>
                      {ip}
                      <span style={{ cursor: "pointer", color: "var(--text-tertiary)", marginLeft: 2 }} onClick={(e) => { e.stopPropagation(); toggleSelect(ip); }}>×</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    );
  }

  // ---- Step: 节点 SSH 认证 ----
  const selectedIps = [...selected];
  const authFooter = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>取消</button>
      <button className="btn btn-secondary" onClick={() => { setStep("select"); setVerifyStatus({}); }}>上一步</button>
      <button className="btn btn-primary" onClick={handleAuthConfirm}>确认</button>
    </>
  );

  return (
    <Modal title="节点 SSH 认证" onClose={onClose} footer={authFooter} size="lg">
      <div className="info-banner" style={{ marginBottom: 16 }}>
        <p className="info-banner-text" style={{ margin: 0 }}>
          <svg style={{ display: "inline", verticalAlign: "middle", marginRight: 6, color: "var(--primary-500)" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M7 6.5v3M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          已选择的节点中存在需要 SSH 认证的节点,需要完成节点 SSH 认证设置方可完成节点的添加,填写完认证信息后,请先完成"一键验证",然后点击"确定"按钮,即可完成节点添加。
        </p>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={handleVerify} disabled={verifying}>
        {verifying ? "验证中..." : "一键验证"}
      </button>

      {authError && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{authError}</div>}

      <div style={{ display: "flex", gap: 16, minHeight: 260 }}>
        {/* 左: 节点列表 */}
        <div style={{ width: 200, flexShrink: 0, border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {selectedIps.map((ip) => {
            const st = verifyStatus[ip];
            const isActive = activeNode === ip;
            return (
              <div
                key={ip}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                  cursor: "pointer", fontSize: 13, borderBottom: "1px solid var(--border-light)",
                  background: isActive ? "var(--primary-50)" : "transparent",
                  transition: "background 0.12s",
                }}
                onClick={() => setActiveNode(ip)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
                  <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 13v1.5M11 13v1.5M3.5 14.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ip}</span>
                {st === "ok"      && <span style={{ color: "var(--success)", fontSize: 16, flexShrink: 0 }}>✓</span>}
                {st === "error"   && <span style={{ color: "var(--danger)",  fontSize: 14, flexShrink: 0 }}>✗</span>}
                {st === "pending" && <span style={{ color: "var(--text-tertiary)", fontSize: 11, flexShrink: 0 }}>…</span>}
              </div>
            );
          })}
        </div>

        {/* 右: SSH 表单 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="form-row">
            <div className="form-row-label required">SSH 地址</div>
            <div className="form-row-control">
              <div className="host-port">
                <input className="input" value={activeNode || ""} disabled style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }} />
                <span className="sep">:</span>
                <input className="input port-input" value={scanPort} disabled style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }} />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-row-label required">SSH 用户名</div>
            <div className="form-row-control">
              <input className="input" value={authUser} onChange={(e) => setAuthUser(e.target.value)} />
              <p className="form-row-hint">SSH 用户名仅支持字母、数字、连接符 (-),最多 32 个字符</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-row-label required">SSH 认证</div>
            <div className="form-row-control">
              <div className="choice-group" style={{ marginBottom: 12 }}>
                <button className={`choice-btn ${authMethod === "password" ? "active" : ""}`} onClick={() => setAuthMethod("password")}>密码</button>
                <button className={`choice-btn ${authMethod === "key" ? "active" : ""}`} onClick={() => setAuthMethod("key")}>密钥</button>
              </div>
              {authMethod === "password" ? (
                <div className="password-input">
                  <input className="input" type={showPwd ? "text" : "password"} placeholder="请输入 SSH 密码" value={authSecret} onChange={(e) => setAuthSecret(e.target.value)} />
                  <span className="eye" onClick={() => setShowPwd((s) => !s)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                  </span>
                </div>
              ) : (
                <textarea className="input" rows={4} placeholder="请粘贴 SSH 私钥(PEM 格式)" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} value={authSecret} onChange={(e) => setAuthSecret(e.target.value)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============ 编辑节点 ============
function EditNodeModal({ node, onClose, onConfirm }) {
  const [hostname, setHostname] = React.useState(node?.name || "");
  const [ipVersion, setIpVersion] = React.useState("ipv4");
  const [octets, setOctets] = React.useState(() => {
    const parts = (node?.address || "").split(".");
    return [...parts, "", "", "", ""].slice(0, 4);
  });
  const [role, setRole] = React.useState(node?.role || "");
  const [arch, setArch] = React.useState(node?.arch || "amd64");
  const [sshHost, setSshHost] = React.useState(node?.address || "");
  const [sshPort, setSshPort] = React.useState(node?.port || 22);
  const [sshUser, setSshUser] = React.useState(node?.user || "root");
  const [authMethod, setAuthMethod] = React.useState(node?.privateKey ? "key" : "password");
  const [authSecret, setAuthSecret] = React.useState(node?.password || node?.privateKey || "");
  const [showPwd, setShowPwd] = React.useState(false);

  const setOctet = (i) => (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 3);
    setOctets((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  };

  const handleConfirm = () => {
    const ip = ipVersion === "ipv4" ? octets.join(".") : (node?.address || "");
    onConfirm({
      ...node,
      name: hostname,
      address: ip,
      port: Number(sshPort),
      user: sshUser,
      arch,
      role,
      ...(authMethod === "password"
        ? { password: authSecret, privateKey: undefined }
        : { privateKey: authSecret, password: undefined }),
    });
    onClose();
  };

  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>取消</button>
      <button className="btn btn-primary" onClick={handleConfirm} disabled={!hostname}>确认</button>
    </>
  );

  return (
    <Modal title="编辑节点" onClose={onClose} footer={footer}>
      <div className="form-row">
        <div className="form-row-label required">主机名</div>
        <div className="form-row-control">
          <input className="input" value={hostname} onChange={(e) => setHostname(e.target.value)} />
          <p className="form-row-hint">主机名只能包含字母、数字、连字符(-)和点(.),必须以字母或数字开头和结尾,最长 64 个字符。</p>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label required">IP 地址</div>
        <div className="form-row-control">
          <div className="choice-group" style={{ marginBottom: 12 }}>
            <button className={`choice-btn ${ipVersion === "ipv4" ? "active" : ""}`} onClick={() => setIpVersion("ipv4")}>IPv4</button>
            <button className={`choice-btn ${ipVersion === "ipv6" ? "active" : ""}`} onClick={() => setIpVersion("ipv6")}>IPv6</button>
          </div>
          {ipVersion === "ipv4" ? (
            <div className="ip-input">
              {octets.map((v, i) => (
                <React.Fragment key={i}>
                  <input className="ip-octet" value={v} onChange={setOctet(i)} maxLength={3} />
                  {i < 3 && <span className="ip-dot">·</span>}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <input className="input" placeholder="请输入 IPv6 地址" defaultValue={ipVersion === "ipv6" ? node?.address : ""} />
          )}
          <p className="form-row-hint">IP 地址范围应在 0.0.0.0 到 255.255.255.255。</p>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label">节点角色</div>
        <div className="form-row-control">
          <div className="choice-group">
            {[{ v: "master", l: "Master" }, { v: "worker", l: "Worker" }, { v: "both", l: "Master & Worker" }].map((o) => (
              <button key={o.v} className={`choice-btn ${role === o.v ? "active" : ""}`} onClick={() => setRole(o.v)}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label">CPU 架构</div>
        <div className="form-row-control">
          <div className="choice-group">
            {[{ v: "amd64", l: "AMD64" }, { v: "arm64", l: "ARM64" }].map((o) => (
              <button key={o.v} className={`choice-btn ${arch === o.v ? "active" : ""}`} onClick={() => setArch(o.v)}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label">SSH 地址</div>
        <div className="form-row-control">
          <div className="host-port">
            <input className="input" value={sshHost} onChange={(e) => setSshHost(e.target.value)} />
            <span className="sep">:</span>
            <input className="input port-input" type="number" value={sshPort} onChange={(e) => setSshPort(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label">SSH 用户名</div>
        <div className="form-row-control">
          <input className="input" value={sshUser} onChange={(e) => setSshUser(e.target.value)} />
          <p className="form-row-hint">SSH 用户名只能包含字母、数字、连字符(-),最长 32 个字符。</p>
        </div>
      </div>

      <div className="form-row">
        <div className="form-row-label">SSH 认证</div>
        <div className="form-row-control">
          <div className="choice-group" style={{ marginBottom: 12 }}>
            <button className={`choice-btn ${authMethod === "password" ? "active" : ""}`} onClick={() => setAuthMethod("password")}>密码</button>
            <button className={`choice-btn ${authMethod === "key" ? "active" : ""}`} onClick={() => setAuthMethod("key")}>密钥</button>
          </div>
          {authMethod === "password" ? (
            <div className="password-input">
              <input className="input" type={showPwd ? "text" : "password"} placeholder="请输入 SSH 认证密码" value={authSecret} onChange={(e) => setAuthSecret(e.target.value)} />
              <span className="eye" onClick={() => setShowPwd((s) => !s)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </span>
            </div>
          ) : (
            <textarea className="input" rows={4} placeholder="请粘贴 SSH 私钥(PEM 格式)" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} value={authSecret} onChange={(e) => setAuthSecret(e.target.value)} />
          )}
        </div>
      </div>

      <div className="form-row" style={{ marginBottom: 4 }}>
        <div className="form-row-label">标签</div>
        <div className="form-row-control">
          <span style={{ color: "var(--primary-500)", cursor: "pointer", fontSize: 13 }}>+ 添加标签</span>
        </div>
      </div>
    </Modal>
  );
}

window.Modal = Modal;
window.ManualAddModal = ManualAddModal;
window.FileUploadModal = FileUploadModal;
window.NodeScanModal = NodeScanModal;
window.EditNodeModal = EditNodeModal;
