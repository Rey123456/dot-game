# 点点点 🔴 - 儿童触摸互动游戏

灵感来自《点点点》绘本，专为 3-6 岁儿童设计的触摸互动网页游戏。

## 游戏页面

| 页面 | 玩法 |
|------|------|
| 开始页 | 点击大圆点进入游戏 |
| 页1 · 变色音符 | 点击圆点→变色+弹跳+音调 |
| 页2 · 变大变小 | 双指捏合缩放，拖拽变形，松手果冻回弹 |
| 页3 · 大爆炸 | 长按圆点引爆，碎成彩色小点 |
| 页4 · 摇一摇 | 摇动手机→圆点重排；倾斜→重力滚动 |
| 页5 · 连一连 | 手指依次连接编号圆点 |
| 页6 · 自由画布 | 点击生成圆点、滑动画线、拖拽移动、保存截图 |
| 结束页 | 撒花庆祝，点击重新开始 |

## 运行方式

直接用浏览器打开 `index.html`，无需任何构建步骤。

**推荐：** 使用本地 HTTP 服务器（部分功能如陀螺仪需要 HTTPS 或 localhost）：

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

然后在平板/手机浏览器访问 `http://本机IP:8080`。

## 技术栈

- 纯 HTML5 + CSS3 + JavaScript（无框架）
- **音效：** Web Audio API 程序生成（oscillator + envelope），不依赖外部音频文件
- **截图：** html2canvas（CDN）
- **CDN 依赖：**
  - Howler.js 2.2.4（音频管理）
  - html2canvas 1.4.1（截图）

## 文件结构

```
dot-game/
├── index.html          # 主入口
├── css/
│   └── style.css       # 所有样式（弹跳/果冻动画）
├── js/
│   ├── main.js         # 页面切换主逻辑
│   ├── audio.js        # Web Audio API 音效引擎
│   └── pages/
│       ├── page0-start.js      # 开始页
│       ├── page1-dots.js       # 变色音符
│       ├── page2-resize.js     # 缩放变形
│       ├── page3-explode.js    # 大爆炸
│       ├── page4-shake.js      # 摇一摇+重力
│       ├── page5-connect.js    # 划线连点
│       ├── page6-canvas.js     # 自由画布
│       └── page7-end.js        # 结束撒花
└── README.md
```

## iOS 特殊说明

页4（摇一摇）需要 `DeviceMotionEvent` 权限。进入该页面时会显示「开始摇一摇 🎲」按钮，点击后一次性申请两个权限（Motion + Orientation），避免多次弹窗。

## 设计规范

- 色系：七彩高饱和（红橙黄绿蓝靛紫）
- 背景：纯白 #FFFFFF
- 动画：`cubic-bezier(0.34, 1.56, 0.64, 1)` 弹跳/果冻感
- 设备：平板优先，手机兼容
