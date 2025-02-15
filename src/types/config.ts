import type { ClientIdentifier } from "node-tls-client/typings/interface/session";

export interface Config {
	redditSession: string;
	redditToken: string;
	subreddit: string;
	pagesToScan: number;
	clientIdentifier: ClientIdentifier;
	timeout: number;
	headers: {
		"Accept-Language": string;
		Accept: string;
	};
	inviteRegex: RegExp;
	sleepBetweenRequests: number;
	sleepOnError: number;
}
