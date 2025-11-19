"use client";
import { createContext, useContext, useState } from "react";

const DealerContext = createContext();

export function DealerProvider({ children }) {
  const [dealers, setDealers] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function loadDealers() {
    try {
      const r = await fetch("/api/Admin/Dealer/List");
      if (!r.ok) return;

      const j = await r.json();
      setDealers(j.croupiers || []);
    } catch (e) {
      console.error("Error loading dealers:", e);
    }
  }

  return (
    <DealerContext.Provider
      value={{
        dealers,
        setDealers,
        lastUpdate,
        setLastUpdate,
        loadDealers,
      }}
    >
      {children}
    </DealerContext.Provider>
  );
}

export function useDealers() {
  return useContext(DealerContext);
}
