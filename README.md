# DeepSeek Harness 启动器（dsh-launcher）

跨平台（Windows / macOS / Linux）的 DeepSeek Harness **多命令启动器**。
一键启动 `dsh web`、查看状态、停止服务，并自动打开浏览器。

## 安装

前提：已通过 npm 全局安装 DeepSeek Harness（`npm i -g @deepseek-ai/dsh`），且 Node >= 16。

**方式一：直接运行（无需安装）**

```bash
node dsh-launcher.mjs <command>
```

**方式二：全局注册为 `dsh-launcher` 命令**

```bash
npm link                 # 或 npm install -g .
dsh-launcher help
```

## 命令

| 命令 | 说明 |
|---|---|
| `list` | 列出可用 profile 及默认端口运行状态 |
| `start [profile]` | 启动指定 profile（默认 `web`），就绪后自动打开浏览器 |
| `status` | 查看是否正在运行及相关信息 |
| `stop` | 停止正在运行的 Harness |
| `doctor` | 诊断环境（node / dsh / DSH_HOME / 端口） |
| `help` | 显示帮助 |

`start` 选项

| 选项 | 说明 |
|---|---|
| `--profile <name>` | 指定 profile（等价于位置参数） |
| `--port <port>` | 端口（默认 3080） |
| `--host <host>` | 绑定地址（默认 127.0.0.1） |
| `--no-open` | 不自动打开浏览器 |
| `--detach` | 后台运行并记录 PID，可用 `stop` 停止 |

## 示例

```bash
dsh-launcher start               # 启动 web 并打开浏览器
dsh-launcher start tui           # 启动 tui profile
dsh-launcher start --port 8080   # 用 8080 端口启动
dsh-launcher list
dsh-launcher status
dsh-launcher stop
dsh-launcher doctor
```

## Windows 双击

Windows 用户可直接双击 `启动DeepSeek-Harness.bat`，它会调用 `node dsh-launcher.mjs start`。

> 注：该 `.bat` 为 **GBK 编码**（匹配中文 Windows 控制台），在 GitHub 网页上预览会显示乱码，下载到本地后正常。

## 工作原理

- `start` 先探测端口是否已运行：已运行则直接打开浏览器；否则以 `dsh --profile <profile> --host <host> --port <port> --no-open` 启动，并轮询端口就绪后打开浏览器。
- `stop` 通过 pidfile（`--detach` 启动的）或端口监听进程（Windows `netstat` / Unix `lsof`）定位并停止进程。
- 无第三方依赖，仅用 Node 内置模块。

## 文件

- `dsh-launcher.mjs` — 跨平台 CLI 主程序
- `启动DeepSeek-Harness.bat` — Windows 包装脚本
- `package.json` — npm 打包 / bin 声明
- `README.md` — 本说明
