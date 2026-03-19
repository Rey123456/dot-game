/**
 * page1-dots.js - 认识圆点·变色·音符
 * 3个圆点，点击变色+弹跳+音调
 * 点击3次后显示翻页箭头
 */

const Page1 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  // 每个圆点的颜色索引
  const dotColorIdx = [0, 1, 2];
  let totalClicks = 0;
  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    const dots = document.querySelectorAll('#page-1 .interactive-dot');
    const nextHint = document.getElementById('next-hint-1');

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => handleDotClick(dot, i));
      dot.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleDotClick(dot, i);
      }, { passive: false });
    });

    // 绑定箭头点击
    if (nextHint) {
      nextHint.addEventListener('click', () => App.goToPage(2));
      nextHint.addEventListener('touchend', (e) => {
        e.preventDefault();
        App.goToPage(2);
      }, { passive: false });
    }
  }

  function handleDotClick(dot, i) {
    // 切换到下一个颜色
    dotColorIdx[i] = (dotColorIdx[i] + 1) % COLORS.length;
    const color = COLORS[dotColorIdx[i]];

    dot.style.background = color;
    dot.style.boxShadow = `0 6px 24px ${color}99`;

    // 播放对应音调
    AudioEngine.playNoteByColor(dotColorIdx[i]);

    // 弹跳动画
    dot.classList.remove('bouncing');
    void dot.offsetWidth; // 强制重绘
    dot.classList.add('bouncing');
    dot.addEventListener('animationend', () => dot.classList.remove('bouncing'), { once: true });

    // 统计总点击次数
    totalClicks++;
    const nextHint = document.getElementById('next-hint-1');
    if (totalClicks >= 3 && nextHint) {
      nextHint.classList.remove('hidden');
    }
  }

  return { init };
})();
