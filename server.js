const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const REPO_DIR = path.resolve(__dirname);
const BRIEFING_LOG = path.join(REPO_DIR, 'briefing.log');
const TEMPLATE_FILE = path.join(REPO_DIR, 'briefing_template.html');
const BRIEFING_FILE = path.join(REPO_DIR, 'briefing.html');
const SCRIPT_FILE = path.join(REPO_DIR, 'run_briefing.sh');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const validHash = (h) => /^[0-9a-f]{7,40}$/i.test(h);

// ── Briefing ──────────────────────────────────────────────────

app.get('/api/briefing/current', (_req, res) => {
  res.sendFile(BRIEFING_FILE);
});

app.get('/api/briefing/history', (_req, res) => {
  exec('git log --pretty=format:"%H|%s|%as" -- briefing.html', { cwd: REPO_DIR }, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const entries = stdout
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, subject, date] = line.split('|');
        return { hash, subject, date };
      });
    res.json(entries);
  });
});

app.get('/api/briefing/:hash', (req, res) => {
  const { hash } = req.params;
  if (!validHash(hash)) return res.status(400).json({ error: 'Invalid hash' });
  exec(`git show ${hash}:briefing.html`, { cwd: REPO_DIR }, (err, stdout) => {
    if (err) return res.status(404).json({ error: 'Not found' });
    res.type('html').send(stdout);
  });
});

// ── Generate (SSE) ────────────────────────────────────────────

let generating = false;
let generateStartedAt = null;

app.get('/api/generate', (req, res) => {
  if (generating) {
    return res.status(409).json({ error: 'Already generating' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  generating = true;
  generateStartedAt = new Date();

  if (!fs.existsSync(BRIEFING_LOG)) fs.writeFileSync(BRIEFING_LOG, '');

  const send = (line) => {
    const escaped = line.replace(/\n/g, '↵');
    res.write(`data: ${escaped}\n\n`);
  };

  send(`[Brief Bot] Generation started at ${generateStartedAt.toLocaleTimeString()}`);

  const proc = spawn('/bin/bash', [SCRIPT_FILE], { cwd: REPO_DIR, stdio: 'ignore' });
  const tail = spawn('tail', ['-f', '-n', '0', BRIEFING_LOG]);

  tail.stdout.on('data', (chunk) => {
    chunk.toString().split('\n').filter(Boolean).forEach(send);
  });

  proc.on('close', (code) => {
    tail.kill();
    generating = false;
    generateStartedAt = null;
    res.write(`event: done\ndata: ${JSON.stringify({ code })}\n\n`);
    res.end();
  });

  req.on('close', () => {
    proc.kill();
    tail.kill();
    generating = false;
    generateStartedAt = null;
  });
});

app.get('/api/status', (_req, res) => {
  res.json({ generating, startedAt: generateStartedAt });
});

// ── Template ──────────────────────────────────────────────────

app.get('/api/template', (_req, res) => {
  try {
    const content = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/template', (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string') return res.status(400).json({ error: 'content must be a string' });
  try {
    fs.writeFileSync(TEMPLATE_FILE, content, 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Schedule ──────────────────────────────────────────────────

app.get('/api/schedule', (_req, res) => {
  exec('crontab -l 2>/dev/null || true', (err, crontab) => {
    exec('git log -1 --pretty=format:"%ai|%s" -- briefing.html', { cwd: REPO_DIR }, (err2, lastCommit) => {
      const [lastRun, lastSubject] = (lastCommit || '').split('|');
      res.json({
        crontab: crontab || '',
        lastRun: lastRun?.trim() || null,
        lastSubject: lastSubject?.trim() || null,
      });
    });
  });
});

app.post('/api/schedule', (req, res) => {
  const { crontab } = req.body;
  if (typeof crontab !== 'string') return res.status(400).json({ error: 'crontab must be a string' });
  const tmpFile = `/tmp/brief-bot-crontab-${Date.now()}.txt`;
  try {
    fs.writeFileSync(tmpFile, crontab.endsWith('\n') ? crontab : crontab + '\n');
    exec(`crontab ${tmpFile}`, (err) => {
      fs.unlinkSync(tmpFile);
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Brief Bot UI → http://localhost:${PORT}`);
});
