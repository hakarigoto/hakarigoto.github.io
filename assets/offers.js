/* ===========================================================================
   はかりごと 案件カードシステム(Sprint 2)
   ---------------------------------------------------------------------------
   - 案件を構造化データ(OFFERS)で管理し、ページID×診断結果で出し分ける
   - カードには PR表記・向く人/向かない人・注意点・最終確認日を必ず表示
   - status で一括停止できる(active 以外は表示されない)
   - 計測: hkgTrack() はイベントをローカルキューに積むだけ(外部送信なし)。
     アナリティクス導入を決めた場合は window.hkgSink を定義すれば流れる。
   - 従来の ads.js(静的スロット)は非スプリントページで併存する。
   =========================================================================== */
(function () {
  "use strict";

  /* ---------- 計測レイヤー(差し込み式・デフォルト外部送信なし) ---------- */
  function track(eventName, params) {
    var q = (window.__hkgEvents = window.__hkgEvents || []);
    q.push({ t: Date.now(), event: eventName, params: params });
    if (q.length > 200) q.shift();
    if (typeof window.hkgSink === "function") {
      try { window.hkgSink(eventName, params); } catch (e) { /* noop */ }
    }
  }

  /* ---------- 案件データ ----------
     status(表示制御): active / paused / ended / rejected / replacement
     approvalStatus(ASP審査状態): not-applied / applied / approved / declined / expired / unknown
       → 表示されるのは status==="active" かつ approvalStatus==="approved" のみ。
         承認済みでもサイト都合で止めたい場合は status を paused にする。
     endDate(任意): "YYYY-MM-DD"。過ぎたら自動的に表示停止。
     replacementOfferId(任意): 終了案件の代替。代替は通常カードより弱い表現
       (「関連サービス」表記)で表示され、「この結果に最適」等の断定はしない。
     resultTypes: このresultTypeの診断結果にのみ表示。"*" は結果を問わず表示可。
     文言ルール: 事実確認できる内容のみ。断定・最上級表現は禁止。
       料金・地域・返金条件はASP案件詳細/広告主公式で確認できたものだけ記載し、
       確認できないものは「公式サイトで確認」とする。
     案件台帳(役割・確認日・レビュー予定)は ops側 sprint5/offers-ledger.json で管理。 */
  var OFFERS = {

    ucarpack: {
      offerId: "ucarpack", name: "ユーカーパック", asp: "a8",
      category: "car-sale", status: "active", approvalStatus: "approved",
      destinationUrl: "https://px.a8.net/svt/ejp?a8mat=4B82L2+A4YRDM+3O80+5YJRM",
      headline: "まだ走れる車を、電話ラッシュなしで売却検討したい人向け",
      summary: "オークション形式で複数の買取店の価格を比較できるサービス。窓口が一本化されるため、一括査定にありがちな多数の業者からの電話対応を抑えられます。",
      recommendedFor: ["走行できる車を売りたい", "複数業者との電話のやり取りを減らしたい", "売却価格を比較してから決めたい"],
      notRecommendedFor: ["動かない車・解体前提の車(廃車専門サービスの方が適します)", "今日明日中に現金化したい場合"],
      feeText: "査定申込は無料",
      areaText: "対応地域は公式サイトで確認",
      resultTypes: ["normal-sale"],
      eligiblePages: ["kuruma-haisha", "kuruma-iji-hi"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    },

    bikewan: {
      offerId: "bikewan", name: "バイクワン", asp: "a8",
      category: "bike-sale", status: "active", approvalStatus: "approved",
      destinationUrl: "https://px.a8.net/svt/ejp?a8mat=4B82L2+AM8BX6+1BFI+61RIA",
      headline: "バイクを出張査定で売却したい人向け",
      summary: "全国対応の無料出張買取サービス。自分でバイクを持ち込まずに、自宅での査定・売却を検討できます。",
      recommendedFor: ["走行できるバイクを売りたい", "店舗へ持ち込まずに査定してほしい", "手放す前に価格を知りたい"],
      notRecommendedFor: ["対応車種・エリアの条件は公式サイトでの確認が必要です", "書類(名義)が揃っていない車両"],
      feeText: "出張査定は無料",
      areaText: "対応地域は公式サイトで確認",
      resultTypes: ["normal-sale", "custom-bike"],
      eligiblePages: ["bike-teban", "bike-iji-hi"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    },

    kenkikaitoriya: {
      offerId: "kenkikaitoriya", name: "建機買取屋.コム", asp: "a8",
      category: "truck-sale", status: "active", approvalStatus: "approved",
      destinationUrl: "https://px.a8.net/svt/ejp?a8mat=4B82L2+AJ95WA+4HKO+BWVTE",
      headline: "重機・建機・トラックの売却を検討している人向け",
      summary: "重機・建機の専門買取サービス。遊休機や使わなくなった車両の見積り査定を無料で依頼できます。",
      recommendedFor: ["ユンボ・重機・建機を売りたい", "遊休状態の機械の価値を知りたい", "専門業者に査定してほしい"],
      notRecommendedFor: ["対象車両・対応地域の条件は公式サイトでの確認が必要です"],
      feeText: "見積り査定は無料",
      areaText: "対応地域は公式サイトで確認",
      resultTypes: ["normal-sale"],
      eligiblePages: ["truck-teban", "truck-iji-hi"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    },

    ihin110: {
      offerId: "ihin110", name: "遺品整理110番", asp: "a8",
      category: "estate-cleanup", status: "active", approvalStatus: "approved",
      destinationUrl: "https://px.a8.net/svt/ejp?a8mat=4B82L2+ACPE8Q+39GM+5MFLEA",
      headline: "遺品整理の費用を、業者に見積もってもらいたい人向け",
      summary: "遺品整理業者の紹介サービス。見積依頼は無料で、実際の費用は物量や作業条件をもとに業者が提示します。",
      recommendedFor: ["概算だけでなく実際の見積もりがほしい", "どの業者に頼めばいいか分からない", "遠方の実家の整理を検討している"],
      notRecommendedFor: ["自分で少しずつ片付けられる量の場合(自治体回収の方が安く済みます)"],
      feeText: "見積依頼は無料",
      areaText: "対応地域は公式サイトで確認",
      resultTypes: ["estate-cleanup"],
      eligiblePages: ["katazuke-ihin-hiyo", "katazuke-shobun-shindan"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    },

    fireworks: {
      offerId: "fireworks", name: "不用品回収(FireWorks)", asp: "a8",
      category: "junk-removal", status: "active", approvalStatus: "approved",
      destinationUrl: "https://px.a8.net/svt/ejp?a8mat=4B82L2+AINQAI+4X26+NTJWY",
      headline: "まとまった不用品を一度に処分したい人向け",
      summary: "不用品回収サービス。自治体回収では出せない量や大きさのものを、まとめて引き取ってもらう選択肢です。",
      recommendedFor: ["量が多く自分で運び出せない", "引越し・退去などで期限がある", "分別する時間がない"],
      notRecommendedFor: ["少量なら自治体の粗大ごみ回収の方が安く済みます", "料金・対応地域は見積もりでの確認が必要です"],
      feeText: "見積もり無料(作業料金は内容による)",
      areaText: "対応地域は公式サイトで確認",
      resultTypes: ["junk-removal"],
      eligiblePages: ["katazuke-shobun-shindan", "katazuke-ihin-hiyo"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    },

    seaceremony: {
      offerId: "seaceremony", name: "シーセレモニー", asp: "moshimo",
      category: "sea-burial", status: "active", approvalStatus: "approved",
      destinationUrl: "//af.moshimo.com/af/c/click?a_id=5700585&p_id=4822&pc_id=12801&pl_id=63736",
      impressionHtml: '<img src="//i.moshimo.com/af/i/impression?a_id=5700585&p_id=4822&pc_id=12801&pl_id=63736" width="1" height="1" style="border:none;" loading="lazy" alt="">',
      headline: "改葬先として海洋散骨を検討している人向け",
      summary: "小型クルーザーを貸し切って家族だけで行う海洋散骨サービス。墓じまい後の遺骨の行き先として、お墓を持たない選択肢のひとつです。",
      recommendedFor: ["お墓の維持を次の世代に残したくない", "自然に還る形を希望している", "家族だけで見送りたい"],
      notRecommendedFor: ["手を合わせる場所を残したい場合(納骨堂・樹木葬の方が適します)", "親族の合意がまだ取れていない場合"],
      feeText: "問い合わせ・相談は無料",
      areaText: "出航場所は公式サイトで確認",
      resultTypes: ["sea-burial"],
      eligiblePages: ["manner-hakajimai"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    },

    mikiwaHakajimai: {
      offerId: "mikiwaHakajimai", name: "ミキワ(墓じまい)", asp: "moshimo",
      category: "hakajimai", status: "active", approvalStatus: "approved",
      destinationUrl: "//af.moshimo.com/af/c/click?a_id=5700586&p_id=1672&pc_id=3119&pl_id=90825",
      impressionHtml: '<img src="//i.moshimo.com/af/i/impression?a_id=5700586&p_id=1672&pc_id=3119&pl_id=90825" width="1" height="1" style="border:none;" loading="lazy" alt="">',
      headline: "墓じまいの進め方を資料で確認したい人向け",
      summary: "墓じまい代行サービスの資料請求。撤去工事や手続きの流れを、申し込み前に資料で確認できます。",
      recommendedFor: ["何から始めればいいか分からない", "費用の内訳を詳しく知りたい", "寺院との調整に不安がある"],
      notRecommendedFor: ["すでに石材店・改葬先が決まっている場合"],
      feeText: "資料請求は無料",
      areaText: "対応地域は公式サイトで確認",
      resultTypes: ["perpetual-memorial", "ossuary", "tree-burial", "sea-burial", "undecided"],
      eligiblePages: ["manner-hakajimai"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    },

    gaiaTaishoku: {
      offerId: "gaiaTaishoku", name: "弁護士法人ガイア(退職代行)", asp: "moshimo",
      category: "taishoku-daiko", status: "active", approvalStatus: "approved",
      destinationUrl: "//af.moshimo.com/af/c/click?a_id=5700573&p_id=5546&pc_id=15198&pl_id=71517",
      impressionHtml: '<img src="//i.moshimo.com/af/i/impression?a_id=5700573&p_id=5546&pc_id=15198&pl_id=71517" width="1" height="1" style="border:none;" loading="lazy" alt="">',
      headline: "未払い賃金や有給の交渉・請求まで任せたい人向け(弁護士)",
      summary: "弁護士法人が運営する退職代行。退職意思の伝達に加えて、有給消化や退職日の交渉、未払い賃金・残業代の請求、会社から損害賠償を主張された場合の対応まで依頼できます。",
      recommendedFor: ["未払いの残業代・賃金・退職金を請求したい", "損害賠償を主張されている・ハラスメントなどのトラブルがある", "交渉から法的対応まで一つの窓口に任せたい"],
      notRecommendedFor: ["料金は高め(弁護士は5万円〜が目安。未払い金請求は成功報酬が別途かかるのが一般的)", "退職意思の伝達だけでよい場合は、民間業者・労働組合の方が費用を抑えられます"],
      feeText: "相談は無料",
      areaText: "対応条件は公式サイトで確認",
      resultTypes: ["legal-consultation", "agency-consideration"],
      eligiblePages: ["taishoku-daiko"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    },

    otokoTaishoku: {
      offerId: "otokoTaishoku", name: "男の退職代行", asp: "moshimo",
      category: "taishoku-daiko", status: "active", approvalStatus: "approved",
      destinationUrl: "//af.moshimo.com/af/c/click?a_id=5700575&p_id=2166&pc_id=4520&pl_id=29013",
      impressionHtml: '<img src="//i.moshimo.com/af/i/impression?a_id=5700575&p_id=2166&pc_id=4520&pl_id=29013" width="1" height="1" style="border:none;" loading="lazy" alt="">',
      headline: "男性向けサービスで退職を任せたい人向け",
      summary: "男性の退職に特化した退職代行サービス。会社と直接やり取りせずに、退職の意思を代わりに伝えてもらう選択肢です。",
      recommendedFor: ["自分から退職を言い出せない・会社と直接話したくない", "男性専門のサービスに相談したい"],
      notRecommendedFor: ["未払い金の請求や損害賠償への対応など、法的対応が必要な場合(弁護士の領域です)", "有給消化や退職日の「交渉」を依頼したい場合は、運営元が交渉できる類型(労働組合・弁護士)かを公式サイトで確認してください"],
      feeText: "料金・返金条件は公式サイトで確認",
      areaText: "対応条件は公式サイトで確認",
      resultTypes: ["agency-consideration"],
      eligiblePages: ["taishoku-daiko"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    },

    watashiNext: {
      offerId: "watashiNext", name: "わたしNEXT", asp: "moshimo",
      category: "taishoku-daiko", status: "active", approvalStatus: "approved",
      destinationUrl: "//af.moshimo.com/af/c/click?a_id=5700576&p_id=2000&pc_id=4039&pl_id=27334",
      impressionHtml: '<img src="//i.moshimo.com/af/i/impression?a_id=5700576&p_id=2000&pc_id=4039&pl_id=27334" width="1" height="1" style="border:none;" loading="lazy" alt="">',
      headline: "女性向けサービスで退職を任せたい人向け",
      summary: "女性の退職に特化した退職代行サービス。会社と直接やり取りせずに、退職の意思を代わりに伝えてもらう選択肢です。",
      recommendedFor: ["自分から退職を言い出せない・会社と直接話したくない", "女性向けのサービスに相談したい"],
      notRecommendedFor: ["未払い金の請求や損害賠償への対応など、法的対応が必要な場合(弁護士の領域です)", "有給消化や退職日の「交渉」を依頼したい場合は、運営元が交渉できる類型(労働組合・弁護士)かを公式サイトで確認してください"],
      feeText: "料金・返金条件は公式サイトで確認",
      areaText: "対応条件は公式サイトで確認",
      resultTypes: ["agency-consideration"],
      eligiblePages: ["taishoku-daiko"],
      lastCheckedAt: "2026-07-17", disclosure: "PR"
    }
  };

  /* ---------- カード描画 ---------- */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? (m[1] + "年" + parseInt(m[2], 10) + "月" + parseInt(m[3], 10) + "日") : iso;
  }

  /* 表示可否の一元判定(Sprint 5)
     active かつ approved かつ リンクあり かつ 終了日前、のすべてを満たす場合のみ表示 */
  function isLive(o) {
    if (o.status !== "active") return false;
    if (o.approvalStatus !== "approved") return false;
    if (!o.destinationUrl) return false;
    if (o.endDate && Date.now() > Date.parse(o.endDate + "T23:59:59+09:00")) return false;
    return true;
  }

  function cardHtml(o, slotId, isReplacement) {
    var h = '<aside class="offer-card" data-offer-id="' + esc(o.offerId) + '">';
    h += '<div class="offer-card-label">PR</div>';
    if (isReplacement) h += '<p class="offer-card-h">関連サービスとして確認できます</p>';
    h += '<p class="offer-card-title">' + esc(o.headline) + "</p>";
    h += '<p class="offer-card-summary">' + esc(o.summary) + "</p>";
    h += '<div class="offer-card-fit"><p class="offer-card-h">向いている人</p><ul>';
    for (var i = 0; i < o.recommendedFor.length; i++) h += "<li>" + esc(o.recommendedFor[i]) + "</li>";
    h += "</ul></div>";
    if (o.notRecommendedFor && o.notRecommendedFor.length) {
      h += '<div class="offer-card-warning"><p class="offer-card-h">注意点・向かないケース</p><ul>';
      for (var j = 0; j < o.notRecommendedFor.length; j++) h += "<li>" + esc(o.notRecommendedFor[j]) + "</li>";
      h += "</ul></div>";
    }
    var meta = [];
    if (o.feeText) meta.push(esc(o.feeText));
    if (o.areaText) meta.push(esc(o.areaText));
    if (meta.length) h += '<p class="offer-card-meta">' + meta.join(" / ") + "</p>";
    h += '<a class="cta-btn offer-card-cta" href="' + esc(o.destinationUrl) + '" rel="nofollow sponsored" ' +
         'data-offer-id="' + esc(o.offerId) + '" data-slot-id="' + esc(slotId) + '">' +
         esc(o.ctaText || o.name + "の対象条件を確認する") + "</a>";
    h += '<span class="cta-note">' + esc(o.name) + " / 案件情報確認日: " + esc(fmtDate(o.lastCheckedAt)) + "</span>";
    if (o.impressionHtml) h += o.impressionHtml;
    h += "</aside>";
    return h;
  }

  /* renderOffers({pageId, resultType, slotId, mount})
     mount: 描画先要素 or セレクタ。省略時は .offer-slot[data-slot=slotId] を探す。 */
  function renderOffers(opts) {
    var pageId = opts.pageId, resultType = opts.resultType || null, slotId = opts.slotId || "result-primary";
    var mount = opts.mount;
    if (typeof mount === "string") mount = document.querySelector(mount);
    if (!mount) mount = document.querySelector('.offer-slot[data-slot="' + slotId + '"]');
    if (!mount) return [];

    function matchesContext(o) {
      if (o.eligiblePages.indexOf(pageId) === -1) return false;
      if (o.resultTypes.indexOf("*") === -1) {
        if (!resultType || o.resultTypes.indexOf(resultType) === -1) return false;
      }
      return true;
    }

    var matches = [];      /* {offer, isReplacement} */
    var shownIds = {};
    for (var key in OFFERS) {
      var o = OFFERS[key];
      if (!matchesContext(o)) continue;
      if (isLive(o)) {
        if (!shownIds[o.offerId]) { matches.push({ offer: o, isReplacement: false }); shownIds[o.offerId] = 1; }
      } else if (o.replacementOfferId) {
        /* 終了・停止した案件の代替。代替自体が有効な場合のみ、弱い表現で表示する。
           完全一致案件と同列にしないため、代替はこのページの通常マッチには重複させない。 */
        var r = OFFERS[o.replacementOfferId];
        if (r && isLive(r) && !shownIds[r.offerId]) {
          matches.push({ offer: r, isReplacement: true });
          shownIds[r.offerId] = 1;
        }
      }
    }

    if (!matches.length) { mount.innerHTML = ""; mount.style.display = "none"; return []; }

    var POS = ["primary", "secondary", "third"];
    function cardPos(i) { return POS[i] || "other"; }

    var html = "";
    for (var i = 0; i < matches.length; i++) html += cardHtml(matches[i].offer, slotId, matches[i].isReplacement);
    mount.innerHTML = html;
    mount.style.display = "";

    for (var k = 0; k < matches.length; k++) {
      track("affiliate_impression", {
        offer_id: matches[k].offer.offerId,
        page_id: pageId,
        slot_id: slotId,
        result_type: resultType,
        category: matches[k].offer.category,
        cta_variant: "eligibility-check",
        card_position: cardPos(k),
        offer_count: matches.length
      });
    }
    var links = mount.querySelectorAll("a.offer-card-cta");
    for (var n = 0; n < links.length; n++) {
      (function (a, idx) {
        a.addEventListener("click", function () {
          var oid = a.getAttribute("data-offer-id");
          var od = OFFERS[oid] || {};
          track("affiliate_click", {
            offer_id: oid,
            page_id: pageId,
            slot_id: slotId,
            result_type: resultType,
            category: od.category || "",
            cta_variant: "eligibility-check",
            card_position: cardPos(idx),
            offer_count: links.length
          });
        });
      })(links[n], n);
    }
    var out = [];
    for (var m = 0; m < matches.length; m++) out.push(matches[m].offer);
    return out;
  }

  function diagnosisComplete(pageId, resultType) {
    track("diagnosis_complete", { page_id: pageId, result_type: resultType });
  }

  window.HKG = { render: renderOffers, track: track, diagnosisComplete: diagnosisComplete, OFFERS: OFFERS };
})();
