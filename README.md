# Base Quest

This is an experimental Farcaster frame app for an AI text-based adventure powered by the Base L2.
Base Quest is still a work in progress and subject to change.

![Base Quest Splash Screen](https://raw.githubusercontent.com/seangeng/based-adventure/e2128d21bf099af021946a338635b8022c8f7563/public/base-quest-bg.jpg)

# Want to play?

Follow me on Farcaster for the latest game link: https://warpcast.com/seangeng

## Todo

- Leaderboard (✅ testing)
- Option to continue vs start a new game (✅ testing)
- Issue Character NFTs on Base & save state to them (✅ testing)
- Notifications
- Character attributes
- Game backgrounds & environments
- $EXP Tokens
- Character profile links & PvP
- Multi-player quests

## How it Works

![Technical Diagram](https://raw.githubusercontent.com/seangeng/based-adventure/46cadc4b3a223c27a28597c106d30e79f743fac4/public/base-quest-diagram.png)

This high level diagram explains the frame states & how menu actions are managed generically.
Buttons can be passed to the menu in the GET parameter, and map to the business logic - essentially acting as a router.

Several awesome SDKs & frameworks are leveraged to accelerate developement:

Coinbase OnChain Kit: For frame helpers & future onchain actions.

- https://github.com/coinbase/onchainkit

Neynar: Making it easy to interact with Farcaster

- https://neynar.com/

OpenAI: For chat completions & image generation.

- https://openai.com

Inngest: For executing background jobs (there is latency when generating images + certain onchain actions)

- https://www.inngest.com/

Vercel: For hosting, and easy programmatic OpenGraph image generation:

- Check out `/src/app/api/prompt-image/route.tsx` as an example
- https://vercel.com/docs/functions/edge-functions/og-image-generation/og-image-examples

### Basic AI Workflow

Base Quest uses the OpenAI GPT 3.5 Turbo model to narrate & continue the storyline.
That means each user's journey is completely unique!

Check out the `/src/app/api/prompt/route.tsx` file to see how the AI prompt loop works:

1. AI generates the prompt & button options
   - system: You are the narrator in a choose your own adventure text-based game.
   - The user is a {class} starting their first adventure.
   - Write a character narration prompt (up to 100 characters), and present the user with either 2 or 4 action options to continue the story.
   - Action options should be either emoji(s) or short button text (up to 14 characters)
   - Return a JSON response like so: { }
2. Present options as next frame og:buttons
3. Feed the previous prompt & user selected action to the next prompt screen

### Onchain Interactions

To avoid timeouts and for better resiliency - Inngest is leveraged to run serverless jobs async & in the background.
This pattern has better monitoring, auto-retrys, and decouples business logic from the frame rendering.

Check out `/src/app/inngest/functions.tsx` to see how this works.

We use the InstaMint.sol contract - developed by my team at Coinbase & optimized for gas & ease of use!
The NFT factory contract is available at:
Sepolia Testnet: `0x4d64cAc5Bd09c7CaC9748D1E5a63A30Ee40B6A40`
Base Mainnet: `0x85db63af3f0cfac7813abb4dfca6d713e937a5dd`

### Want to build onchain?

The future is onchain. Does this interest you? Do you think you can do better?
Coinbase hires the top 1% of developers - reach out to me for a possible referral: https://www.linkedin.com/in/seangeng/
