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
    const url = `https://www.reddit.com/r/${subreddit}/hot/.json?raw_json=1&t=&after=${after}&count=0&sr_detail=false&limit=200`;
    const response = await session.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function scanSubredditForDiscordLinks(subreddit: string, pages: number = 10) {
    const session = new Session({
        clientIdentifier: ClientIdentifier.chrome_120,
        timeout: 30000,
        headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'application/json'
        }
    });

    const invites = new Set<string>();
    let processedPages = 0;
    let after: string | null = null;
    let noMorePages = false;

    try {
        await session.init();
        logger.info(`Starting to scan r/${subreddit} for Discord invites...`);

        const inviteRegex = /(?:https?:\/\/)?(?:www\.)?discord(?:\.gg|app\.com\/invite)\/(\w+)/gi;

        while (processedPages < pages && !noMorePages) {
            try {
                const data = await fetchSubredditPage(session, subreddit, after);
                processedPages++;

                if (!data.data.children.length) {
                    logger.info('No more posts to process');
                    noMorePages = true;
                    break;
                }

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

                after = data.data.after;
                if (!after) {
                    logger.info('Reached end of subreddit');
                    noMorePages = true;
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
                logger.info(`Processed page ${processedPages}/${pages}, found ${invites.size} unique invites so far`);

            } catch (error) {
                logger.error(`Error processing page ${processedPages + 1}:`, error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        if (invites.size > 0) {
            const output = Array.from(invites).join('\n');
            await Bun.write('discord_invites.txt', output);
            logger.info(`Scan complete. Found and saved ${invites.size} unique Discord invites to discord_invites.txt`);
        } else {
            logger.info('Scan complete. No Discord invites found');
        }

        if (noMorePages) {
            logger.info(`Scan ended early. Processed ${processedPages} pages out of requested ${pages} due to no more content.`);
        }

    } catch (error) {
        logger.error('Fatal error scanning subreddit:', error);
    } finally {
        await session.close();
    }
}

scanSubredditForDiscordLinks('oldrobloxrevivals', 200);

