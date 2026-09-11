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
      /* navigation_type: どの導線からのクリックかを区別(Sprint 6) */
      var navType = "category_crosslink";
      if (a.closest(".site-nav")) navType = "global_nav";
      else if (a.closest(".site-footer")) navType = "footer";
      else if (a.closest(".entry-card")) navType = "home_problem_card";
      send("category_navigation_click", {
        source_page: path,
        category_id: a.getAttribute("data-ga-cat"),
        destination_path: dest,
        navigation_type: navType
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

  /* ---------- bridge導線の視認計測(next_action_view) ----------
     next_action_clickだけでは「導線が見られていない」のか「見られたが押されていない」のかを
     区別できないため、視認を別イベントで測る(§20 M1 Day10-14方針)。
     条件: カードの50%以上が1秒以上継続表示・同一PV内 action_id で1回・IntersectionObserver。
     送信はページ構造由来の5項目のみ。入力金額・計算結果・診断回答・地域は送信しない。
     導線の位置・見出し・文言・リンク先はこの変更では触っていない(計測の追加のみ)。 */
  var BRIDGE_ACTION_IDS = ["bike-insurance-compare", "bike-disposal-compare"];

  function pageIdFromPath() {
    var segs = location.pathname.split("/").filter(function (s) { return s; });
    return segs.join("-");
  }

  function observeNavView(el, params) {
    if (!("IntersectionObserver" in window) || !el) return;
    var seen = (window.__hkgNavViewSeen = window.__hkgNavViewSeen || {});
    var key = params.action_id;
    if (seen[key]) return;
    var timer = null;
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var en = entries[i];
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          if (!timer) {
            timer = setTimeout(function () {
              if (!seen[key]) { seen[key] = 1; send("next_action_view", params); }
              io.disconnect();
            }, 1000);
          }
        } else if (timer) { clearTimeout(timer); timer = null; }
      }
    }, { threshold: [0, 0.5] });
    io.observe(el);
  }

  var bridgeCards = document.querySelectorAll(".next-action-card[data-action-id]");
  var bridgePageId = pageIdFromPath();
  for (var bi = 0; bi < bridgeCards.length; bi++) {
    var bEl = bridgeCards[bi];
    var bAid = bEl.getAttribute("data-action-id") || "";
    if (BRIDGE_ACTION_IDS.indexOf(bAid) === -1) continue;
    var bGrid = bEl.parentNode;
    var bSibs = bGrid ? bGrid.querySelectorAll(".next-action-card[data-action-id]") : [bEl];
    var bIdx = Array.prototype.indexOf.call(bSibs, bEl);
    observeNavView(bEl, {
      page_id: bridgePageId,
      action_id: bAid,
      destination_path: bEl.getAttribute("href") || "",
      navigation_type: "bridge",
      card_position: bIdx === 0 ? "primary" : "secondary"
    });
  }
})();
