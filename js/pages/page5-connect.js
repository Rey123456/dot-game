/**
 * page5-connect.js - 划线连点
 * 带数字编号的圆点，手指依次连接
 * 全部连完后闪光庆祝
 */

const Page5 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF'];
  const DOT_POSITIONS = [
    { x: 0.5, y: 0.25 },
    { x: 0.25, y: 0.5 },
    { x: 0.75, y: 0.45 },
    { x: 0.35, y: 0.72 },
    { x: 0.65, y: 0.72 },
  ];

  let initialized = false;
  let nextTarget = 1; // 下一个需要连接的点编号
  let dots = [];      // { el, x, y, num, connected }
  let canvas, ctx;
  let isDrawing = false;
  let lastX = 0, lastY = 0;
  let lineColor = '#FF4757';

  function init() {
    if (initialized) return;
    initialized = true;

    nextTarget = 1;
    dots = [];

    canvas = document.getElementById('connect-canvas');
    const layer = document.getElementById('connect-dots-layer');
    if (!canvas || !layer) return;

    // 设置 canvas 尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 清空圆点层
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

    // 触摸事件绑定到页面
    const page = document.getElementById('page-5');
    page.addEventListener('touchstart', onTouchStart, { passive: false });
    page.addEventListener('touchmove', onTouchMove, { passive: false });
    page.addEventListener('touchend', onTouchEnd, { passive: false });

    // 桌面鼠标
    page.addEventListener('mousedown', onMouseDown);
    page.addEventListener('mousemove', onMouseMove);
    page.addEventListener('mouseup', onMouseUp);
  }

  function getTouchPos(e) {
    const touch = e.touches[0] || e.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }

  function onTouchStart(e) {
    e.preventDefault();
    const { x, y } = getTouchPos(e);
    startDraw(x, y);
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getTouchPos(e);
    draw(x, y);
  }

  function onTouchEnd(e) {
    e.preventDefault();
    isDrawing = false;
  }

  function onMouseDown(e) {
    startDraw(e.clientX, e.clientY);
  }

  function onMouseMove(e) {
    if (!isDrawing) return;
    draw(e.clientX, e.clientY);
  }

  function onMouseUp() {
    isDrawing = false;
  }

  function startDraw(x, y) {
    // 检查是否点击到了目标圆点
    const target = dots.find(d => d.num === nextTarget && !d.connected);
    if (!target) return;

    const dx = x - target.x;
    const dy = y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 60) {
      // 成功点击目标点
      isDrawing = true;
      lastX = target.x;
      lastY = target.y;
      lineColor = COLORS[nextTarget - 1];

      // 标记连接状态
      target.connected = true;
      target.el.classList.add('connected');
      target.el.style.setProperty('--dot-color', COLORS[nextTarget - 1]);

      AudioEngine.playNoteByColor(nextTarget - 1);
      nextTarget++;

      // 检查是否全部连完
      if (nextTarget > dots.length) {
        setTimeout(celebrate, 300);
      }
    }
  }

  function draw(x, y) {
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.8;
    ctx.stroke();

    lastX = x;
    lastY = y;
  }

  function celebrate() {
    AudioEngine.playCelebrate();

    // 所有圆点闪光
    dots.forEach(d => {
      d.el.classList.add('flash');
    });

    // 显示翻页箭头
    const nextBtn = document.getElementById('next-btn-5');
    if (nextBtn) nextBtn.classList.remove('hidden');
  }

  return { init };
})();
