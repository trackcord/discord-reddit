import { Session, ClientIdentifier } from "node-tls-client";
import * as fs from 'fs/promises';

interface RedditPost {
    kind: string;
    data: {
        selftext: string;
        url: string;
        title: string;
        author: string;
        created_utc: number;
        permalink: string;
    }
}

interface RedditResponse {
    kind: string;
    data: {
        after: string | null;
        children: RedditPost[];
    }
}

async function scanSubredditForDiscordLinks(subreddit: string, pages: number = 10) {
    const session = new Session({ clientIdentifier: ClientIdentifier.chrome_120, timeout: 30000 });

    try {
        await session.init();
        let after: string | null = null;
        const discordLinks: Array<{
            link: string,
            post: string,
            author: string,
            date: string,
            url: string
        }> = [];

        console.log(`Starting to scan r/${subreddit} for Discord links...`);

        for (let i = 0; i < pages; i++) {
            const url = `https://www.reddit.com/r/${subreddit}/hot/.json?&raw_json=1&t=&after=${after}&count=0&sr_detail=false&limit=102`;
            const response = await session.get(url);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: RedditResponse = await response.json();

            for (const post of data.data.children) {
                const content = `${post.data.title} ${post.data.selftext} ${post.data.url}`;
                const matches = content.match(/discord\.gg\/[\w-]+/g);

                if (matches) {
                    matches.forEach(link => {
                        discordLinks.push({
                            link,
                            post: post.data.permalink,
                            author: post.data.author,
                            date: new Date(post.data.created_utc * 1000).toISOString(),
                            url: `https://reddit.com${post.data.permalink}`
                        });
                    });
                    console.log(`Found Discord link in post by ${post.data.author}`);
                }
            }

            after = data.data.after;
            if (!after) break;

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (discordLinks.length > 0) {
            const output = discordLinks.map(item =>
                `Link: ${item.link}\nPost: ${item.url}\nAuthor: ${item.author}\nDate: ${item.date}\n---\n`
            ).join('\n');

            await fs.writeFile('discord.txt', output);
            console.log(`Found and saved ${discordLinks.length} Discord links to discord.txt`);
        } else {
            console.log('No Discord links found');
        }

    } catch (error) {
        console.error('Error scanning subreddit:', error);
    } finally {
        await session.close();
    }
}

scanSubredditForDiscordLinks('oldrobloxrevivals', 10);

