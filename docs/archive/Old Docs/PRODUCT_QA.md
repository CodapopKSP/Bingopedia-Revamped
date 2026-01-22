## Bingopedia Rebuild – Product Q&A

This document captures clarifying questions and your answers to guide the rebuild.

---

### 1. High‑Level Strategy & Scope

1. **Vision & longevity**  
   - *Question:* Over the next 2–3 years, do you see Bingopedia as a small side project, or something you expect to actively grow (features, traffic, marketing)?

   Mostly just a small side project.

2. **Primary goal of this rebuild**  
   - *Question:* If you had to pick one primary goal for this rebuild (e.g., performance, maintainability, feature polish, experimentation), what would it be?

   Maintainability, feature polish, and experimentation. Working with the CSS in the old version was difficult due to random nested elements and such.

3. **Scope discipline**  
   - *Question:* Are you open to cutting small UX “nice‑to‑have”s from the current spec to ship sooner, or is feature parity with the existing game non‑negotiable?

   Non-negotiable.

4. **Tech stack evolution**  
   - *Question:* Do you want to stay on **React + Vite + plain JS**, or explicitly move to **TypeScript** and/or a state management library (e.g., Zustand/Redux)?

   I don't care. We can let the architect decide.

5. **Deployment target**  
   - *Question:* Is Vercel still your preferred deployment platform for both frontend and API, or are you considering alternatives (e.g., Fly.io, Render, self‑hosted)?

   Vercel.

---

### 2. User & Experience Priorities

6. **Audience emphasis**  
   - *Question:* Between “exploration/learning” and “competitive play”, which is more important to you for this version?

   Both. I eventually want to make a "replay game" feature where you can play the same board as a friend. These wouldn't show up on the leaderboard, but I could see it being competitive.

7. **Session length target**  
   - *Question:* Roughly how long do you expect a typical game to last (in minutes) for an “average” player?

   10 minutes.

8. **Mobile vs desktop**  
   - *Question:* Do you expect most players to be on **mobile** or **desktop**, and which should we optimize for first if there’s a tradeoff?

   Mobile.

9. **Onboarding depth**  
   - *Question:* Do you want a minimal single‑paragraph explanation on the start screen, or a more guided onboarding (e.g., short tips, help modal, or first‑game hints)?

   I think we can do both, but it has to be unobtrusive since we will not require users to log in.

10. **Confetti & effects**  
    - *Question:* Is the visual celebration (confetti, animations) a “must‑have” at launch, or could it be temporarily reduced/simplified for performance or scope reasons?

    It can be reduced, but I don't think it needs to. It's a single animation that plays.

---

### 3. Game Design & Mechanics

11. **Difficulty tuning**  
    - *Question:* Do you want us to keep the current random category/article selection as‑is, or tweak it to make games slightly easier or harder (e.g., prefer more inter‑linked topics)?

    Let's keep it as is.

12. **Occupation & other constraints**  
    - *Question:* Beyond the existing “max 1 occupation category per game” constraint, do you want to introduce any new groups/limits (e.g., cities, countries, pop culture)?

    I don't think so. Currently it feels fairly balanced.

13. **Grid size & future modes**  
    - *Question:* For this rebuild, should we **lock in 5×5 only**, or design the code so different grid sizes (3×3, 7×7) are easy to add later, even if no UI exposes them yet?

    Let's allow different grid sizes. That sounds fun. But don't expose it yet.

14. **History interactions**  
    - *Question:* When a user clicks a past article in history, do you want that to always count as a new click and potentially trigger matches/wins, or should some “free navigation” be allowed?

    No, any time they change articles it is a click. Refreshes don't count because those are a stopgap to prevent aricle load misfires.

15. **Tie‑breaking on the leaderboard**  
    - *Question:* If two players have the same score, how should we break ties (e.g., fewer clicks wins, then less time, then earlier date)?

    Let's go with the earlier date.

---

### 4. Leaderboard & Social Layer

16. **Leaderboard visibility**  
    - *Question:* Should the leaderboard be **prominent on the start screen** (as today), or more secondary (e.g., behind a button) to emphasize gameplay first?

    Prominent. It's the main attraction.

17. **Username policy**  
    - *Question:* Do you want any explicit username restrictions beyond length (e.g., no emojis, profanity filter, only alphanumeric and `_-`), or is a light validation enough?

    I think we should. We can add a bad word filter (light though, I don't mind some profanity), but we should make sure to ignore links. We can simply change bad words into random characters.

18. **Abuse / cheating concerns**  
    - *Question:* Are you concerned enough about fake or scripted scores that we should invest in basic anti‑abuse (rate‑limiting, simple heuristics) in this phase?

    I'm not worried about rate limiting, but I am worried about things like people inspecting the code and injecting fake scores on game submit. If someone builds a bot to speedrun the game then I respect it.

19. **Game details modal depth**  
    - *Question:* For the “view game details” modal on leaderboard entries, how deep should we go—just show bingo board + summary, or also full history (possibly long)?

    Let's give the full history. Ideally the user can even click into the bingo squares to get the article summary like in a real game.

20. **Future social features**  
    - *Question:* Are there any “future but important” social ideas (e.g., shareable links, daily challenges, friend boards) that we should keep in mind when structuring data and APIs?

    Daily challenges and sharable links (like a game challenge link) would be great. Links can be "Here's a game I played, you can play too" or also "We both start the same random game from this link".

---

### 5. Data, Scripts, and Operations

21. **Who runs the scripts?**  
    - *Question:* In practice, will it be **you personally** running the data scripts (compile master list, generate curated data), or do you expect other contributors/ops folks to do this?

    Just me.

22. **Data freshness expectations**  
    - *Question:* How often do you realistically want to refresh or expand the article pool (e.g., quarterly, annually, ad‑hoc only when you feel like it)?

    Ad hoc, but rarely.

23. **Tolerance for script friction**  
    - *Question:* Are you okay with a mostly CLI‑driven data update flow, or would you like us to prioritize smoother tooling (better logs, dry‑runs, safety checks) in this phase?

    I don't think we need to run the scripts anymore because the articles are already selected. Let's not focus on it. I only kept the scripts in case we need them someday.

24. **Monitoring & alerts**  
    - *Question:* Do you want any lightweight monitoring/alerting for MongoDB and API health (even simple logs + a status page), or is manual checking sufficient?

    Manual is fine.

25. **Wikipedia rate limits**  
    - *Question:* Are you planning any traffic spikes (e.g., launches on social/newsletters) that might require us to be more conservative with Wikipedia API usage from day one?

    Not that I know of... but I don't have much context. I could see a few dozen or hundred people using it in a day when I share it.

---

### 6. UX / UI Style & Branding

26. **Visual direction**  
    - *Question:* Should the visual style stay close to the current app, or are you open to a modest visual refresh (colors, typography, layout polish) as long as the core layout stays similar?

    I'm open to a reskin. It just has to look great on mobile and desktop and tablet and also different sizes of each.

27. **Brand assets**  
    - *Question:* Beyond the globe icon and confetti, do you have or want any additional branding (logo lockup, color palette, favicon set) we should standardize on?

    None.

28. **Accessibility priority**  
    - *Question:* How high a priority is accessibility (a11y) for this rebuild—“basic good practices” vs. “we want this to be genuinely solid for keyboard and screen readers”?

    We should definitely consider accessibility. It seems like a game that would be fun for vision impaired people. I think as long as it's reasonably functional then it's good enough.

29. **Copy tone**  
    - *Question:* Do you prefer the copy tone to be more playful and gamer‑y, or more neutral/educational (closer to Wikipedia’s tone)?

    Let's keep it neutral. I can rewrite it later if I want.

30. **Localization**  
    - *Question:* Do you anticipate needing localization (multiple languages) in the near future, or is English‑only acceptable for the foreseeable roadmap?

    I think English only is best because all of the articles are in English.

---

### 7. Analytics & Measurement

31. **Analytics tool choice**  
    - *Question:* Do you already have a preferred analytics platform (e.g., Plausible, Google Analytics, PostHog), or should we recommend one biased toward privacy and simplicity?

    I don't have any in mind, just Vercel. I haven't given it much thought, but it's good to consider.

32. **What to measure first**  
    - *Question:* Which 2–3 metrics matter most to you at launch (e.g., games started, games completed, average clicks, leaderboard submissions)?

    Leaderboard submissions is top. Maybe links shared if that feature is done by launch.

33. **Experimentation appetite**  
    - *Question:* Do you foresee wanting A/B tests (e.g., alternate copy/layout) soon, or is that out of scope for now?

    Out of scope.

---

### 8. Team, Process, and Constraints

34. **Team size & roles**  
    - *Question:* Who will actually be working on this rebuild (just you, you + 1–2 devs, a larger team), and do you have dedicated design or QA resources?

    Just me and the AI agents here.

35. **Timeline expectations**  
    - *Question:* Do you have a desired launch window (e.g., “in ~4 weeks”, “this quarter”, “no hard date”) that should influence scope decisions?

    Just whenever it's done.

36. **Risk tolerance**  
    - *Question:* How comfortable are you with launching a “v1.5” that’s slightly imperfect but stable, then iterating, versus holding for a more polished “v2.0”?

    That's fine. But the project isn't huge so I think we can bang it out.

37. **Code reuse vs. greenfield**  
    - *Question:* Besides logic reference, are there any specific bits of the existing implementation (e.g., CSS, layouts) that you explicitly do—or do not—want us to echo in the new build?

    None that I can think of.

38. **Documentation expectations**  
    - *Question:* How much in‑repo documentation do you want beyond the PRD and Q&A (e.g., dev setup guide, architecture overview, data lifecycle doc)?

    You should document as much as you can in repo- and sub directory-level md docs.

---

### 9. Anything Else

39. **Hidden constraints**  
    - *Question:* Are there any constraints we haven’t discussed yet (legal, content policy, hosting limits, budget, etc.) that might affect technical or product decisions?

    None.

40. **Personal “must‑haves”**  
    - *Question:* Are there one or two small details in the current game that you’re especially attached to and would be disappointed to lose in the rebuild?

    I like the article summary when you click a square on the bingo grid. I also like that the timer pauses when the article is loading. And I like that only the useful links are highlighted blue and all other links are made to look like normal plaintext.

---

> Please answer in any format you like (inline here or referencing question numbers). I’ll then record your responses under each question in this file so it becomes a living source of product truth.


