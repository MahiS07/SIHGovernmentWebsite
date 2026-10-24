import { createContext, FormEvent, ReactNode, useContext, useEffect, useMemo, useState } from "react"
import { api, CaseRecord, InstitutionRecord, User } from "./api"

type Page = "home" | "login" | "signup" | "forgot" | "reset" | "verify" | "dashboard" | "cases" | "case" | "institutions" | "institution" | "overlaps" | "compare" | "reports" | "activity" | "notifications" | "settings"

type IconName = "arrow" | "bell" | "calendar" | "cases" | "check" | "chevron" | "clock" | "dashboard" | "directory" | "download" | "eye" | "filter" | "history" | "lock" | "logout" | "menu" | "overlap" | "plus" | "reports" | "search" | "settings" | "shield" | "user" | "x"

const SessionContext = createContext<{user:User|null;setUser:(user:User|null)=>void}>({user:null,setUser:()=>{}})
const BUREAU_OPTIONS = ["Regulation Bureau","PGRC","Approval Bureau","Vigilance Cell"]

const PHOTO =
  "https://images.unsplash.com/photo-1680084521816-cc1ad0433ceb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800"

const cases = [
  {
    id: "AICTE/REG/2025/0148",
    institution: "Saraswati Institute of Technology",
    bureau: "Regulation Bureau",
    received: "18 Jun 2025",
    status: "Under process",
    last: "Inspection response received",
    deadline: "28 Jun 2025",
    priority: "High",
    subject: "Infrastructure and faculty compliance",
  },
  {
    id: "AICTE/PGRC/2025/0139",
    institution: "Saraswati Institute of Technology",
    bureau: "PGRC",
    received: "15 Jun 2025",
    status: "Pending",
    last: "Assigned to Dr. Meera Iyer",
    deadline: "25 Jun 2025",
    priority: "High",
    subject: "Student grievance regarding facilities",
  },
  {
    id: "AICTE/APP/2025/0127",
    institution: "North Valley College of Engineering",
    bureau: "Approval Bureau",
    received: "12 Jun 2025",
    status: "Overdue",
    last: "Reminder sent to institution",
    deadline: "21 Jun 2025",
    priority: "Critical",
    subject: "Intake approval discrepancy",
  },
  {
    id: "AICTE/REG/2025/0116",
    institution: "Aryavarta School of Management",
    bureau: "Regulation Bureau",
    received: "08 Jun 2025",
    status: "Disposed",
    last: "Final order communicated",
    deadline: "20 Jun 2025",
    priority: "Normal",
    subject: "Mandatory disclosure non-compliance",
  },
  {
    id: "AICTE/PGRC/2025/0104",
    institution: "Deccan Technical University",
    bureau: "PGRC",
    received: "02 Jun 2025",
    status: "Under process",
    last: "Hearing scheduled",
    deadline: "02 Jul 2025",
    priority: "Normal",
    subject: "Fee refund grievance",
  },
  {
    id: "AICTE/VIG/2025/0098",
    institution: "Eastern Institute of Design",
    bureau: "Vigilance Cell",
    received: "29 May 2025",
    status: "Pending",
    last: "Preliminary review initiated",
    deadline: "29 Jun 2025",
    priority: "High",
    subject: "Admission process irregularity",
  },
]

const overlaps = [
  {
    institution: "Saraswati Institute of Technology",
    cases: ["AICTE/REG/2025/0148", "AICTE/PGRC/2025/0139"],
    bureaus: "Regulation Bureau · PGRC",
    reason:
      "Shared institution, facility concerns and overlapping complaint period",
    date: "20 Jun 2025",
    status: "Review required",
    confidence: "Strong indicators",
  },
  {
    institution: "North Valley College of Engineering",
    cases: ["AICTE/APP/2025/0127", "AICTE/REG/2025/0082"],
    bureaus: "Approval Bureau · Regulation Bureau",
    reason: "Common intake figures and related approval cycle",
    date: "17 Jun 2025",
    status: "Confirmed",
    confidence: "Officially linked",
  },
  {
    institution: "Eastern Institute of Design",
    cases: ["AICTE/VIG/2025/0098", "AICTE/PGRC/2025/0076"],
    bureaus: "Vigilance Cell · PGRC",
    reason: "Similar admission dates and complainant references",
    date: "12 Jun 2025",
    status: "Under review",
    confidence: "Moderate indicators",
  },
]

const activity = [
  [
    "Today · 10:42",
    "Priya Nair",
    "Status updated",
    "AICTE/REG/2025/0148 moved to Under process",
    "Regulation Bureau",
  ],
  [
    "Today · 09:18",
    "System assistant",
    "Overlap detected",
    "Two complaints for Saraswati Institute were flagged for human review",
    "Coordination",
  ],
  [
    "Yesterday · 16:35",
    "Dr. Meera Iyer",
    "Case assigned",
    "AICTE/PGRC/2025/0139 assigned to PGRC review team",
    "PGRC",
  ],
  [
    "Yesterday · 14:08",
    "Vikram Sen",
    "Document added",
    "Institution response and supporting annexures uploaded",
    "Approval Bureau",
  ],
  [
    "20 Jun · 11:20",
    "Ananya Rao",
    "Decision recorded",
    "Final order recorded for AICTE/REG/2025/0116",
    "Regulation Bureau",
  ],
]

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    cases: (
      <>
        <rect x="4" y="4" width="16" height="17" rx="2" />
        <path d="M8 4V2h8v2M8 9h8M8 13h8M8 17h5" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    chevron: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    directory: (
      <>
        <path d="M4 21V5l8-3 8 3v16M9 9h1M14 9h1M9 13h1M14 13h1M9 17h6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 21h16" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    filter: (
      <>
        <path d="M4 5h16M7 12h10M10 19h4" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3M14 4h6v16h-6" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    overlap: (
      <>
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    reports: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    x: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...common}
    >
      {paths[name]}
    </svg>
  )
}

function Text({
  as = "p",
  className = "",
  children,
}: {
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "label"
  className?: string
  children: ReactNode
}) {
  const Tag = as
  return <Tag className={className}>{children}</Tag>
}

function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  type = "button",
  className = "",
}: {
  children: ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "danger"
  icon?: IconName
  type?: "button" | "submit"
  className?: string
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      onClick={onClick}
      type={type}
    >
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
  icon,
  value,
  onChange,
  hint,
  name,
  required = false,
  readOnly = false,
}: {
  label: string
  placeholder?: string
  type?: string
  icon?: IconName
  value?: string
  onChange?: (v: string) => void
  hint?: string
  name?: string
  required?: boolean
  readOnly?: boolean
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        {icon && <Icon name={icon} />}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

function SelectField({
  label,
  children,
  name,
  value,
  onChange,
}: {
  label?: string
  children: ReactNode
  name?: string
  value?: string
  onChange?: (value:string)=>void
}) {
  return (
    <label className="select-field">
      {label && <span className="field-label">{label}</span>}
      <select name={name} value={value} onChange={e=>onChange?.(e.target.value)}>{children}</select>
    </label>
  )
}

function Logo({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean
  compact?: boolean
}) {
  return (
    <button
      className={`logo ${inverse ? "logo-inverse" : ""}`}
      onClick={() => go("home")}
      aria-label="AICTE OneView home"
    >
      <span className="logo-mark">A</span>
      {!compact && (
        <span>
          <strong>AICTE OneView</strong>
          
        </span>
      )}
    </button>
  )
}

function go(page: Page, recordId?:string) {
  window.location.hash = page === "home" ? "" : recordId ? `${page}?id=${encodeURIComponent(recordId)}` : page
  window.scrollTo({ top: 0, behavior: "smooth" })
}
function selectedId(){return new URLSearchParams(window.location.hash.split("?")[1]||"").get("id")||""}

function Badge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/ /g, "-")
  return (
    <span className={`badge badge-${key}`}>
      <i />
      {status}
    </span>
  )
}

function PublicHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="public-header">
      <Logo />
      <button
        className="mobile-menu"
        onClick={() => setOpen(!open)}
        aria-label="Open navigation"
      >
        <Icon name="menu" />
      </button>
      <nav className={open ? "nav-open" : ""}>
        <button onClick={() => go("home")}>Platform</button>
        <button
          onClick={() => {
            go("home")
            setTimeout(
              () =>
                document
                  .querySelector("#workflow")
                  ?.scrollIntoView({ behavior: "smooth" }),
              50,
            )
          }}
        >
          How it works
        </button>
        <button onClick={() => go("overlaps")}>Coordination</button>
        <button onClick={() => go("login")}>Help & access</button>
      </nav>
      <Button onClick={() => go("login")} icon="arrow">
        Official login
      </Button>
    </header>
  )
}

function Landing() {
  return (
    <div className="landing">
      <PublicHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <i /> Integrated institutional oversight
            </span>
            <Text as="h1">
              One Institution.
              <br />
              <em>One Shared View.</em>
            </Text>
            <Text className="hero-lede">
              A unified workspace for AICTE Bureaus and Cells to monitor
              institution-related complaints, identify connected matters, and
              coordinate action from receipt to resolution.
            </Text>
            <div className="hero-actions">
              <Button onClick={() => go("login")} icon="arrow">
                Access dashboard
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  document
                    .querySelector("#platform")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore platform
              </Button>
            </div>
            <div className="trust-row">
              <span>
                <Icon name="shield" /> Human-led decisions
              </span>
              <span>
                <Icon name="overlap" /> Cross-bureau visibility
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src={PHOTO}
              alt="Contemporary institutional campus building in India"
            />
            <div className="image-caption">
              <span>Built for coordinated governance</span>
              <small>Illustrative institutional photograph</small>
            </div>
            <div className="floating-note">
              <Icon name="overlap" />
              <span>
                <strong>Connected matters, surfaced early</strong>
                <small>
                  Potential overlaps remain subject to official review.
                </small>
              </span>
            </div>
          </div>
        </section>

        <section className="statement" id="platform">
          <span className="section-index">01 / The platform</span>
          <div>
            <Text as="h2">
              Clarity across every
              <br />
              <em>bureau boundary.</em>
            </Text>
          </div>
          <div>
            <Text>
              Complaints rarely fit neatly into one administrative lane. OneView
              brings the complete institutional context forward—without
              replacing the judgement of responsible officers.
            </Text>
            <button className="text-link" onClick={() => go("dashboard")}>
              View the illustrative dashboard <Icon name="arrow" />
            </button>
          </div>
        </section>

        <section className="feature-mosaic">
          <article className="feature feature-wide">
            <span className="feature-number">01</span>
            <div>
              <Icon name="cases" />
              <Text as="h3">A single, legible case record</Text>
              <Text>
                See ownership, current action, deadlines, documents and
                decisions in one carefully structured timeline.
              </Text>
            </div>
            <div className="mini-record">
              <span>AICTE/REG/2025/0148</span>
              <Badge status="Under process" />
              <strong>Saraswati Institute of Technology</strong>
              <small>Infrastructure and faculty compliance</small>
              <div className="record-line">
                <i />
                <i />
                <i />
              </div>
            </div>
          </article>
          <article className="feature feature-sage">
            <span className="feature-number">02</span>
            <Icon name="overlap" />
            <Text as="h3">Overlap, with context</Text>
            <Text>
              Rules assist discovery. Officials compare, confirm and document
              the relationship.
            </Text>
            <div className="orbit">
              <i />
              <i />
              
            </div>
          </article>
          <article className="feature feature-ink">
            <span className="feature-number">03</span>
            <Icon name="clock" />
            <Text as="h3">Deadlines made visible</Text>
            <Text>
              Purposeful reminders focus attention where intervention is due.
            </Text>
            <div className="deadline-row">
              <strong>04</strong>
              <span>
                actions due
                <br />
                <small>in the next 7 days</small>
              </span>
            </div>
          </article>
        </section>

        <section className="workflow" id="workflow">
          <div className="workflow-heading">
            <span className="eyebrow">A clear administrative path</span>
            <Text as="h2">
              From receipt to a<br />
              <em>reasoned resolution.</em>
            </Text>
          </div>
          <div className="workflow-steps">
            {[
              [
                "01",
                "Receive",
                "Capture the complaint, institution, subject and supporting records.",
              ],
              [
                "02",
                "Route",
                "Assign the responsible Bureau, Cell and reviewing officer.",
              ],
              [
                "03",
                "Coordinate",
                "Surface potential related matters for considered human review.",
              ],
              [
                "04",
                "Resolve",
                "Record actions, decisions and the complete institutional history.",
              ],
            ].map((s, i) => (
              <article key={s[0]}>
                <span>{s[0]}</span>
                <div className="step-icon">
                  <Icon
                    name={
                      i === 0
                        ? "cases"
                        : i === 1
                          ? "arrow"
                          : i === 2
                            ? "overlap"
                            : "check"
                    }
                  />
                </div>
                <Text as="h3">{s[1]}</Text>
                <Text>{s[2]}</Text>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <div>
            <span className="eyebrow">For authorised officials</span>
            <Text as="h2">
              A more connected view
              <br />
              begins here.
            </Text>
          </div>
          <Button variant="secondary" onClick={() => go("login")} icon="arrow">
            Enter the workspace
          </Button>
        </section>
      </main>
      <footer>
        <div>
          <Logo inverse />
          <Text>
            Illustrative digital product prototype for coordinated institutional
            complaint monitoring.
          </Text>
        </div>
        <div>
          <strong>Platform</strong>
          <button onClick={() => go("dashboard")}>Dashboard</button>
          <button onClick={() => go("cases")}>Case management</button>
          <button onClick={() => go("reports")}>Reports</button>
        </div>
        <div>
          <strong>Institutional</strong>
          <button>Accessibility</button>
          <button>Privacy</button>
          <button>Usage policy</button>
        </div>
        <div>
          <strong>Contact</strong>
          <span>AICTE Headquarters</span>
          <span>New Delhi, India</span>
          <span>support@example.gov.in</span>
        </div>
        <small>
          Demonstration interface · All records and figures shown are fictional.
        </small>
      </footer>
    </div>
  )
}

function AuthPage({
  mode,
}: {
  mode: "login" | "signup" | "forgot" | "reset" | "verify"
}) {
  const [show, setShow] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const { setUser } = useContext(SessionContext)
  const content = {
    login: [
      "Welcome back",
      "Enter your official credentials to continue to the coordinated workspace.",
    ],
    signup: [
      "Request access",
      "Create an account request. Access is activated only after administrator approval.",
    ],
    forgot: [
      "Recover access",
      "Enter your official email and we’ll send instructions if the account is recognised.",
    ],
    reset: [
      "Set a new password",
      "Choose a strong password that you have not used for this account before.",
    ],
    verify: [
      "Verify your account",
      "Enter the six-digit code sent to your registered official email.",
    ],
  }[mode]
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(false); setError("")
    const form = new FormData(e.currentTarget)
    if (mode === "login") {
      try { const result = await api<{user:User}>("auth/login", {method:"POST",body:JSON.stringify({email:form.get("email"),password:form.get("password")})}); setUser(result.user); go("dashboard") }
      catch (err) { setError(err instanceof Error ? err.message : "Sign in failed.") }
      return
    }
    if (mode === "signup") {
      if (form.get("password") !== form.get("confirmPassword")) { setError("Passwords do not match."); return }
      try { await api("auth/signup", {method:"POST",body:JSON.stringify({name:form.get("name"),email:form.get("email"),password:form.get("password"),bureau:form.get("bureau")})}); setSubmitted(true) }
      catch (err) { setError(err instanceof Error ? err.message : "Account request failed.") }
      return
    }
    setError("This account recovery step is not configured on this installation. Contact the system administrator.")
  }
  return (
    <main className="auth-page">
      <section className="auth-visual">
        <img src={PHOTO} alt="" />
        <div className="auth-overlay">
          <Logo inverse />
          <div>
            <span className="eyebrow light">
              A coordinated institutional view
            </span>
            <Text as="h2">
              Good oversight
              <br />
              begins with
              <br />
              <em>shared context.</em>
            </Text>
            <Text>
              Designed for authorised AICTE officials across Bureaus and Cells.
            </Text>
          </div>
          <small>
            Secure prototype environment · Fictional demonstration data
          </small>
        </div>
      </section>
      <section className="auth-form">
        <button className="back-link" onClick={() => go("home")}>
          ← Back to platform
        </button>
        <div className="form-panel">
          <span className="auth-kicker">
            {mode === "login" ? "Official access" : "Account services"}
          </span>
          <Text as="h1">{content[0]}</Text>
          <Text className="auth-intro">{content[1]}</Text>
          {submitted && (
            <div className="success-message">
              <Icon name="check" />
              <span>
                <strong>
                  {mode === "login"
                    ? "Credentials accepted"
                    : "Request received"}
                </strong>
                <small>
                  {mode === "login"
                    ? "Opening your workspace…"
                    : "Your request is saved and awaits administrator approval."}
                </small>
              </span>
            </div>
          )}
          {error && <div className="error-message" role="alert">{error}</div>}
          <form onSubmit={submit}>
            {mode === "signup" && (
              <>
                <div className="field-grid">
                  <Field label="Full name" name="name" placeholder="Your full name" required />
                  <Field
                    label="Designation"
                    placeholder="e.g. Assistant Director"
                  />
                </div>
                <Field
                  label="Official email"
                  name="email"
                  type="email"
                  placeholder="name@aicte-india.org"
                  icon="user"
                  required
                />
                <SelectField label="Bureau or Cell" name="bureau">
                  <option value="">Choose your organisation</option>
                  <option>Regulation Bureau</option>
                  <option>PGRC</option>
                  <option>Approval Bureau</option>
                  <option>Vigilance Cell</option>
                </SelectField>
              </>
            )}
            {(mode === "login" || mode === "forgot") && (
              <Field
                label="Official email or username"
                name="email"
                placeholder="name@aicte-india.org"
                icon="user"
                required
              />
            )}
            {(mode === "login" || mode === "signup" || mode === "reset") && (
              <div className="password-field">
                <Field
                  label={mode === "reset" ? "New password" : "Password"}
                  name="password"
                  type={show ? "text" : "password"}
                  placeholder="Enter your password"
                  icon="lock"
                  required
                  hint={
                    mode !== "login"
                      ? "Use at least 12 characters with a number and symbol."
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label="Toggle password visibility"
                >
                  <Icon name="eye" />
                </button>
              </div>
            )}
            {(mode === "signup" || mode === "reset") && (
              <Field
                label="Confirm password"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                icon="lock"
                required
              />
            )}
            {mode === "verify" && (
              <Field
                label="Verification code"
                placeholder="000000"
                hint="The code expires in 10 minutes."
              />
            )}
            {mode === "login" && (
              <div className="form-options">
                <label>
                  <input type="checkbox" />
                  Remember me on this device
                </label>
                <button type="button" onClick={() => go("forgot")}>
                  Forgot password?
                </button>
              </div>
            )}
            <Button type="submit" className="full-button" icon="arrow">
              {mode === "login"
                ? "Sign in securely"
                : mode === "signup"
                  ? "Submit access request"
                  : mode === "verify"
                    ? "Verify account"
                    : mode === "reset"
                      ? "Update password"
                      : "Send recovery instructions"}
            </Button>
          </form>
          <div className="auth-switch">
            {mode === "login" ? (
              <>
                Need authorised access?{" "}
                <button onClick={() => go("signup")}>Request an account</button>
              </>
            ) : (
              <>
                Return to{" "}
                <button onClick={() => go("login")}>official login</button>
              </>
            )}
          </div>
          <div className="security-note">
            <Icon name="shield" />
            <span>
              Access and permissions are role-based and subject to administrator
              approval.
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}

const navItems: [Page, string, IconName][] = [
  ["dashboard", "Dashboard", "dashboard"],
  ["cases", "Case management", "cases"],
  ["institutions", "Institution directory", "directory"],
  ["overlaps", "Overlap & coordination", "overlap"],
  ["reports", "Reports & analytics", "reports"],
  ["activity", "Activity history", "history"],
  ["settings", "Settings", "settings"],
]

function AppShell({ page, children }: { page: Page; children: ReactNode }) {
  const [sideOpen, setSideOpen] = useState(false)
  const { user, setUser } = useContext(SessionContext)
  return (
    <div className="app-shell">
      <aside className={sideOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-top">
          <Logo compact />
          <button className="sidebar-close" onClick={() => setSideOpen(false)}>
            <Icon name="x" />
          </button>
        </div>
        <div className="workspace-label">
          <span>{user?.bureau || user?.role || "Official workspace"}</span>
          <small>National workspace</small>
        </div>
        <nav>
          {navItems.map(([id, label, icon]) => (
            <button
              key={id}
              className={
                page === id ||
                (id === "cases" && page === "case") ||
                (id === "institutions" && page === "institution") ||
                (id === "overlaps" && page === "compare")
                  ? "active"
                  : ""
              }
              onClick={() => {
                go(id)
                setSideOpen(false)
              }}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {id === "overlaps" && <em>3</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-help">
          <Icon name="shield" />
          <strong>Need assistance?</strong>
          <span>View platform guidance or contact the support desk.</span>
          <button>Open help centre</button>
        </div>
        <button className="signout" onClick={async () => { try { await api("auth/logout",{method:"POST"}) } finally { setUser(null); go("login") } }}>
          <Icon name="logout" />
          Sign out
        </button>
      </aside>
      <div className="app-frame">
        <header className="app-header">
          <button className="mobile-menu" onClick={() => setSideOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="context">
            <small>Integrated Complaint Monitoring</small>
            <strong>
              {navItems.find((n) => n[0] === page)?.[1] ||
                (page === "case"
                  ? "Case detail"
                  : page === "institution"
                    ? "Institution profile"
                    : "Case comparison")}
            </strong>
          </div>
          <div className="header-actions">
            <button className="search-trigger">
              <Icon name="search" />
              <span>Search anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="notification-button"
              onClick={() => go("notifications")}
            >
              <Icon name="bell" />
              <i />
            </button>
            <button className="profile-button" onClick={() => go("settings")}>
              <span>{user?.name.split(/\s+/).map(part=>part[0]).slice(0,2).join("").toUpperCase()||"U"}</span>
              <div>
                  <strong>{user?.name || "Official user"}</strong>
                  <small>{user?.role || "Signed in"}</small>
              </div>
              <Icon name="chevron" />
            </button>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}

function PageHeading({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <Text as="h1">{title}</Text>
        <Text>{subtitle}</Text>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

function Metric({
  label,
  value,
  change,
  accent,
}: {
  label: string
  value: string
  change: string
  accent?: string
}) {
  return (
    <article className={`metric ${accent || ""}`}>
      <div>
        <span>{label}</span>
        <Icon name="arrow" />
      </div>
      <strong>{value}</strong>
      <small>{change}</small>
    </article>
  )
}

function LineChart() {
  return (
    <div className="chart-wrap">
      <div className="chart-y">
        <span>80</span>
        <span>60</span>
        <span>40</span>
        <span>20</span>
        <span>0</span>
      </div>
      <svg
        viewBox="0 0 620 210"
        preserveAspectRatio="none"
        aria-label="Cases received and disposed over six months"
      >
        <g className="grid">
          <path d="M0 10H620M0 60H620M0 110H620M0 160H620M0 205H620" />
        </g>
        <path
          className="area"
          d="M0 165 C70 150 75 115 125 125 S220 75 250 96 S340 58 375 75 S465 35 500 52 S575 20 620 35 V210 H0Z"
        />
        <path
          className="line received"
          d="M0 165 C70 150 75 115 125 125 S220 75 250 96 S340 58 375 75 S465 35 500 52 S575 20 620 35"
        />
        <path
          className="line disposed"
          d="M0 185 C60 175 88 150 125 155 S210 110 250 127 S332 96 375 105 S455 70 500 83 S575 53 620 62"
        />
        <g className="dots">
          <circle cx="620" cy="35" r="5" />
          <circle className="dot2" cx="620" cy="62" r="5" />
        </g>
      </svg>
      <div className="chart-x">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
      </div>
    </div>
  )
}

function Dashboard() {
  const [summary,setSummary]=useState<any>(null)
  const [bureau,setBureau]=useState("")
  useEffect(()=>{api(`dashboard?bureau=${encodeURIComponent(bureau)}`).then(setSummary).catch(()=>setSummary(null))},[bureau])
  const counts=summary?.counts||{total:0,pending:0,underProcess:0,disposed:0,overdue:0}
  const maxWork=Math.max(1,...(summary?.bureauWorkload||[]).map((x:any)=>x.count))
  return (
    <AppShell page="dashboard">
      <PageHeading
        eyebrow={new Date().toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
        title="Institution Monitoring Overview"
        subtitle="A coordinated view of complaint activity across participating Bureaus and Cells."
        actions={
          <>
            <SelectField value={bureau} onChange={setBureau}>
              <option value="">All Bureaus</option>
              {BUREAU_OPTIONS.map(b=><option key={b}>{b}</option>)}
            </SelectField>
            <Button icon="download" onClick={()=>{window.location.href=`/api/export/cases.csv?bureau=${encodeURIComponent(bureau)}`}}>Export filtered cases</Button>
          </>
        }
      />
      <div className="demo-notice">
        <Icon name="shield" />
        <span>
          <strong>Local prototype records</strong> Seed records are fictional; figures below are calculated from stored cases.
        </span>
        <button>Dismiss</button>
      </div>
      <section className="dashboard-metrics">
        <article className="hero-metric">
          <span>Total registered cases</span>
          <strong>{counts.total.toLocaleString()}</strong>
          <div>
            <span>
              <b>+8.4%</b> from previous period
            </span>
            <div className="spark">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </article>
        <div className="metric-grid">
          <Metric
            label="Pending cases"
            value={String(counts.pending)}
            change="Pending cases"
            accent="amber"
          />
          <Metric
            label="Under process"
            value={String(counts.underProcess)}
            change="Under active review"
            accent="blue"
          />
          <Metric
            label="Disposed"
            value={String(counts.disposed)}
            change="Disposed cases"
            accent="green"
          />
          <Metric
            label="Overdue"
            value={String(counts.overdue)}
            change="Past deadline, excluding disposed"
            accent="red"
          />
        </div>
      </section>
      <section className="dashboard-grid">
        <article className="panel activity-chart">
          <div className="panel-head">
            <div>
              <Text as="h2">Case activity</Text>
              <Text>Complaints received versus disposed</Text>
            </div>
            <div className="legend">
              <span>
                <i className="navy" />
                Received
              </span>
              <span>
                <i className="teal" />
                Disposed
              </span>
            </div>
          </div>
          {summary?.monthly?.length?<div className="monthly-activity">{summary.monthly.map((m:any)=><div key={m.month}><span>{m.month}</span><i style={{height:`${Math.max(8,m.received*20)}px`}} title={`${m.received} received`}/><b style={{height:`${Math.max(8,m.disposed*20)}px`}} title={`${m.disposed} disposed`}/></div>)}</div>:<div className="loading-state">No case activity data available.</div>}
        </article>
        <article className="panel status-panel">
          <div className="panel-head">
            <div>
              <Text as="h2">Case status</Text>
              <Text>Current distribution</Text>
            </div>
            <button>•••</button>
          </div>
          <div className="donut">
            <div>
              <strong>{counts.total.toLocaleString()}</strong>
              <span>total cases</span>
            </div>
          </div>
          <div className="status-list">
            <span>
              <i className="blue" />
            Under process <strong>{counts.underProcess}</strong>
            </span>
            <span>
              <i className="amber" />
            Pending <strong>{counts.pending}</strong>
            </span>
            <span>
              <i className="green" />
            Disposed <strong>{counts.disposed}</strong>
            </span>
            <span>
              <i className="red" />
            Overdue <strong>{counts.overdue}</strong>
            </span>
          </div>
        </article>
        <CoordinationPanel count={summary?.overlaps||0} example={summary?.overlapExample} />
        <article className="panel workload">
          <div className="panel-head">
            <div>
              <Text as="h2">Bureau-wise workload</Text>
              <Text>Open cases by responsible office</Text>
            </div>
            <button className="text-link">
              View report <Icon name="arrow" />
            </button>
          </div>
          {(summary?.bureauWorkload||[]).map((x:any) => (
            <div className="bar-row" key={x.bureau}>
              <span>{x.bureau}</span>
              <div>
                <i style={{ width: `${x.count/maxWork*100}%` }} />
              </div>
              <strong>{x.count}</strong>
            </div>
          ))}
        </article>
        <article className="panel deadlines">
          <div className="panel-head">
            <div>
              <Text as="h2">Upcoming deadlines</Text>
              <Text>Next 7 calendar days</Text>
            </div>
            <span className="date-tile">
              <strong>{new Date().getDate()}</strong>{new Date().toLocaleString('en',{month:'short'}).toUpperCase()}
            </span>
          </div>
          {(summary?.upcoming||[]).slice(0, 3).map((c:CaseRecord, i:number) => (
            <button key={c.caseId} onClick={() => go("case",c.caseId)}>
              <span className={`deadline-day d${i}`}>
                <strong>{new Date(c.deadline).getDate()}</strong>{new Date(c.deadline).toLocaleString('en',{month:'short'})}
              </span>
              <span>
                <strong>{c.institution}</strong>
                <small>
                  {c.caseId} · {c.bureau}
                </small>
              </span>
              <Badge status={i === 1 ? "Overdue" : c.status} />
              <Icon name="chevron" />
            </button>
          ))}
        </article>
      </section>
    </AppShell>
  )
}

function CoordinationPanel({count,example}:{count:number;example?:any}) {
  return (
    <article className="coordination-card">
      <div>
        <span className="eyebrow light">Human review queue</span>
        <Text as="h2">
          Coordination
          <br />
          required
        </Text>
        <Text>
          Potentially related complaints across Bureaus, surfaced for official
          review.
        </Text>
      </div>
      <div className="coordination-count">
        <strong>{String(count).padStart(2,'0')}</strong>
        <span>
          potential
          <br />
          overlaps
        </span>
      </div>
      {example&&<div className="coordination-cases"><span>{example.caseIds[0].split("/").slice(-1)[0]}</span><i/><span>{example.caseIds[1].split("/").slice(-1)[0]}</span></div>}
      <button onClick={() => go("overlaps")}>
        Review coordination queue <Icon name="arrow" />
      </button>
    </article>
  )
}

function TableToolbar({
  search,
  setSearch,
  bureau,
  setBureau,
  status,
  setStatus,
  sort,
  setSort,
}: {
  search: string
  setSearch: (s: string) => void
  bureau: string
  setBureau: (s: string) => void
  status: string
  setStatus: (s: string) => void
  sort: string
  setSort: (s: string) => void
}) {
  return (
    <div className="table-toolbar">
      <label className="table-search">
        <Icon name="search" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search case ID, institution or subject"
        />
      </label>
      <SelectField value={bureau} onChange={setBureau}>
        <option value="">All Bureaus</option>
        {BUREAU_OPTIONS.map(x=><option key={x}>{x}</option>)}
      </SelectField>
      <SelectField value={status} onChange={setStatus}>
        <option value="">All statuses</option>
        {['Pending','Under Process','Disposed','Transferred','Escalated'].map(x=><option key={x}>{x}</option>)}
      </SelectField>
      <SelectField value={sort} onChange={setSort}>
        <option value="newest">Newest first</option>
        <option value="deadline">Deadline soonest</option>
        <option value="priority">Priority: high to low</option>
      </SelectField>
    </div>
  )
}

function Cases() {
  const [search, setSearch] = useState("")
  const [records,setRecords] = useState<CaseRecord[]>([])
  const [total,setTotal]=useState(0);const [page,setPage]=useState(0);const [counts,setCounts]=useState({pending:0,overdue:0})
  const [bureau,setBureau] = useState("")
  const [status,setStatus] = useState("")
  const [sort,setSort] = useState("newest")
  const [activeFilter,setActiveFilter] = useState("")
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")
  const [createOpen,setCreateOpen] = useState(false)
  const load = () => {
    setLoading(true);setError("")
    const query=new URLSearchParams({q:search,bureau,status:activeFilter==="Overdue"?"Overdue":status,sort,limit:"5",offset:String(page*5)})
    api<{items:CaseRecord[];total:number;counts:{pending:number;overdue:number}}>(`cases?${query}`).then(result=>{setRecords(result.items);setTotal(result.total);setCounts(result.counts)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))
  }
  useEffect(()=>{load()},[search,bureau,status,sort,page,activeFilter])
  return (
    <AppShell page="cases">
      <PageHeading
        eyebrow="Case register"
        title="Case Management"
        subtitle="Search, filter and follow every institution-related complaint through its complete lifecycle."
        actions={<Button icon="plus" onClick={()=>setCreateOpen(true)}>Add new case</Button>}
      />
      <div className="quick-filters">
        <button className={!activeFilter?"active":""} onClick={()=>{setActiveFilter("");setStatus("");setPage(0)}}>
          All cases <strong>{total}</strong>
        </button>
        <button className={activeFilter==="Pending"?"active":""} onClick={()=>{setActiveFilter("Pending");setStatus("Pending");setPage(0)}}>
          Pending <strong>{counts.pending}</strong>
        </button>
        <button className={activeFilter==="Overdue"?"active":""} onClick={()=>{setActiveFilter("Overdue");setStatus("");setPage(0)}}>
          Overdue <strong>{counts.overdue}</strong>
        </button>
      </div>
      <section className="table-panel">
        <TableToolbar search={search} setSearch={v=>{setSearch(v);setPage(0)}} bureau={bureau} setBureau={v=>{setBureau(v);setPage(0)}} status={activeFilter==="Overdue"?"Overdue":status} setStatus={v=>{setActiveFilter("");setStatus(v);setPage(0)}} sort={sort} setSort={v=>{setSort(v);setPage(0)}}/>
        {(bureau||status||activeFilter==="Overdue")&&<div className="active-filters"><span>{bureau||status||"Overdue"}</span><button onClick={()=>{setBureau("");setStatus("");setActiveFilter("");setPage(0)}}>Clear filters</button></div>}
        {error&&<div className="error-message" role="alert">{error}</div>}
        {loading&&<div className="loading-state">Loading authorised cases…</div>}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Case / Institution</th>
                <th>Bureau</th>
                <th>Date received</th>
                <th>Current status</th>
                <th>Last action</th>
                <th>Deadline</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {!loading&&records.map((c) => (
                <tr key={c.caseId} onClick={() => go("case",c.caseId)}>
                  <td>
                    <strong>{c.institution}</strong>
                    <small>
                      {c.caseId}
                      <b>{c.priority}</b>
                    </small>
                  </td>
                  <td>{c.bureau}</td>
                  <td>{c.received}</td>
                  <td>
                    <Badge status={c.status} />
                  </td>
                  <td>
                    <span className="last-action">{c.last}</span>
                  </td>
                  <td>
                    <span
                      className={c.status === "Overdue" ? "date-overdue" : ""}
                    >
                      {c.deadline}
                    </span>
                  </td>
                  <td>
                    <button className="row-action" aria-label="Open case">
                      <Icon name="chevron" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading&&records.length === 0 && (
          <EmptyState
            title="No matching cases"
            text="Try removing a filter or searching with a different term."
          />
        )}
        <div className="pagination">
          <span>
            Showing <strong>{total?`${page*5+1}–${Math.min(total,page*5+records.length)}`:"0"}</strong> of {total} authorised cases
          </span>
          <div>
            <button disabled={page===0} onClick={()=>setPage(v=>Math.max(0,v-1))}>←</button>
            <button className="active">{page+1}</button>
            <button disabled={(page+1)*5>=total} onClick={()=>setPage(v=>v+1)}>→</button>
          </div>
        </div>
      </section>
      {createOpen&&<NewCaseDialog onClose={()=>setCreateOpen(false)} onCreated={()=>{setCreateOpen(false);load()}}/>}
    </AppShell>
  )
}

function NewCaseDialog({onClose,onCreated}:{onClose:()=>void;onCreated:()=>void}){
  const [error,setError]=useState("");const [saving,setSaving]=useState(false)
  const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setSaving(true);setError("");const f=new FormData(e.currentTarget);try{await api("cases",{method:"POST",body:JSON.stringify(Object.fromEntries(f))});onCreated()}catch(err){setError(err instanceof Error?err.message:"Could not create case.")}finally{setSaving(false)}}
  return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="form-panel case-dialog" role="dialog" aria-modal="true" aria-labelledby="new-case-title"><button className="dialog-close" onClick={onClose} aria-label="Close">×</button><span className="auth-kicker">Case register</span><h2 id="new-case-title">Register a complaint</h2><p>New records are saved to the local case service and added to the audit trail.</p><form onSubmit={submit}><label className="field"><span className="field-label">Institution</span><input name="institution" required minLength={3} placeholder="Institution name"/></label><div className="field-grid"><label className="field"><span className="field-label">AICTE Permanent ID</span><input name="aicteId" placeholder="If available"/></label><label className="field"><span className="field-label">State</span><input name="state" placeholder="State"/></label></div><label className="field"><span className="field-label">Complaint subject</span><input name="subject" required minLength={3} placeholder="Brief subject"/></label><div className="field-grid"><label className="select-field"><span className="field-label">Bureau / Cell</span><select name="bureau" required><option value="">Select bureau</option>{BUREAU_OPTIONS.map(b=><option key={b}>{b}</option>)}</select></label><label className="select-field"><span className="field-label">Priority</span><select name="priority"><option>Normal</option><option>High</option><option>Critical</option></select></label></div><div className="field-grid"><label className="field"><span className="field-label">Region</span><input name="region" placeholder="Authorised region"/></label><label className="field"><span className="field-label">Deadline</span><input type="date" name="deadline"/></label></div><label className="field"><span className="field-label">Description</span><textarea name="description" rows={3} placeholder="Complaint summary"/></label>{error&&<div className="error-message" role="alert">{error}</div>}<div className="dialog-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{saving?"Saving…":"Create case"}</Button></div></form></section></div>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <span>
        <Icon name="search" />
      </span>
      <Text as="h3">{title}</Text>
      <Text>{text}</Text>
    </div>
  )
}

function CaseDetail() {
  const [record,setRecord]=useState<CaseRecord|null>(null)
  const [error,setError]=useState("")
  const [actionOpen,setActionOpen]=useState(false)
  const [transferOpen,setTransferOpen]=useState(false)
  const [escalationOpen,setEscalationOpen]=useState(false)
  const {user}=useContext(SessionContext)
  const [assignees,setAssignees]=useState<User[]>([])
  const load=()=>api<CaseRecord>(`cases/${encodeURIComponent(selectedId()||cases[0].id)}`).then(setRecord).catch(e=>setError(e.message))
  useEffect(()=>{load()},[])
  useEffect(()=>{if(record&&user&&["Super Admin","Admin / Competent Authority"].includes(user.role))api<User[]>(`assignable-users?bureau=${encodeURIComponent(record.bureau)}&region=${encodeURIComponent(record.region||"")}`).then(setAssignees).catch(()=>setAssignees([]))},[record?.bureau,record?.region,user])
  const updateStatus=async(status:string)=>{if(!record)return;try{const saved=await api<CaseRecord>(`cases/${encodeURIComponent(record.caseId)}`,{method:"PATCH",body:JSON.stringify({status})});setRecord(saved);setError("")}catch(e){setError(e instanceof Error?e.message:"Status update failed.");load()}}
  const assign=async(assignedTo:string)=>{if(!record||!assignedTo)return;try{const saved=await api<CaseRecord>(`cases/${encodeURIComponent(record.caseId)}`,{method:"PATCH",body:JSON.stringify({assignedTo})});setRecord(saved);setError("")}catch(e){setError(e instanceof Error?e.message:"Assignment failed.")}}
  if(!record)return <AppShell page="case"><PageHeading title="Case record" subtitle={error||"Loading case…"}/></AppShell>
  return (
    <AppShell page="case">
      <button className="back-link app-back" onClick={() => go("cases")}>
        ← Back to case register
      </button>
      <div className="case-title">
        <div>
          <span className="case-id">{record.caseId}</span>
          <Text as="h1">
            {record.subject}
          </Text>
          <Text>{record.institution}{record.region?` · ${record.region}`:""}</Text>
        </div>
        <div>
          {user&&["Super Admin","Admin / Competent Authority"].includes(user.role)&&<Button variant="secondary" onClick={()=>setTransferOpen(true)}>Transfer case</Button>}
          <Button icon="plus" onClick={()=>setActionOpen(true)}>Record action</Button>
        </div>
      </div>
      <div className="case-edit-bar"><label className="select-field"><span className="field-label">Update status</span><select value={record.status} onChange={e=>{const s=e.target.value;if(s==="Transferred")setTransferOpen(true);else if(s==="Escalated")setEscalationOpen(true);else updateStatus(s)}}>{["Pending","Under Process","Disposed","Transferred","Escalated"].map(s=><option key={s}>{s}</option>)}</select></label>{user&&["Super Admin","Admin / Competent Authority"].includes(user.role)&&<label className="select-field"><span className="field-label">Assign to officer</span><select value={record.assignedTo||""} onChange={e=>assign(e.target.value)}><option value="">Select an officer</option>{assignees.map(a=><option key={a.id} value={a.id}>{a.name} · {a.role}</option>)}</select></label>}{error&&<span className="error-message" role="alert">{error}</span>}</div>
      <div className="case-summary-strip">
        <div>
          <span>Status</span>
          <Badge status={record.status} />
        </div>
        <div>
          <span>Priority</span>
          <strong className="priority-high">High</strong>
        </div>
        <div>
          <span>Responsible Bureau</span>
          <strong>{record.bureau}</strong>
        </div>
        <div>
          <span>Assigned officer</span>
          <strong>{record.assignedToName||record.assignedTo||"Unassigned"}</strong>
        </div>
        <div>
          <span>Deadline</span>
          <strong>{record.deadline||"Not set"}</strong>
          <small>{record.deadline&&record.status!=="Disposed"?new Date(record.deadline).toLocaleDateString():""}</small>
        </div>
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          <section className="detail-section">
            <Text as="h2">Complaint overview</Text>
            <Text>{record.description||record.subject}</Text>
            <div className="info-grid">
              <div>
                <span>Category</span>
                <strong>{record.category}</strong>
              </div>
              <div>
                <span>Date received</span>
                <strong>{record.received}</strong>
              </div>
              <div>
                <span>Mode received</span>
                <strong>Not recorded</strong>
              </div>
              <div>
                <span>Complainant type</span>
                <strong>Not recorded</strong>
              </div>
            </div>
          </section>
          <section className="detail-section">
            <div className="section-title-row">
              <Text as="h2">Case timeline</Text>
              <Button variant="ghost" icon="filter">
                Filter activity
              </Button>
            </div>
            <div className="timeline">
              {((record as any).history||[]).map((x:any,i:number)=><article key={x.id}><span className={`timeline-dot t${i%4}`}><Icon name="history"/></span><div><small>{new Date(x.at).toLocaleString()}</small><Text as="h3">{x.action}</Text><strong>{x.userName} · {x.bureau||x.role}</strong><Text>{x.detail?.remark||JSON.stringify(x.detail||{})}</Text></div></article>)}
              {!(record as any).history?.length&&<EmptyState title="No recorded actions yet" text="Changes and remarks will appear here with their author and timestamp."/>}
            </div>
          </section>
        </div>
        <aside className="detail-aside">
          <section>
            <div className="section-title-row">
              <Text as="h2">Related cases</Text>
              <span className="count-badge">{(record as any).relatedCases?.length||0}</span>
            </div>
            {((record as any).relatedCases||[]).map((related:CaseRecord)=><div className="related-case" key={related.caseId}><div><Badge status={related.status}/><span>{related.bureau}</span></div><strong>{related.caseId}</strong><Text>{related.subject}</Text><small>Same institution; verify whether matters are related.</small><button onClick={async()=>{const candidates=await api<any[]>("overlaps");const found=candidates.find(o=>o.caseIds.includes(record.caseId)&&o.caseIds.includes(related.caseId));found?go("compare",found.id):go("overlaps")}}>Review relation <Icon name="arrow"/></button></div>)}
            {!(record as any).relatedCases?.length&&<Text>No other cases in your authorised view are linked to this institution.</Text>}
          </section>
          <section><Text as="h2">Documents</Text><Text>Secure document storage is not configured on this installation.</Text></section>
          <section><Text as="h2">Record context</Text><Text>No verified institutional notes have been recorded.</Text></section>
        </aside>
      </div>
      {actionOpen&&<CaseActionDialog record={record} onClose={()=>setActionOpen(false)} onSaved={()=>{setActionOpen(false);load()}}/>}
      {transferOpen&&<TransferDialog record={record} onClose={()=>setTransferOpen(false)} onSaved={()=>{setTransferOpen(false);load()}}/>}
      {escalationOpen&&<EscalationDialog record={record} onClose={()=>setEscalationOpen(false)} onSaved={()=>{setEscalationOpen(false);load()}}/>}
    </AppShell>
  )
}

function CaseActionDialog({record,onClose,onSaved}:{record:CaseRecord;onClose:()=>void;onSaved:()=>void}){
  const [error,setError]=useState("");const [saving,setSaving]=useState(false)
  const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);try{await api(`cases/${encodeURIComponent(record.caseId)}/actions`,{method:"POST",body:JSON.stringify({type:f.get("type"),remark:f.get("remark")})});onSaved()}catch(err){setError(err instanceof Error?err.message:"Unable to record action.")}finally{setSaving(false)}}
  return <div className="modal-backdrop"><section className="form-panel case-dialog" role="dialog" aria-modal="true"><button className="dialog-close" onClick={onClose}>×</button><span className="auth-kicker">{record.caseId}</span><h2>Record case action</h2><form onSubmit={submit}><label className="select-field"><span className="field-label">Action type</span><select name="type"><option>Remark</option><option>Institution contacted</option><option>Evidence reviewed</option><option>Hearing scheduled</option></select></label><label className="field"><span className="field-label">Action and remarks</span><textarea name="remark" rows={4} required minLength={3} placeholder="Record the action taken and any next step"/></label>{error&&<div className="error-message" role="alert">{error}</div>}<div className="dialog-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{saving?"Saving…":"Record action"}</Button></div></form></section></div>
}

function TransferDialog({record,onClose,onSaved}:{record:CaseRecord;onClose:()=>void;onSaved:()=>void}){
  const [error,setError]=useState("");const [saving,setSaving]=useState(false)
  const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);try{await api(`cases/${encodeURIComponent(record.caseId)}`,{method:"PATCH",body:JSON.stringify({status:"Transferred",bureau:f.get("bureau"),reason:f.get("reason")})});onSaved()}catch(err){setError(err instanceof Error?err.message:"Transfer failed.")}finally{setSaving(false)}}
  return <div className="modal-backdrop"><section className="form-panel case-dialog" role="dialog" aria-modal="true"><button className="dialog-close" onClick={onClose}>×</button><span className="auth-kicker">Authorised transfer</span><h2>Transfer case</h2><form onSubmit={submit}><label className="select-field"><span className="field-label">Destination Bureau / Cell</span><select name="bureau" required defaultValue=""><option value="">Select destination</option>{BUREAU_OPTIONS.filter(x=>x!==record.bureau).map(b=><option key={b}>{b}</option>)}</select></label><label className="field"><span className="field-label">Reason</span><textarea name="reason" rows={4} required minLength={4} placeholder="Explain the reason for transfer"/></label>{error&&<div className="error-message" role="alert">{error}</div>}<div className="dialog-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{saving?"Transferring…":"Confirm transfer"}</Button></div></form></section></div>
}

function EscalationDialog({record,onClose,onSaved}:{record:CaseRecord;onClose:()=>void;onSaved:()=>void}){
  const [error,setError]=useState("");const [saving,setSaving]=useState(false)
  const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);try{await api(`cases/${encodeURIComponent(record.caseId)}`,{method:"PATCH",body:JSON.stringify({status:"Escalated",escalationTo:f.get("bureau"),reason:f.get("reason")})});onSaved()}catch(err){setError(err instanceof Error?err.message:"Escalation failed.")}finally{setSaving(false)}}
  return <div className="modal-backdrop"><section className="form-panel case-dialog" role="dialog" aria-modal="true"><button className="dialog-close" onClick={onClose}>×</button><span className="auth-kicker">Escalation</span><h2>Escalate case</h2><form onSubmit={submit}><label className="select-field"><span className="field-label">Destination Bureau / Cell</span><select name="bureau" required defaultValue=""><option value="">Select destination</option>{BUREAU_OPTIONS.map(b=><option key={b}>{b}</option>)}</select></label><label className="field"><span className="field-label">Reason</span><textarea name="reason" rows={4} required minLength={4} placeholder="Explain why escalation is required"/></label>{error&&<div className="error-message" role="alert">{error}</div>}<div className="dialog-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{saving?"Escalating…":"Record escalation"}</Button></div></form></section></div>
}

function Institutions({ detail = false }: { detail?: boolean }) {
  const [rows,setRows]=useState<InstitutionRecord[]>([]);const [search,setSearch]=useState("");const [state,setState]=useState("");const [type,setType]=useState("");const [error,setError]=useState("")
  const query=new URLSearchParams({q:search,state,type})
  useEffect(()=>{api<InstitutionRecord[]>(`institutions?${query}`).then(setRows).catch(e=>setError(e.message))},[search,state,type])
  if (detail) return <InstitutionDetail />
  return (
    <AppShell page="institutions">
      <PageHeading
        eyebrow="Consolidated institutional view"
        title="Institution Directory"
        subtitle="Understand each institution’s complete complaint history across all participating Bureaus and Cells."
        actions={
          <Button variant="secondary" icon="download" onClick={()=>{window.location.href=`/api/export/institutions.csv?${query}`}}>
            Export directory
          </Button>
        }
      />
      <div className="directory-search">
        <label>
          <Icon name="search" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search institution name, city or ID" />
        </label>
        <SelectField value={state} onChange={setState}>
          <option value="">All states</option>
          {[...new Set(rows.map(x=>x.state).filter(Boolean))].map(x=><option key={x}>{x}</option>)}
        </SelectField>
        <SelectField value={type} onChange={setType}>
          <option value="">All institution types</option>
          {[...new Set(rows.map(x=>x.type).filter(Boolean))].map(x=><option key={x}>{x}</option>)}
        </SelectField>
        <Button variant="secondary" icon="filter" onClick={()=>{setState("");setType("");setSearch("")}}>Clear filters</Button>
      </div>
      <div className="directory-list">
        <div className="directory-head">
          <span>Institution</span>
          <span>Related cases</span>
          <span>Pending</span>
          <span>Resolved</span>
          <span>Overdue</span>
          <span />
        </div>
        {rows.map((x, i) => (
          <button
            className="institution-row"
            onClick={() => go("institution",x.institutionId)}
            key={x.institutionId}
          >
            <span className={`institution-monogram m${i}`}>
              {x.name
                .split(" ")
                .filter((w) => w.length > 3)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </span>
            <span>
              <strong>{x.name}</strong>
              <small>
                {[x.address,x.state,x.aicteId&&`AICTE ID ${x.aicteId}`].filter(Boolean).join(" · ")||"Institution details not provided"}
              </small>
            </span>
            <strong>{x.total}</strong>
            <strong>{x.pending+x.underProcess}</strong>
            <strong>{x.disposed}</strong>
            <strong className={x.overdue ? "overdue-num" : ""}>
              {x.overdue}
            </strong>
            <Icon name="chevron" />
          </button>
        ))}
      </div>
      {error&&<div className="error-message" role="alert">{error}</div>}
      {!error&&!rows.length&&<EmptyState title="No institutions found" text="Institutions are added when a case is registered. Search by name or ID."/>}
    </AppShell>
  )
}

function InstitutionDetail() {
  const [record,setRecord]=useState<InstitutionRecord|null>(null);const [error,setError]=useState("")
  useEffect(()=>{const id=selectedId()||"INST-0001";api<InstitutionRecord>(`institutions/${encodeURIComponent(id)}`).then(setRecord).catch(e=>setError(e.message))},[])
  if(!record)return <AppShell page="institution"><PageHeading title="Institution profile" subtitle={error||"Loading authorised institution record…"}/></AppShell>
  return (
    <AppShell page="institution">
      <button className="back-link app-back" onClick={() => go("institutions")}>
        ← Back to institution directory
      </button>
      <div className="institution-hero">
        <div className="institution-monogram large">{record.name.split(" ").filter((w:string)=>w.length>3).slice(0,2).map((w:string)=>w[0]).join("")}</div>
        <div>
          <span className="eyebrow">
            Institution profile · {record.aicteId?`AICTE ID ${record.aicteId}`:record.institutionId}
          </span>
          <Text as="h1">{record.name}</Text>
          <Text>{[record.address,record.state,record.region,record.type].filter(Boolean).join(" · ")||"Institution details are not on file."}</Text>
        </div>
        {error&&<span className="error-message">{error}</span>}
      </div>
      <section className="institution-stats">
        <div>
          <strong>{record.total}</strong>
          <span>Total related cases</span>
        </div>
        <div>
          <strong>{record.pending+record.underProcess}</strong>
          <span>Pending / in process</span>
        </div>
        <div>
          <strong>{record.disposed}</strong>
          <span>Resolved cases</span>
        </div>
        <div className="warn">
          <strong>{record.overdue}</strong>
          <span>Overdue case</span>
        </div>
        <div>
          <strong>{new Set(record.cases.map(c=>c.bureau)).size}</strong>
          <span>Involved Bureaus</span>
        </div>
      </section>
      <div className="institution-content">
        <section className="panel">
          <div className="panel-head">
            <div>
              <Text as="h2">Consolidated case history</Text>
              <Text>All matters associated with this institution</Text>
            </div>
            <Button variant="ghost" icon="filter">
              Filter
            </Button>
          </div>
          {record.cases.map((c) => (
              <button
                className="case-line"
                onClick={() => go("case",c.caseId)}
                key={c.caseId}
              >
                <span className="case-bureau">{c.bureau.split(" ")[0]}</span>
                <span>
                  <strong>{c.subject}</strong>
                  <small>
                    {c.caseId} · Received {c.received}
                  </small>
                </span>
                <Badge status={c.status} />
                <Icon name="chevron" />
              </button>
            ))}
        </section>
        <section className="panel coordination-notes">
          <Text as="h2">Institution context</Text>
          <div className="context-item">
            <span>20 Jun</span>
            <Text>
              Potential relationship between facilities complaints referred for
              joint review.
            </Text>
            <small>Coordination note · Meera Iyer</small>
          </div>
          <div className="context-item">
            <span>04 Mar</span>
            <Text>
              Previous compliance direction closed after documentary
              verification.
            </Text>
            <small>Regulation Bureau</small>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function Overlaps({ compare = false }: { compare?: boolean }) {
  const [rows,setRows]=useState<any[]>([]);const [error,setError]=useState("");const [decision,setDecision]=useState<{id:string;decision:string}|null>(null);const {user}=useContext(SessionContext)
  const [filter,setFilter]=useState("Review required");const [search,setSearch]=useState("")
  const query=new URLSearchParams({q:search})
  const load=()=>api<any[]>(`overlaps?${query}`).then(setRows).catch(e=>setError(e.message))
  useEffect(()=>{load()},[search])
  if (compare) return <Comparison />
  const visible=rows.filter(o=>filter==="All"||o.status===filter)
  return (
    <AppShell page="overlaps">
      <PageHeading
        eyebrow="Assisted coordination · Human decisions"
        title="Overlap & Coordination"
        subtitle="Review potentially related complaints across Bureaus. A flag is an invitation to investigate—not an automated conclusion."
        actions={
          <Button variant="secondary" icon="download" onClick={()=>{window.location.href=`/api/export/overlaps.csv?${query}`}}>
            Export review queue
          </Button>
        }
      />
      <div className="principle-banner">
        <span>
          <Icon name="shield" />
        </span>
        <div>
          <strong>Officials remain in control</strong>
          <Text>
            Potential overlaps are surfaced using shared attributes and
            complaint context. Only authorised officials can confirm, dismiss or
            escalate a relationship.
          </Text>
        </div>
        <button>Read review guidance</button>
      </div>
      <div className="overlap-tabs">
        <button className={filter==="Review required"?"active":""} onClick={()=>setFilter("Review required")}>
          Potential overlaps <strong>{rows.filter(o=>o.status==="Review required").length}</strong>
        </button>
        <button className={filter==="Under review"?"active":""} onClick={()=>setFilter("Under review")}>
          Under review <strong>{rows.filter(o=>o.status==="Under review").length}</strong>
        </button>
        <button className={filter==="Confirmed"?"active":""} onClick={()=>setFilter("Confirmed")}>
          Confirmed relationships <strong>{rows.filter(o=>o.status==="Confirmed").length}</strong>
        </button>
        <button className={filter==="Dismissed"?"active":""} onClick={()=>setFilter("Dismissed")}>Dismissed <strong>{rows.filter(o=>o.status==="Dismissed").length}</strong></button>
        <button className={filter==="All"?"active":""} onClick={()=>setFilter("All")}>All</button>
      </div>
      <label className="table-search overlap-search"><Icon name="search"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search institution, case ID, Bureau or review note"/></label>
      <section className="overlap-list">
        {visible.map((o, i) => (
          <article
            key={o.id}
            className={i === 0 ? "featured-overlap" : ""}
          >
            <div className="overlap-top">
              <div>
                <Badge status={o.status} />
                <span className="confidence">Human review</span>
              </div>
              <small>Detected {new Date(o.createdAt).toLocaleDateString()}</small>
            </div>
            <div className="overlap-body">
              <div>
                <span className="eyebrow">Institution</span>
                <Text as="h2">{o.institution}</Text>
                <Text>{o.bureaus.join(" · ")}</Text>
              </div>
              <div className="linked-cases">
                <span>{o.caseIds[0]}</span>
                <div>
                  <i />
                  <Icon name="overlap" />
                  <i />
                </div>
                <span>{o.caseIds[1]}</span>
              </div>
            </div>
            <div className="reason">
              <Icon name="search" />
              <span>
                <strong>Why this was flagged</strong>
                <Text>{o.reason}</Text>
              </span>
            </div>
            <div className="overlap-actions">
              <span>
                {o.decision?`Decision · ${o.decision.decision} by ${o.decision.userName}`:"Awaiting authorised review"}
              </span>
              <div className="dialog-actions"><Button variant="secondary" onClick={() => go("compare",o.id)} icon="arrow">Compare</Button>{user&&["Super Admin","Admin / Competent Authority"].includes(user.role)&&<><Button variant="secondary" onClick={()=>setDecision({id:o.id,decision:"Confirmed"})}>Confirm</Button><Button variant="danger" onClick={()=>setDecision({id:o.id,decision:"Dismissed"})}>Dismiss</Button></>}</div>
            </div>
          </article>
        ))}
        {!visible.length&&<EmptyState title="No relationships in this view" text="Potential cross-Bureau candidates are generated from institution matches and await official review."/>}
      </section>
      {error&&<div className="error-message" role="alert">{error}</div>}
      {decision&&<OverlapDecisionDialog overlapId={decision.id} decision={decision.decision} onClose={()=>setDecision(null)} onSaved={()=>{setDecision(null);load()}}/>}
    </AppShell>
  )
}

function OverlapDecisionDialog({overlapId,decision,onClose,onSaved}:{overlapId:string;decision:string;onClose:()=>void;onSaved:()=>void}){
  const [error,setError]=useState("");const [saving,setSaving]=useState(false)
  const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);try{await api(`overlaps/${encodeURIComponent(overlapId)}/decision`,{method:"POST",body:JSON.stringify({decision,remark:f.get("remark")})});onSaved()}catch(err){setError(err instanceof Error?err.message:"Decision could not be saved.")}finally{setSaving(false)}}
  return <div className="modal-backdrop"><section className="form-panel case-dialog" role="dialog" aria-modal="true"><button className="dialog-close" onClick={onClose}>×</button><span className="auth-kicker">Official coordination decision</span><h2>{decision} relationship</h2><form onSubmit={submit}><label className="field"><span className="field-label">Reason for decision</span><textarea name="remark" rows={4} required minLength={4} placeholder="Document the basis for this review decision"/></label>{error&&<div className="error-message" role="alert">{error}</div>}<div className="dialog-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{saving?"Saving…":"Save decision"}</Button></div></form></section></div>
}

function Comparison() {
  const [relations,setRelations]=useState<any[]>([]);const [records,setRecords]=useState<CaseRecord[]>([]);const [decision,setDecision]=useState("");const [error,setError]=useState("")
  const {user}=useContext(SessionContext)
  useEffect(()=>{api<any[]>("overlaps").then(setRelations).catch(e=>setError(e.message));api<CaseRecord[]>("cases").then(setRecords).catch(e=>setError(e.message))},[])
  const relation=relations.find(o=>o.id===selectedId())||relations[0]
  const related=relation?relation.caseIds.map((caseId:string)=>records.find(c=>c.caseId===caseId)).filter(Boolean) as CaseRecord[]:[]
  return (
    <AppShell page="compare">
      <button className="back-link app-back" onClick={() => go("overlaps")}>
        ← Back to coordination queue
      </button>
      <PageHeading
        eyebrow="Potential overlap · Human review required"
        title="Compare related cases"
        subtitle="Review the evidence side by side before recording an official coordination decision."
        actions={
          user&&["Super Admin","Admin / Competent Authority"].includes(user.role)?<>
            <Button variant="danger" onClick={()=>setDecision("Dismissed")}>Dismiss relationship</Button>
            <Button onClick={()=>setDecision("Confirmed")}>Confirm relationship</Button>
          </>:undefined
        }
      />
      <div className="comparison-alert">
        <Icon name="overlap" />
        <div>
          <strong>{relation?.institution||"Review candidate"}</strong>
          <Text>{relation?.reason||"The relation record is not available to this account."}</Text>
        </div>
        <span>Strong indicators</span>
      </div>
      <div className="comparison-grid">
        {related.map((c, i) => (
          <article key={c.caseId}>
            <div className="compare-head">
              <span>{i === 0 ? "A" : "B"}</span>
              <div>
                <small>{c.bureau}</small>
                <strong>{c.caseId}</strong>
              </div>
              <Badge status={c.status} />
            </div>
            <Text as="h2">{c.subject}</Text>
            <dl>
              <div>
                <dt>Institution</dt>
                <dd>{c.institution}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{c.received}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>
                  {c.category}
                </dd>
              </div>
              <div>
                <dt>Assigned officer</dt>
                <dd>{c.assignedTo||"Unassigned"}</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>{c.deadline}</dd>
              </div>
            </dl>
            <div className="compare-summary">
              <strong>Complaint summary</strong>
              <Text>
                {c.description||c.subject}
              </Text>
            </div>
          </article>
        ))}
      </div>
      {error&&<div className="error-message" role="alert">{error}</div>}
      {!related.length&&<EmptyState title="No accessible cases to compare" text="The linked records may have changed or are outside your permissions."/>}
      {decision&&relation&&<OverlapDecisionDialog overlapId={relation.id} decision={decision} onClose={()=>setDecision("")} onSaved={()=>{setDecision("");go("overlaps")}}/>}
    </AppShell>
  )
}

function Reports() {
  const [bureau,setBureau]=useState("");const [category,setCategory]=useState("");const [from,setFrom]=useState("");const [to,setTo]=useState("");const [report,setReport]=useState<any>(null);const [error,setError]=useState("")
  const query=new URLSearchParams({bureau,category,from,to});
  useEffect(()=>{api(`reports?${query}`).then(setReport).catch(e=>setError(e.message))},[bureau,category,from,to])
  const resolved=report?.byStatus?.Disposed||0;const within=report?.total?Math.round((report.total-report.overdue)/report.total*100):0
  return (
    <AppShell page="reports">
      <PageHeading
        eyebrow="Live, permission-filtered figures"
        title="Reports & Analytics"
        subtitle="Measure workload, resolution performance and cross-bureau coordination over time."
        actions={
          <>
            <Button icon="download" onClick={()=>{window.location.href=`/api/export/cases.csv?${query}`}}>Export filtered cases</Button>
          </>
        }
      />
      <div className="report-filters">
        <SelectField label="Bureau" value={bureau} onChange={setBureau}>
          <option value="">All Bureaus and Cells</option>
          {BUREAU_OPTIONS.map(b=><option key={b}>{b}</option>)}
        </SelectField>
        <SelectField label="Complaint category" value={category} onChange={setCategory}>
          <option value="">All categories</option><option>General</option>
        </SelectField>
        <label className="audit-date-filter">From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
        <label className="audit-date-filter">To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
        <span className="filter-note">Filters update the report as selected.</span>
      </div>
      {error&&<div className="error-message">{error}</div>}
      <section className="report-kpis">
        <div>
          <span>Cases received</span>
          <strong>{report?.total??"—"}</strong>
          <small>Cases in current filter</small>
        </div>
        <div>
          <span>Cases resolved</span>
          <strong>{resolved}</strong>
          <small>{report?.total?`${Math.round(resolved/report.total*100)}% disposed`:"No case records"}</small>
        </div>
        <div>
          <span>Under process</span>
          <strong>{report?.byStatus?.["Under Process"]??"—"}</strong>
          <small>Current status count</small>
        </div>
        <div>
          <span>Overdue</span>
          <strong>{report?.overdue??"—"}</strong>
          <small>Disposed cases excluded</small>
        </div>
      </section>
      <div className="reports-grid">
        <article className="panel report-trend">
          <div className="panel-head">
            <div>
              <Text as="h2">Complaint & resolution trend</Text>
              <Text>Monthly case volume for selected period</Text>
            </div>
            <div className="legend">
              <span>
                <i className="navy" />
                Received
              </span>
              <span>
                <i className="teal" />
                Resolved
              </span>
            </div>
          </div>
          {report?.monthly?.length?<div className="monthly-activity">{report.monthly.map((m:any)=><div key={m.month}><span>{m.month}</span><i style={{height:`${Math.max(8,m.received*20)}px`}} title={`${m.received} received`}/><b style={{height:`${Math.max(8,m.disposed*20)}px`}} title={`${m.disposed} disposed`}/></div>)}</div>:<div className="loading-state">Report data unavailable.</div>}
        </article>
        <article className="panel performance">
          <Text as="h2">Deadline performance</Text>
          <div className="big-ring" style={{background:`conic-gradient(var(--green) 0 ${within}%,var(--red-soft) ${within}% 100%)`}}>
            <div>
              <strong>{within}%</strong>
              <span>not overdue</span>
            </div>
          </div>
          <div>
            <span>
              <i className="green" />
              Not overdue <strong>{Math.max(0,(report?.total||0)-(report?.overdue||0))}</strong>
            </span>
            <span>
              <i className="amber" />
              Transferred <strong>{report?.byStatus?.Transferred||0}</strong>
            </span>
            <span>
              <i className="red" />
              Overdue <strong>{report?.overdue||0}</strong>
            </span>
          </div>
        </article>
        <article className="panel bureau-report">
          <div className="panel-head">
            <div>
              <Text as="h2">Resolution by Bureau</Text>
              <Text>Received compared with resolved</Text>
            </div>
          </div>
          {(report?.byBureau||[]).map((x:any) => (
            <div className="dual-bar" key={x.bureau}>
              <span>{x.bureau}</span>
              <div>
                <i style={{ width: `${report?.total?x.total/report.total*100:0}%` }} />
                <b style={{ width: `${report?.total?x.disposed/report.total*100:0}%` }} />
              </div>
              <small>
                {x.disposed} / {x.total}
              </small>
            </div>
          ))}
        </article>
        <article className="panel overlap-summary">
          <span className="eyebrow">Cross-bureau coordination</span>
          <Text as="h2">{report?.overlaps||0} relationships surfaced</Text>
          <Text>matching the currently selected, permitted case records.</Text>
          <div>
            <strong>
              {report?.overlaps||0}<span>candidates</span>
            </strong>
            <strong>
              {report?.byStatus?.Escalated||0}<span>escalated cases</span>
            </strong>
            <strong>
              {report?.byStatus?.Transferred||0}<span>transferred</span>
            </strong>
          </div>
          <Button variant="secondary" onClick={() => go("overlaps")}>
            Open coordination report
          </Button>
        </article>
      </div>
    </AppShell>
  )
}

function Activity() {
  const [search,setSearch]=useState("");const [action,setAction]=useState("");const [bureau,setBureau]=useState("");const [from,setFrom]=useState("");const [to,setTo]=useState("");const [rows,setRows]=useState<any[]>([]);const [error,setError]=useState("")
  const query=new URLSearchParams({q:search,action,bureau,from,to})
  const load=()=>api<any[]>(`activity?${query}`).then(setRows).catch(e=>setError(e.message))
  useEffect(()=>{load()},[search,action,bureau,from,to])
  return (
    <AppShell page="activity">
      <PageHeading
        eyebrow="Accountable by design"
        title="Activity History"
        subtitle="A chronological audit trail of case actions, assignments, transfers and coordination decisions."
        actions={
          <Button variant="secondary" icon="download" onClick={()=>{window.location.href=`/api/export/activity.csv?${query}`}}>
            Export audit trail
          </Button>
        }
      />
      <div className="audit-filters">
        <label>
          <Icon name="search" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search case ID, institution or user" />
        </label>
        <SelectField value={action} onChange={setAction}>
          <option value="">All action types</option>
          {["Case created","Case updated","Status changed","Case transferred","Action recorded","Overlap decision","User access changed"].map(a=><option key={a}>{a}</option>)}
        </SelectField>
        <SelectField value={bureau} onChange={setBureau}>
          <option value="">All Bureaus</option>
          {BUREAU_OPTIONS.map(b=><option key={b}>{b}</option>)}
        </SelectField>
        <label className="audit-date-filter">From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
        <label className="audit-date-filter">To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
        <Button variant="secondary" icon="calendar" onClick={()=>{setSearch("");setAction("");setBureau("");setFrom("");setTo("")}}>Clear filters</Button>
      </div>
      {error&&<div className="error-message">{error}</div>}
      <section className="audit-section">
        <div className="audit-date">
          <span>23</span>
          <div>
            <strong>Monday</strong>
            <small>June 2025</small>
          </div>
        </div>
        <div className="audit-list">
          {rows.map((a,i) => (<AuditRow item={[new Date(a.at).toLocaleString(),a.userName,a.action,a.detail?.remark||a.caseId||a.detail?.decision||"Administrative action recorded",a.bureau||a.role]} key={a.id} icon={i===0?"history":"check"}/>))}
          {!rows.length&&<EmptyState title="No matching activity" text="Recorded case actions and administrative decisions will appear here."/>}
        </div>
      </section>
    </AppShell>
  )
}

function AuditRow({ item, icon }: { item: string[]; icon: IconName }) {
  return (
    <article className="audit-row">
      <span className="audit-icon">
        <Icon name={icon} />
      </span>
      <span className="audit-time">{item[0].split("·").pop()}</span>
      <div>
        <Badge status={item[2]} />
        <Text as="h3">{item[3]}</Text>
        <span>
          <strong>{item[1]}</strong> · {item[4]}
        </span>
      </div>
      <button>
        <Icon name="chevron" />
      </button>
    </article>
  )
}

function Notifications() {
  const [notices,setNotices]=useState<any[]>([]);const [filter,setFilter]=useState("All");const [error,setError]=useState("")
  const load=()=>api<any[]>("notifications").then(setNotices).catch(e=>setError(e.message))
  useEffect(()=>{load()},[])
  const visible=notices.filter(n=>filter==="All"||filter==="Deadlines"?filter==="All"||n.type.toLowerCase().includes("deadline")||n.type.toLowerCase().includes("overdue"):filter==="Assignments"?n.type.toLowerCase().includes("assign"):n.type.toLowerCase().includes("overlap")||n.type.toLowerCase().includes("coordination"))
  return (
    <AppShell page="notifications">
      <PageHeading
        eyebrow="Your attention queue"
        title="Notifications"
        subtitle="Deadline alerts, assignments and coordination updates relevant to your role."
        actions={<Button variant="secondary" onClick={async()=>{try{await api("notifications/read-all",{method:"POST"});load()}catch(e){setError(e instanceof Error?e.message:"Could not update notifications.")}}}>Mark all as read</Button>}
      />
      <div className="notification-tabs">
        {["All","Deadlines","Assignments","Coordination"].map(x=><button className={filter===x?"active":""} key={x} onClick={()=>setFilter(x)}>{x}<strong>{x==="All"?notices.length:notices.filter(n=>x==="Deadlines"?/deadline|overdue/i.test(n.type):x==="Assignments"?/assign/i.test(n.type):/overlap|coordination/i.test(n.type)).length}</strong></button>)}
      </div>
      {error&&<div className="error-message">{error}</div>}
      <section className="notification-list">
        {visible.map((n, i) => (
          <button
            key={n.id}
            onClick={async() => {try{await api(`notifications/${encodeURIComponent(n.id)}/read`,{method:"POST"});setNotices(rows=>rows.map(x=>x.id===n.id?{...x,read:true}:x))}catch{};n.type.toLowerCase().includes("overlap")?go("overlaps"):go("case",n.caseIds?.[0])}}
            className={!n.read ? "unread" : ""}
          >
            <span className={`notice-icon n${i}`}>
              <Icon name={n.type.toLowerCase().includes("overlap")?"overlap":n.type.toLowerCase().includes("assign")?"user":n.type.toLowerCase().includes("deadline")||n.type.toLowerCase().includes("overdue")?"clock":"history"} />
            </span>
            <div>
              <div>
                <Text as="h3">{n.type}</Text>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </div>
              <Text>{n.text}</Text>
              <Badge status={n.type} />
            </div>
            <Icon name="chevron" />
          </button>
        ))}
        {!visible.length&&<EmptyState title="No notifications" text="Role-relevant deadline alerts and workflow updates will appear here."/>}
      </section>
    </AppShell>
  )
}

function ChangePasswordDialog({onClose,onSaved}:{onClose:()=>void;onSaved:()=>void}){
  const [error,setError]=useState("");const [saving,setSaving]=useState(false)
  const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setSaving(true);const f=new FormData(e.currentTarget);if(f.get("newPassword")!==f.get("confirmPassword")){setError("New passwords do not match.");setSaving(false);return}try{await api("auth/change-password",{method:"POST",body:JSON.stringify({currentPassword:f.get("currentPassword"),newPassword:f.get("newPassword")})});onSaved()}catch(e){setError(e instanceof Error?e.message:"Password could not be changed.")}finally{setSaving(false)}}
  return <div className="modal-backdrop"><section className="form-panel case-dialog" role="dialog" aria-modal="true"><button className="dialog-close" onClick={onClose}>×</button><span className="auth-kicker">Account security</span><h2>Change password</h2><form onSubmit={submit}><label className="field"><span className="field-label">Current password</span><input name="currentPassword" type="password" required/></label><label className="field"><span className="field-label">New password</span><input name="newPassword" type="password" minLength={12} required/><span className="field-hint">At least 12 characters, including a number and symbol.</span></label><label className="field"><span className="field-label">Confirm new password</span><input name="confirmPassword" type="password" minLength={12} required/></label>{error&&<div className="error-message" role="alert">{error}</div>}<div className="dialog-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{saving?"Updating…":"Update password"}</Button></div></form></section></div>
}

function Settings() {
  const [tab, setTab] = useState("Profile")
  const {user,setUser}=useContext(SessionContext)
  const [users,setUsers]=useState<any[]>([]);const [userError,setUserError]=useState("")
  const [profile,setProfile]=useState({name:"",designation:"",officeLocation:""});const [passwordOpen,setPasswordOpen]=useState(false)
  const [preferences,setPreferences]=useState<Record<string,boolean>>({})
  const loadUsers=()=>api<any[]>("users").then(setUsers).catch(e=>setUserError(e.message))
  useEffect(()=>{if(user?.role==="Super Admin")loadUsers()},[user])
  useEffect(()=>{if(user)setProfile({name:user.name,designation:user.designation||"",officeLocation:user.officeLocation||""})},[user])
  useEffect(()=>{if(user)api<Record<string,boolean>>("preferences").then(setPreferences).catch(e=>setUserError(e.message))},[user])
  const savePreference=async(key:string,value:boolean)=>{const next={...preferences,[key]:value};setPreferences(next);try{await api("preferences",{method:"PUT",body:JSON.stringify(next)})}catch(e){setUserError(e instanceof Error?e.message:"Could not save notification preferences.")}}
  const updateUser=async(id:string,changes:object)=>{try{await api(`users/${encodeURIComponent(id)}/approval`,{method:"PATCH",body:JSON.stringify(changes)});loadUsers()}catch(e){setUserError(e instanceof Error?e.message:"User update failed.")}}
  const saveProfile=async()=>{try{const result=await api<{user:User}>("profile",{method:"PATCH",body:JSON.stringify(profile)});setUser(result.user);setUserError("")}catch(e){setUserError(e instanceof Error?e.message:"Profile could not be saved.")}}
  const permissions=user?.role==="Super Admin"?["View and manage all institution and case records","Create, assign, transfer and resolve cases","Review overlaps and manage coordination decisions","Manage user accounts and role assignments","Access reports, exports and audit history"]:user?.role==="Admin / Competent Authority"?["View cases and institution records across the system","Oversee workload, deadlines and escalations","Record authorised overlap decisions","Generate permission-filtered reports and exports"]:user?.role==="Bureau Officer"?[`View cases assigned to ${user?.bureau||"your Bureau"} and authorised shared matters`,`Record case actions and update permitted statuses`,`Review institution context for accessible cases`]:[`View cases within ${user?.region||"your assigned region"}`,"Update only cases assigned to your account"]
  const tabs=["Profile","Role & permissions","Notifications","Security",...(user?.role==="Super Admin"?["User access"]:[])]
  return (
    <AppShell page="settings">
      <PageHeading
        eyebrow="Account & access"
        title="Profile & Settings"
        subtitle="Manage your account details, security and role-aware notification preferences."
      />
      <div className="settings-layout">
        <nav>
          {tabs.map(
            (x) => (
              <button
                className={tab === x ? "active" : ""}
                onClick={() => setTab(x)}
                key={x}
              >
                <Icon
                  name={
                    x === "Profile"
                      ? "user"
                      : x === "Role & permissions"
                        ? "shield"
                        : x === "Notifications"
                          ? "bell"
                          : x === "User access" ? "user" : "lock"
                  }
                />
                {x}
              </button>
            ),
          )}
        </nav>
        <section className="settings-content">
          {tab === "Profile" && (
            <>
              <div className="profile-intro">
                <span>PN</span>
                <div>
                  <Text as="h2">{user?.name||"Official user"}</Text>
                  <Text>{user?.role} · {user?.bureau||"National access"}</Text>
                </div>
              </div>
              <div className="settings-form">
                <Text as="h2">Personal information</Text>
                <Text>
                  Your official profile details are visible in assignment and
                  audit records.
                </Text>
                <div className="field-grid">
                  <Field label="Full name" value={profile.name} onChange={v=>setProfile({...profile,name:v})} />
                  <Field label="Designation" value={profile.designation} onChange={v=>setProfile({...profile,designation:v})} />
                </div>
                <Field
                  label="Official email"
                  value={user?.email||""}
                  readOnly
                />
                <div className="field-grid">
                  <Field
                    label="Office location"
                    value={profile.officeLocation}
                    onChange={v=>setProfile({...profile,officeLocation:v})}
                  />
                </div>
                {userError&&<div className="error-message">{userError}</div>}
                <Button onClick={saveProfile}>Save changes</Button>
              </div>
            </>
          )}
          {tab === "Role & permissions" && (
            <>
              <div className="role-card">
                <Icon name="shield" />
                <div>
                  <span>Current role</span>
                  <Text as="h2">{user?.role||"Account role unavailable"}</Text>
                  <Text>
                    Access is checked by the application service on each request.
                  </Text>
                </div>
              </div>
              <Text as="h2">Effective permissions</Text>
              <div className="permission-list">
                {permissions.map((x) => (
                  <span key={x}>
                    <Icon name="check" />
                    {x}
                  </span>
                ))}
              </div>
            </>
          )}
          {tab === "Notifications" && (
            <>
              <Text as="h2">Notification preferences</Text>
              <Text>
                Choose which operational updates appear in your platform notification list.
              </Text>
              {[
                "Deadline approaching",
                "Case becomes overdue",
                "New case assigned",
                "Potential overlap detected",
                "Coordination decision recorded",
                "Case status changed",
              ].map((x, i) => (
                <label className="toggle-row" key={x}>
                  <span>
                    <strong>{x}</strong>
                    <small>
                      {i < 2
                        ? "Immediate operational alert"
                        : "Included in your daily digest"}
                    </small>
                  </span>
                  <input type="checkbox" checked={preferences[x]??i!==5} onChange={e=>savePreference(x,e.target.checked)} />
                  <i />
                </label>
              ))}
            </>
          )}
          {tab === "User access" && user?.role==="Super Admin" && (
            <><Text as="h2">User access requests</Text><Text>New accounts remain inactive until approved. Role and bureau changes are audited.</Text>{userError&&<div className="error-message">{userError}</div>}{users.map(account=><article className="user-access-row" key={account.id}><div><strong>{account.name}</strong><small>{account.email} · {account.approved?account.active?"Active":"Deactivated":"Awaiting approval"}</small></div><select aria-label="User role" value={account.role} onChange={e=>updateUser(account.id,{role:e.target.value,approved:account.approved,bureau:account.bureau})}>{["Super Admin","Admin / Competent Authority","Bureau Officer","Regional Officer"].map(r=><option key={r}>{r}</option>)}</select><select aria-label="Bureau" value={account.bureau||""} onChange={e=>updateUser(account.id,{bureau:e.target.value,approved:account.approved})}><option value="">No Bureau</option>{BUREAU_OPTIONS.map(b=><option key={b}>{b}</option>)}</select><input aria-label="Authorised region" defaultValue={account.region||""} placeholder="Region" onBlur={e=>{if(e.target.value!==account.region)updateUser(account.id,{region:e.target.value,approved:account.approved})}}/>{!account.approved?<Button onClick={()=>updateUser(account.id,{approved:true})}>Approve</Button>:<Button variant="secondary" onClick={()=>updateUser(account.id,{active:!account.active})}>{account.active?"Deactivate":"Reactivate"}</Button>}</article>)}</>
          )}
          {tab === "Security" && (
            <>
              <Text as="h2">Password & security</Text>
              <div className="security-card">
                <Icon name="lock" />
                <div>
                  <strong>Password</strong>
                  <span>Update your password using your current credentials.</span>
                </div>
                <Button variant="secondary" onClick={()=>setPasswordOpen(true)}>Change password</Button>
              </div>
              <div className="security-card">
                <Icon name="shield" />
                <div>
                  <strong>Session protection</strong>
                  <span>HttpOnly same-site session cookie · 8 hour expiry</span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
      {passwordOpen&&<ChangePasswordDialog onClose={()=>setPasswordOpen(false)} onSaved={()=>{setPasswordOpen(false);setUser(null);go("login")}}/>}
    </AppShell>
  )
}

export default function App() {
  const parse = () => (window.location.hash.replace("#", "").split("?")[0] || "home") as Page
  const [page, setPage] = useState<Page>(parse)
  const [user, setUser] = useState<User|null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  useEffect(() => {
    const handler = () => setPage(parse())
    window.addEventListener("hashchange", handler)
    api<{user:User|null}>("session").then(result => setUser(result.user)).catch(() => setUser(null)).finally(() => setSessionReady(true))
    return () => window.removeEventListener("hashchange", handler)
  }, [])
  useEffect(() => {
    if (!sessionReady) return
    const publicPages:Page[] = ["home","login","signup","forgot","reset","verify"]
    if (!user && !publicPages.includes(page)) go("login")
  }, [sessionReady,user,page])
  const view = useMemo(() => {
    if (page === "home") return <Landing />
    if (["login", "signup", "forgot", "reset", "verify"].includes(page))
      return <AuthPage mode={page as "login"} />
    if (page === "dashboard") return <Dashboard />
    if (page === "cases") return <Cases />
    if (page === "case") return <CaseDetail />
    if (page === "institutions") return <Institutions />
    if (page === "institution") return <Institutions detail />
    if (page === "overlaps") return <Overlaps />
    if (page === "compare") return <Overlaps compare />
    if (page === "reports") return <Reports />
    if (page === "activity") return <Activity />
    if (page === "notifications") return <Notifications />
    if (page === "settings") return <Settings />
    return <Landing />
  }, [page])
  return <SessionContext.Provider value={{user,setUser}}>{view}</SessionContext.Provider>
}
