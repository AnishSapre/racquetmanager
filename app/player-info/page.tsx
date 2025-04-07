"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useState } from "react";

const PlayerInfo = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const matchType = searchParams.get("type") || "singles";

    // Set player count based on match type
    const playerCount = matchType === "singles" ? 2 : 4;
    const colors = playerCount === 2 
        ? ["text-red-500", "text-blue-500"] 
        : ["text-red-500", "text-red-500", "text-blue-500", "text-blue-500"];

    const [playerNames, setPlayerNames] = useState(Array(playerCount).fill(""));
    const [firstServer, setFirstServer] = useState<number | null>(null);
    const [startingSide, setStartingSide] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (index: number, value: string) => {
        setPlayerNames((prev) => {
            const newNames = [...prev];
            newNames[index] = value;
            return newNames;
        });
    };

    const handleSubmit = async () => {
        if (firstServer === null || startingSide === null) return;

        setLoading(true);
        try {
            const response = await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchType, playerNames, firstServer, startingSide }),
            });

            if (!response.ok) throw new Error("Failed to save game");

            const { id } = await response.json();
            router.push(`/options?id=${id}`);
        } catch (error) {
            console.error(error);
            alert("Error saving game");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
            <h1 className="text-4xl font-bold mb-6">Enter Player Names</h1>

            {/* Player Input Fields */}
            <div className="flex flex-col space-y-4">
                {playerNames.map((name, index) => (
                    <input
                        key={index}
                        type="text"
                        placeholder={`Player ${index + 1}`}
                        value={name}
                        onChange={(e) => handleChange(index, e.target.value)}
                        className={`px-4 py-2 text-2xl font-bold rounded-lg border-2 border-gray-500 bg-gray-800 focus:border-white focus:outline-none ${colors[index]}`}
                    />
                ))}
            </div>

            {/* First Server Selection */}
            <div className="mt-6 justify-center">
                <h2 className="text-2xl font-bold mb-2">Who serves first?</h2>
                <div className="flex space-x-4">
                    {playerNames.map((name, index) => (
                        <label key={index} className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="server"
                                value={index}
                                checked={firstServer === index}
                                onChange={() => setFirstServer(index)}
                                className="w-5 h-5"
                                disabled={!name} // Disable if name is empty
                            />
                            <span className="text-lg">{name || `Player ${index + 1}`}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Starting Side Selection */}
            <div className="mt-6 justify-center items-center">
                <h2 className="text-2xl font-bold mb-2 justify-center items-center">
                    Which side does {playerNames[0] || "Player 1"} and {playerNames[1] || "Player 2"} start on?
                </h2>
                <div className="flex space-x-4 justify-center items-center">
                    {["Left", "Right"].map((side) => (
                        <button
                            key={side}
                            onClick={() => setStartingSide(side)}
                            className={`px-6 py-3 font-bold rounded-lg border-2 ${
                                startingSide === side ? "bg-green-500 border-green-700" : "bg-gray-700 border-gray-500"
                            } hover:bg-green-600`}
                        >
                            {side}
                        </button>
                    ))}
                </div>
            </div>

            {/* Start Match Button */}
            <button
                onClick={handleSubmit}
                disabled={loading || firstServer === null || startingSide === null}
                className={`mt-6 px-6 py-3 text-white font-bold rounded-lg ${
                    firstServer !== null && startingSide !== null 
                        ? "bg-green-500 hover:bg-green-700" 
                        : "bg-gray-600 cursor-not-allowed"
                }`}
            >
                {loading ? "Saving..." : "Start Match"}
            </button>
        </div>
    );
};

export default PlayerInfo;
