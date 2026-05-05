# 🔮 SIGNAL GRID - AI-Powered Cybersecurity Intelligence Feed

A fully automated, AI-powered daily briefing system that scans cybersecurity and AI news sources, processes everything through Claude AI, and shows you only what's worth your time.

![Signal Grid](screenshot.png)

## 🎯 What It Does

- **Scrapes 88+ sources daily**: Hacker News, Reddit (r/netsec, r/cybersecurity, r/bugbounty, etc.)
- **Monitors YouTube creators**: David Bombal, John Hammond, Nahamsec, The Cyber Mentor, IppSec, LiveOverflow
- **AI-powered filtering**: Claude analyzes every article and video
- **Intelligent rating system**: Only shows content rated ≥3.5/5.0
- **Video intelligence**: Watches videos, reads transcripts, tells you if it's worth watching
- **Fully automated**: Runs daily via GitHub Actions, completely free

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- GitHub account (free)
- Anthropic API key (free tier: $5 credit)
- YouTube Data API key (free, optional but recommended)

### Step 1: Get Your API Keys

#### Anthropic Claude API (Required)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up (you get $5 free credit - enough for ~1000 daily runs)
3. Create an API key
4. Copy it - you'll need it in Step 3

#### YouTube Data API (Optional but Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the key

### Step 2: Fork & Clone This Repository

```bash
# Fork this repo on GitHub, then:
git clone https://github.com/YOUR-USERNAME/signal-grid.git
cd signal-grid
```

### Step 3: Add Your API Keys to GitHub Secrets

1. Go to your forked repo on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add these secrets:
   - Name: `ANTHROPIC_API_KEY`, Value: Your Claude API key
   - Name: `YOUTUBE_API_KEY`, Value: Your YouTube API key (optional)

### Step 4: Enable GitHub Pages

1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages`, folder: `/ (root)`
4. Click Save

### Step 5: Run Your First Scrape

1. Go to Actions tab
2. Click "Daily Signal Grid Update"
3. Click "Run workflow" → "Run workflow"
4. Wait ~2-3 minutes
5. Your site will be live at: `https://YOUR-USERNAME.github.io/signal-grid/`

## 📁 Project Structure

```
signal-grid/
├── index.html          # Main website
├── styles.css          # Cyberpunk UI theme
├── app.js              # Frontend logic
├── scraper.py          # Python scraper + Claude AI processing
├── data.json           # Generated daily (gitignored in production)
├── .github/
│   └── workflows/
│       └── daily-update.yml  # GitHub Actions automation
└── README.md
```

## 🎨 Customization

### Change Target Sources

Edit `scraper.py`:

```python
# Add/remove YouTube channels
self.youtube_creators = [
    'UC8butISFwT-Wl7EV0hUK0BQ',  # Your channel ID here
]

# Add/remove subreddits
self.reddit_subreddits = [
    'your_subreddit',
]
```

### Adjust Scraping Schedule

Edit `.github/workflows/daily-update.yml`:

```yaml
schedule:
  - cron: '0 6 * * *'  # Change time (currently 6 AM UTC)
  # Format: minute hour day month weekday
  # Examples:
  # '0 */6 * * *'  = Every 6 hours
  # '0 8 * * 1-5'  = 8 AM weekdays only
```

### Change Rating Threshold

Edit `scraper.py`:

```python
# Only show items rated 4.0 or higher (currently 3.5)
results['news'] = [n for n in processed_news if n['rating'] >= 4.0]
results['videos'] = [v for v in processed_videos if v['rating'] >= 4.0]
```

### Customize UI Colors

Edit `styles.css`:

```css
:root {
    --bg-dark: #0a0e1a;        /* Main background */
    --accent-cyan: #00ffff;     /* Primary accent */
    --accent-magenta: #ff00ff;  /* Highlight color */
    --accent-orange: #ff6b35;   /* Video accent */
}
```

## 🧠 How the AI Processing Works

### News Analysis
For each news article, Claude:
1. Reads the title and content
2. Scores relevance (1.0-5.0) based on:
   - Novelty (is this new information?)
   - Impact (does this matter to cybersec/AI professionals?)
   - Actionability (can you do something with this?)
3. Generates a concise summary
4. Provides "signal" - why this matters (or doesn't)

### Video Analysis
For each video, Claude:
1. Reads title, description, and transcript (when available)
2. Determines if worth watching
3. Rates quality (1.0-5.0)
4. Summarizes key points
5. Provides verdict: watch or skip, and why

## 💰 Cost Breakdown (100% Free Tier)

| Service | Free Tier | Cost for Daily Use |
|---------|-----------|-------------------|
| GitHub Actions | 2,000 minutes/month | ~2 min/day = FREE |
| GitHub Pages | Unlimited static hosting | FREE |
| Claude API | $5 credit (~1M tokens) | ~$0.03/day = FREE for months |
| YouTube API | 10,000 units/day | ~100 units/day = FREE |
| **Total** | | **$0/month** |

Your $5 Claude credit lasts ~166 days at typical usage.

## 🔧 Advanced Features

### Local Testing

```bash
# Install dependencies
pip install requests youtube-transcript-api

# Set environment variables
export ANTHROPIC_API_KEY="your-key-here"
export YOUTUBE_API_KEY="your-key-here"

# Run scraper
python scraper.py

# Serve locally
python -m http.server 8000
# Visit http://localhost:8000
```

### Add More AI Features

The scraper uses Claude's API. You can extend it to:
- Generate threat reports
- Correlate related articles
- Track trending topics over time
- Send digest emails
- Create audio summaries (TTS)

Example - Add Threat Report Generation:

```python
def generate_threat_report(self, news_items):
    prompt = f"""Based on these cybersecurity news items from the last 24h, 
    create an executive threat report highlighting:
    1. Emerging threats
    2. Active exploits
    3. Recommended actions
    
    News: {json.dumps(news_items)}"""
    
    # Call Claude API...
    return threat_report
```

### Enhance Video Processing

Install youtube-transcript-api for full transcripts:

```bash
pip install youtube-transcript-api
```

```python
from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(self, video_id):
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return ' '.join([entry['text'] for entry in transcript])
    except:
        return None
```

## 🛠️ Troubleshooting

### GitHub Actions Failing?
- Check your API keys are set correctly in Settings → Secrets
- View detailed logs in Actions tab → Click on failed run
- Make sure GitHub Pages is enabled

### No Data Showing?
- Check `data.json` exists in gh-pages branch
- Open browser console (F12) for JavaScript errors
- Verify the workflow completed successfully

### Claude API Errors?
- Check your API key is valid at console.anthropic.com
- Ensure you have remaining credits
- Rate limiting: Add `time.sleep(2)` between API calls

### YouTube API Quota Exceeded?
- Free tier is 10,000 units/day
- Each search costs ~100 units
- Reduce `maxResults` or number of channels

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Email digest option
- [ ] Slack/Discord webhook integration
- [ ] Custom keyword alerting
- [ ] Historical data & trending analysis
- [ ] Multi-language support
- [ ] RSS feed output
- [ ] Browser extension

## 📜 License

MIT License - Use this however you want!

## 🙏 Credits

Built with:
- [Anthropic Claude API](https://anthropic.com) - AI processing
- [YouTube Data API](https://developers.google.com/youtube/v3) - Video data
- [Hacker News API](https://github.com/HackerNews/API) - News aggregation
- [Reddit JSON API](https://www.reddit.com/dev/api/) - Community content
- [GitHub Actions](https://github.com/features/actions) - Free automation
- [GitHub Pages](https://pages.github.com/) - Free hosting

---

**Made with 🔥 by a cybersecurity enthusiast who got tired of information overload**

If you found this useful, star the repo! ⭐
