"use client";

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_EVENT = "deva-theme-change";

function readTheme(): Theme {
    if (typeof window === "undefined") return "dark";

    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;

    // Respect OS preference if no saved preference
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    return "dark";
}

/**
 * The theme lives in localStorage, so it is treated as an external store.
 * Using `useSyncExternalStore` keeps the server render and the first client
 * render in sync (no hydration mismatch) without setting state inside an
 * effect.
 */
function subscribe(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(THEME_EVENT, onStoreChange);
    return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(THEME_EVENT, onStoreChange);
    };
}

function getSnapshot(): Theme {
    return readTheme();
}

function getServerSnapshot(): Theme {
    return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    // Applying the attribute is a side effect on an external system (the DOM).
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        const next: Theme = readTheme() === "dark" ? "light" : "dark";
        localStorage.setItem("theme", next);
        document.documentElement.setAttribute("data-theme", next);
        window.dispatchEvent(new Event(THEME_EVENT));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}
