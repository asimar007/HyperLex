# HyperLex AI

_Your Curious Companion for Smarter Web Exploration_

🚀 **Imagine having a research assistant who never sleeps** – that's HyperLex AI. Born from my late-night coding sessions and countless cups of coffee, this project is my answer to information overload in the AI era. While it shares DNA with tools like Perplexity AI, I've injected it with some personal magic dust.

## Screenshots

### Home Page

![Homepage](https://github.com/asimar007/Cross-Region-Migration-of-AWS-EBS-Volumes/blob/main/Screenshot/HyperLex/HomePage.png?raw=true)

---

### Sources

![Source Image](https://github.com/asimar007/Cross-Region-Migration-of-AWS-EBS-Volumes/blob/main/Screenshot/HyperLex/Source%20Image.png?raw=true)

---

### Response

![Response](https://github.com/asimar007/Cross-Region-Migration-of-AWS-EBS-Volumes/blob/main/Screenshot/HyperLex/Response.png?raw=true)

---

### Sources Tab

![Sources Tab](https://github.com/asimar007/Cross-Region-Migration-of-AWS-EBS-Volumes/blob/main/Screenshot/HyperLex/Source%20Tab.png?raw=true)

---

### Hackernews Feed

![Hackernews Feed](https://github.com/asimar007/Cross-Region-Migration-of-AWS-EBS-Volumes/blob/main/Screenshot/HyperLex/Hackernews%20Feed.png?raw=true)

## Table of Contents

- [What's the Big Idea?](#whats-the-big-idea)
- [Why Build Another AI Tool?](#why-build-another-ai-tool)
- [Under the Hood (Features)](#under-the-hood)
- [Cool Stuff You Can Do](#cool-stuff-you-can-do)
- [Battle Scars (What I Learned)](#battle-scars)

- [Usage](#usage)
- [Let's Get Cooking (Installation)](#lets-get-cooking)

## What's the Big Idea?

We've all been there – drowning in 15 open tabs, three conflicting articles, and no clear answers. HyperLex AI is my attempt to fix that mess. It's like if Wikipedia, ChatGPT, and your tech-savvy friend had a baby.

**The Goodies You Get:**

- Instant analysis of complex topics.
- Live tech news from Hacker News baked right in
- A chat interface that actually remembers what you talked about yesterday
- Sources cited like a proper research paper (take that, Wikipedia!)

## Why Build Another AI Tool?

_(Confession Time 😁)_  
I fell in love with Perplexity AI but kept thinking: "What if it could...?" So I rage-coded for three weekends straight. Here's my personal spin:

- Hacker News Integration
- Providing a lightweight, developer-friendly codebase for educational purposes.
- Focusing on performance optimization and scalability.

_**Disclaimer:** This is my weekend project, not the next billion-dollar startup. Use it, break it, learn from it!_

## Under the Hood

_"What sorcery is this?" – My Mom_

**Frontend Magic**

- Next.js 14 (App Router) – Because I like shiny new things
- TailwindCSS – For those "I want it purple with sparkles" moments
- Framer Motion – Makes things wiggle (productivity boost, trust me)

**Brain Parts**

- DeepSeekAI – The actual smart cookie
- Tavily API – Our simple web-crawling sidekick
- Local Storage – Remembers your weird questions so you don't have to

**News Engine**

- Hacker News Feed – Fresh tech drama delivered hot

## Cool Stuff You Can Do (Features)

### 🤖 Ask Anything Mode

"Explain quantum computing like I'm 5" → Get a answer with puppet analogies

### 📰 Tech News Radar

- Live Hacker News feed
- Filter by drama level (😴 Mild → 🤯 Meltdown)

### 💬 Chat Time Machine

Your conversation history stays put – even after you close that incognito tab

### 🔍 Source Detective Mode

Click sources to see where the AI got its info – perfect for fact-checking your friend's conspiracy theories

## Battle Scars (What I Learned)

_What Didn't Kill Me..._

- **Next.js 14 App Router**  
  Learned to love/hate file-based routing. Pro tip: `layout.tsx` is life
- **Integration of multiple AI services (DeepSeek AI, Tavily)**
- **Streaming Responses**  
  Made me appreciate every loading spinner I've ever hated
- **TypeScript Types**  
  Defined 37 variations of "AI might say something weird"
- **Mobile First**  
  Because apparently people use phones now? Wild.

## Let's Get Cooking

**You'll Need:**

- Node.js (v20+) – The newer the better
- API keys (free tier works):

  - DeepSeek API (bring your own brain)
  - Tavily API (our web crawler buddy)

## Usage

The application offers multiple ways to interact:

1.  **Chat Interface** : Ask questions or request analysis on any topic.
2.  **News Feed** : Browse the latest tech news from Hacker News.
3.  **Suggestions** : Use predefined prompts for quick access to common queries.

---

**Setup Cheat Code:**

```
git clone https://github.com/asimar007/HyperLex
cd HyperLex
echo "Hello from Asim" > .env.local
npm install
npm run dev
```
