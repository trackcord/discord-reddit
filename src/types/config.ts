export interface Config {
	redditSession: string;
	redditToken: string;
	subreddit: string;
	pagesToScan: number;
	clientIdentifier: string;
	timeout: number;
	headers: {
		"Accept-Language": string;
		Accept: string;
		"User-Agent": string;
	};
	inviteRegex: RegExp;
	sleepBetweenRequests: number;
	sleepOnError: number;
}
