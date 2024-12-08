# Unmissable - A Reminder App

This app is the result of my first experiments with [Cursor](https://cursor.sh), an AI-powered code editor. It's a simple yet functional reminder app built with Expo and React Native that helps you manage your daily tasks and recurring reminders.

## Features

- Create reminders with title and time settings
- Support for recurring reminders (daily, weekly, monthly, or custom intervals)
- Daily view with horizontal swipe navigation
- Toggle completion status of reminders
- Manage all reminders with swipe-to-delete functionality
- Prevents completion of future reminders
- Local storage using AsyncStorage
- Dark mode support
- iOS-first design with SafeAreaView

## Technical Stack

- [Expo](https://expo.dev) with file-based routing
- React Native
- TypeScript
- AsyncStorage for local data persistence
- React Native Reanimated for smooth animations
- React Native Gesture Handler for swipe actions
- Prettier for consistent code formatting
- ESLint for code quality
- Husky for Git hooks

# Development Guide

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

## Code Quality

### Formatting

The project uses Prettier for consistent code formatting. The configuration includes automatic import sorting using `@ianvs/prettier-plugin-sort-imports`.

To format your code:

```bash
npm run format
```

To check if files are formatted correctly (useful in CI/CD):

```bash
npm run format:check
```

### Linting

The project uses ESLint with Expo's configuration. To lint your code:

```bash
npm run lint
```

### Pre-commit Hooks

The project uses Husky to run pre-commit hooks. Currently, it:

- Runs Prettier on all staged files
- Runs ESLint with auto-fix on staged TypeScript/JavaScript files

This ensures that all committed code follows the project's formatting standards and passes linting rules. If you need to bypass the hooks for any reason, you can use the `--no-verify` flag with your git commit.

## Running the App

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo
