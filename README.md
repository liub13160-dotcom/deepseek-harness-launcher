# DeepSeek Harness 启动器

一键启动 DeepSeek Harness Web 界面（默认 `http://127.0.0.1:3080`）的 Windows 启动脚本。

## 使用

双击 `启动DeepSeek-Harness.bat`：

- 若服务已在运行 → 直接打开浏览器；
- 否则启动 `dsh web`，服务就绪后自动在默认浏览器中打开界面；
- 关闭命令行窗口即可停止服务。

## 说明

- 脚本为 **GBK 编码**（匹配中文 Windows 控制台代码页 936），中文提示可正常显示；在 GitHub 网页上预览可能显示为乱码，下载到本地后正常。
- 依赖：已通过 npm 全局安装的 `dsh` 命令（`@deepseek-ai/dsh`）。
- 修改端口：把脚本中的 `dsh web` 改为 `dsh web --port <端口>`。

## 文件

- `启动DeepSeek-Harness.bat` — 启动脚本