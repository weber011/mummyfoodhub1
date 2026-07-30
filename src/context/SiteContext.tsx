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
