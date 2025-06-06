export interface Command {
    name: string;
    description: string;
    execute: (interaction: any) => Promise<void>;
}

export interface Event {
    name: string;
    execute: (...args: any[]) => void;
}

export interface LogEntry {
    timestamp: Date;
    message: string;
    level: 'info' | 'warn' | 'error';
}

export interface WebRequest {
    body: any;
    params: any;
    query: any;
}