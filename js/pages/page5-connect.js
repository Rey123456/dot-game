/**
 * page5-connect.js - 划线连点（难度递增）
 * 初始5个点，完成后可点🔄继续，变成6个点……最多10个
 * 从1号点出发，手指划过目标点自动吸附
 */

const Page5 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF',
                  '#5352ED', '#A055FF', '#FF78C4', '#00CEC9', '#FDCB6E'];

  // 随机生成 n 个点的布局（避免重叠，保持在安全区内）
  function generatePositions(n) {
    const positions = [];
    const margin = 0.12;
    let attempts = 0;
    while (positions.length < n && attempts < 500) {
      attempts++;
      const x = margin + Math.random() * (1 - margin * 2);
      const y = 0.18 + Math.random() * (0.75 - 0.18); // 避开顶部hint和底部箭头
      // 检查与已有点的距离
      const minDist = n <= 6 ? 0.22 : n <= 8 ? 0.18 : 0.15;
      const ok = positions.every(p => Math.hypot(p.x - x, p.y - y) >= minDist);
      if (ok) positions.push({ x, y });
    }
    return positions;
  }

  let initialized = false;
  let currentDotCount = 5; // 当前难度（点数）
  let nextTarget = 1;
  let dots = [];
  let canvas, ctx;
  let page;

  let isDrawing = false;
  let lastX = 0, lastY = 0;
  let lineColor = '#FF4757';
  let celebrated = false;

  let _onTouchStart, _onTouchMove, _onTouchEnd;
  let _onMouseDown, _onMouseMove, _onMouseUp;

  function init() {
    if (initialized) return;
    initialized = true;
    currentDotCount = 5; // 每次进入页面从5个点开始
    startRound();
  }

  function startRound() {
    nextTarget = 1;
    dots = [];
    isDrawing = false;
    celebrated = false;

    canvas = document.getElementById('connect-canvas');
    const layer = document.getElementById('connect-dots-layer');
    page = document.getElementById('page-5');
    const retryBtn = document.getElementById('retry-btn-5');
    const nextBtn = document.getElementById('next-btn-5');
    if (!canvas || !layer || !page) return;

    // 隐藏按钮
    if (retryBtn) retryBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');

    // canvas 重置
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layer.innerHTML = '';

    // 生成圆点
    const w = window.innerWidth;
    const h = window.innerHeight;
    const positions = generatePositions(currentDotCount);

    positions.forEach((pos, i) => {
      const el = document.createElement('div');
      el.className = 'connect-dot';
      el.textContent = i + 1;
      const x = pos.x * w;
      const y = pos.y * h;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.background = COLORS[i % COLORS.length];
      layer.appendChild(el);
      dots.push({ el, x, y, num: i + 1, connected: false });
    });

    highlightTarget(1);

    // 解绑旧事件（防重复）
    unbindEvents();

    // 绑定新事件
    _onTouchStart = (e) => { e.preventDefault(); onStart(e.touches[0].clientX, e.touches[0].clientY); };
    _onTouchMove  = (e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    _onTouchEnd   = (e) => { e.preventDefault(); onEnd(); };
    _onMouseDown  = (e) => onStart(e.clientX, e.clientY);
    _onMouseMove  = (e) => onMove(e.clientX, e.clientY);
    _onMouseUp    = () => onEnd();

    page.addEventListener('touchstart', _onTouchStart, { passive: false });
    page.addEventListener('touchmove',  _onTouchMove,  { passive: false });
    page.addEventListener('touchend',   _onTouchEnd,   { passive: false });
    page.addEventListener('mousedown',  _onMouseDown);
    page.addEventListener('mousemove',  _onMouseMove);
    page.addEventListener('mouseup',    _onMouseUp);

    // 🔄 按钮：加难度重来
    if (retryBtn) {
      // 移除旧监听（克隆替换）
      const newRetry = retryBtn.cloneNode(true);
      retryBtn.parentNode.replaceChild(newRetry, retryBtn);
      newRetry.addEventListener('click', onRetry);
      newRetry.addEventListener('touchend', (e) => { e.preventDefault(); onRetry(); }, { passive: false });
    }
  }

  function onRetry() {
    if (currentDotCount < 10) currentDotCount++;
    startRound();
  }

  function highlightTarget(num) {
    dots.forEach(d => {
      if (d.num === num) {
        d.el.style.animation = 'dotFlash 0.8s ease-in-out infinite';
        d.el.style.boxShadow = `0 0 0 6px ${COLORS[(num - 1) % COLORS.length]}88`;
      } else if (!d.connected) {
        d.el.style.animation = '';
        d.el.style.boxShadow = '';
      }
    });
  }

  function onStart(x, y) {
    if (celebrated) return;

    if (nextTarget === 1) {
      // 第一个点：需要从点1附近开始（70px内），给孩子明确起始感
      const dot1 = dots.find(d => d.num === 1);
      if (!dot1) return;
      const dx = x - dot1.x;
      const dy = y - dot1.y;
      if (Math.sqrt(dx * dx + dy * dy) > 100) return;

      isDrawing = true;
      lastX = dot1.x;
      lastY = dot1.y;
      lineColor = COLORS[0];
      dot1.connected = true;
      dot1.el.classList.add('connected');
      dot1.el.style.animation = '';
      AudioEngine.playNoteByColor(0);
      nextTarget = 2;
      if (dots.length >= 2) highlightTarget(2);
    } else {
      // 后续点：手指从屏幕任意位置滑动即可，不限制起点
      // 只要开始滑动就进入绘制状态，以上一个已连接点为线段起点
      const prevDot = dots.find(d => d.num === nextTarget - 1 && d.connected);
      if (!prevDot) return;

      isDrawing = true;
      lastX = prevDot.x;
      lastY = prevDot.y;
      lineColor = COLORS[(nextTarget - 2) % COLORS.length];
    }
  }

  function onMove(x, y) {
    if (!isDrawing || celebrated) return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    lastX = x;
    lastY = y;

    if (nextTarget <= dots.length) {
      const target = dots.find(d => d.num === nextTarget && !d.connected);
      if (target) {
        const dx = x - target.x;
        const dy = y - target.y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) {
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          lastX = target.x;
          lastY = target.y;

          target.connected = true;
          target.el.classList.add('connected');
          target.el.style.animation = '';
          AudioEngine.playNoteByColor((target.num - 1) % COLORS.length);
          nextTarget++;

          if (nextTarget <= dots.length) {
            highlightTarget(nextTarget);
            lineColor = COLORS[(nextTarget - 2) % COLORS.length];
          }

          if (nextTarget > dots.length) {
            isDrawing = false;
            setTimeout(celebrate, 400);
          }
        }
      }
    }
  }

  function onEnd() {
    isDrawing = false;
  }

  function celebrate() {
    if (celebrated) return;
    celebrated = true;

    AudioEngine.playCelebrate();
    dots.forEach(d => { d.el.classList.add('flash'); });
    unbindEvents();

    // 显示🔄（如果还没到10个点）和→
    const retryBtn = document.getElementById('retry-btn-5');
    const nextBtn = document.getElementById('next-btn-5');

    if (retryBtn && currentDotCount < 10) {
      retryBtn.classList.remove('hidden');
    }
    if (nextBtn) {
      nextBtn.classList.remove('hidden');
      nextBtn.style.zIndex = '100';
    }
  }

  function unbindEvents() {
    if (!page) return;
    if (_onTouchStart) page.removeEventListener('touchstart', _onTouchStart);
    if (_onTouchMove)  page.removeEventListener('touchmove',  _onTouchMove);
    if (_onTouchEnd)   page.removeEventListener('touchend',   _onTouchEnd);
    if (_onMouseDown)  page.removeEventListener('mousedown',  _onMouseDown);
    if (_onMouseMove)  page.removeEventListener('mousemove',  _onMouseMove);
    if (_onMouseUp)    page.removeEventListener('mouseup',    _onMouseUp);
  }

  function reset() {
    unbindEvents();
    initialized = false;
    nextTarget = 1;
    dots = [];
    celebrated = false;
    isDrawing = false;
    currentDotCount = 5;
  }

  return { init, reset };
})();
