interface farcasterUser {
  [fid: number]: {
    object: string;
    fid: number;
    custody_address: string;
    username: string;
    display_name: string;
    pfp_url: string;
    profile: {
      bio: any;
    };
    follower_count: number;
    following_count: number;
    verifications: string[];
    active_status: string;
  };
}

export async function getFarcasterUsersFromFID(
  farcasterIDs: number | number[]
): Promise<any> {
  const headers = {
    "Content-Type": "text/html",
    accept: "application/json",
    api_key: process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS",
  };

  let fidsQueryParam: string;
  if (Array.isArray(farcasterIDs)) {
    fidsQueryParam = farcasterIDs.join(",");
  } else {
    fidsQueryParam = farcasterIDs as unknown as string;
  }

  const resp = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fidsQueryParam}`,
    { headers }
  );
  const responseBody = await resp.json();
  // Get the user verifications from the response
  if (responseBody.users) {
    // Map the users to their FID and return
    const users = responseBody.users;
    const usersByFID: any = {};
    users.forEach((user: any) => {
      usersByFID[user.fid] = user;
    });
    return usersByFID as farcasterUser;
  }
  return;
}

export async function getSignerStatus(signerUuid: string) {
  const headers = {
    "Content-Type": "text/html",
    accept: "application/json",
    api_key: process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS",
  };

  const resp = await fetch(
    `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signerUuid}`,
    { headers }
  );
  const responseBody = await resp.json();
  return responseBody;
}

export async function postCast({ message }: { message: string }) {
  const headers = {
    "Content-Type": "application/json",
    accept: "application/json",
    api_key: process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS",
  };

  const body = JSON.stringify({
    signer_uuid: process.env.NEYNAR_BOT_SIGNER,
    text: message,
  });

  console.log("Posting cast", body);

  const resp = await fetch("https://api.neynar.com/v2/farcaster/cast", {
    method: "POST",
    headers,
    body,
  });

  const responseBody = await resp.json();
  return responseBody;
}
