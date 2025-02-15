import { Session, ClientIdentifier, type Response } from "node-tls-client";
import winston from "winston";
import type { RedditPostResponse } from "./types/post";
import config from "./config";

/**
 * Winston logger configuration for both console and file logging.
 */
const logger: winston.Logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.timestamp(),
		winston.format.printf(
			({ timestamp, level, message }: winston.Logform.TransformableInfo) => {
				return `[${timestamp}] [${level}] ${message}`;
			},
		),
	),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: "discord_invites.log" }),
	],
});

/**
 * Fetches a page of posts from a specified subreddit.
 * @param {Session} session - The TLS session to use for the request.
 * @param {string} subreddit - The name of the subreddit to fetch from.
 * @param {string | null} after - The 'after' parameter for pagination.
 * @returns {Promise<RedditPostResponse>} A promise that resolves to the Reddit API response.
 */
async function fetchSubredditPage(
	session: Session,
	subreddit: string,
	after: string | null,
): Promise<RedditPostResponse> {
	const url: string = `https://www.reddit.com/r/${subreddit}/hot/.json?raw_json=1&t=&after=${after}&count=0&sr_detail=false&limit=200`;
	const response: Response = await session.get(url, {
		cookies: {
			reddit_session: config.redditSession,
			token_v2: config.redditToken,
		},
	});

	if (response.status !== 200) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	return (await response.json()) as RedditPostResponse;
}

/**
 * Extracts Discord invite links from a given text using a regular expression.
 * @param {string} text - The text to search for Discord invites.
 * @param {RegExp} inviteRegex - The regular expression to use for matching Discord invites.
 * @returns {Set<string>} A set of unique Discord invite codes found in the text.
 */
function extractInvitesFromText(
	text: string,
	inviteRegex: RegExp,
): Set<string> {
	const invites: Set<string> = new Set<string>();
	let match: RegExpExecArray | null = inviteRegex.exec(text);
	while (match !== null) {
		invites.add(match[1]);
		match = inviteRegex.exec(text);
	}
	return invites;
}

/**
 * Scans a subreddit for Discord invite links.
 * @param {string} subreddit - The name of the subreddit to scan.
 * @param {number} pages - The number of pages to scan (default is set in config).
 */
async function scanSubredditForDiscordLinks(
	subreddit: string,
	pages: number = config.pagesToScan,
): Promise<void> {
	const session: Session = new Session({
		clientIdentifier:
			ClientIdentifier[
				config.clientIdentifier as keyof typeof ClientIdentifier
			],
		timeout: config.timeout,
		headers: config.headers,
	});

	const invites: Set<string> = new Set<string>();
	let processedPages = 0;
	let after: string | null = null;

	try {
		await session.init();
		logger.info(`Starting to scan r/${subreddit} for Discord invites...`);

		const inviteRegex: RegExp = config.inviteRegex;

		while (processedPages < pages) {
			try {
				const data: RedditPostResponse = await fetchSubredditPage(
					session,
					subreddit,
					after,
				);
				processedPages++;

				if (!data.data.children.length) {
					logger.info("No more posts to process");
					break;
				}

				for (const post of data.data.children) {
					const content: string = `${post.data.title} ${post.data.selftext} ${post.data.url}`;
					const postInvites: Set<string> = extractInvitesFromText(
						content,
						inviteRegex,
					);
					for (const invite of postInvites) {
						const isNewInvite = invites.add(invite);
						if (isNewInvite) {
							logger.info(
								`Found new Discord invite: ${invite} in post by ${post.data.author}`,
							);
						}
					}
				}
				after = data.data.after;
				if (!after) {
					logger.info("Reached end of subreddit");
					break;
				}

				await Bun.sleep(config.sleepBetweenRequests);
				logger.info(
					`Processed page ${processedPages}/${pages}, found ${invites.size} unique invites so far`,
				);
			} catch (error) {
				logger.error(`Error processing page ${processedPages + 1}:`, error);
				await Bun.sleep(config.sleepOnError);
			}
		}

		if (invites.size > 0) {
			const output: string = Array.from(invites).join("\n");
			await Bun.write("discord_invites.txt", output);
			logger.info(
				`Scan complete. Found and saved ${invites.size} unique Discord invites to discord_invites.txt`,
			);
		} else {
			logger.info("Scan complete. No Discord invites found");
		}
	} catch (error) {
		logger.error(`Error initializing session: ${error}`);
	} finally {
		await session.close();
	}
}

scanSubredditForDiscordLinks(config.subreddit, config.pagesToScan);
