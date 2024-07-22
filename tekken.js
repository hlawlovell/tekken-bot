import axios from 'axios';
import { parse } from 'node-html-parser';
import * as dateFns from 'date-fns';
import { PLAYERS } from './players.js';
import { AsciiTable3 } from 'ascii-table3';
import { capitalize } from './utils.js';

const wankWavuApi = axios.create({
    baseURL: 'https://wank.wavu.wiki/',
    timeout: 10000,
    maxContentLength: 999999999,
});

const getPlayerData = async (playerId) => {
    const { data } = await wankWavuApi.get(`/player/${playerId}`, {
        responseType: 'document',
    });
    return data;
};

const getCharacterData = async (playerId, characterName) => {
    const { data } = await wankWavuApi.get(
        `/player/${playerId}/${characterName}`,
        {
            responseType: 'document',
        }
    );
    return data;
};

const getTopCharacterAndRank = (playerData) => {
    const document = parse(playerData);
    const ratingsTable = document.getElementsByTagName('table')[2];
    const topCharacterRow = ratingsTable.getElementsByTagName('tr')[1];
    const character = topCharacterRow
        .getElementsByTagName('a')[0]
        .getAttribute('href')
        .split('/')
        .pop();
    const rating = topCharacterRow
        .getElementsByTagName('td')[1]
        .innerText.trim();
    return {
        character: character,
        rating: rating,
    };
};

const getLastPlayed = (characterData) => {
    const document = parse(characterData);
    const ratingsTable = document.getElementsByTagName('table')[3];
    const topCharacterRow = ratingsTable.getElementsByTagName('tr')[1];
    const lastPlayed = topCharacterRow.getElementsByTagName('td')[0].innerText;
    const now = new Date();
    const daysAgo = dateFns.differenceInDays(now, lastPlayed);
    if (daysAgo === 0) {
        return 'Today';
    }
    if (daysAgo === 1) {
        return 'Yesterday';
    }
    let interval = `${daysAgo} days ago`;
    if (daysAgo > 30) {
        interval = `${dateFns.differenceInMonths(now, lastPlayed)} month(s) ago`;
    }
    return interval;
};

// Returns character, rating, lastPlayed
export const getPlayerStats = async (playerId) => {
    const playerData = await getPlayerData(playerId);
    const { character, rating } = getTopCharacterAndRank(playerData);

    const characterData = await getCharacterData(playerId, character);
    const lastPlayed = getLastPlayed(characterData);

    return { character, rating, lastPlayed };
};

export const getLeaderBoard = async () => {
    const playerStatsList = [];
    for await (const player of PLAYERS) {
        const stats = await getPlayerStats(player.id);
        playerStatsList.push({ ...stats, name: player.name, id: player.id });
    }
    const sortedPlayerStatsList = playerStatsList.sort(
        (a, b) => b.rating - a.rating
    );

    // Create table
    const table = new AsciiTable3()
        .setHeading('Rank', 'Name', 'Character', 'Last Played', 'Rating')
        .addRowMatrix(
            sortedPlayerStatsList.map((player, index) => {
                return [
                    index + 1,
                    player.name,
                    capitalize(player.character),
                    player.lastPlayed,
                    player.rating,
                ];
            })
        );
    table.setStyle('compact');
    return `\`\`\`${table.toString()}\`\`\``;
};
