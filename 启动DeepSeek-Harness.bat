@echo off
setlocal
cd /d "%~dp0"
echo 正在启动 DeepSeek Harness...
node dsh-launcher.mjs start
echo.
echo 窗口即将关闭，如上方有报错请截图反馈。
pause