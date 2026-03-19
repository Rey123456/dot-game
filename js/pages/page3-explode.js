/**
 * page3-explode.js - 圆点大爆炸（多段式）
 * 长按1.5秒触发分裂：1→2→4→8→16
 * 每个圆点都可再次长按继续分裂（直到16个为止）
 * 点击任意圆点可变色
 */

const Page3 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  // 分裂级数：1 → 2 → 4 → 8 → 16
  const SPLIT_LEVELS = [1, 2, 4, 8, 16];

  let initialized = false;
  let currentLevel = 0; // 当前在 SPLIT_LEVELS 的索引

  function init() {
    if (initialized) return;
    initialized = true;

    currentLevel = 0;
    const area = document.getElementById('explode-area');
    if (!area) return;

    // 清空旧内容
    area.innerHTML = '';

    // 创建初始大圆点（第0级）
    const startDot = createDot(area, area.clientWidth / 2, area.clientHeight / 2, 0, 160);
    // 加 id 方便复用样式
    startDot.el.id = 'explode-dot';
    startDot.el.classList.add('explode-main-dot');
  }

  /* ---- 创建可爆炸的圆点 ---- */
  function createDot(area, cx, cy, colorIdx, size) {
    const el = document.createElement('div');
    el.className = 'mini-dot';
    const color = COLORS[colorIdx % COLORS.length];
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.background = color;
    el.style.boxShadow = `0 6px 24px ${color}88`;
    el.style.position = 'absolute';
    el.style.borderRadius = '50%';
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.cursor = 'pointer';
    el.style.touchAction = 'none';
    area.appendChild(el);

    const dotObj = { el, x: cx, y: cy, size, colorIdx: colorIdx % COLORS.length, level: currentLevel };
    bindDotEvents(area, dotObj);
    return dotObj;
  }

  /* ---- 绑定长按分裂 + 点击变色 ---- */
  function bindDotEvents(area, dotObj) {
    const el = dotObj.el;
    let pressTimer = null;
    let pressStartTime = 0;
    let moved = false;
    let startX = 0, startY = 0;

    function onPressStart(e) {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches ? e.touches[0] : e;
      startX = touch.clientX;
      startY = touch.clientY;
      moved = false;

      // 充能动画
      el.classList.add('charging');
      pressStartTime = Date.now();

      pressTimer = setTimeout(() => {
        el.classList.remove('charging');
        tryExplode(area, dotObj);
      }, 1500);
    }

    function onPressMove(e) {
      const touch = e.touches ? e.touches[0] : e;
      if (Math.abs(touch.clientX - startX) > 10 || Math.abs(touch.clientY - startY) > 10) {
        moved = true;
        cancelPress();
      }
    }

    function onPressEnd(e) {
      e.preventDefault();
      e.stopPropagation();
      const held = Date.now() - pressStartTime;
      cancelPress();

      if (!moved && held < 1500) {
        // 短按：变色
        dotObj.colorIdx = (dotObj.colorIdx + 1) % COLORS.length;
        const color = COLORS[dotObj.colorIdx];
        el.style.background = color;
        el.style.boxShadow = `0 6px 24px ${color}88`;
        AudioEngine.playNoteByColor(dotObj.colorIdx);
        // 弹跳
        el.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        el.style.transform = 'translate(-50%,-50%) scale(1.4)';
        setTimeout(() => { el.style.transform = 'translate(-50%,-50%) scale(1)'; }, 200);
      }
    }

    function cancelPress() {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      el.classList.remove('charging');
    }

    el.addEventListener('touchstart', onPressStart, { passive: false });
    el.addEventListener('touchmove', onPressMove, { passive: false });
    el.addEventListener('touchend', onPressEnd, { passive: false });
    el.addEventListener('touchcancel', () => cancelPress(), { passive: false });

    el.addEventListener('mousedown', onPressStart);
    el.addEventListener('mousemove', onPressMove);
    el.addEventListener('mouseup', onPressEnd);
    el.addEventListener('mouseleave', () => cancelPress());
  }

  /* ---- 尝试分裂 ---- */
  function tryExplode(area, dotObj) {
    // 找到当前整体处于哪个级别
    const allDots = area.querySelectorAll('.mini-dot');
    const count = allDots.length;

    // 找下一个分裂目标数量
    const nextCount = SPLIT_LEVELS.find(n => n > count);
    if (!nextCount) return; // 已到16，不再分裂

    // 要生成几个子点
    const childCount = nextCount - count + 1; // 替换自身 + 新增

    AudioEngine.playExplode();

    // 记录爆炸中心
    const cx = dotObj.x;
    const cy = dotObj.y;
    const parentSize = dotObj.size;
    const areaW = area.clientWidth;
    const areaH = area.clientHeight;

    // 消除自身
    const el = dotObj.el;
    el.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    el.style.transform = 'translate(-50%,-50%) scale(2)';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';

    setTimeout(() => {
      el.remove();

      // 子圆点大小 = 父圆点 * 0.7，最小40
      const childSize = Math.max(40, parentSize * 0.7);
      const margin = childSize / 2 + 10;

      for (let i = 0; i < childCount; i++) {
        // 围绕爆炸中心散布
        const angle = (i / childCount) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 60 + Math.random() * Math.min(areaW, areaH) * 0.25;
        let tx = cx + Math.cos(angle) * radius;
        let ty = cy + Math.sin(angle) * radius;

        // 边界夹紧
        tx = Math.max(margin, Math.min(areaW - margin, tx));
        ty = Math.max(margin, Math.min(areaH - margin, ty));

        const colorIdx = Math.floor(Math.random() * COLORS.length);
        const d = createDot(area, cx, cy, colorIdx, childSize);

        // 动画到目标位置
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const delay = i * 30;
            d.el.style.transition = `left ${0.4}s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms,
                                     top  ${0.4}s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms,
                                     transform ${0.35}s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`;
            d.el.style.left = tx + 'px';
            d.el.style.top = ty + 'px';
            d.x = tx;
            d.y = ty;
          });
        });
      }
    }, 200);
  }

  return { init };
})();
