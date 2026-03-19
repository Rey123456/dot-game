/**
 * page0-start.js - 开始页
 * 一个大圆点，呼吸动画，点击进入游戏
 */

const Page0 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  let colorIdx = 0;
  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    const dot = document.getElementById('start-dot');
    if (!dot) return;

    // 点击进入游戏
    function onTap(e) {
      e.preventDefault();
      AudioEngine.unlock();
      AudioEngine.playBounce();

      // 点击动画：先放大再进入
      dot.style.animation = 'none';
      dot.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
      dot.style.transform = 'scale(1.3)';

      setTimeout(() => {
        dot.style.transform = 'scale(0)';
        dot.style.opacity = '0';
        setTimeout(() => {
          App.goToPage(1);
        }, 350);
      }, 220);
    }

    dot.addEventListener('click', onTap);
    dot.addEventListener('touchend', onTap, { passive: false });

    // 颜色轮换（每 3 秒换色，增加活力）
    setInterval(() => {
      colorIdx = (colorIdx + 1) % COLORS.length;
      dot.style.transition = 'background 0.8s ease, box-shadow 0.8s ease';
      dot.style.background = COLORS[colorIdx];
      dot.style.boxShadow = `0 8px 40px ${COLORS[colorIdx]}88`;
    }, 3000);
  }

  return { init };
})();
