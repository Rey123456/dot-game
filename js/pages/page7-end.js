/**
 * page7-end.js - 结束页
 * 满屏彩色圆点从上飘落，中央笑脸，点击重新开始
 */

const Page7 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  let confettiInterval = null;
  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    const confetti = document.getElementById('end-confetti');
    const faceDot = document.getElementById('end-face-dot');
    const page = document.getElementById('page-7');
    if (!confetti || !page) return;

    // 清空上次的撒花
    confetti.innerHTML = '';

    // 庆祝音效
    AudioEngine.playCelebrate();

    // 持续生成撒花圆点
    confettiInterval = setInterval(() => {
      spawnConfettiDot(confetti);
    }, 120);

    // 立即生成一批
    for (let i = 0; i < 15; i++) {
      setTimeout(() => spawnConfettiDot(confetti), i * 60);
    }

    // 点击任意位置重新开始
    function onRestart(e) {
      e.preventDefault();
      // 先清理自己
      reset();
      App.goToPage(0);
    }

    page.addEventListener('click', onRestart, { once: true });
    page.addEventListener('touchend', onRestart, { passive: false, once: true });
  }

  function spawnConfettiDot(container) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';

    const size = 20 + Math.random() * 40;
    const colorIdx = Math.floor(Math.random() * COLORS.length);
    const color = COLORS[colorIdx];
    const left = Math.random() * 100;
    const duration = 2.5 + Math.random() * 2;
    const delay = Math.random() * 0.5;

    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    dot.style.background = color;
    dot.style.left = left + 'vw';
    dot.style.animationDuration = duration + 's';
    dot.style.animationDelay = delay + 's';
    dot.style.opacity = '0';
    dot.style.boxShadow = `0 4px 12px ${color}88`;

    container.appendChild(dot);

    // 动画结束后移除，防止DOM堆积
    dot.addEventListener('animationend', () => dot.remove());

    // 触发动画（需要先插入DOM）
    requestAnimationFrame(() => {
      dot.style.opacity = '1';
    });
  }

  function reset() {
    if (confettiInterval) { clearInterval(confettiInterval); confettiInterval = null; }
    const confetti = document.getElementById('end-confetti');
    if (confetti) confetti.innerHTML = '';
    initialized = false;
  }

  return { init, reset };
})();
