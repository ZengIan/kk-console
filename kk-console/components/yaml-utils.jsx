// 简单 YAML 解析/序列化 — 只处理 KK 表单需要的扁平 + 浅层嵌套结构
// 行格式: "<indent><key>: <value>" 或 "<indent><key>:"(对象起始)

function parseYaml(text) {
  const lines = text.split("\n");
  const root = {};
  const stack = [{ indent: -1, obj: root }];

  for (let raw of lines) {
    // 去掉注释
    const hashIdx = raw.indexOf("#");
    if (hashIdx >= 0) raw = raw.slice(0, hashIdx);
    if (!raw.trim()) continue;

    const indent = raw.match(/^ */)[0].length;
    const body = raw.trim();
    const m = body.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;

    // 弹出 indent >= current 的栈
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].obj;

    const key = m[1];
    const val = m[2];
    if (val === "") {
      // 新对象
      const child = {};
      parent[key] = child;
      stack.push({ indent, obj: child });
    } else {
      parent[key] = parseScalar(val);
    }
  }
  return root;
}

function parseScalar(v) {
  v = v.trim();
  // 去掉引号
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

// 路径取值
function getPath(obj, path) {
  let cur = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[k];
  }
  return cur;
}

// 表单字段 ↔ YAML 路径 映射
const FIELD_MAP = {
  cluster_name:    ["kubernetes", "cluster_name"],
  kube_version:    ["kubernetes", "kube_version"],
  cp_host:         ["kubernetes", "control_plane_endpoint", "host"],
  cp_port:         ["kubernetes", "control_plane_endpoint", "port"],
  cp_type:         ["kubernetes", "control_plane_endpoint", "type"],
  max_pods:        ["kubernetes", "control_plane_endpoint", "kubelet", "max_pods"],
  cri:             ["cri", "container_manager"],
  cni:             ["cni", "type"],
  service_cidr:    ["cni", "service_cidr"],
  pod_cidr:        ["cni", "pod_cidr"],
  ipv4_mask:       ["cni", "ipv4_mask_size"],
  ipv6_mask:       ["cni", "ipv6_mask_size"],
  registry_type:   ["image_registry", "type"],
  harbor_dir:      ["image_registry", "harbor", "data_dir"],
  registry_addr:   ["image_registry", "auth", "registry"],
  registry_user:   ["image_registry", "auth", "username"],
  registry_pass:   ["image_registry", "auth", "password"],
  nfs_enabled:     ["storage_class", "nfs", "enabled"],
  nfs_default:     ["storage_class", "nfs", "default"],
  nfs_path:        ["storage_class", "nfs", "path"],
};

// 从 YAML 文本提取表单字段
function yamlToForm(text, prevForm) {
  const parsed = parseYaml(text);
  const next = { ...prevForm };
  for (const [k, path] of Object.entries(FIELD_MAP)) {
    const v = getPath(parsed, path);
    if (v !== undefined) next[k] = v;
  }
  return next;
}

// 从表单序列化 YAML(保持固定结构)
function formToYaml(f) {
  return `kubernetes:
  cluster_name: ${f.cluster_name}
  kube_version: ${f.kube_version}
  control_plane_endpoint:
    host: ${f.cp_host}
    port: ${f.cp_port}
    type: ${f.cp_type}
    kubelet:
      max_pods: ${f.max_pods}
cri:
  container_manager: ${f.cri}
cni:
  type: ${f.cni}
  service_cidr: ${f.service_cidr}
  pod_cidr: ${f.pod_cidr}
  ipv4_mask_size: ${f.ipv4_mask}
  ipv6_mask_size: ${f.ipv6_mask}
image_registry:
  type: ${f.registry_type}
  harbor:
    data_dir: ${f.harbor_dir}
  auth:
    registry: ${f.registry_addr}
    username: ${f.registry_user}
    password: ${f.registry_pass}
    insecure: true
storage_class:
  nfs:
    enabled: ${f.nfs_enabled}
    default: ${f.nfs_default}
    path: ${f.nfs_path}`;
}

window.parseYaml = parseYaml;
window.yamlToForm = yamlToForm;
window.formToYaml = formToYaml;

// ============ YAML 语法高亮 + 行号编辑器 ============
function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightYamlValue(val) {
  const t = val.trim();
  if (!t) return escHtml(val);
  if (/^(~|null|Null|NULL)$/.test(t))
    return `<span style="color:#f59e0b">${escHtml(val)}</span>`;
  if (/^(true|false|yes|no|True|False|Yes|No|TRUE|FALSE|YES|NO)$/.test(t))
    return `<span style="color:#f59e0b">${escHtml(val)}</span>`;
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t) || /^0x[0-9a-fA-F]+$/.test(t))
    return `<span style="color:#f59e0b">${escHtml(val)}</span>`;
  if (/^["']/.test(t))
    return `<span style="color:#34d399">${escHtml(val)}</span>`;
  if (/^[&*]/.test(t))
    return `<span style="color:#a78bfa">${escHtml(val)}</span>`;
  if (/^[|>]/.test(t))
    return `<span style="color:#94a3b8">${escHtml(val)}</span>`;
  return `<span style="color:#e2e8f0">${escHtml(val)}</span>`;
}

function highlightYamlLine(raw) {
  if (raw === undefined || raw === null) return " ";
  const line = String(raw);
  if (!line.trim()) return " ";

  const indent = line.match(/^(\s*)/)[1];
  const content = line.slice(indent.length);

  // 注释
  if (content.startsWith("#"))
    return escHtml(indent) + `<span style="color:#6b7280;font-style:italic">${escHtml(content)}</span>`;

  // 列表项标记
  let prefix = "";
  let rest = content;
  if (/^-\s/.test(content) || content === "-") {
    const dash = content.match(/^(-\s*)/)[1];
    prefix = `<span style="color:#94a3b8">${escHtml(dash)}</span>`;
    rest = content.slice(dash.length);
  }

  // key: value / key:
  const m = rest.match(/^([\w.\-/]+)(\s*:\s*)(.*)$/);
  if (m) {
    const [, key, colon, val] = m;
    // 行内注释
    const ciIdx = val.indexOf(" #");
    let valPart = val, commentPart = "";
    if (ciIdx >= 0) {
      valPart = val.slice(0, ciIdx);
      commentPart = `<span style="color:#6b7280;font-style:italic">${escHtml(val.slice(ciIdx))}</span>`;
    }
    return (
      escHtml(indent) +
      prefix +
      `<span style="color:#60a5fa">${escHtml(key)}</span>` +
      `<span style="color:#94a3b8">${escHtml(colon)}</span>` +
      (valPart ? highlightYamlValue(valPart) : "") +
      commentPart
    );
  }

  return escHtml(indent) + prefix + highlightYamlValue(rest);
}

function YamlEditor({ value, onChange }) {
  const textareaRef = React.useRef(null);
  const overlayRef  = React.useRef(null);
  const gutterRef   = React.useRef(null);

  const lines = (value || "").split("\n");

  const syncScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (overlayRef.current) {
      overlayRef.current.scrollTop  = scrollTop;
      overlayRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.style.transform = `translateY(-${scrollTop}px)`;
    }
  };

  return (
    <div className="yaml-code">
      {/* 行号槽 */}
      <div className="yaml-gutter" style={{ overflow: "hidden", minWidth: 48 }}>
        <div ref={gutterRef} style={{ paddingTop: 14, willChange: "transform" }}>
          {lines.map((_, i) => (
            <div key={i} className="yaml-lineno">{i + 1}</div>
          ))}
        </div>
      </div>

      {/* 编辑区 */}
      <div className="yaml-edit-wrap">
        {/* 高亮覆盖层 */}
        <div className="yaml-overlay" ref={overlayRef}>
          {lines.map((line, i) => (
            <div
              key={i}
              className="yaml-line"
              dangerouslySetInnerHTML={{ __html: highlightYamlLine(line) }}
            />
          ))}
        </div>
        {/* 透明可编辑 textarea */}
        <textarea
          ref={textareaRef}
          className="yaml-textarea"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          onScroll={syncScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}

window.YamlEditor = YamlEditor;
