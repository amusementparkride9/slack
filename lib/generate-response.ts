import { CoreMessage, generateText } from "ai";
import { SMALL_MODEL } from "./ai/model";
import { SYSTEM_PROMPT } from "./ai/prompts";

export const generateResponse = async (
  messages: CoreMessage[],
  updateStatus?: (status: string) => void,
) => {
  updateStatus?.("is writing your response...");
  const { text } = await generateText({
    model: SMALL_MODEL,
    system: SYSTEM_PROMPT,
    messages,
    temperature: 0.3,
    maxTokens: 1000,
  });

  // Convert markdown to Slack mrkdwn format
  return text.replace(/\[(.*?)\]\((.*?)\)/g, "<$2|$1>").replace(/\*\*/g, "*");
};
