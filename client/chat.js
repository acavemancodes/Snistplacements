document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket connection
    const socket = io();
    
    // Get DOM elements
    const chatLog = document.getElementById('log');
    const msgInput = document.getElementById('msg');
    const chatBox = document.getElementById('chatBox');

    // Add message to chat
    function addMessage(text, type = 'other') {
        const p = document.createElement('p');
        p.textContent = text;
        p.className = `${type}-message`;
        chatLog.appendChild(p);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    // Handle message input
    msgInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = msgInput.value.trim();
            if (message) {
                socket.emit('chat', message);
                msgInput.value = '';
            }
        }
    });

    // Socket event listeners
    socket.on('connect', () => {
        console.log('Connected to chat server');
        addMessage('Connected to chat', 'system');
    });

    socket.on('chat', ({ id, msg }) => {
        addMessage(`${id.slice(0,5)}: ${msg}`);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        addMessage('Disconnected from chat', 'system');
    });
});

