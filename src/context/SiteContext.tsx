"use client";

import { createContext, useContext, useEffect, useState } from "react";
// Import the fallback static JSON so the site doesn't break while loading
import defaultSiteData from "../../public/data/site.json";

type SiteContextType = {
  siteData: typeof defaultSiteData;
  isLoading: boolean;
};

const SiteContext = createContext<SiteContextType>({
  siteData: defaultSiteData,
  isLoading: true,
});

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [siteData, setSiteData] = useState<typeof defaultSiteData>(defaultSiteData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch live data from KV
    fetch('/api/admin')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hero) {
          try {
            // Rollover logic based on menuDate
            const istDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const todayDate = new Date(istDateStr);
            todayDate.setHours(0, 0, 0, 0);
            
            if (data.settings?.menuDate) {
              const menuDate = new Date(data.settings.menuDate);
              menuDate.setHours(0, 0, 0, 0);
              const diffTime = todayDate.getTime() - menuDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                data.yesterdayMenu = data.todayMenu || [];
                data.todayMenu = data.tomorrowMenu || [];
                data.tomorrowMenu = [];
              } else if (diffDays >= 2) {
                data.yesterdayMenu = [];
                data.todayMenu = [];
                data.tomorrowMenu = [];
              }
            }
          } catch (e) {
            console.error("Error shifting menu:", e);
          }
          setSiteData(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load live site data:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <SiteContext.Provider value={{ siteData, isLoading }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteContext);
}
