# 🕒 Clockify Bulk Time Entry

An elegant CLI tool to create Clockify time entries for all working days in a month.

## Quick Start

```bash
npx lredoban/clockify-bulk
```

## Features

- 🎯 Interactive prompts for configuration
- 💾 Saves your Clockify credentials securely
- ⚡️ Fast bulk entry creation
- 🎨 Beautiful terminal output
- 📅 Automatically skips weekends
- ⏰ Customizable work hours with save option
- 🚦 Clear success/error reporting
- 🔍 Simulation mode to preview changes

## Setup

### Getting your Clockify Auth Token

1. Log in to [Clockify](https://app.clockify.me/)
2. Open your browser's Developer Tools (F12 or right-click > Inspect)
3. Go to the Network tab
4. Look for any request to Clockify's API
5. Find the `x-auth-token` in the request headers
6. Copy this token - you'll need it during the first run

### Installation Options

#### Using npx (recommended)
No installation needed, just run:
```bash
npx lredoban/clockify-bulk
```

#### Local Installation
1. Install dependencies:
```bash
pnpm install
```

2. Make the script executable:
```bash
chmod +x cli.ts
```

3. Link it globally (optional):
```bash
pnpm link --global
```

## Usage

### First Time Setup

The first time you run the command, it will interactively prompt you for:
- Workspace ID (found in the URL when you're in your workspace)
- Project ID (found in the project settings)
- Auth Token (found as explained above)

These will be saved securely for future use.

### Basic Usage

Create entries for current month:
```bash
npx lredoban/clockify-bulk
# Or if installed locally:
./cli.ts
# Or if linked globally:
clockify-bulk
```

### Simulation Mode

To preview changes without actually creating entries:
```bash
npx lredoban/clockify-bulk --simulate
```

### Specify Month and Year

Create entries for a specific month:
```bash
npx lredoban/clockify-bulk 3 2024 --description="Your task description"
```

### Custom Work Hours

```bash
npx lredoban/clockify-bulk --startHour=10 --endHour=18
```

## Development

Just edit `cli.ts` and run it directly - no build step needed! The script uses `tsx` to run TypeScript directly. 