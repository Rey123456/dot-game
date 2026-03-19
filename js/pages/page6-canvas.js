/**
 * page6-canvas.js - 自由画布
 * 点击生成圆点，滑动留轨迹，拖拽移动，长按删除
 * 右上角保存截图
 */

const Page6 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  const FLOAT_COUNT = 4; // 初始漂移圆点数

  let initialized = false;
  let freeDots = [];     // { el, x, y, vx, vy, size, colorIdx }
  let canvas, ctx;
  let isDrawing = false;
  let lastDX = 0, lastDY = 0;
  let drawColor = '#FF4757';

  // 触摸跟踪
  let touchMode = null; // 'draw' | 'drag' | null
  let dragTarget = null;
  let longPressTimer = null;
  let touchStartX = 0, touchStartY = 0;
  let touchMoved = false;

  let animFrame = null;
  let page = null;

  function init() {
    if (initialized) return;
    initialized = true;

    page = document.getElementById('page-6');
    canvas = document.getElementById('free-canvas');
    const dotsLayer = document.getElementById('free-dots-layer');
    if (!canvas || !dotsLayer) return;

    // 设置 canvas 尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 清空圆点层
    dotsLayer.innerHTML = '';
    freeDots = [];

    // 创建初始漂移圆点
    for (let i = 0; i < FLOAT_COUNT; i++) {
      createDot(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        i % COLORS.length,
        40 + Math.random() * 30,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      );
    }

    // 绑定 canvas 事件（画线）
    canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', onCanvasTouchEnd, { passive: false });
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);

    // 保存按钮
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', onSave);
      saveBtn.addEventListener('touchend', (e) => { e.preventDefault(); onSave(); }, { passive: false });
    }

    // 启动漂移动画
    startFloatAnim();
  }

  /* ---- 漂移动画 ---- */
  function startFloatAnim() {
    function loop() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      freeDots.forEach(dot => {
        if (dragTarget === dot) return; // 正在拖拽的不漂移

        dot.x += dot.vx;
        dot.y += dot.vy;

        const r = dot.size / 2;
        if (dot.x < r) { dot.x = r; dot.vx *= -1; }
        if (dot.x > w - r) { dot.x = w - r; dot.vx *= -1; }
        if (dot.y < r) { dot.y = r; dot.vy *= -1; }
        if (dot.y > h - r) { dot.y = h - r; dot.vy *= -1; }

        dot.el.style.left = dot.x + 'px';
        dot.el.style.top = dot.y + 'px';
      });

      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);
  }

  /* ---- 创建圆点 ---- */
  function createDot(x, y, colorIdx, size, vx = 0, vy = 0) {
    const dotsLayer = document.getElementById('free-dots-layer');
    if (!dotsLayer) return null;

    const el = document.createElement('div');
    el.className = 'free-dot';
    const color = COLORS[colorIdx % COLORS.length];
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.background = color;
    el.style.boxShadow = `0 4px 14px ${color}88`;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.pointerEvents = 'all';

    dotsLayer.appendChild(el);

    const dotObj = { el, x, y, vx, vy, size, colorIdx: colorIdx % COLORS.length };
    freeDots.push(dotObj);

    bindDotEvents(el, dotObj);
    return dotObj;
  }

  /* ---- 圆点事件 ---- */
  function bindDotEvents(el, dotObj) {
    let pressTimer = null;
    let pressStartX = 0, pressStartY = 0;
    let moved = false;

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      pressStartX = touch.clientX;
      pressStartY = touch.clientY;
      moved = false;

      // 长按删除
      pressTimer = setTimeout(() => {
        if (!moved) deleteDot(dotObj);
      }, 600);

      // 开始拖拽
      dragTarget = dotObj;
      touchMode = 'drag';
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      const dx = touch.clientX - pressStartX;
      const dy = touch.clientY - pressStartY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;

      if (dragTarget === dotObj) {
        dotObj.x = touch.clientX;
        dotObj.y = touch.clientY;
        el.style.left = dotObj.x + 'px';
        el.style.top = dotObj.y + 'px';
        clearTimeout(pressTimer);
      }
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(pressTimer);

      if (!moved) {
        // 单击：变色+音调
        dotObj.colorIdx = (dotObj.colorIdx + 1) % COLORS.length;
        const color = COLORS[dotObj.colorIdx];
        el.style.background = color;
        el.style.boxShadow = `0 4px 14px ${color}88`;
        AudioEngine.playNoteByColor(dotObj.colorIdx);

        el.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        el.style.transform = 'translate(-50%,-50%) scale(1.35)';
        setTimeout(() => {
          el.style.transform = 'translate(-50%,-50%) scale(1)';
        }, 200);
      }

      dragTarget = null;
      touchMode = null;
    }, { passive: false });

    // 桌面鼠标
    el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      dragTarget = dotObj;
      touchMode = 'drag';
    });
  }

  function deleteDot(dotObj) {
    dotObj.el.classList.add('deleting');
    setTimeout(() => {
      dotObj.el.remove();
      freeDots = freeDots.filter(d => d !== dotObj);
    }, 300);
  }

  /* ---- Canvas 画线事件 ---- */
  function onCanvasTouchStart(e) {
    e.preventDefault();
    if (touchMode === 'drag') return;

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchMoved = false;

    isDrawing = true;
    lastDX = touch.clientX;
    lastDY = touch.clientY;
    drawColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  function onCanvasTouchMove(e) {
    e.preventDefault();
    if (!isDrawing || touchMode === 'drag') return;
    const touch = e.touches[0];
    touchMoved = true;
    drawLine(touch.clientX, touch.clientY);
  }

  function onCanvasTouchEnd(e) {
    e.preventDefault();
    if (touchMode === 'drag') {
      dragTarget = null;
      touchMode = null;
      return;
    }

    if (!touchMoved) {
      // 单击空白区域：生成新圆点
      const colorIdx = Math.floor(Math.random() * COLORS.length);
      const size = 40 + Math.random() * 30;
      const newDot = createDot(touchStartX, touchStartY, colorIdx, size);
      if (newDot) {
        AudioEngine.playNoteByColor(colorIdx);
        // 弹跳出现
        newDot.el.style.transform = 'translate(-50%,-50%) scale(0)';
        newDot.el.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            newDot.el.style.transform = 'translate(-50%,-50%) scale(1)';
          });
        });
      }
    }

    isDrawing = false;
  }

  let isMouseDrawing = false;

  function onCanvasMouseDown(e) {
    if (touchMode === 'drag') return;
    isMouseDrawing = true;
    lastDX = e.clientX;
    lastDY = e.clientY;
    drawColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  function onCanvasMouseMove(e) {
    if (touchMode === 'drag' && dragTarget) {
      dragTarget.x = e.clientX;
      dragTarget.y = e.clientY;
      dragTarget.el.style.left = dragTarget.x + 'px';
      dragTarget.el.style.top = dragTarget.y + 'px';
      return;
    }
    if (!isMouseDrawing) return;
    drawLine(e.clientX, e.clientY);
  }

  function onCanvasMouseUp(e) {
    isMouseDrawing = false;
    dragTarget = null;
    touchMode = null;
  }

  function drawLine(x, y) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(lastDX, lastDY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    lastDX = x;
    lastDY = y;
  }

  /* ---- 保存截图 ---- */
  function onSave() {
    const page = document.getElementById('page-6');
    if (!page) return;

    // 隐藏UI元素后截图
    const saveBtn = document.getElementById('save-btn');
    const hint = document.getElementById('hint-6');
    const navArr = page.querySelector('.nav-arrow');
    if (saveBtn) saveBtn.style.visibility = 'hidden';
    if (hint) hint.style.visibility = 'hidden';
    if (navArr) navArr.style.visibility = 'hidden';

    if (typeof html2canvas !== 'undefined') {
      html2canvas(page, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        scale: window.devicePixelRatio || 1,
      }).then(c => {
        const link = document.createElement('a');
        link.download = 'dot-game-' + Date.now() + '.png';
        link.href = c.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.warn('截图失败:', err);
      }).finally(() => {
        if (saveBtn) saveBtn.style.visibility = 'visible';
        if (hint) hint.style.visibility = 'visible';
        if (navArr) navArr.style.visibility = 'visible';
      });
    } else {
      // 回退：直接截 canvas
      const link = document.createElement('a');
      link.download = 'dot-game-' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (saveBtn) saveBtn.style.visibility = 'visible';
      if (hint) hint.style.visibility = 'visible';
      if (navArr) navArr.style.visibility = 'visible';
    }
  }

  function destroy() {
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;
    initialized = false;
    freeDots = [];
    dragTarget = null;
    touchMode = null;
  }

  return { init, destroy };
})();
