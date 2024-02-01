"use client";
import React from "react";

interface ProfileButtonsProps {
  buttons: string[];
}

const ProfileButtons: React.FC<ProfileButtonsProps> = ({ buttons }) => {
  return (
    <div className="flex gap-4 items-center align-middle justify-center">
      {buttons.map((button, index) => {
        return (
          <button
            key={index}
            className="btn bg-slate-500 p-2 px-4 rounded"
            onClick={() =>
              alert(
                `Post the profile URL to Warpcast to be able to ${button} this character.`
              )
            }
          >
            {button}
          </button>
        );
      })}
    </div>
  );
};

export default ProfileButtons;
