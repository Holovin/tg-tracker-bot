import { createLogger, format, transports } from 'winston';

const loggerFormatter = format.printf(info => {
    return `${info.level.toUpperCase().padEnd(8)} [${info.timestamp}] ${info.message}`;
});

export function createLoggerWrap() {
    return createLogger({
        format: format.combine(
            format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
            loggerFormatter,
        ),
        transports: [
            new transports.Console({
                level: 'debug',
            }),
            new transports.File({
                filename: 'info.log',
                level: 'info',
            })
        ]
    });
}
