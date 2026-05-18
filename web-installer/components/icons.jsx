// 图标库 — 简洁线性图标 + 步骤图标
const Icons = {
  // 安装向导 4 个步骤图标(参考原版风格,蓝色调)
  StepBasic: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="6" width="20" height="16" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.2"/>
      <path d="M9 14l3 3 7-7" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  StepPreview: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="6" width="20" height="16" rx="2" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.2"/>
      <rect x="7" y="10" width="6" height="2" rx="0.5" fill="#6366f1"/>
      <rect x="7" y="14" width="14" height="1.5" rx="0.5" fill="#a5b4fc"/>
      <rect x="7" y="17" width="10" height="1.5" rx="0.5" fill="#a5b4fc"/>
    </svg>
  ),
  StepInstall: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="5" y="14" width="18" height="9" rx="1.5" fill="#cffafe" stroke="#0891b2" strokeWidth="1.2"/>
      <path d="M14 4v10M10.5 10.5L14 14l3.5-3.5" stroke="#0891b2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  StepVerify: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 4l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V7l8-3z" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2"/>
      <path d="M10 14l3 3 5-6" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // 添加节点插画
  NodeAdd: () => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="10" y="14" width="22" height="14" rx="2" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5"/>
      <rect x="32" y="14" width="22" height="14" rx="2" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5"/>
      <rect x="10" y="36" width="22" height="14" rx="2" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5"/>
      <rect x="32" y="36" width="22" height="14" rx="2" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5"/>
      <circle cx="16" cy="21" r="1.5" fill="#3b82f6"/>
      <circle cx="16" cy="43" r="1.5" fill="#3b82f6"/>
      <circle cx="38" cy="21" r="1.5" fill="#93c5fd"/>
      <circle cx="38" cy="43" r="1.5" fill="#3b82f6"/>
      <rect x="20" y="20" width="9" height="1.5" rx="0.5" fill="#93c5fd"/>
      <rect x="20" y="24" width="6" height="1.2" rx="0.5" fill="#bfdbfe"/>
      <rect x="42" y="20" width="9" height="1.5" rx="0.5" fill="#bfdbfe"/>
      <rect x="20" y="42" width="9" height="1.5" rx="0.5" fill="#bfdbfe"/>
      <rect x="42" y="42" width="9" height="1.5" rx="0.5" fill="#93c5fd"/>
    </svg>
  ),

  // Logo - 蓝色版钻石形
  Logo: () => (
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
      <path d="M20 3L34 11V29L20 37L6 29V11L20 3Z" fill="url(#logo-grad)" stroke="#1d4ed8" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M20 11L28 15.5V24.5L20 29L12 24.5V15.5L20 11Z" fill="#fff" fillOpacity="0.95"/>
      <path d="M20 17.5L24 19.7V24.3L20 26.5L16 24.3V19.7L20 17.5Z" fill="#3b82f6"/>
      <defs>
        <linearGradient id="logo-grad" x1="6" y1="3" x2="34" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#60a5fa"/>
          <stop offset="1" stopColor="#1d4ed8"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  VersionDot: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="5" fill="#3b82f6" fillOpacity="0.2"/>
      <circle cx="6" cy="6" r="2.5" fill="#3b82f6"/>
    </svg>
  ),

  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7a5 5 0 0 1 9-3M12 7a5 5 0 0 1-9 3M11 2v3h-3M3 12V9h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),

  Upload: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 9V2M4 5l3-3 3 3M2 10v2h10v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  Scan: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 4V3a1 1 0 0 1 1-1h1M10 2h1a1 1 0 0 1 1 1v1M12 10v1a1 1 0 0 1-1 1h-1M4 12H3a1 1 0 0 1-1-1v-1M4 7h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  Sliders: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 4h7M13 4h.5M3 8h.5M6 8h7M3 12h10M14 12h-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="11.5" cy="4" r="1.5" fill="currentColor"/>
      <circle cx="4.5" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="12.5" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  ),
};

window.Icons = Icons;
