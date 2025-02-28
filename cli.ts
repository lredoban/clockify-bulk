#!/usr/bin/env tsx
import { defineCommand, runMain } from "citty";
import { format } from "date-fns";
import { consola } from "consola";
import prompts from "prompts";
import pc from "picocolors";
import Conf from "conf";

interface ClockifyConfig {
  workspaceId: string;
  projectId: string;
  authToken: string;
  description: string;
  startHour: number;
  endHour: number;
}

// Store configuration
const config = new Conf({
  projectName: "clockify-bulk",
  defaults: {
    workspaceId: "",
    projectId: "",
    authToken: "",
    startHour: 9,
    endHour: 17,
    lastDescription: "",
  },
});

// Function to get a random lunch break start time (between 11:30 and 13:00)
function getLunchBreakTime(): number {
  // Generate a random time between 11.5 (11:30) and 13.0 (13:00)
  return 11.5 + Math.random() * 1.5;
}

function getWorkingDays(year: number, month: number) {
  const workingDays: Date[] = [];
  const date = new Date(year, month - 1, 1);

  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      workingDays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }

  return workingDays;
}

async function createTimeEntry(
  config: ClockifyConfig,
  date: Date,
  simulate: boolean
) {
  // Get random lunch break start time (between 11:30 and 13:00)
  const lunchBreakStart = getLunchBreakTime();

  // Calculate lunch break end time (1 hour later)
  const lunchBreakEnd = lunchBreakStart + 1;

  // Morning session
  const morningStart = new Date(date);
  morningStart.setHours(config.startHour, 0, 0, 0);

  const morningEnd = new Date(date);
  // Set the end time to the lunch break start time
  const lunchStartHour = Math.floor(lunchBreakStart);
  const lunchStartMinutes = Math.round((lunchBreakStart - lunchStartHour) * 60);
  morningEnd.setHours(lunchStartHour, lunchStartMinutes, 0, 0);

  // Afternoon session
  const afternoonStart = new Date(date);
  const lunchEndHour = Math.floor(lunchBreakEnd);
  const lunchEndMinutes = Math.round((lunchBreakEnd - lunchEndHour) * 60);
  afternoonStart.setHours(lunchEndHour, lunchEndMinutes, 0, 0);

  const afternoonEnd = new Date(date);
  afternoonEnd.setHours(config.endHour, 0, 0, 0);

  // Create morning time entry
  const morningBody = {
    billable: true,
    description: "shiroo",
    projectId: config.projectId,
    taskId: null,
    tagIds: null,
    customFields: [],
    start: morningStart.toISOString(),
    end: morningEnd.toISOString(),
  };

  // Create afternoon time entry
  const afternoonBody = {
    billable: true,
    description: "shiroo",
    projectId: config.projectId,
    taskId: null,
    tagIds: null,
    customFields: [],
    start: afternoonStart.toISOString(),
    end: afternoonEnd.toISOString(),
  };

  if (simulate) {
    // Format times for display
    const formatTime = (date: Date) => format(date, "HH:mm");

    consola.info(pc.cyan(`Simulation for ${format(date, "yyyy-MM-dd")}:`));
    consola.info(
      `  Morning: ${pc.green(formatTime(morningStart))} - ${pc.green(
        formatTime(morningEnd)
      )}`
    );
    consola.info(
      `  Lunch:   ${pc.yellow(formatTime(morningEnd))} - ${pc.yellow(
        formatTime(afternoonStart)
      )}`
    );
    consola.info(
      `  Evening: ${pc.green(formatTime(afternoonStart))} - ${pc.green(
        formatTime(afternoonEnd)
      )}`
    );
    consola.info(`  Description: ${pc.magenta("shiroo")}`);
    consola.info("");

    return {
      morning: morningBody,
      afternoon: afternoonBody,
    };
  }

  // Submit morning entry
  const morningResponse = await fetch(
    `https://eu-central-1.api.clockify.me/workspaces/${config.workspaceId}/timeEntries/full`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-auth-token": config.authToken,
      },
      body: JSON.stringify(morningBody),
    }
  );

  if (!morningResponse.ok) {
    throw new Error(
      `Failed to create morning time entry: ${morningResponse.statusText}`
    );
  }

  // Submit afternoon entry
  const afternoonResponse = await fetch(
    `https://eu-central-1.api.clockify.me/workspaces/${config.workspaceId}/timeEntries/full`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-auth-token": config.authToken,
      },
      body: JSON.stringify(afternoonBody),
    }
  );

  if (!afternoonResponse.ok) {
    throw new Error(
      `Failed to create afternoon time entry: ${afternoonResponse.statusText}`
    );
  }

  // Return both responses
  return {
    morning: await morningResponse.json(),
    afternoon: await afternoonResponse.json(),
  };
}

async function promptForConfig() {
  const responses = await prompts([
    {
      type: "text",
      name: "workspaceId",
      message: "Enter your Clockify workspace ID:",
      initial: config.get("workspaceId") as string,
      validate: (value: string) => !!value || "Workspace ID is required",
    },
    {
      type: "text",
      name: "projectId",
      message: "Enter your Clockify project ID:",
      initial: config.get("projectId") as string,
      validate: (value: string) => !!value || "Project ID is required",
    },
    {
      type: "password",
      name: "authToken",
      message: "Enter your Clockify auth token:",
      initial: config.get("authToken") as string,
      validate: (value: string) => !!value || "Auth token is required",
    },
    {
      type: "number",
      name: "startHour",
      message: "Enter start hour (0-23):",
      initial: config.get("startHour") as number,
      validate: (value: number) =>
        (value >= 0 && value <= 23) || "Hour must be between 0 and 23",
    },
    {
      type: "number",
      name: "endHour",
      message: "Enter end hour (0-23):",
      initial: config.get("endHour") as number,
      validate: (value: number) =>
        (value >= 0 && value <= 23) || "Hour must be between 0 and 23",
    },
  ]);

  if (!responses.workspaceId || !responses.projectId || !responses.authToken) {
    throw new Error("All fields are required");
  }

  // Save responses to config
  config.set("workspaceId", responses.workspaceId);
  config.set("projectId", responses.projectId);
  config.set("authToken", responses.authToken);
  config.set("startHour", responses.startHour);
  config.set("endHour", responses.endHour);

  return {
    workspaceId: responses.workspaceId,
    projectId: responses.projectId,
    authToken: responses.authToken,
    description: "shiroo",
    startHour: responses.startHour,
    endHour: responses.endHour,
  };
}

const main = defineCommand({
  meta: {
    name: "clockify-bulk",
    version: "1.0.0",
    description: "🕒 Elegant Clockify Time Entry CLI",
  },
  args: {
    month: {
      type: "positional",
      description: "Month (1-12)",
      default: String(new Date().getMonth() + 1),
    },
    year: {
      type: "positional",
      description: "Year",
      default: String(new Date().getFullYear()),
    },
    simulate: {
      type: "boolean",
      description: "Simulate mode - don't actually create entries",
      default: false,
    },
  },
  async run({ args }) {
    consola.start("Starting Clockify bulk time entry");

    // Always prompt for config, but use stored values as defaults
    const clockifyConfig = await promptForConfig();

    const month = parseInt(args.month);
    const year = parseInt(args.year);
    const simulate = args.simulate;

    if (simulate) {
      consola.info(pc.yellow("SIMULATION MODE: No entries will be created"));
    }

    consola.info(
      `${simulate ? "Simulating" : "Creating"} entries for ${pc.cyan(
        format(new Date(year, month - 1), "MMMM yyyy")
      )} with description "${pc.green("shiroo")}"`
    );

    consola.info(`Each day will include a random 1-hour lunch break`);

    const workingDays = getWorkingDays(year, month);
    consola.info(`Found ${pc.bold(workingDays.length)} working days`);

    let success = 0;
    let failed = 0;

    for (const date of workingDays) {
      try {
        await createTimeEntry(clockifyConfig, date, simulate);
        success++;
        if (!simulate) {
          consola.info(
            `✓ Created entries for ${format(date, "yyyy-MM-dd")} (${success}/${
              workingDays.length
            }) with lunch break`
          );
        }
      } catch (error) {
        failed++;
        consola.error(
          `✗ Failed to ${simulate ? "simulate" : "create"} entries for ${format(
            date,
            "yyyy-MM-dd"
          )}: ${error}`
        );
      }
    }

    if (success > 0) {
      consola.success(
        `Successfully ${simulate ? "simulated" : "created"} ${pc.green(
          success
        )} days of time entries with lunch breaks`
      );
    }
    if (failed > 0) {
      consola.error(
        `Failed to ${simulate ? "simulate" : "create"} ${pc.red(
          failed
        )} days of time entries`
      );
    }

    if (simulate && success > 0) {
      consola.info("");
      consola.info(
        pc.cyan(
          "To create these entries for real, run the same command without the --simulate flag:"
        )
      );
      consola.info(pc.green(`npx tsx cli.ts ${args.month} ${args.year}`));
    }
  },
});

runMain(main);
