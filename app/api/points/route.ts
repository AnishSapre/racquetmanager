// app/api/points/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from 'zod'; // Using zod for validation

const prisma = new PrismaClient();

// GET handler - retrieve point history for a game
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const pointId = searchParams.get("id"); // For fetching a single point (optional)
    const latest = searchParams.get("latest"); // Flag to get only the most recent point

    if (pointId) {
      // Get a specific point by ID
      const point = await prisma.point.findUnique({
        where: { id: pointId }
      });
      if (!point) {
         return NextResponse.json({ error: "Point not found" }, { status: 404 });
      }
      return NextResponse.json(point);
    }

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    if (latest === 'true') {
       // Get only the most recent point for a game
       const latestPoint = await prisma.point.findFirst({
         where: { gameId },
         orderBy: { timestamp: "desc" }
       });
       return NextResponse.json(latestPoint); // Will be null if no points exist
    }

    // Get all points for a game, ordered by timestamp descending (newest first)
    const points = await prisma.point.findMany({
      where: { gameId },
      orderBy: { timestamp: "desc" }
    });

    return NextResponse.json(points);
  } catch (error) {
    console.error("Error fetching points:", error);
    return NextResponse.json(
      { error: "Failed to fetch points" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


// Validation schema for creating a point
const createPointSchema = z.object({
  gameId: z.string().min(1),
  scoredBy: z.enum(['A', 'B']),
  scoreA: z.number().int().min(0),
  scoreB: z.number().int().min(0),
  setNumber: z.number().int().min(0),
  // State before the point
  servingTeam: z.enum(['A', 'B']),
  serverIndex: z.number().int().min(0).optional().nullable(), // Optional for singles
  playerPositionsA: z.array(z.number().int()).optional().nullable(),
  playerPositionsB: z.array(z.number().int()).optional().nullable(),
});


// POST handler - create a new point
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createPointSchema.safeParse(body);

    if (!validation.success) {
       console.error("Validation Error:", validation.error.errors);
       return NextResponse.json(
         { error: "Invalid request body", details: validation.error.errors },
         { status: 400 }
       );
    }

    const {
        gameId,
        scoredBy,
        scoreA,
        scoreB,
        setNumber,
        servingTeam,
        serverIndex,
        playerPositionsA,
        playerPositionsB
    } = validation.data;


    const point = await prisma.point.create({
      data: {
        gameId,
        scoredBy,
        scoreA, // Score *after* this point
        scoreB, // Score *after* this point
        setNumber,
        // State *before* point / leading to this score
        servingTeam,
        serverIndex,
        playerPositionsA: playerPositionsA ? JSON.parse(JSON.stringify(playerPositionsA)) : null, // Ensure JSON storage
        playerPositionsB: playerPositionsB ? JSON.parse(JSON.stringify(playerPositionsB)) : null, // Ensure JSON storage
      }
    });

    return NextResponse.json(point, { status: 201 }); // Use 201 for created
  } catch (error) {
    console.error("Error creating point:", error);
    // Check for specific Prisma errors if needed
    return NextResponse.json(
      { error: "Failed to create point" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE handler - delete a point
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pointId = searchParams.get("id");

    if (!pointId) {
      return NextResponse.json(
        { error: "Point ID is required" },
        { status: 400 }
      );
    }

     // Optional: Check if the point exists before deleting
     const existingPoint = await prisma.point.findUnique({ where: { id: pointId } });
     if (!existingPoint) {
        return NextResponse.json({ error: "Point not found" }, { status: 404 });
     }

    await prisma.point.delete({
      where: { id: pointId }
    });

    // Return 204 No Content for successful deletion is common practice
    return new NextResponse(null, { status: 204 });
    // Or return success: true if preferred by the client
    // return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting point:", error);
     // Handle potential errors like foreign key constraints if needed
    return NextResponse.json(
      { error: "Failed to delete point" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}