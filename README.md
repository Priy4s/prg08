# 📦 Installatie instructies

## Repository Clonen
```bash
git clone https://github.com/Priy4s/prg08.git
cd prg08
```

## Environment Setup
Maak een `.env` bestand in de servermap en voeg de volgende variabelen toe:
```env
AZURE_OPENAI_API_VERSION=je_api_versie
AZURE_OPENAI_API_INSTANCE_NAME=je_instance_naam
AZURE_OPENAI_API_KEY=je_api_sleutel
AZURE_OPENAI_API_DEPLOYMENT_NAME=deploy-gpt-35-turbo
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=je_embeddings_deployment_naam
```

## Server Dependencies Installeren
```bash
cd server
npm install
```

## Client Dependencies Installeren
```bash
cd ../client
npm install
```

## Server Starten
Start de server op poort 3000:
```bash
cd ../server
node --env-file=.env server.js
```

## Client Starten
Open het HTML-bestand in je browser of gebruik een liveserver


# Gebruik
- De server luistert op `http://localhost:3000/` en communiceert met de Azure OpenAI API via LangChain
- De client verstuurt berichten naar de server en toont de AI-antwoorden in een chat interface

# Potentiële problemen
- **Spraakherkenning**: Werkt alleen in browsers die SpeechRecognition ondersteunen (zoals Chrome en Edge)
- **.env-bestand**: Controleer of de .env met de juiste variabelen is aangemaakt
