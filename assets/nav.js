/* ===========================================================================
   はかりごと 共通ナビゲーション(モバイルメニュー・回遊イベント計測)
   - JS無効時もフッターから全カテゴリーへ到達可能(このJSは拡張のみ)
   - 計測はページパスのみ。フォーム入力値・計算結果は一切送信しない。
   =========================================================================== */
(function () {
  "use strict";

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("global-nav");
  var header = document.querySelector(".site-header");

  /* ---------- モバイルメニュー開閉 ---------- */
  if (toggle && nav) {
    var openMenu = function () {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "メニューを閉じる");
      document.body.classList.add("nav-locked");
      var first = nav.querySelector("a");
      if (first) first.focus();
    };
    var closeMenu = function (returnFocus) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "メニューを開く");
      document.body.classList.remove("nav-locked");
      if (returnFocus) toggle.focus();
    };
    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) { closeMenu(false); } else { openMenu(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu(true);
    });
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (header && !header.contains(e.target)) closeMenu(false);
    });
    /* メニュー内でのタブ移動を先頭↔末尾で循環させる */
    nav.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !nav.classList.contains("is-open")) return;
      var links = nav.querySelectorAll("a, button");
      if (!links.length) return;
      var first = links[0], last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); toggle.focus(); }
    });
  }

  /* ---------- 「その他」ドロップダウン(デスクトップ) ---------- */
  var moreBtn = document.querySelector(".nav-more-btn");
  var more = document.querySelector(".nav-more");
  if (moreBtn && more) {
    moreBtn.addEventListener("click", function () {
      var open = more.classList.toggle("is-open");
      moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (more.classList.contains("is-open") && !more.contains(e.target)) {
        more.classList.remove("is-open");
        moreBtn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && more.classList.contains("is-open")) {
        more.classList.remove("is-open");
        moreBtn.setAttribute("aria-expanded", "false");
        moreBtn.focus();
      }
    });
  }

  /* ---------- 内部回遊イベント(GA4) ----------
     送信するのはページパスとリンク先パスのみ。入力値・計算結果は送信しない。 */
  function send(eventName, params) {
    if (typeof window.gtag === "function") window.gtag("event", eventName, params);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var path = location.pathname;
    var dest = a.getAttribute("href") || "";
    if (a.hasAttribute("data-ga-cat")) {
      send("category_navigation_click", {
        source_page: path,
        category_id: a.getAttribute("data-ga-cat"),
        destination_path: dest
      });
    } else if (a.classList.contains("next-action-card")) {
      send("next_action_click", {
        source_page: path,
        destination_path: dest,
        action_id: a.getAttribute("data-action-id") || ""
      });
    } else if (a.closest(".related-tools")) {
      send("related_tool_click", {
        source_page: path,
        destination_path: dest
      });
    }
  });
})();
