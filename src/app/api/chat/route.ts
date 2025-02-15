import { NextResponse } from "next/server";
import { ChatMistralAI } from "@langchain/mistralai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
//import { StringOutputParser } from "@langchain/core/output_parsers";
// Remove unused import since HttpResponseOutputParser is not used in the code

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  throw new Error("MISTRAL_API_KEY is not set in environment variables");
}

const model = new ChatMistralAI({
  apiKey: MISTRAL_API_KEY,
  modelName: "mistral-large-latest",
  streaming: true,
});

// Set response timeout to 30 seconds
export const maxDuration = 30;

// Configure the runtime to use edge for better streaming support
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Convert messages to LangChain format
    const formattedMessages = messages.map((msg: any) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      }
      return new AIMessage(msg.content);
    });

    const stream = await model.stream(formattedMessages);

    // Create a TransformStream to process the chunks
    const encoder = new TextEncoder();
    // const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
              const data = {
                choices: [
                  {
                    delta: { content },
                  },
                ],
              };
              controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
