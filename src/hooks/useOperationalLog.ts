import { useEffect, useState, useCallback } from "react";
import { operationalLog, type OperationalEvent } from "@/lib/operational";

export function useOperationalLog(limit = 50) {
  const [events, setEvents] = useState<OperationalEvent[]>(() => operationalLog.getRecent(limit));

  useEffect(() => {
    setEvents(operationalLog.getRecent(limit));
    return operationalLog.subscribe(() => {
      setEvents(operationalLog.getRecent(limit));
    });
  }, [limit]);

  const clear = useCallback(() => {
    operationalLog.clear();
    setEvents([]);
  }, []);

  return { events, clear };
}
