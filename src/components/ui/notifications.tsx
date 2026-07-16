"use client";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
type Tone = "success" | "error" | "info";
type Notice = { id: string; title: string; message?: string; tone: Tone };
const Notifications = createContext<{ notify: (notice: Omit<Notice,"id">) => void }>({ notify: () => undefined });
const icons = { success: CheckCircle2, error: XCircle, info: Info };
const colors = { success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200", error: "border-rose-400/25 bg-rose-400/10 text-rose-200", info: "border-violet-400/25 bg-violet-400/10 text-violet-100" };
export function NotificationProvider({ children }: { readonly children: ReactNode }) { const [notices, setNotices] = useState<Notice[]>([]); const notify = useCallback((notice: Omit<Notice,"id">) => { const id = crypto.randomUUID(); setNotices(current => [...current, { ...notice, id }]); window.setTimeout(() => setNotices(current => current.filter(item => item.id !== id)), 4800); }, []); return <Notifications.Provider value={{ notify }}>{children}<div className="fixed right-5 top-5 z-[100] w-[min(380px,calc(100vw-2.5rem))] space-y-3">{notices.map(notice => { const Icon = icons[notice.tone]; return <div key={notice.id} role="status" className={`flex gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${colors[notice.tone]}`}><Icon className="mt-0.5 size-5 shrink-0"/><div className="min-w-0 flex-1"><p className="font-semibold">{notice.title}</p>{notice.message && <p className="mt-1 text-sm opacity-80">{notice.message}</p>}</div><button onClick={() => setNotices(current => current.filter(item => item.id !== notice.id))} aria-label="Dismiss notification"><X className="size-4"/></button></div>; })}</div></Notifications.Provider>; }
export const useNotifications = () => useContext(Notifications);
