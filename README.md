# Discord Invite Scraper for Reddit Comments

This tool helps you find Discord invite links in Reddit comments and posts. It
efficiently scans multiple pages of subreddit content and extracts unique
Discord invites.

## Features

- Scans specific subreddits for Discord invites in posts and comments
- Uses the Reddit API to fetch data with customizable pagination
- Extracts unique Discord invite links using regex
- Includes rate limiting and error handling for reliable scraping
- Provides detailed logging to both the console
- Saves results to a text file

## Prerequisites

- [Bun](https://bun.sh/) installed on your system
- A [Reddit](https://reddit.com/) account with session credentials

## Installation

1. Clone this repository:

```sh
git clone https://github.com/trackcord/discord-reddit.git
cd discord-reddit
```

2. Install the dependencies:

```sh
bun install
```

### Configuration

Edit the `config.ts` file with your settings:

- `redditSession`: Your Reddit session cookie
- `redditToken`: Your Reddit token
- `subreddit`: The target subreddit to scan
- `pagesToScan`: The number of pages to process
- `sleepBetweenRequests`: Delay between requests (in milliseconds)
- `sleepOnError`: Delay after encountering an error (in milliseconds)

### Usage

Run the scraper:

```sh
bun src/index.ts
```

This will:

- Scan the configured subreddit for Discord invites
- Save unique invite codes to `discord_invites.txt`
