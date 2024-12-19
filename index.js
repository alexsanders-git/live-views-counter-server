const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const activeUsers = {}; // An object for tracking users on each post

wss.on('connection', (ws) => {
    let postId = null;

    // Processing messages from customers
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            postId = data.postId;

            // Initialise the count for the post if this is the first connection
            if (!activeUsers[postId]) {
                activeUsers[postId] = 0;
            }
            activeUsers[postId]++;

            // Update the number of users for this post
            broadcastCount(postId);
        }
    });

    // Handling user disconnection
    ws.on('close', () => {
        if (postId && activeUsers[postId]) {
            activeUsers[postId]--;
            if (activeUsers[postId] <= 0) {
                delete activeUsers[postId];
            } else {
                broadcastCount(postId);
            }
        }
    });
});

// Function for sending an updated number of users
function broadcastCount(postId) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'updateCount',
                postId,
                count: activeUsers[postId] || 0
            }));
        }
    });
}

console.log('WebSocket server is running on ws://localhost:8080');