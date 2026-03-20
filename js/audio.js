/**
 * audio.js - Web Audio API 音效生成
 * 所有音效完全程序生成，不依赖外部文件
 */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // 全局音量节点，统一控制
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.8; // 整体音量（>1.0 会削波失真）
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function getDest() {
    getCtx();
    return masterGain;
  }

  // 七个音调的频率 (哆来咪发索拉西)
  const NOTES = {
    do:  261.63,
    re:  293.66,
    mi:  329.63,
    fa:  349.23,
    sol: 392.00,
    la:  440.00,
    si:  493.88
  };

  // 颜色对应音调
  const COLOR_NOTE_MAP = [
    'do',   // 红
    're',   // 橙
    'mi',   // 黄
    'fa',   // 绿
    'sol',  // 蓝
    'la',   // 靛
    'si'    // 紫
  ];

  /**
   * 播放单个音调
   * @param {string} noteName - 音调名称 ('do'|'re'|'mi'|'fa'|'sol'|'la'|'si')
   * @param {number} duration - 持续时间(秒)
   */
  function playNote(noteName, duration = 0.5) {
    const ac = getCtx();
    const freq = NOTES[noteName] || NOTES.do;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.connect(gain);
    gain.connect(getDest());

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);

    // 简单 envelope：快攻击，慢衰减
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(1.0, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  }

  /**
   * 根据颜色索引播放音调
   * @param {number} colorIndex - 颜色索引 0-6
   */
  function playNoteByColor(colorIndex) {
    const noteName = COLOR_NOTE_MAP[colorIndex % 7];
    playNote(noteName);
  }

  /**
   * 弹跳音效：短促高音
   */
  function playBounce() {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(getDest());

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ac.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(500, ac.currentTime + 0.18);

    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.2);
  }

  /**
   * 爆炸音效：低频爆破
   */
  function playExplode() {
    const ac = getCtx();

    // 噪声爆破
    const bufSize = ac.sampleRate * 0.4;
    const buffer = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    }

    const source = ac.createBufferSource();
    source.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(2.0, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(getDest());
    source.start(ac.currentTime);
  }

  /**
   * 摇动音效：沙沙声
   */
  function playShake() {
    const ac = getCtx();
    const bufSize = ac.sampleRate * 0.3;
    const buffer = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5) * 0.7;
    }

    const source = ac.createBufferSource();
    source.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(1.5, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(getDest());
    source.start(ac.currentTime);
  }

  /**
   * 庆祝音效：上行琶音
   */
  function playCelebrate() {
    const ac = getCtx();
    const notes = ['do', 're', 'mi', 'sol', 'la'];
    notes.forEach((note, i) => {
      setTimeout(() => playNote(note, 0.4), i * 100);
    });
  }

  /**
   * 解锁 AudioContext（需要在用户交互中调用）
   */
  function unlock() {
    getCtx();
  }

  return {
    unlock,
    playNote,
    playNoteByColor,
    playBounce,
    playExplode,
    playShake,
    playCelebrate
  };
})();
