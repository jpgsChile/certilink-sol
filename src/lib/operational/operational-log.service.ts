export type OperationalEventType =
  | "issuance_started"
  | "issuance_step"
  | "issuance_success"
  | "issuance_failed"
  | "mint_attempt"
  | "mint_retry"
  | "ipfs_upload"
  | "ipfs_retry"
  | "blockchain_event"
  | "retry_scheduled"
  | "operational_alert";

export type OperationalSeverity = "info" | "warning" | "error" | "success";

export interface OperationalEvent {
  id: string;
  timestamp: string;
  type: OperationalEventType;
  severity: OperationalSeverity;
  message: string;
  certificadoId?: string;
  alumnoId?: string;
  cursoId?: string;
  attempt?: number;
  maxAttempts?: number;
  technicalDetail?: string;
  meta?: Record<string, string>;
}

const STORAGE_KEY = "certilink_operational_log_v1";
const MAX_EVENTS = 200;
const PERSIST_EVENTS = 80;

type Listener = (event: OperationalEvent) => void;

function newId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadPersisted(): OperationalEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OperationalEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(events: OperationalEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-PERSIST_EVENTS)));
  } catch {
    /* quota / private mode */
  }
}

class OperationalLogService {
  private events: OperationalEvent[] = loadPersisted();
  private listeners = new Set<Listener>();

  log(input: Omit<OperationalEvent, "id" | "timestamp">): OperationalEvent {
    const event: OperationalEvent = {
      ...input,
      id: newId(),
      timestamp: new Date().toISOString(),
    };
    this.events = [...this.events, event].slice(-MAX_EVENTS);
    persist(this.events);
    for (const fn of this.listeners) fn(event);
    if (import.meta.env.DEV) {
      const tag = `[CertiLink · ${event.type}]`;
      if (event.severity === "error") console.warn(tag, event.message, event.technicalDetail ?? "");
      else console.info(tag, event.message);
    }
    return event;
  }

  getRecent(limit = 50): OperationalEvent[] {
    return this.events.slice(-limit).reverse();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  clear(): void {
    this.events = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }

  alert(message: string, meta?: Record<string, string>): OperationalEvent {
    return this.log({
      type: "operational_alert",
      severity: "warning",
      message,
      meta,
    });
  }
}

export const operationalLog = new OperationalLogService();
