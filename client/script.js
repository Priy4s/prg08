let isWaitingForResponse = false;
const chatContainer = document.getElementById('chatContainer');
const optionButtons = document.getElementById('optionButtons');
const option1Button = document.getElementById('option1Button');
const option2Button = document.getElementById('option2Button');
const userInputField = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const micButton = document.getElementById('micButton');

// Spraakherkenning setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Microfoon klik handler
micButton.addEventListener('click', () => {
    if (!SpeechRecognition || isWaitingForResponse) return;
    startListening();
});

// Spraakherkenning functie
function startListening() {
    if (isWaitingForResponse) return;

    micButton.disabled = true;
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.addEventListener('result', event => {
        const transcript = event.results[0][0].transcript;
        userInputField.value = transcript;
        sendButton.click();
    });

    recognition.onspeechend = () => {
        recognition.stop();
        micButton.disabled = false;
    };

    recognition.onerror = e => {
        console.error('Spraakfout:', e.error);
        micButton.disabled = false;
    };
}

sendButton.addEventListener('click', async () => {
    if (isWaitingForResponse) return;

    isWaitingForResponse = true;
    sendButton.disabled = true;
    micButton.disabled = true;
    optionButtons.style.display = 'none';

    const userInput = userInputField.value.trim();
    if (!userInput) {
        resetState();
        return;
    }

    userInputField.value = '';

    const userDiv = document.createElement('div');
    userDiv.className = 'message user';
    userDiv.textContent = userInput;
    chatContainer.appendChild(userDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const aiDiv = document.createElement('div');
    aiDiv.className = 'message ai';
    chatContainer.appendChild(aiDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('http://localhost:3000/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userInput })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const words = buffer.split(/(\s+)/);
            buffer = words.pop();

            for (const w of words) {
                aiDiv.textContent += w;
                await new Promise(r => requestAnimationFrame(r));
            }
        }

        if (buffer) aiDiv.textContent += buffer;

        // Option button logica
        const msg = aiDiv.textContent.trim();
        const m = msg.match(/Is it more like (.+?)\?/);
        if (m && m[1]) {
            const opts = m[1].split(' or ');
            if (opts.length === 2) {
                option1Button.textContent = opts[0].trim();
                option2Button.textContent = opts[1].trim();
                optionButtons.style.display = 'flex';
            }
        }
    } catch (err) {
        aiDiv.textContent = `Fout: ${err.message}`;
    } finally {
        resetState();
    }
});

// Option button handlers
[option1Button, option2Button].forEach(btn => {
    btn.addEventListener('click', e => {
        if (isWaitingForResponse) return;

        userInputField.value = e.target.textContent;
        optionButtons.style.display = 'none';
        sendButton.click();
    });
});

function resetState() {
    isWaitingForResponse = false;
    sendButton.disabled = false;
    micButton.disabled = false;
    chatContainer.scrollTop = chatContainer.scrollHeight;
}