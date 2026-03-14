"use client";

import dynamic from "next/dynamic";

const SmartMortgageMvpApp = dynamic(
  () => import("@/src/App").then((module) => module.SmartMortgageMvpApp),
  {
    ssr: false,
    loading: () => null,
  },
);

export function MvpMount() {
  return <SmartMortgageMvpApp />;
}
