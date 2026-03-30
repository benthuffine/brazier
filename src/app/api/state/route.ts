import { NextRequest, NextResponse } from "next/server";

import { getOptionalSessionUser } from "@/lib/server/auth";
import { applyMutation, getAppState } from "@/lib/server/app-state-store";
import { AppMutation } from "@/lib/types";

export const dynamic = "force-dynamic";

function jsonResponse(body: unknown) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET() {
  const user = await getOptionalSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return jsonResponse(getAppState(user.id));
}

export async function PATCH(request: NextRequest) {
  const user = await getOptionalSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mutation = (await request.json()) as AppMutation;

  try {
    return jsonResponse(applyMutation(user, mutation));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (error.message === "premium_required") {
        return NextResponse.json(
          { error: "Premium feature" },
          { status: 403 }
        );
      }

      if (error.message === "pathway_limit") {
        return NextResponse.json(
          { error: "Starter users can save one pathway." },
          { status: 409 }
        );
      }
    }

    throw error;
  }
}
