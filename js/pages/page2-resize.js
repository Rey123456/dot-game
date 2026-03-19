/**
 * page2-resize.js - 变大变小+变形
 * 双指捏合/张开缩放，拖拽边缘变形，松手果冻回弹
 */

const Page2 = (() => {
  let initialized = false;

  // 当前变换状态
  let scaleX = 1, scaleY = 1;
  let baseScaleX = 1, baseScaleY = 1;

  // 捏合状态
  let pinchStartDist = 0;
  let pinchStartScaleX = 1;
  let pinchStartScaleY = 1;
  let isPinching = false;

  // 拖拽变形状态
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let dragStartScaleX = 1, dragStartScaleY = 1;

  // 圆点位置（页面百分比）
  let dotCX = 50, dotCY = 50; // 中心
  let baseDotW = 150; // 基准宽度px

  function init() {
    if (initialized) return;
    initialized = true;

    const dot = document.getElementById('resize-dot');
    const area = document.getElementById('resize-area');
    if (!dot || !area) return;

    // 重置状态
    scaleX = 1; scaleY = 1;
    baseScaleX = 1; baseScaleY = 1;
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
      // 单指拖拽变形
      isDragging = true;
      isPinching = false;
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

      // 判断捏合方向（水平 vs 垂直）
      const dx = Math.abs(touches[0].clientX - touches[1].clientX);
      const dy = Math.abs(touches[0].clientY - touches[1].clientY);

      if (dx > dy * 1.5) {
        // 主要水平方向
        scaleX = clamp(pinchStartScaleX * ratio, 0.3, 4);
        scaleY = pinchStartScaleY;
      } else if (dy > dx * 1.5) {
        // 主要垂直方向
        scaleY = clamp(pinchStartScaleY * ratio, 0.3, 4);
        scaleX = pinchStartScaleX;
      } else {
        // 等比缩放
        scaleX = clamp(pinchStartScaleX * ratio, 0.3, 4);
        scaleY = clamp(pinchStartScaleY * ratio, 0.3, 4);
      }

      applyTransform(dot);

    } else if (isDragging && touches.length === 1) {
      const dx = (touches[0].clientX - dragStartX) / 100;
      const dy = (touches[0].clientY - dragStartY) / 100;

      scaleX = clamp(dragStartScaleX + dx, 0.3, 4);
      scaleY = clamp(dragStartScaleY + dy, 0.3, 4);

      applyTransform(dot, false); // 变形时不用圆角过渡
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    isPinching = false;
    isDragging = false;

    // 果冻回弹：基于当前比例，朝中间靠近一点
    const dot = document.getElementById('resize-dot');
    jellyRebound(dot);
    AudioEngine.playBounce();
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
