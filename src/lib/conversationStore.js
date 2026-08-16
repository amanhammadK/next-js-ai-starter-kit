class ConversationStore {
  constructor() {
    this.conversations = new Map();
    this.usage = { totalTokens: 0, totalRequests: 0, byModel: {}, byTemplate: {} };
  }

  createConversation(userId, title, template) {
    const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const conv = {
      id,
      userId,
      title: title || "New Conversation",
      template: template || null,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenCount: 0,
      model: null,
    };
    this.conversations.set(id, conv);
    return conv;
  }

  getConversation(id) {
    return this.conversations.get(id) || null;
  }

  listConversations(userId) {
    return Array.from(this.conversations.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  addMessage(conversationId, role, content, tokens, model) {
    const conv = this.conversations.get(conversationId);
    if (!conv) return null;
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      tokens: tokens || 0,
      model: model || null,
      createdAt: new Date().toISOString(),
    };
    conv.messages.push(msg);
    conv.updatedAt = new Date().toISOString();
    conv.tokenCount += tokens || 0;
    if (model) conv.model = model;
    this.usage.totalTokens += tokens || 0;
    this.usage.totalRequests++;
    if (model) this.usage.byModel[model] = (this.usage.byModel[model] || 0) + (tokens || 0);
    return msg;
  }

  deleteConversation(id) {
    return this.conversations.delete(id);
  }

  getUsage(userId) {
    const convs = userId
      ? Array.from(this.conversations.values()).filter((c) => c.userId === userId)
      : Array.from(this.conversations.values());
    const totalTokens = convs.reduce((s, c) => s + c.tokenCount, 0);
    const totalMessages = convs.reduce((s, c) => s + c.messages.length, 0);
    return {
      ...this.usage,
      totalConversations: convs.length,
      totalMessages,
      userTokens: totalTokens,
    };
  }

  searchMessages(query, userId) {
    const q = query.toLowerCase();
    const results = [];
    for (const conv of this.conversations.values()) {
      if (userId && conv.userId !== userId) continue;
      for (const msg of conv.messages) {
        if (msg.content.toLowerCase().includes(q)) {
          results.push({ ...msg, conversationId: conv.id, conversationTitle: conv.title });
        }
      }
    }
    return results.slice(0, 50);
  }
}

const store = new ConversationStore();
export default store;
