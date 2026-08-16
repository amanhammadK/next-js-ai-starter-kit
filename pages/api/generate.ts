import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import store from "../../src/lib/conversationStore";
import { buildPromptFromTemplate, listTemplates } from "../../src/lib/promptTemplates";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Data = {
  result?: string;
  conversationId?: string;
  tokens?: number;
  model?: string;
  latencyMs?: number;
  templates?: any[];
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method === "GET") {
    const templates = listTemplates();
    return res.status(200).json({ templates });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, conversationId, userId, model, template, templateInput } = req.body;
  if (!prompt && !templateInput) return res.status(400).json({ error: "Prompt or templateInput is required" });

  let conversation;
  if (conversationId) {
    conversation = store.getConversation(conversationId);
    if (!conversation) conversation = store.createConversation(userId || "anonymous", null, template);
  } else {
    conversation = store.createConversation(userId || "anonymous", null, template);
  }

  let systemPrompt = "You are a helpful AI assistant.";
  let userMessage = prompt;

  if (template && templateInput) {
    const built = buildPromptFromTemplate(template, templateInput);
    if (built) {
      systemPrompt = built.system;
      userMessage = built.user;
    }
  }

  store.addMessage(conversation.id, "system", systemPrompt, 0, model || "gpt-4");
  store.addMessage(conversation.id, "user", userMessage, Math.ceil(userMessage.split(/\s+/).length * 1.3), model || "gpt-4");

  const startTime = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: model || "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const result = completion.choices[0]?.message?.content || "No response";
    const tokens = completion.usage?.total_tokens || Math.ceil(result.split(/\s+/).length * 1.3);
    const latencyMs = Date.now() - startTime;

    store.addMessage(conversation.id, "assistant", result, tokens, model || "gpt-4");

    res.status(200).json({
      result,
      conversationId: conversation.id,
      tokens,
      model: model || "gpt-4",
      latencyMs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "AI request failed" });
  }
}
