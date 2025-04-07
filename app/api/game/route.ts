import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    const game = await prisma.game.findUnique({
      where: { id }
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchType, playerNames, firstServer, startingSide } = body;

    if (!matchType || !playerNames || !Array.isArray(playerNames) || firstServer === undefined || !startingSide) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const game = await prisma.game.create({
      data: {
        id,
        matchType,
        playerNames: JSON.stringify(playerNames),
        firstServer,
        startingSide,
        scoreA: 0,
        scoreB: 0,
        setScoresA: JSON.stringify([0, 0, 0]),
        setScoresB: JSON.stringify([0, 0, 0]),
        currentSet: 0,
        gameEnded: false
      }
    });

    return NextResponse.json({ id: game.id });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    // Extract the fields that need to be updated
    const updateData: any = {};
    if (body.sport !== undefined) updateData.sport = body.sport;
    if (body.scoreA !== undefined) updateData.scoreA = body.scoreA;
    if (body.scoreB !== undefined) updateData.scoreB = body.scoreB;
    if (body.setScoresA !== undefined) updateData.setScoresA = JSON.stringify(body.setScoresA);
    if (body.setScoresB !== undefined) updateData.setScoresB = JSON.stringify(body.setScoresB);
    if (body.currentSet !== undefined) updateData.currentSet = body.currentSet;
    if (body.gameEnded !== undefined) updateData.gameEnded = body.gameEnded;
    if (body.winner !== undefined) updateData.winner = body.winner;

    const game = await prisma.game.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error updating game:", error);
    return NextResponse.json(
      { error: "Failed to update game" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    await prisma.game.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { error: "Failed to delete game" },
      { status: 500 }
    );
  }
}