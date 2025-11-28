"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CutOffPage = () => {
  const router = useRouter();

  useEffect(() => {
    const checkCutoff = async () => {
      try {
        const res = await fetch("https://api.npoint.io/17f9cae69558688882bc");
        const data = await res.json();
        if (!data.isCutOff) {
          router.push("/");
        }
      } catch (e) {
        // ignore, if npoint is down, we just stay on the cutoff page
      }
    };

    const intervalId = setInterval(checkCutoff, 60000);

    return () => clearInterval(intervalId);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold">
        LAGI CUTOFF BENTAR YE, JANGAN NGERJAIN JING
      </h1>
    </div>
  );
};

export default CutOffPage;
