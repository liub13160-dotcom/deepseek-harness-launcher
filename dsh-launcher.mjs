#!/usr/bin/env node
/**
 * dsh-launcher — 跨平台的多命令 DeepSeek Harness 启动器
 *
 * 支持 Windows / macOS / Linux。仅依赖 Node 内置模块（无第三方依赖）。
 * 命令：list | start | status | stop | doctor | help
 */
import { spawn, spawnSync, execSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
const PROFILES_DIR = path.join(DSH_HOME, 'profiles');
const PIDFILE = path.join(DSH_HOME, 'dsh-launcher.pid');
const DEFAULT_PROFILE = 'web';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3080;

/* ---------------- 工具函数 ---------------- */
function log(...a) { console.log(...a); }
function warn(...a) { console.error(...a); }

function hasDsh() {
  const cmd = process.platform === 'win32' ? 'where dsh' : 'which dsh';
  try { execSync(cmd, { stdio: 'ignore' }); return true; } catch { return false; }
}

function isPortOpen(host, port, timeout = 1500) {
  return new Promise(resolve => {
    const req = http.get({ host, port, timeout }, res => { res.resume(); resolve(true); });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
  });
}

async function waitForPort(host, port, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await isPortOpen(host, port, 1200)) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

function openBrowser(url) {
  const p = process.platform;
  try {
    if (p === 'win32') spawnSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true });
    else if (p === 'darwin') spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
    else spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
    log(`已尝试打开浏览器: ${url}`);
  } catch { warn(`无法自动打开浏览器，请手动访问: ${url}`); }
}

function listProfiles() {
  if (!existsSync(PROFILES_DIR)) return [];
  return readdirSync(PROFILES_DIR).filter(d => {
    const full = path.join(PROFILES_DIR, d);
    try {
      // node_modules 是依赖目录，不是 profile；也过滤掉以 ./.DS_Store 等隐藏项
      if (!statSync(full).isDirectory()) return false;
      if (d === 'node_modules' || d.startsWith('.')) return false;
      return true;
    } catch { return false; }
  });
}

function pidsOnPort(port) {
  return new Promise(resolve => {
    const pids = new Set();
    try {
      if (process.platform === 'win32') {
        const out = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
        for (const line of out.split(/\r?\n/)) {
          // 例：TCP    127.0.0.1:3080    0.0.0.0:0    LISTENING    1234
          const m = line.match(/TCP\s+\S*:(\d+)\s+\S+\s+LISTENING\s+(\d+)/);
          if (m && parseInt(m[1], 10) === port) pids.add(m[2]);
        }
      } else {
        const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
        for (const s of out.split(/\s+/)) if (/^\d+$/.test(s)) pids.add(s);
      }
    } catch {}
    resolve([...pids]);
  });
}

/* ---------------- 命令 ---------------- */
function cmdHelp() {
  log(`
DeepSeek Harness 启动器  (跨平台 · 多命令)

用法:
  dsh-launcher <command> [选项]

命令:
  list                   列出可用 profile 及默认端口运行状态
  start [profile]        启动指定 profile（默认 ${DEFAULT_PROFILE}），就绪后自动打开浏览器
  status                 查看是否正在运行及相关信息
  stop                   停止正在运行的 Harness
  doctor                 诊断环境（node / dsh / DSH_HOME / 端口）
  help                   显示本帮助

start 选项:
  --profile <name>       指定 profile（等价于位置参数）
  --port <port>          指定端口（默认 ${DEFAULT_PORT}）
  --host <host>          绑定地址（默认 ${DEFAULT_HOST}）
  --no-open              不自动打开浏览器
  --detach               后台运行并记录 PID（可用 stop 停止）

示例:
  dsh-launcher start               启动 web 并打开浏览器
  dsh-launcher start tui           启动 tui profile
  dsh-launcher start --port 8080   用 8080 端口启动
  dsh-launcher status
  dsh-launcher stop
  dsh-launcher doctor
`);
}

async function cmdList() {
  log('可用 profile:');
  const profiles = listProfiles();
  if (profiles.length) profiles.forEach(p => log('  - ' + p));
  else log('  (未在 ' + PROFILES_DIR + ' 找到，默认仅 ' + DEFAULT_PROFILE + ')');
  log('');
  log('运行状态:');
  const url = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
  const open = await isPortOpen(DEFAULT_HOST, DEFAULT_PORT);
  log(`  ${url}  →  ${open ? '🟢 正在运行' : '⚪ 未运行'}`);
  log('');
  log(`dsh 可用: ${hasDsh() ? '是' : '否'}   DSH_HOME: ${DSH_HOME}`);
}

async function cmdStatus() {
  const url = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
  const open = await isPortOpen(DEFAULT_HOST, DEFAULT_PORT);
  log(`地址     : ${url}`);
  log(`状态     : ${open ? '🟢 正在运行' : '⚪ 未运行'}`);
  log(`DSH_HOME : ${DSH_HOME}`);
  log(`dsh 可用 : ${hasDsh() ? '是' : '否'}`);
  log(`node     : ${process.version}`);
  if (existsSync(PIDFILE)) log(`pidfile  : ${readFileSync(PIDFILE, 'utf8').trim()}`);
}

async function cmdDoctor() {
  log('DeepSeek Harness 诊断');
  log(`  node         : ${process.version}`);
  log(`  platform     : ${process.platform} ${process.arch}`);
  log(`  dsh          : ${hasDsh() ? '可用' : '未找到'}`);
  if (hasDsh()) { try { log('  dsh 版本    : ' + execSync('dsh --version', { encoding: 'utf8' }).trim()); } catch {} }
  log(`  DSH_HOME     : ${DSH_HOME}`);
  log(`  profiles 目录: ${existsSync(PROFILES_DIR) ? '存在' : '不存在'}`);
  if (existsSync(PROFILES_DIR)) log(`  profiles     : ` + (listProfiles().join(', ') || '(空)'));
  const open = await isPortOpen(DEFAULT_HOST, DEFAULT_PORT);
  log(`  默认端口     : ${DEFAULT_PORT} → ${open ? '监听中 🟢' : '未监听 ⚪'}`);
}

async function cmdStart(args) {
  let profile = DEFAULT_PROFILE, host = DEFAULT_HOST, port = DEFAULT_PORT;
  let open = true, detach = false, i = 0;
  const a = args.slice();
  while (i < a.length) {
    const tok = a[i];
    if (tok === '--no-open') { open = false; i++; }
    else if (tok === '--detach') { detach = true; i++; }
    else if (tok === '--profile' || tok === '--port' || tok === '--host') {
      const v = a[i + 1];
      if (v === undefined) { warn(`缺少 ${tok} 的值`); process.exit(1); }
      if (tok === '--profile') profile = v;
      else if (tok === '--port') port = parseInt(v, 10) || DEFAULT_PORT;
      else host = v;
      i += 2;
    } else if (!tok.startsWith('-')) { if (profile === DEFAULT_PROFILE) profile = tok; i += 1; }
    else { warn(`未知参数: ${tok}`); i += 1; }
  }

  const isWeb = profile === 'web';
  const url = `http://${host}:${port}`;

  // 已在运行 → 直接打开浏览器
  if (await isPortOpen(host, port)) {
    log(`${url} 已在运行，直接打开浏览器`);
    if (open) openBrowser(url);
    return;
  }

  if (!hasDsh()) { warn('未找到 dsh 命令，请先安装 DeepSeek Harness（npm i -g @deepseek-ai/dsh）'); process.exit(1); }

  const profiles = listProfiles();
  if (profiles.length && !profiles.includes(profile)) {
    warn(`未知 profile: ${profile}（可用: ${profiles.join(', ')}）`); process.exit(1);
  }

  const isWin = process.platform === 'win32';
  const dargs = isWeb ? ['--profile', profile, '--host', host, '--port', String(port), '--no-open'] : ['--profile', profile];
  // Windows 上 .cmd 不能直接被 spawn（会报 EINVAL），改用 cmd.exe /c dsh 让 cmd 在 PATH 里解析 dsh.cmd；
  // 其它平台直接 exec dsh（npm bin 的 shebang 脚本）。
  const spawnCmd = isWin ? 'cmd.exe' : 'dsh';
  const spawnArgs = isWin ? ['/c', 'dsh', ...dargs] : dargs;

  log(`启动 dsh ${profile}  @ ${host}:${port} ...`);
  let child;
  try {
    child = spawn(spawnCmd, spawnArgs, { stdio: detach ? 'ignore' : 'inherit', detached: detach, shell: false });
  } catch (e) { warn('启动失败: ' + e.message); process.exit(1); }

  if (detach) {
    child.unref();
    try { writeFileSync(PIDFILE, String(child.pid)); } catch {}
    log(`已在后台启动（PID ${child.pid}），可用 "dsh-launcher stop" 停止`);
  } else {
    child.on('exit', code => { log(''); log(`dsh 已退出（code=${code}）`); });
  }

  if (isWeb) {
    const ready = await waitForPort(host, port);
    if (ready) { log(`✅ ${url} 已就绪`); if (open) openBrowser(url); }
    else warn(`等待 ${url} 超时，请检查日志`);
  } else {
    log(`${profile} 已启动（非 web 目标，请到相应界面操作）`);
  }
  if (detach) process.exit(0);
}

async function cmdStop() {
  let stopped = false;

  // 1) 从 pidfile（--detach 启动的）
  if (existsSync(PIDFILE)) {
    const pid = readFileSync(PIDFILE, 'utf8').trim();
    if (pid && /^\d+$/.test(pid)) {
      log(`尝试通过 pidfile 停止进程 ${pid} ...`);
      try {
        if (process.platform === 'win32') execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
        else { try { process.kill(-parseInt(pid, 10), 'SIGTERM'); } catch { process.kill(parseInt(pid, 10), 'SIGTERM'); } }
        stopped = true;
      } catch (e) { warn(`停止 ${pid} 失败: ${e.message}`); }
    }
    try { rmSync(PIDFILE); } catch {}
  }

  // 2) 从端口找监听进程并停止
  const pids = await pidsOnPort(DEFAULT_PORT);
  if (pids.length) {
    log(`端口 ${DEFAULT_PORT} 上的进程: ${pids.join(', ')}`);
    for (const pid of pids) {
      try {
        if (process.platform === 'win32') execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
        else process.kill(parseInt(pid, 10), 'SIGTERM');
        stopped = true;
        log(`已停止 PID ${pid}`);
      } catch (e) { warn(`停止 ${pid} 失败: ${e.message}`); }
    }
  }

  if (!stopped) log('没有检测到正在运行的 Harness。');
  else log('完成。');
}

/* ---------------- 入口 ---------------- */
async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const rest = argv.slice(1);
  switch (cmd) {
    case 'list':    return await cmdList();
    case 'start':   return await cmdStart(rest);
    case 'status':  return await cmdStatus();
    case 'stop':    return await cmdStop();
    case 'doctor':  return await cmdDoctor();
    case 'help': case '--help': case '-h': return cmdHelp();
    default:
      if (cmd === undefined) return cmdHelp();
      warn('未知命令: ' + cmd);
      cmdHelp();
      process.exit(1);
  }
}
main().catch(e => { warn('出错: ' + (e && e.stack || e)); process.exit(1); });
