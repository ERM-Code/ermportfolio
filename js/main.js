/* V6 DIARY main — feed orizzontale da data.js + scroll verticale che sposta da destra a sinistra + reveal + poster in ascii con interazioni + lightbox */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- lingua it / en ---------- */
  var I18N = {
    it: {
      title_index: "home — erm", title_archive: "archivio — erm",
      nav_works: "home", nav_archivio: "archivio",
      statement: "sono emanuele, questo è il mio sito: un po' di chi sono e di cosa faccio.",
      ascii_hint: "psst — muovi il mouse e clicca sullo sfondo",
      r1_head: "capitolo 01 — codice",
      r1_p1: "mi piace scrivere codice e creare siti, con particolare attenzione a estetica e dettagli.",
      r2_head: "capitolo 02 — motori e edit",
      r2_p1: "mi piacciono auto e moto, e le uso come soggetto per i miei edit: fotoritocco, giochi di luce e poster.",
      see_all: "guardali tutti →",
      archive_h1: "Poster", archive_hint: "scorri — un poster alla volta",
      archive_posters: "poster", archive_photography: "fotografia", archive_websites: "siti",
      photo_h1: "Fotografia", photo_hint: "uno sguardo dal vivo",
      sites_h1: "Siti", sites_empty: "nuovi progetti in arrivo",
      sites_description: "Qui troverai i siti e i progetti web che ho realizzato.",
      outro_ask: "ti piacciono i miei lavori? scrivimi!",
      footer_made: "disegnato e sviluppato da me", lb_close: "chiudi ✕"
    },
    en: {
      title_index: "home — erm", title_archive: "archive — erm",
      nav_works: "home", nav_archivio: "archive",
      statement: "i'm emanuele, this is my site: a bit about who i am and what i do.",
      ascii_hint: "psst — move the mouse and click the background",
      r1_head: "chapter 01 — code",
      r1_p1: "i like writing code and building sites, with a particular eye for aesthetics and detail.",
      r2_head: "chapter 02 — engines and edits",
      r2_p1: "i love cars and bikes, and i use them as subjects for my edits: retouching, light play and posters.",
      see_all: "see them all →",
      archive_h1: "Posters", archive_hint: "scroll — one poster at a time",
      archive_posters: "posters", archive_photography: "photography", archive_websites: "websites",
      photo_h1: "Photography", photo_hint: "a view from the road",
      sites_h1: "Websites", sites_empty: "new projects coming soon",
      sites_description: "This is where you'll find the websites and web projects I've made.",
      outro_ask: "do you like my work? write me!",
      footer_made: "design and development by me", lb_close: "close ✕"
    }
  };
  function currentLang() {
    try { return localStorage.getItem("erm-lang") || "it"; }
    catch (e) { return "it"; }
  }
  function applyLang(l) {
    var d = I18N[l] || I18N.it;
    document.documentElement.lang = l === "it" ? "it" : "en";
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      var k = el.getAttribute("data-i18n");
      if (d[k] !== undefined) el.textContent = d[k];
    });
    var b = document.getElementById("lang");
    if (b) b.textContent = l === "it" ? "en" : "it";
    var pg = document.body.getAttribute("data-page") || "index";
    var tk = { index: "title_index", archive: "title_archive" }[pg] || "title_index";
    if (d[tk]) document.title = d[tk];
    try { localStorage.setItem("erm-lang", l); } catch (e) {}
  }

  /* ---------- dati + anno ---------- */
  var DATA = (typeof WORKS !== "undefined" ? WORKS : []);
  var PHOTO_DATA = (typeof PHOTOS !== "undefined" ? PHOTOS : []);
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  var photogrid = document.getElementById("photogrid");
  if (photogrid) {
    PHOTO_DATA.forEach(function (photo) {
      var item = document.createElement("button");
      item.className = "photo-item";
      item.type = "button";
      item.setAttribute("aria-label", photo.title);
      item.innerHTML = '<img loading="lazy" src="' + (photo.img || photo.full) + '" alt="' + photo.title + '" />' +
        '<span class="mono">' + (photo.file || photo.title) + "</span>";
      item.addEventListener("click", function () { openLB(photo); });
      photogrid.appendChild(item);
    });
    var photocount = document.getElementById("photocount");
    if (photocount) photocount.textContent = "01 / " + ("0" + PHOTO_DATA.length).slice(-2);
  }

  /* ---------- archivio: palco fullscreen, un poster alla volta guidato dallo scroll ---------- */
  var agrid = document.getElementById("agrid");
  var astage = document.getElementById("astage");
  var ashots = [];
  if (agrid) {
    DATA.forEach(function (w, i) {
      var f = document.createElement("figure");
      f.className = "ashot";
      f.style.zIndex = i + 1;
      f.innerHTML = '<div class="sph"><img loading="lazy" src="' + (w.img || w.full) + '" alt="' + w.title + '" /></div>' +
        '<figcaption class="mono">' + (w.file || w.title) + "</figcaption>";
      f.addEventListener("click", function () { openLB(w); });
      agrid.appendChild(f);
      ashots.push(f);
    });
  }
  var acount = document.getElementById("acount");
  var afill = document.getElementById("afill");
  function measureA() {
    if (!astage || reduce || !ashots.length) return;
    astage.style.height = (ashots.length * 160) + "vh";
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function updateA() {
    if (!astage || reduce || !ashots.length) return;
    var H = window.innerHeight;
    var max = astage.offsetHeight - H;
    var done = Math.min(Math.max(-astage.getBoundingClientRect().top, 0), max);
    var p = max > 0 ? done / max : 0;
    var n = ashots.length, best = 0, bestO = -1;
    for (var i = 0; i < n; i++) {
      var t = p * n - i;
      if (i === n - 1 && t > 0.65) t = 0.65; // l'ultimo resta in scena
      var g0 = (i === 0) ? 0 : -0.15; // i successivi partono mentre il precedente esce
      var gspan = 0.35 - g0;
      var s, o;
      if (t < g0) { s = 0.35; o = 0; }
      else if (t < 0.35) { var k = easeOut((t - g0) / gspan); s = 0.35 + 0.65 * k; o = k; } // cresce
      else if (t < 0.65) { s = 1; o = 1; } // tiene
      else if (t < 1) { var k2 = (t - 0.65) / 0.35; s = 1 + 0.7 * k2 * k2; o = 1 - k2; } // zoom verso te e via
      else { s = 1.7; o = 0; }
      var fig = ashots[i];
      fig.style.opacity = o;
      fig.style.pointerEvents = o > 0.05 ? "auto" : "none";
      var sph = fig.firstChild;
      if (sph) sph.style.transform = "scale(" + s + ")";
      if (o > bestO) { bestO = o; best = i; }
    }
    if (acount) acount.textContent = ("0" + (best + 1)).slice(-2) + " / " + ("0" + n).slice(-2);
    if (afill) afill.style.width = (p * 100) + "%";
  }
  var aTick = false;
  function requestA() {
    if (aTick) return;
    aTick = true;
    requestAnimationFrame(function () { aTick = false; updateA(); });
  }
  function restoreArchiveHash() {
    var target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;
    var section = target.closest("[data-category-section]");
    if (section) activatePortfolioCategory(section.id, false);
    var rootStyle = document.documentElement.style;
    var scrollBehavior = rootStyle.scrollBehavior;
    rootStyle.scrollBehavior = "auto";
    target.scrollIntoView();
    rootStyle.scrollBehavior = scrollBehavior;
  }
  if (astage) {
    if (reduce) {
      astage.classList.add("native");
    } else {
      measureA();
      window.addEventListener("load", function () { measureA(); updateA(); restoreArchiveHash(); });
      window.addEventListener("resize", function () { measureA(); updateA(); });
      window.addEventListener("scroll", requestA, { passive: true });
      updateA();
    }
  }

  var portfolioSections = Array.prototype.slice.call(document.querySelectorAll("[data-category-section]"));
  var portfolioTabs = Array.prototype.slice.call(document.querySelectorAll(".archive-tabs a"));
  function activatePortfolioCategory(id, scroll) {
    var activeSection = portfolioSections.find(function (section) { return section.id === id; });
    if (!activeSection) return false;
    portfolioSections.forEach(function (section) {
      section.hidden = section !== activeSection;
    });
    portfolioTabs.forEach(function (tab) {
      if (tab.getAttribute("href") === "#" + id) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    if (id === "astage") {
      measureA();
      updateA();
    }
    if (scroll) {
      window.history.pushState(null, "", "#" + id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return true;
  }
  portfolioTabs.forEach(function (tab) {
    tab.addEventListener("click", function (event) {
      event.preventDefault();
      activatePortfolioCategory(tab.getAttribute("href").slice(1), true);
    });
  });
  window.addEventListener("hashchange", function () {
    var section = document.getElementById(window.location.hash.slice(1));
    if (section && section.hasAttribute("data-category-section")) {
      activatePortfolioCategory(section.id, false);
      restoreArchiveHash();
    }
  });
  var initialSection = document.getElementById(window.location.hash.slice(1));
  activatePortfolioCategory(
    initialSection && initialSection.hasAttribute("data-category-section") ? initialSection.id : "astage",
    false
  );

  /* ---------- pallino in difference su tutto il sito ---------- */
  var dot = document.getElementById("cursor-dot");
  if (dot && window.matchMedia("(hover: hover)").matches) {
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2, dx = tx, dy = ty;
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.classList.add("on"); // riaccendi sempre: la scrollbar e il blur lo spengono
    });
    (function follow() {
      dx += (tx - dx) * 0.2; dy += (ty - dy) * 0.2;
      dot.style.transform = "translate(" + dx + "px," + dy + "px)";
      requestAnimationFrame(follow);
    })();
    document.addEventListener("mouseover", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("a,button,.ashot") : null;
      dot.classList.toggle("big", !!t);
    });
    // spegni solo quando esci davvero dalla finestra o perdi il focus
    document.documentElement.addEventListener("mouseleave", function () { dot.classList.remove("on"); });
    window.addEventListener("blur", function () { dot.classList.remove("on"); });
  }

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  Array.prototype.forEach.call(document.querySelectorAll(".rv"), function (el) { io.observe(el); });

  var fHero = document.getElementById("hero");
  var fCh01 = document.getElementById("ch01");
  var fCh02 = document.getElementById("ch02");
  var fOutro = document.getElementById("outroSec");
  var fPairs = [
    [fHero, fCh01],
    [fCh01, fCh02],
    [fCh02, fOutro]
  ];
  var fFooter = document.querySelector("footer");
  function sizeOutro() {
    if (fOutro && fFooter) fOutro.style.minHeight = (window.innerHeight - fFooter.offsetHeight) + "px";
  }
  sizeOutro();
  window.addEventListener("resize", sizeOutro);
  window.addEventListener("load", sizeOutro);
  if (!reduce) {
    var sFade = false;
        var fastFade = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    function contentBox(sec) {
      var top = Infinity, bottom = -Infinity;
      Array.prototype.forEach.call(sec.children, function (ch) {
        if (getComputedStyle(ch).position === "fixed") return;
        var r = ch.getBoundingClientRect();
        if (r.height === 0) return;
        if (r.top < top) top = r.top;
        if (r.bottom > bottom) bottom = r.bottom;
      });
      return { top: top, bottom: bottom };
    }
    var secsUpd = function () {
      sFade = false;
      var H = window.innerHeight;
      var mobile = fastFade || window.innerWidth <= 640;
      fPairs.forEach(function (pr) {
        if (!pr[0] || !pr[1]) return;
        var op;
        var prev = pr[0];
        var next = pr[1];
        var nextTop = next.getBoundingClientRect().top;

        if (mobile && prev === fHero && next === fCh01) {
          // hero: dissolve mentre il capitolo 1 arriva in vista
          op = Math.min(1, Math.max(0, (nextTop - H * 0.14) / (H * 0.42)));
        } else if (mobile && prev === fCh01 && next === fCh02) {
          // capitolo 1: blocco vero, titolo completamente dissolto prima dell'ingresso nel capitolo 2
          op = Math.min(1, Math.max(0, (nextTop - H * 0.75) / (H * 0.3)));
          if (nextTop < H * 0.75) op = 0;
        } else if (mobile && prev === fCh02 && next === fOutro) {
          // capitolo 2: completamente fuori quando il footer si avvicina
          op = Math.min(1, Math.max(0, (nextTop - H * 0.72) / (H * 0.3)));
          if (nextTop < H * 0.72) op = 0;
        } else if (mobile) {
          // mobile: la sezione sopra sparisce prima che i testi si tocchino
          var gap = contentBox(next).top - contentBox(prev).bottom - 12;
          op = Math.min(1, Math.max(0, gap / (H * 0.14)));
        } else {
          var t = next.getBoundingClientRect().top;
          op = Math.min(1, Math.max(0, (t / H) * 1.3));
        }
        prev.style.opacity = String(op);
      });
    };
    window.addEventListener("scroll", function () {
      if (!sFade) { sFade = true; requestAnimationFrame(secsUpd); }
    }, { passive: true });
    secsUpd();
  }

  /* ---------- lightbox minimale ---------- */
  var lb = document.getElementById("lightbox");
  function openLB(w) {
    if (!lb) return;
    var lbImg = document.getElementById("lb-img");
    lbImg.src = w.full || w.img;
    lbImg.alt = w.title;
    document.getElementById("lb-title").textContent = w.title;
    document.getElementById("lb-spec").textContent = w.file || w.title;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
  }
  function closeLB() {
    if (!lb) return;
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
  }
  var cbtn = document.getElementById("lb-close");
  if (cbtn) cbtn.addEventListener("click", closeLB);
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLB(); });

  /* ---------- mare ascii fullscreen: onde di contorno, non invasivo ---------- */
  var pre = document.getElementById("ascii");
  if (pre) {
    var CHARS = " .:-=+*#%@";
    var CELL = 9, COLS = 0, ROWS = 0;

    var mx = -9999, my = -9999, ripples = [];
    var lastY = window.scrollY || 0, energy = 0;
    var phase = 0, lastNow = -1;

    function charW() {
      // misura vera del carattere nel browser: niente più bande laterali
      var s = document.createElement("span");
      s.style.position = "absolute";
      s.style.visibility = "hidden";
      s.style.fontFamily = "monospace";
      s.style.whiteSpace = "pre";
      s.style.fontSize = CELL + "px";
      s.style.lineHeight = CELL + "px";
      s.textContent = "0123456789";
      document.body.appendChild(s);
      var w = s.getBoundingClientRect().width / 10;
      document.body.removeChild(s);
      return w;
    }

    function buildGrid() {
      // carattere più grande finché le celle restano gestibili: copertura esatta del viewport
      CELL = 9;
      var c0, r0, cw;
      do {
        pre.style.fontSize = CELL + "px";
        pre.style.lineHeight = CELL + "px";
        cw = charW();
        c0 = Math.ceil(window.innerWidth / cw);
        r0 = Math.ceil(window.innerHeight / CELL);
        if (c0 * r0 > 42000 && CELL < 14) CELL++;
        else break;
      } while (true);
      COLS = Math.max(80, c0);
      ROWS = Math.max(40, r0);
    }

    document.addEventListener("mousemove", function (e) {
      if (!COLS) return;
      mx = (e.clientX / window.innerWidth) * COLS;
      my = (e.clientY / window.innerHeight) * ROWS;
    });
    document.addEventListener("mouseleave", function () { mx = -9999; my = -9999; });
    document.addEventListener("click", function (e) {
      if (!COLS) return;
      var lb = document.getElementById("lightbox");
      if (lb && lb.classList.contains("open")) return;
      ripples.push({
        x: (e.clientX / window.innerWidth) * COLS,
        y: (e.clientY / window.innerHeight) * ROWS,
        t: performance.now()
      });
      if (ripples.length > 5) ripples.shift();
    });

    function paint(now) {
      var sy = window.scrollY || 0;
      var sp = Math.abs(sy - lastY);
      lastY = sy;
      energy += (Math.min(sp, 60) - energy) * 0.08;
      // fase integrata: niente più salti quando la velocità cambia
      var dt = lastNow < 0 ? 0 : Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      phase += dt * (1 + energy * 0.006); // lo scroll accelera un filo le onde
      var tt = phase;

      var r, c, f, d, b, bi, k, age, dd;
      var out = "";
      for (r = 0; r < ROWS; r++) {
        for (c = 0; c < COLS; c++) {
          // campo d'onda: tre sinusoidi sovrapposte
          f = (Math.sin(c * 0.11 + tt * 0.7)
            + 0.6 * Math.sin(c * 0.23 - tt * 0.45 + r * 0.06)
            + 0.4 * Math.sin((c * 0.5 + r) * 0.09 + tt * 0.3)) * 1.3;
          // brezza del mouse: solleva le onde intorno al cursore
          var ex = c - mx, ey = (r - my) * 1.8;
          var d2 = ex * ex + ey * ey;
          if (d2 < 900) f += 0.5 * Math.exp(-d2 / 160);
          // sasso nello stagno
          for (k = 0; k < ripples.length; k++) {
            age = now - ripples[k].t;
            if (age > 4500) continue;
            var rx = c - ripples[k].x, ry = (r - ripples[k].y) * 1.8;
            dd = Math.sqrt(rx * rx + ry * ry);
            f += Math.sin(dd * 0.5 - age * 0.008) * Math.exp(-dd * 0.045) * Math.exp(-age * 0.0009) * 1.1;
          }
          // linee di contorno: solo dove il campo sfiora i livelli
          d = Math.abs(f + 1.2);
          var dl = Math.abs(f + 0.4); if (dl < d) d = dl;
          var dl2 = Math.abs(f - 0.4); if (dl2 < d) d = dl2;
          var dl3 = Math.abs(f - 1.2); if (dl3 < d) d = dl3;
          b = Math.exp(-d * d * 60);
          if (b < 0) b = 0; else if (b > 1) b = 1;
          bi = Math.floor(b * CHARS.length);
          out += CHARS[bi > CHARS.length - 1 ? CHARS.length - 1 : bi];
        }
        out += "\n";
      }
      pre.textContent = out;
    }

    function loop(now) {
      paint(now);
      requestAnimationFrame(loop);
    }

    buildGrid();
    paint(performance.now());
    if (!reduce) {
      requestAnimationFrame(loop);
      var rT = null;
      window.addEventListener("resize", function () {
        clearTimeout(rT);
        rT = setTimeout(function () { buildGrid(); }, 200);
      });
    }
  }

  /* ---------- animazione B: scramble terminal sui titoli ---------- */
  function scramble(el) {
    var text = el.textContent;
    var CH = "!<>-_\\/[]{}=+*^?#";
    var lang0 = currentLang();
    var start = performance.now(), dur = 1300, len = text.length;
    (function fr(now) {
      if (currentLang() !== lang0) return; // lingua cambiata: lascia il testo nuovo
      var p = Math.min(1, (now - start) / dur);
      var n = Math.floor(p * len), out = "", i, ch;
      for (i = 0; i < len; i++) {
        ch = text[i];
        out += (i < n || ch === " " || ch === "\n") ? ch : CH[(Math.random() * CH.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(fr); else el.textContent = text;
    })(start);
  }
  if (!reduce) {
    if (document.getElementById("hero")) {
      var st = document.querySelector(".statement");
      if (st) setTimeout(function () { scramble(st); }, 400);
    }
    var at = document.querySelector(".archive h1");
    if (at) setTimeout(function () { scramble(at); }, 250);
  }

  /* ---------- avvio lingua ---------- */
  var langBtn = document.getElementById("lang");
  if (langBtn) langBtn.addEventListener("click", function () {
    applyLang(currentLang() === "it" ? "en" : "it");
  });
  applyLang(currentLang());
})();
