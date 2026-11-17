/* HGE Universe — 기사 본문 꾸미기, 공유, 카테고리 필터 */
(function () {
  'use strict';

  /* ── 기사 본문: "Q." 문단 → 질문 블록, 이어지는 문단 → 답변 블록 ── */
  var body = document.querySelector('.u-body');
  if (body) {
    var name = body.getAttribute('data-name') || '';
    var YT = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;

    var isQ = function (el) {
      return el && el.tagName === 'P' && /^Q[.\s:．)]\s*/.test(el.textContent.trim());
    };
    var onlyImage = function (el) {
      if (!el || el.tagName !== 'P') return null;
      var imgs = el.querySelectorAll('img');
      if (imgs.length !== 1 || el.textContent.trim() !== '') return null;
      return imgs[0];
    };
    var videoId = function (el) {
      if (!el || el.tagName !== 'P') return null;
      var t = el.textContent.trim();
      if (/\s/.test(t)) return null;
      var a = el.querySelector('a');
      var src = (a && a.getAttribute('href')) || t;
      var m = src.match(YT);
      return m ? m[1] : null;
    };

    /* 사진 → 캡션 달린 figure, 유튜브 주소 → 영상 */
    Array.prototype.slice.call(body.children).forEach(function (el) {
      var img = onlyImage(el);
      if (img) {
        var fig = document.createElement('figure');
        fig.className = 'u-figure';
        img.loading = 'lazy';
        fig.appendChild(img);
        if (img.alt) {
          var cap = document.createElement('figcaption');
          cap.textContent = img.alt;
          fig.appendChild(cap);
        }
        el.replaceWith(fig);
        return;
      }
      var id = videoId(el);
      if (id) {
        var box = document.createElement('div');
        box.className = 'u-video';
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + id;
        f.title = 'YouTube 영상';
        f.loading = 'lazy';
        f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        f.allowFullscreen = true;
        box.appendChild(f);
        el.replaceWith(box);
      }
    });

    /* 질문·답변 묶기 */
    Array.prototype.slice.call(body.children).forEach(function (el) {
      if (!isQ(el)) return;
      var q = document.createElement('div');
      q.className = 'u-q';
      var mark = document.createElement('span');
      mark.className = 'u-q-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = 'Q';
      var text = document.createElement('p');
      text.className = 'u-q-text';
      text.innerHTML = el.innerHTML.replace(/^\s*Q[.\s:．)]\s*/, '');
      var sr = document.createElement('span');
      sr.className = 'u-sr';
      sr.textContent = '질문: ';
      text.insertBefore(sr, text.firstChild);
      q.appendChild(mark);
      q.appendChild(text);

      var answers = [];
      var next = el.nextElementSibling;
      while (next && next.tagName === 'P' && !isQ(next)) {
        answers.push(next);
        next = next.nextElementSibling;
      }
      el.replaceWith(q);
      if (answers.length) {
        var a = document.createElement('div');
        a.className = 'u-a';
        if (name) {
          var who = document.createElement('p');
          who.className = 'u-a-name';
          who.textContent = name;
          a.appendChild(who);
        }
        q.after(a);
        answers.forEach(function (p) { a.appendChild(p); });
      }
    });

    /* 답변 중간에 사진·영상이 끼어 있으면, 그 뒤 문단도 같은 답변으로 이어 붙이기 */
    var isMedia = function (el) {
      return el && (el.tagName === 'FIGURE' || (el.classList && el.classList.contains('u-video')));
    };
    Array.prototype.slice.call(body.children).forEach(function (el) {
      if (el.tagName !== 'P' || isQ(el) || !el.parentNode) return;
      var prev = el.previousElementSibling;
      if (!isMedia(prev)) return;
      while (isMedia(prev)) prev = prev.previousElementSibling;
      if (!prev || !prev.classList.contains('u-a')) return;
      var cont = document.createElement('div');
      cont.className = 'u-a u-a-cont';
      el.before(cont);
      var cur = el;
      while (cur && cur.tagName === 'P' && !isQ(cur)) {
        var nx = cur.nextElementSibling;
        cont.appendChild(cur);
        cur = nx;
      }
    });

    /* 인용구 아래 인터뷰이 이름 */
    if (name) {
      body.querySelectorAll('blockquote').forEach(function (bq) {
        if (bq.querySelector('cite')) return;
        var c = document.createElement('cite');
        c.textContent = '— ' + name;
        bq.appendChild(c);
      });
    }
  }

  /* ── 링크 복사 ── */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-copy');
      var done = function () {
        var old = btn.textContent;
        btn.textContent = '복사했어요';
        setTimeout(function () { btn.textContent = old; }, 1600);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('주소를 복사하세요', url); });
      } else {
        window.prompt('주소를 복사하세요', url);
      }
    });
  });

  /* ── 카테고리 페이지: 포맷 필터 ── */
  var list = document.querySelector('[data-filter-list]');
  if (list) {
    var empty = document.querySelector('[data-filter-empty]');
    var tabs = document.querySelectorAll('.u-tabs [data-filter]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var f = tab.getAttribute('data-filter');
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('on', on);
          t.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var shown = 0;
        list.querySelectorAll('[data-format]').forEach(function (card) {
          var ok = f === 'all' || card.getAttribute('data-format') === f;
          card.hidden = !ok;
          if (ok) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  }
})();
