/* ===========================================================================
   はかりごと 広告設定ファイル(1ファイルで全サイトの広告を管理)
   ---------------------------------------------------------------------------
   使い方:
     各スロットの値(空文字 "")に、ASP(A8/もしも)で取得した広告リンクの
     HTMLタグを貼り付けるだけ。全ページの対応スロットに自動で挿入されます。
     空のままのスロットは表示されません(レイアウトは崩れません)。

   貼り付け方:
     A8   … プログラム詳細 →「広告リンク作成」→ 表示されたHTMLソースをコピー
     もしも … プロモーション →「広告リンクへ」→ ソースのHTMLをコピー
     JS文字列として貼るので、シングルクォート(')は \' にエスケープするか、
     下記のようにバッククォート(`)で囲むと安全です。

   PR表記(ステマ規制)について:
     各広告の上に「スポンサーリンク」ラベルが自動表示され、さらに全ページ
     上部に「広告(PR)を含みます」のバナーが出ます(二重で表示義務を満たす)。
   =========================================================================== */
(function () {
  "use strict";

  /* ---------- Google アナリティクス(GA4) ----------
     測定IDを設定すると全ページで計測が有効になる。空なら完全無効。
     ツールの入力値は一切送信しない(閲覧イベントのみ)。
     Sprint 6:
     - localhost / 127.* / file: ではGA4を読み込まない(開発アクセスを本番計測に混ぜない)
     - 運営者ブラウザは localStorage.setItem("hkg_internal_traffic","true") を一度実行すると
       全イベントに traffic_type:"internal" が付与され、GA4側のフィルタで除外できる。
       解除は removeItem。個人を特定するIDは送信しない。 */
  var GA4_ID = "G-NENYSGH5PH";
  var IS_DEV = /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname) || location.protocol === "file:";
  var IS_INTERNAL = false;
  try { IS_INTERNAL = localStorage.getItem("hkg_internal_traffic") === "true"; } catch (e) { /* noop */ }
  if (GA4_ID && !IS_DEV) {
    var gs = document.createElement("script");
    gs.async = true;
    gs.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(gs);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag("js", new Date());
    if (IS_INTERNAL) gtag("set", { traffic_type: "internal" });
    gtag("config", GA4_ID, { anonymize_ip: true });
    /* 案件カード(offers.js)のイベントをGA4へ転送 */
    window.hkgSink = function (eventName, params) { gtag("event", eventName, params); };
    /* sink定義前にキューへ積まれたイベントを送信(1回のみ。送信後はクリアして二重送信を防ぐ) */
    var q = window.__hkgEvents || [];
    for (var qi = 0; qi < q.length; qi++) { gtag("event", q[qi].event, q[qi].params); }
  }

  /* スロットkey → 広告HTMLタグ。承認済み案件を貼る場所をコメントで明示。 */
  var ADS = {
    /* ▼ やめどきナビ(退職・失業保険) */
    "tenshoku":          "", /* Sprint 9: 静的表示廃止。退職代行はoffers.jsのカード(taishoku-daiko)に一元化し、記事からは内部リンク経由 */
    "taishoku-daiko":    "", /* 男の退職代行 → offer-card管理へ移行(assets/offers.js の otokoTaishoku / watashiNext / gaiaTaishoku)。静的スロットは廃止 */
    "tenshoku-kangoshi": "", /* わたしNEXT → offer-card管理へ移行(assets/offers.js の watashiNext)。静的スロットは廃止 */
    "money":             "", /* 未承認(退職金→FP系の提携待ち) */

    /* ▼ マナー電卓(冠婚葬祭) */
    "sogi":    "", /* 未承認(家族葬のこれから・よりそう=A8審査中) */
    /* もしも経由Amazon(promotion_id=170・2026-08-19承認)。§14.4: tsuya-fukuso 1ページのみの実験。
       疑似レビュー・おすすめ順位付けなし=検索結果への中立リンクのみ。リンクURLは改変禁止(どこでもリンク生成形式のまま) */
    "amazon-tsuya": `
<p style="margin:0 0 6px;">急な参列で買いに行く時間がないときは、記事本文で触れた定番の小物をAmazonの検索結果から探せます(在庫とお届け日は検索結果で確認できます)。特定の商品をおすすめするものではありません。</p>
<ul style="margin:0 0 8px;">
    <li><a href="//af.moshimo.com/af/c/click?a_id=5753650&p_id=170&pc_id=185&pl_id=38594&url=https%3A%2F%2Fwww.amazon.co.jp%2Fs%3Fk%3D%25E9%25BB%2592%2520%25E3%2583%258D%25E3%2582%25AF%25E3%2582%25BF%25E3%2582%25A4%2520%25E7%2584%25A1%25E5%259C%25B0%2520%25E5%25BC%2594%25E4%25BA%258B%25E7%2594%25A8" rel="nofollow sponsored" referrerpolicy="no-referrer-when-downgrade" target="_blank">黒無地のネクタイを探す</a></li>
    <li><a href="//af.moshimo.com/af/c/click?a_id=5753650&p_id=170&pc_id=185&pl_id=38594&url=https%3A%2F%2Fwww.amazon.co.jp%2Fs%3Fk%3D%25E9%25BB%2592%2520%25E3%2582%25B9%25E3%2583%2588%25E3%2583%2583%25E3%2582%25AD%25E3%2583%25B3%25E3%2582%25B0%252030%25E3%2583%2587%25E3%2583%258B%25E3%2583%25BC%25E3%2583%25AB" rel="nofollow sponsored" referrerpolicy="no-referrer-when-downgrade" target="_blank">薄手の黒ストッキング(30デニール程度)を探す</a></li>
    <li><a href="//af.moshimo.com/af/c/click?a_id=5753650&p_id=170&pc_id=185&pl_id=38594&url=https%3A%2F%2Fwww.amazon.co.jp%2Fs%3Fk%3D%25E6%2595%25B0%25E7%258F%25A0%2520%25E5%25BF%25B5%25E7%258F%25A0" rel="nofollow sponsored" referrerpolicy="no-referrer-when-downgrade" target="_blank">数珠(念珠)を探す</a></li>
    <li><a href="//af.moshimo.com/af/c/click?a_id=5753650&p_id=170&pc_id=185&pl_id=38594&url=https%3A%2F%2Fwww.amazon.co.jp%2Fs%3Fk%3D%25E9%25BB%2592%2520%25E9%259D%25B4%25E4%25B8%258B%2520%25E7%2584%25A1%25E5%259C%25B0%2520%25E3%2583%25AA%25E3%2583%2596%25E3%2581%25AA%25E3%2581%2597" rel="nofollow sponsored" referrerpolicy="no-referrer-when-downgrade" target="_blank">黒無地の靴下を探す</a></li>
</ul>
<small>Amazonのアソシエイトとして、当メディアは適格販売により収入を得ています。</small>
<img src="//i.moshimo.com/af/i/impression?a_id=5753650&p_id=170&pc_id=185&pl_id=38594" width="1" height="1" style="border:none;" alt="" loading="lazy">`,
    "wedding": "", /* 未承認(ご祝儀→ブライダル系の提携待ち) */
    "hakajimai": "", /* Sprint 9: 未使用タグを廃止(offer-card管理に移行済み) */

    /* ▼ かたづけ電卓(不用品・遺品整理) */
    "ihin":            "", /* Sprint 9: 未使用タグを廃止(offer-card管理に移行済み) */
    "fuyouhin":        "", /* Sprint 9: 未使用タグを廃止(offer-card管理に移行済み) */
    "digital-shukatsu": "", /* 案件消滅を確認(2026-07-18 A8検索0件)。デジタル遺品分野の新案件が出るまで空のまま */

    /* ▼ くるま・バイク・トラック電卓 */
    "kaitori":      "", /* Sprint 9: 維持費ページの直接査定広告を廃止(手放し診断経由に一本化) */
    "hoken":        "", /* 未承認(自動車保険→提携待ち) */
    "bike-kaitori": "", /* Sprint 9: 同上(手放し診断経由に一本化) */
    "bike-hoken":   "", /* 未承認(バイク保険→提携待ち) */
    "truck-kaitori":"", /* Sprint 9: 同上(手放し診断経由に一本化) */

    /* ▼ 金融(つみたて・ローン・FX) */
    "shoken":   "", /* 未承認(証券口座→アクセストレード等で提携予定) */
    "cardloan": "", /* 未承認(楽天銀行スーパーローン等→審査中) */
    "fx-kouza": "", /* Sprint 9: offers.jsのdmmfxへ構造化移行(fx-shokokinで文脈ゲート表示) */

    /* ▼ ペット電卓 */
    "pet-senior": "" /* 未承認(ペット火葬・シニアケア→提携待ち) */
  };

  var LABEL = "スポンサーリンク";

  /* 静的スロットkey → 台帳上のofferId(GA4計測用)。
     offer-card(offers.js)と同じ affiliate_impression / affiliate_click を送るが、
     slot_id を "static-〜" にして区別する。未登録キーは "static:"+key で送る。 */
  var SLOT_OFFER = {
    "amazon-tsuya": "amazonMoshimo",
    "tenshoku": "gaiaTaishoku",
    "hakajimai": "seaceremony",
    "ihin": "ihin110",
    "fuyouhin": "fireworks",
    "kaitori": "ucarpack",
    "bike-kaitori": "bikewan",
    "truck-kaitori": "kenkikaitoriya",
    "fx-kouza": "dmmfx"
  };

  function sendEvent(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
  }

  function render() {
    var slots = document.querySelectorAll(".ad-slot[data-ad]");
    var pagePath = location.pathname;
    for (var i = 0; i < slots.length; i++) {
      var el = slots[i];
      var key = el.getAttribute("data-ad");
      var tag = ADS[key];
      if (!tag) { el.style.display = "none"; continue; }
      el.innerHTML = '<span class="ad-slot-label">' + LABEL + "</span>" + tag;
      el.style.display = "";
      var offerId = SLOT_OFFER[key] || ("static:" + key);
      var slotId = "static-" + key;
      sendEvent("affiliate_impression", {
        offer_id: offerId, page_id: pagePath, slot_id: slotId,
        result_type: null, cta_variant: "static-text", card_position: "primary", offer_count: 1
      });
      var links = el.querySelectorAll("a");
      for (var n = 0; n < links.length; n++) {
        (function (a, oid, sid) {
          a.addEventListener("click", function () {
            sendEvent("affiliate_click", {
              offer_id: oid, page_id: pagePath, slot_id: sid,
              result_type: null, cta_variant: "static-text", card_position: "primary", offer_count: 1
            });
          });
        })(links[n], offerId, slotId);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
