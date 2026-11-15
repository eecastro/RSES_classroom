# Rosenberg Self-Esteem Scale: Classroom Edition

A single-page web version of the Rosenberg Self-Esteem Scale (RSES) built for introductory psychology courses. Students take the 10-item scale and get their score along with an explanation of how the scale is scored and evaluated. It is meant as a teaching tool for topics like self-report measurement, reverse scoring, reliability, and validity.

**Privacy:** out of the box, everything runs in the student's browser and nothing is saved. If you connect a Google Sheet (optional, see below), each student's 10 answers and score are saved anonymously, with the date only, so the instructor dashboard can show class results. The page never asks for a name or email, and the dashboard shows class totals only.

## About the instrument

The RSES was developed by sociologist Morris Rosenberg (1965) using data from about 5,000 high school students in New York State. It measures *global* self-esteem, meaning a person's overall evaluation of their own worth. It remains one of the most widely used self-esteem measures in the social sciences.

- **Format:** 10 statements rated on a 4-point scale (Strongly agree to Strongly disagree).
- **Scoring:** each item is scored 0–3, for a total of 0–30. Higher scores mean higher self-esteem. Items 2, 5, 6, 8, and 9 are negatively worded and reverse-scored. Some sources use 1–4 per item (10–40 total); the page reports both.
- **Interpretation:** the scale has no official cutoffs for "high" or "low" self-esteem. The 15–25 band shown on the results page is a commonly used rule of thumb and is labeled as such.

The results page includes an item-by-item scoring table, a comparison of positively and negatively worded items, short notes on psychometrics and the limits of self-report, and discussion questions. When class results are turned on, it also shows the class average beside the student's own score once at least 5 students have taken part.

## What's in this repository

| File | Purpose |
|---|---|
| `index.html` | The student page (HTML, CSS and JavaScript in one file). |
| `Code.gs` | Optional Google Apps Script that saves anonymous answers to a Google Sheet and returns class results. |
| `dashboard.html` | Optional instructor dashboard of class results. Open `dashboard.html?demo` to see it with made-up data. |

## Class results and the instructor dashboard (optional)

With a Google Sheet connected, `dashboard.html` shows, by **semester** or **school year** and by **section**:

- headline tiles: students, average score (with the U.S. college comparison of about 22 from Schmitt & Allik, 2005), share below the 15–25 typical range, and reliability (Cronbach's alpha)
- average score and share below 15 over time, with a table view
- the score distribution in 3-point ranges, split into below / within / above the typical range
- an item analysis: how students answered each statement (colored by points earned, so reverse scoring is visible), average points, corrected item-total correlation, and alpha if the item were dropped
- wording and response style: positively vs. negatively worded item averages, the correlation between the two halves, and an agreement (acquiescence) index
- a section-by-section comparison and a CSV download

It receives **aggregates only**, never individual rows, and any group (a term, or a section within a term) with fewer than `MIN_N` students (5) is hidden.

### What is saved

Only: the date, the school year, an optional section code from the link, the 10 item scores (0–3, already reverse-scored), the total, the page version, and a random ID that exists only for that browser tab (so a student who changes an answer updates their own row instead of adding one). No name, email, time of day, IP address or device details.

Before turning this on, check your school's consent and data policies, and tell students. Self-esteem data is sensitive. The dashboard can't identify a student, so if the share of low scores looks high, the right response is a general reminder to the whole class about counseling resources.

### Set it up (about 20 minutes)

1. **Make the Sheet.** Create a new, empty Google Sheet. Open **Extensions › Apps Script**, delete the starter code, paste in all of `Code.gs`, and save. Choose `setup` in the function menu and click **Run**, then approve the permissions. This creates the **Responses** and **Trends** tabs.
2. **Deploy it.** Click **Deploy › New deployment**, choose **Web app**, set *Execute as* to **Me** and *Who has access* to **Anyone**, and deploy. Copy the web app URL (it ends in `/exec`). Opening that URL in a browser should show `{"ok":true,...`.
3. **Connect the page.** In `index.html`, paste the URL into `sheetUrl` in the `CONFIG` block. If it's true for your students, also fill in `consentNote` with a sentence about the consent they gave; it's added to the privacy note on the page.
4. **Connect the dashboard.** In `dashboard.html`, paste the same URL into `SHEET_URL` near the top of the script.
5. **Make your dashboard key.** Back in Apps Script, choose `setDashboardKey` and click **Run**. Copy the key it shows, open `dashboard.html` on your GitHub Pages site, and paste it in. Tick "Remember the key on this device" only on your own computer. Keep the key away from students; running `setDashboardKey` again replaces it.
6. **Test.** Take the scale yourself. A row should appear in **Responses** within a few seconds. Delete your test row afterward.

**Sections:** give each class its own link ending in `?section=P3` (and so on). The section code is saved with each response and used by the dashboard's section filter.

**Updating the script later:** after any change to `Code.gs`, publish it again with **Deploy › Manage deployments › Edit › Version: New version › Deploy**. The URL stays the same.

**Settings in `Code.gs`:** `MIN_N` (smallest group shown; keep it the same as `minClassN` in `index.html`), `YEAR_STARTS_MONTH` (8 = August; Fall runs from that month through December, Spring from January on), and `BAND_LO` / `BAND_HI` (the typical-range rule of thumb).

## Attribution

The scale items are by Morris Rosenberg. According to the University of Maryland Department of Sociology, where Rosenberg taught, the RSES is in the public domain and may be used without charge or notification, with scholarly attribution. See the department's [Rosenberg Scale FAQ](https://socy.umd.edu/about-us/rosenberg-scale-faq).

Please cite the scale in any materials that use it:

> Rosenberg, M. (1965). *Society and the adolescent self-image.* Princeton University Press.
>
> Rosenberg, M. (1989). *Society and the adolescent self-image* (Rev. ed.). Wesleyan University Press.

The comparison mean on the results page comes from:

> Schmitt, D. P., & Allik, J. (2005). Simultaneous administration of the Rosenberg Self-Esteem Scale in 53 nations: Exploring the universal and culture-specific features of global self-esteem. *Journal of Personality and Social Psychology, 89*(4), 623–642.

## For other educators

You're welcome to copy this for your own course.

**1. Get your own copy.** Click **Fork** at the top of this repository, or download `index.html` and upload it to a new repository of your own.

**2. Customize it.** Open `index.html` and find the `CONFIG` block near the bottom of the file:

```js
const CONFIG = {
  courseName: "Psych 100",
  counselingName: "your campus counseling center",
  counselingUrl: "",
  sheetUrl: "",       // leave empty to save nothing
  consentNote: "",
  minClassN: 5
};
```

> If you copied this repository after `sheetUrl` was filled in, that address belongs to the original developer's Sheet. Clear it, or replace it with your own, before any student uses your copy.

Set your course name, and add your campus counseling center's name and web address. Students whose score falls below the typical range see a brief supportive note that links there, along with the U.S. 988 Suicide & Crisis Lifeline.

**3. Publish it with GitHub Pages.** In your repository, go to **Settings → Pages**. Under **Source**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save. After a minute or two the page will be live at `https://<your-username>.github.io/<repository-name>/`.

The page has no external dependencies, so it also works on any other static host, a learning management system that accepts HTML files, or opened directly from a computer.

### Classroom tips

- Students can use **Print or save as PDF** on the results page if you want them to submit their results for an assignment.
- Try the "agree with everything" demo in class: answering *Agree* to all 10 items yields 15, right in the middle. It's a quick way to show why reverse-worded items help control for acquiescence bias.
- Because the topic is personal, let students know that participation is optional and that they never need to share their score.

## Disclaimer

This page is for educational purposes only. It is not a clinical or diagnostic tool, and a single score does not say anything definitive about a person.
