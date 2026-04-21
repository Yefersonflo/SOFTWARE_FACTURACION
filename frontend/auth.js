const API_BASE = "http://127.0.0.1:8000/api/v1";
const THEME_KEY = "theme_mode";

function getToken() {
    return localStorage.getItem("token");
}

function getRole() {
    return localStorage.getItem("role");
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

function authHeaders(extraHeaders = {}) {
    const token = getToken();
    return {
        ...extraHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: authHeaders(options.headers || {}),
    });

    if (response.status === 401) {
        logout();
        throw new Error("Sesion expirada");
    }

    return response;
}

async function downloadFile(path, filename) {
    const response = await apiFetch(path);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "No fue posible descargar el archivo.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function enforceAuth(requiredRole = null) {
    const token = getToken();
    const role = getRole();

    if (!token || !role) {
        logout();
        return null;
    }

    if (requiredRole && role !== requiredRole) {
        window.location.href = "dashboard.html";
        return null;
    }

    return {
        token,
        role,
        username: localStorage.getItem("username") || "",
    };
}

function ensureIconsCss() {
    const href = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css";
    if ([...document.querySelectorAll("link")].some((link) => link.href === href)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

function ensureShellStyles() {
    if (document.getElementById("app-shell-styles")) return;

    const style = document.createElement("style");
    style.id = "app-shell-styles";
    style.textContent = `
        :root {
            --app-bg: #f4f6f8;
            --app-surface: #ffffff;
            --app-surface-alt: #f8f9fa;
            --app-border: #dfe3e8;
            --app-text: #14213d;
            --app-muted: #6c757d;
            --app-sidebar: #1f2937;
            --app-sidebar-text: #d1d5db;
            --app-sidebar-active: #334155;
            --app-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
        }

        body[data-theme="dark"] {
            --app-bg: #0f172a;
            --app-surface: #111827;
            --app-surface-alt: #1f2937;
            --app-border: #334155;
            --app-text: #e5e7eb;
            --app-muted: #94a3b8;
            --app-sidebar: #020617;
            --app-sidebar-text: #cbd5e1;
            --app-sidebar-active: #1e293b;
            --app-shadow: 0 16px 40px rgba(2, 6, 23, 0.4);
        }

        body.app-shell-body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            background: var(--app-bg);
            color: var(--app-text);
        }

        .app-sidebar {
            width: 272px;
            background: var(--app-sidebar);
            color: white;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            padding: 22px 16px;
            gap: 12px;
            box-shadow: var(--app-shadow);
        }

        .app-brand {
            padding: 10px 12px 18px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .app-brand h4 {
            margin: 0 0 8px;
        }

        .app-role-badge {
            font-size: 0.75rem;
            letter-spacing: 0.04em;
        }

        .app-nav {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .app-nav a {
            color: var(--app-sidebar-text);
            text-decoration: none;
            padding: 12px 14px;
            border-radius: 12px;
            display: block;
            transition: background-color 0.2s ease, color 0.2s ease;
        }

        .app-nav a:hover,
        .app-nav a.active {
            background: var(--app-sidebar-active);
            color: white;
        }

        .app-shell-main {
            flex: 1;
            min-width: 0;
            padding: 24px;
        }

        .app-topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
        }

        .app-topbar p {
            margin: 0;
            color: var(--app-muted);
        }

        .app-topbar-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .theme-toggle {
            border: 1px solid var(--app-border);
            background: var(--app-surface);
            color: var(--app-text);
            border-radius: 999px;
            padding: 10px 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .theme-toggle:hover {
            background: var(--app-surface-alt);
        }

        .app-user-chip {
            border: 1px solid var(--app-border);
            background: var(--app-surface);
            border-radius: 999px;
            padding: 10px 14px;
            color: var(--app-muted);
        }

        .app-page {
            max-width: 1280px;
        }

        .app-card,
        .card {
            background: var(--app-surface);
            color: var(--app-text);
            border: 1px solid var(--app-border) !important;
            box-shadow: var(--app-shadow) !important;
        }

        .table,
        .table td,
        .table th,
        .form-control,
        .form-select,
        textarea,
        .input-group-text,
        .list-group-item {
            background-color: var(--app-surface) !important;
            color: var(--app-text) !important;
            border-color: var(--app-border) !important;
        }

        .text-muted,
        .form-label,
        small,
        .table-secondary {
            color: var(--app-muted) !important;
        }

        .table-dark {
            --bs-table-bg: var(--app-sidebar);
            --bs-table-color: white;
            --bs-table-border-color: var(--app-sidebar);
        }

        body[data-theme="dark"] .btn-outline-secondary,
        body[data-theme="dark"] .btn-outline-dark {
            color: #e5e7eb;
            border-color: #64748b;
        }

        body[data-theme="dark"] .btn-secondary {
            background: #475569;
            border-color: #475569;
        }

        body[data-theme="dark"] .event-pill {
            background: #1d4ed8;
            color: white;
        }

        body[data-theme="dark"] .event-pill small {
            color: #dbeafe;
        }

        @media (max-width: 991px) {
            body.app-shell-body {
                flex-direction: column;
            }

            .app-sidebar {
                width: 100%;
                border-radius: 0 0 24px 24px;
            }

            .app-shell-main {
                padding: 18px;
            }

            .app-topbar {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    `;
    document.head.appendChild(style);
}

function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || "light";
}

function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    const themeLabel = document.getElementById("theme-label");
    const themeIcon = document.getElementById("theme-icon");
    if (themeLabel) themeLabel.textContent = theme === "dark" ? "Modo oscuro" : "Modo claro";
    if (themeIcon) themeIcon.className = theme === "dark" ? "bi bi-moon-stars-fill" : "bi bi-brightness-high-fill";
}

function toggleTheme() {
    const nextTheme = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
}

function buildNavigation(role, activePage) {
    const adminItems = [
        { href: "dashboard.html", label: "Dashboard", icon: "bi-speedometer2" },
        { href: "billing.html", label: "Facturación", icon: "bi-receipt" },
        { href: "inventory.html", label: "Registrar Producto", icon: "bi-plus-circle" },
        { href: "products_list.html", label: "Ver Inventario", icon: "bi-box-seam" },
        { href: "users.html", label: "Usuarios", icon: "bi-people" },
        { href: "expenses.html", label: "Gastos", icon: "bi-cash-stack" },
        { href: "calendar.html", label: "Calendario", icon: "bi-calendar3" },
        { href: "reports.html", label: "Reportes", icon: "bi-file-earmark-bar-graph" },
    ];

    const cashierItems = [
        { href: "billing.html", label: "Facturación", icon: "bi-receipt" },
    ];

    const items = role === "admin" ? adminItems : cashierItems;
    return items.map((item) => `
        <a href="${item.href}" class="${item.href === activePage ? "active" : ""}">
            <i class="bi ${item.icon} me-2"></i>${item.label}
        </a>
    `).join("");
}

function initAppShell({ activePage, title, subtitle = "", requiredRole = null }) {
    const session = enforceAuth(requiredRole);
    if (!session) return null;

    ensureIconsCss();
    ensureShellStyles();

    const content = [...document.body.children]
        .filter((node) => node.tagName !== "SCRIPT")
        .map((node) => node.outerHTML)
        .join("");
    document.body.className = "app-shell-body";
    document.body.innerHTML = `
        <aside class="app-sidebar">
            <div class="app-brand">
                <h4>Supermercado</h4>
                <span class="badge bg-primary app-role-badge">${session.role.toUpperCase()}</span>
            </div>
            <nav class="app-nav">
                ${buildNavigation(session.role, activePage)}
            </nav>
            <div class="mt-auto">
                <button onclick="logout()" class="btn btn-outline-danger w-100">
                    <i class="bi bi-box-arrow-left me-2"></i>Salir
                </button>
            </div>
        </aside>
        <main class="app-shell-main">
            <div class="app-topbar">
                <div>
                    <h2 class="mb-1">${title}</h2>
                    <p>${subtitle}</p>
                </div>
                <div class="app-topbar-actions">
                    <button type="button" class="theme-toggle" onclick="toggleTheme()">
                        <i id="theme-icon" class="bi"></i>
                        <span id="theme-label"></span>
                    </button>
                    <div class="app-user-chip">
                        <strong>${session.username}</strong> · ${session.role}
                    </div>
                </div>
            </div>
            <div class="app-page">${content}</div>
        </main>
    `;

    applyTheme(getStoredTheme());
    return session;
}
