"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";

// Define types for our data
type SportType = "badminton" | "squash" | "table-tennis" | "tennis";

interface SectionData {
  id: string;
  title: string;
  link: string;
  sport: SportType;
}

const SportCourt: React.FC<{ sport: SportType }> = ({ sport }) => {
  switch (sport) {
    case "badminton":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 300"
          className="w-full h-full"
        >
          <rect
            x="50"
            y="70"
            width="300"
            height="150"
            fill="green"
            stroke="white"
            strokeWidth="2"
          />
          {/* vert. court line */}
          <line
            x1="200"
            y1="70"
            x2="200"
            y2="220"
            stroke="white"
            strokeWidth="2"
          />
          {/* horiz. center line */}
          <line
            x1="50"
            y1="145"
            x2="350"
            y2="145"
            stroke="white"
            strokeWidth="2"
          />
          {/* dobules line */}
          <line
            x1="50"
            y1="90.5"
            x2="350"
            y2="90.5"
            stroke="white"
            strokeWidth="2"
          />
          <line
            x1="50"
            y1="200"
            x2="350"
            y2="200"
            stroke="white"
            strokeWidth="2"
          />
          {/* vert. service boundary line */}
          <line
            x1="70"
            y1="70"
            x2="70"
            y2="220"
            stroke="white"
            strokeWidth="2"
          />
          <line
            x1="330"
            y1="70"
            x2="330"
            y2="220"
            stroke="white"
            strokeWidth="2"
          />
          {/* service line */}
          <line
            x1="150"
            y1="90"
            x2="150"
            y2="200"
            stroke="white"
            strokeWidth="2"
          />
          <line
            x1="250"
            y1="90"
            x2="250"
            y2="200"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      );
    case "squash":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 300"
          className="w-full h-full"
        >
          <rect
            x="50"
            y="70"
            width="300"
            height="150"
            fill="rgb(220,180,140)"
            stroke="red"
            strokeWidth="2"
          />
          {/* vert. court line */}
          <line
            x1="200"
            y1="70"
            x2="200"
            y2="220"
            stroke="red"
            strokeWidth="2"
          />
          {/* horiz. center line */}
          <line
            x1="200"
            y1="145"
            x2="350"
            y2="145"
            stroke="red"
            strokeWidth="2"
          />
          {/* top service box */}
          <rect
            x="200"
            y="70"
            width="50"
            height="50"
            fill="rgb(220,180,140)"
            stroke="red"
            strokeWidth="2"
          />
          {/* bottom service box */}
          <rect
            x="200"
            y="170"
            width="50"
            height="50"
            fill="rgb(220,180,140)"
            stroke="red"
            strokeWidth="2"
          />
        </svg>
      );
    case "table-tennis":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 300"
          className="w-full h-full"
        >
          <rect
            x="100"
            y="90"
            width="200"
            height="120"
            fill="rgb(100,119,250)"
            stroke="white"
            strokeWidth="3"
          />
          {/* horiz. center line */}
          <line
            x1="100"
            y1="150"
            x2="300"
            y2="150"
            stroke="white"
            strokeWidth="1"
          />
          {/* vert. court line */}
          <line
            x1="200"
            y1="90"
            x2="200"
            y2="210"
            stroke="white"
            strokeWidth="3"
          />
        </svg>
      );
    case "tennis":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 300"
          className="w-full h-full"
        >
          <rect
            x="50"
            y="70"
            width="300"
            height="150"
            fill="rgb(170,78,59)"
            stroke="white"
            strokeWidth="2"
          />
          {/* vert. court line */}
          <line
            x1="200"
            y1="70"
            x2="200"
            y2="220"
            stroke="white"
            strokeWidth="2"
          />
          {/* horiz. center line */}
          <line
            x1="130"
            y1="145"
            x2="270"
            y2="145"
            stroke="white"
            strokeWidth="2"
          />
          {/* dobules line */}
          <line
            x1="50"
            y1="90.5"
            x2="350"
            y2="90.5"
            stroke="white"
            strokeWidth="2"
          />
          <line
            x1="50"
            y1="200"
            x2="350"
            y2="200"
            stroke="white"
            strokeWidth="2"
          />
          {/* service line */}
          <line
            x1="130"
            y1="90"
            x2="130"
            y2="200"
            stroke="white"
            strokeWidth="2"
          />
          <line
            x1="270"
            y1="90"
            x2="270"
            y2="200"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      );
    default:
      return null;
  }
};

const Home: React.FC = () => {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("id");
  const [hoveredSport, setHoveredSport] = useState<string | null>(null);
  const sections: SectionData[] = [
    {
      id: "badminton",
      title: "Badminton",
      link: `/badminton?id=${gameId}`,
      sport: "badminton",
    },
    {
      id: "squash",
      title: "Squash",
      link: `/squash?id=${gameId}`,
      sport: "squash",
    },
    {
      id: "tabletennis",
      title: "Table Tennis",
      link: `/table-tennis?id=${gameId}`,
      sport: "table-tennis",
    },
    {
      id: "tennis",
      title: "Tennis",
      link: `/tennis?id=${gameId}`,
      sport: "tennis",
    },
  ];

  const handleSportAddition = async (sport: SportType) => {
    const response = await fetch(`/api/game?id=${gameId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport }),
    });
  };

  return (
    <div className="grid grid-cols-2 grid-rows-2 h-screen">
      {sections.map((section) => (
        <Link
          href={section.link}
          key={section.id}
          onClick={() => handleSportAddition(section.sport)}
          className="relative group flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black group-hover:bg-black/80 transition duration-200 border border-gray-800"></div>

          <div className="relative w-full h-full z-10">
            <SportCourt sport={section.sport} />
          </div>

          <div className="absolute top-70 inset-0 flex flex-col items-center justify-center z-20">
            <h2 className="text-white text-3xl font-bold">{section.title}</h2>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default Home;
