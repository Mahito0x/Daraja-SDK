#!/usr/bin/env node

import * as p from "@clack/prompts";
// Chalk v5 uses modern package exports; keep this file compatible with legacy
// TypeScript module resolution until the CLI tsconfig can be migrated.
// @ts-expect-error TS cannot resolve Chalk's exported declarations in legacy mode.
import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";
import path from "path";
import fs from "fs-extra";

// Force 24-bit TrueColor mode in case subshell disables color output
chalk.level = 3;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

// tsup compiles this file to CJS (see tsup.config / package.json), so
// __dirname is already provided natively by Node — no import.meta.url /
// fileURLToPath dance needed (that's ESM-only and throws under CJS output).
// This resolves relative to dist/index.js regardless of where the user runs
// the CLI from, not process.cwd().

// templates/ lives one level up from dist/ (packages/cli/templates), mirroring
// packages/cli/src -> packages/cli/dist at build time.
const TEMPLATES_ROOT = path.join(__dirname, "..", "templates");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type FrameworkKey = "nextjs" | "express";
type FeatureKey = "stkPush" | "stkQuery" | "c2b" | "b2cTopUp";

interface FrameworkConfig {
  value: FrameworkKey;
  label: string;
  /** Folder name under templates/ for this framework. */
  templateDir: string;
  /**
   * Path (relative to the template root) where feature-specific route
   * folders live, e.g. "app/api" for Next.js App Router. Leave undefined
   * for frameworks that don't (yet) support per-feature folder gating —
   * their templates are copied wholesale instead.
   */
  featureMountPath?: string;
}

const TEMPLATES: FrameworkConfig[] = [
  {
    value: "nextjs",
    label: "Next.js (App Router + Route Handlers)",
    templateDir: "nextjs",
    featureMountPath: "app/api",
  },
  {
    value: "express",
    label: "Express.js (TypeScript API Server)",
    templateDir: "express",
    featureMountPath: "src/routes",
  },
];

// Maps each SDK capability to its generated route folder.
const FEATURE_FOLDER_NAMES: Record<FeatureKey, string> = {
  stkPush: "stk",
  stkQuery: "query",
  c2b: "c2b",
  b2cTopUp: "b2c-topup",
};

const FEATURE_LABELS: Record<FeatureKey, { label: string; hint: string }> = {
  stkPush: {
    label: "Express STK Push (LIPA NA M-PESA Online)",
    hint: "Most Used",
  },
  stkQuery: {
    label: "STK Push status query",
    hint: "Poll a CheckoutRequestID",
  },
  c2b: {
    label: "C2B (Customer to Business Paybill/Till)",
    hint: "Register Validation & Confirmation URLs",
  },
  b2cTopUp: {
    label: "B2C Account Top Up",
    hint: "Move funds into a B2C utility account",
  },
};

// ---------------------------------------------------------------------------
// Process lifecycle helpers
// ---------------------------------------------------------------------------

/**
 * Cleanly release input streams and force the process to exit.
 *
 * @clack/prompts uses readline's emitKeypressEvents() under the hood, which
 * attaches a "keypress" listener and puts stdin into flowing/raw mode. On
 * some terminals (notably Windows PowerShell / ConEmu), process.exit() can
 * fire before that listener is torn down and before the stdout write queue
 * has fully flushed — the process then appears to "hang" even though it's
 * technically already exiting, or output gets truncated.
 *
 * The fix: explicitly disable raw mode, strip all stdin listeners, and defer
 * the actual process.exit() by one tick with setImmediate so buffered writes
 * get a chance to flush first.
 */
function exitCLI(code = 0): never {
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false);
    } catch {
      // Some shells / CI runners don't support raw mode toggling — not fatal.
    }
  }
  process.stdin.removeAllListeners("keypress");
  process.stdin.removeAllListeners("data");
  process.stdin.pause();

  process.exit(code);
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

/** Dynamically center ASCII text based on terminal width. */
function centerText(text: string): string {
  const termWidth = process.stdout.columns || 80;
  return text
    .split("\n")
    .map((line) => {
      const cleanLine = line
        .replace(/\u00A0/g, " ")
        .replace(/\u001b\[[0-9;]*m/g, "")
        .trim();

      if (!cleanLine.length) return "";

      const padding = Math.max(
        0,
        Math.floor((termWidth - cleanLine.length) / 2),
      );
      return " ".repeat(padding) + line.trim();
    })
    .join("\n");
}

function printBanner() {
  const rawBanner = figlet.textSync("DARAJA SDK", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
  });

  const mpesaGradient = gradient(["#00c853", "#00e676", "#69f0ae"]);
  const coloredBanner = mpesaGradient.multiline(rawBanner);

  console.log("\n" + centerText(coloredBanner));
  console.log(
    centerText(
      chalk.bold.hex("#9CA3AF")(
        "⚡ The Type-Safe M-Pesa Integration Boilerplate Generator\n",
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Prompt flow
// ---------------------------------------------------------------------------

interface Answers {
  projectName: string;
  environment: "sandbox" | "production";
  framework: FrameworkKey;
  features: FeatureKey[];
  packageManager: "pnpm" | "npm" | "bun" | "yarn";
}

async function collectAnswers(): Promise<Answers> {
  const answers = await p.group(
    {
      projectName: () =>
        p.text({
          message: "What is your project name?",
          placeholder: "my-mpesa-app",
          defaultValue: "my-mpesa-app",
          validate: (value) => {
            if (!value) return "Project name is required!";
            if (/[^a-zA-Z0-9-_]/.test(value))
              return "Project name can only contain letters, numbers, hyphens, and underscores.";
          },
        }),

      environment: () =>
        p.select({
          message: "Which Safaricom Daraja environment will you target?",
          options: [
            {
              value: "sandbox",
              label: "Sandbox (Testing & Development)",
              hint: "Pre-configured with Safaricom test credentials",
            },
            {
              value: "production",
              label: "Production (Live Payments)",
              hint: "Requires Business Shortcode & Passkey",
            },
          ],
        }),

      framework: () =>
        p.select({
          message: "Select your framework / tech stack:",
          options: TEMPLATES.map((t) => ({
            value: t.value,
            label: t.label,
          })),
        }),

      features: () =>
        p.multiselect({
          message: "Select M-Pesa services to auto-wire into your routes:",
          options: (Object.keys(FEATURE_LABELS) as FeatureKey[]).map((key) => ({
            value: key,
            label: FEATURE_LABELS[key].label,
            hint: FEATURE_LABELS[key].hint,
          })),
          required: true,
        }),

      packageManager: () =>
        p.select({
          message: "Which package manager do you use?",
          options: [
            { value: "pnpm", label: "pnpm" },
            { value: "npm", label: "npm" },
            { value: "bun", label: "bun" },
            { value: "yarn", label: "yarn" },
          ],
        }),
    },
    {
      onCancel: () => {
        p.cancel(chalk.red("Operation cancelled."));
        exitCLI(0);
      },
    },
  );

  return answers as Answers;
}

// ---------------------------------------------------------------------------
// Scaffolding
// ---------------------------------------------------------------------------

/**
 * Copies the base template into targetDir, EXCLUDING any feature-gated
 * folders under featureMountPath (those are handled separately by
 * copySelectedFeatures so unselected features don't ship dead code).
 */
async function copyBaseTemplate(
  templateDir: string,
  targetDir: string,
  featureMountPath: string | undefined,
): Promise<void> {
  const featureMountAbs = featureMountPath
    ? path.join(templateDir, featureMountPath)
    : undefined;

  await fs.copy(templateDir, targetDir, {
    filter: (src) => {
      if (src.includes("node_modules")) return false;
      if (!featureMountAbs) return true;

      // Exclude everything *inside* the feature mount folder (its
      // subfolders are copied selectively later), but keep the mount
      // folder itself so empty dirs like app/api still exist.
      if (src === featureMountAbs) return true;
      if (path.dirname(src) === featureMountAbs) return false;
      return true;
    },
  });
}

/** Copies only the feature folders the user actually selected. */
async function copySelectedFeatures(
  templateDir: string,
  targetDir: string,
  featureMountPath: string,
  features: FeatureKey[],
): Promise<{ skipped: FeatureKey[] }> {
  const skipped: FeatureKey[] = [];

  for (const feature of features) {
    const folderName = FEATURE_FOLDER_NAMES[feature];
    const srcDir = path.join(templateDir, featureMountPath, folderName);
    const destDir = path.join(targetDir, featureMountPath, folderName);

    if (await fs.pathExists(srcDir)) {
      await fs.copy(srcDir, destDir);
    } else {
      skipped.push(feature);
    }
  }

  return { skipped };
}

/** Patches the copied package.json with the real project name. */
async function patchPackageJson(
  targetDir: string,
  projectName: string,
): Promise<void> {
  const pkgPath = path.join(targetDir, "package.json");
  if (!(await fs.pathExists(pkgPath))) return;

  const pkg = await fs.readJson(pkgPath);
  pkg.name = projectName;
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

/** Writes imports for only the Express route modules selected by the user. */
async function writeExpressRouteRegistry(
  targetDir: string,
  features: FeatureKey[],
): Promise<void> {
  if (!features.length) return;

  const imports = features
    .map((feature) => {
      const folderName = FEATURE_FOLDER_NAMES[feature];
      return `import ${feature}Router from "./routes/${folderName}/index.js";`;
    })
    .join("\n");
  const registrations = features
    .map((feature) => `  app.use(${feature}Router);`)
    .join("\n");

  await fs.writeFile(
    path.join(targetDir, "src", "register-routes.ts"),
    `import type { Express } from "express";\n${imports}\n\nexport function registerRoutes(app: Express): void {\n${registrations}\n}\n`,
  );
}

interface ScaffoldResult {
  skippedFeatures: FeatureKey[];
}

async function scaffoldProject(
  answers: Answers,
  targetDir: string,
): Promise<ScaffoldResult> {
  const framework = TEMPLATES.find((t) => t.value === answers.framework)!;
  const templateDir = path.join(TEMPLATES_ROOT, framework.templateDir);

  await fs.ensureDir(targetDir);

  const templateExists = await fs.pathExists(templateDir);
  const templateHasFiles =
    templateExists && (await fs.readdir(templateDir)).length > 0;

  if (!templateHasFiles) {
    throw new Error(`Template files are missing for ${answers.framework}.`);
  }

  await copyBaseTemplate(templateDir, targetDir, framework.featureMountPath);

  let skippedFeatures: FeatureKey[] = [];
  if (framework.featureMountPath) {
    const result = await copySelectedFeatures(
      templateDir,
      targetDir,
      framework.featureMountPath,
      answers.features,
    );
    skippedFeatures = result.skipped;
  }

  await patchPackageJson(targetDir, answers.projectName);

  if (answers.framework === "express") {
    await writeExpressRouteRegistry(targetDir, answers.features);
  }

  // Keep secrets out of the generated working tree; copy the example only.
  const envContent = buildEnvFile(answers);
  await fs.writeFile(path.join(targetDir, ".env.example"), envContent);

  return { skippedFeatures };
}

function buildEnvFile(answers: Answers): string {
  const isSandbox = answers.environment === "sandbox";
  const callbackPath =
    answers.framework === "express" ? "/callbacks/stk" : "/api/stk/callback";
  return `# Safaricom Daraja Configuration (${answers.environment.toUpperCase()})
DARAJA_ENVIRONMENT=${answers.environment}
DARAJA_CONSUMER_KEY=${isSandbox ? "YOUR_SANDBOX_CONSUMER_KEY" : ""}
DARAJA_CONSUMER_SECRET=${isSandbox ? "YOUR_SANDBOX_CONSUMER_SECRET" : ""}
DARAJA_PASSKEY=${isSandbox ? "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" : ""}
DARAJA_SHORTCODE=${isSandbox ? "174379" : ""}
DARAJA_CALLBACK_URL="https://your-domain.com${callbackPath}"
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.clear();
  printBanner();
  p.intro(chalk.bgGreen.black.bold(" DARAJA INITIALIZER "));

  const answers = await collectAnswers();

  const s = p.spinner();
  s.start(
    `Scaffolding ${chalk.green.bold(answers.projectName)} using @lumierelabs/daraja...`,
  );

  const targetDir = path.join(process.cwd(), answers.projectName);
  let result: ScaffoldResult;

  try {
    result = await scaffoldProject(answers, targetDir);
  } catch (err) {
    s.stop(chalk.red("Scaffolding failed."));
    throw err;
  }

  s.stop(`Successfully bootstrapped ${chalk.green.bold(answers.projectName)}!`);

  if (result.skippedFeatures.length > 0) {
    p.note(
      chalk.yellow(
        `These selected features don't have template files yet, so they were skipped:\n` +
          result.skippedFeatures
            .map((f) => `  • ${FEATURE_LABELS[f].label}`)
            .join("\n"),
      ),
      "⚠️  Some Features Skipped",
    );
  }

  const pkgManager = answers.packageManager;
  const runCmd = pkgManager === "npm" ? "npm run dev" : `${pkgManager} dev`;

  p.note(
    `${chalk.bold("Next steps to launch your app:")}\n\n` +
      `  ${chalk.dim("1.")} ${chalk.cyan(`cd ${answers.projectName}`)}\n` +
      `  ${chalk.dim("2.")} ${chalk.cyan(`${pkgManager} install`)}\n` +
      `  ${chalk.dim("3.")} ${chalk.cyan(runCmd)}\n\n` +
      `${chalk.dim("----------------------------------------")}\n` +
      `📖 Documentation:  ${chalk.green.underline("https://daraja.lumierelabs.xyz")}\n` +
      `💬 Support / Star: ${chalk.dim("https://github.com/Mahito0x/Daraja-SDK")}`,
    "🚀 Project Ready",
  );

  p.outro(
    chalk.green.bold("✨ Built with @lumierelabs/daraja. Happy engineering!"),
  );

  exitCLI(0);
}

main().catch((err) => {
  console.error(chalk.red("\nAn error occurred during scaffolding:"), err);
  exitCLI(1);
});
