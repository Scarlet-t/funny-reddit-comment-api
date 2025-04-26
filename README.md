# ⋆｡°✩ reddit-user-comment-api ✩°｡⋆  

Ever needed to ~~cyberstalk someone at 3am~~ dig through someone's reddit comments, then tear at the lack of search options? I bestow upon you *filters* and *search* and **power**. Not revolutionary in the slightest but nonetheless helpful (i hope?)

Is it RESTful?  
kinda  
Does it have tests?  
absolutely not  
does it work?  
Surprisingly, yes... well at least i think so.

𓆩♡𓆪 **anyway heres the link have fun :3** 𓆩♡𓆪   
[vercel link here lol]

---

## ✧ Endpoints ✧

### 1. `/api/comments/:userName`

> **Get *all* the comments for a given reddit user.**  
> Example:  
> `/api/comments/ilikeredpandasx3`  

---

### 2. `/api/comments/:userName/search`


**Query Parameters:**

| Param            | What It Does                                           | Example                     |
|------------------|--------------------------------------------------------|-----------------------------|
| `keywords`       | Comma-separated keywords to search for                 | `rat,gaburger,"red panda"`    |
| `keywords_in`    | Where to search: `Comment` or `Post Title AND Comment` | `Comment`                   |
| `search_type`    | `AND` (all keywords) or `OR` (any keyword)             | `AND`                       |
| `case_sensitive` | Respect case? (`true` or `false`)                      | `false`                     |
| `subreddit`      | Filter by subreddit name                               | `wallstreetbets`            |
| `subreddit_id`   | Filter by subreddit ID                                 | `t5_2qh1i`                  |
| `date_start`     | Filter by start date (UTC)                      | `2023-01-01`                |
| `date_end`       | Filter by end date (UTC)                        | `2024-12-31`                |

> **Example search:**  
> `/api/comments/ilikeredpandasx3/search?keywords=API,update&search_type=OR&keywords_in=Post%20Title%20AND%20Comment&subreddit=announcements`

---

## ✧ Planned/Unfinished (or things i accidentally implemented before finding out that i didnt need them for my use case and so they're just commented out until i find something to do with them)

- `/api/subreddits` → Search subreddits by name (mostly for the subreddit comment filter)
- **User login + token caching** via Reddit OAuth2
- **Search by edited comments** or **date edited**

---

## ✧ License

**MIT License**  
if anyone cares owo
