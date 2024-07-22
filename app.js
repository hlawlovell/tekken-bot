import 'dotenv/config';
import express from 'express';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import {
    VerifyDiscordRequest,
    getRandomEmoji,
    DiscordRequest,
} from './utils.js';
import { getLeaderBoard } from './tekken.js';
import axios from 'axios';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
    // Interaction type and data
    const { type, application_id, data, token } = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }

    /**
     * Handle slash command requests
     * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
     */
    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;
        if (name === 'leaderboard') {
            res.send({
                type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            });
            const leaderboard = await getLeaderBoard();

            await axios.post(
                `https://discord.com/api/v10/webhooks/${application_id}/${token}`,
                {
                    content: leaderboard,
                }
            );
        }
    }
});

app.listen(PORT, () => {
    console.log('Listening on port', PORT);
});
