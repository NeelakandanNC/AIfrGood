import {
  Box, Container, Typography, Grid, Card, CardContent, Chip,
  Divider, Avatar, Stack, Paper,
} from '@mui/material';
import {
  LocalHospital, Psychology, Groups, Verified, Speed, Description,
  TrendingUp, Security, AutoAwesome, ArrowForward, Circle,
} from '@mui/icons-material';

// ── Palette ──────────────────────────────────────────────────────────────────
const BLUE       = '#1565C0';
const BLUE_LIGHT = '#E3F0FF';
const TEAL       = '#00897B';
const TEAL_LIGHT = '#E0F4F1';
const RED        = '#D32F2F';
const RED_LIGHT  = '#FDECEA';
const AMBER      = '#F57C00';
const AMBER_LIGHT= '#FFF3E0';
const BG         = '#F5F6FA';

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ children, sx = {} }) {
  return (
    <Box sx={{ py: { xs: 6, md: 9 }, ...sx }}>
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
}

function SectionLabel({ text, color = BLUE }) {
  return (
    <Typography
      variant="overline"
      sx={{ color, fontWeight: 700, letterSpacing: 2, display: 'block', mb: 1 }}
    >
      {text}
    </Typography>
  );
}

// ── Pipeline Step card ────────────────────────────────────────────────────────
function PipelineStep({ step, icon, title, desc, color, bg }) {
  return (
    <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: bg, width: 48, height: 48 }}>
          <Box sx={{ color, fontSize: 22 }}>{icon}</Box>
        </Avatar>
        {step < 5 && <Box sx={{ width: 2, flexGrow: 1, minHeight: 32, bgcolor: '#E0E0E0', mt: 1 }} />}
      </Box>
      <Box sx={{ pb: 4 }}>
        <Typography variant="caption" sx={{ color, fontWeight: 700, letterSpacing: 1 }}>
          STEP {step}
        </Typography>
        <Typography variant="h6" fontWeight={700} sx={{ mt: 0.3, mb: 0.8 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {desc}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, bg }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #E8EAF0', borderRadius: 3, height: '100%',
      transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 24px rgba(0,0,0,0.09)' } }}>
      <CardContent sx={{ p: 3 }}>
        <Avatar sx={{ bgcolor: bg, mb: 2, width: 46, height: 46 }}>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        </Avatar>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{desc}</Typography>
      </CardContent>
    </Card>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ value, label, sub }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: 'white',
      border: '1px solid #E8EAF0' }}>
      <Typography variant="h3" fontWeight={800} color="primary.main" sx={{ lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>{label}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Paper>
  );
}

// ── Audience card ─────────────────────────────────────────────────────────────
function AudienceCard({ icon, title, points, color, bg }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #E8EAF0', borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ p: 3.5 }}>
        <Avatar sx={{ bgcolor: bg, mb: 2.5, width: 52, height: 52 }}>
          <Box sx={{ color, display: 'flex', fontSize: 26 }}>{icon}</Box>
        </Avatar>
        <Typography variant="h6" fontWeight={700} gutterBottom>{title}</Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1.5}>
          {points.map((pt, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Circle sx={{ color, fontSize: 7, mt: '6px', flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {pt}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <Box sx={{ bgcolor: BG, minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${BLUE} 0%, #1976D2 60%, #0288D1 100%)`,
        color: 'white', pt: { xs: 7, md: 10 }, pb: { xs: 8, md: 11 },
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Chip
            label="AI-POWERED EMERGENCY MEDICINE"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white',
              fontWeight: 700, letterSpacing: 1.2, mb: 3, fontSize: 11 }}
          />
          <Typography variant="h2" fontWeight={800} sx={{ lineHeight: 1.15, mb: 3,
            fontSize: { xs: '2rem', md: '3rem' } }}>
            Faster Triage.<br />Smarter Decisions.<br />Better Outcomes.
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.88, fontWeight: 400,
            maxWidth: 620, mx: 'auto', lineHeight: 1.7, mb: 4 }}>
            Ydhya is a multi-agent AI triage system that analyses patient vitals,
            symptoms, and history in seconds — delivering specialist-level clinical
            decisions to every emergency department, everywhere.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
            {['Built on Google ADK', 'Gemini 2.0 Flash', 'Real-time SSE Streaming'].map((t) => (
              <Chip key={t} label={t} size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }} />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ── Problem ──────────────────────────────────────────────────────── */}
      <Section>
        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} md={5}>
            <SectionLabel text="THE PROBLEM" color={RED} />
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Emergency triage is broken.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Every year, millions of patients arrive in emergency departments where
              overwhelmed nurses must triage dozens of cases simultaneously —
              under extreme time pressure, with incomplete information, and with no
              specialist on-demand.
            </Typography>
          </Grid>
          <Grid item xs={12} md={7}>
            <Grid container spacing={2}>
              {[
                { v: '27%',  l: 'of patients',      s: 'are mis-triaged on first assessment', color: RED,   bg: RED_LIGHT   },
                { v: '4.2×', l: 'longer wait times', s: 'when specialist input is unavailable', color: AMBER, bg: AMBER_LIGHT },
                { v: '136M', l: 'ER visits / year',  s: 'in the US alone, rising every year',  color: BLUE,  bg: BLUE_LIGHT  },
                { v: '40%',  l: 'of critical cases', s: 'miss early intervention windows',      color: TEAL,  bg: TEAL_LIGHT  },
              ].map((m) => (
                <Grid item xs={6} key={m.l}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3,
                    border: `1px solid ${m.bg}`, bgcolor: m.bg }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color: m.color, lineHeight: 1 }}>
                      {m.v}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 0.5 }}>{m.l}</Typography>
                    <Typography variant="caption" color="text.secondary">{m.s}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Section>

      <Divider />

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <Section sx={{ bgcolor: 'white' }}>
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <SectionLabel text="HOW IT WORKS" />
          <Typography variant="h4" fontWeight={800}>
            A full specialist council — in under 60 seconds.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 560, mx: 'auto' }}>
            Ydhya runs a coordinated pipeline of AI agents, each with a distinct
            clinical role, to produce a complete triage verdict.
          </Typography>
        </Box>

        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <PipelineStep step={1} icon={<Description />} color={BLUE} bg={BLUE_LIGHT}
              title="Patient Intake"
              desc="Clinician enters demographics, vitals (BP, HR, SpO₂, Temp), chief complaints, symptoms, and pre-existing conditions. Documents can be attached for additional context." />
            <PipelineStep step={2} icon={<Psychology />} color={TEAL} bg={TEAL_LIGHT}
              title="AI Classification"
              desc="An XGBoost ML model provides an instant baseline risk score. Simultaneously, an LLM agent analyses symptom patterns and flags clinical red flags for further deliberation." />
            <PipelineStep step={3} icon={<Groups />} color={AMBER} bg={AMBER_LIGHT}
              title="Specialist Council"
              desc="Five specialist agents — Cardiology, Neurology, Pulmonology, Emergency Medicine, and General Medicine — independently evaluate the case and assign relevance, urgency, and confidence scores." />
          </Grid>
          <Grid item xs={12} md={6}>
            <PipelineStep step={4} icon={<Verified />} color={RED} bg={RED_LIGHT}
              title="CMO Review"
              desc="A Chief Medical Officer agent synthesises all specialist inputs, resolves conflicting opinions, generates a final risk level, recommended action, and primary department routing — with a full explanation." />
            <PipelineStep step={5} icon={<Description />} color={BLUE} bg={BLUE_LIGHT}
              title="Clinical Handover"
              desc="A structured PDF report is generated with the full verdict, consolidated workup orders, safety alerts, specialist summaries, and space for the attending doctor's notes." />
          </Grid>
        </Grid>
      </Section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <Section>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <SectionLabel text="FEATURES" />
          <Typography variant="h4" fontWeight={800}>
            Built for the reality of emergency care.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {[
            { icon: <Speed />,         color: BLUE,  bg: BLUE_LIGHT,  title: 'Sub-60s Triage',           desc: 'From vitals entry to full specialist verdict in under a minute — faster than any manual escalation pathway.' },
            { icon: <Groups />,        color: TEAL,  bg: TEAL_LIGHT,  title: 'Multi-Specialist Council',  desc: 'Five AI specialists deliberate in parallel, each contributing domain-specific scores and one-line impressions.' },
            { icon: <Security />,      color: RED,   bg: RED_LIGHT,   title: 'Safety Alert Detection',    desc: 'Automatically flags critical drug interactions, red-flag symptom combinations, and vital sign thresholds.' },
            { icon: <AutoAwesome />,   color: AMBER, bg: AMBER_LIGHT, title: 'Consolidated Workup',       desc: 'Generates a unified ordered list of investigations (STAT / URGENT / ROUTINE) with rationale, avoiding duplicate orders.' },
            { icon: <TrendingUp />,    color: BLUE,  bg: BLUE_LIGHT,  title: 'Quick ML Triage',           desc: 'A lightweight offline XGBoost model for instant risk screening when full AI pipeline is not needed.' },
            { icon: <Description />,   color: TEAL,  bg: TEAL_LIGHT,  title: 'PDF Clinical Reports',      desc: 'Auto-generated handover documents ready for the care team — including doctor notes and timestamped sign-off.' },
            { icon: <LocalHospital />, color: RED,   bg: RED_LIGHT,   title: 'Department Routing',        desc: 'Recommends primary department and flags secondary departments that should be on standby.' },
            { icon: <Verified />,      color: AMBER, bg: AMBER_LIGHT, title: 'Confidence & Consensus',    desc: 'Every verdict includes a confidence score and council consensus label so clinicians know how certain the AI is.' },
          ].map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f.title}>
              <FeatureCard {...f} />
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* ── Who is it for ─────────────────────────────────────────────────── */}
      <Section sx={{ bgcolor: 'white' }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <SectionLabel text="WHO IS IT FOR" />
          <Typography variant="h4" fontWeight={800}>
            Designed for every stakeholder in emergency care.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <AudienceCard
              icon={<LocalHospital />} color={BLUE} bg={BLUE_LIGHT}
              title="Emergency Physicians & Nurses"
              points={[
                'Instantly see a specialist-level triage verdict — no waiting for consults.',
                'Safety alerts surface dangerous patterns you might miss under pressure.',
                'Consolidated workup eliminates duplicate or missed investigations.',
                'PDF handover keeps the entire care team aligned from minute one.',
                'Quick Triage mode works offline for high-volume screening.',
              ]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AudienceCard
              icon={<Groups />} color={TEAL} bg={TEAL_LIGHT}
              title="Hospital Administrators"
              points={[
                'Reduce average triage-to-treatment time and improve throughput.',
                'Standardise triage quality across all shifts and experience levels.',
                'Full audit trail — every decision is logged, explainable, and downloadable.',
                'Integrates into existing workflows without replacing clinical judgment.',
                'Analytics dashboard surfaces queue patterns and bottlenecks in real time.',
              ]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AudienceCard
              icon={<TrendingUp />} color={AMBER} bg={AMBER_LIGHT}
              title="Investors & Partners"
              points={[
                '$65B+ global clinical decision support market, growing at 12% CAGR.',
                'First-mover advantage in multi-agent LLM triage — no direct competitor.',
                'Built on Google ADK with Gemini 2.0 Flash — scalable, low-cost inference.',
                'Hospital SaaS model with per-seat or per-triage pricing flexibility.',
                'Regulatory pathway via CDSM (Clinical Decision Support) classification, not device.',
              ]}
            />
          </Grid>
        </Grid>
      </Section>

      {/* ── Metrics ──────────────────────────────────────────────────────── */}
      <Section>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <SectionLabel text="BY THE NUMBERS" />
          <Typography variant="h4" fontWeight={800}>The impact at a glance.</Typography>
        </Box>
        <Grid container spacing={3}>
          {[
            { value: '<60s',  label: 'Time to Verdict',       sub: 'End-to-end AI pipeline latency'       },
            { value: '5',     label: 'Specialist Agents',     sub: 'Cardiology, Neurology, Pulmonology, EM, GM' },
            { value: '100pt', label: 'Priority Score',        sub: 'Continuous risk quantification'       },
            { value: '3-tier', label: 'Workup Classification', sub: 'STAT · URGENT · ROUTINE'              },
          ].map((m) => (
            <Grid item xs={6} md={3} key={m.label}>
              <MetricCard {...m} />
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* ── Tech Stack ───────────────────────────────────────────────────── */}
      <Section sx={{ bgcolor: 'white' }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <SectionLabel text="TECHNOLOGY" />
          <Typography variant="h4" fontWeight={800}>Built on best-in-class infrastructure.</Typography>
        </Box>
        <Grid container spacing={2} justifyContent="center">
          {[
            { label: 'Google ADK',       desc: 'Multi-agent orchestration' },
            { label: 'Gemini 2.0 Flash', desc: 'LLM inference'             },
            { label: 'XGBoost',          desc: 'ML risk classifier'        },
            { label: 'FastAPI',          desc: 'Backend & SSE streaming'   },
            { label: 'React + MUI',      desc: 'Clinical UI'               },
            { label: 'ReportLab',        desc: 'PDF generation'            },
            { label: 'SQLite',           desc: 'Patient record store'      },
            { label: 'JWT Auth',         desc: 'Secure practitioner login' },
          ].map((t) => (
            <Grid item xs={6} sm={4} md={3} key={t.label}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, textAlign: 'center',
                border: '1px solid #E8EAF0', height: '100%' }}>
                <Typography variant="subtitle2" fontWeight={700}>{t.label}</Typography>
                <Typography variant="caption" color="text.secondary">{t.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${BLUE} 0%, #0288D1 100%)`,
        color: 'white', py: { xs: 7, md: 9 },
      }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <LocalHospital sx={{ fontSize: 48, opacity: 0.9, mb: 2 }} />
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Ready to transform your triage?
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.88, mb: 1, lineHeight: 1.7 }}>
            Ydhya is live and ready for evaluation. Log in to run your first
            AI-assisted triage in under 60 seconds.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
}
