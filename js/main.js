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

  // 页面销毁钩子
  const pageDestroys = {
    4: () => Page4 && Page4.destroy && Page4.destroy(),
    6: () => Page6 && Page6.destroy && Page6.destroy(),
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

  // 绑定"下一页"按钮（通用，带 data-target 属性的箭头）
  function bindNavArrows() {
    document.querySelectorAll('.next-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.dataset.target);
        if (!isNaN(target)) goToPage(target);
        else nextPage();
      });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
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
