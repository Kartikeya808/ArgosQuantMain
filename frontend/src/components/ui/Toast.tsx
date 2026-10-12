import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./Icon";
import styles from "./Toast.module.css";

type ToastKind = "info" | "success" | "error" | "warn";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  push: (t: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warn: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const kindIcon: Record<ToastKind, IconName> = {
  info: "info",
  success: "check",
  error: "alert",
  warn: "alert",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { ...t, id }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  const api: ToastApi = {
    push,
    success: (title, description) => push({ kind: "success", title, description }),
    error: (title, description) => push({ kind: "error", title, description }),
    info: (title, description) => push({ kind: "info", title, description }),
    warn: (title, description) => push({ kind: "warn", title, description }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className={styles.viewport}>
          {toasts.map((t) => (
            <div key={t.id} className={`${styles.toast} ${styles[t.kind]}`}>
              <span className={styles.icon}>
                <Icon name={kindIcon[t.kind]} size={16} />
              </span>
              <div className={styles.content}>
                <div className={styles.title}>{t.title}</div>
                {t.description && (
                  <div className={styles.desc}>{t.description}</div>
                )}
              </div>
              <button
                className={styles.close}
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
