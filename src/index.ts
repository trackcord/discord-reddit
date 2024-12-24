import { Session, ClientIdentifier } from "node-tls-client";
import winston from 'winston';
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
        cookies: {
            reddit_session: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpsVFdYNlFVUEloWktaRG1rR0pVd1gvdWNFK01BSjBYRE12RU1kNzVxTXQ4IiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0Ml9zdnk5dDBkcCIsImV4cCI6MTc1MDY0MzI2NS43MzcwNDIsImlhdCI6MTczNTAwNDg2NS43MzcwNDIsImp0aSI6IlBhb0xkWDJpSm53MFdlTlV0RzR0UjdCam9NZjczZyIsImNpZCI6ImNvb2tpZSIsImxjYSI6MTY2NDM0MTkwMDAwMCwic2NwIjoiZUp5S2pnVUVBQURfX3dFVkFMayIsInYxIjoiMjI2Mzc0OTE2NzE0OSwyMDI0LTEyLTI0VDAxOjQ3OjQ1LGQxNjVlZGEyYjQ4Yzg4ZDY5ZjE1MTQxODQwNzMxYmY1NjJmYTZkMDEiLCJmbG8iOjJ9.S0S42pUYhj0b4J8c8B8ERURV6fuz8wtOaX7xGNIWSQYb7YZdNK9a01nWnMU3k4lSB4FhJB-5d0EsjdmNpP5vAYfvWsNBJQ3NT3LEDTc34Yie4RIqr2A1WCRhtChHbcqy5fv-pgHa4ONPIbuu7Kk7Ag_KAF8Sm0HGNsyF5B6oByIYyFDNpod4hFLGLLjHQrXjLOsWCrJ_Em-y_Q9XW7oHOR_99TimcDLrwslXhgChCkaBVB_rPRx24mRKqGK0dixwjQ5_FAYo_K24pZBl6BHixdJg8J11gKe2_ZqtS7vHHWh5tiEFSdcs1q_nRP_0WYUrD4Vkj65VPMPIDFUD9QVvJw',
            token_v2: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzM1MDkxMjY2LjA1MzgxNSwiaWF0IjoxNzM1MDA0ODY2LjA1MzgxNSwianRpIjoiMld2NV9YaHJ2Ykp4XzV1aTR5aFlKVGF1dTBnSnh3IiwiY2lkIjoiMFItV0FNaHVvby1NeVEiLCJsaWQiOiJ0Ml9zdnk5dDBkcCIsImFpZCI6InQyX3N2eTl0MGRwIiwibGNhIjoxNjY0MzQxOTAwMDAwLCJzY3AiOiJlSnhra2RHT3REQUloZC1GYTVfZ2Y1VV9tMDF0Y1lhc0xRYW9rM243RFZvY2s3MDdjRDRwSFA5REtvcUZEQ1pYZ3FuQUJGZ1RyVERCUnVUOW5MbTNnMmlOZTh0WXNabkNCRm13RkRya21MR3NpUVFtZUpJYXl4c21vSUxOeUZ5dXRHTk5MVDBRSnFoY01yZUZIcGMyb2JrYmk1NmRHRlc1ckR5b3NWZmwwdGpHRkxZbnhqY2JxdzJwdUM2bk1rbkxRdmtzWHZUak45VzM5dm16X1NhMEo4T0txdW1CM2hsSkNHNHNmcGltM2Q5VGs1NnRDeGExOTNxUTJ1ZDYzSzU5MWl3ME83ZWY2X2xySXhtWFkyaC1KdnQzMXktaEE0ODhMelBxQUVhczRVY1pkbVFkX2xVSFVMbWdKR01KNHRNSTVNcmwyMzhKdG12VHY4YnRFejk4TS1LbU5feldETlJ6Q2VMUXBfSDFHd0FBX184UTFlVFIiLCJyY2lkIjoiX3lCZ3dpdUJiTjBBczR5VmF4dHJOcHVPeS1yUmlkanBVc1hfcmlCUlB3QSIsImZsbyI6Mn0.N4KMDREo4tLAMhKyKHiE_SajdvyysD5hrb0ZBb18vqAU9fw9I9VChggtz0ckXG6_PoiZJNT51UP4WgUH9mISgRUBoEWhOXkf_F94abt2VK15_7-zCMttKeWuhbBlM6GJcLbZNDjCrEgigYRndopC0dTaFalAVsTja8NAZ0Ngb7CQO8ygx4RLoTjp5_TYpYLa7A9gdUdl-WZ4MZ-b2mX_x7o71KgGPXlk_i3QwjdEWQwLbmwfjuWr2hCNEBF04MmuZYBTbspKVKjyQnsOANFGpucEArCSUUaO8R1VEO5wkWyrhQVwSXQNdK93OHpXQoSWVqr3l53gQ9Hp9TgnX0fcIw'
        }
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

async function scanSubredditForDiscordLinks(subreddit: string, pages: number = 10) {
    const session = new Session({
        clientIdentifier: ClientIdentifier.chrome_120,
        timeout: 30000,
        headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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