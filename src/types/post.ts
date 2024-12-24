interface RedditPost {
    data: {
        selftext: string;
        url: string;
        title: string;
        author: string;
        created_utc: number;
        permalink: string;
        id: string;
    }
}
interface RedditPostResponse {
    data: {
        after: string | null;
        children: RedditPost[];
    }
}


export type { RedditPost, RedditPostResponse };