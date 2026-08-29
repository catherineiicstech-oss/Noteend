import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/errors";

/// Single place where thrown domain errors become HTTP responses, so route
/// handlers never leak stack traces or internal messages to clients.
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Please check the form and try again", issues: error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Unhandled API error", error);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
