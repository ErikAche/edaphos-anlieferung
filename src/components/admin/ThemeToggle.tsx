"use client";

import { useLayoutEffect, useState } from "react";

const STORAGE_KEY = "edaphos-admin-theme";
const SHELL_ID = "admin-shell";

function readStoredTheme(): "light" | "dark" {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: "light" | "dark") {
  const shell = document.getElementById(SHELL_ID);
  if (!shell) return;
  if (theme === "dark") {
    shell.setAttribute("data-theme", "dark");
  } else {
    shell.removeAttribute("data-theme");
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window === "undefined" ? "light" : readStoredTheme(),
  );

  // Wendet das Theme bei jedem Mount erneut an (nicht nur beim ersten) -
  // falls die Admin-Shell aus irgendeinem Grund neu gemountet wird, ohne
  // dass das Inline-Script im Layout erneut läuft. useLayoutEffect greift
  // vor dem nächsten Browser-Paint, dadurch kein sichtbares Aufblitzen.
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage nicht verfügbar (z.B. privater Modus) - Theme gilt nur für diese Sitzung
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Farbschema wechseln"
      title={theme === "dark" ? "Helles Design aktivieren" : "Dunkles Design aktivieren"}
      className="rounded-lg p-1.5 text-neutral-500 hover:text-edaphos-black dark:text-neutral-400 dark:hover:text-neutral-100"
    >
      {theme === "dark" ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M21 12.5A8.5 8.5 0 1 1 11.5 3 6.5 6.5 0 0 0 21 12.5Z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}
