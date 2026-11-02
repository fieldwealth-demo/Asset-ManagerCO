/* Territory Brief and Monthly Review & Plan for the external wholesaler
   (Morgan Vance), transcribed from emails/Morning Brief v2.html and
   emails/Monthly Review v2.html in the Asset-ManagerCO repo.

   Inline markup used in the strings:
     [[Team name]]  a tappable FA/Team that opens its profile
     **text**       highlighted figure or product (Field green)
     !!text!!       highlighted warning (amber)                                  */

export const BRIEF = {
  date: 'Tue, Sep 22',
  schedule: 'Emailed weekdays, 6:30 AM ET',
  hello: 'Good morning, Morgan.',
  lede: 'You have **4 meetings this week**, each matched to the signal to lead with, **5 priority calls** and !!3 Segment A relationships going cold!!. Your largest opportunity is [[The Doe Wealth Group]] on Muni Ladder SMA.',
  goal: {
    scope: 'Your territory · all products',
    rows: [
      { label: 'September MTD', pct: 94, text: '$29.0M of $30.9M' },
      { label: 'Year to date', pct: 97, text: '$152M of $157M' },
    ],
  },
  kpis: [
    { label: 'Sales MTD', value: '$29.0M', accent: true, note: '94% to goal · $2.07M/day run rate, up from $1.69M in August' },
    { label: 'Meetings this week', value: '4', note: 'All 4 have an open signal. 2 open slots nearby.' },
    { label: 'Open signals', value: '284', note: '$440M expected opportunity · 12 new since your last brief' },
  ],
  changed: [
    { dot: 'rgb(52,211,153)', title: '$2.35M in sales since your last brief from 4 FA/Teams', body: '[[Keystone Wealth]] ($780K, Private Credit Fund II), [[The Smith Group]] ($640K, Core Equity ETF), [[Harbor Point Advisors]] ($520K, Muni Ladder SMA) and [[John Doe]] ($410K, Tax-Managed Equity SMA). Harbor Point bought 13 days after your Sep 9 meeting.' },
    { dot: 'rgb(167,139,250)', title: '3 new Meeting Opportunity signals', body: "[[Alpine Partners]], [[The Brown Group]] and [[The Smith Group II]] attended Thursday's Muni Ladder SMA webinar. None has been contacted yet. Follow-up inside 48 hours has lifted sales 1.8x in your territory." },
    { dot: 'rgb(248,113,113)', title: 'Retention Risk firmed at Sample Consulting', body: 'A second month of net redemptions at Wingtip RIA, Princeton. $6.2M of your AUM is exposed. Confidence rose to 51.', team: 'Sample Consulting' },
  ],
  meetings: [
    {
      day: 'Wed · Sep 23', place: 'Boston, MA',
      items: [
        { team: 'The Smith Group', pill: 'Upsell · 83', meta: 'Adatum Partners · 10:00 AM · In-person', body: 'Lead with **Expand Core Equity ETF**. Share of wallet is rising in the category with $6.6M of headroom against the peer median. Performance Advantage (81) backs it up.' },
        { team: 'John Doe', pill: 'Upsell · 78', meta: 'Adatum Partners · 2:00 PM · Call', body: 'Lead with **Expand Core Equity ETF**. Just bought Tax-Managed Equity SMA. R12 production is up 54% on the prior year.' },
      ],
      add: { head: "Add while you're in Boston · 11:30 AM open", team: 'Alpine Partners', body: 'Northwind Securities. Muni Ladder SMA at 88 confidence, $9.4M. Webinar attendee, no external meeting in 127 days.' },
    },
    {
      day: 'Thu · Sep 24', place: 'Philadelphia, PA',
      items: [
        { team: 'Keystone Wealth', pill: 'Perf adv. · 82', meta: 'Fabrikam Financial · 11:00 AM · In-person', body: 'Lead with **Core Equity ETF** performance versus the competing hold, $9.6M expected. They just bought Private Credit Fund II. Cross-sell (74) is the second topic.' },
      ],
      add: { head: "Add while you're in Philadelphia · 2:30 PM open", team: 'Robert Jones', body: 'Fabrikam Financial. Core Equity ETF at 75, plus Retention Risk on $1.0M of net redemptions.' },
    },
    {
      day: 'Fri · Sep 25', place: 'Virtual',
      items: [
        { team: 'Blue Line Wealth', pill: 'Focus · 80', meta: 'Trey Trust · 9:30 AM · Virtual', body: 'Lead with **Muni Ladder SMA**, $8.1M expected. Production fell from $7.2M to $1.0M over 12 months with no redemption event. Treat it as a relationship reset.' },
      ],
    },
  ],
  cold: [
    { team: 'Summit Advisory', sub: 'Tailspin Capital · Stamford, CT', days: '333 days', body: 'Fallen Angel. Production fell from $9.3M to $1.8M over 12 months. Performance Advantage on Core Equity ETF (79) is the reason to call.', last: 'Last external touch: Oct 24, 2025 · In-person meeting' },
    { team: 'Charter Oak Advisors', sub: 'Litware Advisors · Hartford, CT', days: '305 days', body: '$8.6M R12 and $29.6M in your funds, still growing without coverage. Upsell on Core Equity ETF (77).', last: 'Last external touch: Nov 21, 2025 · Conference' },
    { team: 'Doe & Roe Advisors', sub: 'Proseware Group · Hartford, CT', days: '245 days', body: '$14.9M R12. Two focus signals open at 81: Core Equity ETF and Muni Ladder SMA.', last: 'Last external touch: Jan 20, 2026 · Virtual meeting' },
  ],
  coldNote: 'All three are within an hour of each other. A Connecticut day also reaches [[Harbor Point Advisors]] in Greenwich.',
  followups: [
    { text: 'Webinar attendees: [[Alpine Partners]], [[The Brown Group]], [[The Smith Group II]]', due: 'Due Fri', tone: 'a' },
    { text: 'Thank-you call to [[Keystone Wealth]] and [[Harbor Point Advisors]] on their recent purchases', due: 'Today', tone: 'b' },
  ],
  howBuilt: "Your daily sales, CRM activity by meeting type and upcoming calendar, combined with monthly data-pack holdings and flows. Signals refresh nightly. Touch lift compares each FA/Team's daily sales run rate in the 30 days before and after a touch, trailing 90 days.",
};

export const MONTHLY = {
  date: 'September',
  schedule: 'Emailed 1st business day',
  hello: 'September in review, Morgan.',
  lede: 'Sales reached **$41.8M**, **101% to goal** and up 18% on August, led by Private Credit Fund II and Muni Ladder SMA. In-person meetings and fast webinar follow-up drove the most lift. Coverage is still spread too thin across Segment C.',
  goal: {
    scope: 'September closed · all products',
    rows: [
      { label: 'September', pct: 101, text: '$41.8M of $41.4M' },
      { label: 'Year to date', pct: 97, text: '$152M of $157M' },
    ],
  },
  kpis: [
    { label: 'Sales', value: '$41.8M', accent: true, note: '101% to goal · $1.99M/day · August $35.4M' },
    { label: 'External activities', value: '22', note: '12 in-person · 5 calls · 4 virtual · 1 event' },
    { label: 'Signals acted on', value: '46', note: '18 converted within 30 days · $12.4M' },
    { label: 'New producers', value: '2', note: 'Liberty Bell Advisors, Mark Smith' },
  ],
  products: [
    ['Private Credit Fund II', 14.8, '+22%'],
    ['Tax-Managed Equity SMA', 6.6, '+9%'],
    ['Global Opportunity Fund', 4.5, '−4%'],
    ['Muni Ladder SMA', 4.3, '+31%'],
    ['Core Equity Fund', 3.6, '+3%'],
    ['Core Equity ETF', 2.7, '+12%'],
    ['3 other products', 5.3, '+2%'],
  ],
  lift: [['In-person meeting', 34, 2.4], ['Conference / event', 6, 1.9], ['Webinar + follow-up ≤48h', 11, 1.8], ['Virtual meeting', 19, 1.5], ['Phone call', 41, 1.2], ['Webinar, no follow-up', 14, 1.1], ['Email', 58, 1.0]],
  liftNote: 'Webinars only paid off with a follow-up inside 48 hours. Without one, lift was close to email.',
  converted: [['Performance Advantage', 2.6], ['Upsell', 2.2], ['Focus: Muni Ladder SMA', 1.9], ['Focus: Core Equity ETF', 1.7], ['Fee Advantage', 1.2]],
  nbaCompare: [
    { value: '2.3x', label: 'Meetings where you led with the next best action', n: 22, strong: true },
    { value: '1.3x', label: 'Meetings on another topic', n: 31 },
  ],
  wins: [
    { team: 'The Doe Wealth Group', sub: 'Contoso Wealth · New York, NY', value: '$7.2M', body: 'Tax-Managed Equity SMA and Core Equity ETF across the team, 6 days after an internal call on the Upsell signal.' },
    { team: 'The Smith Group', sub: 'Adatum Partners · Boston, MA', value: '$2.9M', body: 'Core Equity ETF, 4 days after a specialist meeting on Performance Advantage.' },
    { team: 'Harbor Point Advisors', sub: 'Litware Advisors · Greenwich, CT', value: '$2.9M', body: 'Muni Ladder SMA, 13 days after your in-person meeting on the focus signal.' },
  ],
  attention: [
    { tag: 'Coverage', tone: 'b', title: 'Coverage is weighted to Segment C', sub: 'Rolling 12 · external activity', body: 'Segment A (27 FA/Teams) produces 99% of your sales but took 36% of your external activity. Segment C (54 FA/Teams) took 37% for $1.1M of sales.' },
    { tag: 'Risk', tone: 'r', title: 'Net redemptions at 9 FA/Teams', sub: 'Retention Risk signals', body: 'Largest at [[Sample Consulting]] ($6.2M exposed) and [[The Brown Group]] ($4.6M). Both are producers with open Upsell signals.' },
    { tag: 'Recovery', tone: 'p', title: '19 Fallen Angels', sub: 'Production down 60%+ on prior 12', body: 'Largest is [[Summit Advisory]], down from $9.3M to $1.8M. No external meeting in 333 days.' },
  ],
  october: {
    goal: { label: 'October goal', value: '$5.0M behind year-to-date goal', note: '$41.0M for October closes the year-to-date gap by December at the current run rate.' },
    kpis: [
      { label: 'Booked meetings', value: '11', note: '7 matched to open signals' },
      { label: 'Re-engage', value: '5', note: 'Segment A, no external meeting in 6+ months' },
      { label: 'Open signal opp.', value: '$440M', note: '284 signals · 120 FA/Teams', accent: true },
    ],
    booked: [
      { team: 'The Brown Group', when: 'Tue, Oct 6', meta: 'Contoso Wealth · New York, NY · In-person', pill: 'Focus · 82', body: 'Introduce **Private Credit Fund**, $7.1M expected. Address the $4.6M of net redemptions first.' },
      { team: 'Meridian Family Office', when: 'Wed, Oct 7', meta: 'Wingtip RIA · New York, NY · In-person', pill: 'Upsell · 83', body: 'Expand **Core Equity ETF**, $3.3M. First external meeting in 222 days.' },
      { team: 'Alpine Partners', when: 'Tue, Oct 20', meta: 'Northwind Securities · Boston, MA · In-person', pill: 'Focus · 88', body: 'Introduce **Muni Ladder SMA**, $9.4M. Bring the Performance Advantage case on Core Equity ETF.' },
      { team: 'Granite Ridge Partners', when: 'Thu, Oct 22', meta: 'Proseware Group · Pittsburgh, PA · Virtual', pill: 'Focus · 76', body: 'Introduce **Muni Ladder SMA**, $2.0M. Fallen Angel: production down from $1.1M to $0.3M.' },
    ],
    noSignal: { title: '4 booked meetings have no signal above 60', body: '[[Oakfield Wealth Management]] (Pittsburgh), [[Morgan Public]] (Melville), [[Alex Brown]] (Allentown) and [[Mary Brown]] (Wilmington) are all Segment C. Hand them to your internal partner and use the time for the Connecticut trip below.' },
    trip: {
      title: 'Suggested trip: Connecticut',
      note: 'No meetings booked. Four Segment A FA/Teams within an hour of each other, $50M of open signal opportunity.',
      stops: [
        { team: 'Summit Advisory', sub: 'Tailspin Capital · Stamford', days: '333 days', body: 'Lead with Core Equity ETF performance (79). Fallen Angel.', touch: 'In-person · 2.4x' },
        { team: 'Charter Oak Advisors', sub: 'Litware Advisors · Hartford', days: '305 days', body: 'Expand Core Equity ETF (77). $29.6M in your funds, uncovered.', touch: 'In-person · 2.4x' },
        { team: 'Doe & Roe Advisors', sub: 'Proseware Group · Hartford', days: '245 days', body: 'Introduce Core Equity ETF or Muni Ladder SMA, both at 81.', touch: 'In-person · 2.4x' },
        { team: 'Harbor Point Advisors', sub: 'Litware Advisors · Greenwich', days: '13 days', recent: true, body: "Introduce Core Equity ETF (78) after September's Muni Ladder SMA purchase.", touch: 'Follow-up call · 1.4x' },
      ],
    },
    focus: [
      { name: 'Muni Ladder SMA', stat: '35 FA/Teams · $66M expected', body: 'Converted at 1.9x when you led with it. Top targets: [[The Doe Wealth Group]], [[Alpine Partners]], [[Blue Line Wealth]].' },
      { name: 'Core Equity ETF', stat: '53 focus signals · 14 Performance Advantage', body: 'Performance Advantage adds $79M and is your best-converting signal at 2.6x.' },
      { name: 'Private Credit Fund', stat: '17 FA/Teams · $27.5M expected', body: 'Top targets: [[The Brown Group]], [[The Smith Group II]], [[Chris Brown]].' },
    ],
  },
  howBuilt: "Your daily sales and CRM activity by meeting type, matched to the signals open at the time of each touch, plus your October calendar. Market holdings and competitor flows come from monthly data packs. Lift compares each FA/Team's daily sales run rate in the 30 days before and after a touch.",
};
