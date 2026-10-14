# Salesforce Integration: Middle-Path Roadmap

Native FA/Team, Brief and Ask Field inside Salesforce, with the full Field dashboard suite embedded. Packaged for multiple asset manager clients through AppExchange.

- **Date:** October 7, 2026
- **Status:** Draft for discussion · estimates, not commitments
- **Powered by:** Field
- *Confidential · For internal use only.*

---

## 1. Summary

Field will ship a managed Salesforce package that brings three high-use screens into Salesforce natively, on desktop and mobile: the **FA/Team panel**, the **Brief** and **Ask Field**. The full dashboard suite stays in the Field portal and is embedded in a Field tab with single sign-on. Field remains the system of record; Salesforce holds only CRD references, configuration and optional Tasks.

This approach delivers most of the native experience at roughly 60% of the cost of rebuilding the full suite, and lets usage data decide what moves native next.

| Item | Plan |
|---|---|
| **Approach** | Native for FA/Team, Brief, Ask Field; full suite embedded |
| **Distribution** | Managed package on AppExchange for multiple asset manager clients |
| **Primary platform** | Sales Cloud, plus the Salesforce mobile app |
| **Timeline** | Embedded suite demo-able at week 10; production pilot at week 24; AppExchange listing around week 32 |
| **Build team** | About 5 FTE equivalent during build |
| **Run cost** | About 1–1.5 engineers after launch |

### Assumptions

- Asset manager clients share their Salesforce data with Field.
- CRD matching to industry data packs, and team definitions (client teams or FINTRX), are already planned in Field and are not part of this estimate.
- Most clients run Sales Cloud. Financial Services Cloud is supported but not optimized for in phase 1.
- Mobile is a slimmed-down experience limited to the Brief, Ask Field and the FA/Team page.

## 2. Scope

| Area | In scope | Delivery |
|---|---|---|
| **FA/Team panel** | Field summary, top signals, recommended action, key metrics, "Open in Field" link on Contact and Account pages | Native, desktop and mobile |
| **Brief** | Role-aware Brief (wholesaler or manager) on the Home page and a mobile page | Native, desktop and mobile |
| **Ask Field** | Chat panel in the utility bar and on record pages; mobile quick action; aware of the FA/Team on screen | Native, desktop and mobile |
| **Dashboard suite** | Territory Analytics, leadership dashboards, Briefs & Reviews, Data Packs and the rest of the portal | Embedded Field tab with SSO and deep links |
| **Admin setup** | CRD field mapping, team source, Task write-back, connection test | Native setup page |
| **Write-back** | Optional Salesforce Tasks created from signals | Native, off unless the admin enables it |

### Out of scope

- Native rebuilds of the full dashboard suite.
- Offline mode in the Salesforce mobile app.
- Copying Field data into Salesforce custom objects beyond configuration and Tasks.
- CRD matching and team modeling (covered by existing Field plans).

## 3. Roadmap at a glance

| Phase | Weeks | Outcome |
|---|---|---|
| **0 · Setup and architecture** | 1–4 | Architecture, service contract and designs signed off |
| **1 · Foundation and embedded suite** | 5–10 | Package installs; full suite opens in Salesforce with SSO |
| **2 · Native FA/Team panel** | 9–15 | Same signals in Salesforce as in Field, desktop and phone |
| **3 · Brief and Ask Field** | 13–19 | All three native screens complete |
| **4 · Hardening and pilot** | 18–24 | Pilot clients using it daily; security package ready |
| **5 · AppExchange review and launch** | 24–32 | Listed on AppExchange; repeatable 1–2 day install |

**Timeline by month (about 4 weeks each)**

| Phase | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 0 · Setup | ■ | | | | | | | |
| 1 · Foundation | | ■ | ■ | | | | | |
| 2 · FA/Team panel | | | ■ | ■ | | | | |
| 3 · Brief + Ask Field | | | | ■ | ■ | | | |
| 4 · Hardening + pilot | | | | | ■ | ■ | | |
| 5 · Review + launch | | | | | | ■ | ■ | ■ |

## 4. Phase detail

### Phase 0 · Setup and architecture
*Weeks 1–4*

1. Join the Salesforce partner program; register the package namespace and developer orgs.
2. Sign-in for the embedded tab: single sign-on into the portal, with Salesforce as the identity provider or each client's existing SSO.
3. Sign-in for native screens: an OAuth connection from each client's Salesforce org to Field, with Salesforce users linked to Field users by email or SSO ID.
4. Define the service contract Field exposes: Brief, FA/Team summary, signals, Ask Field, setup and health check.
5. Set data rules: Field is the system of record; Salesforce stores CRD references, configuration and optional Tasks only.
6. Design compact desktop and mobile layouts for the three native screens.

> **Done when:** Architecture signed off, service contract agreed, designs approved.

### Phase 1 · Foundation and embedded suite
*Weeks 5–10*

1. Package skeleton: release pipeline, permission sets for reps and managers, and a "Field" app in Salesforce.
2. Field-side: keys per client, service endpoints, rate limits and logging.
3. Embedded suite: a Field tab that opens the portal already signed in, plus deep links that land on a specific FA/Team page.
4. Admin setup page: CRD field mapping, team source (client or FINTRX), Task write-back on or off, connection test.

> **Done when:** A pilot org installs the package, connects, opens the full suite on the Field tab and clicks from an FA through to the matching Field page.

### Phase 2 · Native FA/Team panel
*Weeks 9–15*

1. Record-page panel for Contacts (FAs) and Accounts or teams: Field summary, top signals, recommended action, key metrics and "Open in Field".
2. Mobile layout with stacked cards and large tap targets.
3. States for no CRD match, no data and errors.
4. Optional: create a Salesforce Task from a signal.

> **Done when:** A rep on an FA page, on desktop or phone, sees the same signals as the Field FA/Team page.

### Phase 3 · Brief and Ask Field
*Weeks 13–19*

1. Brief: Home page component and mobile page, role-aware (wholesaler or manager), using the same content as the email brief.
2. Ask Field: chat panel in the utility bar and on record pages, plus a mobile quick action.
3. Ask Field knows the FA/Team on screen, so "What should I talk to Smith Group about?" works without naming the team.
4. Answers arrive progressively through Salesforce, or stream directly from Field if that option is chosen.
5. Usage tracking for every native screen and the embedded tab.

> **Done when:** All three native screens work on desktop and mobile in a test org.

### Phase 4 · Hardening and pilot
*Weeks 18–24*

1. Test across org setups: profiles, sharing rules and custom Contact fields.
2. Device testing on iOS and Android in the Salesforce mobile app.
3. Performance target: FA/Team panel loads in under 2 seconds.
4. Security preparation: code scan, penetration test of Field's servers (in scope for the review) and security documentation.
5. Pilot with one or two asset managers, sandbox first, then production; collect feedback and fix issues.

> **Done when:** Pilot clients use it daily and the security package is ready to submit.

### Phase 5 · AppExchange review and launch
*Weeks 24–32*

1. Submit for security review; plan for one round of fixes.
2. Listing: description, screenshots, demo org and pricing model.
3. Onboarding kit: install guide, admin setup checklist and rep quick-start.

> **Done when:** Listed on AppExchange with a repeatable install of about 1–2 days per client.

### Ongoing, after launch

- Regression testing for each of Salesforce's three releases a year.
- Client onboarding, support and package updates.
- Move further screens native when usage data shows which embedded screens reps open most.

## 5. Team and staffing

| Role | Allocation | When |
|---|---|---|
| **Salesforce lead / architect** | 1.0 | Phases 0–5 |
| **Salesforce developers** | 2.0 | Phases 1–5 |
| **Field backend developer** | 1.0 | Mainly phases 1–3 |
| **QA** | 0.5 | Phases 2–5 |
| **Designer** | 0.5 | Phases 0–3 |
| **After launch** | 1–1.5 engineers | Ongoing |

### Milestones

| Week | Milestone |
|---|---|
| **10** | Embedded suite live in a pilot org; demo-able to clients |
| **19** | All native screens complete |
| **24** | Production pilot |
| **~32** | AppExchange listing |

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **AppExchange security review** | Longest lead item; first submissions often fail | Pen-test Field's servers early; scan code every sprint; budget a fix round |
| **Different setups at each client** | Custom fields, profiles and sharing rules break assumptions | Admin setup page; test against several org shapes; budget time per install |
| **Mobile app limits** | Chart libraries and offline behavior are restricted | Keep mobile screens simple; link to Field for deep analysis |
| **Ask Field response delivery** | Salesforce server calls cannot stream answers | Decide early between progressive delivery and direct streaming from Field |
| **Partner program terms** | Agreement and revenue share affect pricing | Confirm current terms with a Salesforce partner manager in phase 0 |

### Decisions to make early

| Decision | Options | Needed by |
|---|---|---|
| **Ask Field delivery** | Through Salesforce servers, or directly from Field | Week 4 |
| **Task write-back default** | On by default, or off until the client admin enables it | Week 8 |
| **Pricing** | Per user, per org, or bundled into existing data pack tiers | Week 20 |
| **Pilot clients** | Which one or two asset managers, and whether their Salesforce setup is typical | Week 12 |
