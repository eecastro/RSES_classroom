# Rosenberg Self-Esteem Scale: Classroom Edition

A single-page web version of the Rosenberg Self-Esteem Scale (RSES) built for introductory psychology courses. Students take the 10-item scale and get their score along with an explanation of how the scale is scored and evaluated. It is meant as a teaching tool for topics like self-report measurement, reverse scoring, reliability, and validity.

**Privacy:** everything runs in the student's browser. No responses are stored, collected, or sent anywhere, and instructors cannot see individual results.

## About the instrument

The RSES was developed by sociologist Morris Rosenberg (1965) using data from about 5,000 high school students in New York State. It measures *global* self-esteem, meaning a person's overall evaluation of their own worth. It remains one of the most widely used self-esteem measures in the social sciences.

- **Format:** 10 statements rated on a 4-point scale (Strongly agree to Strongly disagree).
- **Scoring:** each item is scored 0–3, for a total of 0–30. Higher scores mean higher self-esteem. Items 2, 5, 6, 8, and 9 are negatively worded and reverse-scored. Some sources use 1–4 per item (10–40 total); the page reports both.
- **Interpretation:** the scale has no official cutoffs for "high" or "low" self-esteem. The 15–25 band shown on the results page is a commonly used rule of thumb and is labeled as such.

The results page includes an item-by-item scoring table, a comparison of positively and negatively worded items, short notes on psychometrics and the limits of self-report, and discussion questions.

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
  counselingUrl: ""
};
```

Set your course name, and add your campus counseling center's name and web address. Students whose score falls below the typical range see a brief supportive note that links there, along with the U.S. 988 Suicide & Crisis Lifeline.

**3. Publish it with GitHub Pages.** In your repository, go to **Settings → Pages**. Under **Source**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save. After a minute or two the page will be live at `https://<your-username>.github.io/<repository-name>/`.

The file has no external dependencies, so it also works on any other static host, a learning management system that accepts HTML files, or opened directly from a computer.

### Classroom tips

- Students can use **Print or save as PDF** on the results page if you want them to submit their results for an assignment.
- Try the "agree with everything" demo in class: answering *Agree* to all 10 items yields 15, right in the middle. It's a quick way to show why reverse-worded items help control for acquiescence bias.
- Because the topic is personal, let students know that participation is optional and that they never need to share their score.

## Disclaimer

This page is for educational purposes only. It is not a clinical or diagnostic tool, and a single score does not say anything definitive about a person.
