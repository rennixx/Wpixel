import { NextRequest, NextResponse } from "next/server";
import type { EnhanceRequest, EnhanceResponse } from "@/lib/types/drawing";

// Style presets
const stylePrompts: Record<string, string> = {
  neon: "Transform this drawing with vibrant neon colors and glowing edges. Keep the composition intact but add cyberpunk-style neon lighting effects.",
  oil: "Transform this drawing into an oil painting with visible thick brushstrokes in impressionist style. Maintain the original composition.",
  pixel: "Convert this drawing into 8-bit retro pixel art style. Reduce colors and create clear pixel boundaries while preserving the design.",
  sketch: "Transform this drawing into a pencil sketch with realistic shading. Add cross-hatching and subtle gradients.",
};

export async function POST(request: NextRequest) {
  try {
    const body: EnhanceRequest = await request.json();
    const { image, style } = body;

    // Validate input
    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    if (!style) {
      return NextResponse.json(
        { success: false, error: "No style specified" },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Return mock response for development
      console.log("[AI Enhance] No API key configured, returning mock response");
      
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return NextResponse.json({
        success: true,
        enhancedImage: image, // Return original image as mock
        cost: 0,
        message: "Mock enhancement (no API key configured)",
      });
    }

    // Determine the prompt
    const prompt = stylePrompts[style.toLowerCase()] || 
      `Transform this drawing into ${style} style. Keep the same composition and elements, but apply the artistic style. Output should maintain the original aspect ratio.`;

    try {
      // Call OpenAI API
      // Using DALL-E 3 for image generation based on description
      // Note: GPT-4 Vision can analyze but not generate images
      // For true image-to-image, you'd use a service like Stability AI

      // For MVP, we'll use DALL-E with a description approach
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[AI Enhance] OpenAI API error:", errorData);
        
        // Return original image on API error
        return NextResponse.json({
          success: true,
          enhancedImage: image,
          cost: 0,
          message: "Enhancement unavailable, using original",
        });
      }

      const data = await response.json();
      const enhancedBase64 = data.data[0].b64_json;

      const enhanceResponse: EnhanceResponse = {
        success: true,
        enhancedImage: `data:image/png;base64,${enhancedBase64}`,
        cost: 0.04, // Approximate DALL-E 3 cost
      };

      return NextResponse.json(enhanceResponse);
    } catch (apiError) {
      console.error("[AI Enhance] API call failed:", apiError);
      
      // Return original image on error
      return NextResponse.json({
        success: true,
        enhancedImage: image,
        cost: 0,
        message: "Enhancement failed, using original",
      });
    }
  } catch (error) {
    console.error("[AI Enhance] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
