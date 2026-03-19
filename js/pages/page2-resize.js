/**
 * page2-resize.js - 变大变小+变形
 * 双指捏合/张开缩放，拖拽边缘变形，松手果冻回弹
 * 单指点击变色
 */

const Page2 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  let colorIdx = 4; // 初始蓝色
  let initialized = false;

  // 当前变换状态
  let scaleX = 1, scaleY = 1;

  // 捏合状态
  let pinchStartDist = 0;
  let pinchStartScaleX = 1;
  let pinchStartScaleY = 1;
  let isPinching = false;

  // 拖拽/点击状态
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let dragStartScaleX = 1, dragStartScaleY = 1;
  let touchMoved = false;

  function init() {
    if (initialized) return;
    initialized = true;

    const dot = document.getElementById('resize-dot');
    const area = document.getElementById('resize-area');
    if (!dot || !area) return;

    // 重置状态
    scaleX = 1; scaleY = 1;
    colorIdx = 4;
    dot.style.background = COLORS[colorIdx];
    applyTransform(dot);

    area.addEventListener('touchstart', onTouchStart, { passive: false });
    area.addEventListener('touchmove', onTouchMove, { passive: false });
    area.addEventListener('touchend', onTouchEnd, { passive: false });

    // 桌面端鼠标支持
    dot.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function dist(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onTouchStart(e) {
    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 2) {
      // 开始捏合
      isPinching = true;
      isDragging = false;
      pinchStartDist = dist(touches[0], touches[1]);
      pinchStartScaleX = scaleX;
      pinchStartScaleY = scaleY;
    } else if (touches.length === 1) {
      // 单指：记录起点，区分点击 vs 拖拽
      isDragging = true;
      isPinching = false;
      touchMoved = false;
      dragStartX = touches[0].clientX;
      dragStartY = touches[0].clientY;
      dragStartScaleX = scaleX;
      dragStartScaleY = scaleY;
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    const touches = e.touches;
    const dot = document.getElementById('resize-dot');

    if (isPinching && touches.length === 2) {
      const d = dist(touches[0], touches[1]);
      const ratio = d / pinchStartDist;

      const dx = Math.abs(touches[0].clientX - touches[1].clientX);
      const dy = Math.abs(touches[0].clientY - touches[1].clientY);

      if (dx > dy * 1.5) {
        scaleX = clamp(pinchStartScaleX * ratio, 0.3, 4);
        scaleY = pinchStartScaleY;
      } else if (dy > dx * 1.5) {
        scaleY = clamp(pinchStartScaleY * ratio, 0.3, 4);
        scaleX = pinchStartScaleX;
      } else {
        scaleX = clamp(pinchStartScaleX * ratio, 0.3, 4);
        scaleY = clamp(pinchStartScaleY * ratio, 0.3, 4);
      }

      applyTransform(dot);

    } else if (isDragging && touches.length === 1) {
      const dx = (touches[0].clientX - dragStartX) / 100;
      const dy = (touches[0].clientY - dragStartY) / 100;

      if (Math.abs(touches[0].clientX - dragStartX) > 8 ||
          Math.abs(touches[0].clientY - dragStartY) > 8) {
        touchMoved = true;
      }

      scaleX = clamp(dragStartScaleX + dx, 0.3, 4);
      scaleY = clamp(dragStartScaleY + dy, 0.3, 4);

      applyTransform(dot, false);
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    const dot = document.getElementById('resize-dot');

    if (isDragging && !touchMoved && !isPinching) {
      // 单指点击（未移动）→ 变色
      changeColor(dot);
    } else {
      // 拖拽或捏合结束 → 果冻回弹
      jellyRebound(dot);
      AudioEngine.playBounce();
    }

    isPinching = false;
    isDragging = false;
    touchMoved = false;
  }

  function changeColor(dot) {
    colorIdx = (colorIdx + 1) % COLORS.length;
    const color = COLORS[colorIdx];
    dot.style.transition = 'background 0.3s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
    dot.style.background = color;
    dot.style.boxShadow = `0 8px 40px ${color}88`;
    AudioEngine.playNoteByColor(colorIdx);
    // 小弹跳
    const prev = dot.style.transform;
    dot.style.transform = `${prev} scale(1.15)`;
    setTimeout(() => { dot.style.transform = prev; }, 200);
  }

  // 桌面鼠标事件（用于测试）
  let isMouseDown = false;
  let mouseStartX = 0, mouseStartY = 0;
  let mouseStartScaleX = 1, mouseStartScaleY = 1;

  function onMouseDown(e) {
    isMouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    mouseStartScaleX = scaleX;
    mouseStartScaleY = scaleY;
  }

  function onMouseMove(e) {
    if (!isMouseDown) return;
    const dot = document.getElementById('resize-dot');
    const dx = (e.clientX - mouseStartX) / 100;
    const dy = (e.clientY - mouseStartY) / 100;
    scaleX = clamp(mouseStartScaleX + dx, 0.3, 4);
    scaleY = clamp(mouseStartScaleY + dy, 0.3, 4);
    applyTransform(dot, false);
  }

  function onMouseUp() {
    if (!isMouseDown) return;
    isMouseDown = false;
    const dot = document.getElementById('resize-dot');
    jellyRebound(dot);
    AudioEngine.playBounce();
  }

  function applyTransform(dot, smooth = true) {
    const ratio = scaleX / scaleY;
    // 根据形变程度计算圆角（越扁/越长圆角越小）
    const borderRadius = ratio > 0.8 && ratio < 1.25 ? '50%' : '40%';

    if (smooth) {
      dot.style.transition = 'transform 0.1s, border-radius 0.2s';
    } else {
      dot.style.transition = 'none';
    }
    dot.style.transform = `scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`;
    dot.style.borderRadius = borderRadius;
  }

  function jellyRebound(dot) {
    // 果冻回弹：超调动画
    dot.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    // 保持缩放比，只让形状更接近圆形
    const avgScale = (scaleX + scaleY) / 2;
    scaleX = avgScale;
    scaleY = avgScale;
    dot.style.transform = `scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`;
    dot.style.borderRadius = '50%';
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  return { init };
})();
