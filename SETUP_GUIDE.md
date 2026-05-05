# 🚀 SIGNAL GRID - Complete Setup Guide

## What You're Building

A fully automated cybersecurity & AI intelligence platform that:
- ✅ Scrapes 88+ sources every 24 hours (Reddit, HN, YouTube)
- ✅ Uses Claude AI to analyze and rate every piece of content
- ✅ Filters out noise - only shows 3.5/5.0+ rated items
- ✅ Watches YouTube videos FOR YOU and tells you if they're worth watching
- ✅ 100% free using GitHub Actions + free API tiers
- ✅ Beautiful cyberpunk UI that you can customize

## Prerequisites (5 minutes to get)

### 1. GitHub Account
- Go to github.com and sign up (free)

### 2. Anthropic Claude API Key (REQUIRED)
1. Visit: https://console.anthropic.com
2. Sign up (Google/email)
3. You get **$5 free credit** (~1000 daily scrapes worth)
4. Go to "API Keys" → "Create Key"
5. Copy the key (starts with `sk-ant-...`)
6. **Save it somewhere safe**

### 3. YouTube Data API Key (OPTIONAL but recommended)
1. Visit: https://console.cloud.google.com
2. Create new project (name it "Signal Grid")
3. Enable "YouTube Data API v3"
4. Credentials → Create Credentials → API Key
5. Copy the key
6. **Save it somewhere safe**

---

## Installation Methods

### Method A: GitHub (Easiest - Fully Automated)

#### Step 1: Upload to GitHub
1. Download all the files from this folder
2. Go to github.com
3. Click "+" (top right) → "New repository"
4. Name: `signal-grid` (or whatever you want)
5. Make it Public
6. Don't initialize with README (we have one)
7. Click "Create repository"

8. Upload files:
   ```bash
   # If you have git installed:
   cd signal-grid
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/signal-grid.git
   git push -u origin main
   ```
   
   OR use GitHub's web upload (easier if no git):
   - Click "uploading an existing file"
   - Drag all files from this folder
   - Commit

#### Step 2: Add Your API Keys (CRITICAL)
1. In your GitHub repo, go to: **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add secret #1:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Claude API key (sk-ant-...)
4. Click **"Add secret"**
5. Add secret #2:
   - Name: `YOUTUBE_API_KEY`
   - Value: Your YouTube API key
6. Click **"Add secret"**

#### Step 3: Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: Select **`gh-pages`**, folder: **`/ (root)`**
4. Click **Save**

#### Step 4: Run First Scrape
1. Go to **Actions** tab
2. Click on **"Daily Signal Grid Update"**
3. Click **"Run workflow"** (right side)
4. Select branch: `main`
5. Click **"Run workflow"**
6. Wait 2-3 minutes (watch the progress)

#### Step 5: Access Your Site! 🎉
Your site will be live at:
```
https://YOUR-USERNAME.github.io/signal-grid/
```

The workflow runs **every day at 6 AM UTC** automatically.

---

### Method B: Local Testing (For Development)

1. **Extract all files** from this folder to a directory

2. **Install Python 3.8+** (if not already)
   - Windows: https://python.org/downloads
   - Mac: `brew install python3`
   - Linux: `sudo apt install python3 python3-pip`

3. **Set environment variables**:
   
   **Windows (PowerShell):**
   ```powershell
   $env:ANTHROPIC_API_KEY="your-claude-key-here"
   $env:YOUTUBE_API_KEY="your-youtube-key-here"
   ```
   
   **Mac/Linux:**
   ```bash
   export ANTHROPIC_API_KEY="your-claude-key-here"
   export YOUTUBE_API_KEY="your-youtube-key-here"
   ```

4. **Run the quick start script**:
   ```bash
   chmod +x quickstart.sh
   ./quickstart.sh
   ```
   
   OR manually:
   ```bash
   # Install dependencies
   pip3 install requests youtube-transcript-api
   
   # Run scraper
   python3 scraper.py
   
   # Start web server
   python3 -m http.server 8000
   ```

5. **Visit**: http://localhost:8000

---

## Customization Guide

### Change Scraping Time

Edit `.github/workflows/daily-update.yml`:

```yaml
schedule:
  - cron: '0 6 * * *'  # Currently 6 AM UTC
```

**Cron format**: `minute hour day month weekday`

Examples:
- `0 */6 * * *` - Every 6 hours
- `0 8 * * 1-5` - 8 AM on weekdays only
- `0 0,12 * * *` - Midnight and noon daily

**Convert to your timezone**:
- 6 AM UTC = 2 AM EDT = 11 PM PDT
- Use: https://crontab.guru to test

### Add/Remove YouTube Channels

Edit `scraper.py`, find this section:

```python
self.youtube_creators = [
    'UC8butISFwT-Wl7EV0hUK0BQ',  # David Bombal
    # Add more here
]
```

**How to find channel ID**:
1. Go to any YouTube channel
2. View page source (Ctrl+U)
3. Search for: `"channelId"`
4. Copy the ID (starts with UC...)

### Add/Remove Subreddits

Edit `scraper.py`:

```python
self.reddit_subreddits = [
    'netsec',
    'your_subreddit_here',
]
```

### Change Rating Threshold

Edit `scraper.py` (bottom of `scrape_all()` method):

```python
# Currently filters for 3.5+
results['news'] = [n for n in processed_news if n['rating'] >= 3.5]
results['videos'] = [v for v in processed_videos if v['rating'] >= 3.5]

# Change to 4.0 for stricter filtering:
results['news'] = [n for n in processed_news if n['rating'] >= 4.0]
```

### Customize Colors/Theme

Edit `styles.css`:

```css
:root {
    /* Change these colors */
    --bg-dark: #0a0e1a;        /* Main background */
    --accent-cyan: #00ffff;     /* Primary highlights */
    --accent-magenta: #ff00ff;  /* Secondary highlights */
    --accent-orange: #ff6b35;   /* Video section */
}
```

### Add Your Own Name/Branding

Edit `index.html`:

```html
<!-- Change this line -->
<span class="label">TERRY 3.0 // DAILY INTEL</span>

<!-- To your name/brand -->
<span class="label">YOUR NAME // SECURITY INTEL</span>
```

---

## Troubleshooting

### ❌ GitHub Action Fails

**Check:**
1. Did you add API keys to Secrets? (Settings → Secrets → Actions)
2. Are the secret names exactly: `ANTHROPIC_API_KEY` and `YOUTUBE_API_KEY`?
3. Click on the failed action → View logs to see error

**Common errors:**
- "Invalid API key" → Check your Anthropic key at console.anthropic.com
- "Permission denied" → Make sure repo is public OR enable Actions in Settings

### ❌ Website Shows "Loading..."

**Check:**
1. Did the GitHub Action complete successfully? (Green checkmark)
2. Is GitHub Pages enabled? (Settings → Pages)
3. Did you select `gh-pages` branch?
4. Wait 2-3 minutes after first deploy
5. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### ❌ No Videos Showing

**Check:**
1. Is `YOUTUBE_API_KEY` set in GitHub Secrets?
2. YouTube API has 10,000 units/day free - did you hit the limit?
3. Are the channel IDs correct in `scraper.py`?

### ❌ Claude API Out of Credit

- Free tier is $5 credit
- Each scrape costs ~$0.03
- That's ~166 days of daily scrapes
- Check remaining credit: console.anthropic.com
- Add payment method to continue after credit exhausted

### ❌ Local Testing Not Working

```bash
# Python not found?
python3 --version  # Should show 3.8+

# Dependencies not installing?
pip3 install --user requests youtube-transcript-api

# Permission denied on quickstart.sh?
chmod +x quickstart.sh

# Windows: Use Git Bash or WSL
```

---

## Advanced Tips

### Email Yourself the Digest

Add to scraper.py:

```python
import smtplib
from email.mime.text import MIMEText

def send_email_digest(results):
    # Configure your email
    msg = MIMEText(f"Today's signals: {len(results['news'])} news, {len(results['videos'])} videos")
    msg['Subject'] = 'Signal Grid Daily Digest'
    msg['From'] = 'your-email@gmail.com'
    msg['To'] = 'your-email@gmail.com'
    
    # Send via Gmail (requires app password)
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login('your-email@gmail.com', 'your-app-password')
        smtp.send_message(msg)

# Call in main():
send_email_digest(results)
```

### Add Slack/Discord Webhooks

```python
import requests

def post_to_slack(results):
    webhook_url = "your-slack-webhook-url"
    message = {
        "text": f"🔮 Signal Grid Update\n📰 {len(results['news'])} news items\n🎥 {len(results['videos'])} videos"
    }
    requests.post(webhook_url, json=message)
```

### Track Trends Over Time

Save each day's data to `history/` folder:

```python
import shutil
from datetime import datetime

# In main():
date_str = datetime.utcnow().strftime('%Y-%m-%d')
os.makedirs('history', exist_ok=True)
shutil.copy('data.json', f'history/data-{date_str}.json')
```

Then build trend analysis UI to see topics over time.

---

## Cost Breakdown (Updated May 2026)

| Service | Free Tier | Your Daily Usage | Cost |
|---------|-----------|------------------|------|
| GitHub Actions | 2,000 min/month | ~2 min/day = 60 min/month | **FREE** |
| GitHub Pages | Unlimited hosting | Static site | **FREE** |
| Claude API | $5 credit (~1.67M tokens) | ~10k tokens/day | ~$0.03/day → **FREE for 166 days** |
| YouTube API | 10,000 units/day | ~100 units/day | **FREE** |
| **TOTAL** | | | **$0/month** |

After 166 days, you'll need to add payment to Anthropic ($0.90/month at current usage).

---

## Next Steps

✅ Site is running
✅ Data updating daily
✅ Time to customize!

**Ideas:**
- Change the color scheme to match your brand
- Add more YouTube creators you follow
- Adjust the rating threshold
- Create a mobile app (React Native + this API)
- Add RSS feed for your favorite feed reader
- Build historical trending analysis
- Create weekly digest emails

---

## Need Help?

- Check GitHub Actions logs for errors
- Verify API keys are correct
- Try local testing first (easier to debug)
- Make sure repo is public if using free GitHub

---

**Built with ❤️ by the cybersecurity community**

Enjoy your personal AI-powered intelligence feed! 🔮
