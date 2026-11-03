// ===== أذكاري - ملف JavaScript الرئيسي =====

// مفاتيح localStorage
const STORAGE_COUNTS = "azkari:counts";
const STORAGE_DARK = "azkari:darkMode";
const STORAGE_FONT = "azkari:fontSize";
const STORAGE_SOUND = "azkari:soundEnabled";

// الحالة الحالية
let currentView = "home";
let darkMode = false;
let fontSize = 20;
let soundEnabled = true;
let counts = {}; // بصيغة "morning:1" -> عدد متبقٍ

// ===== أدوات الصوت =====
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    try {
      const AudioCtx =
        window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
    } catch (e) {
      audioContext = null;
    }
  }
  return audioContext;
}

// صوت خفيف عند الضغط على العداد
function playClickSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    // تجاهل
  }
}

// صوت الإكمال
function playCompleteSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch (e) {
    // تجاهل
  }
}

// ===== أدوات localStorage =====
function buildDefaultCounts() {
  const initial = {};
  ["morning", "evening"].forEach((cat) => {
    azkarCategories[cat].items.forEach((item) => {
      initial[cat + ":" + item.id] = item.count;
    });
  });
  return initial;
}

function loadCounts() {
  try {
    const saved = localStorage.getItem(STORAGE_COUNTS);
    if (!saved) return buildDefaultCounts();
    const parsed = JSON.parse(saved);
    const valid = {};
    ["morning", "evening"].forEach((cat) => {
      azkarCategories[cat].items.forEach((item) => {
        const key = cat + ":" + item.id;
        const v = parsed[key];
        valid[key] =
          typeof v === "number" && v >= 0 && v <= item.count ? v : item.count;
      });
    });
    return valid;
  } catch (e) {
    return buildDefaultCounts();
  }
}

function loadDarkMode() {
  try {
    const saved = localStorage.getItem(STORAGE_DARK);
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    return false;
  }
}

function loadFontSize() {
  try {
    const saved = localStorage.getItem(STORAGE_FONT);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n >= 14 && n <= 32) return n;
    }
  } catch (e) {}
  return 20;
}

function loadSoundEnabled() {
  try {
    const saved = localStorage.getItem(STORAGE_SOUND);
    if (saved !== null) return saved === "true";
  } catch (e) {}
  return true;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_COUNTS, JSON.stringify(counts));
    localStorage.setItem(STORAGE_DARK, String(darkMode));
    localStorage.setItem(STORAGE_FONT, String(fontSize));
    localStorage.setItem(STORAGE_SOUND, String(soundEnabled));
  } catch (e) {
    // تجاهل
  }
}

// ===== تطبيق الحالة على DOM =====
function applyDarkMode() {
  if (darkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function applyFontSize() {
  const azkarTexts = document.querySelectorAll(".azkar-text");
  azkarTexts.forEach((el) => {
    el.style.fontSize = fontSize + "px";
  });
  const fontSizeDisplay = document.getElementById("font-size-display");
  if (fontSizeDisplay) {
    fontSizeDisplay.textContent = fontSize;
  }

  const decreaseBtn = document.getElementById("btn-font-decrease");
  const increaseBtn = document.getElementById("btn-font-increase");
  if (decreaseBtn) decreaseBtn.disabled = fontSize <= 14;
  if (increaseBtn) increaseBtn.disabled = fontSize >= 32;
}

// ===== الحصول على الأعداد لقسم معين =====
function getCount(cat, itemId) {
  return counts[cat + ":" + itemId];
}

function setCount(cat, itemId, value) {
  counts[cat + ":" + itemId] = value;
  saveState();
}

function getCategoryProgress(cat) {
  const category = azkarCategories[cat];
  const total = category.items.length;
  const completed = category.items.filter(
    (item) => counts[cat + ":" + item.id] <= 0
  ).length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

// ===== الرموز (SVG icons) =====
const ICONS = {
  sun: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>',
  arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>',
  arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>',
  copy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>',
  plus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>',
  minus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path></svg>',
  rotateCcw: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>',
  home: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
  heart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>',
  bookOpen: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg>',
  users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg>',
};

// ===== عرض الهيدر =====
function renderHeader() {
  const header = document.getElementById("header");
  const isAzkar = currentView === "morning" || currentView === "evening";

  header.innerHTML = `
    <div class="header-inner">
      <button class="logo" id="logo-btn" aria-label="أذكاري - الصفحة الرئيسية">
        <div class="logo-icon">${ICONS.moon}</div>
        <div class="logo-text">
          <span class="logo-title">أذكاري</span>
          <span class="logo-subtitle">ألا بذكر الله تطمئن القلوب</span>
        </div>
      </button>
      <div class="controls">
        ${
          isAzkar
            ? `<div class="font-controls">
                <button class="icon-btn" id="btn-font-decrease" aria-label="تصغير الخط" title="تصغير الخط">${ICONS.minus}</button>
                <span class="font-size-display" id="font-size-display">${fontSize}</span>
                <button class="icon-btn" id="btn-font-increase" aria-label="تكبير الخط" title="تكبير الخط">${ICONS.plus}</button>
              </div>`
            : ""
        }
        <button class="icon-btn" id="btn-sound" aria-label="${soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}" title="${soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}">
          <span style="font-size: 16px;">${soundEnabled ? "🔊" : "🔇"}</span>
        </button>
        ${
          isAzkar
            ? `<button class="icon-btn" id="btn-reset" aria-label="إعادة الأذكار" title="إعادة الأذكار من البداية">${ICONS.rotateCcw}</button>`
            : ""
        }
        <button class="icon-btn" id="btn-dark" aria-label="${darkMode ? "الوضع الفاتح" : "الوضع الليلي"}" title="${darkMode ? "الوضع الفاتح" : "الوضع الليلي"}">
          ${darkMode ? ICONS.sun : ICONS.moon}
        </button>
        <button class="icon-btn ${currentView === "about" ? "active" : ""}" id="btn-about" aria-label="عن الموقع" title="عن الموقع">${ICONS.info}</button>
        ${
          currentView !== "home"
            ? `<button class="icon-btn ${currentView === "home" ? "active" : ""}" id="btn-home" aria-label="الصفحة الرئيسية" title="الصفحة الرئيسية">${ICONS.home}</button>`
            : ""
        }
      </div>
    </div>
  `;

  // ربط الأزرار
  document.getElementById("logo-btn").addEventListener("click", () => switchView("home"));
  document.getElementById("btn-dark").addEventListener("click", toggleDarkMode);
  document.getElementById("btn-about").addEventListener("click", () => switchView("about"));
  document.getElementById("btn-sound").addEventListener("click", toggleSound);
  if (isAzkar) {
    document.getElementById("btn-reset").addEventListener("click", resetCategory);
    document.getElementById("btn-font-increase").addEventListener("click", () => changeFontSize(2));
    document.getElementById("btn-font-decrease").addEventListener("click", () => changeFontSize(-2));
  }
  const homeBtn = document.getElementById("btn-home");
  if (homeBtn) homeBtn.addEventListener("click", () => switchView("home"));
}

// ===== الصفحة الرئيسية =====
function renderHome() {
  const main = document.getElementById("main");
  const morningProgress = getCategoryProgress("morning");
  const eveningProgress = getCategoryProgress("evening");

  main.innerHTML = `
    <div class="pattern home">
      <div class="home-hero">
        <div class="hero-icon">
          <div class="hero-icon-glow"></div>
          <div class="hero-icon-circle">${ICONS.moon}</div>
        </div>
        <h1 class="home-title">أذكاري</h1>
        <p class="home-verse font-amiri">أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ</p>
        <p class="home-subtitle">ابدأ يومك بذكر الله واجعل لسانك عامرًا بالذكر</p>
      </div>
      <div class="cards-grid">
        <button class="home-card morning" id="card-morning">
          <div class="home-card-bg"></div>
          <div class="card-icon">${ICONS.sun}</div>
          <h2 class="card-title">أذكار الصباح</h2>
          <p class="card-subtitle">ابدأ يومك بذكر الله</p>
          ${
            morningProgress > 0
              ? `<div class="card-progress">
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${morningProgress}%"></div>
                  </div>
                  <span class="progress-text">${morningProgress === 100 ? "تم الانتهاء ✓" : "التقدم: " + morningProgress + "%"}</span>
                </div>`
              : ""
          }
          <span class="card-btn">
            ابدأ أذكار الصباح
            ${ICONS.arrowLeft}
          </span>
        </button>
        <button class="home-card evening" id="card-evening">
          <div class="home-card-bg"></div>
          <div class="card-icon">${ICONS.moon}</div>
          <h2 class="card-title">أذكار المساء</h2>
          <p class="card-subtitle">اختم يومك بذكر الله</p>
          ${
            eveningProgress > 0
              ? `<div class="card-progress">
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${eveningProgress}%"></div>
                  </div>
                  <span class="progress-text">${eveningProgress === 100 ? "تم الانتهاء ✓" : "التقدم: " + eveningProgress + "%"}</span>
                </div>`
              : ""
          }
          <span class="card-btn">
            ابدأ أذكار المساء
            ${ICONS.arrowLeft}
          </span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("card-morning").addEventListener("click", () => switchView("morning"));
  document.getElementById("card-evening").addEventListener("click", () => switchView("evening"));
}

// ===== صفحة الأذكار =====
function renderAzkarView(cat) {
  const main = document.getElementById("main");
  const category = azkarCategories[cat];
  const total = category.items.length;
  const completed = category.items.filter((item) => counts[cat + ":" + item.id] <= 0).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allComplete = completed === total;
  const isMorning = cat === "morning";

  main.innerHTML = `
    <div class="pattern azkar-view">
      <div class="azkar-container">
        <button class="back-btn" id="back-btn">
          ${ICONS.arrowRight}
          العودة للصفحة الرئيسية
        </button>
        <div class="azkar-header">
          <div class="azkar-header-icon ${isMorning ? "" : "evening-icon"}">${isMorning ? ICONS.sun : ICONS.moon}</div>
          <div>
            <h1 class="azkar-title">${category.title}</h1>
            <p class="azkar-subtitle">${category.subtitle}</p>
          </div>
        </div>
        <div class="progress-summary">
          <div class="progress-summary-header">
            <span class="progress-label">نسبة الإنجاز</span>
            <span class="progress-value ${isMorning ? "morning" : "evening"}">${completed} / ${total} ذكر (${progress}%)</span>
          </div>
          <div class="progress-bar-large">
            <div class="progress-bar-fill ${isMorning ? "morning" : "evening"}" style="width: ${progress}%"></div>
          </div>
        </div>
        ${
          allComplete
            ? `<div class="all-complete">
                <div class="all-complete-icon">${ICONS.checkCircle}</div>
                <div>
                  <p class="all-complete-text font-amiri">تقبّل الله منك ❤️</p>
                  <p class="all-complete-sub">تم إكمال جميع أذكار ${category.title} - تقبل الله طاعتك</p>
                </div>
              </div>`
            : ""
        }
        <div class="azkar-list">
          ${category.items.map((item, index) => renderAzkarCard(cat, item, index)).join("")}
        </div>
      </div>
    </div>
  `;

  document.getElementById("back-btn").addEventListener("click", () => switchView("home"));

  // ربط أزرار التسبيح والنسخ
  category.items.forEach((item) => {
    const tasbeehBtn = document.getElementById("tasbeeh-" + cat + "-" + item.id);
    if (tasbeehBtn) {
      tasbeehBtn.addEventListener("click", () => handleDecrement(cat, item.id));
    }
    const copyBtn = document.getElementById("copy-" + cat + "-" + item.id);
    if (copyBtn) {
      copyBtn.addEventListener("click", () => handleCopy(item.text, copyBtn));
    }
  });

  applyFontSize();
}

// عرض بطاقة ذكر واحدة
function renderAzkarCard(cat, item, index) {
  const remaining = counts[cat + ":" + item.id];
  const isComplete = remaining <= 0;
  const total = item.count;
  const completedCount = total - remaining;
  const progressPercent = total > 0 ? (completedCount / total) * 100 : 0;

  return `
    <article class="azkar-card ${isComplete ? "completed" : ""}" id="card-${cat}-${item.id}">
      <div class="card-side-bar"></div>
      <div class="card-top">
        <div class="card-number-badge">
          <span class="number-circle">${index + 1}</span>
          <span class="number-label">الذكر ${index + 1}</span>
        </div>
        <button class="copy-btn" id="copy-${cat}-${item.id}" aria-label="نسخ الذكر" title="نسخ الذكر">
          ${ICONS.copy}
          <span>نسخ</span>
        </button>
      </div>
      <p class="azkar-text font-amiri" dir="rtl">${item.text}</p>
      ${
        item.virtue
          ? `<p class="azkar-virtue">🌟 ${item.virtue}</p>`
          : ""
      }
      ${
        !isComplete
          ? `<div class="counter-row">
              <span class="counter-label">العدد المتبقي</span>
              <span class="counter-value" id="counter-${cat}-${item.id}">${remaining}</span>
            </div>
            <div class="card-progress-bar">
              <div class="progress-bar-fill" id="progress-${cat}-${item.id}" style="width: ${progressPercent}%"></div>
            </div>
            <button class="tasbeeh-btn" id="tasbeeh-${cat}-${item.id}">
              <span class="tasbeeh-text">سبحان الله</span>
              <span class="tasbeeh-hint">اضغط للتسبيح</span>
            </button>
            <p class="tasbeeh-help">اضغطي على الزر بعد قراءة الذكر مرة واحدة</p>`
          : `<div class="complete-message">
              <div class="complete-icon-circle">${ICONS.check}</div>
              <p class="complete-title">تم الانتهاء من الذكر</p>
              <p class="complete-sub">تم قراءة الذكر ${total} ${total === 1 ? "مرة" : "مرات"}</p>
            </div>`
      }
    </article>
  `;
}

// ===== صفحة About =====
function renderAbout() {
  const main = document.getElementById("main");
  main.innerHTML = `
    <div class="pattern about-view">
      <div class="about-container">
        <div class="about-hero">
          <div class="about-icon">${ICONS.moon}</div>
          <h1 class="about-title">عن أذكاري</h1>
          <p class="about-subtitle">موقع لعرض أذكار الصباح والمساء بطريقة سهلة وتفاعلية</p>
        </div>
        <div class="about-section">
          <h2 class="about-section-title">${ICONS.bookOpen} فكرة الموقع</h2>
          <p class="about-verse font-amiri">أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ</p>
          <p class="about-text">
            موقع «أذكاري» موقع إلكتروني يهدف إلى مساعدة المسلم على قراءة أذكار الصباح والمساء بطريقة سهلة ومنظمة. يعرض الموقع الأذكار مع نصها الكامل وعدد مرات التكرار المطلوبة لكل ذكر، ويوفّر عدادًا تفاعليًا يقلّ العدد عند كل ضغطة، حتى يكتمل الذكر ويظهر للمستخدم علامة الإكمال. الهدف هو تيسير الالتزام بالأذكار اليومية وإعانة الذاكر على متابعة تقدّمه.
          </p>
        </div>
        <div class="about-section">
          <h2 class="about-section-title">${ICONS.heart} مميزات الموقع</h2>
          <div class="about-features">
            <div class="about-feature"><span class="about-feature-check">✓</span><span>عداد تفاعلي لكل ذكر مع تقليل العدد عند الضغط</span></div>
            <div class="about-feature"><span class="about-feature-check">✓</span><span>شريط تقدم يوضّح نسبة الإنجاز الكلية</span></div>
            <div class="about-feature"><span class="about-feature-check">✓</span><span>إمكانية تكبير وتصغير حجم الخط</span></div>
            <div class="about-feature"><span class="about-feature-check">✓</span><span>وضع ليلي مريح للعين</span></div>
            <div class="about-feature"><span class="about-feature-check">✓</span><span>صوت خفيف عند الضغط على العداد</span></div>
            <div class="about-feature"><span class="about-feature-check">✓</span><span>إمكانية نسخ نص الذكر للمشاركة</span></div>
            <div class="about-feature"><span class="about-feature-check">✓</span><span>حفظ التقدم تلقائيًا في المتصفح</span></div>
            <div class="about-feature"><span class="about-feature-check">✓</span><span>تصميم متجاوب يعمل على الموبايل والكمبيوتر</span></div>
          </div>
        </div>
        <div class="about-section">
          <h2 class="about-section-title">${ICONS.bookOpen} مصدر الأذكار</h2>
          <p class="about-text">
            جميع أذكار الصباح والمساء المذكورة في هذا الموقع مأخوذة من كتاب «حصن المسلم» للشيخ سعيد بن علي بن وهف القحطاني رحمه الله، وهي من الأذكار الصحيحة الثابتة عن النبي ﷺ. تم مراجعة النصوص والأعداد من مصادر موثوقة دون حذف أو اختصار.
          </p>
        </div>
        <div class="about-section about-sadaqa">
          <div class="about-sadaqa-icon">${ICONS.users}</div>
          <p class="about-sadaqa-title font-amiri">صدقة جارية بإذن الله</p>
          <p class="about-text">
            نسأل الله أن يجعل هذا العمل خالصًا لوجهه الكريم، وأن ينفع به كل من استعان به على ذكر الله. اللهم تقبل منا، واجعله صدقة جارية لنا ولكل من ساهم فيه.
          </p>
        </div>
        <button class="about-back-btn" id="about-back">العودة للصفحة الرئيسية</button>
      </div>
    </div>
  `;
  document.getElementById("about-back").addEventListener("click", () => switchView("home"));
}

// ===== معالجات الأحداث =====
function switchView(view) {
  currentView = view;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderHeader();
  if (view === "home") renderHome();
  else if (view === "morning" || view === "evening") renderAzkarView(view);
  else if (view === "about") renderAbout();
}

function toggleDarkMode() {
  darkMode = !darkMode;
  applyDarkMode();
  saveState();
  renderHeader();
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  saveState();
  renderHeader();
}

function changeFontSize(delta) {
  const newSize = Math.max(14, Math.min(32, fontSize + delta));
  if (newSize !== fontSize) {
    fontSize = newSize;
    applyFontSize();
    saveState();
  }
}

function handleDecrement(cat, itemId) {
  const key = cat + ":" + itemId;
  const current = counts[key];
  if (current <= 0) return;

  const willComplete = current - 1 === 0;
  playClickSound();
  if (willComplete) {
    setTimeout(() => playCompleteSound(), 120);
  }

  // تأثير نبض على العداد
  const counterEl = document.getElementById("counter-" + cat + "-" + itemId);
  if (counterEl) {
    counterEl.classList.add("pulse");
    setTimeout(() => counterEl.classList.remove("pulse"), 200);
  }

  counts[key] = current - 1;
  saveState();

  // إعادة عرض البطاقة + شريط التقدم العام
  renderAzkarView(cat);
}

function handleCopy(text, btn) {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showCopied(btn);
      })
      .catch(() => {
        fallbackCopy(text);
        showCopied(btn);
      });
  } else {
    fallbackCopy(text);
    showCopied(btn);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (e) {}
  document.body.removeChild(textarea);
}

function showCopied(btn) {
  const span = btn.querySelector("span");
  if (span) {
    const originalText = span.textContent;
    span.textContent = "تم النسخ";
    setTimeout(() => {
      if (span.parentNode) {
        span.textContent = originalText;
      }
    }, 1500);
  }
}

function resetCategory() {
  if (currentView !== "morning" && currentView !== "evening") return;
  const cat = currentView;
  const category = azkarCategories[cat];
  category.items.forEach((item) => {
    counts[cat + ":" + item.id] = item.count;
  });
  saveState();
  renderAzkarView(cat);
}

// ===== التهيئة =====
function init() {
  // تحميل الحالة المحفوظة
  darkMode = loadDarkMode();
  fontSize = loadFontSize();
  soundEnabled = loadSoundEnabled();
  counts = loadCounts();

  // تطبيق الوضع الليلي قبل العرض لتجنب الوميض
  applyDarkMode();

  // عرض الهيدر والصفحة الرئيسية
  renderHeader();
  renderHome();
}

// تشغيل عند تحميل DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
