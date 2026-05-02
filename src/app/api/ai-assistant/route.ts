import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const text = prompt.toLowerCase();
    
    // Check for API key
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `You are an AI order intake assistant for a laundry POS system.
        Parse the user's natural language input into a structured JSON format.
        Identify the customer's name, the items they want to clean, and the service type.
        
        Valid item types are: "shirt", "pants", "jean", "dress", "suit". Map synonyms appropriately.
        Service is either "Express" or "Standard". If the user mentions fast, quick, urgent, or express, it is "Express". Otherwise "Standard".
        
        Return ONLY valid JSON in the exact following structure without markdown blocks:
        {
          "customer": "Name of customer or 'Guest' if unknown",
          "items": [
            { "type": "shirt|pants|jean|dress|suit", "qty": number }
          ],
          "isExpress": boolean
        }`;

        const result = await model.generateContent(systemInstruction + "\n\nUser Input: " + text);
        let rawResponse = result.response.text();
        
        // Remove potential markdown blocks
        rawResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const parsed = JSON.parse(rawResponse);
        
        return processParsedOrder(parsed.customer, parsed.items, parsed.isExpress);
      } catch (geminiError) {
        console.error("Gemini Parsing Error:", geminiError);
        // Fallback to regex if Gemini fails
      }
    }

    // --- FALLBACK REGEX PARSER ---
    // Enhanced regex to catch spelled out numbers (simple ones)
    let processedText = text
      .replace(/\bone\b/g, "1").replace(/\btwo\b/g, "2").replace(/\bthree\b/g, "3")
      .replace(/\bfour\b/g, "4").replace(/\bfive\b/g, "5").replace(/\bsix\b/g, "6")
      .replace(/\bseven\b/g, "7").replace(/\beight\b/g, "8").replace(/\bnine\b/g, "9")
      .replace(/\bten\b/g, "10");

    const nameMatch = processedText.match(/for\s+([a-z]+)/);
    const customerName = nameMatch ? nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1) : "Guest";

    const itemMatches = [...processedText.matchAll(/(\d+)\s+(shirt|pants|jean|suit|dress)s?/g)];
    const items = itemMatches.map(m => ({
      type: m[2],
      qty: parseInt(m[1])
    }));

    if (items.length === 0) {
        return NextResponse.json({ error: "Could not detect any valid laundry items in your prompt. Please try phrasing it like: '2 shirts and 1 suit for Tanisha'." }, { status: 400 });
    }

    const isExpress = processedText.includes("express") || processedText.includes("fast") || processedText.includes("urgent");
    
    return processParsedOrder(customerName, items, isExpress);

  } catch (error) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({ error: "Failed to parse prompt due to an unexpected error." }, { status: 500 });
  }
}

// Helper function to handle business logic
function processParsedOrder(customerName: string, items: any[], isExpress: boolean) {
    // AI Delivery Prediction
    const estimatedDelivery = new Date();
    if (isExpress) {
      estimatedDelivery.setHours(estimatedDelivery.getHours() + 6);
    } else {
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
    }

    // AI Smart Pricing
    const pricePerItem: Record<string, number> = {
      shirt: 5, pants: 8, jean: 10, suit: 25, dress: 15
    };

    let subtotal = items.reduce((acc, item) => acc + (pricePerItem[item.type] || 5) * item.qty, 0);
    
    // Pricing rule: 10% discount for "Tanisha" (Repeat Customer Simulation)
    let discount = 0;
    if (customerName === "Tanisha") {
      discount = subtotal * 0.1;
      subtotal -= discount;
    }

    if (isExpress) subtotal *= 1.5;

    // AI Tagging Prediction
    const predictedTags = [];
    if (isExpress) predictedTags.push("VIP");
    if (subtotal > 50) predictedTags.push("High Value");
    if (customerName === "Tanisha") predictedTags.push("Frequent");

    const parsedData = {
      customer: customerName,
      items,
      service: isExpress ? "Express" : "Standard",
      estimatedTotal: subtotal,
      deliveryDate: estimatedDelivery.toISOString(),
      tags: predictedTags,
      confidence: process.env.GEMINI_API_KEY ? 0.99 : 0.85,
      message: `AI detected ${items.length} items for ${customerName}. Applied ${discount > 0 ? "10% Loyalty Discount" : "Standard Pricing"}. Estimated pickup in ${isExpress ? "6 hours" : "2 days"}.`
    };

    return NextResponse.json(parsedData);
}
