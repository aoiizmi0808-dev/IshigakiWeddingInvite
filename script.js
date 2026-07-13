/* ============================================================
   Ishigaki Wedding Invitation — script.js
   構成:
     1. 設定値
     2. 泡・ハイビスカス／貝／ヒトデのランダム生成、魚の動きのランダム化
     3. スクロールに応じたシーン切り替え（海の中→浅瀬→ビーチ）＋スクロールカニ
     4. カウントダウン（リアルタイム）
     5. Gallery スライダー
     6. サウンドトグル
     7. 同伴者フィールドの表示切替
     8. RSVP フォーム送信（GAS 連携）
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initBubbles();
  initScatterCreatures();
  initRandomSwimmers();
  initSceneScroll();
  initCountdown();
  initGallery();
  initSoundToggle();
  initCompanionFields();
  initRsvpForm();
});

/* ============================================================
   1. 設定値
   ============================================================ */
const CONFIG = {
  // ここに GAS を「ウェブアプリとして公開」した URL を貼る
  // 例: https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec
  GAS_ENDPOINT: 'https://script.google.com/macros/s/AKfycbwaX2iR7kkaU3bOBZxJUYxe8MS4j-41if8e9y35R5-JO7wg7SzcLYwxvZ0jSq-zieHDsA/exec',

  BUBBLE_COUNT: 40,
  SCATTER_COUNT: 16,
};

/* ============================================================
   2. 泡・花のランダム生成
   ============================================================ */
function initBubbles() {
  const container = document.getElementById('bubbles-container');
  if (!container) return;

  for (let i = 0; i < CONFIG.BUBBLE_COUNT; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const size = randomBetween(4, 18);
    const left = randomBetween(0, 100);
    const duration = randomBetween(6, 16);
    const delay = randomBetween(0, 16);

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${left}%`;
    bubble.style.animationDuration = `${duration}s`;
    bubble.style.animationDelay = `${delay}s`;

    container.appendChild(bubble);
  }
}

/* ============================================================
   2. ハイビスカス・貝・ヒトデ：ランダムな位置・タイミングで出現
   ============================================================ */
function initScatterCreatures() {
  const container = document.getElementById('scatter-container');
  if (!container) return;

  const scatterImages = [
    'assets/hibiscuses.PNG',
    'assets/redhibiscus.PNG',
    'assets/pinkhibiscus.PNG',
    'assets/hibiscuswithleaf.PNG',
    'assets/shell.PNG',
    'assets/starfish.PNG',
  ];

  for (let i = 0; i < CONFIG.SCATTER_COUNT; i++) {
    const img = document.createElement('img');
    img.src = scatterImages[Math.floor(Math.random() * scatterImages.length)];
    img.className = 'scatter-item';
    img.alt = '';

    const top = randomBetween(4, 92);
    const left = randomBetween(4, 92);
    const size = randomBetween(20, 40);
    const duration = randomBetween(16, 28);
    const delay = randomBetween(0, 24);

    img.style.top = `${top}%`;
    img.style.left = `${left}%`;
    img.style.width = `${size}px`;
    img.style.animationDuration = `${duration}s`;
    img.style.animationDelay = `${delay}s`;

    container.appendChild(img);
  }
}

/* ============================================================
   魚：出現位置・速度をランダム化して「ランダムに泳ぐ」動きにする
   ============================================================ */
function initRandomSwimmers() {
  const fishEls = document.querySelectorAll('.creature.angelfish, .creature.fish');

  fishEls.forEach((fish) => {
    // 速度（animation-duration）は最初に一度だけ決めて固定する。
    // 周回ごとに変更すると、ブラウザがアニメーションを再スタートし
    // 瞬間的に高速で横切って見える不具合が起きるため。
    const duration = randomBetween(30, 40);
    fish.style.animationDuration = `${duration}s`;

    if (fish.classList.contains('angelfish')) {
      // 逆方向（右から左）に泳ぐため、右端を起点にする
      fish.style.right = '-80px';
      fish.style.left = 'auto';
    } else {
      fish.style.left = '-80px';
    }

    randomizeSwimmerHeight(fish);
    fish.addEventListener('animationiteration', () => randomizeSwimmerHeight(fish));
  });
}

function randomizeSwimmerHeight(el) {
  // 周回ごとに泳ぐ高さ（top）だけをランダム化し、速度は変えない
  const top = randomBetween(15, 80);
  el.style.top = `${top}%`;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/* ============================================================
   3. スクロールに応じたシーン切り替え（海の中 → 浅瀬 → ビーチ）
      ＋ スクロールバー代わりに縦に歩くカニの位置更新
   ============================================================ */
function initSceneScroll() {
  const scenes = ['deep', 'mid', 'shallow', 'beach'];
  const crab = document.getElementById('scrollCrab');

  const setScene = () => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollRatio = maxScroll > 0 ? window.scrollY / maxScroll : 0;

    const index = Math.min(
      scenes.length - 1,
      Math.floor(scrollRatio * scenes.length)
    );
    document.body.dataset.scene = scenes[index];

    if (crab) {
      // 画面上部5%〜下部90%の範囲でカニを縦に歩かせる
      const top = 5 + Math.min(1, scrollRatio) * 85;
      crab.style.top = `${top}%`;
    }
  };

  setScene();
  window.addEventListener('scroll', throttle(setScene, 50));
  window.addEventListener('resize', throttle(setScene, 200));
}

function throttle(fn, wait) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}

/* ============================================================
   4. カウントダウン（リアルタイム）
   ============================================================ */
function initCountdown() {
  const el = document.getElementById('countdownTimer');
  if (!el) return;

  const target = new Date(el.dataset.target).getTime();

  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-minutes');
  const sEl = document.getElementById('cd-seconds');

  function tick() {
    const now = Date.now();
    const diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    dEl.textContent = String(days).padStart(2, '0');
    hEl.textContent = String(hours).padStart(2, '0');
    mEl.textContent = String(minutes).padStart(2, '0');
    sEl.textContent = String(seconds).padStart(2, '0');

    if (diff <= 0) clearInterval(timer);
  }

  tick();
  const timer = setInterval(tick, 1000);
}

/* ============================================================
   5. Gallery スライダー
   ============================================================ */
function initGallery() {
  const slider = document.getElementById('gallerySlider');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.slide'));
  const dotsContainer = document.getElementById('galleryDots');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');

  let current = 0;
  let autoplayTimer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });
  const dots = Array.from(dotsContainer.children);

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  prevBtn.addEventListener('click', () => { goTo(current - 1); resetAutoplay(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); resetAutoplay(); });

  function startAutoplay() {
    autoplayTimer = setInterval(() => goTo(current + 1), 5000);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }
  startAutoplay();
}

/* ============================================================
   6. サウンドトグル
   ============================================================ */
function initSoundToggle() {
  const btn = document.getElementById('soundToggle');
  const audio = document.getElementById('bgm');
  if (!btn || !audio) return;

  let playing = false;

  btn.addEventListener('click', () => {
    if (!playing) {
      audio.play().catch(() => {
        /* ブラウザの自動再生制限で失敗する場合あり */
      });
      btn.classList.add('is-playing');
    } else {
      audio.pause();
      btn.classList.remove('is-playing');
    }
    playing = !playing;
  });
}

/* ============================================================
   8. 同伴者人数に応じた氏名入力欄の表示切り替え（最大3名）
   ============================================================ */
function initCompanionFields() {
  const plusOneSelect = document.getElementById('plusOne');
  if (!plusOneSelect) return;

  const groups = [1, 2, 3].map((n) => ({
    row: document.getElementById(`companionRow${n}`),
    inputs: [
      document.getElementById(`companion${n}`),
      document.getElementById(`companion${n}Flight`),
      document.getElementById(`companion${n}Allergy`),
    ],
  }));

  function updateVisibility() {
    const count = parseInt(plusOneSelect.value, 10) || 0;
    groups.forEach(({ row, inputs }, i) => {
      const show = i < count;
      row.hidden = !show;
      if (!show) inputs.forEach((input) => { if (input) input.value = ''; });
    });
  }

  plusOneSelect.addEventListener('change', updateVisibility);
  updateVisibility();
}

/* ============================================================
   9. RSVP フォーム送信（GAS 連携）
   ============================================================ */
function initRsvpForm() {
  const form = document.getElementById('rsvpForm');
  const status = document.getElementById('rsvpStatus');
  const submitBtn = document.getElementById('rsvpSubmit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.submittedAt = new Date().toISOString();

    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';
    status.textContent = '';
    status.className = 'form-status';

    try {
      // GAS の doPost は no-cors だとレスポンスを読めないため、
      // text/plain で送り GAS 側で JSON.parse する方式を採用
      await fetch(CONFIG.GAS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      // no-cors では応答内容を検証できないため、送信成功とみなして表示
      status.textContent = 'ご回答ありがとうございました。送信が完了しました。';
      status.classList.add('success');
      form.reset();
    } catch (err) {
      console.error(err);
      status.textContent = '送信に失敗しました。時間をおいて再度お試しください。';
      status.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '送信する';
    }
  });
}
