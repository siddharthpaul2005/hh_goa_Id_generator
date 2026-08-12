import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const filename = `hh-goa-2026-builder-id-${Date.now()}.png`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: "public",
      contentType: "image/png",
    });

    // Create unique share id (using pathname hash / timestamp)
    const id = blob.url.split("/").pop() || `${Date.now()}`;

    return NextResponse.json({
      success: true,
      url: blob.url,
      id: encodeURIComponent(id),
    });
  } catch (error) {
    console.error("Vercel Blob upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image blob" },
      { status: 500 }
    );
  }
}
