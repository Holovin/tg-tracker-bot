import { Bot, Context, NextFunction } from 'grammy';
import nconf from 'nconf';
import { createLoggerWrap } from './logger';
import { escapeMarkdown } from './helpers';

const config = nconf.env().file({ file: 'config.json' });
const logger = createLoggerWrap();

const configChatId = +config.get('telegram:chat');
const adminId = +config.get('telegram:admin');
const telegramToken = config.get('telegram:token');
const channels = config.get('telegram:channels');

const bot = new Bot(telegramToken);

logger.info(
    `Ho stats config ==\n\n` +
    `Started, settings:\n` +
    `- chatId: ${configChatId}\n` +
    `- adminId: ${adminId}\n`,
);

// MIDDLEWARES //
async function checkAccess(ctx: Context, next: NextFunction): Promise<void> {
    if (ctx.update.my_chat_member) {
        if (ctx.update.my_chat_member.from.id !== adminId) {
            await suicide(ctx);
            return;
        }

        return next();
    }

    if (ctx.update.chat_member || ctx.update.chat_boost || ctx.update.removed_chat_boost) {
        if (ctx.update.chat_member?.chat.type !== 'channel') {
            await suicide(ctx);
        }

        return next();
    }

    const chatId = ctx?.message?.chat?.id;
    if (!chatId || (chatId !== configChatId && chatId !== adminId)) {
        logger.debug(`mid: skip message from --  ${ctx.update.update_id} -- ${chatId}`);
        await notify(ctx, escapeMarkdown(`Access warning! From ${chatId}, dump: ${JSON.stringify(ctx.update)}`));
        return;
    }

    return next();
}

async function suicide(ctx: Context) {
    await ctx.leaveChat();
    const msg = `Access warning, new extra chat! ${JSON.stringify(ctx.update)}`;
    logger.info(msg);
    await notify(ctx, escapeMarkdown(msg));
}

async function notify(ctx: Context, text: string) {
    return ctx.api.sendMessage(configChatId, text, { parse_mode: 'MarkdownV2' });
}

// BOT //
async function initBot(bot: Bot) {
    bot.use(checkAccess);

    bot.command('ping', async (ctx: Context) => {
        // await ctx.reply('Pong!');
        await notify(ctx, escapeMarkdown(`*bbb* test`));
    });

    bot.on(['chat_boost', 'removed_chat_boost'], async (ctx: Context) => {
        await notify(ctx,
            `*Boost changes*\n` +
            escapeMarkdown(JSON.stringify(ctx.update))
        );
    });

    bot.on(['chat_member'], async (ctx: Context) => {
        if (ctx.update.chat_member?.chat.type !== 'channel') {
            return;
        }

        const from = ctx.update.chat_member.chat.title;
        const user = ctx.update.chat_member.new_chat_member.user;
        const statusEmoji = ctx.update.chat_member.new_chat_member.status === 'left' // left, member
            ? ['📉', 'user left']
            : ['📈', 'new user'];

        const message =
            `${statusEmoji[0]} *${escapeMarkdown(from)}*: ${statusEmoji[1]} \n\n` +
            `${escapeMarkdown((user.first_name ?? '') + (user.last_name ?? '')) }` +
            (user.username ? `\n@${escapeMarkdown(user.username ?? '')}` : '') +
            (user.id ? `\nID: [${user.id}](tg://user?id=${user.id})` : '');

        console.info(`Users changed, raw: ${JSON.stringify(message)}`)
        await notify(ctx, message);
    });

    bot.catch((error) => {
        const message =
            `🧨 *${escapeMarkdown(error.message)}*\n` +
            '```' + escapeMarkdown(error.stack + '') + '```'
        ;

        console.log(JSON.stringify(error));
        bot.api.sendMessage(adminId, message, { parse_mode: 'MarkdownV2' });
    });
}

async function main() {
    await initBot(bot);
    bot
        .start( {
            drop_pending_updates: true,
            allowed_updates: [
                'my_chat_member',
                'chat_member',
                'chat_boost',
                'removed_chat_boost',
                'message'
            ]
        })
        .then(() => { logger.warn('HOW?') });
}

try {
    main().then(() => {});

} catch (e: unknown) {
    logger.info(JSON.stringify(e as any));

    if (e instanceof Error) {
        logger.error(`GGWP: ${e.message}`);
    }
}
