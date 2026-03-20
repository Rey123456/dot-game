/**
 * page3-explode.js - 圆点分裂
 * 点击一个圆点 → 变成两个圆点（各 0.75 倍大小），可无限点击分裂
 * 圆点越来越小，最小 18px 后不再分裂（只变色）
 */

const Page3 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  const MIN_SIZE = 18;   // 最小不再分裂
  const SPLIT_RATIO = 0.72; // 每次分裂后子点大小比例
  const MAX_DOTS = 50;   // 最多圆点数，防止页面卡死

  let initialized = false;
  let dotList = []; // { el, x, y, size, colorIdx }

  function init() {
    if (initialized) return;
    initialized = true;

    const area = document.getElementById('explode-area');
    if (!area) return;

    area.innerHTML = '';
    dotList = [];

    // 初始：一个大圆点居中
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const w = area.clientWidth || window.innerWidth;
        const h = area.clientHeight || window.innerHeight;
        const startSize = Math.min(w, h) * 0.38;
        const colorIdx = Math.floor(Math.random() * COLORS.length);
        spawnDot(area, w / 2, h / 2, startSize, colorIdx, true);
      });
    });
  }

  /* ---- 创建一个圆点 ---- */
  function spawnDot(area, x, y, size, colorIdx, animate) {
    const el = document.createElement('div');
    el.className = 'mini-dot';
    const color = COLORS[colorIdx % COLORS.length];

    el.style.cssText = `
      position: absolute;
      border-radius: 50%;
      cursor: pointer;
      touch-action: none;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 4px 16px ${color}88;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%) scale(${animate ? 0 : 1});
      transition: ${animate ? 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none'};
    `;

    area.appendChild(el);

    if (animate) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transform = 'translate(-50%, -50%) scale(1)';
        });
      });
    }

    const dotObj = { el, x, y, size, colorIdx: colorIdx % COLORS.length };
    dotList.push(dotObj);
    bindDotEvents(area, dotObj);
    return dotObj;
  }

  /* ---- 点击事件 ---- */
  function bindDotEvents(area, dotObj) {
    const el = dotObj.el;
    let startX = 0, startY = 0, moved = false;

    const onStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY;
      moved = false;
    };

    const onMove = (e) => {
      const t = e.touches ? e.touches[0] : e;
      if (Math.abs(t.clientX - startX) > 8 || Math.abs(t.clientY - startY) > 8) moved = true;
    };

    const onEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (moved) return;
      onTap(dotObj, area);
    };

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });
    el.addEventListener('mousedown', onStart);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onEnd);
  }

  /* ---- 点击处理：分裂 or 变色 ---- */
  function onTap(dotObj, area) {
    const { el, x, y, size, colorIdx } = dotObj;
    const childSize = size * SPLIT_RATIO;

    if (dotList.length >= MAX_DOTS || childSize < MIN_SIZE) {
      // 太小了，只变色
      dotObj.colorIdx = (dotObj.colorIdx + 1) % COLORS.length;
      const color = COLORS[dotObj.colorIdx];
      el.style.background = color;
      el.style.boxShadow = `0 4px 12px ${color}88`;
      AudioEngine.playNoteByColor(dotObj.colorIdx);
      el.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform = 'translate(-50%,-50%) scale(1.5)';
      setTimeout(() => { el.style.transform = 'translate(-50%,-50%) scale(1)'; }, 200);
      return;
    }

    // 分裂动画：自身先放大再消失
    AudioEngine.playExplode();
    el.style.transition = 'transform 0.18s ease, opacity 0.18s ease';
    el.style.transform = 'translate(-50%,-50%) scale(1.4)';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';

    // 从列表移除
    dotList = dotList.filter(d => d !== dotObj);

    setTimeout(() => {
      el.remove();

      // 生成两个子点，分散在父点两侧
      const areaW = area.clientWidth;
      const areaH = area.clientHeight;
      const spread = childSize * 1.1 + 10;
      const angle = Math.random() * Math.PI * 2;

      for (let i = 0; i < 2; i++) {
        const dir = i === 0 ? 1 : -1;
        let tx = x + Math.cos(angle) * spread * dir;
        let ty = y + Math.sin(angle) * spread * dir;

        // 边界夹紧
        const r = childSize / 2;
        tx = Math.max(r, Math.min(areaW - r, tx));
        ty = Math.max(r, Math.min(areaH - r, ty));

        const newColorIdx = (colorIdx + i + 1) % COLORS.length;
        spawnDot(area, tx, ty, childSize, newColorIdx, true);
      }

      AudioEngine.playNoteByColor((colorIdx + 1) % COLORS.length);
    }, 180);
  }

  function reset() {
    initialized = false;
    dotList = [];
  }

  return { init, reset };
})();
