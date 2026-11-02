/* Territory Brief and Monthly Review & Plan, rebuilt for a phone. */
import { DATA, I, Pill, RT, TeamLink, SectionHead, useNav } from './ui.jsx';
import { BRIEF, MONTHLY } from './brief-data.js';
import { AnswerItem, LiftBars } from './ask.jsx';

const CALLS = DATA.answers['Who should I call first today, and what should I lead with?'].items;

function GoalCard({ goal }) {
  return (
    <div className="card goal">
      <div className="goal-head"><span className="eyebrow">Sales to goal</span><span className="goal-scope">{goal.scope}</span></div>
      {goal.rows.map(r => (
        <div key={r.label} className="goal-row">
          <div className="goal-line"><span>{r.label}</span><b>{r.pct}%</b></div>
          <div className="bar"><span style={{ width: `${Math.min(r.pct, 100)}%` }} /></div>
          <div className="goal-cap">{r.text}</div>
        </div>
      ))}
    </div>
  );
}

function Kpis({ items }) {
  const [first, ...rest] = items;
  return (
    <div className="kpis">
      <div className="card kpi kpi-lead">
        <span className="eyebrow">{first.label}</span>
        <b className={`kpi-v${first.accent ? ' g' : ''}`}>{first.value}</b>
        <span className="kpi-n">{first.note}</span>
      </div>
      <div className={`kpi-grid n${rest.length}`}>
        {rest.map(k => (
          <div key={k.label} className="card kpi">
            <span className="eyebrow">{k.label}</span>
            <b className={`kpi-v sm${k.accent ? ' g' : ''}`}>{k.value}</b>
            <span className="kpi-n">{k.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero({ hello, lede }) {
  return (
    <div className="brief-hero">
      <h2>{hello}</h2>
      <p><RT text={lede} /></p>
    </div>
  );
}

function HowBuilt({ text }) {
  return <p className="how"><b>How this was built: </b>{text}</p>;
}

function TerritoryBrief() {
  const nav = useNav();
  return (
    <div className="brief-body">
      <Hero hello={BRIEF.hello} lede={BRIEF.lede} />
      <GoalCard goal={BRIEF.goal} />
      <Kpis items={BRIEF.kpis} />

      <section>
        <SectionHead title="What changed" />
        <div className="card list">
          {BRIEF.changed.map(c => (
            <div key={c.title} className="change">
              <span className="dot" style={{ background: c.dot }} />
              <div>
                <div className="change-t">{c.team ? <TeamLink name={c.team}>{c.title}</TeamLink> : c.title}</div>
                <p className="change-b"><RT text={c.body} /></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="Your meetings this week" note="From your calendar, with the signal to lead with and nearby FA/Teams to add." />
        <ol className="days">
          {BRIEF.meetings.map(d => (
            <li key={d.day} className="day">
              <div className="day-head"><b>{d.day}</b><span>{d.place}</span></div>
              <div className="card list">
                {d.items.map(m => (
                  <div key={m.team} className="meet">
                    <div className="meet-top">
                      <TeamLink name={m.team} strong />
                      <Pill small>{m.pill}</Pill>
                    </div>
                    <div className="sub">{m.meta}</div>
                    <p className="meet-b"><RT text={m.body} /></p>
                  </div>
                ))}
                {d.add && (
                  <div className="add-slot">
                    <div className="add-head"><I n="plus" />{d.add.head}</div>
                    <p><TeamLink name={d.add.team} strong /> · {d.add.body}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <SectionHead title="Priority calls" note="Ranked by signal confidence × expected opportunity, with the touch that has lifted sales most for that signal." />
        <div className="ans-list static">{CALLS.map((it, i) => <AnswerItem key={it.title} it={it} />)}</div>
      </section>

      <section>
        <SectionHead title="Relationships going cold" note="Segment A producers with no external meeting in 6 months or more." />
        <div className="card list amber">
          {BRIEF.cold.map(c => (
            <div key={c.team} className="cold">
              <div className="meet-top"><TeamLink name={c.team} strong /><Pill tone="a" small>{c.days}</Pill></div>
              <div className="sub">{c.sub}</div>
              <p className="meet-b">{c.body}</p>
              <div className="cold-foot">
                <span>{c.last}</span>
                <button type="button" className="link-btn" onClick={() => nav.openTeam(c.team)}>Plan outreach <I n="arrow-right" /></button>
              </div>
            </div>
          ))}
        </div>
        <p className="foot-note"><RT text={BRIEF.coldNote} /></p>
      </section>

      <section>
        <SectionHead title="Follow up within 48 hours" />
        <div className="card list">
          {BRIEF.followups.map(f => (
            <div key={f.text} className="follow-row"><p><RT text={f.text} /></p><Pill tone={f.tone} small>{f.due}</Pill></div>
          ))}
        </div>
      </section>
      <HowBuilt text={BRIEF.howBuilt} />
    </div>
  );
}

function MonthlyReview() {
  const M = MONTHLY, O = M.october;
  const maxP = Math.max(...M.products.map(p => p[1]));
  const maxC = Math.max(...M.converted.map(c => c[1]));
  return (
    <div className="brief-body">
      <Hero hello={M.hello} lede={M.lede} />
      <div className="part"><span>Part 1</span>September</div>
      <GoalCard goal={M.goal} />
      <Kpis items={M.kpis} />

      <section>
        <SectionHead title="Sales by product" />
        <div className="card list">
          {M.products.map(([n, v, ch]) => (
            <div key={n} className="prod">
              <div className="prod-line"><span>{n}</span><span><b>${v.toFixed(1)}M</b><em className={ch.startsWith('−') ? 'r' : 'g'}>{ch}</em></span></div>
              <div className="bar thin"><span style={{ width: `${(v / maxP) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="What worked: sales lift by touch" note="Daily sales run rate in the 30 days after a touch versus the 30 days before, same FA/Team. Trailing 90 days." />
        <LiftBars bars={M.lift} />
        <p className="foot-note">{M.liftNote}</p>
      </section>

      <section>
        <SectionHead title="Which signals converted" note="Lift on meetings where you led with that signal." />
        <div className="card list">
          {M.converted.map(([n, v]) => (
            <div key={n} className="prod">
              <div className="prod-line"><span>{n}</span><b className={v >= 1.5 ? 'g' : 'm'}>{v.toFixed(1)}x</b></div>
              <div className="bar thin"><span className={v >= 1.5 ? '' : 'muted'} style={{ width: `${(v / maxC) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="compare">
          {M.nbaCompare.map(c => (
            <div key={c.label} className={`card cmp${c.strong ? ' strong' : ''}`}><b>{c.value}</b><span>{c.label} ({c.n})</span></div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="Top wins" />
        <div className="card list">
          {M.wins.map(w => (
            <div key={w.team} className="win">
              <div className="meet-top"><TeamLink name={w.team} strong /><b className="g win-v">{w.value}</b></div>
              <div className="sub">{w.sub}</div>
              <p className="meet-b">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="Needs attention" />
        <div className="stack">
          {M.attention.map(a => (
            <div key={a.title} className={`card attn tone-${a.tone}`}>
              <div className="meet-top"><b className="attn-t">{a.title}</b><Pill tone={a.tone} small>{a.tag}</Pill></div>
              <div className="sub">{a.sub}</div>
              <p className="meet-b"><RT text={a.body} /></p>
            </div>
          ))}
        </div>
      </section>

      <div className="part"><span>Part 2</span>October</div>
      <div className="card goal-oct">
        <span className="eyebrow">{O.goal.label}</span>
        <b className="hi-a">{O.goal.value}</b>
        <p>{O.goal.note}</p>
      </div>
      <Kpis items={[O.kpis[2], O.kpis[0], O.kpis[1]]} />

      <section>
        <SectionHead title="Booked meetings and what to lead with" note="From your October calendar." />
        <div className="card list">
          {O.booked.map(b => (
            <div key={b.team} className="meet">
              <div className="meet-when">{b.when}</div>
              <div className="meet-top"><TeamLink name={b.team} strong /><Pill small>{b.pill}</Pill></div>
              <div className="sub">{b.meta}</div>
              <p className="meet-b"><RT text={b.body} /></p>
            </div>
          ))}
        </div>
        <div className="card warn">
          <div className="warn-t"><I n="triangle-exclamation" />{O.noSignal.title}</div>
          <p><RT text={O.noSignal.body} /></p>
        </div>
      </section>

      <section>
        <SectionHead title={O.trip.title} note={O.trip.note} />
        <ol className="trip">
          {O.trip.stops.map((s, i) => (
            <li key={s.team}>
              <span className="trip-n">{i + 1}</span>
              <div className="card trip-card">
                <div className="meet-top"><TeamLink name={s.team} strong /><Pill tone={s.recent ? 'b' : 'a'} small>{s.days}</Pill></div>
                <div className="sub">{s.sub}</div>
                <p className="meet-b">{s.body}</p>
                <div className="tags"><span className="tag">Recommended touch: {s.touch}</span></div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <SectionHead title="Focus products" />
        <div className="stack">
          {O.focus.map(f => (
            <div key={f.name} className="card focus">
              <div className="meet-top"><b className="attn-t">{f.name}</b><Pill small>Focus</Pill></div>
              <div className="sub">{f.stat}</div>
              <p className="meet-b"><RT text={f.body} /></p>
            </div>
          ))}
        </div>
      </section>
      <HowBuilt text={M.howBuilt} />
    </div>
  );
}

export function BriefScreen({ active, view }) {
  const isBrief = view === 'brief';
  const B = isBrief ? BRIEF : MONTHLY;
  return (
    <section className={`screen brief${active ? '' : ' hidden'}`} aria-label={isBrief ? 'Territory Brief' : 'Monthly Review & Plan'}>
      <div className="gutter">
        <div className="brief-meta">
          <span className="brief-kind"><I n={isBrief ? 'sun' : 'chart-line'} />{isBrief ? 'Territory Brief' : 'Monthly Review & Plan'}</span>
          <span>{isBrief ? `${BRIEF.date} · ${BRIEF.schedule}` : `${MONTHLY.date} · ${MONTHLY.schedule}`}</span>
        </div>
        {isBrief ? <TerritoryBrief /> : <MonthlyReview />}
      </div>
    </section>
  );
}
