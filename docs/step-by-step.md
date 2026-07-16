# Step-by-Step: GitHub + Google Sheets + Apps Script

This matches the workflow you already know: make a GitHub repo, add files with
code, connect to Google Sheets and Apps Script. No installs, no terminal.

## Part A — Get the site on GitHub

1. Go to **github.com**, log in (or sign up if you don't have an account).
2. Click the **+** icon top-right → **New repository**.
3. Name it `aptitude-dashboard`. Leave everything else default. Click **Create repository**.
4. On the new repo page, click **uploading an existing file** (or drag-and-drop).
5. Drag in these files from this folder: `index.html`, and the `assets` folder
   (containing `style.css`, `app.js`, `logo.jpg`).
6. Scroll down, click **Commit changes**.

## Part B — Turn it into a live website (GitHub Pages)

1. In your repo, click **Settings** (top menu).
2. In the left sidebar, click **Pages**.
3. Under "Branch", choose **main** and folder **/ (root)** → **Save**.
4. Wait ~1 minute, refresh the page. You'll see a link like:
   `https://your-username.github.io/aptitude-dashboard/`
5. Open that link — you should see the login screen, live on the internet.

At this point the dashboard works fully on sample data. Everything below
connects it to your real Google Sheet.

## Part C — Create the Google Sheet (your database)

1. Go to **sheets.google.com** → **Blank spreadsheet**. Rename it "Aptitude Project Data".
2. Rename the first tab (bottom-left) to `Projects`.
3. In row 1, type these headers, one per column:
   `id, name, brand, location, city, manager, status, completion, budget, spent, outstanding, openingDate, riskLevel, nextMilestone`
4. In row 2 onward, add one project per row, matching those columns. Example row 2:
   `prj-001, Marina Walk Café, Aptitude Coffee Co., Marina Walk Unit 12, Abu Dhabi, Sara Al Mazrouei, on-track, 78, 1450000, 1040000, 96500, 2026-09-14, Low, POS Installation`

## Part D — Connect it with Apps Script

1. In your Sheet, click **Extensions → Apps Script**.
2. Delete anything in the editor, and paste in the contents of `apps-script.gs` (in this folder).
3. Click the **Save** icon (or Ctrl/Cmd+S).
4. Click **Deploy → New deployment**.
5. Click the gear icon next to "Select type" → choose **Web app**.
6. Set "Who has access" to **Anyone**. Click **Deploy**.
7. Click **Authorize access**, choose your Google account, click **Advanced → Go to (project name) → Allow**.
8. Copy the **Web app URL** it gives you — it looks like
   `https://script.google.com/macros/s/AKfycb.../exec`

## Part E — Point the website at your Sheet

1. Back in your GitHub repo, open `assets/app.js`, click the pencil ✏️ icon to edit.
2. Find this line near the top:
   ```
   const SHEETS_API_URL = "";
   const USE_LIVE_DATA = false;
   ```
3. Paste your Web App URL between the quotes, and change `false` to `true`:
   ```
   const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycb.../exec";
   const USE_LIVE_DATA = true;
   ```
4. Scroll down, click **Commit changes**.
5. Wait ~30 seconds, refresh your GitHub Pages link — the Dashboard and Projects
   list now show whatever rows are in your Google Sheet.

## Going further
Right now only the `Projects` tab is connected. The `apps-script.gs` file can be
extended with more `if (e.parameter.action === "...")` branches to serve budgets,
milestones, and suppliers from their own tabs the same way — ask for that next
whenever you're ready.
