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
    "tenshoku":          `<a href="//af.moshimo.com/af/c/click?a_id=5700573&p_id=5546&pc_id=15198&pl_id=71517" rel="nofollow sponsored" referrerpolicy="no-referrer-when-downgrade">退職を自分で言い出せないときは — 弁護士法人ガイアの退職代行(無料相談)</a><img src="//i.moshimo.com/af/i/impression?a_id=5700573&p_id=5546&pc_id=15198&pl_id=71517" width="1" height="1" style="border:none;" loading="lazy" alt="">`, /* もしも ガイア(退職代行) */
    "taishoku-daiko":    "", /* 男の退職代行 → offer-card管理へ移行(assets/offers.js の otokoTaishoku / watashiNext / gaiaTaishoku)。静的スロットは廃止 */
    "tenshoku-kangoshi": "", /* わたしNEXT → offer-card管理へ移行(assets/offers.js の watashiNext)。静的スロットは廃止 */
    "money":             "", /* 未承認(退職金→FP系の提携待ち) */

    /* ▼ マナー電卓(冠婚葬祭) */
    "sogi":    "", /* 未承認(家族葬のこれから・よりそう=A8審査中) */
    "wedding": "", /* 未承認(ご祝儀→ブライダル系の提携待ち) */
    "hakajimai": `<a href="//af.moshimo.com/af/c/click?a_id=5700585&p_id=4822&pc_id=12801&pl_id=63736" rel="nofollow sponsored" referrerpolicy="no-referrer-when-downgrade">海洋散骨(小型クルーザー・家族向け)の無料相談はこちら</a><img src="//i.moshimo.com/af/i/impression?a_id=5700585&p_id=4822&pc_id=12801&pl_id=63736" width="1" height="1" style="border:none;" loading="lazy" alt="">`, /* もしも シーセレモニー(海洋散骨) */

    /* ▼ かたづけ電卓(不用品・遺品整理) */
    "ihin":            `<a href="https://px.a8.net/svt/ejp?a8mat=4B82L2+ACPE8Q+39GM+5MFLEA" rel="nofollow sponsored">遺品整理業者の無料一括見積もり【遺品整理110番】</a>`, /* A8 遺品整理110番 */
    "fuyouhin":        `<a href="https://px.a8.net/svt/ejp?a8mat=4B82L2+AINQAI+4X26+NTJWY" rel="nofollow sponsored">不用品回収の無料見積もりを依頼する</a>`, /* A8 不用品回収FireWorks */
    "digital-shukatsu": "", /* デジタクセル承認待ち(無条件の代替表示は廃止・Sprint1) */

    /* ▼ くるま・バイク・トラック電卓 */
    "kaitori":      `<a href="https://px.a8.net/svt/ejp?a8mat=4B82L2+A4YRDM+3O80+5YJRM" rel="nofollow sponsored">愛車が今いくらか無料でチェック(オークション型査定)</a>`, /* A8 ユーカーパック */
    "hoken":        "", /* 未承認(自動車保険→提携待ち) */
    "bike-kaitori": `<a href="https://px.a8.net/svt/ejp?a8mat=4B82L2+AM8BX6+1BFI+61RIA" rel="nofollow sponsored">バイクの無料出張査定を申し込む【バイクワン】</a>`, /* A8 バイクワン */
    "bike-hoken":   "", /* 未承認(バイク保険→提携待ち) */
    "truck-kaitori":`<a href="https://px.a8.net/svt/ejp?a8mat=4B82L2+AJ95WA+4HKO+BWVTE" rel="nofollow sponsored">重機・建機・トラックの無料査定【建機買取屋.コム】</a>`, /* A8 建機買取屋 */

    /* ▼ 金融(つみたて・ローン・FX) */
    "shoken":   "", /* 未承認(証券口座→アクセストレード等で提携予定) */
    "cardloan": "", /* 未承認(楽天銀行スーパーローン等→審査中) */
    "fx-kouza": `<a href="https://px.a8.net/svt/ejp?a8mat=3THCME+DD2ACA+1WP2+69WPU" rel="nofollow sponsored">FX口座を無料で開設する【DMM FX】</a>`, /* A8 DMM FX */

    /* ▼ ペット電卓 */
    "pet-senior": "" /* 未承認(ペット火葬・シニアケア→提携待ち) */
  };

  var LABEL = "スポンサーリンク";

  /* 静的スロットkey → 台帳上のofferId(GA4計測用)。
     offer-card(offers.js)と同じ affiliate_impression / affiliate_click を送るが、
     slot_id を "static-〜" にして区別する。未登録キーは "static:"+key で送る。 */
  var SLOT_OFFER = {
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
