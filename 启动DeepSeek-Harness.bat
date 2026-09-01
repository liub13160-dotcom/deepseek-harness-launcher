@echo off
setlocal EnableExtensions
title DeepSeek Harness
set "URL=http://127.0.0.1:3080"

echo ==============================================
echo             DeepSeek Harness 启动器
echo ==============================================
echo.

REM 确认 dsh 命令可用
where dsh >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 dsh 命令，请确认已安装 DeepSeek Harness。
    pause
    exit /b 1
)

REM 检查服务是否已经在运行（端口 3080）
powershell -NoProfile -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 3080); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
    echo 检测到 DeepSeek Harness 已在运行，正在打开浏览器...
    start "" "%URL%"
    timeout /t 2 >nul
    exit /b 0
)

echo 正在启动 DeepSeek Harness 服务...
echo 服务就绪后会自动在默认浏览器中打开 %URL%
echo 关闭本窗口即可停止服务。
echo.

dsh web

echo.
echo DeepSeek Harness 已退出。如果上方显示报错，请把错误信息反馈给我。
pause