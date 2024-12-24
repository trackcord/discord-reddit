interface RedditComment {
    data: {
        body: string;
        author: string;
        created_utc: number;
        permalink: string;
        replies?: {
            data?: {
                children: RedditComment[];
            }
        }
    }
}


interface RedditCommentsResponse {
    kind: string;
    data: {
        children: RedditComment[];
    }
}

export type { RedditComment, RedditCommentsResponse };