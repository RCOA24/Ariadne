"use client";

import { CheckCircle2, Info, Trash2, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Tone = "success" | "error" | "info";
type Notice = { id: string; title: string; message?: string; tone: Tone };
type Confirmation = {
  title: string;
  message: string;
  confirmLabel?: string;
  resolve: (confirmed: boolean) => void;
};

type NotificationContext = {
  notify: (notice: Omit<Notice, "id">) => void;
  confirm: (options: Omit<Confirmation, "resolve">) => Promise<boolean>;
};

const Notifications = createContext<NotificationContext>({
  notify: () => undefined,
  confirm: async () => false,
});

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const colors = {
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  error: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  info: "border-violet-400/25 bg-violet-400/10 text-violet-100",
};

export function NotificationProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation>();

  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const notify = useCallback(
    (notice: Omit<Notice, "id">) => {
      const id = crypto.randomUUID();
      setNotices((current) => [...current, { ...notice, id }]);
      window.setTimeout(() => dismiss(id), 4800);
    },
    [dismiss],
  );

  const confirm = useCallback(
    (options: Omit<Confirmation, "resolve">) =>
      new Promise<boolean>((resolve) => {
        setConfirmation({ ...options, resolve });
      }),
    [],
  );

  const closeConfirmation = (confirmed: boolean) => {
    confirmation?.resolve(confirmed);
    setConfirmation(undefined);
  };

  return (
    <Notifications.Provider value={{ notify, confirm }}>
      {children}
      <div className="fixed right-5 top-5 z-[100] w-[min(380px,calc(100vw-2.5rem))] space-y-3">
        {notices.map((notice) => {
          const Icon = icons[notice.tone];
          return (
            <div
              key={notice.id}
              role="status"
              className={`flex gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${colors[notice.tone]}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{notice.title}</p>
                {notice.message && (
                  <p className="mt-1 text-sm opacity-80">{notice.message}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(notice.id)}
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
      {confirmation && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/70 p-5 backdrop-blur-sm">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            className="w-full max-w-md rounded-3xl border border-rose-400/20 bg-[#141b2d] p-6 shadow-2xl shadow-black/50"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300">
              <Trash2 className="size-5" />
            </div>
            <h2
              id="confirmation-title"
              className="mt-5 text-xl font-semibold text-white"
            >
              {confirmation.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {confirmation.message}
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => closeConfirmation(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Keep repository
              </button>
              <button
                onClick={() => closeConfirmation(true)}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                {confirmation.confirmLabel ?? "Delete repository"}
              </button>
            </div>
          </section>
        </div>
      )}
    </Notifications.Provider>
  );
}

export const useNotifications = () => useContext(Notifications);
