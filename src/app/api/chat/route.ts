import { OpenAIStream, StreamingTextResponse } from "ai";
import { OpenAI } from "openai";
import store from "../../lib/conversationStore";
import { buildPromptFromTemplate, listTemplates } from "../../lib/promptTemplates";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, conversationId, userId, model, template, templateInput } = body;

  let conversation;
  if (conversationId) {
    conversation = store.getConversation(conversationId);
    if (!conversation) {
      conversation = store.createConversation(userId || "anonymous", null, template);
    }
  } else {
    conversation = store.createConversation(userId || "anonymous", null, template);
  }

  let systemMessage = { role: "system" as const, content: "You are a helpful AI assistant." };

  if (template && templateInput) {
    const prompt = buildPromptFromTemplate(template, templateInput);
    if (prompt) {
      systemMessage = { role: "system", content: prompt.system };
      messages.push({ role: "user", content: prompt.user });
    }
  }

  const fullMessages = [systemMessage, ...messages];

  const selectedModel = model || "gpt-4";
  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model: selectedModel,
    stream: true,
    messages: fullMessages,
  });

  const stream = OpenAIStream(response, {
    onCompletion: async (completion: string) => {
      const elapsed = Date.now() - startTime;
      const estimatedTokens = Math.ceil(completion.split(/\s+/).length * 1.3);

      store.addMessage(conversation.id, "system", systemMessage.content, 0, selectedModel);
      for (const msg of messages) {
        if (msg.role !== "system") {
          store.addMessage(conversation.id, msg.role, msg.content, Math.ceil(msg.content.split(/\s+/).length * 1.3), selectedModel);
        }
      }
      store.addMessage(conversation.id, "assistant", completion, estimatedTokens, selectedModel);
    },
  });

  const headers = new Headers();
  headers.set("x-conversation-id", conversation.id);
  headers.set("x-model", selectedModel);

  return new StreamingTextResponse(stream, { headers });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "templates") {
    return Response.json({ templates: listTemplates() });
  }

  if (action === "conversations") {
    const userId = url.searchParams.get("userId") || "anonymous";
    const conversations = store.listConversations(userId);
    return Response.json({ conversations });
  }

  if (action === "conversation") {
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    const conv = store.getConversation(id);
    if (!conv) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ conversation: conv });
  }

  if (action === "usage") {
    const userId = url.searchParams.get("userId");
    const usage = store.getUsage(userId || undefined);
    return Response.json({ usage });
  }

  if (action === "search") {
    const query = url.searchParams.get("q");
    const userId = url.searchParams.get("userId");
    if (!query) return Response.json({ error: "q required" }, { status: 400 });
    const results = store.searchMessages(query, userId || undefined);
    return Response.json({ results });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const deleted = store.deleteConversation(id);
  return Response.json({ deleted });
}
