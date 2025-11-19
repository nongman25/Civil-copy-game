import { GoogleGenAI } from "@google/genai";
import { GameState, Player } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getAiFlavorText = async (
  aiPlayer: Player,
  situation: string,
  gameState: GameState
): Promise<string> => {
  const ai = getClient();
  if (!ai) return `${aiPlayer.leaderName} glares at you silently.`;

  // Simplify game state for token efficiency
  const context = `
    You are playing a game of Civilization. 
    You are ${aiPlayer.leaderName}.
    The current turn is ${gameState.turn}.
    Your status: Gold=${aiPlayer.gold}, Science=${aiPlayer.science}.
    Situation: ${situation}
    
    Write a SHORT (max 15 words), dramatic, in-character message to the human player.
    Do not use emojis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
    });
    return response.text.trim() || "My troops are ready.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Our paths cross again.";
  }
};

export const getAdvisorTip = async (gameState: GameState): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Build more troops and expand your borders!";

  const human = gameState.players.find(p => p.type === 'HUMAN');
  if (!human) return "Survive.";

  const myUnits = gameState.units.filter(u => u.ownerId === human.id).length;
  const myCities = gameState.cities.filter(c => c.ownerId === human.id).length;

  const context = `
    You are a military advisor in a Civilization game.
    Turn: ${gameState.turn}
    Player Stats: ${myCities} cities, ${myUnits} units, ${human.gold} gold.
    
    Give ONE short strategic tip (max 20 words) for the player right now.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
    });
    return response.text.trim();
  } catch (error) {
    return "Focus on exploration and defense.";
  }
};