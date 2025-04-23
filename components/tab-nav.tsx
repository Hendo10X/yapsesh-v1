"use client";

import { cn } from "@/lib/utils";

interface TabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { name: "For You", id: "for-you" },
  { name: "Following", id: "following" },
  { name: "Polls", id: "polls" },
];

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const handleClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="w-full ">
      <nav className="flex justify-center space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.name}
              onClick={() => handleClick(tab.id)}
              className={cn(
                "inline-flex items-center border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-[#4BBDF1] text-black"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
              aria-current={isActive ? "page" : undefined}>
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
