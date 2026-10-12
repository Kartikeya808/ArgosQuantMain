import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppNotification,
  AppSettings,
  Portfolio,
  Timeframe,
  Transaction,
  TransactionDraft,
  User,
  WatchlistItem,
} from "@/types";
import {
  currentUser,
  defaultSettings,
  initialWatchlist,
  marketStatus,
  notifications as initialNotifications,
  portfolios as mockPortfolios,
} from "@/data/mockData";
import { createTransaction } from "@/services/portfolioService";
import { getMover } from "@/services/marketService";
import * as session from "@/services/session";
import { Login } from "@/pages/Login";

interface AppState {
  user: User;
  portfolios: Portfolio[];
  activePortfolioId: string;
  setActivePortfolioId: (id: string) => void;
  activePortfolio: Portfolio;
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void;
  marketStatus: typeof marketStatus;
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;

  /** Bumped whenever live backend data is re-hydrated, to refresh consumers. */
  dataVersion: number;
  logout: () => void;

  /* ---- session-mutable portfolio + watchlist state ---- */
  sessionTransactions: Transaction[];
  addTransaction: (draft: TransactionDraft) => Transaction;
  watchlist: WatchlistItem[];
  isWatched: (symbol: string) => boolean;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;

  /* ---- settings ---- */
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  const [activePortfolioId, setActivePortfolioIdState] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>("6M");
  const [notifications, setNotifications] =
    useState<AppNotification[]>(initialNotifications);
  const [sessionTransactions, setSessionTransactions] = useState<Transaction[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const bump = useCallback(() => setDataVersion((v) => v + 1), []);

  // Attempt to restore a persisted session on first load.
  useEffect(() => {
    let cancelled = false;
    session
      .restore()
      .then((ok) => {
        if (cancelled) return;
        if (ok) {
          setActivePortfolioIdState(session.getActivePortfolioId());
          setAuthed(true);
        }
      })
      .catch(() => void 0)
      .finally(() => !cancelled && setBooting(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      await session.login(email, password);
      setActivePortfolioIdState(session.getActivePortfolioId());
      setAuthed(true);
      bump();
    },
    [bump],
  );

  const handleRegister = useCallback(
    async (name: string, email: string, password: string) => {
      await session.register(name, email, password);
      setActivePortfolioIdState(session.getActivePortfolioId());
      setAuthed(true);
      bump();
    },
    [bump],
  );

  const logout = useCallback(() => {
    session.logout();
    setAuthed(false);
    setActivePortfolioIdState("");
  }, []);

  const setActivePortfolioId = useCallback(
    (id: string) => {
      setActivePortfolioIdState(id);
      void session.setActivePortfolio(id).then(bump);
    },
    [bump],
  );

  const addTransaction = useCallback(
    (draft: TransactionDraft): Transaction => {
      // Return an optimistic transaction immediately (for the toast), and
      // persist to the backend in the background, refreshing on completion.
      const optimistic = createTransaction(draft);
      if (session.isLive()) {
        void session
          .executeTrade(
            session.getActivePortfolioId(),
            draft.type,
            draft.symbol,
            draft.quantity,
            draft.price,
          )
          .then(bump)
          .catch(() => void 0);
      } else {
        setSessionTransactions((prev) => [optimistic, ...prev]);
      }
      return optimistic;
    },
    [bump],
  );

  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      if (prev.some((w) => w.symbol === symbol)) return prev;
      const candidate = getMover(symbol);
      if (!candidate) return prev;
      return [{ ...candidate }, ...prev];
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<AppState>(() => {
    const livePortfolios = session.getPortfolios();
    const portfolios = livePortfolios.length ? livePortfolios : mockPortfolios;
    const user = session.getUser() ?? currentUser;
    const activePortfolio =
      portfolios.find((p) => p.id === activePortfolioId) ?? portfolios[0];
    return {
      user,
      portfolios,
      activePortfolioId: activePortfolio?.id ?? activePortfolioId,
      setActivePortfolioId,
      activePortfolio,
      timeframe,
      setTimeframe,
      marketStatus,
      notifications,
      unreadCount: notifications.filter((n) => n.unread).length,
      markAllRead: () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false }))),
      markRead: (id: string) =>
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        ),
      dataVersion,
      logout,
      sessionTransactions,
      addTransaction,
      watchlist,
      isWatched: (symbol: string) => watchlist.some((w) => w.symbol === symbol),
      addToWatchlist,
      removeFromWatchlist,
      settings,
      updateSettings,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activePortfolioId,
    timeframe,
    notifications,
    sessionTransactions,
    addTransaction,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    settings,
    updateSettings,
    dataVersion,
    setActivePortfolioId,
    logout,
  ]);

  if (booting) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          color: "var(--text-muted, #97a0b5)",
          fontSize: 14,
        }}
      >
        Loading ArgosQuant…
      </div>
    );
  }

  if (!authed) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
