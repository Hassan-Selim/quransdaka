!(function () {
  "use strict";
  if (
    (document.addEventListener(
      "touchstart",
      function e() {
        (navigator.vibrate && navigator.vibrate(0),
          document.removeEventListener("touchstart", e));
      },
      { once: !0, passive: !0 },
    ),
    !document.getElementById("tafsir-styles"))
  ) {
    const e = document.createElement("style");
    ((e.id = "tafsir-styles"),
      (e.innerHTML =
        "\n        .tafsir-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9998; opacity: 0; visibility: hidden; transition: 0.3s; }\n        .tafsir-overlay.active { opacity: 1; visibility: visible; }\n        .tafsir-sheet { position: fixed; bottom: -100%; left: 0;  max-height: 60vh;  border-radius: 20px 20px 0 0; z-index: 9999; transition: 0.4s ease-out; padding: 20px; box-shadow: 0 -10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; }\n        .tafsir-sheet.active { bottom: 0; }\n        .tafsir-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px; }\n        .tafsir-content { overflow-y: auto; font-family: 'Cairo', sans-serif; font-size: 16px; line-height: 1.8; color: #333; padding-bottom: 20px; direction: rtl; }\n        \n    "),
      document.head.appendChild(e));
  }
  let e;
  ((window.tafsirDatabase = null),
    (window.closeTafsirWindow = function () {
      (document.getElementById("tafsirSheet") &&
        document.getElementById("tafsirSheet").classList.remove("active"),
        document.getElementById("tafsirOverlay") &&
          document.getElementById("tafsirOverlay").classList.remove("active"));
    }),
    (window.showTafsirWindow = async function (e, t) {
      let n = document.getElementById("tafsirOverlay"),
        a = document.getElementById("tafsirSheet");
      (n ||
        ((n = document.createElement("div")),
        (n.id = "tafsirOverlay"),
        (n.className = "tafsir-overlay"),
        (n.onclick = window.closeTafsirWindow),
        (n.ontouchstart = (e) => {
          (e.preventDefault(), window.closeTafsirWindow());
        }),
        document.body.appendChild(n)),
        a ||
          ((a = document.createElement("div")),
          (a.id = "tafsirSheet"),
          (a.className = "tafsir-sheet"),
          (a.innerHTML =
            '\n            <div class="tafsir-header">\n                <h3 id="tafsirTitle" style="margin:0; font-size:18px; color: #0f172a;">التفسير</h3>\n                <button class="close-tafsir" onclick="window.closeTafsirWindow()">❌</button>\n            </div>\n            <div id="tafsirContent" class="tafsir-content"></div>\n        '),
          document.body.appendChild(a)));
      const s =
          void 0 !== x ? x.find((t) => String(t.number) === String(e)) : null,
        o = s ? s.name : "سورة " + e;
      ((document.getElementById("tafsirTitle").innerText = `${o} - آية ${t}`),
        (document.getElementById("tafsirContent").innerHTML =
          '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>'),
        n.classList.add("active"),
        a.classList.add("active"));
      try {
        if (!window.tafsirDatabase) {
          const e = await fetch("../json/tafsir.json");
          window.tafsirDatabase = await e.json();
        }
        const n = window.tafsirDatabase[e][t];
        document.getElementById("tafsirContent").innerHTML =
          `<strong style="color: #037168;">التفسير الميسر:</strong><br><br>${n}`;
      } catch (e) {
        document.getElementById("tafsirContent").innerHTML =
          '<p style="color:red; text-align:center;">حدث خطأ في تحميل التفسير. تأكد من وجود ملف tafsir.json</p>';
      }
    }),
    (window.addTafsirEvents = function (t, a, s) {
      (t.addEventListener(
        "touchstart",
        () => {
          e = setTimeout(() => {
            n ||
              (navigator.vibrate && navigator.vibrate(50),
              window.showTafsirWindow(a, s));
          }, 600);
        },
        { passive: !0 },
      ),
        t.addEventListener("touchmove", () => clearTimeout(e), { passive: !0 }),
        t.addEventListener("touchend", () => clearTimeout(e)),
        t.addEventListener("mousedown", () => {
          e = setTimeout(() => window.showTafsirWindow(a, s), 600);
        }),
        t.addEventListener("mouseup", () => clearTimeout(e)),
        t.addEventListener("mouseleave", () => clearTimeout(e)));
    }));
  let t,
    n = !1,
    a = 0;
  (document.addEventListener(
    "touchstart",
    (e) => {
      ((a = e.touches[0].clientY), (n = !1));
    },
    { passive: !0 },
  ),
    document.addEventListener(
      "touchmove",
      (e) => {
        Math.abs(e.touches[0].clientY - a) > 10 && (n = !0);
      },
      { passive: !0 },
    ));
  let s = !1,
    o = !1,
    r = 0;
  (document.addEventListener(
    "touchstart",
    function (e) {
      ((r = e.touches[0].clientY), (o = !1));
    },
    { passive: !0 },
  ),
    document.addEventListener(
      "touchmove",
      function (e) {
        Math.abs(e.touches[0].clientY - r) > 10 && (o = !0);
      },
      { passive: !0 },
    ),
    (window.startPagePress = function (e) {
      ((s = !1),
        (t = setTimeout(() => {
          o ||
            ((s = !0),
            navigator.vibrate && navigator.vibrate(50),
            window.showPageTooltip && window.showPageTooltip(e));
        }, 500)));
    }),
    (window.cancelPagePress = function () {
      clearTimeout(t);
    }),
    (window.endPagePress = function (e) {
      (clearTimeout(t), s || o || (window.location.hash = "/page/"));
    }));
  var i = "../json/surah-name.json",
    l = "quran-sadaka-reciter",
    c = "quran-sadaka-moshaf",
    d = document.getElementById("listView"),
    u = document.getElementById("surahView"),
    m = document.getElementById("listLoading"),
    p = document.getElementById("listError"),
    g = document.getElementById("surahList"),
    h = document.getElementById("backToList"),
    f = document.getElementById("surahTitle"),
    y = document.getElementById("versesLoading"),
    v = document.getElementById("versesContainer"),
    w =
      (document.getElementById("readAudioBar"),
      document.getElementById("readReciter")),
    E = document.getElementById("readMoshaf"),
    b = document.getElementById("readBack5"),
    L = document.getElementById("readPlayPause"),
    I = document.getElementById("readFwd5"),
    S = document.getElementById("readAudio"),
    T = document.getElementById("resumeBtn"),
    x = [],
    k = [],
    B = null,
    C = null,
    $ = 0,
    M = 0;
  function P(e) {
    const t = document.querySelectorAll(
        ".qpage, .quran-wrapper, .banner, .continueBtn, .read-intro, #main-footer",
      ),
      n = e ? "none" : "";
    t.forEach((e) => {
      e && (e.style.display = n);
    });
  }
  function q() {
    ((d.style.display = "block"), (u.style.display = "none"), P(!1));
  }
  function H() {
    ((E.innerHTML = '<option value="">-- نوع التلاوة --</option>'),
      B &&
        B.moshaf &&
        B.moshaf.length &&
        B.moshaf.forEach(function (e, t) {
          var n = document.createElement("option");
          ((n.value = t),
            (n.textContent = e.name || "قراءة " + (t + 1)),
            E.appendChild(n));
        }));
  }
  function j() {
    var e = w.value;
    ((B = k.find((t) => String(t.id) === e) || null),
      (C = null),
      H(),
      B && B.moshaf && B.moshaf.length && ((E.value = "0"), (C = B.moshaf[0])),
      e && localStorage.setItem(l, e));
  }
  function z() {
    if (B && B.moshaf) {
      var e = parseInt(E.value, 10);
      e >= 0 && e < B.moshaf.length
        ? ((C = B.moshaf[e]), localStorage.setItem(c, String(e)))
        : (C = null);
    }
  }
  function A() {
    S.src &&
      (S.paused
        ? ((L.textContent = "▶ تشغيل"), L.setAttribute("aria-label", "تشغيل"))
        : ((L.textContent = "⏸ إيقاف"), L.setAttribute("aria-label", "إيقاف")));
  }
  (h.addEventListener("click", function () {
    window.location.hash = "/";
  }),
    document.getElementById("readCurrentTime"),
    document.getElementById("readDuration"));
  const N = document.getElementById("readProgressBar"),
    _ = document.getElementById("readProgressFill"),
    O = document.getElementById("readProgressKnob");
  function D() {
    const e = window.location.hash;
    if (e.includes("/surah/")) {
      const t = parseInt(e.split("/").pop(), 10);
      t && t !== $ && V(t);
    } else if (e.includes("/page/")) {
      const t = parseInt(e.split("/").pop(), 10);
      t && t !== M && Q(t);
    } else
      (q(),
        (document.getElementById("pages-view").style.display = "none"),
        (document.getElementById("pages-list").style.display = "grid"),
        S && (S.pause(), A()),
        P(!1));
  }
  function V(e) {
    if ($ === e && "" !== v.innerHTML) return;
    if (
      ((d.style.display = "none"),
      (u.style.display = "block"),
      P(!0),
      ($ = e),
      S.pause(),
      S.removeAttribute("src"),
      S.load(),
      A(),
      (f.textContent = ""),
      (v.innerHTML = ""),
      (y.style.display = "block"),
      k.length > 0)
    ) {
      ((w.innerHTML = '<option value="">-- اختر القارئ --</option>'),
        [...k]
          .sort((e, t) => e.name.localeCompare(t.name, "ar"))
          .forEach(function (e) {
            var t = document.createElement("option");
            ((t.value = e.id), (t.textContent = e.name), w.appendChild(t));
          }),
        H());
      let e = localStorage.getItem(l),
        t = localStorage.getItem(c);
      if (
        e &&
        k.some((t) => String(t.id) === e) &&
        ((w.value = e), j(), null !== t && B && B.moshaf)
      ) {
        let e = parseInt(t, 10);
        e >= 0 && e < B.moshaf.length && ((E.value = String(e)), z());
      }
    }
    let t = x.find((t) => t.number === e);
    (t &&
      ((document.title = `${t.name} مكتوبة كاملة | Quran Sadaka`),
      localStorage.setItem("surah-lastSurah", e),
      localStorage.setItem("surah-lastAyah", 1)),
      fetch("../json/quran.json")
        .then((e) => e.json())
        .then((n) => {
          ((y.style.display = "none"), (v.innerHTML = ""));
          let a = n.find((t) => t.number === e);
          if (!a || !a.ayahs)
            return void (v.innerHTML =
              '<p class="read-error">تعذر تحميل الآيات.</p>');
          let s = document.createElement("div");
          s.className = "mushaf-block";
          let o = document.createElement("div");
          if (
            ((o.className = "surah-title"),
            (o.textContent = t ? t.name : ""),
            s.appendChild(o),
            9 !== e)
          ) {
            let e = document.createElement("span");
            ((e.className = "basmala"),
              (e.textContent = "﴿ بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ﴾"),
              s.appendChild(e));
          }
          (a.ayahs.forEach((t) => {
            let n = document.createElement("span");
            ((n.className = "verse-wrapper"), (n.dataset.ayah = t.number));
            let a = document.createElement("span");
            ((a.className = "verse-text"), (a.textContent = t.text.trim()));
            let o = document.createElement("span");
            ((o.className = "verse-marker"),
              (o.textContent = t.number),
              n.appendChild(a),
              n.appendChild(o),
              n.addEventListener("click", function () {
                (localStorage.setItem("surah-lastSurah", e),
                  localStorage.setItem("surah-lastAyah", t.number),
                  R(t.number));
              }),
              s.appendChild(n),
              window.addTafsirEvents && window.addTafsirEvents(n, e, t.number),
              s.appendChild(n));
          }),
            v.appendChild(s));
          const r = localStorage.getItem("surah-lastAyah");
          r &&
            parseInt(localStorage.getItem("surah-lastSurah"), 10) === e &&
            setTimeout(() => R(r), 150);
        })
        .catch((e) => {
          ((y.style.display = "none"), console.error("OpenSurah Error:", e));
        }));
  }
  function R(e) {
    document.querySelectorAll(".verse-wrapper").forEach((t) => {
      parseInt(t.dataset.ayah, 10) === parseInt(e, 10)
        ? (t.classList.add("ayah-highlight"),
          t.scrollIntoView({ behavior: "smooth", block: "center" }))
        : t.classList.remove("ayah-highlight");
    });
  }
  (S.addEventListener("timeupdate", () => {
    if (!S.duration) return;
    const e = (S.currentTime / S.duration) * 100;
    ((_.style.width = e + "%"),
      O && ((O.style.left = e + "%"), (O.style.right = "auto")));
  }),
    N.addEventListener("click", (e) => {
      const t = N.getBoundingClientRect(),
        n = (e.clientX - t.left) / t.width;
      isFinite(S.duration) && (S.currentTime = n * S.duration);
    }),
    w && w.addEventListener("change", j),
    E && E.addEventListener("change", z),
    L &&
      L.addEventListener("click", function () {
        S.src
          ? (S.paused ? S.play() : S.pause(), A())
          : (function () {
              if (C) {
                var e =
                  ((t = $),
                  C &&
                  C.server &&
                  (function (e) {
                    return (
                      !(!C || !C.surah_list) &&
                      C.surah_list.split(",").indexOf(String(e)) >= 0
                    );
                  })(t)
                    ? C.server.replace(/\/$/, "") +
                      "/" +
                      String(t).padStart(3, "0") +
                      ".mp3"
                    : null);
                e
                  ? ((S.src = e), S.play(), A())
                  : alert("هذه السورة غير متوفرة لهذا القارئ.");
              } else alert("يرجى اختيار القارئ ونوع التلاوة.");
              var t;
            })();
      }),
    b &&
      b.addEventListener("click", function () {
        S.src && (S.currentTime = Math.max(0, S.currentTime - 5));
      }),
    I &&
      I.addEventListener("click", function () {
        if (S.src) {
          var e = S.duration;
          isFinite(e)
            ? (S.currentTime = Math.min(e, S.currentTime + 5))
            : (S.currentTime += 5);
        }
      }),
    h &&
      h.addEventListener("click", function () {
        (q(), S.pause(), (S.currentTime = 0), A());
      }),
    N &&
      N.addEventListener("click", (e) => {
        const t = N.getBoundingClientRect(),
          n = (e.clientX - t.left) / t.width;
        S.currentTime = n * S.duration;
      }),
    window.addEventListener("hashchange", D),
    window.addEventListener("load", D),
    T &&
      T.addEventListener("click", function () {
        const e = localStorage.getItem("surah-lastSurah");
        e && V(parseInt(e, 10));
      }));
  var W = document.querySelector(".prev-btn"),
    F = document.querySelector(".next-btn");
  let J;
  (W && W.addEventListener("click", () => $ > 1 && V($ - 1)),
    F && F.addEventListener("click", () => $ < x.length && V($ + 1)));
  let X = !1;
  ((window.startPagePress = function (e) {
    ((X = !1),
      (J = setTimeout(function () {
        ((X = !0), showPageTooltip(e));
      }, 500)));
  }),
    (window.cancelPagePress = function () {
      clearTimeout(J);
    }),
    (window.endPagePress = function (e) {
      (clearTimeout(J), X || (window.location.hash = "/page/" + e));
    }));
  let Y = null;
  async function K() {
    if (!Y)
      try {
        const e = await fetch("../json/quran-pages.json");
        ((Y = await e.json()),
          console.log("تم تحميل ملف الصفحات للضغط المطول بنجاح ✅"));
      } catch (e) {
        console.error("خطأ في تحميل بيانات الصفحات:", e);
      }
  }
  function Q(e) {
    ((M = e),
      (document.getElementById("pages-list").style.display = "none"),
      (document.getElementById("pages-view").style.display = "block"),
      P(!0));
    const t = document.getElementById("page-verses"),
      n = document.getElementById("page-title");
    (t.classList.add("is-loading"),
      (t.innerHTML = '<p class="read-loading">جاري تجهيز الصفحة...</p>'),
      Promise.all([
        fetch("../json/quran-pages.json").then((e) => e.json()),
        fetch("../json/quran.json").then((e) => e.json()),
      ])
        .then(([a, s]) => {
          let o = a[String(e)];
          if (!o || 0 === o.length)
            return (
              (t.innerHTML =
                '<p class="read-error">بيانات هذه الصفحة غير متوفرة.</p>'),
              void t.classList.remove("is-loading")
            );
          let r = document.createElement("div");
          r.className = "mushaf-block";
          let i = o[0].split(":")[0],
            l = x.find((e) => String(e.number) === String(i)),
            c = document.createElement("div");
          ((c.className = "surah-title"),
            (c.textContent = l ? l.name : `سورة ${i}`),
            r.appendChild(c));
          let d = String(i);
          (n && (n.textContent = ` ﴿ ${e} ﴾ `),
            o.forEach((t, n) => {
              let a = t.split(":"),
                o = a[0],
                i = a[1],
                l = s.find((e) => String(e.number) === String(o)),
                c = l
                  ? l.ayahs.find((e) => String(e.number) === String(i))
                  : null,
                u = c ? c.text : "";
              if (n > 0 && String(o) !== d) {
                d = String(o);
                let e = x.find((e) => String(e.number) === String(o)),
                  t = document.createElement("div");
                if (
                  ((t.className = "surah-title"),
                  (t.textContent = e ? e.name : `سورة ${o}`),
                  r.appendChild(t),
                  "9" !== String(o))
                ) {
                  let e = document.createElement("div");
                  ((e.className = "basmala"),
                    (e.textContent =
                      "﴿ بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ﴾"),
                    r.appendChild(e));
                }
              }
              if (u && "" !== u.trim()) {
                let t = document.createElement("span");
                ((t.className = "verse-wrapper"),
                  (t.dataset.surah = o),
                  (t.dataset.ayah = i),
                  t.addEventListener("click", function () {
                    (localStorage.setItem("page-surah-lastSurah", o),
                      localStorage.setItem("page-surah-lastAyah", i),
                      localStorage.setItem("page-quran-last-page", e),
                      document
                        .querySelectorAll(".verse-wrapper")
                        .forEach((e) => e.classList.remove("ayah-highlight")),
                      this.classList.add("ayah-highlight"));
                  }));
                let n = document.createElement("span");
                ((n.className = "verse-text"), (n.textContent = u + " "));
                let a = document.createElement("span");
                ((a.className = "verse-marker"),
                  (a.textContent = i),
                  t.appendChild(n),
                  t.appendChild(a),
                  window.addTafsirEvents && window.addTafsirEvents(t, o, i),
                  r.appendChild(t));
              }
            }),
            (t.innerHTML = ""),
            t.appendChild(r),
            window.scrollTo(0, 0),
            setTimeout(() => {
              t.classList.remove("is-loading");
            }, 50),
            localStorage.setItem("quran-last-page", e));
          const u = localStorage.getItem("page-surah-lastSurah"),
            m = localStorage.getItem("page-surah-lastAyah");
          u &&
            m &&
            setTimeout(() => {
              let e = t.querySelector(
                `.verse-wrapper[data-surah="${u}"][data-ayah="${m}"]`,
              );
              e &&
                (e.classList.add("ayah-highlight"),
                e.scrollIntoView({ behavior: "smooth", block: "center" }));
            }, 150);
        })
        .catch((e) => {
          ((t.innerHTML = '<p class="read-error">حدث خطأ في عرض الصفحة.</p>'),
            t.classList.remove("is-loading"),
            console.error("Pages View Error:", e));
        }));
  }
  (document.addEventListener("DOMContentLoaded", () => {
    K();
  }),
    (window.showPageTooltip = async function (e) {
      const t = document.querySelectorAll(".page-tooltip");
      t && Array.from(t).forEach((e) => (e.style.display = "none"));
      const n = document.getElementById(`page-info-${e}`);
      if (n) {
        if (n.innerHTML.includes("جاري تحميل"))
          if ((Y || (await K()), Y && Y[String(e)])) {
            const t = Y[String(e)];
            if (t && t.length > 0) {
              const e = t[0].split(":"),
                a = e[0],
                s = e[1],
                o = t[t.length - 1].split(":"),
                r = o[0],
                i = o[1],
                l =
                  (void 0 !== x &&
                    x.find((e) => String(e.number) === String(a))?.name) ||
                  "سورة " + a,
                c =
                  (void 0 !== x &&
                    x.find((e) => String(e.number) === String(r))?.name) ||
                  "سورة " + r;
              let d = "";
              ((d =
                a === r
                  ? `<strong style="color:#fde047;">${l}</strong><br>\n                                <span style="font-size:11px;">من آية ${s} إلى ${i}</span>`
                  : `<strong style="color:#fde047;">${l}</strong> <span style="font-size:10px;">(آية ${s})</span><br>\n                                <span style="color:#94a3b8; font-size:10px;">إلى</span><br>\n                                <strong style="color:#fde047;">${c}</strong> <span style="font-size:10px;">(آية ${i})</span>`),
                (n.innerHTML = d));
            } else n.innerHTML = "لا توجد آيات في هذه الصفحة";
          } else n.innerHTML = "عفواً، بيانات الصفحة غير متاحة";
        ((n.style.display = "block"),
          n.getBoundingClientRect().top < 60
            ? n.classList.add("flip-bottom")
            : n.classList.remove("flip-bottom"));
      }
    }),
    document.addEventListener(
      "click",
      function (e) {
        e.target.closest(".page-btn-wrapper") ||
          document
            .querySelectorAll(".page-tooltip")
            .forEach((e) => (e.style.display = "none"));
      },
      !0,
    ),
    "scrollRestoration" in history && (history.scrollRestoration = "manual"),
    document.addEventListener("DOMContentLoaded", () => {
      const e = document.getElementById("backToPages"),
        t = document.querySelector(".prev-page"),
        n = document.querySelector(".next-page"),
        a = document.getElementById("resumePageBtn");
      (e &&
        e.addEventListener("click", () => {
          ((document.getElementById("pages-view").style.display = "none"),
            (document.getElementById("pages-list").style.display = "grid"),
            P(!1));
        }),
        t &&
          t.addEventListener("click", () => {
            M > 1 && Q(M - 1);
          }),
        n &&
          n.addEventListener("click", () => {
            M < 604 && Q(M + 1);
          }),
        a &&
          a.addEventListener("click", () => {
            let e = localStorage.getItem("quran-last-page");
            e ? Q(parseInt(e, 10)) : alert("لا يوجد تقدم محفوظ للصفحات.");
          }),
        (function () {
          const e = document.getElementById("pages-list");
          if (e) {
            e.innerHTML = "";
            for (let t = 1; t <= 604; t++) {
              let n = document.createElement("div");
              ((n.className = "read-surah-item page-btn-wrapper"),
                (n.innerHTML = `\n            <div class="page-btn" \n                 onmousedown="startPagePress(${t})" \n                 onmouseup="endPagePress(${t})" \n                 onmouseleave="cancelPagePress()" \n                 ontouchstart="startPagePress(${t})" \n                 ontouchend="endPagePress(${t})" \n                 ontouchmove="cancelPagePress()"\n                 oncontextmenu="return false;">\n                <span class="surah-name-ar">صفحة  ${t}</span>\n            </div>\n            \n            <div id="page-info-${t}" class="page-tooltip">\n                <span class="tooltip-loading">جاري تحميل البيانات...</span>\n            </div>\n        `),
                e.appendChild(n));
            }
          }
        })());
    }),
    document.addEventListener("DOMContentLoaded", () => {
      const e = {
          swar: document.querySelector(".swar-page-btn"),
          juz: document.querySelector(".juz-page-btn"),
          pages: document.querySelector(".pages-page-btn"),
          search: document.querySelector(".search-page-btn"),
        },
        t = {
          swar: document.querySelector(".swar-section"),
          juz: document.querySelector(".juz-section"),
          pages: document.querySelector(".pages-section"),
          search: document.querySelector(".search-section"),
        };
      function n(n) {
        (Object.keys(e).forEach((a) => {
          e[a] &&
            t[a] &&
            (a === n
              ? (e[a].classList.add("active"), (t[a].style.display = "block"))
              : (e[a].classList.remove("active"),
                (t[a].style.display = "none")));
        }),
          P(!1),
          window.scrollTo({ top: 0, behavior: "instant" }));
      }
      (e.swar && e.swar.addEventListener("click", () => n("swar")),
        e.juz && e.juz.addEventListener("click", () => n("juz")),
        e.pages && e.pages.addEventListener("click", () => n("pages")),
        e.search && e.search.addEventListener("click", () => n("search")));
      const a = document.getElementById("backToJuz");
      a &&
        a.addEventListener("click", () => {
          ((document.getElementById("juz-view").style.display = "none"),
            (document.getElementById("juz-list").style.display = "grid"),
            P(!1));
        });
    }),
    Promise.all([
      fetch(i)
        .then((e) => e.json())
        .then((e) => {
          if (200 === e.code && e.data) return (x = e.data);
          throw new Error("لا توجد بيانات");
        }),
      fetch("../json/reciters.json")
        .then((e) => e.json())
        .then((e) => (e.reciters ? (k = e.reciters) : []))
        .catch(() => []),
    ]).then(
      () => (
        (m.style.display = "none"),
        (p.style.display = "none"),
        (g.innerHTML = ""),
        void x.forEach(function (e) {
          var t = document.createElement("div");
          ((t.className = "read-surah-item"), (t.dataset.number = e.number));
          var n = "Meccan" === e.revelationType ? "مكية" : "مدنية";
          ((t.innerHTML =
            '<span class="surah-num">' +
            e.number +
            '</span><div class="surah-info"><span class="surah-name-ar">' +
            (e.name || "") +
            '</span><span class="surah-meta">' +
            (e.englishName || "") +
            " • " +
            n +
            " • " +
            e.numberOfAyahs +
            " آية</span></div>"),
            t.addEventListener("click", function () {
              window.location.hash = "/surah/" + e.number;
            }),
            g.appendChild(t));
        })
      ),
    ),
    document.addEventListener("DOMContentLoaded", () => {
      const e = document.getElementById("pages-view");
      let t = 0,
        n = 0;
      e &&
        (e.addEventListener(
          "touchstart",
          function (e) {
            t = e.changedTouches[0].screenX;
          },
          { passive: !0 },
        ),
        e.addEventListener(
          "touchend",
          function (e) {
            ((n = e.changedTouches[0].screenX),
              n < t - 60 && M > 1 && Q(M - 1),
              n > t + 60 && M < 604 && Q(M + 1));
          },
          { passive: !0 },
        ));
    }));
  var U = [],
    G = [],
    Z = "quran_sadaka_history_final";
  function ee(e) {
    return e
      ? e
          .replace(/[\u064B-\u0652]/g, "")
          .replace(/[\u06D6-\u06ED]/g, "")
          .replace(/\u0640/g, "")
          .replace(/[أإآ]/g, "ا")
          .replace(/ى/g, "ي")
          .replace(/ة/g, "ه")
          .replace(/\s+/g, " ")
          .replace(/[^\u0621-\u064A\s]/g, "")
          .trim()
      : "";
  }
  ((window.shareVerse = function (e, t, n, a) {
    e && e.stopPropagation && e.stopPropagation();
    const s = `قال تعالى: { ${t} } [سورة ${n} - آية ${a}]\n\nتمت المشاركة من تطبيق قرآن صدقة 🌙`;
    navigator.share
      ? navigator.share({ title: "آية كريمة", text: s }).catch(() => {})
      : window.open(`https://wa.me/?text=${encodeURIComponent(s)}`, "_blank");
  }),
    (window.copyVerse = async (e, t, n, a) => {
      const s = `${t} [${n}: ${a}]`;
      try {
        await navigator.clipboard.writeText(s);
        const t = e.innerHTML,
          n = e.style.background;
        ((e.innerHTML = '<i class="fas fa-check"></i> تم النسخ'),
          (e.style.background = "#059669"),
          setTimeout(() => {
            ((e.innerHTML = t), (e.style.background = n));
          }, 1500));
      } catch (e) {
        (console.error("فشل النسخ:", e),
          alert("حدث خطأ أثناء النسخ، يرجى المحاولة مرة أخرى."));
      }
    }),
    (window.checkAndOpenTarget = function () {
      const e = sessionStorage.getItem("target_surah"),
        t = sessionStorage.getItem("target_ayah");
      if (e && t) {
        V(parseInt(e));
        let n = 0;
        const a = setInterval(() => {
          let e =
            document.getElementById(`ayah-${t}`) ||
            document.getElementById(`${t}`) ||
            document.querySelector(`[data-ayah="${t}"]`) ||
            document.querySelector(`.ayah-num-${t}`);
          if (!e) {
            const n = document.querySelectorAll(
              ".ayah-container, .verse-box, span, div",
            );
            e = Array.from(n).find((e) => e.textContent.trim() === String(t));
          }
          (e &&
            (clearInterval(a),
            sessionStorage.removeItem("target_surah"),
            sessionStorage.removeItem("target_ayah"),
            e.scrollIntoView({ behavior: "smooth", block: "center" }),
            (e.style.transition = "background 0.5s ease"),
            (e.style.backgroundColor = "rgba(59, 130, 246, 0.2)"),
            setTimeout(() => {
              e.style.backgroundColor = "transparent";
            }, 3e3)),
            ++n > 40 &&
              (clearInterval(a),
              console.log(
                "تعذر العثور على الآية، تأكد من وجود ID في صفحة السور",
              )));
        }, 250);
      }
    }),
    (window.goToVerse = function (e, t) {
      const n = document.getElementById("quran-search-input");
      (n && n.value.length > 1 && window.saveToHistory(n.value),
        n && n.blur(),
        sessionStorage.setItem("target_surah", e),
        sessionStorage.setItem("target_ayah", t));
      const a = document.querySelector(".swar-page-btn");
      a && (a.click(), setTimeout(window.checkAndOpenTarget, 500));
    }),
    (window.renderHistory = function () {
      const e = document.getElementById("search-history");
      if (!e) return;
      const t = JSON.parse(localStorage.getItem(Z)) || [];
      if (0 === t.length) return void (e.innerHTML = "");
      let n =
        '<div class="search-history-title" style="font-size:12px; color:#888; margin-bottom:8px;">آخر عمليات البحث:</div>';
      (t.forEach((e) => {
        n += `<span class="search-tag" onclick="window.useHistoryWord('${e}')" \n              style="display:inline-block; background:#f1f5f9; padding:5px 12px; border-radius:20px; font-size:12px; margin-left:8px; cursor:pointer; border:1px solid #e2e8f0; color:#475569; margin-bottom:5px;">\n              ${e}\n            </span>`;
      }),
        (e.innerHTML = n));
    }),
    (window.saveToHistory = function (e) {
      let t = e.trim();
      if (t.length < 2) return;
      let n = JSON.parse(localStorage.getItem(Z)) || [];
      ((n = n.filter((e) => e !== t)),
        n.unshift(t),
        (n = n.slice(0, 5)),
        localStorage.setItem(Z, JSON.stringify(n)),
        window.renderHistory());
    }),
    (window.useHistoryWord = function (e) {
      const t = document.getElementById("quran-search-input");
      t && ((t.value = e), window.doSearch(e), t.blur());
    }),
    (window.displayResults = function (e, t) {
      const n = document.getElementById("search-results-list");
      n &&
        ((n.innerHTML = ""),
        0 !== e.length
          ? e.forEach((e) => {
              const a = G.find(
                  (t) => String(t.number) === String(e.surah_num),
                ) || { name: "سورة", revelationType: "" },
                s = new RegExp(`(${t})`, "gi"),
                o = e.text.replace(
                  s,
                  '<span style="color:#3b82f6; font-weight:bold;">$1</span>',
                ),
                r = e.text.replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                i = `\n      <div class="result-card" onclick="window.goToVerse(${e.surah_num}, ${e.ayah_num})"\n           style="background:#fff; border-radius:15px; padding:20px; margin-bottom:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05); position:relative; border:1px solid #eee; direction:rtl; text-align:right; cursor:pointer;">\n        <div class="surah-badge" style="position:absolute; top:15px; left:15px; background:#3b82f6; color:#fff; padding:5px 12px; border-radius:8px; font-weight:bold; font-size:13px;">\n          ${a.name} ${e.ayah_num}\n        </div>\n        <p class="verse-text" style="font-size:1.15rem; line-height:1.8; color:#333; margin:25px 0 15px 0; font-family:'Cairo', sans-serif;">\n          ${o}\n        </p>\n        <div class="verse-meta" style="border-top:1px solid #eee; padding-top:10px; font-size:12px; color:#777; display:flex; justify-content:space-between; align-items:center;">\n  <span>آية ${e.ayah_num} | ${"Meccan" === a.revelationType ? "مكية" : "مدنية"} | صـ ${e.page}</span>\n\n  \n\n  <div class="verse-actions" style="display:flex; gap:8px;">\n   <button class="copy-verse-btn" onclick="event.stopPropagation(); window.copyVerse(this, '${r}', '${a.name}', ${e.ayah_num})">\n  <i class="fas fa-copy"></i>نسخ\n</button>\n    \n    <button class="share-verse-btn" onclick="event.stopPropagation(); window.shareVerse(event, '${r}', '${a.name}', ${e.ayah_num})">\n      <i class="fas fa-share-nodes"></i>مشاركة\n    </button>\n  </div>\n</div>\n      </div>`;
              n.insertAdjacentHTML("beforeend", i);
            })
          : (n.innerHTML = `<p style="text-align:center; padding:20px; color:#999;">لا توجد نتائج مطابقة لـ "${t}"</p>`));
    }),
    (window.doSearch = function (e) {
      const t = document.getElementById("search-results-list"),
        n = document.getElementById("results-count"),
        a = document.querySelector(".search-hint"),
        s = document.getElementById("count-num");
      if (!t) return;
      if (
        (a && (a.style.display = e.trim().length > 0 ? "none" : "block"),
        e.trim().length < 2)
      )
        return ((t.innerHTML = ""), void (n && (n.style.display = "none")));
      const o = ee(e),
        r = U.filter((e) => ee(e.text).includes(o)).slice(0, 40);
      (s && (s.innerText = r.length),
        n && (n.style.display = r.length > 0 ? "block" : "none"),
        window.displayResults(r, e));
    }),
    document.addEventListener("DOMContentLoaded", function () {
      !(async function () {
        try {
          const [e, t] = await Promise.all([
              fetch("../json/quran.json"),
              fetch(i),
            ]),
            n = await e.json(),
            a = await t.json();
          ((G = a.data || a),
            (U = []),
            n.forEach((e) => {
              e.ayahs &&
                e.ayahs.forEach((t) => {
                  U.push({
                    text: t.text,
                    ayah_num: t.numberInSurah || t.number,
                    surah_num: e.number,
                    page: t.page || "",
                  });
                });
            }),
            window.renderHistory());
        } catch (e) {
          console.error(e);
        }
      })();
      const e = document.getElementById("quran-search-input");
      e &&
        (e.addEventListener("input", (e) => window.doSearch(e.target.value)),
        e.addEventListener("keypress", (t) => {
          "Enter" === t.key && (window.saveToHistory(e.value), e.blur());
        }));
    }));
})();
