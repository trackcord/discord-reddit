import { Session, ClientIdentifier } from "node-tls-client";
import winston from 'winston';
import type { RedditCommentsResponse, RedditComment } from "./types/comment";
import type { RedditPostResponse } from "./types/post";

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] [${level}] ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'discord_invites.log' })
    ]
});


async function fetchSubredditPage(session: Session, subreddit: string, after: string | null): Promise<RedditPostResponse> {
    const url = `https://www.reddit.com/r/${subreddit}/hot/.json?raw_json=1&t=&after=${after}&count=0&sr_detail=false&limit=200`;
    const response = await session.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
    });

    if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function fetchPostComments(session: Session, permalink: string): Promise<RedditCommentsResponse[]> {
    const url = `https://www.reddit.com${permalink}.json?sort=top&raw_json=1&profile_img=false&sr_detail=false&context=`;
    const response = await session.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        proxy: 'http://fOqJUbJoaJtbgFtt:IGhgIq2Y6jQQE1Oc@residential.legionproxy.io:16666'
    });

    if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

function extractInvitesFromText(text: string, inviteRegex: RegExp): Set<string> {
    const invites = new Set<string>();
    const matches = text.match(inviteRegex);
    if (matches) {
        matches.forEach(match => {
            const invite = match.replace(/(https?:\/\/)?(www\.)?/g, '');
            invites.add(invite);
        });
    }
    return invites;
}

function processComments(comments: RedditComment[], inviteRegex: RegExp, invites: Set<string>) {
    for (const comment of comments) {
        if (comment.data.body) {
            const newInvites = extractInvitesFromText(comment.data.body, inviteRegex);
            newInvites.forEach(invite => {
                if (invites.add(invite)) {
                    logger.info(`Found new Discord invite: ${invite} in comment by ${comment.data.author}`);
                }
            });
        }


        if (comment.data.replies?.data?.children) {
            processComments(comment.data.replies.data.children, inviteRegex, invites);
        }
    }
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

    try {
        await session.init();
        logger.info(`Starting to scan r/${subreddit} for Discord invites...`);

        const inviteRegex = /(?:https?:\/\/)?(?:www\.|ptb\.|canary\.)?discord(?:app)?\.(?:(?:com|gg)[/\\]+(?:invite|servers)[/\\]+[a-z0-9-_]+)|(?:https?:\/\/)?(?:www\.)?(?:dsc\.gg|invite\.gg+|discord\.link|(?:discord\.(gg|io|me|li|id))|disboard\.org)[/\\]+[a-z0-9-_/]+/g;

        while (processedPages < pages) {
            try {
                const data = await fetchSubredditPage(session, subreddit, after);
                processedPages++;

                if (!data.data.children.length) {
                    logger.info('No more posts to process');
                    break;
                }


                for (const post of data.data.children) {

                    const content = `${post.data.title} ${post.data.selftext} ${post.data.url}`;
                    const postInvites = extractInvitesFromText(content, inviteRegex);
                    postInvites.forEach(invite => {
                        if (invites.add(invite)) {
                            logger.info(`Found new Discord invite: ${invite} in post by ${post.data.author}`);
                        }
                    });


                    try {
                        const commentsData = await fetchPostComments(session, post.data.permalink);
                        for (const comments of commentsData) {
                            processComments(comments.data.children, inviteRegex, invites);
                        }
                        await Bun.sleep(2000);
                    } catch (error) {
                        logger.error(`Error fetching comments for post ${post.data.permalink}: ${error}`);
                    }
                }

                after = data.data.after;
                if (!after) {
                    logger.info('Reached end of subreddit');
                    break;
                }


                await Bun.sleep(2000);
                logger.info(`Processed page ${processedPages}/${pages}, found ${invites.size} unique invites so far`);

            } catch (error) {
                logger.error(`Error processing page ${processedPages + 1}:`, error);

                await Bun.sleep(5000);
            }
        }

        if (invites.size > 0) {
            const output = Array.from(invites).join('\n');
            await Bun.write('discord_invites.txt', output);
            logger.info(`Scan complete. Found and saved ${invites.size} unique Discord invites to discord_invites.txt`);
        } else {
            logger.info('Scan complete. No Discord invites found');
        }

    } catch (error) {
        logger.error(`Error initializing session: ${error}`);
    } finally {
        await session.close();
    }
}


scanSubredditForDiscordLinks('oldrobloxrevivals', 200);