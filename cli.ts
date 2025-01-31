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

async function createTimeEntry(config: ClockifyConfig, date: Date) {
  const start = new Date(date);
  start.setHours(config.startHour, 0, 0, 0);

  const end = new Date(date);
  end.setHours(config.endHour, 0, 0, 0);

  const body = {
    billable: true,
    description: config.description,
    projectId: config.projectId,
    taskId: null,
    tagIds: null,
    customFields: [],
    start: start.toISOString(),
    end: end.toISOString(),
  };

  const response = await fetch(
    `https://eu-central-1.api.clockify.me/workspaces/${config.workspaceId}/timeEntries/full`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-auth-token": config.authToken,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create time entry: ${response.statusText}`);
  }

  return response.json();
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
      type: "text",
      name: "description",
      message: "Enter time entry description:",
      initial: config.get("lastDescription") as string,
      validate: (value: string) => !!value || "Description is required",
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

  if (
    !responses.workspaceId ||
    !responses.projectId ||
    !responses.authToken ||
    !responses.description
  ) {
    throw new Error("All fields are required");
  }

  // Save responses to config
  config.set("workspaceId", responses.workspaceId);
  config.set("projectId", responses.projectId);
  config.set("authToken", responses.authToken);
  config.set("lastDescription", responses.description);
  config.set("startHour", responses.startHour);
  config.set("endHour", responses.endHour);

  return {
    workspaceId: responses.workspaceId,
    projectId: responses.projectId,
    authToken: responses.authToken,
    description: responses.description,
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
  },
  async run({ args }) {
    consola.start("Starting Clockify bulk time entry");

    // Always prompt for config, but use stored values as defaults
    const clockifyConfig = await promptForConfig();

    const month = parseInt(args.month);
    const year = parseInt(args.year);

    consola.info(
      `Creating entries for ${pc.cyan(
        format(new Date(year, month - 1), "MMMM yyyy")
      )}`
    );

    const workingDays = getWorkingDays(year, month);
    consola.info(`Found ${pc.bold(workingDays.length)} working days`);

    let success = 0;
    let failed = 0;

    for (const date of workingDays) {
      try {
        await createTimeEntry(clockifyConfig, date);
        success++;
        consola.info(
          `✓ Created entry for ${format(date, "yyyy-MM-dd")} (${success}/${
            workingDays.length
          })`
        );
      } catch (error) {
        failed++;
        consola.error(
          `✗ Failed to create entry for ${format(date, "yyyy-MM-dd")}: ${error}`
        );
      }
    }

    if (success > 0) {
      consola.success(`Successfully created ${pc.green(success)} time entries`);
    }
    if (failed > 0) {
      consola.error(`Failed to create ${pc.red(failed)} time entries`);
    }
  },
});

runMain(main);
