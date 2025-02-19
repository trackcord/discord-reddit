import { ClientIdentifier } from "node-tls-client";
import type { Config } from "./types/config";

const config: Config = {
	// Reddit session and token, you can get these by logging into Reddit and inspecting the cookies.
	redditSession: "[TRUNCATED]", // reddit_session
	redditToken: "[TRUNCATED]", // token_v2

	// Subreddit configuration
	subreddit: "[TRUNCATED]",
	pagesToScan: 200,

	// Scraping configuration
	clientIdentifier: ClientIdentifier.chrome_131,
	timeout: 30000,
	headers: {
		"Accept-Language": "en-US,en;q=0.9",
		Accept: "application/json",
	},
	inviteRegex:
		/(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|com)|discordapp\.com\/invite)\/([a-zA-Z0-9-]+)/g,
	sleepBetweenRequests: 2000,
	sleepOnError: 5000,
};

export default config;
