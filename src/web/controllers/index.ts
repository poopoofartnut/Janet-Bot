import { Request, Response } from 'express';
import { getLogs, getCommands, updateCommands } from '../services/commandService';

export const renderLogs = async (req: Request, res: Response) => {
    const logs = await getLogs();
    res.render('logs', { logs });
};

export const listCommands = async (req: Request, res: Response) => {
    const commands = await getCommands();
    res.json(commands);
};

export const modifyCommands = async (req: Request, res: Response) => {
    const { commands } = req.body;
    await updateCommands(commands);
    res.status(200).send('Commands updated successfully');
};