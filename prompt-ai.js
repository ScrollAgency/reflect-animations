/* ==========================================================================
           PROMPT-AI — JS
           ========================================================================== */

        /* 1. Namespaces */
        window.AIResponseKit = window.AIResponseKit || {};
        window.AIResponseKit.core = window.AIResponseKit.core || {};
        window.AIResponseKit.renderers = window.AIResponseKit.renderers || {};
        window.AIResponseKit.timelines = window.AIResponseKit.timelines || {};

        window.AIResponseKit.mountModules = function (container, items) {
            if (!container) return;
            container.innerHTML = window.AIResponseKit.core.renderResponse(items || []);
        };
        window.AIResponseKit.createModulesTimeline = function (container, options) {
            return window.AIResponseKit.core.createResponseTimeline(container, options);
        };
        window.AIResponseKit.resetModules = function (container) {
            window.AIResponseKit.core.resetResponse(container);
        };
        window.AIResponseKit.mountResponse = window.AIResponseKit.mountModules;
        window.AIResponseKit.createResponseTimeline = window.AIResponseKit.createModulesTimeline;
        window.AIResponseKit.resetResponse = window.AIResponseKit.resetModules;

        /* 2. Core helpers */
        window.AIResponseKit.core.buildModuleClassList = function (item, baseClass) {
            var classes = [];
            if (typeof baseClass === "string" && baseClass.trim()) classes.push(baseClass.trim());
            function pushCandidate(candidate) {
                if (candidate === null || candidate === undefined) return;
                if (Array.isArray(candidate)) { candidate.forEach(pushCandidate); return; }
                var value = String(candidate).trim();
                if (value) classes.push(value);
            }
            if (item) { pushCandidate(item.moduleClass); pushCandidate(item.moduleClasses); }
            return classes.join(" ");
        };

        window.AIResponseKit.core.renderModule = function (item) {
            if (!item || !item.type) return "";
            var renderer = window.AIResponseKit.renderers[item.type];
            if (!renderer) return `<div class="ai-module ai-module--unknown">Type inconnu : ${item.type}</div>`;
            return renderer(item);
        };

        window.AIResponseKit.core.renderResponse = function (items) {
            if (!items || !items.length) return "";
            return items.map(function (item) { return window.AIResponseKit.core.renderModule(item); }).join("");
        };

        window.AIResponseKit.core.resetResponse = function (container) {
            var modules = gsap.utils.toArray(container.querySelectorAll(".ai-module"));
            if (modules.length) gsap.set(modules, { opacity: 0, y: 20 });
            modules.forEach(function (moduleEl) {
                var inner = gsap.utils.toArray(moduleEl.querySelectorAll(
                    ".ai-module__title, .ai-module__text, .ai-module__label, .ai-module__value, .ai-graph__bar, thead th, tbody tr, tbody td, .ai-employee__header, .ai-employee__row, .ai-salary-sim__col, .ai-salary-sim__arrow, .ai-salary-sim__delta-badge, .ai-performance-badge, .ai-btn"
                ));
                if (inner.length) gsap.set(inner, { opacity: 0 });
            });
            var hBars = gsap.utils.toArray(container.querySelectorAll(".ai-hbar-chart__fill"));
            if (hBars.length) gsap.set(hBars, { scaleX: 0, transformOrigin: "left center" });
        };

        window.AIResponseKit.core.createModuleTimeline = function (el) {
            if (!el) return gsap.timeline();
            var type = el.getAttribute("data-module-type");
            var factory = window.AIResponseKit.timelines[type];
            if (!factory) return gsap.timeline();
            return factory(el);
        };

        window.AIResponseKit.core.createResponseTimeline = function (container, options) {
            options = options || {};
            var moduleDelay = options.moduleDelay != null ? options.moduleDelay : 0.2;
            var modules = Array.from(container.querySelectorAll(".ai-module"));
            var tl = gsap.timeline();
            modules.forEach(function (moduleEl) {
                tl.add(window.AIResponseKit.core.createModuleTimeline(moduleEl));
                tl.to({}, { duration: moduleDelay });
            });
            return tl;
        };

        /* 3. Module : text */
        window.AIResponseKit.renderers.text = function (item) {
            var content = item.content || {};
            var moduleClass = window.AIResponseKit.core.buildModuleClassList(item, "ai-module ai-module--text");
            var icon = item.icon || "";
            var iconHtml = icon ? `<span class="ai-module__icon ${icon}" aria-hidden="true"></span>` : "";
            return `
        <div class="${moduleClass}" data-module-type="text">
            ${content.title ? `<div class="ai-module__title">${content.title}</div>` : ""}
            <div class="ai-module__text-body">${iconHtml}<div class="ai-module__text">${content.text || ""}</div></div>
        </div>`;
        };
        window.AIResponseKit.timelines.text = function (el) {
            var title = el.querySelector(".ai-module__title");
            var text = el.querySelector(".ai-module__text");
            var tl = gsap.timeline();
            tl.fromTo(el, { opacity: 0, y: 20, height: 0 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", height: "auto" });
            if (title) tl.fromTo(title, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, "-=0.2");
            if (text) tl.fromTo(text, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, "-=0.1");
            return tl;
        };

        /* 4. Module : horizontal-barchart */
        window.AIResponseKit.renderers["horizontal-barchart"] = function (item) {
            var content = item.content || {};
            var moduleClass = window.AIResponseKit.core.buildModuleClassList(item, "ai-module ai-module--horizontal-barchart");
            var bars = Array.isArray(content.bars) ? content.bars.slice() : [];
            bars.sort(function (a, b) { return (b.value || 0) - (a.value || 0); });
            function esc(str) { return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
            return `
        <div class="${moduleClass}" data-module-type="horizontal-barchart">
            ${content.title ? `<div class="ai-module__title">${esc(content.title)}</div>` : ""}
            <div class="ai-hbar-chart">
                ${bars.map(function (bar) {
                var v = Number(bar.value || 0);
                return `<div class="ai-hbar-chart__row">
                        <div class="ai-hbar-chart__meta">
                            <div class="ai-hbar-chart__label">${esc(bar.label || "")}</div>
                            <div class="ai-hbar-chart__value">${v}%</div>
                        </div>
                        <div class="ai-hbar-chart__track">
                            <div class="ai-hbar-chart__fill" style="width:${v}%;"></div>
                        </div>
                    </div>`;
            }).join("")}
            </div>
        </div>`;
        };
        window.AIResponseKit.timelines["horizontal-barchart"] = function (el) {
            var title = el.querySelector(".ai-module__title");
            var metas = gsap.utils.toArray(el.querySelectorAll(".ai-hbar-chart__meta"));
            var fills = gsap.utils.toArray(el.querySelectorAll(".ai-hbar-chart__fill"));
            var tl = gsap.timeline();
            tl.fromTo(el, { opacity: 0, y: 20, height: 0 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", height: "auto" });
            if (title) tl.fromTo(title, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, "-=0.2");
            if (metas.length) tl.fromTo(metas, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.06, ease: "power2.out" }, "-=0.1");
            if (fills.length) tl.fromTo(fills, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.55, stagger: 0.12, ease: "power2.out" }, "-=0.05");
            return tl;
        };

        /* 5. Module : source-tags */
        window.AIResponseKit.renderers["source-tags"] = function (item) {
            var content = item.content || {};
            var moduleClass = window.AIResponseKit.core.buildModuleClassList(item, "ai-module ai-module--source-tags");
            var html = (content.items || []).map(function (tag) {
                return `<div class="ai-source-tag"><span class="ai-source-tag__icon ${tag.icon || ""}"></span><span class="ai-source-tag__label">${tag.label || ""}</span></div>`;
            }).join("");
            return `<div class="${moduleClass}" data-module-type="source-tags"><div class="ai-source-tags">${html}</div></div>`;
        };
        window.AIResponseKit.timelines["source-tags"] = function (el) {
            var tags = gsap.utils.toArray(el.querySelectorAll(".ai-source-tag"));
            var tl = gsap.timeline();
            tl.fromTo(el, { opacity: 0, y: 8, height: 0 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out", height: "auto" });
            if (tags.length) tl.fromTo(tags, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.22, stagger: 0.12, ease: "power2.out" }, "-=0.1");
            return tl;
        };

        /* 6. Module : employee-card */
        window.AIResponseKit.renderers["employee-card"] = function (item) {
            var c = item.content || {};
            var moduleClass = window.AIResponseKit.core.buildModuleClassList(item, "ai-module ai-module--employee");
            var avatarImage = c.avatarSrc ? `<img src="${c.avatarSrc}" alt="${c.name || ""} avatar">` : "";
            return `
        <div class="${moduleClass}" data-module-type="employee-card">
            <div class="ai-employee">
                <div class="ai-employee__header">
                    <div class="ai-employee__avatar">${avatarImage}</div>
                    <div class="ai-employee__identity">
                        <div class="ai-employee__name">${c.name || ""}</div>
                        <div class="ai-employee__role">${c.role || ""}</div>
                    </div>
                </div>
                <div class="ai-employee__meta">
                    <div class="ai-employee__row"><span class="ai-employee__label">Department</span><span class="ai-employee__value">${c.team || ""}</span></div>
                    <div class="ai-employee__row"><span class="ai-employee__label">Start date</span><span class="ai-employee__value">${c.startDate || ""}</span></div>
                    <div class="ai-employee__row"><span class="ai-employee__label">Salary</span><span class="ai-employee__value">${c.salary || ""}</span></div>
                    <div class="ai-employee__row"><span class="ai-employee__label">Last annual review</span><span class="ai-employee__value">${c.lastAnnualReview || ""}</span></div>
                </div>
            </div>
        </div>`;
        };
        window.AIResponseKit.timelines["employee-card"] = function (el) {
            var header = el.querySelector(".ai-employee__header");
            var rows = gsap.utils.toArray(el.querySelectorAll(".ai-employee__row"));
            var tl = gsap.timeline();
            tl.fromTo(el, { opacity: 0, y: 20, scale: 0.98, height: 0 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out", height: "auto" });
            if (header) tl.fromTo(header, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, "-=0.25");
            if (rows.length) tl.fromTo(rows, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.08 }, "-=0.2");
            return tl;
        };

        /* 7. Module : salary-evolution */
        window.AIResponseKit.renderers["salary-evolution"] = function (item) {
            var content = item.content || {};
            var points = Array.isArray(content.points) ? content.points.slice() : [];
            if (!points.length) return "";
            var moduleClass = window.AIResponseKit.core.buildModuleClassList(item, "ai-module ai-module--salary-evolution");
            var title = content.title || "Salary evolution";
            function esc(v) { return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
            function parseMonetary(value) {
                if (!value) return null;
                var n = String(value).replace(/[^0-9.,-]/g, "");
                if (!n) return null;
                var lc = n.lastIndexOf(","), ld = n.lastIndexOf(".");
                var dec = "";
                if (lc !== -1 && ld !== -1) { dec = lc > ld ? "," : "."; }
                else if (lc !== -1 && (n.length - lc - 1) <= 2) { dec = ","; }
                else if (ld !== -1 && (n.length - ld - 1) <= 2) { dec = "."; }
                if (dec === ",") n = n.replace(/\./g, "").replace(",", ".");
                else if (dec === ".") n = n.replace(/,/g, "");
                else n = n.replace(/[.,]/g, "");
                var p = Number(n); return Number.isFinite(p) ? p : null;
            }
            var valuePoints = points.map(function (p) { return parseMonetary(p.value); });
            var maxV = valuePoints.reduce(function (m, v) { return v !== null ? Math.max(m, v) : m; }, 0);
            var minV = valuePoints.reduce(function (m, v) { return v !== null ? Math.min(m, v) : m; }, Infinity);
            if (!Number.isFinite(minV)) minV = null;
            if (!maxV) maxV = null;
            var barsHtml = points.map(function (point, i) {
                var raw = valuePoints[i];
                var h = 0;
                if (raw !== null && minV !== null && maxV !== null && maxV > minV) {
                    h = Math.max(50, Math.min(100, Math.round(50 + ((raw - minV) / (maxV - minV)) * 50)));
                } else if (raw !== null) { h = 100; }
                var isForecast = Boolean(point.forecast);
                var cls = "salary-evo__bar " + (isForecast ? "salary-evo__bar--forecast" : "salary-evo__bar--actual");
                var changeText = String(point.change || "");
                var hasChange = /\d/.test(changeText);
                return `<div class="salary-evo__bar-wrapper">
            <div class="${cls}">
                <div class="salary-evo__bar-fill" data-height="${h}" style="height:${h}%;">
                    <div class="salary-evo__bar-content">
                        ${hasChange ? `<span class="salary-evo__bar-change">${esc(changeText)}</span>` : ""}
                        <span class="salary-evo__bar-value">${esc(point.value)}</span>
                    </div>
                </div>
            </div>
            <div class="salary-evo__bar-date">${esc(point.date)}</div>
        </div>`;
            }).join("");
            return `<div class="${moduleClass}" data-module-type="salary-evolution">
        ${title ? `<div class="ai-module__title">${esc(title)}</div>` : ""}
        <div class="salary-evo"><div class="salary-evo__chart salary-evo__chart--bars">${barsHtml}</div></div>
    </div>`;
        };
        window.AIResponseKit.timelines["salary-evolution"] = function (el) {
            var chart = el.querySelector(".salary-evo__chart");
            var tl = gsap.timeline();
            tl.fromTo(el, { opacity: 0, y: 20, height: 0 }, { opacity: 1, y: 0, height: "auto", duration: 0.45, ease: "power2.out" });
            if (chart) {
                tl.from(chart, { opacity: 0, y: 10, duration: 0.35, ease: "power2.out" }, "-=0.25");
                var barFills = chart.querySelectorAll(".salary-evo__bar-fill");
                if (barFills.length) {
                    gsap.set(barFills, { height: 0, transformOrigin: "center bottom" });
                    tl.to(barFills, { height: function (i, t) { return (t.getAttribute("data-height") || 0) + "%"; }, duration: 0.6, ease: "power2.out", stagger: 0.12 }, "-=0.35");
                }
            }
            return tl;
        };

        /* 8. Module : module-ai */
        window.AIResponseKit.renderers["module-ai"] = function (item) {
            var content = item.content || {};
            var moduleClass = window.AIResponseKit.core.buildModuleClassList(item, "ai-module ai-module--module-ai");
            var button = content.cta || {};
            var buttonLabel = button.label || "Fix in Reflect";
            var buttonVariant = button.variant || "primary";
            function esc(v) { return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
            function escAttr(v) { return String(v || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }
            var rowsHtml = (content.rows || []).map(function (row) {
                var tone = row.tone || "neutral";
                var managerText = esc(row.manager);
                if (tone && row.finalManager) {
                    managerText = `<span class="module-ai__status module-ai__status--${tone}" data-final-manager="${escAttr(row.finalManager)}">${managerText}</span>`;
                }
                var avatarHtml = row.avatar
                    ? `<div class="module-ai__avatar-wrapper"><img class="module-ai__avatar" src="${escAttr(row.avatar)}" alt="${escAttr(row.employee)}"></div>`
                    : `<div class="module-ai__avatar-wrapper module-ai__avatar-wrapper--empty"></div>`;
                return `<div class="module-ai__row module-ai__row--${tone}">
            <div class="module-ai__cell module-ai__cell--avatar">${avatarHtml}</div>
            <div class="module-ai__cell module-ai__cell--employee"><span class="module-ai__employee-name">${esc(row.employee)}</span></div>
            <div class="module-ai__cell module-ai__cell--department"><span class="module-ai__department">${esc(row.department)}</span></div>
            <div class="module-ai__cell module-ai__cell--manager">${managerText}</div>
        </div>`;
            }).join("");
            return `<div class="${moduleClass}" data-module-type="module-ai">
        <div class="module-ai__accordion">
            <div class="module-ai__header">
                <div class="module-ai__summary">
                    <span class="module-ai__summary-text">${content.summary || "View affected"}</span>
                    <div class="module-ai__meta"><span class="module-ai__meta-main">${content.meta || ""}</span></div>
                </div>
                <span class="module-ai__toggle-button" aria-hidden="true">
                    <span class="module-ai__toggle-icon icon-chevron_down"></span>
                </span>
            </div>
            <div class="module-ai__content" aria-hidden="true">
                <div class="module-ai__table-body">${rowsHtml}</div>
                <div class="module-ai__actions">
                    <button class="ai-btn ai-btn--${buttonVariant}" type="button">
                        <span class="ai-btn__text">${buttonLabel}</span>
                        <span class="ai-btn__icon icon-arrow_forward" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
        };
        window.AIResponseKit.timelines["module-ai"] = function (el) {
            var header = el.querySelector(".module-ai__header");
            var meta = el.querySelector(".module-ai__meta");
            var content = el.querySelector(".module-ai__content");
            var rows = gsap.utils.toArray(el.querySelectorAll(".module-ai__row"));
            var button = el.querySelector(".module-ai__actions button");
            var buttonText = button ? button.querySelector(".ai-btn__text") : null;
            var buttonIcon = button ? button.querySelector(".ai-btn__icon") : null;
            var toggleIcon = el.querySelector(".module-ai__toggle-icon");
            var toggleButton = el.querySelector(".module-ai__toggle-button");
            var tl = gsap.timeline();
            tl.fromTo(el, { opacity: 0, y: 24, height: 0 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", height: "auto" });
            if (header) tl.fromTo(header, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, "-=0.3");
            if (meta) tl.fromTo(meta, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, "-=0.15");
            tl.to({}, { duration: 0.8 });
            if (content) {
                if (toggleButton) {
                    tl.to(toggleButton, { scale: 0.88, backgroundColor: "rgba(255,255,255,0.2)", duration: 0.18, ease: "power2.out" });
                    tl.to(toggleButton, { scale: 1, backgroundColor: "rgba(255,255,255,0.08)", duration: 0.24, ease: "power2.in" }, "+=0.02");
                }
                if (toggleIcon) tl.to(toggleIcon, { rotation: 180, transformOrigin: "center center", duration: 0.35, ease: "power2.out" }, "<");
                tl.fromTo(content, { opacity: 0, maxHeight: 0 }, { opacity: 1, maxHeight: 400, duration: 0.45, ease: "power2.out" });
                var tableCells = gsap.utils.toArray(el.querySelectorAll(".module-ai__cell"));
                tl.fromTo(rows, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out", stagger: 0.12 }, "-=0.15");
                tl.fromTo(tableCells, { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.05 }, "<");
                if (button) {
                    tl.fromTo(button, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, "+=0.1");
                    tl.to({}, { duration: 0.4 });
                    tl.to(button, { scale: 0.92, duration: 0.12, ease: "power2.out" });
                    tl.to(button, { scale: 1, duration: 0.18, ease: "power2.in" }, "+=0.02");
                    tl.call(function () {
                        if (buttonText) buttonText.textContent = "Syncing...";
                        if (buttonIcon) { buttonIcon.classList.add("module-ai__icon-spinning", "icon-autorenew"); buttonIcon.classList.remove("icon-arrow_forward", "icon-checked"); }
                        button.classList.add("module-ai__btn-syncing");
                    }, null, "+=0.1");
                    var statuses = gsap.utils.toArray(el.querySelectorAll(".module-ai__status"));
                    var statusTl = gsap.timeline();
                    statuses.forEach(function (status) {
                        statusTl.to({}, { duration: 0.12 + Math.random() * 0.18 });
                        statusTl.call(function () {
                            var fm = (status.dataset && status.dataset.finalManager) ? status.dataset.finalManager : "Assigned";
                            status.textContent = fm;
                            status.classList.remove("module-ai__status--warning");
                            status.classList.add("module-ai__status--success");
                        });
                    });
                    statusTl.call(function () {
                        if (buttonText) buttonText.textContent = "Synced";
                        if (buttonIcon) { buttonIcon.classList.remove("module-ai__icon-spinning", "icon-arrow_forward", "icon-autorenew"); buttonIcon.classList.add("icon-checked"); }
                        if (button) { button.disabled = true; button.classList.add("module-ai__btn-disabled"); button.classList.remove("module-ai__btn-syncing"); }
                    });
                    tl.add(statusTl, "+=0.1");
                    tl.to({}, { duration: 0.5 });
                }
                tl.call(function () { gsap.set(content, { maxHeight: "none" }); });
            }
            return tl;
        };

        /* 9. Module : table */
        window.AIResponseKit.renderers.table = function (item) {
            var c = item.content || {};
            var moduleClass = window.AIResponseKit.core.buildModuleClassList(item, "ai-module ai-module--table");
            var headers = c.headers || [], rows = c.rows || [], actions = c.actions || [];
            var thead = headers.length ? `<thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>` : "";
            var tbody = rows.length ? `<tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>` : "";
            var actionsHtml = actions.length ? `<div class="ai-table__actions">${actions.map(function (a) {
                var icon = a.icon ? `<span class="ai-btn__icon ${a.icon}"></span>` : "";
                return `<button class="ai-btn ai-btn--${a.variant || "ghost"}">${icon}<span>${a.label}</span></button>`;
            }).join("")}</div>` : "";
            return `<div class="${moduleClass}" data-module-type="table">
        ${c.title ? `<div class="ai-module__title">${c.title}</div>` : ""}
        <div class="ai-table-wrap"><table class="ai-table">${thead}${tbody}</table></div>
        ${actionsHtml}
    </div>`;
        };
        window.AIResponseKit.timelines.table = function (el) {
            var title = el.querySelector(".ai-module__title");
            var headCells = gsap.utils.toArray(el.querySelectorAll("thead th"));
            var bodyRows = gsap.utils.toArray(el.querySelectorAll("tbody tr"));
            var actions = gsap.utils.toArray(el.querySelectorAll(".ai-btn"));
            var tl = gsap.timeline();
            tl.fromTo(el, { opacity: 0, y: 20, height: 0 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", height: "auto" });
            if (title) tl.fromTo(title, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, "-=0.2");
            if (headCells.length) tl.fromTo(headCells, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.04 }, "-=0.1");
            bodyRows.forEach(function (row) {
                var cells = gsap.utils.toArray(row.querySelectorAll("td"));
                tl.fromTo(row, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2 }, "-=0.05");
                tl.fromTo(cells, { opacity: 0 }, { opacity: 1, duration: 0.16, stagger: 0.03 }, "<");
            });
            if (actions.length) tl.fromTo(actions, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.08 }, "+=0.1");
            return tl;
        };

        /* 10. AIOrchestrator */
        window.AIOrchestrator = function (options) {
            options = options || {};
            var root = document.querySelector(options.root);
            var scenarios = options.scenarios || [];
            if (!root) { console.warn("AIOrchestrator: root introuvable", options.root); return null; }
            var promptContainer = root.querySelector(".ai-kit__prompt");
            var promptEl = root.querySelector(".ai-kit__prompt-text");
            var preResponseEl = root.querySelector(".ai-kit__pre-response");
            var responseEl = root.querySelector(".ai-kit__response-body");
            var sendButton = root.querySelector(".ai-kit__send-button");
            var currentPromptVariation = "";
            function applyPromptVariation(variation) {
                if (!promptContainer) return;
                var next = typeof variation === "string" ? variation.trim() : "";
                if (currentPromptVariation) { promptContainer.classList.remove("ai-kit__prompt--" + currentPromptVariation); currentPromptVariation = ""; }
                if (next) { promptContainer.classList.add("ai-kit__prompt--" + next); currentPromptVariation = next; }
            }
            var config = {
                promptSpeed: options.promptSpeed != null ? options.promptSpeed : 0.03,
                promptDelay: options.promptDelay != null ? options.promptDelay : 1,
                thinkingDelay: options.thinkingDelay != null ? options.thinkingDelay : 0.6,
                moduleDelay: options.moduleDelay != null ? options.moduleDelay : 10,
                preResponseModuleDelay: options.preResponseModuleDelay != null ? options.preResponseModuleDelay : 0.08,
                scenarioPause: options.scenarioPause != null ? options.scenarioPause : 2,
                loopDelay: options.loopDelay != null ? options.loopDelay : 1
            };
            var currentIndex = 0, isPlaying = false, currentTimeline = null, delayedCall = null;
            function resetStage() {
                if (!promptEl || !responseEl) return;
                promptEl.textContent = "";
                gsap.set(promptEl, { opacity: 1 });
                applyPromptVariation(null);
                if (preResponseEl) { preResponseEl.innerHTML = ""; gsap.set(preResponseEl, { opacity: 1, y: 0 }); }
                responseEl.innerHTML = "";
                gsap.set(responseEl, { opacity: 1, y: 0 });
                if (sendButton) sendButton.classList.remove("is-bouncing");
            }
            function clearAsync() {
                if (currentTimeline) { currentTimeline.kill(); currentTimeline = null; }
                if (delayedCall) { delayedCall.kill(); delayedCall = null; }
            }
            function playScenario(index) {
                if (!isPlaying || !scenarios.length) return;
                var scenario = scenarios[index];
                if (!scenario) return;
                resetStage();
                applyPromptVariation(scenario.promptVariation);
                if (scenario.preResponse && scenario.preResponse.length && preResponseEl) {
                    window.AIResponseKit.mountModules(preResponseEl, scenario.preResponse);
                    window.AIResponseKit.resetModules(preResponseEl);
                }
                window.AIResponseKit.mountResponse(responseEl, scenario.response || []);
                window.AIResponseKit.resetResponse(responseEl);
                currentTimeline = gsap.timeline({
                    onComplete: function () {
                        if (!isPlaying) return;
                        currentIndex = (currentIndex + 1) % scenarios.length;
                        delayedCall = gsap.delayedCall(config.loopDelay, function () { playScenario(currentIndex); });
                    }
                });
                if (config.promptDelay) currentTimeline.to({}, { duration: config.promptDelay });
                var state = { length: 0 };
                currentTimeline.add(gsap.to(state, {
                    length: (scenario.prompt || "").length,
                    duration: Math.max((scenario.prompt || "").length * config.promptSpeed, 0.6),
                    ease: "none",
                    onUpdate: function () { promptEl.textContent = (scenario.prompt || "").slice(0, Math.floor(state.length)); }
                }));
                currentTimeline.call(function () { if (sendButton) sendButton.classList.add("is-bouncing"); });
                if (scenario.preResponse && scenario.preResponse.length && preResponseEl) {
                    currentTimeline.to({}, { duration: 0.15 });
                    currentTimeline.add(window.AIResponseKit.createModulesTimeline(preResponseEl, { moduleDelay: config.preResponseModuleDelay }));
                    currentTimeline.to({}, { duration: config.thinkingDelay });
                    currentTimeline.to(preResponseEl, { opacity: 0, y: -6, duration: 0.2, ease: "power2.in" });
                } else {
                    currentTimeline.to({}, { duration: config.thinkingDelay });
                }
                currentTimeline.add(window.AIResponseKit.createResponseTimeline(responseEl, { moduleDelay: config.moduleDelay }));
                currentTimeline.call(function () { if (sendButton) sendButton.classList.remove("is-bouncing"); });
                currentTimeline.to({}, { duration: config.scenarioPause });
                var responseModules = gsap.utils.toArray(responseEl.querySelectorAll(".ai-module"));
                if (responseModules.length) {
                    currentTimeline.to(responseModules, { opacity: 0, y: -10, duration: 0.22, stagger: { each: 0.08, from: "end" }, ease: "power2.in" });
                } else {
                    currentTimeline.to(responseEl, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" });
                }
                currentTimeline.to(promptEl, { opacity: 0, duration: 0.2, ease: "power2.in" }, "<");
                currentTimeline.call(function () { promptEl.textContent = ""; gsap.set(promptEl, { opacity: 1 }); });
            }
            return {
                init: function () { if (!promptEl || !responseEl) return; resetStage(); },
                play: function () {
                    if (!scenarios.length || isPlaying) return;
                    isPlaying = true;
                    if (currentTimeline && currentTimeline.paused()) {
                        currentTimeline.resume();
                        if (delayedCall) delayedCall.resume();
                    } else {
                        playScenario(currentIndex);
                    }
                },
                pause: function () { isPlaying = false; if (currentTimeline) currentTimeline.pause(); if (delayedCall) delayedCall.pause(); },
                restart: function () { clearAsync(); currentIndex = 0; isPlaying = true; playScenario(currentIndex); },
                destroy: function () { isPlaying = false; clearAsync(); resetStage(); }
            };
        };

        /* 11. Init — scénarios chargés depuis scenarios.json */
        (function () {
            function init(scenarios) {
                var aiDemo = window.AIOrchestrator({
                    root: "#ai-demo",
                    scenarios: scenarios,
                    promptSpeed: 0.028,
                    thinkingDelay: 1.5,
                    moduleDelay: 0.18,
                    preResponseModuleDelay: 0.2,
                    scenarioPause: 3,
                    loopDelay: 0.6
                });
                if (!aiDemo) return;
                aiDemo.init();

                var root = document.querySelector("#ai-demo");
                var inView = false;

                if ("IntersectionObserver" in window && root) {
                    var io = new IntersectionObserver(function (entries) {
                        inView = entries[0].isIntersecting;
                        if (inView && !document.hidden) aiDemo.play();
                        else aiDemo.pause();
                    }, { threshold: 0.15 });
                    io.observe(root);
                } else {
                    inView = true;
                    aiDemo.play();
                }

                document.addEventListener("visibilitychange", function () {
                    if (document.hidden) aiDemo.pause();
                    else if (inView) aiDemo.play();
                });

                window.aiDemo = aiDemo;
            }

            function load() {
                fetch("https://cdn.jsdelivr.net/gh/ScrollAgency/reflect-animations@main/scenarios.json")
                    .then(function (r) { return r.json(); })
                    .then(function (scenarios) { init(scenarios); })
                    .catch(function (err) { console.error("AIOrchestrator: impossible de charger scenarios.json", err); });
            }

            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", load);
            } else {
                load();
            }
        })();
