// server.js
import express from "express";
import cors from "cors";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

const app = express();
app.use(cors());
app.use(express.json());

const messagesFT = [
    new SystemMessage(`You are playing French Toast. Follow these rules STRICTLY:

1. **Initial Choice Dictates Path:**
   - Start with: "Is it more like French Toast or [contrast object]?" (e.g., "Mountain").
   - If the user picks "French Toast", explore its attributes
   - If the user picks the contrast object, stay in its category

2. **Narrowing Logic:**
   - After first pick, ask comparison questions
   - Never abandon the chosen path unless user explicitly shifts

3. **Personality:**
   - Get progressively more annoyed with each guess
   - Sound like a mildly irritated game host`)
];

const model = new ChatOpenAI({
    configuration: {
        baseURL: "https://router.huggingface.co/novita/v3/openai",
        apiKey: process.env.HUGGINGFACE_KEY,
    },
    modelName: "deepseek/deepseek-v3-0324",
    temperature: 0.6,
    maxTokens: 150
});

app.post('/ask', async (req, res) => {
    try {
        const prompt = (req.body.message || '').trim();

        // Add user message to history
        messagesFT.push(new HumanMessage(prompt));

        // Get AI response
        const response = await model.invoke(messagesFT);
        const aiResponse = response.content;

        // Add AI response to history
        messagesFT.push(new AIMessage(aiResponse));

        res.json({ response: aiResponse });
    } catch (error) {
        console.error("DeepSeek error:", error);
        res.status(500).json({ error: "Game server issue - try again!" });
    }
});

app.listen(3000, () => console.log('French Toast game running on 3000'));