const express = require('express');
const cors = require('cors');
// No dotenv needed for Pollinations, but keeping it for structure
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

app.post('/api/ask-ai', async (req, res) => {
    const query = req.body.query;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    console.log(`Sending query to Pollinations.ai: ${query.substring(0, 50)}...`);

    try {
        // Pollinations.ai is a free public AI endpoint
        // It accepts the prompt in the URL path.
        const encodedQuery = encodeURIComponent(`You are a helpful customer support assistant. Answer concisely: ${query}`);
        const response = await fetch(`https://text.pollinations.ai/${encodedQuery}`);

        if (!response.ok) {
            throw new Error(`Pollinations API Error: ${response.statusText}`);
        }

        const textResponse = await response.text();

        // Format for frontend
        res.json({
            candidates: [{
                content: { parts: [{ text: textResponse }] }
            }]
        });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to get answer from AI' });
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
