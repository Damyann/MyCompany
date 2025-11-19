"use client";
import { createContext, useContext, useState, useEffect } from "react";

const DealerContext = createContext();

export function DealerProvider({ children }) {
  const [dealers, setDealers] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Зареждаме крупиетата при старт на приложението (след логин)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/Admin/Dealer/List");
        if (!r.ok) return;
        const d = await r.json();
        setDealers(d.croupiers || []);
      } catch (e) {
        console.error("Error loading dealers:", e);
      }
    })();
  }, []);

  // check за промени на всеки 5 сек
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r = await fetch("/api/Admin/Changes");
        if (!r.ok) return;
        const data = await r.json();

        if (data.lastUpdate !== lastUpdate) {
          setLastUpdate(data.lastUpdate);

          // Презареждаме крупиетата
          const list = await fetch("/api/Admin/Dealer/List");
          const json = await list.json();
          setDealers(json.croupiers || []);
        }
      } catch (e) {
        console.error("Auto-update error:", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <DealerContext.Provider value={{ dealers, setDealers }}>
      {children}
    </DealerContext.Provider>
  );
}

export function useDealers() {
  return useContext(DealerContext);
}
