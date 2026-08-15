import { useEffect, useState } from "react";
import { Route, Routes } from "react-router";
import { Footer } from "./components/Footer.js";
import { Header } from "./components/Header.js";
import { ActivityPage } from "./pages/ActivityPage.js";
import { DocsPage } from "./pages/DocsPage.js";
import { ImprintPage } from "./pages/ImprintPage.js";
import { PrivacyPage } from "./pages/PrivacyPage.js";
import { StakePage } from "./pages/StakePage.js";
import { TermsPage } from "./pages/TermsPage.js";
import { applyTheme, getInitialTheme, storeTheme, type Theme } from "./theme.js";

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => applyTheme(theme), [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      storeTheme(next);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      {/* Top-aligned (no justify-center): the hero line must not shift with
          the page's content height when switching routes. */}
      <main className="flex flex-1 flex-col items-center gap-12 px-6 py-16">
        <Routes>
          <Route path="/" element={<StakePage theme={theme} />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/imprint" element={<ImprintPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
