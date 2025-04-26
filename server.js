import express from 'express';
import * as reddit from './modules/reddit.js'
import { redis } from './modules/redis.js';
import jwt from 'jsonwebtoken'

const app = express();
const HTTP_PORT = process.env.PORT || 3069;

app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));

// ROUTES
app.get('/api/comments/:userName', async (req, res) => {
    const userName = req.params.userName;
    let comments = await reddit.getUserComments(userName);
    if (comments) {
        res.send(comments);
    }
});

app.get('/api/comments/:userName/search', async (req, res) => {
    const {
        keywords, //comma separated (except for commas in quotes)
        keywords_in, // comment only or post title + comment
        search_type, // AND or OR
        case_sensitive, 
        subreddit,
        subreddit_id, // eventually integrate with subreddit search (by this i mean do live fetching and caching)
        date_start,
        date_end
        // maybe implement search for edited 
        // (the date range is for date edited instead of created
        // or toggle to include comments edited within that date range)
    } = req.query;

    const userName = req.params.userName;

    let comments = await reddit.getUserComments(userName);

    if (keywords) {
        let keywordsList = keywords.match(/["'][^"']+["']|[^,]+/g).map((keyword) => {
            return keyword.trim().replace(/["']/g, '');
        });

        if (!case_sensitive) {
            keywordsList = keywordsList.map((keyword) => {return keyword.toLowerCase()});
        }

        // any keyword in comment => return comment
        if (search_type == 'OR') {
            comments = comments.filter((comment) => {
                const bodyText = case_sensitive? comment.comment_body_raw : comment.comment_body_raw.toLowerCase();
                const postTitle = case_sensitive? comment.post_title : comment.post_title.toLowerCase();
                return (
                    keywordsList.some((keyword) => { 
                        return bodyText.includes(keyword) || (keywords_in == "Post Title AND Comment" && postTitle.includes(keyword));
                    })
                );
            });
        }

        // all keywords in comment => return comment
        else {
            comments = comments.filter((comment) => {
                const bodyText = case_sensitive? comment.comment_body_raw : comment.comment_body_raw.toLowerCase();
                const postTitle = case_sensitive? comment.post_title : comment.post_title.toLowerCase();
                return (
                    keywordsList.every((keyword) => {
                        return bodyText.includes((keyword)) || (keywords_in == "Post Title AND Comment" && postTitle.includes(keyword));
                    })
                );
            });
        }
    }

    if (subreddit_id) {
        comments = comments.filter((comment) => {
            return comment.subreddit_id == subreddit_id;
        });
    }

    if (subreddit) {
        comments = comments.filter((comment) => {
            return comment.subreddit == subreddit;
        });
    }

    if (date_start || date_end) {
        const startDate = date_start? new Date(date_start) : null;
        const endDate = date_end ? new Date(date_end) : null;

        //if bad date (just use the damn calendar ui and this wont be an issue lol)
        if (startDate && isNaN(startDate.getTime()) || endDate && isNaN(endDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date' });
        }

        comments = comments.filter((comment) => {
            const date = new Date(comment.comment_date_utc * 1000);
            if (startDate && startDate > date) 
                return false;
            if (endDate && date > endDate)
                return false;
            return true
        });
    }

    console.log(comments);
    res.json(comments);

});

// UNFINISHED/CURRENTLY UNUSED
app.get('/api/subreddits', async (req, res) => {
    const {query} = req.query;
    return

});

async function searchSubredditName(query) {
    return
}

// user control stuff (future implementtion??)
/* app.get('api/login', (req, res) => {
    res.redirect(reddit.getAuthURL());
});

app.get('api/callback', async (req, res) => {
    const code = req.query.code;

    if (code) {
        oAuthToken = await reddit.getTokens();
        userInfo = await reddit.getUserInfo(oAuthToken);

        // put user info in cache
        let tokens = {
            access_token: oAuthToken.access_token,
            refresh_token: oAuthToken.refresh_token,
            // current time rounded down + token expiry time
            expires_at: Math.floot(Date.now() / 1000) +  oAuthToken.expires_in
        }
        await redis.set(`user:${userInfo.redditUserId}:tokens`, JSON.stringify(tokens))

        // jwt auth user info based on cache
        let payload = {
            redditUserId: userInfo.redditUserId,
            redditUsername: userInfo.redditUsername
        }
        let token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    }
    else {
        res.status(500).send({ error: 'Failed OAuth2 in callback', details: req.query.error })
    }
}); */
