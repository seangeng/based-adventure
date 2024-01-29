# Base Quest

This is an experimental Farcaster frame app for an AI text-based adventure powered by the Base L2. Base Quest is still a work in progress and subject to change.

![Base Quest Splash Screen](https://raw.githubusercontent.com/seangeng/based-adventure/e2128d21bf099af021946a338635b8022c8f7563/public/base-quest-bg.jpg)

## Todo

- Issue Character NFTs on Base & save state to them
- Leaderboard (testing)
- Option to continue vs start a new game
- Character attributes
- $EXP
- Multi-player quests

## How it Works

![Technical Diagram](https://raw.githubusercontent.com/seangeng/based-adventure/e2128d21bf099af021946a338635b8022c8f7563/public/base-quest-flowchart.png)

### Basic AI Workflow

1. Start by choosing a class (wizard, paladin, barbarian, monk)
2. Present the classes as og:buttons
3. Retrieve the FID from the first selection, create a state in MongoDB for the user
4. Prompt AI
   - system: You are the narrator in a choose your own adventure text-based game.
   - The user is a {class} starting their first adventure.
   - Write a character narration prompt (up to 100 characters), and present the user with either 2 or 4 action options to continue the story.
   - Action options should be either emoji(s) or short button text (up to 14 characters)
   - Return a JSON response like so: { }
5. Present options as next frame og:buttons

### Action Taken

- Increment turns
- Update state
- Prompt AI

  - system: You are the narrator in a choose your own adventure text based game.
  - The user is a {class} on their first adventure.

  - When given the prompt: {prevPrompt}
  - The user has chosen: {action}

  - Write a follow up prompt to continue the adventure (up to 100 characters), and present the user with and present the user with either 2 or 4 action options.
  - Action options should be either emoji(s) or short button text (up to 14 characters)
  - Return a new description of the character, reflective of their current state based on the choices so far.
  - Return a JSON response like so: { }

- Update state
- Present options as next frame og:buttons

ACTION TAKEN:

- Increment turns
- Update state
- Prompt AI

  - system: You are the narrator in a choose your own adventure text based game.
  - The user is a {class} on their first adventure.
  - User character's state: {state}
  - Previous decisions: []

  - When given the prompt: {prevPrompt}
  - The user has chosen: {action}

  - Write a follow up prompt to continue the adventure (up to 100 characters), and present the user with and present the user with either 2 or 4 action options.
  - Action options should be either emoji(s) or short button text (up to 14 characters)
  - Return an updated description of the character, reflective of their current state based on the choices so far.
  - Return a JSON response like so: { }

- Update state
- Present options as next frame og:buttons

... and so on
