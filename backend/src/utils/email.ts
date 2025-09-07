/**
 * Masks an email, assumes a valid email format
 * john.doe@unsw.edu.au ==> j***@u***.au 
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '***';
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0][0] + '***.' + domainParts[domainParts.length - 1];
  
  return `${maskedLocal}@${maskedDomain}`;
}