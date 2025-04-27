// server.js
import express from "express";
import cors from "cors";
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

const app = express();
app.use(cors());
app.use(express.json());

let mode = "ft";
let gameRules = "";

// Separate message arrays for each mode
const messagesFT = [
    new SystemMessage(`You are playing French Toast. Follow these rules STRICTLY:

    1. **Initial Choice Dictates Path:**
    - Start with: "Is it more like French Toast or [contrast object]?" (e.g., "Mountain").
    - If the user picks "French Toast", treat it as a *theme* (not just food). Explore:
        - Food (e.g., "Bread", "Cake").
        - Attributes (e.g., "Golden", "Rectangular").
        - Function (e.g., "Breakfast", "Celebration").
    - If the user picks the contrast object (e.g., "Mountain"), stay in its category (e.g., nature).

    2. **Narrowing Logic:**
    - After the first pick, ask: "Is it more like [chosen object] or [related subcategory/attribute]?"
        - Example (User picked "French Toast"):
        - "Is it more like French Toast or Golden?" (attribute: color).
        - "Is it more like Golden or Rectangular?" (attribute: shape).
        - "Is it more like Rectangular or Flag?" (final guess).

    3. **No Unjustified Jumps:**
    - Never abandon the chosen path unless the user explicitly shifts.
    - If stuck after 3 questions, propose: "Is it closer to [current focus] or [wildcard guess]?"

    4. **Examples:**
    - **User’s object = Flag** → "Is it more like French Toast or Mountain?" … "Got it! Your object was Flag."
    - **User’s object = Pen**  → "Is it more like French Toast or Tree?" … "Got it! Your object was Pen."

    5. **Personality:**
    - You get more angry the longer you guess.
    - You don't mention it. Just sound like a jerk who cares.)`)
];

const messagesGC = []; // New array for Game Creation Mode

const model = new AzureChatOpenAI({ temperature: 0.6 });
const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0.5,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

let vectorStore;
(async () => {
    vectorStore = await FaissStore.load("rabiesvectorDB", embeddings);
})();

async function createGameFromFile() {
    mode = "gc";
    const docs = await vectorStore.similaritySearch("game creation", 3);
    const context = docs.map(d => d.pageContent).join("\n\n");
    const response = await model.invoke([
        new SystemMessage("You are a creative AI game designer. Invent a fun, step-by-step game. Keep it short and clear."),
        new HumanMessage(`Create a complete game (rules+instructions) using context:\n${context}`)
    ]);
    return response.content;
}

app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.post('/ask', async (req, res) => {
    const prompt = (req.body.message || '').trim();


    if (prompt.toLowerCase().includes('create a game')) {
        gameRules = await createGameFromFile();
        mode = 'gc';
        messagesGC.push(new AIMessage(gameRules));
        return res.type('text/plain').send(gameRules);
    }

    if (mode === 'gc') {
        const gameMasterMessage = new SystemMessage(`You are the Game Master. Follow these rules exactly:\n${gameRules}`);
        messagesGC.push(gameMasterMessage);
        messagesGC.push(new HumanMessage(prompt));
    } else {
        messagesFT.push(new HumanMessage(prompt));
        messagesFT.push(new SystemMessage(`You are playing French Toast. Follow these rules STRICTLY:\n${messagesFT[0].content}`));
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    const stream = await model.stream(mode === 'gc' ? messagesGC : messagesFT);
    let full = '';

    for await (const chunk of stream) {
        const txt = chunk.content || '';
        res.write(txt);
        full += txt;
    }
    res.end();

    if (mode === 'gc') {
        messagesGC.push(new AIMessage(full));
    } else {
        messagesFT.push(new AIMessage(full));
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
