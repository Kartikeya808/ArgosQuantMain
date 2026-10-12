import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AppProvider } from "@/state/AppContext";
import { ToastProvider } from "@/components/ui";
import { Dashboard } from "@/pages/Dashboard";
import { Portfolio } from "@/pages/Portfolio";
import { Markets } from "@/pages/Markets";
import { Watchlist } from "@/pages/Watchlist";
import { StockDetail } from "@/pages/StockDetail";
import { Analytics } from "@/pages/Analytics";
import { Risk } from "@/pages/Risk";
import { Scenarios } from "@/pages/Scenarios";
import { Assistant } from "@/pages/Assistant";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/stock/:symbol" element={<StockDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/risk" element={<Risk />} />
              <Route path="/scenarios" element={<Scenarios />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
