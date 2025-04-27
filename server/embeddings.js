import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { TextLoader } from "langchain/document_loaders/fs/text";


const model = new AzureChatOpenAI({ temperature: 1 });

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});
let vectoreStore = await FaissStore.load("rabiesvectorDB", embeddings);

async function loadRabiesStory() {
    const loader = new TextLoader("./public/rabies.txt");
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 250,
        chunkOverlap: 50
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`i created ${splitDocs.length} chunks`);
    vectoreStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    await vectoreStore.save("rabiesvectorDB");
    console.log("vectore store created")
    return vectoreStore;

}

async function askQuestion(prompt) {
    const relevantDocs = await vectoreStore.similaritySearch(prompt, 3);
    console.log(relevantDocs[0].pageContent);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
    console.log(context);

    const repsonse = await model.invoke([
        ["system", "You will get a context and question. Use only the contect to answer the question."],
        ["user", `the context is ${context} and the question is ${prompt}`],
    ]);
    console.log("-------------------------")
    console.log(repsonse.content);
}

await loadRabiesStory()
await askQuestion("What is the moral of the story")