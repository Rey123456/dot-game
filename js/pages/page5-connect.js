/**
 * page5-connect.js - 划线连点
 * 带数字编号的圆点（1-5），依次按顺序连接
 * 手指从当前目标点出发划线到下一个目标点完成连接
 * 全部连完后闪光+庆祝+显示下一页按钮
 */

const Page5 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF'];
  const DOT_POSITIONS = [
    { x: 0.5,  y: 0.22 },
    { x: 0.22, y: 0.48 },
    { x: 0.78, y: 0.42 },
    { x: 0.35, y: 0.70 },
    { x: 0.65, y: 0.70 },
  ];

  let initialized = false;
  let nextTarget = 1;   // 下一个要连到的点（从1号开始，先点1，再连到2…）
  let dots = [];
  let canvas, ctx;
  let page;

  // 当前笔画状态
  let isDrawing = false;
  let fromDotIdx = -1;  // 正在从哪个点出发
  let lastX = 0, lastY = 0;
  let lineColor = '#FF4757';
  let celebrated = false;

  // 事件处理函数引用（用于解绑）
  let _onTouchStart, _onTouchMove, _onTouchEnd;
  let _onMouseDown, _onMouseMove, _onMouseUp;

  function init() {
    if (initialized) return;
    initialized = true;

    nextTarget = 1;
    dots = [];
    isDrawing = false;
    fromDotIdx = -1;
    celebrated = false;

    canvas = document.getElementById('connect-canvas');
    const layer = document.getElementById('connect-dots-layer');
    page = document.getElementById('page-5');
    if (!canvas || !layer || !page) return;

    // canvas 尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    layer.innerHTML = '';

    // 创建5个圆点
    const w = window.innerWidth;
    const h = window.innerHeight;
    DOT_POSITIONS.forEach((pos, i) => {
      const el = document.createElement('div');
      el.className = 'connect-dot';
      el.textContent = i + 1;
      const x = pos.x * w;
      const y = pos.y * h;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.background = COLORS[i];
      layer.appendChild(el);
      dots.push({ el, x, y, num: i + 1, connected: false });
    });

    // 高亮第1个目标点（起始点）
    highlightTarget(1);

    // 绑定事件
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
  }

  /* ---- 高亮当前目标点（发光脉冲） ---- */
  function highlightTarget(num) {
    dots.forEach(d => {
      if (d.num === num) {
        d.el.style.animation = 'dotFlash 0.8s ease-in-out infinite';
        d.el.style.boxShadow = `0 0 0 6px ${COLORS[num-1]}88`;
      } else if (!d.connected) {
        d.el.style.animation = '';
        d.el.style.boxShadow = '';
      }
    });
  }

  /* ---- 触摸/鼠标开始 ---- */
  function onStart(x, y) {
    if (celebrated) return;

    // 判断是否点在当前目标点（首次必须点1号，之后按顺序）
    const targetNum = nextTarget === 1 ? 1 : nextTarget - 1; // 从上一个连接点出发，或第1个点
    // 实际逻辑：从"最后一个已连接的点"或"1号点（未连接时）"出发
    const startDot = nextTarget === 1
      ? dots.find(d => d.num === 1)
      : dots.find(d => d.num === nextTarget - 1 && d.connected);

    if (!startDot) return;

    const dx = x - startDot.x;
    const dy = y - startDot.y;
    if (Math.sqrt(dx * dx + dy * dy) > 70) return; // 必须从出发点附近开始

    isDrawing = true;
    fromDotIdx = startDot.num - 1;
    lastX = startDot.x;
    lastY = startDot.y;
    lineColor = COLORS[startDot.num - 1];

    // 第1次点击：标记1号点为已连接
    if (nextTarget === 1) {
      startDot.connected = true;
      startDot.el.classList.add('connected');
      startDot.el.style.animation = '';
      AudioEngine.playNoteByColor(0);
      nextTarget = 2;
      highlightTarget(2);
    }
  }

  /* ---- 触摸/鼠标移动（画线） ---- */
  function onMove(x, y) {
    if (!isDrawing || celebrated) return;

    // 画线
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

    // 检查是否到达下一个目标点
    if (nextTarget <= dots.length) {
      const target = dots.find(d => d.num === nextTarget && !d.connected);
      if (target) {
        const dx = x - target.x;
        const dy = y - target.y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) {
          // 吸附到目标点
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          lastX = target.x;
          lastY = target.y;

          target.connected = true;
          target.el.classList.add('connected');
          target.el.style.animation = '';
          AudioEngine.playNoteByColor(target.num - 1);
          nextTarget++;

          if (nextTarget <= dots.length) {
            highlightTarget(nextTarget);
            lineColor = COLORS[nextTarget - 2]; // 用已连接点的颜色继续
          }

          if (nextTarget > dots.length) {
            isDrawing = false;
            setTimeout(celebrate, 400);
          }
        }
      }
    }
  }

  /* ---- 触摸/鼠标结束 ---- */
  function onEnd() {
    isDrawing = false;
  }

  /* ---- 庆祝 ---- */
  function celebrate() {
    if (celebrated) return;
    celebrated = true;

    AudioEngine.playCelebrate();
    dots.forEach(d => { d.el.classList.add('flash'); });

    // 解绑事件，防止继续响应
    page.removeEventListener('touchstart', _onTouchStart);
    page.removeEventListener('touchmove',  _onTouchMove);
    page.removeEventListener('touchend',   _onTouchEnd);
    page.removeEventListener('mousedown',  _onMouseDown);
    page.removeEventListener('mousemove',  _onMouseMove);
    page.removeEventListener('mouseup',    _onMouseUp);

    // 显示下一页按钮
    const nextBtn = document.getElementById('next-btn-5');
    if (nextBtn) {
      nextBtn.classList.remove('hidden');
      // 确保按钮在最顶层
      nextBtn.style.zIndex = '100';
    }
  }

  return { init };
})();
