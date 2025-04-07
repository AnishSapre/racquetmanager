"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TbPlayHandball } from "react-icons/tb";

const MatchTypeForm = () => {
  const [hovered, setHovered] = useState<"singles" | "doubles" | null>(null);
  const router = useRouter();

  const handleSelection = (type: "singles" | "doubles") => {
    router.push(`/player-info?type=${type}`);
  };

  return (
    <div className="flex h-screen">
      {/* Singles */}
      <div
        className="flex-1 flex flex-col items-center justify-center text-6xl font-bold bg-black text-white hover:bg-gray-700 cursor-pointer transition-all"
        onMouseEnter={() => setHovered("singles")}
        onMouseLeave={() => setHovered(null)}
        onClick={() => handleSelection("singles")}
      >
        {hovered === "singles" ? (
          <div className="flex space-x-8 items-center">
            <TbPlayHandball className="text-red-500 text-8xl" />
            <div className="text-4xl">VS</div>
            <TbPlayHandball className="text-blue-500 text-8xl" />
          </div>
        ) : (
          "Singles"
        )}
      </div>

      {/* Doubles */}
      <div
        className="flex-1 flex flex-col items-center justify-center text-6xl font-bold bg-black text-white hover:bg-gray-600 cursor-pointer transition-all"
        onMouseEnter={() => setHovered("doubles")}
        onMouseLeave={() => setHovered(null)}
        onClick={() => handleSelection("doubles")}
      >
        {hovered === "doubles" ? (
          <div className="flex space-x-4 items-center">
            <TbPlayHandball className="text-red-500 text-8xl" />
            <TbPlayHandball className="text-red-500 text-8xl" />
            <div className="text-4xl">VS</div>
            <TbPlayHandball className="text-blue-500 text-8xl" />
            <TbPlayHandball className="text-blue-500 text-8xl" />
          </div>
        ) : (
          "Doubles"
        )}
      </div>
    </div>
  );
};

export default MatchTypeForm;
