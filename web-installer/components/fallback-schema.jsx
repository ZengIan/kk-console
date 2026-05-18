// 内置 fallback schema — 当后端 API 不可用时使用(开发设计稿场景)
// 完整 schema 来自 web-installer/schema/kubernetes.json
const FALLBACK_SCHEMA = {
  dataSchema: {
    title: "Kubernetes",
    description: "Kubernetes 集群配置",
    type: "object",
    properties: {
      kubernetes: {
        type: "object",
        title: "集群配置",
        properties: {
          cluster_name: { type: "string", title: "集群名称", default: "host-cluster" },
          kube_version: {
            type: "string",
            title: "Kubernetes 版本",
            enum: ["v1.23.17", "v1.24.17", "v1.28.15", "v1.29.15", "v1.33.4"],
            default: "v1.33.4",
          },
          control_plane_endpoint: {
            type: "object",
            title: "控制平面端点",
            properties: {
              host: {
                type: "string",
                title: "集群访问地址",
                description: "集群的统一访问入口地址,通常为负载均衡域名。",
                default: "lb.rise.io",
              },
              port: { type: "integer", title: "端口", default: 6443, minimum: 1, maximum: 65535 },
              type: {
                type: "string",
                title: "路由方式",
                enum: ["local", "haproxy"],
                default: "local",
              },
              kubelet: {
                type: "object",
                title: "kubelet",
                properties: {
                  max_pods: { type: "integer", title: "每节点最大 Pod 数", default: 110, minimum: 1 },
                },
              },
            },
            required: ["host", "port", "type"],
          },
        },
        required: ["cluster_name", "kube_version", "control_plane_endpoint"],
      },
      cri: {
        type: "object",
        title: "容器运行时",
        properties: {
          container_manager: {
            type: "string",
            title: "类型",
            enum: ["docker", "containerd"],
            default: "containerd",
          },
        },
        required: ["container_manager"],
      },
      cni: {
        type: "object",
        title: "网络设置",
        properties: {
          type: {
            type: "string",
            title: "网络插件",
            enum: ["calico", "cilium", "flannel", "hybridnet", "kubeovn"],
            default: "calico",
          },
          service_cidr: {
            type: "string",
            title: "Service CIDR",
            description: "用于为集群中的 Service 分配虚拟 IP(ClusterIP)的网段。",
            default: "10.233.0.0/18",
          },
          pod_cidr: {
            type: "string",
            title: "Pod CIDR",
            description: "用于为集群中的所有 Pod 分配 IP 地址的网段。",
            default: "10.233.64.0/18",
          },
          ipv4_mask_size: { type: "integer", title: "IPv4 掩码大小", default: 24, minimum: 16, maximum: 30 },
          ipv6_mask_size: { type: "integer", title: "IPv6 掩码大小", default: 64, minimum: 48, maximum: 126 },
        },
      },
      image_registry: {
        type: "object",
        title: "镜像仓库配置",
        properties: {
          type: {
            type: "string",
            title: "安装类型",
            enum: ["", "harbor"],
            enumNames: ["不安装", "Harbor"],
            default: "harbor",
          },
          harbor: {
            type: "object",
            title: "Harbor 配置",
            properties: {
              data_dir: { type: "string", title: "数据目录", default: "/data/registry" },
            },
          },
          auth: {
            type: "object",
            title: "认证信息",
            properties: {
              registry: { type: "string", title: "仓库地址", default: "harbor.rise.io" },
              username: { type: "string", title: "用户名", default: "admin" },
              password: { type: "string", title: "密码", default: "Harbor12345" },
              insecure: { type: "boolean", title: "跳过证书认证", default: true },
            },
          },
        },
      },
      storage_class: {
        type: "object",
        title: "存储设置",
        properties: {
          nfs: {
            type: "object",
            title: "NFS 共享存储",
            properties: {
              enabled: { type: "boolean", title: "启用", default: true },
              default: { type: "boolean", title: "设置为默认存储", default: true },
              server: { type: "string", title: "NFS 服务器地址" },
              path: { type: "string", title: "共享目录", default: "/data/share" },
            },
            required: ["server"],
          },
        },
      },
    },
  },
  uiSchema: {
    fields: {
      image_registry: {
        fields: {
          auth: {
            fields: {
              password: { "ui:props": { type: "password" } },
            },
          },
        },
      },
    },
  },
};

window.FALLBACK_SCHEMA = FALLBACK_SCHEMA;
