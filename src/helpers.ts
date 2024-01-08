export function sleep(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export function escapeMarkdown(message: string): string {
    return message.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
