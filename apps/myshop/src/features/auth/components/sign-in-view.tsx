import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import UserAuthForm from "./user-auth-form";

function TeaLandscapeBackground() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 900 1100"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      fill="none"
    >
      <defs>
        <linearGradient id="tea-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#183D30" />
          <stop offset="100%" stopColor="#091F19" />
        </linearGradient>

        <linearGradient id="tea-hill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#557C55" stopOpacity=".8" />
          <stop offset="100%" stopColor="#173C2B" stopOpacity=".15" />
        </linearGradient>

        <pattern
          id="tea-dots"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="1" fill="#D5C18B" opacity=".16" />
        </pattern>

        <pattern
          id="tea-lines"
          width="110"
          height="110"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-25)"
        >
          <path d="M0 0V110" stroke="#D5C18B" strokeWidth=".7" opacity=".1" />
        </pattern>
      </defs>

      <path fill="url(#tea-bg)" d="M0 0H900V1100H0Z" />
      <path fill="url(#tea-dots)" d="M0 0H900V1100H0Z" />
      <path fill="url(#tea-lines)" d="M0 0H900V1100H0Z" />

      {/* Rolling tea plantation */}
      <g opacity=".7">
        <path
          d="M-100 510C130 380 270 570 440 450S750 350 1000 480V1100H-100Z"
          fill="#244E37"
        />
        <path
          d="M-100 600C150 460 280 680 490 540S790 460 1000 580V1100H-100Z"
          fill="url(#tea-hill)"
        />

        {Array.from({ length: 13 }, (_, i) => (
          <path
            key={i}
            d={`M${-100 + i * 15} ${650 + i * 12} C250 ${
              450 + i * 13
            } 550 ${780 + i * 8} 1000 ${480 + i * 18}`}
            stroke="#B6C99B"
            strokeWidth="1.4"
            opacity=".28"
          />
        ))}
      </g>

      {/* Botanical tea leaves */}
      <g
        transform="translate(675 230) rotate(-24)"
        stroke="#B8CDA6"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M0 190C-8 120 12 45 0 -20" opacity=".65" />
        <path
          d="M0 125C-95 120 -130 65 -102 32C-55 34 -14 70 0 125Z"
          fill="#6D9368"
          fillOpacity=".32"
        />
        <path
          d="M0 82C75 70 120 25 96 -12C47 -2 10 34 0 82Z"
          fill="#9EB78B"
          fillOpacity=".3"
        />
        <path
          d="M0 38C-60 5 -67 -35 -40 -58C-9 -39 2 -2 0 38Z"
          fill="#6D9368"
          fillOpacity=".4"
        />
        <path d="M-102 32L0 125L96 -12M-40 -58L0 38" opacity=".7" />
      </g>

      {/* Subtle gold framing */}
      <path d="M700 0H900V200" stroke="#D5C18B" strokeWidth="1" opacity=".45" />
      <circle
        cx="790"
        cy="115"
        r="85"
        stroke="#D5C18B"
        strokeWidth="1"
        opacity=".18"
      />
      <circle
        cx="790"
        cy="115"
        r="65"
        stroke="#D5C18B"
        strokeWidth="1"
        opacity=".12"
      />
    </svg>
  );
}

export default function SignInViewPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden lg:grid lg:max-w-none lg:grid-cols-[3fr_2fr] lg:px-0">
      {/* <Link
        to="/auth/sign-up"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute top-4 right-4 z-30 md:top-8 md:right-8",
        )}
      >
        Sign Up
      </Link> */}

      {/* Tea trading brand panel */}
      <div className="relative hidden min-h-screen flex-col overflow-hidden border-r border-white/10 bg-[#102E26] p-10 lg:flex xl:p-14">
        <TeaLandscapeBackground />

        <div className="absolute inset-0 bg-linear-to-b from-[#102E26]/20 via-transparent to-[#071A14]/80" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D5C18B]/40 bg-[#D5C18B]/10">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
              className="h-7 w-7"
            >
              <path
                d="M16 27V10M16 20C7 20 4 14 5 8C12 8 16 13 16 20ZM16 15C16 7 21 4 27 5C28 12 23 16 16 15Z"
                stroke="#D5C18B"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="space-y-0.5">
            <p className="text-xl font-semibold tracking-[0.18em] text-[#F5F2E8]">
              NODRA
            </p>
            <p className="text-[10px] font-medium tracking-[0.22em] text-[#C6D6CC]">
              TEA TRADE MANAGEMENT
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-auto max-w-xl pb-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-[#D5C18B]" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D5C18B]">
              Built for the tea industry
            </p>
          </div>

          <h1 className="max-w-lg text-4xl leading-[1.15] font-semibold tracking-tight text-[#F5F2E8] xl:text-5xl">
            From Garden
            <br />
            <span className="font-normal text-[#D5C18B]">to Market.</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#D2DED6] xl:text-base">
            Manage every stage of your tea business, from lot registration and
            quality testing to valuation, stock management, and distribution —
            in one connected workflow.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/15 pt-5 text-xs text-[#D2DED6]">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D5C18B]" />
              Lot Management
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D5C18B]" />
              Quality & Valuation
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D5C18B]" />
              Distribution
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-[11px] text-[#A9BDB1]">
          <span>One system. Every stage of trade.</span>
          <span className="tracking-[0.15em]">MJB Group of Companies</span>
        </div>
      </div>

      {/* Existing authentication panel */}

      {/* Professional authentication panel */}
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-6 py-16 lg:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl dark:bg-emerald-950/30" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-lime-100/40 blur-3xl dark:bg-lime-950/20" />
        </div>

        <div className="relative mx-auto flex w-full max-w-[400px] flex-col justify-center">
          {/* Brand accent */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-800/15 bg-emerald-800/[0.06]">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
                className="h-7 w-7"
              >
                <path
                  d="M16 27V10M16 20C7 20 4 14 5 8C12 8 16 13 16 20ZM16 15C16 7 21 4 27 5C28 12 23 16 16 15Z"
                  stroke="#28734D"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm leading-6">
              Sign in to manage your tea trading operations.
            </p>
          </div>

          {/* Existing authentication form */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6 space-y-1">
              <h2 className="text-base font-semibold">
                Sign in to your account
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to continue.
              </p>
            </div>

            <UserAuthForm />
          </div>

          {/* Legal links */}
          <p className="text-muted-foreground mt-6 text-center text-xs leading-6">
            By continuing, you agree to our{" "}
            <Link
              to="/terms-of-service"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-emerald-700"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-emerald-700"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <div className="text-muted-foreground mt-10 flex items-center justify-center gap-2 text-xs">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="h-4 w-4 text-emerald-700"
            >
              <path
                d="M10 2.5 16 5v4.5c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V5l6-2.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="m7.5 9.5 1.7 1.7 3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Secure access to your business workspace
          </div>
        </div>
      </div>
    </div>
  );
}
