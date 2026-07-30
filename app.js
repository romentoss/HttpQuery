(function () {
    'use strict';

    const THEME_KEY = 'httpquery-theme';
    const html = document.documentElement;

    /* =========================================================
       THEME
       ========================================================= */
    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) { /* noop */ }
    }

    function toggleTheme() {
        const current = html.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    }

    /* =========================================================
       ACCORDIONS (clicking card-header collapses/expands)
       ========================================================= */
    function initAccordions() {
        const headers = document.querySelectorAll('[data-toggle]');
        headers.forEach(function (header) {
            header.addEventListener('click', function (event) {
                if (event.target.closest('.copy-btn')) return;
                if (event.target.closest('a')) return;
                const card = header.closest('[data-card]');
                if (card) card.classList.toggle('collapsed');
            });
        });
    }

    /* =========================================================
       COPY BUTTONS
       ========================================================= */
    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (e) { ok = false; }
        document.body.removeChild(ta);
        return ok;
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).catch(function () {
                return fallbackCopy(text);
            });
        }
        return Promise.resolve(fallbackCopy(text));
    }

    function flashCopied(btn) {
        const original = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>¡Copiado!</span>`;
        setTimeout(function () {
            btn.classList.remove('copied');
            btn.innerHTML = original;
        }, 1800);
    }

    function initCopyButtons() {
        const buttons = document.querySelectorAll('.copy-btn');
        buttons.forEach(function (btn) {
            btn.addEventListener('click', function (event) {
                event.stopPropagation();
                const block = btn.closest('.code-block');
                if (!block) return;
                const codeEl = block.querySelector('pre code') || block.querySelector('pre');
                if (!codeEl) return;
                const text = codeEl.innerText;
                Promise.resolve(copyToClipboard(text)).then(function () {
                    flashCopied(btn);
                });
            });
        });
    }

    /* =========================================================
       REVEAL CARDS ON SCROLL
       ========================================================= */
    function initReveal() {
        const cards = document.querySelectorAll('.card');
        if (!('IntersectionObserver' in window)) {
            cards.forEach(function (c) { c.classList.add('in-view'); });
            return;
        }

        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        cards.forEach(function (card, idx) {
            card.style.transitionDelay = (idx * 60) + 'ms';
            observer.observe(card);
        });
    }

    /* =========================================================
       PRUÉBALO — fetch con método QUERY real
       ========================================================= */
    function buildQuery() {
        const form = document.getElementById('queryForm');
        if (!form) return null;
        const fd = new FormData(form);
        const query = {};
        const role = fd.get('role');
        const sort = fd.get('sort');
        const page = fd.get('page');
        const active = fd.get('active');
        if (role) query.role = role;
        if (sort) query.sort = sort;
        if (page) query.page = parseInt(page, 10) || 1;
        if (active === 'on') query.active = true;
        return query;
    }

    function renderRequestPreview(query) {
        const el = document.getElementById('queryRequest');
        if (!el) return;
        const body = JSON.stringify(query, null, 2);
        el.classList.remove('tok-dim');
        el.textContent =
            'QUERY /api/users HTTP/1.1\n' +
            'Host: localhost:8080\n' +
            'Content-Type: application/json\n' +
            'Accept-Query: application/json\n' +
            '\n' +
            body;
    }

    async function sendQuery(query) {
        const responseEl = document.getElementById('queryResponse');
        if (!responseEl) return;

        responseEl.classList.remove('tok-dim');
        responseEl.textContent = 'Esperando respuesta...';

        try {
            const res = await fetch('/api/users', {
                method: 'QUERY',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Query': 'application/json',
                },
                body: JSON.stringify(query),
            });

            const text = await res.text();
            let pretty = text;
            try {
                pretty = JSON.stringify(JSON.parse(text), null, 2);
            } catch (_) { /* noop */ }

            responseEl.textContent =
                'HTTP/1.1 ' + res.status + ' ' + res.statusText + '\n' +
                'Content-Type: ' + (res.headers.get('content-type') || '') + '\n' +
                '\n' +
                pretty;
        } catch (err) {
            responseEl.textContent =
                '✗ Error de red\n\n' +
                'No se pudo conectar con el servidor.\n' +
                'Asegúrate de haber ejecutado: node server.js\n\n' +
                'Detalle: ' + err.message;
        }
    }

    function initTryIt() {
        const form = document.getElementById('queryForm');
        if (!form) return;

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            const query = buildQuery();
            if (!query) return;

            const btn = form.querySelector('button[type="submit"]');
            const original = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Enviando...';

            renderRequestPreview(query);
            await sendQuery(query);

            btn.disabled = false;
            btn.textContent = original;
        });

        // Preview en vivo al cambiar campos
        form.addEventListener('input', function () {
            const query = buildQuery();
            if (query) renderRequestPreview(query);
        });
        form.addEventListener('change', function () {
            const query = buildQuery();
            if (query) renderRequestPreview(query);
        });
    }

    /* =========================================================
       INIT
       ========================================================= */
    document.addEventListener('DOMContentLoaded', function () {
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.addEventListener('click', toggleTheme);

        initAccordions();
        initCopyButtons();
        initReveal();
        initTryIt();
    });
})();