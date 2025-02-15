import type { Config } from "./types/config";

const config: Config = {
	// Reddit session and token
	redditSession: "[TRUNCATED]",
	redditToken: "[TRUNCATED]",

	// Subreddit configuration
	subreddit: "oldrobloxrevivals",
	pagesToScan: 200,

	// Scraping configuration
	clientIdentifier: "chrome_120",
	timeout: 30000,
	headers: {
		"Accept-Language": "en-US,en;q=0.9",
		Accept: "application/json",
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	},
	inviteRegex:
		/(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|com)|discordapp\.com\/invite)\/([a-zA-Z0-9-]+)/g,
	sleepBetweenRequests: 2000,
	sleepOnError: 5000,
};

export default config;
