import { useEffect, useState } from "react";
import { Route, Routes } from "react-router";
import { Header } from "./components/Header.js";
import { ActivityPage } from "./pages/ActivityPage.js";
import { StakePage } from "./pages/StakePage.js";
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
    <>
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 pb-16 pt-28">
        <Routes>
          <Route path="/" element={<StakePage theme={theme} />} />
          <Route path="/activity" element={<ActivityPage />} />
        </Routes>
      </main>
    </>
  );
}
