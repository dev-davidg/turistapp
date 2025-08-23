import React, { createContext, useContext, useEffect, useState } from "react";

export const UIButton = ({ as: Comp = "button", variant = "primary", className = "", children, ...props }: any) => {
  const base = "inline-flex items-center justify-center rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string,string> = {
    primary: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
    outline: "border border-gray-200 bg-white text-gray-900 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
  };
  return <Comp className={`${base} px-4 py-2 text-sm ${variants[variant]} ${className}`} {...props}>{children}</Comp>;
};

export const UICard = ({ children, className = "" }: any) => (
  <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-gray-950 dark:ring-white/5 ${className}`}>{children}</div>
);

export const UIBadge = ({ tone = "gray", children, className = "" }: any) => {
  const tones: Record<string,string> = { gray:"bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100", amber:"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}>{children}</span>;
};

export const UITabs = ({ tabs, value, onChange }: any) => (
  <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    {tabs.map((t: any)=> (
      <button key={t.value} onClick={()=>onChange?.(t.value)} className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${value===t.value?"bg-emerald-600 text-white":"text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"}`}>{t.label}</button>
    ))}
  </div>
);
