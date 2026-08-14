(function () {
  function wordIndexForOffset(offsetFromToday) {
    const idx = -offsetFromToday % WORDS.length;
    return ((idx % WORDS.length) + WORDS.length) % WORDS.length;
  }

  // ---- 音声読み上げ ----
  let voices = [];
  function loadVoices() {
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  }
  loadVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function pickEnglishVoice() {
    if (!voices.length) return null;
    const preferredNames = ["Samantha", "Google US English", "Microsoft Zira", "Microsoft Aria"];
    for (const name of preferredNames) {
      const v = voices.find((v) => v.name.includes(name));
      if (v) return v;
    }
    const enUS = voices.find((v) => v.lang === "en-US");
    if (enUS) return enUS;
    return voices.find((v) => v.lang && v.lang.startsWith("en")) || null;
  }

  function speak(text, onDone) {
    if (!window.speechSynthesis) {
      document.getElementById("voiceHint").textContent =
        "このブラウザは音声読み上げに対応していません。";
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.85;
    utter.pitch = 1.1;
    const voice = pickEnglishVoice();
    if (voice) utter.voice = voice;
    if (onDone) {
      utter.onend = onDone;
      utter.onerror = onDone;
    }
    window.speechSynthesis.speak(utter);
  }

  // ---- 単語を表示（「つぎのことば」ボタンで切り替え） ----
  const phraseBtn = document.getElementById("phraseBtn");
  const nextBtn = document.getElementById("nextBtn");
  const dayBadgeEl = document.getElementById("dayBadge");
  const tagBadgeEl = document.getElementById("tagBadge");
  const emojiEl = document.getElementById("emoji");
  const phraseEl = document.getElementById("phrase");
  const translationEl = document.getElementById("translation");

  let currentOffset = 0; // 0 = 今日、マイナスほど先の単語
  let currentWord = WORDS[wordIndexForOffset(currentOffset)];

  function renderCurrentWord() {
    currentWord = WORDS[wordIndexForOffset(currentOffset)];
    dayBadgeEl.textContent = "Day " + (1 - currentOffset);
    tagBadgeEl.textContent = currentWord.tag;
    emojiEl.textContent = currentWord.emoji;
    phraseEl.textContent = currentWord.en;
    translationEl.textContent = currentWord.ja;
  }
  renderCurrentWord();

  function playCurrent() {
    phraseBtn.classList.add("speaking");
    speak(currentWord.en, () => phraseBtn.classList.remove("speaking"));
  }

  phraseBtn.addEventListener("click", playCurrent);
  nextBtn.addEventListener("click", () => {
    currentOffset -= 1;
    renderCurrentWord();
  });

  // ---- デイリー表示へジャンプ ----
  function jumpToWord(w) {
    currentOffset = -WORDS.indexOf(w);
    renderCurrentWord();
    setMode("daily");
  }

  // ---- 単語カード（履歴・リスト共通） ----
  function createWordItem(w, options) {
    const showTag = options && options.showTag;
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML =
      '<span class="h-emoji">' + w.emoji + "</span>" +
      '<span class="h-text"><span class="h-en">' + w.en + "</span><br>" +
      '<span class="h-ja">' + w.ja + "</span></span>" +
      (showTag ? '<span class="h-tag">' + w.tag + "</span>" : "") +
      '<button class="h-play" aria-label="発音を聞く">🔊</button>';
    li.querySelector(".h-play").addEventListener("click", (e) => {
      e.stopPropagation();
      speak(w.en);
    });
    li.addEventListener("click", () => jumpToWord(w));
    return li;
  }

  // ---- モード切り替え（デイリー / リスト） ----
  const tabDaily = document.getElementById("tabDaily");
  const tabList = document.getElementById("tabList");
  const dailyView = document.getElementById("dailyView");
  const listView = document.getElementById("listView");

  function setMode(mode) {
    const isDaily = mode === "daily";
    dailyView.classList.toggle("hidden", !isDaily);
    listView.classList.toggle("hidden", isDaily);
    tabDaily.classList.toggle("active", isDaily);
    tabList.classList.toggle("active", !isDaily);
    tabDaily.setAttribute("aria-selected", String(isDaily));
    tabList.setAttribute("aria-selected", String(!isDaily));
  }

  tabDaily.addEventListener("click", () => setMode("daily"));
  tabList.addEventListener("click", () => setMode("list"));

  // ---- リストモード（タグでフィルター） ----
  const tagFiltersEl = document.getElementById("tagFilters");
  const wordListEl = document.getElementById("wordList");
  const allTags = Array.from(new Set(WORDS.map((w) => w.tag)));
  let activeTag = "すべて";

  function renderWordList() {
    wordListEl.innerHTML = "";
    const words = activeTag === "すべて" ? WORDS : WORDS.filter((w) => w.tag === activeTag);
    words.forEach((w) => wordListEl.appendChild(createWordItem(w, { showTag: activeTag === "すべて" })));
  }

  function renderTagFilters() {
    const tags = ["すべて"].concat(allTags);
    tagFiltersEl.innerHTML = "";
    tags.forEach((tag) => {
      const btn = document.createElement("button");
      btn.className = "tag-filter" + (tag === activeTag ? " active" : "");
      btn.textContent = tag;
      btn.addEventListener("click", () => {
        activeTag = tag;
        renderTagFilters();
        renderWordList();
      });
      tagFiltersEl.appendChild(btn);
    });
  }

  renderTagFilters();
  renderWordList();
})();
