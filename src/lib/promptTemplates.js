const TEMPLATES = {
  summarize: {
    id: "summarize",
    name: "Text Summarizer",
    description: "Summarize text into key points",
    systemPrompt: "You are a concise text summarizer. Provide clear, accurate summaries focusing on key points. Use bullet points for clarity.",
    buildPrompt: (input) => `Summarize the following text:\n\n${input}`,
    expectedTokens: 500,
  },
  code_review: {
    id: "code_review",
    name: "Code Reviewer",
    description: "Review code for bugs, improvements, and best practices",
    systemPrompt: "You are an expert code reviewer. Analyze code for bugs, security issues, performance problems, and style improvements. Be specific and provide fixes.",
    buildPrompt: (input) => `Review the following code:\n\n\`\`\`\n${input}\n\`\`\``,
    expectedTokens: 1000,
  },
  explain: {
    id: "explain",
    name: "Concept Explainer",
    description: "Explain technical concepts clearly",
    systemPrompt: "You are a patient teacher who explains technical concepts clearly. Use analogies and examples. Start simple and build complexity.",
    buildPrompt: (input) => `Explain the following concept in detail:\n\n${input}`,
    expectedTokens: 800,
  },
  translate: {
    id: "translate",
    name: "Translator",
    description: "Translate text between languages",
    systemPrompt: "You are a professional translator. Translate text accurately while preserving meaning and tone. If no target language is specified, translate to English.",
    buildPrompt: (input) => `Translate the following:\n\n${input}`,
    expectedTokens: 400,
  },
  brainstorm: {
    id: "brainstorm",
    name: "Brainstorming Partner",
    description: "Generate creative ideas and solutions",
    systemPrompt: "You are a creative brainstorming partner. Generate diverse, innovative ideas. Think outside the box. Provide at least 5 ideas with brief explanations.",
    buildPrompt: (input) => `Brainstorm ideas for:\n\n${input}`,
    expectedTokens: 600,
  },
  debug: {
    id: "debug",
    name: "Debugger",
    description: "Help debug code errors",
    systemPrompt: "You are an expert debugger. Analyze error messages and code to find root causes. Provide step-by-step debugging approach and fixes.",
    buildPrompt: (input) => `Debug the following error/code:\n\n${input}`,
    expectedTokens: 800,
  },
  write_email: {
    id: "write_email",
    name: "Email Writer",
    description: "Draft professional emails",
    systemPrompt: "You are a professional email writer. Draft clear, concise, and appropriate emails. Match the tone to the context (formal/informal).",
    buildPrompt: (input) => `Write an email based on:\n\n${input}`,
    expectedTokens: 400,
  },
  data_analysis: {
    id: "data_analysis",
    name: "Data Analyst",
    description: "Analyze data and provide insights",
    systemPrompt: "You are a data analyst. Analyze data patterns, identify trends, and provide actionable insights. Use statistical reasoning.",
    buildPrompt: (input) => `Analyze the following data:\n\n${input}`,
    expectedTokens: 700,
  },
};

export function getTemplate(id) {
  return TEMPLATES[id] || null;
}

export function listTemplates() {
  return Object.values(TEMPLATES).map(({ buildPrompt, ...rest }) => rest);
}

export function buildPromptFromTemplate(templateId, input) {
  const template = TEMPLATES[templateId];
  if (!template) return null;
  return {
    system: template.systemPrompt,
    user: template.buildPrompt(input),
    estimatedTokens: template.expectedTokens,
  };
}

export default TEMPLATES;
