# Discord Invite Scraper for Reddit Comments

A tool that scans Reddit comments and posts for Discord invite links using Bun. It efficiently processes multiple pages of subreddit content and extracts unique Discord invites.

## Features

- Scans specified subreddits for Discord invites in posts and comments
- Uses Reddit API to fetch data with configurable pagination
- Extracts unique Discord invite links using regex matching
- Rate limiting and error handling for reliable scraping
- Detailed logging to both console and file
- Saves results to a text file

## Prerequisites

- [Bun](https://bun.sh/) installed on your system
- [Reddit](https://reddit.com) account with session credentials

## Installation

1. Clone this repository:

```sh
git clone https://github.com/trackcord/discord-reddit.git
cd discord-reddit
```

2. Install dependencies:

```sh
bun install
```

### Configuration

Edit the config.ts file with your settings:

- redditSession: Your Reddit session cookie
- redditToken: Your Reddit token
- subreddit: Target subreddit to scan
- pagesToScan: Number of pages to process
- sleepBetweenRequests: Delay between requests (milliseconds)
- sleepOnError: Delay after encountering an error (milliseconds)

### Usage

Run the scraper.

```sh
bun src/index.ts
```

This will:

- Scan the configured subreddit for Discord invites
- Log progress and found invites to console and `discord_invites.log`
- Save unique invite codes to `discord_invites.txt`

### License

[WTFPL](/LICENSE) - Do What The F\*ck You Want To Public License
