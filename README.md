# 🕒 Clockify Bulk Time Entry

An elegant CLI tool to create Clockify time entries for all working days in a month.

## Features

- 🎯 Interactive prompts for configuration
- 💾 Saves your Clockify credentials securely
- ⚡️ Fast bulk entry creation
- 🎨 Beautiful terminal output
- 📅 Automatically skips weekends
- ⏰ Customizable work hours with save option
- 🚦 Clear success/error reporting

## Setup

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
- Auth Token (found in your user settings > API)

These will be saved securely for future use.

### Basic Usage

Create entries for current month:
```bash
./cli.ts --description="Your task description"
# Or if linked globally:
clockify-bulk --description="Your task description"
```

### Specify Month and Year

Create entries for a specific month:
```bash
./cli.ts 3 2024 --description="Your task description"
```

### Custom Work Hours

```bash
./cli.ts --description="Your task description" --startHour=10 --endHour=18
```

Save these hours as defaults:
```bash
./cli.ts --description="Your task description" --startHour=10 --endHour=18 --save-hours
```

## Development

Just edit `cli.ts` and run it directly - no build step needed! The script uses `tsx` to run TypeScript directly. 