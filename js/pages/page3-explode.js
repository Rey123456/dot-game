/**
 * page3-explode.js - 圆点大爆炸
 * 长按1.5秒爆炸，碎成10-20个小圆点
 * 点击小圆点可变色
 */

const Page3 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  const MINI_COUNT_MIN = 10;
  const MINI_COUNT_MAX = 20;

  let pressTimer = null;
  let isExploded = false;
  let initialized = false;
  let pressStartTime = 0;

  function init() {
    if (initialized) return;
    initialized = true;

    isExploded = false;
    const dot = document.getElementById('explode-dot');
    const area = document.getElementById('explode-area');
    if (!dot || !area) return;

    // 重置状态
    dot.style.display = 'flex';
    dot.style.transform = '';
    dot.style.boxShadow = '';
    // 清除上次爆炸的小点
    area.querySelectorAll('.mini-dot').forEach(el => el.remove());

    // 长按事件
    dot.addEventListener('touchstart', onPressStart, { passive: false });
    dot.addEventListener('touchend', onPressEnd, { passive: false });
    dot.addEventListener('touchcancel', onPressEnd, { passive: false });
    dot.addEventListener('mousedown', onPressStart);
    dot.addEventListener('mouseup', onPressEnd);
    dot.addEventListener('mouseleave', onPressEnd);
  }

  function onPressStart(e) {
    if (isExploded) return;
    e.preventDefault();

    const dot = document.getElementById('explode-dot');
    dot.classList.add('charging');
    pressStartTime = Date.now();

    pressTimer = setTimeout(() => {
      explode();
    }, 1500);
  }

  function onPressEnd(e) {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    const dot = document.getElementById('explode-dot');
    if (dot) {
      dot.classList.remove('charging');
      if (!isExploded) {
        dot.style.transform = '';
      }
    }
  }

  function explode() {
    if (isExploded) return;
    isExploded = true;

    const dot = document.getElementById('explode-dot');
    const area = document.getElementById('explode-area');
    if (!dot || !area) return;

    // 爆炸音效
    AudioEngine.playExplode();

    // 主圆点爆炸动画
    dot.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    dot.style.transform = 'scale(2)';
    dot.style.opacity = '0';

    setTimeout(() => {
      dot.style.display = 'none';

      // 生成小圆点
      const count = Math.floor(Math.random() * (MINI_COUNT_MAX - MINI_COUNT_MIN + 1)) + MINI_COUNT_MIN;
      const areaW = area.clientWidth;
      const areaH = area.clientHeight;
      const centerX = areaW / 2;
      const centerY = areaH / 2;

      for (let i = 0; i < count; i++) {
        createMiniDot(area, centerX, centerY, areaW, areaH, i);
      }
    }, 200);
  }

  function createMiniDot(area, cx, cy, areaW, areaH, index) {
    const mini = document.createElement('div');
    mini.className = 'mini-dot';

    const size = Math.random() * 40 + 20; // 20-60px
    const colorIdx = Math.floor(Math.random() * COLORS.length);
    const color = COLORS[colorIdx];

    mini.style.width = size + 'px';
    mini.style.height = size + 'px';
    mini.style.background = color;
    mini.style.boxShadow = `0 4px 12px ${color}88`;

    // 起始位置：中心
    mini.style.left = cx + 'px';
    mini.style.top = cy + 'px';
    mini.style.transform = 'translate(-50%, -50%) scale(0)';
    mini.style.transition = 'none';

    area.appendChild(mini);

    // 目标位置：随机散开
    const margin = 60;
    const targetX = margin + Math.random() * (areaW - margin * 2);
    const targetY = margin + Math.random() * (areaH - margin * 2);

    // 延迟让DOM更新后再动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const delay = index * 20;
        mini.style.transition = `left ${0.4 + Math.random() * 0.3}s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms,
                                  top  ${0.4 + Math.random() * 0.3}s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms,
                                  transform ${0.35 + Math.random() * 0.2}s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`;
        mini.style.left = targetX + 'px';
        mini.style.top = targetY + 'px';
        mini.style.transform = 'translate(-50%, -50%) scale(1)';
      });
    });

    // 点击小圆点变色
    let miniColorIdx = colorIdx;
    mini.addEventListener('click', () => onMiniClick(mini, miniColorIdx, (newIdx) => { miniColorIdx = newIdx; }));
    mini.addEventListener('touchend', (e) => {
      e.preventDefault();
      onMiniClick(mini, miniColorIdx, (newIdx) => { miniColorIdx = newIdx; });
    }, { passive: false });
  }

  function onMiniClick(mini, colorIdx, setIdx) {
    const newIdx = (colorIdx + 1) % COLORS.length;
    setIdx(newIdx);
    const color = COLORS[newIdx];
    mini.style.background = color;
    mini.style.boxShadow = `0 4px 12px ${color}88`;
    AudioEngine.playNoteByColor(newIdx);

    // 小弹跳
    mini.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    mini.style.transform = 'translate(-50%, -50%) scale(1.4)';
    setTimeout(() => {
      mini.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 200);
  }

  return { init };
})();
