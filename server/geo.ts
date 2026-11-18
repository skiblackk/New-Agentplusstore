export function getVercelCountryCode(headerValue: string | undefined, isVercelDeployment: boolean): string | undefined {
  if (!isVercelDeployment) return undefined;
  const countryCode = headerValue?.trim().toUpperCase();
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode) || countryCode === "XX" || countryCode === "ZZ") return undefined;
  return countryCode;
}
