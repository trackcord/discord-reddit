import { Session, ClientIdentifier } from "node-tls-client";
import winston from 'winston';
import { handleRateLimit } from './utils/rateLimitHandler';
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
    const url = `https://oauth.reddit.com/r/${subreddit}/hot/.json?raw_json=1&t=&after=${after}&count=0&sr_detail=false&limit=200`;
    const response = await session.get(url, {
        cookies: {
            "reddit_session": "eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpsVFdYNlFVUEloWktaRG1rR0pVd1gvdWNFK01BSjBYRE12RU1kNzVxTXQ4IiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0Ml9zdnk5dDBkcCIsImV4cCI6MTc1MDY0MzI2NS43MzcwNDIsImlhdCI6MTczNTAwNDg2NS43MzcwNDIsImp0aSI6IlBhb0xkWDJpSm53MFdlTlV0RzR0UjdCam9NZjczZyIsImNpZCI6ImNvb2tpZSIsImxjYSI6MTY2NDM0MTkwMDAwMCwic2NwIjoiZUp5S2pnVUVBQURfX3dFVkFMayIsInYxIjoiMjI2Mzc0OTE2NzE0OSwyMDI0LTEyLTI0VDAxOjQ3OjQ1LGQxNjVlZGEyYjQ4Yzg4ZDY5ZjE1MTQxODQwNzMxYmY1NjJmYTZkMDEiLCJmbG8iOjJ9.S0S42pUYhj0b4J8c8B8ERURV6fuz8wtOaX7xGNIWSQYb7YZdNK9a01nWnMU3k4lSB4FhJB-5d0EsjdmNpP5vAYfvWsNBJQ3NT3LEDTc34Yie4RIqr2A1WCRhtChHbcqy5fv-pgHa4ONPIbuu7Kk7Ag_KAF8Sm0HGNsyF5B6oByIYyFDNpod4hFLGLLjHQrXjLOsWCrJ_Em-y_Q9XW7oHOR_99TimcDLrwslXhgChCkaBVB_rPRx24mRKqGK0dixwjQ5_FAYo_K24pZBl6BHixdJg8J11gKe2_ZqtS7vHHWh5tiEFSdcs1q_nRP_0WYUrD4Vkj65VPMPIDFUD9QVvJw"
        }
    });

    await handleRateLimit(session, response);

    if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function fetchPostComments(session: Session, permalink: string): Promise<RedditCommentsResponse[]> {
    const url = `https://oauth.reddit.com${permalink}.json?sort=top&raw_json=1&profile_img=false&sr_detail=false&context=`;
    const response = await session.get(url, {
        cookies: {
            "reddit_session": "eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpsVFdYNlFVUEloWktaRG1rR0pVd1gvdWNFK01BSjBYRE12RU1kNzVxTXQ4IiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0Ml9zdnk5dDBkcCIsImV4cCI6MTc1MDY0MzI2NS43MzcwNDIsImlhdCI6MTczNTAwNDg2NS43MzcwNDIsImp0aSI6IlBhb0xkWDJpSm53MFdlTlV0RzR0UjdCam9NZjczZyIsImNpZCI6ImNvb2tpZSIsImxjYSI6MTY2NDM0MTkwMDAwMCwic2NwIjoiZUp5S2pnVUVBQURfX3dFVkFMayIsInYxIjoiMjI2Mzc0OTE2NzE0OSwyMDI0LTEyLTI0VDAxOjQ3OjQ1LGQxNjVlZGEyYjQ4Yzg4ZDY5ZjE1MTQxODQwNzMxYmY1NjJmYTZkMDEiLCJmbG8iOjJ9.S0S42pUYhj0b4J8c8B8ERURV6fuz8wtOaX7xGNIWSQYb7YZdNK9a01nWnMU3k4lSB4FhJB-5d0EsjdmNpP5vAYfvWsNBJQ3NT3LEDTc34Yie4RIqr2A1WCRhtChHbcqy5fv-pgHa4ONPIbuu7Kk7Ag_KAF8Sm0HGNsyF5B6oByIYyFDNpod4hFLGLLjHQrXjLOsWCrJ_Em-y_Q9XW7oHOR_99TimcDLrwslXhgChCkaBVB_rPRx24mRKqGK0dixwjQ5_FAYo_K24pZBl6BHixdJg8J11gKe2_ZqtS7vHHWh5tiEFSdcs1q_nRP_0WYUrD4Vkj65VPMPIDFUD9QVvJw"
        }
    });

    await handleRateLimit(session, response);

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
            const invite = match.split('/').pop()!;
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
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
    });

    const invites = new Set<string>();
    let processedPages = 0;
    let after: string | null = null;

    try {
        await session.init();
        logger.info(`Starting to scan r/${subreddit} for Discord invites...`);

        const inviteRegex = /(?:https?:\/\/)?(?:www\.)?discord(?:\.gg|app\.com\/invite)\/(\w+)/gi;

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
                    } catch (error) {
                        logger.error(`Error fetching comments for post ${post.data.id}:`, error);
                    }
                }

                after = data.data.after;
                if (!after) {
                    logger.info('Reached end of subreddit');
                    break;
                }

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
        logger.error('Fatal error scanning subreddit:', error);
    } finally {
        await session.close();
    }
}


scanSubredditForDiscordLinks('oldrobloxrevivals', 200);

