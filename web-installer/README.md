# Running the Web Installer

The web installer provides a user-friendly UI for Kubekey. It is launched using the `kk` command-line tool.

## Download Kubekey

Make sure you have Kubekey (`kk`) version 4.0.0 or higher installed.

```shell
curl -sfL https://get-kk.kubesphere.io | sh -
```

the file like this:

```shell
.
├── kk
├── kubekey-v4.x.x-linux-amd64.tar.gz
├── web-installer
│   ├── README.md
│   ├── dist
│   │   ├── assets
│   │   │   ├── xxx.js
│   │   ├── favicon.svg
│   │   ├── index.html
│   │   └── monaco-editor
│   │       ├── README.md
│   │       └── vs
│   ├── host_check.yaml
│   ├── kubernetes
│   │   ├── kkversion
│   │   ├── playbooks
│   │   │   └── xxx.yaml
│   │   └── roles
│   │       └── xxx.yaml
│   ├── kubesphere
│   │   └── playbooks
│   │   │   └── xxx.yaml
│   └── schema
│       ├── kubernetes.json
│       ├── kubesphere.json
│       └── product.json
└── web-installer.tgz

```

## Start the Web Installer

Run the following command to start the web installer on port 8080:

```shell
kk web --port 8080 --schema-path web-installer/schema --ui-path web-installer/dist
```
