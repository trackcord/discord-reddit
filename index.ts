import { Session, ClientIdentifier } from "node-tls-client";
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'subreddit_scan.log' })
    ]
});

interface RedditPost {
    data: {
        selftext: string;
        url: string;
        title: string;
        author: string;
        created_utc: number;
        permalink: string;
    }
}

interface RedditResponse {
    data: {
        after: string | null;
        children: RedditPost[];
    }
}

async function fetchSubredditPage(session: Session, subreddit: string, after: string | null): Promise<RedditResponse> {
    const url = `https://www.reddit.com/r/${subreddit}/hot/.json?raw_json=1&after=${after}&limit=103`;
    const response = await session.get(url);
    if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function scanSubredditForDiscordLinks(subreddit: string, pages: number = 10) {
    const session = new Session({ clientIdentifier: ClientIdentifier.chrome_120, timeout: 30000 });
    const invites = new Set<string>();

    try {
        await session.init();
        logger.info(`Starting to scan r/${subreddit} for Discord invites...`);

        let after: string | null = null;
        const inviteRegex = /(?:https?:\/\/)?(?:www\.)?discord(?:\.gg|app\.com\/invite)\/(\w+)/gi;

        const scanPage = async (pageNumber: number) => {
            try {
                const data = await fetchSubredditPage(session, subreddit, after);
                after = data.data.after;

                data.data.children.forEach(post => {
                    const content = `${post.data.title} ${post.data.selftext} ${post.data.url}`;
                    const matches = content.match(inviteRegex);
                    if (matches) {
                        matches.forEach(match => {
                            const invite = match.split('/').pop()!;
                            if (invites.add(invite)) {
                                logger.info(`Found new Discord invite: ${invite} in post by ${post.data.author}`);
                            }
                        });
                    }
                });

                return after;
            } catch (error) {
                logger.error(`Error scanning page ${pageNumber}:`, error);
                return null;
            }
        };

        const pagePromises = Array.from({ length: pages }, (_, i) => scanPage(i + 1));
        await Promise.all(pagePromises);

        if (invites.size > 0) {
            const output = Array.from(invites).join('\n');
            await Bun.write('discord_invites.txt', output);
            logger.info(`Found and saved ${invites.size} unique Discord invites to discord_invites.txt`);
        } else {
            logger.info('No Discord invites found');
        }

    } catch (error) {
        logger.error('Error scanning subreddit:', error);
    } finally {
        await session.close();
    }
}

scanSubredditForDiscordLinks('oldrobloxrevivals', 10);