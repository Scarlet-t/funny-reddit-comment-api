import {Devvit} from '@devvit/public-api';
import 'dotenv/config';
import crypto from 'crypto';
import { redis } from './redis.js';

const userAgent = "User-Agent: macos:comment-search-tool:v0.1.0 (by /u/Less_Shoe9595)";

export function getAuthURL() {
  let state = crypto.randomBytes(16).toString('hex');
  let redirect_uri = "http://localhost:3069/";
  let scope = "identity read history";
  return `https://www.reddit.com/api/v1/authorize?client_id=${process.env.REDDIT_CLIENT_ID}&response_type=code&
    state=${state}&redirect_uri=${redirect_uri}&duration=permanent&scope=${scope}`;
}

export async function getTokens(code) {
  const creds = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
  
  try {
    const res = await fetch(
      'https://www.reddit.com/api/v1/access_token',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: 'http://localhost:3069/api/callback'
        })
      }
    );
  }
  catch (error) {
    console.log(error);
    throw error;
  }

  if (!res.ok) {
    throw new Error(`Failed to get tokens: ${res.statusText}`);
  }

  return await res.json();

}

export async function getUserInfo(oAuthToken) {
  try {
    const res = await fetch(`https://oauth.reddit.com/api/v1/me`, 
      {
        headers: {
          'Authorization': `bearer ${oAuthToken}`,
          'User-Agent': userAgent
        }
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to get user info: ${res.statusText}`);
    }
    
    const data = await res.json();

    userInfo = {
      redditUserId: data.id,
      redditUsername: data.name
    }
    return userInfo;
  }
  catch (error) {
    console.log(error);
    throw error;
  }
}

// COMMENTS STUFF:
export async function getUserComments(userName) {
    const cached = await redis.get(userName);

    if (cached) {
        return cached;
    }
    else {
      let commentsList = []
      await getUserCommentsRecur(userName, commentsList);
      
      await redis.set(userName, JSON.stringify(commentsList));

      return commentsList;
    }
}

async function getUserCommentsRecur(userName, list, prevAfter = null) {

  const url = `https://www.reddit.com/user/${userName}/comments.json?limit=100${prevAfter ? `&after=${prevAfter}` : ""}`;

  try {
    const res = await fetch(url);
    if (res) {
      const data = await res.json();
      const comments = simpleCommentDetails(data);

      for (const comment of comments) {
        list.push(comment);
      }

      let currAfter = data.data.after;
      if (currAfter) {
        await getUserCommentsRecur(userName, list, currAfter);
      }
    }
  } catch (error) {
    console.log(`in function getUserComments ${error}`);
    return null;
  }
}

function simpleCommentDetails(comment) {
    let userComments = comment.data.children.map(({ data }) => {
        return {
            id: data.id,
            subreddit_id: data.subreddit_id,
            subreddit: data.subreddit,
            replies: data.replies,
            post_title: data.link_title,
            score: data.score,
            is_post_author: data.link_author === data.author,
            comment_body_raw: data.body,
            comment_body_html: data.body_html,
            comment_link: `https://www.reddit.com${data.permalink}`,
            comment_date_utc: data.created_utc, //date created
            comment_edited_utc: data.edited //date edited
        };
    });

    return userComments;
}