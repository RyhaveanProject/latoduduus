import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const base = (children: React.ReactNode, props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" width={20} height={20} {...props}>
    {children}
  </svg>
);

export const IconHome = (p: IconProps) => base(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></>, p);
export const IconUser = (p: IconProps) => base(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" /></>, p);
export const IconWallet = (p: IconProps) => base(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1.2" /></>, p);
export const IconDeposit = (p: IconProps) => base(<><path d="M12 4v12" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>, p);
export const IconWithdraw = (p: IconProps) => base(<><path d="M12 20V8" /><path d="M7 13l5-5 5 5" /><path d="M5 20h14" /></>, p);
export const IconHistory = (p: IconProps) => base(<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></>, p);
export const IconSettings = (p: IconProps) => base(<><circle cx="12" cy="12" r="3" /><path d="M19.4 13a7.97 7.97 0 0 0 0-2l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L15 3h-6l-.3 2.6a8 8 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 11a7.97 7.97 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1L9 21h6l.3-2.6a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5Z" /></>, p);
export const IconShield = (p: IconProps) => base(<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" />, p);
export const IconLogout = (p: IconProps) => base(<><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>, p);
export const IconChevronDown = (p: IconProps) => base(<path d="m6 9 6 6 6-6" />, p);
export const IconCopy = (p: IconProps) => base(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>, p);
export const IconCheck = (p: IconProps) => base(<path d="m5 12 5 5 9-9" />, p);
export const IconUpload = (p: IconProps) => base(<><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M5 20h14" /></>, p);
export const IconChat = (p: IconProps) => base(<path d="M21 12a8 8 0 1 1-3.3-6.4L21 4l-1.2 4A8 8 0 0 1 21 12Z" />, p);
export const IconUsers = (p: IconProps) => base(<><circle cx="9" cy="8" r="3" /><path d="M2.5 19c.9-3.2 3.3-5 6.5-5s5.6 1.8 6.5 5" /><circle cx="17" cy="8" r="2.5" /><path d="M16 13.5c2.2.3 3.7 1.8 4.3 4" /></>, p);
export const IconEye = (p: IconProps) => base(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>, p);
export const IconPlus = (p: IconProps) => base(<><path d="M12 5v14" /><path d="M5 12h14" /></>, p);
export const IconArrowRight = (p: IconProps) => base(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>, p);
export const IconCrown = (p: IconProps) => base(<><path d="M3 18h18l-1.5-9-4.5 4-3-7-3 7-4.5-4L3 18Z" /></>, p);
export const IconLock = (p: IconProps) => base(<><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>, p);
export const IconMail = (p: IconProps) => base(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>, p);
export const IconCoin = (p: IconProps) => base(<><circle cx="12" cy="12" r="9" /><path d="M12 7v10" /><path d="M9 9.5c0-1.4 1.3-2.5 3-2.5s3 .9 3 2.2c0 2.6-6 1.4-6 4.1 0 1.3 1.3 2.2 3 2.2s3-1.1 3-2.5" /></>, p);
export const IconTicket = (p: IconProps) => base(<><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V9Z" /><path d="M10 7v10" strokeDasharray="2 2" /></>, p);
export const IconQr = (p: IconProps) => base(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3z" /><path d="M19 19h2v2h-2z" /></>, p);
export const IconSpinner = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" width={20} height={20} className="animate-spin" {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
export const IconAlert = (p: IconProps) => base(<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.8 17a1.8 1.8 0 0 0 1.6 2.7h15.2a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" /></>, p);
export const IconClose = (p: IconProps) => base(<><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>, p);
export const IconBan = (p: IconProps) => base(<><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></>, p);
export const IconSearch = (p: IconProps) => base(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>, p);
export const IconBell = (p: IconProps) => base(<><path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>, p);
export const IconDice = (p: IconProps) => base(<><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1" fill="currentColor" /><circle cx="16" cy="16" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>, p);
