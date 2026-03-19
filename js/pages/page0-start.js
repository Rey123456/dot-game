/**
 * page0-start.js - 开始页
 * 一个大圆点，呼吸动画，点击进入游戏
 */

const Page0 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  let colorIdx = 0;
  let initialized = false;
  let colorTimer = null;

  function init() {
    if (initialized) return;
    initialized = true;

    const dot = document.getElementById('start-dot');
    if (!dot) return;

    // 恢复圆点初始视觉状态（从结束页回来时重置）
    dot.style.transform = '';
    dot.style.opacity = '1';
    dot.style.transition = '';
    dot.style.animation = '';
    // 强制重新触发 CSS breathe 动画
    void dot.offsetWidth;
    dot.style.animation = 'breathe 2.4s ease-in-out infinite';

    // 点击进入游戏
    function onTap(e) {
      e.preventDefault();
      AudioEngine.unlock();
      AudioEngine.playBounce();

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

    // 颜色轮换
    if (colorTimer) clearInterval(colorTimer);
    colorTimer = setInterval(() => {
      colorIdx = (colorIdx + 1) % COLORS.length;
      dot.style.transition = 'background 0.8s ease, box-shadow 0.8s ease';
      dot.style.background = COLORS[colorIdx];
      dot.style.boxShadow = `0 8px 40px ${COLORS[colorIdx]}88`;
    }, 3000);
  }

  // 重置，让下次 init() 可以重新执行
  function reset() {
    initialized = false;
    if (colorTimer) { clearInterval(colorTimer); colorTimer = null; }
  }

  return { init, reset };
})();
