import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Button, Input, StatusIndicator, Tabs } from "@/components/ui";
import { useApp } from "@/state/AppContext";
import { marketService } from "@/services";
import { Breadcrumbs } from "./Breadcrumbs";
import { Popover } from "./Popover";
import type { Timeframe } from "@/types";
import styles from "./Header.module.css";

const TIMEFRAMES: Timeframe[] = ["1M", "3M", "6M", "1Y", "YTD", "ALL"];

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const {
    user,
    portfolios,
    activePortfolio,
    setActivePortfolioId,
    timeframe,
    setTimeframe,
    marketStatus,
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    logout,
  } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const matches = search.trim()
    ? marketService.searchStocks(search).slice(0, 6)
    : [];

  function goToStock(symbol: string) {
    setSearch("");
    navigate(`/stock/${symbol}`);
  }

  const marketUi =
    marketStatus.state === "OPEN"
      ? ("live" as const)
      : marketStatus.state === "CLOSED"
        ? ("closed" as const)
        : ("warn" as const);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Icon name="menu" size={18} />
        </button>
        <Breadcrumbs />
      </div>

      <div className={styles.center}>
        <div className={styles.search}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (matches.length) goToStock(matches[0].symbol);
            }}
          >
            <Input
              icon="search"
              placeholder="Search symbols, holdings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sizeVariant="sm"
            />
          </form>
          {matches.length > 0 && (
            <div className={styles.searchResults}>
              {matches.map((m) => (
                <button
                  key={m.symbol}
                  className={styles.searchItem}
                  onClick={() => goToStock(m.symbol)}
                >
                  <span className={`${styles.searchSym} mono`}>{m.symbol}</span>
                  <span className={styles.searchName}>{m.company}</span>
                  <span className={styles.searchSector}>{m.sector}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {/* Market status */}
        <div className={styles.market}>
          <StatusIndicator status={marketUi} label={marketStatus.label} />
          <span className={styles.marketDetail}>{marketStatus.detail}</span>
        </div>

        <span className={styles.divider} />

        {/* Portfolio selector */}
        <Popover
          width={260}
          trigger={({ toggle, open }) => (
            <button
              className={`${styles.selector} ${open ? styles.selectorOpen : ""}`}
              onClick={toggle}
            >
              <Icon name="portfolio" size={15} className={styles.selectorIcon} />
              <span className={styles.selectorLabel}>{activePortfolio.name}</span>
              <Icon name="chevron-down" size={14} />
            </button>
          )}
        >
          {({ close }) => (
            <div className={styles.menu}>
              <div className={styles.menuHeading}>Portfolios</div>
              {portfolios.map((p) => (
                <button
                  key={p.id}
                  className={`${styles.menuItem} ${
                    p.id === activePortfolio.id ? styles.menuItemActive : ""
                  }`}
                  onClick={() => {
                    setActivePortfolioId(p.id);
                    close();
                  }}
                >
                  <div className={styles.menuItemMain}>
                    <span className={styles.menuItemTitle}>{p.name}</span>
                    <span className={styles.menuItemSub}>
                      {p.baseCurrency} · Benchmark {p.benchmark}
                    </span>
                  </div>
                  {p.id === activePortfolio.id && (
                    <Icon name="check" size={15} className={styles.menuCheck} />
                  )}
                </button>
              ))}
            </div>
          )}
        </Popover>

        {/* Date / timeframe selector */}
        <div className={styles.dateSelector}>
          <Icon name="calendar" size={14} className={styles.calIcon} />
          <Tabs
            items={TIMEFRAMES.map((t) => ({ value: t, label: t }))}
            value={timeframe}
            onChange={(v) => setTimeframe(v as Timeframe)}
            variant="segmented"
            size="sm"
          />
        </div>

        <span className={styles.divider} />

        {/* Notifications */}
        <Popover
          width={340}
          trigger={({ toggle }) => (
            <button
              className={styles.iconBtn}
              onClick={toggle}
              aria-label="Notifications"
            >
              <Icon name="bell" size={18} />
              {unreadCount > 0 && <span className={styles.badgeDot} />}
            </button>
          )}
        >
          {() => (
            <div className={styles.menu}>
              <div className={styles.notifHeader}>
                <span className={styles.menuHeading}>Notifications</span>
                {unreadCount > 0 && (
                  <button className={styles.textBtn} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className={styles.notifList}>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    className={`${styles.notif} ${n.unread ? styles.notifUnread : ""}`}
                    onClick={() => markRead(n.id)}
                  >
                    <span className={`${styles.notifIcon} ${styles[n.kind]}`}>
                      <Icon
                        name={
                          n.kind === "alert"
                            ? "alert"
                            : n.kind === "success"
                              ? "trending-up"
                              : "info"
                        }
                        size={15}
                      />
                    </span>
                    <span className={styles.notifBody}>
                      <span className={styles.notifTitle}>{n.title}</span>
                      <span className={styles.notifText}>{n.body}</span>
                      <span className={styles.notifTime}>{n.time}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Popover>

        {/* User profile */}
        <Popover
          width={240}
          trigger={({ toggle }) => (
            <button className={styles.avatar} onClick={toggle} aria-label="Account">
              {user.initials}
            </button>
          )}
        >
          {({ close }) => (
            <div className={styles.menu}>
              <div className={styles.profile}>
                <div className={styles.avatarLg}>{user.initials}</div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{user.name}</span>
                  <span className={styles.profileEmail}>{user.email}</span>
                </div>
              </div>
              <div className={styles.menuDivider} />
              <button
                className={styles.menuItem}
                onClick={() => {
                  navigate("/settings");
                  close();
                }}
              >
                <Icon name="settings" size={16} />
                <span>Settings</span>
              </button>
              <button
                className={styles.menuItem}
                onClick={() => {
                  navigate("/settings");
                  close();
                }}
              >
                <Icon name="shield" size={16} />
                <span>Security</span>
              </button>
              <div className={styles.menuDivider} />
              <div className={styles.signOut}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="logout"
                  onClick={() => {
                    close();
                    logout();
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </Popover>
      </div>
    </header>
  );
}
