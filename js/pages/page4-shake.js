/**
 * page4-shake.js - 摇一摇·重力
 * iOS 需要权限按钮，Android 直接启用
 * 摇动重排，倾斜重力滚动
 */

const Page4 = (() => {
  const COLORS = ['#FF4757', '#FF6B35', '#FFD700', '#2ED573', '#1E90FF', '#5352ED', '#A055FF'];
  const DOT_COUNT = 8;

  let initialized = false;
  let motionEnabled = false;
  let dots = []; // { el, x, y, vx, vy, size, colorIdx }
  let animFrame = null;

  // 重力向量（由设备倾斜决定）
  let gravX = 0, gravY = 0;

  // 摇动检测
  let lastAccel = { x: 0, y: 0, z: 0 };
  let shakeThreshold = 15;
  let lastShakeTime = 0;

  function init() {
    if (initialized) return;
    initialized = true;

    const area = document.getElementById('shake-area');
    const permBtn = document.getElementById('shake-permission-btn');
    if (!area) return;

    // 清空并重建点（延迟一帧确保页面已渲染，clientWidth 有值）
    area.innerHTML = '';
    dots = [];
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        createDots(area);
      });
    });

    // iOS 权限处理
    // 判断是否需要申请权限：只要 requestPermission 方法存在就需要申请
    // 不依赖 UA 判断，避免新款 iPad UA 为 Macintosh 导致误判
    const needsPermission = typeof DeviceMotionEvent !== 'undefined' &&
                            typeof DeviceMotionEvent.requestPermission === 'function';

    if (needsPermission) {
      // iOS 13+：需要用户手势触发权限，显示按钮
      if (permBtn) {
        permBtn.classList.remove('hidden');
        permBtn.addEventListener('click', requestIOSPermission, { once: true });
        permBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          requestIOSPermission();
        }, { once: true });
      }
    } else {
      // Android / 桌面：直接启用（无需权限）
      if (permBtn) permBtn.classList.add('hidden');
      enableMotion();
    }

    startPhysics();
  }

  function requestIOSPermission() {
    const permBtn = document.getElementById('shake-permission-btn');

    // 同时申请两个权限（一次性）
    Promise.all([
      DeviceMotionEvent.requestPermission ? DeviceMotionEvent.requestPermission() : Promise.resolve('granted'),
      DeviceOrientationEvent.requestPermission ? DeviceOrientationEvent.requestPermission() : Promise.resolve('granted')
    ]).then(([motionState, orientationState]) => {
      if (motionState === 'granted' || orientationState === 'granted') {
        enableMotion();
        if (permBtn) permBtn.classList.add('hidden');
      }
    }).catch(err => {
      console.warn('Motion permission denied:', err);
      if (permBtn) permBtn.classList.add('hidden');
    });
  }

  function enableMotion() {
    motionEnabled = true;

    window.addEventListener('devicemotion', onDeviceMotion);
    window.addEventListener('deviceorientation', onDeviceOrientation);
  }

  function onDeviceMotion(e) {
    const accel = e.accelerationIncludingGravity || e.acceleration;
    if (!accel) return;

    const x = accel.x || 0;
    const y = accel.y || 0;
    const z = accel.z || 0;

    const dx = Math.abs(x - lastAccel.x);
    const dy = Math.abs(y - lastAccel.y);
    const dz = Math.abs(z - lastAccel.z);

    if ((dx + dy + dz) > shakeThreshold) {
      const now = Date.now();
      if (now - lastShakeTime > 800) {
        lastShakeTime = now;
        onShake();
      }
    }

    lastAccel = { x, y, z };
  }

  function onDeviceOrientation(e) {
    // gamma: 左右倾斜（-90到90），beta: 前后倾斜（-180到180）
    let gamma = e.gamma || 0;
    let beta  = e.beta  || 0;

    // 横屏适配：横屏时 beta/gamma 物理含义对调
    // screen.orientation.angle: 0=竖屏, 90=左横屏, 270=右横屏
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    if (angle === 90) {
      // 左横屏：gamma → gy，beta → -gx
      [gamma, beta] = [beta, -gamma];
    } else if (angle === -90 || angle === 270) {
      // 右横屏：gamma → -gy，beta → gx
      [gamma, beta] = [-beta, gamma];
    }

    // 用死区 ±8° 避免平放时漂移
    const deadZone = 8;
    const gx = Math.abs(gamma) > deadZone ? gamma / 60 : 0;
    const gy = Math.abs(beta) > deadZone ? beta / 60 : 0;

    gravX = clamp(gx, -1, 1) * 0.8;
    gravY = clamp(gy, -1, 1) * 0.8;
  }

  function onShake() {
    AudioEngine.playShake();
    scrambleDots();
  }

  function scrambleDots() {
    const area = document.getElementById('shake-area');
    if (!area) return;
    const w = area.clientWidth;
    const h = area.clientHeight;
    const margin = 60;

    dots.forEach(dot => {
      // 随机新位置 + 随机速度
      dot.x = margin + Math.random() * (w - margin * 2);
      dot.y = margin + Math.random() * (h - margin * 2);
      dot.vx = (Math.random() - 0.5) * 10;
      dot.vy = (Math.random() - 0.5) * 10;

      // 颜色随机换
      dot.colorIdx = Math.floor(Math.random() * COLORS.length);
      const color = COLORS[dot.colorIdx];
      dot.el.style.background = color;
      dot.el.style.boxShadow = `0 4px 16px ${color}88`;
    });
  }

  function createDots(area) {
    const w = area.clientWidth || window.innerWidth;
    const h = area.clientHeight || window.innerHeight;
    // 如果还是拿不到尺寸，100ms 后重试
    if (w < 10 || h < 10) {
      setTimeout(() => createDots(area), 100);
      return;
    }
    const margin = 60;

    for (let i = 0; i < DOT_COUNT; i++) {
      const colorIdx = i % COLORS.length;
      const color = COLORS[colorIdx];
      const size = 50 + Math.random() * 40;

      const el = document.createElement('div');
      el.className = 'shake-dot';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.background = color;
      el.style.boxShadow = `0 4px 16px ${color}88`;

      const x = margin + Math.random() * (w - margin * 2);
      const y = margin + Math.random() * (h - margin * 2);

      el.style.left = x + 'px';
      el.style.top = y + 'px';

      area.appendChild(el);

      dots.push({ el, x, y, vx: 0, vy: 0, size, colorIdx });
    }
  }

  function startPhysics() {
    const area = document.getElementById('shake-area');

    function loop() {
      if (!area) return;
      const w = area.clientWidth;
      const h = area.clientHeight;

      dots.forEach(dot => {
        // 施加重力
        dot.vx += gravX;
        dot.vy += gravY;

        // 阻尼（降低阻尼让移动更顺滑）
        dot.vx *= 0.96;
        dot.vy *= 0.96;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // 边界反弹
        const r = dot.size / 2;
        if (dot.x < r) { dot.x = r; dot.vx *= -0.6; }
        if (dot.x > w - r) { dot.x = w - r; dot.vx *= -0.6; }
        if (dot.y < r) { dot.y = r; dot.vy *= -0.6; }
        if (dot.y > h - r) { dot.y = h - r; dot.vy *= -0.6; }

        dot.el.style.left = dot.x + 'px';
        dot.el.style.top = dot.y + 'px';
        dot.el.style.transition = 'none';
      });

      animFrame = requestAnimationFrame(loop);
    }

    animFrame = requestAnimationFrame(loop);
  }

  function destroy() {
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;
    if (motionEnabled) {
      window.removeEventListener('devicemotion', onDeviceMotion);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      motionEnabled = false;
    }
    initialized = false;
    dots = [];
    gravX = 0;
    gravY = 0;
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  return { init, destroy };
})();
