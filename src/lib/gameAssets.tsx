import { db } from "@/lib/dependencies";

export function calculateLevel(exp: number): number {
  let level = 0;
  let requiredExpForNextLevel = 100;

  while (exp >= requiredExpForNextLevel) {
    level++;
    exp -= requiredExpForNextLevel; // Subtract the required exp for the current level
    requiredExpForNextLevel *= 1.25; // Increase the requirement for the next level
  }

  return level + 1;
}

export function calculateExpLevels(exp: number): {
  expForNextLevel: number;
  expForPrevLevel: number;
} {
  let requiredExpForNextLevel = 100;
  let cumulativeExp = 0; // Total experience required to reach the current level
  let expForPrevLevel = 0; // Experience required to reach the previous level

  while (exp >= cumulativeExp + requiredExpForNextLevel) {
    cumulativeExp += requiredExpForNextLevel;
    expForPrevLevel = cumulativeExp;
    requiredExpForNextLevel *= 1.25; // Increase the requirement for the next level
  }

  return {
    expForNextLevel: cumulativeExp + requiredExpForNextLevel,
    expForPrevLevel: expForPrevLevel,
  };
}

export function calculateCharacterState(character: {
  class: string;
  exp: number;
  health: number;
  expChange?: number;
  healthChange?: number;
}) {
  // Handle the exp and health changes
  let newHealth = character.health !== undefined ? character.health : 100;
  if (character.healthChange) {
    newHealth += character.healthChange;
  }
  // Force health to be between 0 and 100
  if (newHealth < 0) {
    newHealth = 0;
  } else if (newHealth > 100) {
    newHealth = 100;
  }

  // Calculate the new level
  const expChange = Math.max(0, Math.min(character.expChange || 0, 100)) ?? 0;
  let newCharacterExp = character.exp + expChange;
  const characterLevel = calculateLevel(newCharacterExp);

  // if exp is not a number for some reason, make it 0
  if (isNaN(newCharacterExp)) {
    newCharacterExp = 100;
  }

  const characterDescription = `Level ${characterLevel} • ${character.class}`;

  return {
    description: characterDescription,
    health: newHealth,
    exp: newCharacterExp,
    level: characterLevel,
    healthState: newHealth === 0 ? "dead" : "alive",
  };
}

export function buildPromptImageParams(
  character: {
    class: string;
    exp: number;
    health: number;
    expChange?: number;
    healthChange?: number;
    image?: string;
  },
  prompt: string
) {
  const { description, health, exp } = calculateCharacterState(character);

  // Calculate the new level
  const expChange = Math.max(0, Math.min(character.expChange || 0, 100)) ?? 0;

  // Build the params
  let params = `text=${prompt}&character=${description}&health=${health}&exp=${exp}`;
  if (expChange > 0) {
    params += `&expChange=${expChange}`;
  }
  if (character.healthChange && character.healthChange !== 0) {
    params += `&healthChange=${character.healthChange}`;
  }

  if (character.image) {
    params += `&image=${encodeURIComponent(character.image)}`;
  }

  return params;
}

// Logo for the game
export const BaseQuestLogo: React.FC<{
  position?: "absolute" | "relative";
  top?: number;
  left?: number;
}> = ({ position = "absolute", top = 20, left = 30 }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: position,
        top: top,
        left: left,
      }}
    >
      <svg
        width="116"
        height="32"
        viewBox="0 0 116 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15.9721 32C24.8241 32 32 24.8366 32 16C32 7.16344 24.8241 0 15.9721 0C7.57386 0 0.684242 6.44789 0 14.6551H21.1852V17.3449H1.15063e-07C0.684243 25.5521 7.57386 32 15.9721 32Z"
          fill="white"
        />
        <path
          d="M40 27.9788H49.5151C53.7629 27.9788 56.7873 25.4641 56.7873 21.3522C56.7873 18.1579 54.9523 16.1189 51.9618 15.5412V15.4393C54.4765 14.8276 56.0397 12.9925 56.0397 10.24C56.0397 6.43392 53.2192 4.05515 49.1753 4.05515H40V27.9788ZM53.491 10.5458C53.491 12.9925 51.7239 14.5557 48.8354 14.5557H42.5487V6.23002H48.8354C51.7239 6.23002 53.491 7.75923 53.491 10.206V10.5458ZM54.2387 21.4202C54.2387 24.0708 52.3016 25.8039 49.1413 25.8039H42.5487V16.6626H49.1073C52.2677 16.6626 54.2387 18.3278 54.2387 21.0804V21.4202Z"
          fill="white"
        />
        <path
          d="M74.6502 27.9788H77.3688L69.4169 4.05515H66.3245L58.4745 27.9788H61.0572L63.0961 21.4881H72.6112L74.6502 27.9788ZM67.7857 6.6718H67.9896L71.9655 19.3473H63.7758L67.7857 6.6718Z"
          fill="white"
        />
        <path
          d="M88.0953 28.4546C93.3286 28.4546 96.7608 25.634 96.7608 21.3862C96.7608 17.4442 94.1781 15.5752 90.2701 14.9295L86.8039 14.3518C84.1533 13.9101 82.3862 12.7547 82.3862 10.206C82.3862 7.6233 84.3572 5.65232 88.0953 5.65232C91.7314 5.65232 93.6004 7.48738 93.8043 10.104H96.421C96.2171 6.63781 93.5664 3.54541 88.1292 3.54541C82.76 3.54541 79.8035 6.56985 79.8035 10.3079C79.8035 14.2839 82.4882 16.1189 86.1583 16.7306L89.6585 17.2743C92.5809 17.7841 94.2121 18.9734 94.2121 21.4881C94.2121 24.4446 91.7994 26.3476 88.1292 26.3476C84.3232 26.3476 81.9444 24.5126 81.7405 21.3862H79.1579C79.3618 25.4641 82.4882 28.4546 88.0953 28.4546Z"
          fill="white"
        />
        <path
          d="M100.589 4.05515V27.9788H115.949V25.7699H103.138V16.6626H114.929V14.4878H103.138V6.26401H115.949V4.05515H100.589Z"
          fill="white"
        />
      </svg>
      <span
        style={{
          position: "relative",
          top: -4,
          fontSize: 36,
        }}
      >
        Quest
      </span>
    </div>
  );
};
