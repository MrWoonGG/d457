

(function () {
  'use strict';

  const canvas = document.getElementById('atmosphere-canvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = 40;

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class RomanticParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 8 + 5;
      this.speedY = Math.random() * 1.1 + 0.5;
      this.speedX = Math.sin(Math.random() * Math.PI) * 0.8 - 0.4;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 1.8;
      this.type = Math.random() > 0.45 ? 'petal' : 'star';
      this.opacity = Math.random() * 0.45 + 0.25;
      this.color = Math.random() > 0.5 ? 'rgba(255, 107, 139,' : 'rgba(247, 168, 184,';
    }

    update() {
      this.y += this.speedY;
      this.x += Math.sin(this.y * 0.01) * 0.7 + this.speedX;
      this.rotation += this.rotationSpeed;

      if (this.y > height + 20 || this.x < -20 || this.x > width + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);

      if (this.type === 'petal') {
        ctx.beginPath();
        ctx.fillStyle = `${this.color} ${this.opacity})`;
        ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.fillStyle = `rgba(243, 207, 122, ${this.opacity * 0.75})`;
        ctx.arc(0, 0, this.size * 0.22, 0, Math.PI * 2);
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f3cf7a';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new RomanticParticle());
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);
    for (let p of particles) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(animateCanvas);
  }
  animateCanvas();

  const cursorGlow = document.getElementById('cursor-glow');
  window.addEventListener('mousemove', (e) => {
    if (cursorGlow) {
      cursorGlow.style.left = `${e.clientX}px`;
      cursorGlow.style.top = `${e.clientY}px`;
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target.closest('button, select, input, a')) return;
    spawnFloatingHeart(e.clientX, e.clientY);
  });

  function spawnFloatingHeart(x, y, customEmoji = null) {
    const emojis = ['❤️', '🤍', '✨', '🥰', '🌸'];
    const heart = document.createElement('div');
    heart.className = 'floating-heart-particle';
    heart.textContent = customEmoji || emojis[Math.floor(Math.random() * emojis.length)];
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.fontSize = `${Math.random() * 12 + 18}px`;

    const xShift = (Math.random() - 0.5) * 80;
    const rot = (Math.random() - 0.5) * 40;
    heart.style.setProperty('--x-shift', `${xShift}px`);
    heart.style.setProperty('--rot', `${rot}deg`);

    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 2400);
  }

  class RomanticAudioEngine {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.timer = null;
      this.step = 0;

      this.chords = [
        [146.83, 220.00, 293.66, 369.99, 440.00], 
        [123.47, 185.00, 246.94, 293.66, 369.99], 
        [98.00, 146.83, 196.00, 246.94, 293.66],  
        [110.00, 164.81, 220.00, 277.18, 329.63]  
      ];

      this.melodyScale = [
        293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 739.99
      ];
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterBus = this.ctx.createGain();
        this.masterBus.gain.setValueAtTime(0.85, this.ctx.currentTime);

        const delayL = this.ctx.createDelay();
        delayL.delayTime.setValueAtTime(0.32, this.ctx.currentTime);
        const feedbackL = this.ctx.createGain();
        feedbackL.gain.setValueAtTime(0.35, this.ctx.currentTime);
        const delayFilterL = this.ctx.createBiquadFilter();
        delayFilterL.type = 'lowpass';
        delayFilterL.frequency.setValueAtTime(2200, this.ctx.currentTime);

        const delayR = this.ctx.createDelay();
        delayR.delayTime.setValueAtTime(0.48, this.ctx.currentTime);
        const feedbackR = this.ctx.createGain();
        feedbackR.gain.setValueAtTime(0.32, this.ctx.currentTime);
        const delayFilterR = this.ctx.createBiquadFilter();
        delayFilterR.type = 'lowpass';
        delayFilterR.frequency.setValueAtTime(1900, this.ctx.currentTime);

        delayL.connect(delayFilterL);
        delayFilterL.connect(feedbackL);
        feedbackL.connect(delayR);

        delayR.connect(delayFilterR);
        delayFilterR.connect(feedbackR);
        feedbackR.connect(delayL);

        const wetGain = this.ctx.createGain();
        wetGain.gain.setValueAtTime(0.42, this.ctx.currentTime);

        delayFilterL.connect(wetGain);
        delayFilterR.connect(wetGain);
        wetGain.connect(this.ctx.destination);

        this.masterBus.connect(this.ctx.destination);
        this.masterBus.connect(delayL);
        this.masterBus.connect(delayR);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playNote(freq, startTime, duration = 3.2, type = 'sine', volume = 0.12) {
      if (!this.ctx) return;

      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = type;
      osc1.frequency.setValueAtTime(freq, startTime);

      osc1.detune.setValueAtTime((Math.random() - 0.5) * 4, startTime);

      gain1.gain.setValueAtTime(0.0001, startTime);
      gain1.gain.linearRampToValueAtTime(volume, startTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(volume * 0.45, startTime + 0.35);
      gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(gain1);
      gain1.connect(this.masterBus || this.ctx.destination);

      osc1.start(startTime);
      osc1.stop(startTime + duration + 0.1);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, startTime);
      osc2.detune.setValueAtTime((Math.random() - 0.5) * 6, startTime);

      const overtoneVol = volume * 0.38;
      gain2.gain.setValueAtTime(0.0001, startTime);
      gain2.gain.linearRampToValueAtTime(overtoneVol, startTime + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.7);

      osc2.connect(gain2);
      gain2.connect(this.masterBus || this.ctx.destination);

      osc2.start(startTime);
      osc2.stop(startTime + duration + 0.1);

      if (freq < 250) {
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq * 0.5, startTime);
        subGain.gain.setValueAtTime(0.0001, startTime);
        subGain.gain.linearRampToValueAtTime(volume * 0.35, startTime + 0.06);
        subGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.8);
        subOsc.connect(subGain);
        subGain.connect(this.masterBus || this.ctx.destination);
        subOsc.start(startTime);
        subOsc.stop(startTime + duration + 0.1);
      }
    }

    playChime(freq = 880) {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.5, now + 0.04);

      gain2.gain.setValueAtTime(0.0001, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.09, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.7);
    }

    playShahedEngine(duration = 1.0) {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const oscSub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + duration);

      oscSub.type = 'square';
      oscSub.frequency.setValueAtTime(190, now);
      oscSub.frequency.exponentialRampToValueAtTime(390, now + duration);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.linearRampToValueAtTime(3200, now + duration);

      const fadeDuration = 0.12;
      const microPause = 0.06; 
      const soundEndTime = now + duration - microPause;

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.20, now + 0.2);
      gain.gain.linearRampToValueAtTime(0.28, soundEndTime - fadeDuration);
      gain.gain.exponentialRampToValueAtTime(0.001, soundEndTime);
      gain.gain.setValueAtTime(0, soundEndTime);

      osc.connect(filter);
      oscSub.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      oscSub.start(now);
      osc.stop(soundEndTime);
      oscSub.stop(soundEndTime);
    }

    playCrispExplosion() {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.38);

      const subFilter = this.ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(320, now);
      subFilter.frequency.exponentialRampToValueAtTime(60, now + 0.38);

      oscGain.gain.setValueAtTime(0.85, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(subFilter);
      subFilter.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(120, now + 0.4);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.9, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    }

    start() {
      this.init();
      this.isPlaying = true;
      this.step = 0;

      const scheduleTick = () => {
        if (!this.isPlaying) return;
        const now = this.ctx.currentTime;
        const chordIndex = Math.floor(this.step / 8) % this.chords.length;
        const chord = this.chords[chordIndex];

        const noteIdx = this.step % chord.length;
        const bassFreq = chord[0];
        const arpFreq = chord[noteIdx];

        if (this.step % 8 === 0) {
          this.playNote(bassFreq, now, 4.0, 'triangle', 0.14);
        }

        this.playNote(arpFreq, now, 2.2, 'sine', 0.07);

        if (Math.random() > 0.45) {
          const melodyNote = this.melodyScale[Math.floor(Math.random() * this.melodyScale.length)];
          this.playNote(melodyNote, now + 0.15, 2.6, 'triangle', 0.08);
        }

        this.step++;
        this.timer = setTimeout(scheduleTick, 530);
      };

      scheduleTick();
    }

    stop() {
      this.isPlaying = false;
      if (this.timer) clearTimeout(this.timer);
    }

    toggle() {
      if (this.isPlaying) {
        this.stop();
        return false;
      } else {
        this.start();
        return true;
      }
    }
  }

  const romanticAudio = new RomanticAudioEngine();
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioWidget = document.getElementById('audioWidget');
  const vinylDisc = document.getElementById('vinylDisc');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const soundWave = document.getElementById('soundWave');
  const audioStatus = document.getElementById('audioStatus');

  function updateAudioUI(isPlaying) {
    if (isPlaying) {
      vinylDisc.classList.add('spinning');
      soundWave.classList.add('playing');
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      audioStatus.textContent = 'Звучить для тебе ✨';
    } else {
      vinylDisc.classList.remove('spinning');
      soundWave.classList.remove('playing');
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      audioStatus.textContent = 'Увімкнути музику 🎵';
    }
  }

  function handleAudioToggle() {
    const isPlaying = romanticAudio.toggle();
    updateAudioUI(isPlaying);
  }

  audioToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleAudioToggle();
  });
  audioWidget.addEventListener('click', handleAudioToggle);

  const countDaysEl = document.getElementById('countDays');
  const countHoursEl = document.getElementById('countHours');
  const countMinutesEl = document.getElementById('countMinutes');
  const countSecondsEl = document.getElementById('countSeconds');
  const countMsEl = document.getElementById('countMs');

  const relationshipStart = new Date(2025, 9, 1, 23, 3, 0);

  let lastTimelineSec = -1;

  function updateTimelineCounters(now) {
    const currentSec = Math.floor(now.getTime() / 1000);
    if (currentSec === lastTimelineSec) return;
    lastTimelineSec = currentSec;

    const timelineCounters = document.querySelectorAll('.timeline-live-counter');
    timelineCounters.forEach(el => {
      const targetStr = el.getAttribute('data-target');
      if (!targetStr) return;
      const targetDate = new Date(targetStr);
      let diffMs = now.getTime() - targetDate.getTime();
      if (diffMs < 0) diffMs = 0;

      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = Math.floor(totalSec % 60);

      let dayWord = 'днів';
      const lastDigit = days % 10;
      const lastTwoDigits = days % 100;
      if (lastTwoDigits < 11 || lastTwoDigits > 14) {
        if (lastDigit === 1) dayWord = 'день';
        else if (lastDigit >= 2 && lastDigit <= 4) dayWord = 'дні';
      }

      const isOngoing = el.closest('.timeline-card')?.querySelector('.timer-badge-tag')?.textContent.includes('Триває');
      const suffix = isOngoing ? '' : ' тому';

      el.innerHTML = `<span class="counter-days">${days} ${dayWord}</span><span class="counter-sep">•</span><span class="counter-time">${hours} год ${mins} хв ${String(secs).padStart(2, '0')} сек${suffix}</span>`;
    });
  }

  function calculateLoveTime() {
    const now = new Date();
    let diffMs = now.getTime() - relationshipStart.getTime();

    if (diffMs < 0) {
      diffMs = Math.abs(diffMs);
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const centiseconds = Math.floor((diffMs % 1000) / 10);

    if (countDaysEl) countDaysEl.textContent = days.toLocaleString('uk-UA');
    if (countHoursEl) countHoursEl.textContent = String(hours).padStart(2, '0');
    if (countMinutesEl) countMinutesEl.textContent = String(minutes).padStart(2, '0');
    if (countSecondsEl) countSecondsEl.textContent = String(seconds).padStart(2, '0');
    if (countMsEl) countMsEl.textContent = String(centiseconds).padStart(2, '0');

    updateTimelineCounters(now);

    requestAnimationFrame(calculateLoveTime);
  }

  requestAnimationFrame(calculateLoveTime);

  const tiltCard = document.getElementById('tiltPhotoCard');
  const tiltGlare = document.getElementById('tiltGlare');
  const dianaPhoto = document.getElementById('dianaPhoto');
  const photoInnerFrame = document.getElementById('photoInnerFrame');
  const photoEditFlash = document.getElementById('photoEditFlash');
  const photoSubtitle = document.getElementById('photoSubtitle');

  const dianaPhotos = [
    { src: 'assets/diana.jpg', vibe: 'Найкраща дівчина у світі ❤️' },
    { src: 'assets/photo_2026-09-29_21-27-10.jpg', vibe: 'Твоя найщиріша усмішка ✨' },
    { src: 'assets/photo_2026-09-29_21-27-18.jpg', vibe: 'Мій затишок і найтепліший погляд ☕' },
    { src: 'assets/photo_2026-09-29_21-27-22.jpg', vibe: 'Неймовірно красива Діанка 🌸' },
    { src: 'assets/photo_2026-09-29_21-27-26.jpg', vibe: 'Кожен погляд — у саме серце 💫' },
    { src: 'assets/photo_2026-09-29_21-27-30.jpg', vibe: 'Обожнюю тебе безмежно 💖' },
    { src: 'assets/photo_2026-09-29_21-27-33.jpg', vibe: 'Справжня і неповторна 🌿' },
    { src: 'assets/photo_2026-09-29_21-27-36.jpg', vibe: 'Наша історія тільки починається ♾️' }
  ];

  dianaPhotos.forEach((item) => {
    const img = new Image();
    img.src = item.src;
  });

  let currentPhotoIndex = 0;
  const editSpeedMs = 750; 

  function applyEditCut(idx) {
    if (!dianaPhoto) return;
    currentPhotoIndex = (idx + dianaPhotos.length) % dianaPhotos.length;
    const current = dianaPhotos[currentPhotoIndex];

    dianaPhoto.src = current.src;

    if (photoEditFlash) {
      photoEditFlash.classList.add('flash-active');
      setTimeout(() => photoEditFlash.classList.remove('flash-active'), 100);
    }

    dianaPhoto.classList.remove('beat-punch');
    void dianaPhoto.offsetWidth; 
    dianaPhoto.classList.add('beat-punch');
    setTimeout(() => dianaPhoto.classList.remove('beat-punch'), 200);

    if (photoSubtitle) photoSubtitle.textContent = current.vibe;
  }

  setInterval(() => {
    applyEditCut(currentPhotoIndex + 1);
  }, editSpeedMs);

  if (photoInnerFrame) {
    photoInnerFrame.addEventListener('click', () => {
      applyEditCut(currentPhotoIndex + 1);
      const rect = photoInnerFrame.getBoundingClientRect();
      spawnFloatingHeart(rect.left + rect.width / 2, rect.top + rect.height / 2, '❤️');
    });
  }

  if (tiltCard) {
    tiltCard.addEventListener('mousemove', (e) => {
      const rect = tiltCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      tiltCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

      const glareX = ((x / rect.width) * 100).toFixed(1);
      const glareY = ((y / rect.height) * 100).toFixed(1);
      tiltCard.style.setProperty('--glare-x', `${glareX}%`);
      tiltCard.style.setProperty('--glare-y', `${glareY}%`);
    });

    tiltCard.addEventListener('mouseleave', () => {
      tiltCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      tiltCard.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    tiltCard.addEventListener('mouseenter', () => {
      tiltCard.style.transition = 'transform 0.1s ease-out';
    });
  }

  const randomizerBtn = document.getElementById('randomizerBtn');
  const randomizerScreen = document.getElementById('randomizerScreen');
  const randomizerEmoji = document.getElementById('randomizerEmoji');
  const randomizerText = document.getElementById('randomizerText');
  const babakSayText = document.getElementById('babakSayText');

  const flickerSteps = [
    { emoji: '🤔', text: 'Хм... сканую почуття...' },
    { emoji: '❤️', text: 'Люблю!' },
    { emoji: '🙈', text: 'Не люблю... чи все ж таки...' },
    { emoji: '🌸', text: 'Точно люблю!' },
    { emoji: '😜', text: 'Може, не люблю? Та ні...' },
    { emoji: '💖', text: 'Дуже сильно люблю!' },
    { emoji: '🧐', text: 'Рівень кохання: 9999%...' },
    { emoji: '✨', text: 'Люблю безмежно!' }
  ];

  const finalLoveAnswers = [
    { emoji: '❤️', text: 'БЕЗМЕЖНО ЛЮБЛЮ! ❤️ (і завжди любитиму!)' },
    { emoji: '🥰', text: 'ШАЛЕНО ЛЮБЛЮ! ✨ Ти моє найбільше щастя!' },
    { emoji: '💍', text: '1000% ЛЮБЛЮ! 💖 Інших варіантів у природі немає!' },
    { emoji: '👑', text: 'ЛЮБЛЮ понад усе на світі! 🌸 Мій найкращий вибір!' }
  ];

  let isRandomizerSpinning = false;
  let randomizerRollCount = 0;
  let hasHadFirstFakeout = false;
  let currentFakeoutChance = 0.70;

  if (randomizerBtn) {
    randomizerBtn.addEventListener('click', () => {
      if (isRandomizerSpinning) return;
      isRandomizerSpinning = true;

      let willTriggerFakeout = false;
      if (randomizerRollCount === 0) {
        willTriggerFakeout = false;
      } else if (!hasHadFirstFakeout) {
        willTriggerFakeout = Math.random() < 0.70;
      } else {
        willTriggerFakeout = Math.random() < currentFakeoutChance;
      }
      randomizerRollCount++;

      if (randomizerScreen) randomizerScreen.classList.add('spinning');
      if (babakSayText) babakSayText.textContent = 'каже';
      randomizerBtn.disabled = true;

      let spinCount = 0;
      const totalSpins = 18;
      let delay = 50;

      function spinStep() {
        const pick = flickerSteps[spinCount % flickerSteps.length];
        if (randomizerEmoji) randomizerEmoji.textContent = pick.emoji;
        if (randomizerText) randomizerText.textContent = pick.text;
        romanticAudio.playChime(520 + (spinCount % 5) * 80);

        spinCount++;
        if (spinCount < totalSpins) {
          delay += 10;
          setTimeout(spinStep, delay);
        } else {
          isRandomizerSpinning = false;
          if (randomizerScreen) randomizerScreen.classList.remove('spinning');

          if (willTriggerFakeout) {
            
            hasHadFirstFakeout = true;
            currentFakeoutChance = 0.10; 
            document.documentElement.classList.add('sad-grayscale');
            document.body.classList.add('sad-grayscale'); 

            if (randomizerEmoji) randomizerEmoji.textContent = '🙃';
            if (randomizerText) randomizerText.textContent = 'Не люблю... 🙃';
            if (babakSayText) babakSayText.textContent = 'НЕ каже';
            romanticAudio.playChime(220); 

            setTimeout(() => {
              
              romanticAudio.playShahedEngine(1.0);

              const drone = document.createElement('div');
              drone.className = 'shahed-drone-projectile';
              drone.innerHTML = `
                <svg viewBox="0 0 120 120" class="shahed-svg">
                  <defs>
                    <linearGradient id="shahedBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#3d3d3d"/>
                      <stop offset="35%" stop-color="#1c1c1c"/>
                      <stop offset="100%" stop-color="#0a0a0a"/>
                    </linearGradient>
                  </defs>
                  <polygon points="60,98 53,118 60,112 67,118" fill="#ff4400" />
                  <polygon points="60,98 56,112 60,107 64,112" fill="#ffcc00" />
                  <polygon points="60,12 115,94 88,90 60,96 32,90 5,94" fill="url(#shahedBodyGrad)" stroke="#4a4a4a" stroke-width="1.8" />
                  <polygon points="5,76 5,96 14,92 14,80" fill="#0d0d0d" stroke="#333" stroke-width="1" />
                  <polygon points="115,76 115,96 106,92 106,80" fill="#0d0d0d" stroke="#333" stroke-width="1" />
                  <polygon points="60,14 65,74 60,94 55,74" fill="#222" />
                  <circle cx="60" cy="95" r="4.5" fill="#111" stroke="#ff3300" stroke-width="1" />
                </svg>
              `;
              randomizerScreen.appendChild(drone);

              setTimeout(() => {
                drone.remove();

                document.documentElement.classList.remove('sad-grayscale');
                document.body.classList.remove('sad-grayscale');

                romanticAudio.playCrispExplosion();

                const blastFlash = document.createElement('div');
                blastFlash.className = 'blast-flash-overlay';
                randomizerScreen.appendChild(blastFlash);
                setTimeout(() => blastFlash.remove(), 500);

                const shockwave = document.createElement('div');
                shockwave.className = 'blast-shockwave';
                randomizerScreen.appendChild(shockwave);
                setTimeout(() => shockwave.remove(), 600);

                randomizerScreen.classList.add('screen-shattered');
                setTimeout(() => randomizerScreen.classList.remove('screen-shattered'), 500);

                if (randomizerEmoji) randomizerEmoji.textContent = '💥';
                if (randomizerText) {
                  randomizerText.classList.add('text-knockout');
                }

                setTimeout(() => {
                  if (randomizerEmoji) randomizerEmoji.textContent = '❤️';
                  if (randomizerText) {
                    randomizerText.classList.remove('text-knockout');
                    randomizerText.classList.add('text-love-reveal');
                    randomizerText.textContent = 'БЕЗМЕЖНО ЛЮБЛЮ! ❤️';
                    if (babakSayText) babakSayText.textContent = 'каже';
                    setTimeout(() => randomizerText.classList.remove('text-love-reveal'), 600);
                  }

                  romanticAudio.playChime(880);
                  setTimeout(() => romanticAudio.playChime(1046.5), 150);
                  setTimeout(() => romanticAudio.playChime(1318.51), 320);

                  const rect = randomizerBtn.getBoundingClientRect();
                  const burstEmojis = ['❤️', '✨', '🥰', '💥', '💍', '🌸'];
                  for (let i = 0; i < 26; i++) {
                    setTimeout(() => {
                      spawnFloatingHeart(
                        rect.left + rect.width / 2 + (Math.random() - 0.5) * 160,
                        rect.top + (Math.random() - 0.5) * 60,
                        burstEmojis[Math.floor(Math.random() * burstEmojis.length)]
                      );
                    }, i * 35);
                  }

                  randomizerBtn.disabled = false;
                }, 280);
              }, 1000);
            }, 1500);
          } else {
            
            if (hasHadFirstFakeout) {
              
              currentFakeoutChance = Math.min(0.70, currentFakeoutChance + 0.10);
            }
            randomizerBtn.disabled = false;

            romanticAudio.playChime(880);
            setTimeout(() => romanticAudio.playChime(1046.5), 150);
            setTimeout(() => romanticAudio.playChime(1318.51), 320);

            const finalResult = finalLoveAnswers[Math.floor(Math.random() * finalLoveAnswers.length)];
            if (randomizerEmoji) randomizerEmoji.textContent = finalResult.emoji;
            if (randomizerText) randomizerText.textContent = finalResult.text;

            const rect = randomizerBtn.getBoundingClientRect();
            for (let i = 0; i < 18; i++) {
              setTimeout(() => {
                spawnFloatingHeart(
                  rect.left + rect.width / 2 + (Math.random() - 0.5) * 140,
                  rect.top + (Math.random() - 0.5) * 40,
                  i % 2 === 0 ? '❤️' : '✨'
                );
              }, i * 40);
            }
          }
        }
      }

      spinStep();
    });
  }

  const dinoCanvas = document.getElementById('dinoCanvas');
  const dCtx = dinoCanvas ? dinoCanvas.getContext('2d') : null;
  const gameScoreEl = document.getElementById('gameScore');
  const gameHighScoreEl = document.getElementById('gameHighScore');
  const gameMilestoneBadge = document.getElementById('gameMilestoneBadge');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlaySub = document.getElementById('overlaySub');
  const overlayEmoji = document.getElementById('overlayEmoji');
  const gameStartBtn = document.getElementById('gameStartBtn');
  const startBtnText = document.getElementById('startBtnText');
  const mobileJumpBtn = document.getElementById('mobileJumpBtn');
  const gameCanvasWrapper = document.getElementById('gameCanvasWrapper');

  let gameState = 'idle'; 
  let score = 0;
  let highScore = parseInt(localStorage.getItem('diana_dino_record') || '0', 10);
  if (gameHighScoreEl) gameHighScoreEl.textContent = highScore;

  const groundY = 380;
  let dino = {
    x: 75,
    y: groundY,
    size: 54,
    vy: 0,
    gravity: 0.62,
    jumpForce: -14.6,
    isGrounded: true,
    step: 0
  };

  let gameSpeed = 3.4;
  let spawnTimer = 0;
  let obstacles = [];
  let collectibles = [];
  let stars = [];
  let gameAnimFrame = null;

  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * 800,
      y: Math.random() * 260,
      size: Math.random() * 2.5 + 1,
      speed: Math.random() * 0.4 + 0.2
    });
  }

  function resetGame() {
    score = 0;
    gameSpeed = 3.4;
    spawnTimer = 0;
    obstacles = [];
    collectibles = [];
    dino.y = groundY;
    dino.vy = 0;
    dino.isGrounded = true;
    dino.step = 0;
    if (gameScoreEl) gameScoreEl.textContent = '0';
    if (gameMilestoneBadge) gameMilestoneBadge.innerHTML = '<span>Біжимо до Бабачка! 🦖❤️</span>';
  }

  function jumpDino() {
    if (gameState === 'idle' || gameState === 'gameover') {
      startGame();
      return;
    }
    if (dino.isGrounded) {
      dino.vy = dino.jumpForce;
      dino.isGrounded = false;
      romanticAudio.playChime(784); 
    }
  }

  function startGame() {
    resetGame();
    gameState = 'playing';
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    cancelAnimationFrame(gameAnimFrame);
    gameLoop();
  }

  function gameOver() {
    gameState = 'gameover';
    romanticAudio.playChime(330);

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('diana_dino_record', highScore);
      if (gameHighScoreEl) gameHighScoreEl.textContent = highScore;
      showToast(`🏆 Новий рекорд Діани: ${highScore} балів! Ти неймовірна!`);
    }

    if (overlayTitle) overlayTitle.textContent = 'Ой, спіткнулися! Але це було чудово ❤️';
    if (overlaySub) overlaySub.textContent = `Твій рахунок: ${score} балів! Дінозаврик хоче спробувати ще раз!`;
    if (overlayEmoji) overlayEmoji.textContent = '🥰';
    if (startBtnText) startBtnText.textContent = 'Грати знову 🔄';
    if (gameOverOverlay) gameOverOverlay.classList.remove('hidden');
  }

  function spawnGameObjects() {
    spawnTimer++;
    if (spawnTimer > Math.max(70, 135 - Math.floor(score / 60) * 6)) {
      spawnTimer = 0;

      if (Math.random() < 0.6) {
        
        const obstacleTypes = [
          { emoji: '🌵', size: 44, width: 34, height: 44, yOffset: 0 },
          { emoji: '🪨', size: 36, width: 34, height: 34, yOffset: 0 }
        ];
        const pick = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        obstacles.push({
          x: 820,
          y: groundY + pick.yOffset,
          emoji: pick.emoji,
          size: pick.size,
          width: pick.width,
          height: pick.height
        });
      } else {
        
        const bonusTypes = [
          { emoji: '❤️', points: 15, y: groundY - 65 },
          { emoji: '☕', points: 20, y: groundY - 80 },
          { emoji: '🥐', points: 25, y: groundY - 35 },
          { emoji: '🌸', points: 30, y: groundY - 110 }
        ];
        const pick = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
        collectibles.push({
          x: 820,
          y: pick.y,
          emoji: pick.emoji,
          points: pick.points,
          size: 38
        });
      }
    }
  }

  function checkCollisions() {
    const dinoHitbox = {
      x: dino.x + 10,
      y: dino.y - 44,
      w: dino.size - 18,
      h: dino.size - 10
    };

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const obsHitbox = {
        x: obs.x + 6,
        y: obs.y - obs.height + 6,
        w: obs.width - 10,
        h: obs.height - 10
      };

      if (
        dinoHitbox.x < obsHitbox.x + obsHitbox.w &&
        dinoHitbox.x + dinoHitbox.w > obsHitbox.x &&
        dinoHitbox.y < obsHitbox.y + obsHitbox.h &&
        dinoHitbox.y + dinoHitbox.h > obsHitbox.y
      ) {
        gameOver();
        return;
      }
    }

    for (let i = collectibles.length - 1; i >= 0; i--) {
      const col = collectibles[i];
      const colHitbox = {
        x: col.x - 14,
        y: col.y - 30,
        w: 32,
        h: 32
      };

      if (
        dinoHitbox.x < colHitbox.x + colHitbox.w &&
        dinoHitbox.x + dinoHitbox.w > colHitbox.x &&
        dinoHitbox.y < colHitbox.y + colHitbox.h &&
        dinoHitbox.y + dinoHitbox.h > colHitbox.y
      ) {
        score += col.points;
        if (gameScoreEl) gameScoreEl.textContent = score;
        romanticAudio.playChime(1046.5); 
        spawnFloatingHeart(dinoCanvas.getBoundingClientRect().left + dino.x, dinoCanvas.getBoundingClientRect().top + dino.y, col.emoji);
        collectibles.splice(i, 1);
      }
    }
  }

  function updateGame() {
    
    dino.vy += dino.gravity;
    dino.y += dino.vy;
    dino.step++;

    if (dino.y >= groundY) {
      dino.y = groundY;
      dino.vy = 0;
      dino.isGrounded = true;
    }

    if (dino.step % 6 === 0) {
      score += 1;
      if (gameScoreEl) gameScoreEl.textContent = score;

      if (score % 80 === 0 && gameSpeed < 9.5) {
        gameSpeed += 0.35;
      }

      if (score === 50 && gameMilestoneBadge) {
        gameMilestoneBadge.innerHTML = '<span>Розігрів для Діани! 🐾</span>';
      } else if (score === 100 && gameMilestoneBadge) {
        gameMilestoneBadge.innerHTML = '<span>Діно поспішає на побачення! 🏃‍♂️❤️</span>';
      } else if (score === 200 && gameMilestoneBadge) {
        gameMilestoneBadge.innerHTML = '<span>Влад пишається тобою! 🏆</span>';
      } else if (score === 350 && gameMilestoneBadge) {
        gameMilestoneBadge.innerHTML = '<span>Справжній чемпіон кохання! 👑</span>';
      }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= gameSpeed;
      if (obstacles[i].x < -50) {
        obstacles.splice(i, 1);
      }
    }

    for (let i = collectibles.length - 1; i >= 0; i--) {
      collectibles[i].x -= gameSpeed;
      if (collectibles[i].x < -50) {
        collectibles.splice(i, 1);
      }
    }

    for (let s of stars) {
      s.x -= s.speed;
      if (s.x < 0) s.x = 800;
    }

    spawnGameObjects();
    checkCollisions();
  }

  function renderGame() {
    if (!dCtx) return;

    dCtx.clearRect(0, 0, 800, 500);

    dCtx.fillStyle = 'rgba(243, 207, 122, 0.7)';
    for (let s of stars) {
      dCtx.beginPath();
      dCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      dCtx.fill();
    }

    dCtx.font = '32px sans-serif';
    dCtx.fillText('🌙', 710, 65);
    dCtx.font = '22px sans-serif';
    dCtx.fillText('✨', 670, 95);

    dCtx.strokeStyle = 'rgba(255, 107, 139, 0.75)';
    dCtx.lineWidth = 3;
    dCtx.beginPath();
    dCtx.moveTo(0, groundY + 8);
    dCtx.lineTo(800, groundY + 8);
    dCtx.stroke();

    dCtx.fillStyle = 'rgba(247, 168, 184, 0.35)';
    for (let x = (dino.step * -gameSpeed) % 40; x < 800; x += 40) {
      dCtx.fillRect(x, groundY + 12, 18, 3);
    }
    dCtx.fillStyle = 'rgba(255, 107, 139, 0.15)';
    for (let x = (dino.step * -gameSpeed * 0.7) % 60; x < 800; x += 60) {
      dCtx.fillRect(x + 10, groundY + 22, 10, 2);
    }

    for (let col of collectibles) {
      dCtx.font = `${col.size}px sans-serif`;
      dCtx.fillText(col.emoji, col.x, col.y);
    }

    for (let obs of obstacles) {
      dCtx.font = `${obs.size}px sans-serif`;
      dCtx.fillText(obs.emoji, obs.x, obs.y);
    }

    dCtx.save();
    dCtx.translate(dino.x + 50, dino.y);
    dCtx.scale(-1, 1); 

    if (!dino.isGrounded) {
      
      dCtx.rotate(0.12);
    } else {
      
      const legOffset = Math.sin(dino.step * 0.25) * 2;
      dCtx.translate(0, legOffset);
    }

    dCtx.font = '54px sans-serif';
    dCtx.fillText('🦖', 0, 0);

    if (dino.step % 30 < 15) {
      dCtx.font = '16px sans-serif';
      dCtx.fillText('❤️', 6, -42);
    }

    dCtx.restore();
  }

  function gameLoop() {
    if (gameState === 'playing') {
      updateGame();
      renderGame();
      gameAnimFrame = requestAnimationFrame(gameLoop);
    }
  }

  if (dCtx) {
    renderGame();
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      
      if (document.activeElement && document.activeElement.tagName !== 'INPUT') {
        const gameRect = dinoCanvas ? dinoCanvas.getBoundingClientRect() : null;
        if (gameRect && gameRect.top < window.innerHeight && gameRect.bottom > 0) {
          e.preventDefault();
        }
      }
      jumpDino();
    }
  });

  if (gameCanvasWrapper) {
    gameCanvasWrapper.addEventListener('click', () => {
      jumpDino();
    });
    gameCanvasWrapper.addEventListener('touchstart', (e) => {
      e.preventDefault();
      jumpDino();
    }, { passive: false });
  }

  if (gameStartBtn) {
    gameStartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startGame();
    });
  }

  if (mobileJumpBtn) {
    mobileJumpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      jumpDino();
    });
    mobileJumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      jumpDino();
    });
  }

  const surpriseHeartBtn = document.getElementById('surpriseHeartBtn');
  const foreverYesBtn = document.getElementById('foreverYesBtn');
  const foreverNoBtn = document.getElementById('foreverNoBtn');
  const noFunnyToast = document.getElementById('noFunnyToast');
  const yesCelebrationBox = document.getElementById('yesCelebrationBox');

  function triggerGrandCelebration() {
    
    if (yesCelebrationBox) {
      yesCelebrationBox.classList.remove('hidden');
      yesCelebrationBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (foreverYesBtn) {
      foreverYesBtn.classList.add('btn-pulse');
    }

    if (foreverNoBtn) {
      foreverNoBtn.style.display = 'none';
    }

    if (noFunnyToast) {
      noFunnyToast.innerHTML = '🎉 Відповідь прийнято і навіки закріплено серцем! ❤️';
    }

    romanticAudio.playChime(880);
    setTimeout(() => romanticAudio.playChime(1174.66), 250);
    setTimeout(() => romanticAudio.playChime(1318.51), 500);

    if (!romanticAudio.isPlaying) {
      romanticAudio.start();
      updateAudioUI(true);
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const celebrationEmojis = ['💍', '❤️', '🤍', '✨', '🥰', '🌸', '🎉', '🥂'];

    for (let i = 0; i < 45; i++) {
      setTimeout(() => {
        const x = centerX + (Math.random() - 0.5) * window.innerWidth * 0.75;
        const y = centerY + (Math.random() - 0.5) * window.innerHeight * 0.65;
        spawnFloatingHeart(x, y, celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)]);
      }, i * 65);
    }

    showToast('💍 Я безмежно кохаю тебе, Діанко! З нашою річницею!');
  }

  if (foreverYesBtn) {
    foreverYesBtn.addEventListener('click', () => {
      triggerGrandCelebration();
    });
  }

  let noAttempts = 0;
  let lastXDir = 1;

  function isMobileScreen() {
    return window.innerWidth < 768;
  }

  function launchNoBtnToSpace(customToast) {
    if (!foreverNoBtn || foreverNoBtn.classList.contains('poofed')) return;
    foreverNoBtn.classList.add('poofed');
    romanticAudio.playChime(350);
    if (noFunnyToast) {
      noFunnyToast.innerHTML = customToast || '🚀 Кнопка «Ні» не витримала тиску і катапультувалася в космос!';
    }
    setTimeout(() => {
      foreverNoBtn.style.display = 'none';
    }, 750);
  }

  if (foreverNoBtn) {
    if (isMobileScreen()) {
      
      const finaleSection = document.getElementById('finale');
      let mobileTriggered = false;

      function triggerMobileVanish() {
        if (mobileTriggered) return;
        mobileTriggered = true;
        setTimeout(() => {
          launchNoBtnToSpace('🚨 ПОМИЛКА 404: Відповідь «Ні» полетіла в космос! 🚀💨 Тільки ТАК!');
        }, 1300);
      }

      if (finaleSection && 'IntersectionObserver' in window) {
        const finaleObs = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            triggerMobileVanish();
            finaleObs.disconnect();
          }
        }, { threshold: 0.25 });
        finaleObs.observe(finaleSection);
      } else {
        triggerMobileVanish();
      }

      const handlePhoneTap = (e) => {
        e.preventDefault();
        mobileTriggered = true;
        launchNoBtnToSpace('Куди це ти тягнешся?! Тільки ТАК! 😜🚀💨');
      };
      foreverNoBtn.addEventListener('touchstart', handlePhoneTap, { passive: false });
      foreverNoBtn.addEventListener('click', handlePhoneTap);
    } else {
      
      foreverNoBtn.addEventListener('mouseenter', () => {
        noAttempts++;

        if (noAttempts < 3) {
          
          lastXDir = -lastXDir;
          const xOffset = lastXDir * (Math.floor(Math.random() * 50) + 90);
          const yOffset = (Math.random() - 0.5) * 85;

          foreverNoBtn.classList.add('runaway');
          foreverNoBtn.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
          romanticAudio.playChime(660);

          if (noAttempts === 1 && noFunnyToast) {
            noFunnyToast.textContent = 'Ей, куди це ти наводишся? 🏃‍♂️💨';
          } else if (noAttempts === 2 && noFunnyToast) {
            noFunnyToast.textContent = 'Ага, не зловиш! Тільки спробуй ще раз! 😜';
          }
        } else {
          
          launchNoBtnToSpace('🚀 Кнопка «Ні» не витримала тиску і катапультувалася в космос!');
        }
      });

      foreverNoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        launchNoBtnToSpace('Ні-ні-ні, тільки ТАК! 😜🚀❤️');
      });
    }
  }

  if (surpriseHeartBtn) {
    surpriseHeartBtn.addEventListener('click', () => {
      romanticAudio.playChime(880);
      const rect = surpriseHeartBtn.getBoundingClientRect();
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          spawnFloatingHeart(
            rect.left + rect.width / 2 + (Math.random() - 0.5) * 80,
            rect.top + (Math.random() - 0.5) * 40,
            '🤗'
          );
        }, i * 60);
      }
      showToast('Міцні обійми для моєї Діанки! 🤗❤️');
    });
  }

  const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((el) => observer.observe(el));

  const toastContainer = document.getElementById('toastContainer');
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

})();
