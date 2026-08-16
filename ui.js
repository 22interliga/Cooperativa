/* UI helpers compartilhados — CoopVia */
(function (g) {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let toastT;
  function toast(msg, type = "ok") {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg; el.className = "toast show " + type;
    clearTimeout(toastT);
    toastT = setTimeout(() => (el.className = "toast " + type), 2400);
  }

  // modal simples: title + html body + array de botões
  function modal(title, bodyHtml, buttons, opts = {}) {
    closeModal();
    const bg = document.createElement("div");
    bg.className = "modal-bg show"; bg.id = "__modal";
    const btns = (buttons || [{ label: "Fechar", close: true }])
      .map((b, i) => `<button class="btn ${b.cls || ""}" data-i="${i}">${esc(b.label)}</button>`).join("");
    bg.innerHTML =
      `<div class="modal ${opts.wide ? "wide" : ""}">
        <div class="hd"><h3>${esc(title)}</h3><button class="x" data-close>&times;</button></div>
        <div class="bd">${bodyHtml}</div>
        ${buttons === null ? "" : `<div class="ft">${btns}</div>`}
      </div>`;
    document.body.appendChild(bg);
    bg.addEventListener("click", (e) => {
      if (e.target === bg || e.target.hasAttribute("data-close")) return closeModal();
      const i = e.target.getAttribute("data-i");
      if (i != null) {
        const b = buttons[+i];
        if (b.onClick) { const keep = b.onClick(bg); if (keep !== false && b.close !== false) closeModal(); }
        else if (b.close !== false) closeModal();
      }
    });
    return bg;
  }
  function closeModal() { const m = $("#__modal"); if (m) m.remove(); }

  // confirma ação
  function confirm(msg, onYes, yesLabel = "Confirmar", cls = "danger") {
    modal("Confirmar", `<p style="margin:0">${esc(msg)}</p>`, [
      { label: "Cancelar" },
      { label: yesLabel, cls, onClick: () => onYes() },
    ]);
  }

  // menu mobile
  function bindMenu() {
    const mb = $("#menuBtn"), side = $("#side");
    if (mb && side) {
      mb.onclick = () => side.classList.toggle("open");
      document.addEventListener("click", (e) => {
        if (window.innerWidth <= 900 && side.classList.contains("open") &&
          !side.contains(e.target) && e.target !== mb) side.classList.remove("open");
      });
    }
  }

  g.UI = { $, $$, esc, toast, modal, closeModal, confirm, bindMenu };
})(window);
