"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CutOffPage = () => {
  const router = useRouter();

  useEffect(() => {
    const checkCutoff = async () => {
      try {
        const res = await fetch("https://api.npoint.io/aaa5f14d323a7a02bb9a", {
          cache: 'no-store' 
        });
        const data = await res.json();
        console.log("Status Cutoff:", data.isCutOff);
        if (!data.isCutOff) {
          window.location.href = "/";
        }
      } catch (e) {
        console.error("Gagal fetch:", e);
      }
    };
    checkCutoff();
    const intervalId = setInterval(checkCutoff, 60000);
  
    return () => clearInterval(intervalId);
  }, []); 

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold">
        ATMIN LG CUTOFF BENTAR, JANGAN NGERJAIN JING
      </h1>
    </div>
  );
};

export default CutOffPage;
