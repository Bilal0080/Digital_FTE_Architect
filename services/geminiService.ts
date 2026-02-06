
import { GoogleGenAI } from "@google/genai";

// Always use process.env.API_KEY directly as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeTask = async (content: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Analyze the following task content and extract 3-5 key points or critical actions.
    Keep the summary extremely concise, focused on operational logic, and high-value insights.
    
    Task Content:
    ${content}
    
    Return the summary in bullet points.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.3,
    },
  });

  return response.text || "No summary available.";
};

export const generateHandbook = async (
  companyName: string, 
  focus: string, 
  taskContexts?: string[],
  stack: string[] = []
): Promise<string> => {
  const ai = getAI();
  const stackContext = stack.length > 0 
    ? `The following technologies MUST be integrated into the workflow: ${stack.join(', ')}. 
       Specifically:
       - If 'Spec Kit' is selected, define how documentation is structured using standardized specification templates.
       - If 'Claude Code' is selected, define the agent's interaction with CLI-based coding tasks and terminal environments.
       - If 'Qwen' is selected, specify when to leverage Qwen for high-throughput reasoning or local-first LLM tasks.`
    : '';

  const prompt = `
    Act as a senior AI Architect. Generate a professional 'Company_Handbook.md' for an AI-powered Digital FTE (Full-Time Equivalent) for a company called "${companyName}".
    The focus of this AI employee is: ${focus}.
    
    ${stackContext}
    
    ${taskContexts && taskContexts.length > 0 ? `Include insights and logic derived from these summarized operational contexts:
    ${taskContexts.join('\n\n')}
    ` : ''}

    Include sections for:
    1. Mission & Role Definition
    2. Architecture & Tech Stack (Focusing on ${stack.join(', ') || 'Standard AI Stack'})
    3. Operational Rules (Specific about tone, accuracy, and tool usage)
    4. Security & Privacy Boundaries (HITL requirements)
    5. Daily Routine (Reasoning loops, briefings, and tool-specific tasks)
    
    Format the response in clean, professional Markdown with a focus on technical excellence and clear directives.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    },
  });

  return response.text || "Failed to generate handbook.";
};

export const generateDailyBriefing = async (tasks: string[]): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Act as a Digital FTE performing a "Monday Morning CEO Briefing". 
    Audit the following weekly task summaries and provide a high-level briefing for the CEO.
    
    Tasks:
    ${tasks.join('\n')}
    
    Provide:
    1. Executive Summary
    2. Revenue & Metrics
    3. Bottlenecks Identified
    4. Proactive Suggestions (e.g., cost savings, tool optimizations)
    
    Format in professional Markdown with a focus on business value.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      temperature: 1.0,
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  return response.text || "Briefing failed to generate.";
};

export const generateTags = async (content: string): Promise<string[]> => {
  const ai = getAI();
  const prompt = `Analyze the following Digital FTE task content and suggest 3-5 professional, concise tags/labels that help categorize this work (e.g., "Operations", "Client-Facing", "High-Risk"). Return only a comma-separated list of tags. 
  
  Content:
  ${content}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.4,
    },
  });

  const text = response.text || "";
  return text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};
