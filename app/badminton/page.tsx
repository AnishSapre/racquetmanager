"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import { FaCheck, FaUndo, FaUsers, FaUser } from "react-icons/fa"; // Import icons

interface PlayerInfo {
  id: string; // Game ID
  matchType: "singles" | "doubles";
  teamA: string;
  teamB: string;
  playersA: string[];
  playersB: string[];
  scoreA: number;
  scoreB: number;
  setScoresA: number[];
  setScoresB: number[];
  firstServer: number; // 0 for Team A, 1 for Team B
  startingSide: string; // "Left" or "Right" (Team A's perspective at start)
  gameEnded?: boolean;
  currentSet: number;
}

interface PointData {
  id: string;
  gameId: string;
  scoredBy: "A" | "B";
  scoreA: number; // Score *after* this point
  scoreB: number; // Score *after* this point
  setNumber: number;
  timestamp: string;
  // State *before* this point was played
  servingTeam: "A" | "B";
  serverIndex: number | null;
  playerPositionsA: number[] | null; // [left_idx, right_idx] or [idx]
  playerPositionsB: number[] | null; // [left_idx, right_idx] or [idx]
}


const BadmintonPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get("id");

  // --- Core Game State ---
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [currentScoreA, setCurrentScoreA] = useState<number>(0);
  const [currentScoreB, setCurrentScoreB] = useState<number>(0);
  const [currentSet, setCurrentSet] = useState<number>(0);
  const [setScoresA, setSetScoresA] = useState<number[]>([0, 0, 0]);
  const [setScoresB, setSetScoresB] = useState<number[]>([0, 0, 0]);
  const [setsWon, setSetsWon] = useState<{ A: number; B: number }>({ A: 0, B: 0 });
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [userFinishedGame, setUserFinishedGame] = useState<boolean>(false); // UI state for showing overlay

  // --- Serving & Positioning State ---
  const [matchType, setMatchType] = useState<"singles" | "doubles">("singles");
  const [servingTeam, setServingTeam] = useState<"A" | "B" | null>(null);
  const [currentServerIndex, setCurrentServerIndex] = useState<number | null>(null); // Index within the serving team (0 or 1 for doubles)
  // Player positions relative to *their* side: [left_player_idx, right_player_idx]
  const [playerPositionsA, setPlayerPositionsA] = useState<number[] | null>(null);
  const [playerPositionsB, setPlayerPositionsB] = useState<number[] | null>(null);
  const [leftSideTeam, setLeftSideTeam] = useState<"A" | "B">("A"); // Which TEAM is physically on the left court
  const [switchedSideMidSet, setSwitchedSideMidSet] = useState<boolean>(false); // Track if sides switched at 11 in the current set

  // --- UI & Data Fetching State ---
  const [pointHistory, setPointHistory] = useState<PointData[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Start loading true
  const [error, setError] = useState<string | null>(null);

  const rightSideTeam = leftSideTeam === "A" ? "B" : "A";

  // --- Data Fetching ---
  const fetchGameData = useCallback(async () => {
    if (!gameId) {
      setError("No game ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      console.log("Fetching game data for ID:", gameId);
      const response = await fetch(`/api/game?id=${gameId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch game data (${response.status})`);
      }
      const data = await response.json();
      console.log("Game Data Received:", data);

      // Basic Validation
      if (!data || typeof data !== 'object') throw new Error("Invalid game data format received.");
      if (!data.playerNames) throw new Error("Missing playerNames in game data.");

      let parsedPlayerNames: string[];
      if (typeof data.playerNames === "string") {
        try {
          parsedPlayerNames = JSON.parse(data.playerNames);
        } catch (e) { throw new Error("Failed to parse playerNames JSON string."); }
      } else if (Array.isArray(data.playerNames)) {
        parsedPlayerNames = data.playerNames;
      } else {
        throw new Error("playerNames is not a string or array.");
      }

      if (!Array.isArray(parsedPlayerNames) || (parsedPlayerNames.length !== 2 && parsedPlayerNames.length !== 4)) {
        throw new Error("Invalid number of player names.");
      }
      const type = parsedPlayerNames.length === 4 ? "doubles" : "singles";
      setMatchType(type);


      const fetchedSetScoresA = Array.isArray(data.setScoresA) ? data.setScoresA : JSON.parse(data.setScoresA || "[0,0,0]");
      const fetchedSetScoresB = Array.isArray(data.setScoresB) ? data.setScoresB : JSON.parse(data.setScoresB || "[0,0,0]");

      const info: PlayerInfo = {
        id: data.id,
        matchType: type,
        teamA: type === "doubles" ? `${parsedPlayerNames[0]} / ${parsedPlayerNames[1]}` : parsedPlayerNames[0],
        teamB: type === "doubles" ? `${parsedPlayerNames[2]} / ${parsedPlayerNames[3]}` : parsedPlayerNames[1],
        playersA: type === "doubles" ? [parsedPlayerNames[0], parsedPlayerNames[1]] : [parsedPlayerNames[0]],
        playersB: type === "doubles" ? [parsedPlayerNames[2], parsedPlayerNames[3]] : [parsedPlayerNames[1]],
        scoreA: data.scoreA ?? 0,
        scoreB: data.scoreB ?? 0,
        setScoresA: fetchedSetScoresA,
        setScoresB: fetchedSetScoresB,
        firstServer: data.firstServer ?? 0, // Default to Team A if missing
        startingSide: data.startingSide ?? "Left", // Default if missing
        gameEnded: data.gameEnded ?? false,
        currentSet: data.currentSet ?? 0,
      };

      setPlayerInfo(info);
      setCurrentScoreA(info.scoreA);
      setCurrentScoreB(info.scoreB);
      setSetScoresA(info.setScoresA);
      setSetScoresB(info.setScoresB);
      setCurrentSet(info.currentSet);
      setGameEnded(false);

      // Calculate sets wons
      const setsA = info.setScoresA.filter((score, index) => score > info.setScoresB[index] && (score >= 21 || score === 30)).length;
      const setsB = info.setScoresB.filter((score, index) => score > info.setScoresA[index] && (score >= 21 || score === 30)).length;
      setSetsWon({ A: setsA, B: setsB });

      // Determine current state (sides, server, positions) by fetching history
      await fetchPointHistoryAndSetupState(info);

    } catch (err) {
      console.error("Error fetching game data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setPlayerInfo(null); // Clear player info on error
    } finally {
      setLoading(false);
    }
  }, [gameId]); // gameId is the dependency

  const fetchPointHistoryAndSetupState = async (initialPlayerInfo: PlayerInfo) => {
    if (!gameId) return;
    try {
      const response = await fetch(`/api/points?gameId=${gameId}`);
      if (!response.ok) throw new Error("Failed to fetch point history");
      const history: PointData[] = await response.json();
      setPointHistory(history); // history is newest first

      // --- Determine Current State from History (or initial state if no history) ---
      const lastPoint = history.length > 0 ? history[0] : null;

      if (lastPoint) {
        // State is based on the outcome of the *last* point
        const scorer = lastPoint.scoredBy;
        const lastServingTeam = lastPoint.servingTeam;
        let nextServingTeam: "A" | "B";
        let nextServerIndex: number | null = null;
        let nextPosA = lastPoint.playerPositionsA ? [...lastPoint.playerPositionsA] : (initialPlayerInfo.matchType === 'doubles' ? [0, 1] : [0]);
        let nextPosB = lastPoint.playerPositionsB ? [...lastPoint.playerPositionsB] : (initialPlayerInfo.matchType === 'doubles' ? [0, 1] : [0]);

        if (scorer === lastServingTeam) {
          // Serving team won
          nextServingTeam = lastServingTeam;
          nextServerIndex = lastPoint.serverIndex; // Same server serves again
          // Switch positions for serving team if doubles
          if (initialPlayerInfo.matchType === 'doubles') {
            if (nextServingTeam === 'A') nextPosA = [nextPosA[1], nextPosA[0]];
            else nextPosB = [nextPosB[1], nextPosB[0]];
          }
        } else {
          // Receiving team won (side out)
          nextServingTeam = scorer; // The scorer becomes the new serving team
          // Positions DO NOT change on side out
          // Determine server based on new serving team's score *after* the point
          const newServerScore = nextServingTeam === 'A' ? lastPoint.scoreA : lastPoint.scoreB;
          if (initialPlayerInfo.matchType === 'doubles') {
            const teamPositions = nextServingTeam === 'A' ? nextPosA : nextPosB;
            // If score is even, player on the right serves. If odd, player on left serves.
            nextServerIndex = (newServerScore % 2 === 0) ? teamPositions[1] : teamPositions[0];
          } else {
            nextServerIndex = 0; // Only one player in singles
          }
        }
        setServingTeam(nextServingTeam);
        setCurrentServerIndex(nextServerIndex);
        setPlayerPositionsA(nextPosA);
        setPlayerPositionsB(nextPosB);

      } else {
        // Initial game state (no points played yet)
        const firstTeamToServe = initialPlayerInfo.firstServer === 0 ? "A" : "B";
        setServingTeam(firstTeamToServe);
        setCurrentServerIndex(0); // First player always starts
        // Set initial positions - [0, 1] means player 0 on left, player 1 on right
        // For Team A: [0, 1] means player 0 on left, player 1 on right
        // For Team B: [0, 1] means player 0 on left, player 1 on right
        setPlayerPositionsA(initialPlayerInfo.matchType === 'doubles' ? [0, 1] : [0]);
        setPlayerPositionsB(initialPlayerInfo.matchType === 'doubles' ? [0, 1] : [0]);
      }

      // --- Determine Court Sides ---
      // Side depends on the set number and initial starting side
      const startSideA = initialPlayerInfo.startingSide === "Left" ? "A" : "B";
      const shouldSwitchForSet = initialPlayerInfo.currentSet % 2 !== 0; // Switch every odd set (1, 3, ...) relative to start
      let currentLeftSide = shouldSwitchForSet ? (startSideA === "A" ? "B" : "A") : startSideA;

      // Check if sides switched mid-set (at 11 in the 3rd/final set)
      const setScoreA = initialPlayerInfo.scoreA;
      const setScoreB = initialPlayerInfo.scoreB;
      const finalSetNumber = 2; // Assuming best of 3
      const isFinalSet = initialPlayerInfo.currentSet === finalSetNumber;
      // Have we reached or passed 11 in the final set?
      const reached11InFinalSet = isFinalSet && (setScoreA >= 11 || setScoreB >= 11);
      // Find the point where 11 was reached in this set, if any
      const pointAt11 = history.find(p => p.setNumber === initialPlayerInfo.currentSet && (p.scoreA === 11 || p.scoreB === 11));
      const didSwitchAt11 = !!pointAt11; // Switched if such a point exists in history *for this set*

      setSwitchedSideMidSet(didSwitchAt11); // Remember if switch happened

      if (isFinalSet && didSwitchAt11) {
        // If we already switched at 11 in the final set, flip the side *again*
        currentLeftSide = currentLeftSide === "A" ? "B" : "A";
      }

      setLeftSideTeam(leftSideTeam === "A" ? "B" : "A");

    } catch (error) {
      console.error("Error fetching/processing point history:", error);
      setError(error instanceof Error ? error.message : "Failed to process point history");
      // Set default state maybe?
      const firstTeamToServe = initialPlayerInfo.firstServer === 0 ? "A" : "B";
      setServingTeam(firstTeamToServe);
      setCurrentServerIndex(0);
      setPlayerPositionsA(initialPlayerInfo.matchType === 'doubles' ? [0, 1] : [0]);
      setPlayerPositionsB(initialPlayerInfo.matchType === 'doubles' ? [0, 1] : [0]);
      const startSideA = initialPlayerInfo.startingSide === "Left" ? "A" : "B";
      setLeftSideTeam(initialPlayerInfo.currentSet % 2 !== 0 ? (startSideA === "A" ? "B" : "A") : startSideA);
    }
  };


  useEffect(() => {
    if (gameId) {
      fetchGameData();
    } else {
      console.warn("No game ID found in URL");
      setError("No game ID found in URL.");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]); // Fetch data when gameId changes

  // --- Scoring Logic ---
  const handleScoreIncrement = async (teamScored: "A" | "B") => {
    if (!playerInfo || loading || gameEnded || !servingTeam || playerPositionsA === null || playerPositionsB === null) return;

    setLoading(true);

    // Capture state *before* this point for history
    const stateBeforePoint = {
      servingTeam: servingTeam,
      serverIndex: currentServerIndex,
      playerPositionsA: playerPositionsA ? [...playerPositionsA] : null,
      playerPositionsB: playerPositionsB ? [...playerPositionsB] : null,
    };

    // --- Calculate next state ---
    let nextScoreA = currentScoreA;
    let nextScoreB = currentScoreB;
    if (teamScored === "A") nextScoreA++;
    else nextScoreB++;

    let nextServingTeam: "A" | "B";
    let nextServerIndex: number | null = null;
    let nextPlayerPositionsA = playerPositionsA ? [...playerPositionsA] : null;
    let nextPlayerPositionsB = playerPositionsB ? [...playerPositionsB] : null;
    let setCompleted = false;
    let gameComplete = false;
    let nextSet = currentSet;
    let nextSetScoresA = [...setScoresA];
    let nextSetScoresB = [...setScoresB];
    let nextSetsWon = { ...setsWon };
    let sideSwitchTriggered = false; // Track if side switch happens this point

    // Determine next server and positions
    if (teamScored === servingTeam) { // Serving team scored
      nextServingTeam = servingTeam;
      nextServerIndex = currentServerIndex; // Same server
      // Switch positions for serving team if doubles
      if (matchType === 'doubles') {
        if (servingTeam === 'A' && nextPlayerPositionsA) nextPlayerPositionsA = [nextPlayerPositionsA[1], nextPlayerPositionsA[0]];
        if (servingTeam === 'B' && nextPlayerPositionsB) nextPlayerPositionsB = [nextPlayerPositionsB[1], nextPlayerPositionsB[0]];
      }
    } else { // Receiving team scored (side out)
      nextServingTeam = teamScored;
      // Positions *don't* change on side out
      // Determine new server based on their score (which is nextScoreA/B)
      if (matchType === 'doubles') {
        const newServerScore = nextServingTeam === 'A' ? nextScoreA : nextScoreB;
        const positions = nextServingTeam === 'A' ? nextPlayerPositionsA : nextPlayerPositionsB;
        if (positions) {
          // Even score -> player on Right serves ([?, server_idx])
          // Odd score  -> player on Left serves ([server_idx, ?])
          nextServerIndex = (newServerScore % 2 === 0) ? positions[1] : positions[0];
        } else {
          nextServerIndex = 0; // Should not happen if positions are initialized
        }
      } else {
        nextServerIndex = 0; // Only one player
      }
    }

    // Check for side switch at 11 in the final set
    const finalSetNumber = 2; // Assuming best of 3
    const isFinalSet = currentSet === finalSetNumber;
    if (isFinalSet && !switchedSideMidSet && (nextScoreA === 11 || nextScoreB === 11) && nextScoreA !== nextScoreB) { // Ensure it only happens once when 11 is reached
      setLeftSideTeam(leftSideTeam === "A" ? "B" : "A");
      setSwitchedSideMidSet(true); // Mark that switch happened
      sideSwitchTriggered = true;
      console.log("Switching sides at 11");
    }

    // Check for set/game completion
    const scoreToWin = 21;
    const maxScore = 30;
    if ((nextScoreA >= scoreToWin || nextScoreB >= scoreToWin) && Math.abs(nextScoreA - nextScoreB) >= 2 || nextScoreA === maxScore || nextScoreB === maxScore) {
      setCompleted = true;
      const winner = nextScoreA > nextScoreB ? "A" : "B";
      nextSetScoresA[currentSet] = nextScoreA;
      nextSetScoresB[currentSet] = nextScoreB;
      nextSetsWon[winner]++;

      // Check game end (best of 3 sets)
      if (nextSetsWon.A >= 2 || nextSetsWon.B >= 2) {
        gameComplete = true;
      } else {
        // Start next set
        nextSet = currentSet + 1;
        nextScoreA = 0;
        nextScoreB = 0;
        // Reset mid-set switch flag
        setSwitchedSideMidSet(false);
        // Switch sides between sets
        setLeftSideTeam(leftSideTeam === "A" ? "B" : "A");
        sideSwitchTriggered = true; // Indicate side switch happened for state update

        // Reset positions for the new set
        nextPlayerPositionsA = matchType === 'doubles' ? [0, 1] : [0];
        nextPlayerPositionsB = matchType === 'doubles' ? [0, 1] : [0];

        // Determine who serves next set (winner of previous set serves first)
        nextServingTeam = winner; // Winner serves
        if (matchType === 'doubles') {
          // Server is player on the right (even score 0)
          nextServerIndex = winner === 'A' ? nextPlayerPositionsA[1] : nextPlayerPositionsB[1];
        } else {
          nextServerIndex = 0;
        }
      }
    }

    // --- Update State ---
    setCurrentScoreA(nextScoreA);
    setCurrentScoreB(nextScoreB);
    setServingTeam(nextServingTeam);
    setCurrentServerIndex(nextServerIndex);
    setPlayerPositionsA(nextPlayerPositionsA);
    setPlayerPositionsB(nextPlayerPositionsB);

    if (setCompleted) {
      setSetScoresA(nextSetScoresA);
      setSetScoresB(nextSetScoresB);
      setSetsWon(nextSetsWon);
      setCurrentSet(nextSet); // Update set number
      setCurrentScoreA(0); // Reset score for display if set ended but game continues
      setCurrentScoreB(0);
    }
    if (gameComplete) {
      setGameEnded(true);
      // Ensure final set scores are recorded even if game ends mid-set due to win condition
      const finalSetScoresA = [...nextSetScoresA];
      const finalSetScoresB = [...nextSetScoresB];
      if (finalSetScoresA[nextSet] === 0 && finalSetScoresB[nextSet] === 0) { // Avoid overwriting if set was fully played
        finalSetScoresA[currentSet] = nextScoreA; // record score when game ended
        finalSetScoresB[currentSet] = nextScoreB;
      }
      setSetScoresA(finalSetScoresA);
      setSetScoresB(finalSetScoresB);
    }


    // --- API Calls ---
    try {
      // 1. Save the point with the state *before* it was scored
      const pointPayload: Omit<PointData, 'id' | 'timestamp' | 'gameId'> & { gameId: string } = {
        gameId: gameId!,
        scoredBy: teamScored,
        scoreA: setCompleted ? 0 : nextScoreA, // Store score state for the *next* point start
        scoreB: setCompleted ? 0 : nextScoreB,
        setNumber: setCompleted ? nextSet : currentSet, // Store set number for the *next* point
        servingTeam: stateBeforePoint.servingTeam,
        serverIndex: stateBeforePoint.serverIndex,
        playerPositionsA: stateBeforePoint.playerPositionsA,
        playerPositionsB: stateBeforePoint.playerPositionsB,
      };
      const pointResponse = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pointPayload),
      });
      if (!pointResponse.ok) {
        const errorData = await pointResponse.json();
        throw new Error(errorData.error || "Failed to save point");
      }
      const newPoint: PointData = await pointResponse.json();
      // Add to local history (newest first)
      setPointHistory(prev => [newPoint, ...prev]);

      // 2. Update the overall game state
      const gameUpdatePayload = {
        scoreA: setCompleted ? 0 : nextScoreA, // Current score for the ongoing set
        scoreB: setCompleted ? 0 : nextScoreB,
        setScoresA: nextSetScoresA,
        setScoresB: nextSetScoresB,
        currentSet: nextSet,
        gameEnded: gameComplete,
        // We could store current server/positions here too, but deriving is often better
      };
      const gameResponse = await fetch(`/api/game?id=${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameUpdatePayload),
      });
      if (!gameResponse.ok) {
        const errorData = await gameResponse.json();
        throw new Error(errorData.error || "Failed to update game state");
      }
      // Update local playerInfo minimally if needed, but rely on fetchGameData for full refresh on undo/load
      if (playerInfo) {
        setPlayerInfo({
          ...playerInfo,
          scoreA: gameUpdatePayload.scoreA,
          scoreB: gameUpdatePayload.scoreB,
          setScoresA: gameUpdatePayload.setScoresA,
          setScoresB: gameUpdatePayload.setScoresB,
          currentSet: gameUpdatePayload.currentSet,
          gameEnded: gameUpdatePayload.gameEnded,
        });
      }


    } catch (error) {
      console.error("Error updating score:", error);
      setError(error instanceof Error ? error.message : "Failed to save score update");
      // TODO: Consider rolling back optimistic UI updates here
      // For simplicity, we might just refetch all data on error
      await fetchGameData(); // Refetch to sync with DB state after error
    } finally {
      setLoading(false);
    }
  };

  const handleFinishGame = async () => {
    if (!playerInfo || !gameEnded || userFinishedGame || !gameId) return;

    // Ensure final state is saved before navigating away
    setLoading(true);
    try {
      const finalGamePayload = {
        scoreA: currentScoreA, // Save the score at the moment game ended
        scoreB: currentScoreB,
        setScoresA: setScoresA,
        setScoresB: setScoresB,
        currentSet: currentSet,
        gameEnded: true,
      };
      const response = await fetch(`/api/game?id=${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalGamePayload),
      });
      if (!response.ok) {
        throw new Error("Failed to send final game state update.");
      }
      console.log("Final game state update sent successfully.");
      setUserFinishedGame(true); // Show the Game Over overlay

    } catch (error) {
      console.error("Error sending final game state update:", error);
      setError(error instanceof Error ? error.message : "Could not finalize game state.");
      // Don't show overlay if save failed? Or allow retry?
    } finally {
      setLoading(false);
    }
  };


  const handleUndo = async () => {
    if (loading || pointHistory.length === 0 || !gameId) return;
    setLoading(true);
    setError(null);

    try {
      const lastPoint = pointHistory[0]; // The point to remove

      // 1. Delete the last point record
      const deleteResponse = await fetch(`/api/points?id=${lastPoint.id}`, {
        method: "DELETE",
      });

      // Check status code for success (204 No Content or 200 OK)
      if (deleteResponse.status !== 204 && deleteResponse.status !== 200) {
        let errorMsg = "Failed to delete point";
        try { // Try to parse error json
          const errorData = await deleteResponse.json();
          errorMsg = errorData.error || errorMsg;
        } catch (_) { }
        throw new Error(`${errorMsg} (Status: ${deleteResponse.status})`);
      }

      // 2. Remove from local history
      const remainingHistory = pointHistory.slice(1);
      setPointHistory(remainingHistory);

      // 3. Determine the state *before* the undone point
      const pointBeforeUndone = remainingHistory.length > 0 ? remainingHistory[0] : null;

      let previousScoreA: number;
      let previousScoreB: number;
      let previousSet: number;
      let previousServingTeam: "A" | "B";
      let previousServerIndex: number | null;
      let previousPositionsA: number[] | null;
      let previousPositionsB: number[] | null;
      let previousSetScoresA = [...setScoresA];
      let previousSetScoresB = [...setScoresB];
      let previousGameEnded = false; // Assume game continues unless proven otherwise

      if (pointBeforeUndone) {
        // Revert to the state saved *in the point before the one we just deleted*
        // The scores in `pointBeforeUndone` are the scores *after* that point was made.
        previousScoreA = pointBeforeUndone.scoreA;
        previousScoreB = pointBeforeUndone.scoreB;
        previousSet = pointBeforeUndone.setNumber;

        // The server/positions *for the next point* after pointBeforeUndone need to be recalculated based on its outcome
        const scorer = pointBeforeUndone.scoredBy;
        const lastServingTeam = pointBeforeUndone.servingTeam;

        if (scorer === lastServingTeam) { // Serving team won pointBeforeUndone
          previousServingTeam = lastServingTeam;
          previousServerIndex = pointBeforeUndone.serverIndex;
          previousPositionsA = pointBeforeUndone.playerPositionsA ? [...pointBeforeUndone.playerPositionsA] : null;
          previousPositionsB = pointBeforeUndone.playerPositionsB ? [...pointBeforeUndone.playerPositionsB] : null;
          // Positions need to be swapped back for the serving team
          if (matchType === 'doubles') {
            if (previousServingTeam === 'A' && previousPositionsA) previousPositionsA = [previousPositionsA[1], previousPositionsA[0]];
            if (previousServingTeam === 'B' && previousPositionsB) previousPositionsB = [previousPositionsB[1], previousPositionsB[0]];
          }

        } else { // Receiving team won pointBeforeUndone (side out)
          previousServingTeam = scorer;
          previousPositionsA = pointBeforeUndone.playerPositionsA ? [...pointBeforeUndone.playerPositionsA] : null; // Positions didn't change on side out
          previousPositionsB = pointBeforeUndone.playerPositionsB ? [...pointBeforeUndone.playerPositionsB] : null;
          // Calculate server based on score *after* pointBeforeUndone
          const newServerScore = previousServingTeam === 'A' ? pointBeforeUndone.scoreA : pointBeforeUndone.scoreB;
          if (matchType === 'doubles') {
            const positions = previousServingTeam === 'A' ? previousPositionsA : previousPositionsB;
            if (positions) previousServerIndex = (newServerScore % 2 === 0) ? positions[1] : positions[0];
            else previousServerIndex = 0;
          } else {
            previousServerIndex = 0;
          }
        }

      } else {
        // No points left, revert to the initial game state (0-0, set 0)
        previousScoreA = 0;
        previousScoreB = 0;
        previousSet = 0;
        previousServingTeam = playerInfo?.firstServer === 0 ? "A" : "B";
        previousServerIndex = 0;
        previousPositionsA = matchType === 'doubles' ? [0, 1] : [0];
        previousPositionsB = matchType === 'doubles' ? [0, 1] : [0];
      }

      // Check if the undone point completed a set
      const undonePointSetNumber = lastPoint.setNumber;
      const wasSetCompleted = (lastPoint.scoreA === 0 && lastPoint.scoreB === 0 && undonePointSetNumber > 0); // Heuristic: Did score reset?
      // More robust: Check if scores in lastPoint met set win conditions
      const setWinScore = 21; const setMaxScore = 30;
      const didAWinSet = (lastPoint.scoreA >= setWinScore || lastPoint.scoreA === setMaxScore) && (lastPoint.scoreA - lastPoint.scoreB >= 2 || lastPoint.scoreA === setMaxScore);
      const didBWinSet = (lastPoint.scoreB >= setWinScore || lastPoint.scoreB === setMaxScore) && (lastPoint.scoreB - lastPoint.scoreA >= 2 || lastPoint.scoreB === setMaxScore);

      if (didAWinSet || didBWinSet) {
        // The undone point finished a set. We need to revert the set scores.
        // We also need to revert to the score *before* the set ended.
        // Find the last point *of that specific set*
        const lastPointOfPreviousSet = remainingHistory.find(p => p.setNumber === undonePointSetNumber - 1); // Actually set number before reset
        if (lastPointOfPreviousSet) {
          previousScoreA = lastPointOfPreviousSet.scoreA;
          previousScoreB = lastPointOfPreviousSet.scoreB;
          previousSet = lastPointOfPreviousSet.setNumber; // Set number should be correct
        } else if (undonePointSetNumber > 0) { // Edge case: first point of set 1 finished it? Unlikely. Revert to 0-0 of prev set
          const prevSetIdx = undonePointSetNumber - 1;
          previousScoreA = previousSetScoresA[prevSetIdx] ?? 0; // Score from end of actual previous set
          previousScoreB = previousSetScoresB[prevSetIdx] ?? 0;
          previousSet = prevSetIdx;
        }

        // Clear the scores for the set that was just 'undone'
        previousSetScoresA[undonePointSetNumber] = 0;
        previousSetScoresB[undonePointSetNumber] = 0;

        // Recalculate sets won
        const setsA = previousSetScoresA.filter((s, i) => s > previousSetScoresB[i] && (s >= setWinScore || s == setMaxScore)).length;
        const setsB = previousSetScoresB.filter((s, i) => s > previousSetScoresA[i] && (s >= setWinScore || s == setMaxScore)).length;
        setSetsWon({ A: setsA, B: setsB });
      } else if (wasSetCompleted) {
        // If the set was completed but not won (e.g., score reset), we still need to clear the set scores
        previousSetScoresA[undonePointSetNumber] = 0;
        previousSetScoresB[undonePointSetNumber] = 0;
      }

      // If we're undoing from a later set, we need to preserve the scores from previous sets
      if (undonePointSetNumber > 0) {
        // Find the last point of the previous set to get its final score
        const lastPointOfPreviousSet = remainingHistory.find(p => p.setNumber === undonePointSetNumber - 1);
        if (lastPointOfPreviousSet) {
          // Update the previous set's score with the final score from that set
          previousSetScoresA[undonePointSetNumber - 1] = lastPointOfPreviousSet.scoreA;
          previousSetScoresB[undonePointSetNumber - 1] = lastPointOfPreviousSet.scoreB;
        }
      }

      // Check if the undone point ended the game
      const wasGameCompleted = gameEnded; // Check state *before* this undo
      if (wasGameCompleted) {
        previousGameEnded = false; // Undo means game is no longer ended
        setUserFinishedGame(false); // Hide overlay if shown
      }


      // 4. Update Game state via API
      const gameUpdatePayload = {
        scoreA: previousScoreA,
        scoreB: previousScoreB,
        setScoresA: previousSetScoresA,
        setScoresB: previousSetScoresB,
        currentSet: previousSet,
        gameEnded: previousGameEnded,
        // Maybe update server/positions in Game model too? Depends on design.
      };

      const gameResponse = await fetch(`/api/game?id=${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameUpdatePayload),
      });
      if (!gameResponse.ok) {
        throw new Error("Failed to update game state after undo");
      }

      // 5. Update local state fully (important after complex undo)
      setCurrentScoreA(previousScoreA);
      setCurrentScoreB(previousScoreB);
      setCurrentSet(previousSet);
      setSetScoresA(previousSetScoresA);
      setSetScoresB(previousSetScoresB);
      setGameEnded(previousGameEnded);
      setServingTeam(previousServingTeam);
      setCurrentServerIndex(previousServerIndex);
      setPlayerPositionsA(previousPositionsA);
      setPlayerPositionsB(previousPositionsB);

      // Recalculate sides (might have changed due to set change or 11-point undo)
      const startSideA = playerInfo?.startingSide === "Left" ? "A" : "B";
      const shouldSwitchForSet = previousSet % 2 !== 0;
      let currentLeftSide: "A" | "B" = shouldSwitchForSet ? (startSideA === "A" ? "B" : "A") : startSideA;

      const finalSetNumber = 2;
      const isFinalSet = previousSet === finalSetNumber;
      // Check if 11 was reached in the final set *after* undoing
      const pointAt11AfterUndo = remainingHistory.find(p => p.setNumber === previousSet && (p.scoreA === 11 || p.scoreB === 11));
      const didSwitchAt11AfterUndo = !!pointAt11AfterUndo;
      setSwitchedSideMidSet(didSwitchAt11AfterUndo);

      if (isFinalSet && didSwitchAt11AfterUndo) {
        currentLeftSide = currentLeftSide === "A" ? "B" : "A"; // Apply the 11-switch if it should be active
      }

      // Only update leftSideTeam if it's different from current
      if (currentLeftSide !== leftSideTeam) {
        setLeftSideTeam(currentLeftSide);
      }

      // Recalculate setsWon just in case set completion logic above missed edge cases
      const setsA = previousSetScoresA.filter((s, i) => s > previousSetScoresB[i] && (s >= setWinScore || s == setMaxScore)).length;
      const setsB = previousSetScoresB.filter((s, i) => s > previousSetScoresA[i] && (s >= setWinScore || s == setMaxScore)).length;
      setSetsWon({ A: setsA, B: setsB });


      // Refetch might be simplest to ensure perfect sync, but let's try without first
      // await fetchGameData();

    } catch (error) {
      console.error("Error performing undo:", error);
      setError(error instanceof Error ? error.message : "Undo failed");
      // Consider fetching game data to resync after a failed undo attempt
      await fetchGameData();
    } finally {
      setLoading(false);
    }
  };

  // --- Helper to get player name based on team and index ---
  const getPlayerName = (team: 'A' | 'B', index: number | null): string => {
    if (!playerInfo || index === null) return '?';
    const players = team === 'A' ? playerInfo.playersA : playerInfo.playersB;
    return players?.[index] || '?';
  }

  // --- Determine Server Position ---
  // Returns 'Left' or 'Right' for the *current server* based on rules
  const getServerCourtPosition = (): 'Left' | 'Right' | null => {
    if (!servingTeam) return null;

    const serverScore = servingTeam === 'A' ? currentScoreA : currentScoreB;

    // Official Rule:
    // Score Even (0, 2, 4...) -> Serve from RIGHT service court
    // Score Odd (1, 3, 5...) -> Serve from LEFT service court
    if (serverScore % 2 === 0) {
      return 'Right'; // Even score -> Right court
    } else {
      return 'Left';  // Odd score -> Left court
    }
  };


  // --- Rendering ---
  if (loading && !playerInfo) { // Show loading only on initial load
    return <div className="h-screen flex items-center justify-center bg-black text-white text-2xl">Loading game...</div>;
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <p className="text-red-400 text-2xl mb-4">Error: {error}</p>
        <button
          onClick={() => fetchGameData()} // Allow retry
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-lg"
        >
          Retry Load
        </button>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-lg"
        >
          Go Home
        </button>
      </div>
    );
  }
  if (!playerInfo) {
    return <div className="h-screen flex items-center justify-center bg-black text-white text-2xl">Game data not available. (ID: {gameId})</div>;
  }
  const playerIndicesInQuads: (number | null)[] = [null, null, null, null];
  const playerTeamsInQuads: (('A' | 'B' | null))[] = [null, null, null, null]; // Track team for highlighting

  if (playerInfo && playerPositionsA && playerPositionsB) { // Ensure state is ready
    const posA = playerPositionsA; // e.g., [0, 1] -> Player 0 is Left, Player 1 is Right relative to Team A
    const posB = playerPositionsB;

    const leftTeamPos = leftSideTeam === 'A' ? posA : posB;
    const rightTeamPos = rightSideTeam === 'A' ? posA : posB;

    if (matchType === 'doubles') {
      // --- Doubles Placement ---
      const serverCourtPos = getServerCourtPosition(); // Get server's court position

      // Place players based on their team's relative positions onto the physical sides
      if (leftTeamPos) {
        if (servingTeam === leftSideTeam) {
          // Server is on left team
          if (serverCourtPos === 'Right') {
            // Server should be in Bottom-Left (quad 1)
            playerIndicesInQuads[1] = currentServerIndex;
            playerTeamsInQuads[1] = leftSideTeam;
            // Other player goes to Top-Left (quad 0)
            playerIndicesInQuads[0] = currentServerIndex === leftTeamPos[0] ? leftTeamPos[1] : leftTeamPos[0];
            playerTeamsInQuads[0] = leftSideTeam;
          } else {
            // Server should be in Top-Left (quad 0)
            playerIndicesInQuads[0] = currentServerIndex;
            playerTeamsInQuads[0] = leftSideTeam;
            // Other player goes to Bottom-Left (quad 1)
            playerIndicesInQuads[1] = currentServerIndex === leftTeamPos[0] ? leftTeamPos[1] : leftTeamPos[0];
            playerTeamsInQuads[1] = leftSideTeam;
          }
        } else {
          // Non-serving team on left - place in standard positions
          playerIndicesInQuads[0] = leftTeamPos[0]; // Left player in Top-Left
          playerTeamsInQuads[0] = leftSideTeam;
          playerIndicesInQuads[1] = leftTeamPos[1]; // Right player in Bottom-Left
          playerTeamsInQuads[1] = leftSideTeam;
        }
      }
      if (rightTeamPos) {
        if (servingTeam === rightSideTeam) {
          // Server is on right team
          if (serverCourtPos === 'Right') {
            // Server should be in Top-Right (quad 2)
            playerIndicesInQuads[2] = currentServerIndex;
            playerTeamsInQuads[2] = rightSideTeam;
            // Other player goes to Bottom-Right (quad 3)
            playerIndicesInQuads[3] = currentServerIndex === rightTeamPos[0] ? rightTeamPos[1] : rightTeamPos[0];
            playerTeamsInQuads[3] = rightSideTeam;
          } else {
            // Server should be in Bottom-Right (quad 3)
            playerIndicesInQuads[3] = currentServerIndex;
            playerTeamsInQuads[3] = rightSideTeam;
            // Other player goes to Top-Right (quad 2)
            playerIndicesInQuads[2] = currentServerIndex === rightTeamPos[0] ? rightTeamPos[1] : rightTeamPos[0];
            playerTeamsInQuads[2] = rightSideTeam;
          }
        } else {
          // Non-serving team on right - place in standard positions
          playerIndicesInQuads[2] = rightTeamPos[0]; // Left player in Top-Right
          playerTeamsInQuads[2] = rightSideTeam;
          playerIndicesInQuads[3] = rightTeamPos[1]; // Right player in Bottom-Right
          playerTeamsInQuads[3] = rightSideTeam;
        }
      }
    } else {
      // --- Singles Placement ---
      const serverCourtPos = getServerCourtPosition(); // 'Left' or 'Right' box server uses

      if (servingTeam === leftSideTeam) { // Server is on the physical Left
        if (serverCourtPos === 'Right') {
          // Even score - Server on right half of their side (Bottom-Left quadrant)
          playerIndicesInQuads[1] = 0; // Server in Bottom-Left
          playerTeamsInQuads[1] = leftSideTeam;
          playerIndicesInQuads[2] = 0; // Receiver in Top-Right (Diagonal)
          playerTeamsInQuads[2] = rightSideTeam;
        } else { // Server 'Left'
          // Odd score - Server on left half of their side (Top-Left quadrant)
          playerIndicesInQuads[0] = 0; // Server in Top-Left
          playerTeamsInQuads[0] = leftSideTeam;

          playerIndicesInQuads[3] = 0; // Receiver in Bottom-Right (Diagonal)
          playerTeamsInQuads[3] = rightSideTeam;
        }
      } else { // Server is on the physical Right
        if (serverCourtPos === 'Right') {
          // Even score - Server on right half of their side (Top-Right quadrant)
          playerIndicesInQuads[2] = 0; // Server in Top-Right
          playerTeamsInQuads[2] = rightSideTeam;

          playerIndicesInQuads[1] = 0; // Receiver in Bottom-Left (Diagonal)
          playerTeamsInQuads[1] = leftSideTeam;
        } else { // Server 'Left'
          // Odd score - Server on left half of their side (Bottom-Right quadrant)
          playerIndicesInQuads[3] = 0; // Server in Bottom-Right
          playerTeamsInQuads[3] = rightSideTeam;
          playerIndicesInQuads[0] = 0; // Receiver in Top-Left (Diagonal)
          playerTeamsInQuads[0] = leftSideTeam;
        }
      }
    }
  }

  const isServer = (quadIndex: number): boolean => {
    const team = playerTeamsInQuads[quadIndex];
    const index = playerIndicesInQuads[quadIndex];
    return team === servingTeam && index === currentServerIndex;
  }
  const getPlayerNameForQuad = (quadIndex: number): string => {
    const team = playerTeamsInQuads[quadIndex];
    const index = playerIndicesInQuads[quadIndex];
    if (!playerInfo || team === null || index === null) return ''; // Return empty if no player
    const players = team === 'A' ? playerInfo.playersA : playerInfo.playersB;
    return players?.[index] || '?';
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans">
      {userFinishedGame && (
        <div className="absolute inset-0 bg-black bg-opacity-85 z-10 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Game Over</h1>
          <h2 className="text-3xl md:text-4xl mb-4">
            {setsWon.A > setsWon.B ? playerInfo.teamA : playerInfo.teamB} Wins!
          </h2>
          <div className="text-xl md:text-2xl mb-8">
            Final Score:
            {setScoresA.map((sA, i) => ((sA > 0 || setScoresB[i] > 0) ? ` ${sA}-${setScoresB[i]}` : "")).join(' , ')}
            ({setsWon.A} - {setsWon.B} sets)
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg md:text-xl font-bold"
          >
            New Game
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="pt-2 pb-1 text-center text-sm md:text-base">
        <p>Set {currentSet + 1} {matchType === 'doubles' ? <FaUsers className="inline mx-1" /> : <FaUser className="inline mx-1" />} {matchType}</p>
        {servingTeam && <p>Serving: Team {servingTeam} ({getPlayerName(servingTeam, currentServerIndex)}) from {getServerCourtPosition()} court</p>}
      </div>


      {/* Main Court Area */}
      <div className="flex-1 flex justify-center items-center relative px-2 py-2">
        {/* Left Score Button */}
        <button
          className="absolute left-20 top-1/2 transform -translate-y-1/2 text-white text-2xl md:text-4xl font-extrabold bg-gray-600 px-3 py-4 md:px-5 md:py-8 rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed z-10"
          onClick={() => handleScoreIncrement(leftSideTeam)}
          disabled={loading || gameEnded || userFinishedGame}
          title={`Score for ${leftSideTeam === 'A' ? playerInfo.teamA : playerInfo.teamB}`}
        >
          +1
        </button>

        {/* Court SVG */}
        <div className="w-full h-full max-w-4xl max-h-[70vh] aspect-[0.8] md:aspect-[1.2] flex justify-center items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Court Lines */}
            <rect x="0" y="0" width="100%" height="100%" fill="green" stroke="white" strokeWidth="0.5%" />

            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="0.5%" strokeDasharray="5,5" />

            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="0.5%" />

            <line x1="0" y1="8%" x2="100%" y2="8%" stroke="white" strokeWidth="0.5%" />

            <line x1="0" y1="92%" x2="100%" y2="92%" stroke="white" strokeWidth="0.5%" />

            <line x1="7.5%" y1="0" x2="7.5%" y2="100%" stroke="white" strokeWidth="0.5%" />

            <line x1="92.5%" y1="0" x2="92.5%" y2="100%" stroke="white" strokeWidth="0.5%" />

            <line x1="32.5%" y1="8%" x2="32.5%" y2="92%" stroke="white" strokeWidth="0.5%" />

            <line x1="67.5%" y1="8%" x2="67.5%" y2="92%" stroke="white" strokeWidth="0.5%" />


            {/* Player Names / Positions */}
            {playerInfo && (
              <>
                {/* Top-Left Quadrant (Quad Index 0) */}
                <text x="25%" y="25%" fill={isServer(0) ? "yellow" : "white"} fontSize="25" textAnchor="middle" dominantBaseline="middle" fontWeight={isServer(0) ? "bold" : "normal"}>
                  {getPlayerNameForQuad(0)}
                  {isServer(0) ? ' (S)' : ''}
                </text>
                {/* Bottom-Left Quadrant (Quad Index 1) */}
                <text x="25%" y="75%" fill={isServer(1) ? "yellow" : "white"} fontSize="25" textAnchor="middle" dominantBaseline="middle" fontWeight={isServer(1) ? "bold" : "normal"}>
                  {getPlayerNameForQuad(1)}
                  {isServer(1) ? ' (S)' : ''}
                </text>
                {/* Top-Right Quadrant (Quad Index 2) */}
                <text x="75%" y="25%" fill={isServer(2) ? "yellow" : "white"} fontSize="25" textAnchor="middle" dominantBaseline="middle" fontWeight={isServer(2) ? "bold" : "normal"}>
                  {getPlayerNameForQuad(2)}
                  {isServer(2) ? ' (S)' : ''}
                </text>
                {/* Bottom-Right Quadrant (Quad Index 3) */}
                <text x="75%" y="75%" fill={isServer(3) ? "yellow" : "white"} fontSize="25" textAnchor="middle" dominantBaseline="middle" fontWeight={isServer(3) ? "bold" : "normal"}>
                  {getPlayerNameForQuad(3)}
                  {isServer(3) ? ' (S)' : ''}
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Right Score Button */}
        <button
          className="absolute right-20 top-1/2 transform -translate-y-1/2 text-white text-2xl md:text-4xl font-extrabold bg-gray-600 px-3 py-4 md:px-5 md:py-8 rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed z-10"
          onClick={() => handleScoreIncrement(rightSideTeam)}
          disabled={loading || gameEnded || userFinishedGame}
          title={`Score for ${rightSideTeam === 'A' ? playerInfo.teamA : playerInfo.teamB}`}
        >
          +1
        </button>

        {/* Undo Button - Centered Bottom */}
        <button
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-lg md:text-xl font-bold bg-gray-700 px-4 py-2 md:px-5 md:py-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 z-10"
          onClick={handleUndo}
          disabled={loading || pointHistory.length === 0 || userFinishedGame}
        >
          <FaUndo />
          Undo
        </button>
      </div>


      {/* Scoreboard Area */}
      <div className="flex flex-col lg:flex-row justify-center items-center mb-4 px-2 gap-4 lg:gap-8">
        {/* Current Score */}
        <div className="text-center border border-gray-600 p-3 rounded-lg shadow-md bg-gray-800 w-full max-w-xs lg:max-w-sm">
          <div className="text-4xl md:text-6xl font-bold mb-2">
            <span className={leftSideTeam === 'A' ? 'text-blue-400' : 'text-red-400'}>{currentScoreA}</span>
            <span className="mx-2 md:mx-4">:</span>
            <span className={leftSideTeam === 'B' ? 'text-blue-400' : 'text-red-400'}>{currentScoreB}</span>
          </div>
          <div className="text-sm md:text-base text-gray-300">
            <span className={leftSideTeam === 'A' ? 'text-blue-400 font-semibold' : 'text-red-400 font-semibold'}>{playerInfo.teamA}</span>
            <span className="mx-2">vs</span>
            <span className={leftSideTeam === 'B' ? 'text-blue-400 font-semibold' : 'text-red-400 font-semibold'}>{playerInfo.teamB}</span>
          </div>
        </div>

        {/* Set Scores Table */}
        <div className="w-full max-w-md lg:max-w-lg overflow-x-auto">
          <table className="w-full border border-gray-600 text-white text-sm md:text-base text-center bg-gray-800 rounded-lg shadow-md">
            <thead className="bg-gray-700">
              <tr>
                <th className="border border-gray-600 px-2 py-1 md:px-4 md:py-2">Team</th>
                <th className="border border-gray-600 px-2 py-1 md:px-3 md:py-2">S1</th>
                <th className="border border-gray-600 px-2 py-1 md:px-3 md:py-2">S2</th>
                <th className="border border-gray-600 px-2 py-1 md:px-3 md:py-2">S3</th>
                <th className="border border-gray-600 px-2 py-1 md:px-4 md:py-2 font-semibold">Sets</th>
              </tr>
            </thead>
            <tbody>
              <tr className={leftSideTeam === 'A' ? 'bg-blue-900 bg-opacity-50' : 'bg-red-900 bg-opacity-50'}>
                <td className="border border-gray-600 px-2 py-1 md:px-4 md:py-2 font-medium">{playerInfo.teamA}</td>
                <td className="border border-gray-600 px-2 py-1 md:px-3 md:py-2">{setScoresA[0] > 0 || setScoresB[0] > 0 ? setScoresA[0] : '-'}</td>
                <td className="border border-gray-600 px-2 py-1 md:px-3 md:py-2">{setScoresA[1] > 0 || setScoresB[1] > 0 ? setScoresA[1] : '-'}</td>
                <td className="border border-gray-600 px-2 py-1 md:px-3 md:py-2">{setScoresA[2] > 0 || setScoresB[2] > 0 ? setScoresA[2] : '-'}</td>
                <td className="border border-gray-600 px-2 py-1 md:px-4 md:py-2 font-bold">{setsWon.A}</td>
              </tr>
              <tr className={leftSideTeam === 'B' ? 'bg-blue-900 bg-opacity-50' : 'bg-red-900 bg-opacity-50'}>
                <td className="border border-gray-600 px-2 py-1 md:px-4 md:py-2 font-medium">{playerInfo.teamB}</td>
                <td className="border border-gray-600 px-2 py-1 md:px-3 md:py-2">{setScoresA[0] > 0 || setScoresB[0] > 0 ? setScoresB[0] : '-'}</td>
                <td className="border border-gray-600 px-2 py-1 md:px-3 md:py-2">{setScoresA[1] > 0 || setScoresB[1] > 0 ? setScoresB[1] : '-'}</td>
                <td className="border border-gray-600 px-2 py-1 md:px-3 md:py-2">{setScoresA[2] > 0 || setScoresB[2] > 0 ? setScoresB[2] : '-'}</td>
                <td className="border border-gray-600 px-2 py-1 md:px-4 md:py-2 font-bold">{setsWon.B}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Finish Game Button */}
      <button
        className="absolute bottom-4 right-4 text-white text-xl md:text-2xl font-bold bg-green-600 px-6 py-3 md:px-8 md:py-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-green-700 cursor-pointer z-10"
        onClick={handleFinishGame}
        disabled={!gameEnded || userFinishedGame || loading}
        title={!gameEnded ? "Game must be over first" : "Finish Game"}
      >
        <FaCheck />
        Finish
      </button>

    </div>
  );
};

export default BadmintonPage;