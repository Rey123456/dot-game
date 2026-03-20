/**
 * main.js - 主逻辑，页面切换
 */

const App = (() => {
  let currentPage = 0;
  const totalPages = 8;

  // 页面初始化钩子：页面编号 → 初始化函数
  const pageInits = {
    0: () => Page0 && Page0.init(),
    1: () => Page1 && Page1.init(),
    2: () => Page2 && Page2.init(),
    3: () => Page3 && Page3.init(),
    4: () => Page4 && Page4.init(),
    5: () => Page5 && Page5.init(),
    6: () => Page6 && Page6.init(),
    7: () => Page7 && Page7.init(),
  };

  // 页面销毁钩子（离开页面时调用）
  const pageDestroys = {
    0: () => Page0 && Page0.reset && Page0.reset(),
    1: () => Page1 && Page1.reset && Page1.reset(),
    2: () => Page2 && Page2.destroy && Page2.destroy(),
    3: () => Page3 && Page3.reset && Page3.reset(),
    4: () => Page4 && Page4.destroy && Page4.destroy(),
    5: () => Page5 && Page5.reset && Page5.reset(),
    6: () => Page6 && Page6.destroy && Page6.destroy(),
    7: () => Page7 && Page7.reset && Page7.reset(),
  };

  function goToPage(n) {
    if (n < 0 || n >= totalPages) return;
    const fromPage = currentPage;

    // 销毁旧页面
    if (pageDestroys[fromPage]) pageDestroys[fromPage]();

    const oldEl = document.getElementById(`page-${fromPage}`);
    const newEl = document.getElementById(`page-${n}`);

    if (oldEl) oldEl.classList.remove('active');
    if (newEl) newEl.classList.add('active');

    currentPage = n;

    // 初始化新页面
    if (pageInits[n]) pageInits[n]();
  }

  function nextPage() {
    goToPage(currentPage + 1);
  }

  // 绑定翻页按钮（前进 + 后退，通过 data-target 指定目标页）
  function bindNavArrows() {
    document.querySelectorAll('.next-page-btn, .prev-page-btn').forEach(btn => {
      let lastTouchEnd = 0;
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        lastTouchEnd = Date.now();
        const target = parseInt(btn.dataset.target);
        if (!isNaN(target)) goToPage(target);
        else nextPage();
      }, { passive: false });
      btn.addEventListener('click', (e) => {
        if (Date.now() - lastTouchEnd < 300) return; // 屏蔽 touch 后补发的 click
        const target = parseInt(btn.dataset.target);
        if (!isNaN(target)) goToPage(target);
        else nextPage();
      });
    });
  }

  function init() {
    bindNavArrows();
    // 初始化第0页
    if (pageInits[0]) pageInits[0]();
  }

  // 防止默认滚动/缩放
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });

  return { init, goToPage, nextPage, getCurrentPage: () => currentPage };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
