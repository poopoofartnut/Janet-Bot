import { promises as fs } from 'fs';
import path from 'path';

export interface CommandLog {
    guildId: string;
    userId: string;
    command: string;
    timestamp: Date;
    args?: any;
    response: string;
}

const DB_PATH = path.join(__dirname, '../../../database.json');

async function readLogs(): Promise<CommandLog[]> {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data).commandLogs || [];
    } catch {
        return [];
    }
}

async function writeLogs(logs: CommandLog[]) {
    let db: { commandLogs?: CommandLog[] } = {};
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        db = JSON.parse(data);
    } catch {
        db = {};
    }
    db.commandLogs = logs;
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function logCommand(entry: CommandLog) {
    const logs = await readLogs();
    logs.push(entry);
    await writeLogs(logs);
}

export async function getLogsForGuild(guildId: string) {
    const logs = await readLogs();
    return logs.filter(log => log.guildId === guildId);
}