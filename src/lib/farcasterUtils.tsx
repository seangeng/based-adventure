interface fidResponse {
  verifications: string[];
}
export async function getAddrByFid(fid: number) {
  const options = {
    method: "GET",
    url: `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
    headers: { accept: "application/json", api_key: "NEYNAR_API_DOCS" },
  };
  const resp = await fetch(options.url, { headers: options.headers });
  const data = await resp.json();
  if (data?.users) {
    const userVerifications = data.users[0] as fidResponse;
    if (userVerifications.verifications) {
      return userVerifications.verifications[0];
    }
  }
  return "0x00";
}
