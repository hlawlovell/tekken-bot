import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

const LEADERBOARD_COMMAND = {
  name: 'leaderboard',
  description: 'Click me to instigate shiet',
  type: 1
}

const ALL_COMMANDS = [LEADERBOARD_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);