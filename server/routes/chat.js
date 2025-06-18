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

    // Add form submit handler
    const chatInputWrapper = document.querySelector('.chat-input-wrapper');
    chatInputWrapper.addEventListener('submit', handleSubmit);

    // Handle message submission
    function handleSubmit(e) {
        e.preventDefault();
        const message = msgInput.value.trim();
        if (message) {
            socket.emit('chat', message);
            addMessage(`> ${message}`, 'own-message');
            msgInput.value = '';
        }
    }

    // Handle Enter key press
    msgInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    });

    // Socket event listeners
    socket.on('connect', () => {
        console.log('Connected to chat server');
        addMessage('# Connected to chat server', 'system-message');
    });

    socket.on('chat', ({ id, msg }) => {
        if (id !== socket.id) {
            addMessage(`$ ${msg}`, 'other-message');
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        addMessage('# Disconnected from chat server', 'system-message');
    });
});

