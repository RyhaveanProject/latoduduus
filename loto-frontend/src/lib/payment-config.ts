export interface BankInfo {
  id: string;
  bankName: string;
  cardOwner: string;
  cardNumber: string;
  currency: string;
}

export interface CryptoInfo {
  id: string;
  network: string;
  asset: string;
  address: string;
}

// NOTE: placeholder payment details — replace with real merchant data from the admin/backend config endpoint.
export const BANKS: Record<string, BankInfo[]> = {
  AZN: [
    { id: 'kapital', bankName: 'Kapital Bank', cardOwner: 'LOTO ONLINE MMC', cardNumber: '4169 7388 1234 5678', currency: 'AZN' },
    { id: 'pasha', bankName: 'PASHA Bank', cardOwner: 'LOTO ONLINE MMC', cardNumber: '4098 5566 8899 1122', currency: 'AZN' },
  ],
  RUB: [
    { id: 'sber', bankName: 'Sberbank', cardOwner: 'LOTO ONLINE LLC', cardNumber: '2202 2033 4455 6677', currency: 'RUB' },
    { id: 'tinkoff', bankName: 'T-Bank', cardOwner: 'LOTO ONLINE LLC', cardNumber: '5536 9137 8899 0011', currency: 'RUB' },
  ],
  TRY: [
    { id: 'isbank', bankName: 'İş Bankası', cardOwner: 'LOTO ONLINE LTD', cardNumber: '4022 1133 5566 7788', currency: 'TRY' },
    { id: 'garanti', bankName: 'Garanti BBVA', cardOwner: 'LOTO ONLINE LTD', cardNumber: '5400 2211 3344 5566', currency: 'TRY' },
  ],
  GEL: [
    { id: 'tbc', bankName: 'TBC Bank', cardOwner: 'LOTO ONLINE LLC', cardNumber: '5408 1122 3344 5566', currency: 'GEL' },
    { id: 'bog', bankName: 'Bank of Georgia', cardOwner: 'LOTO ONLINE LLC', cardNumber: '4011 9988 7766 5544', currency: 'GEL' },
  ],
};

export const CRYPTO: CryptoInfo[] = [
  { id: 'usdt-trc20', network: 'TRC20', asset: 'USDT', address: 'TQrZ8hP9k2L4m6N8q1R3s5T7u9V0wXyZ1A' },
  { id: 'usdt-bep20', network: 'BEP20', asset: 'USDT', address: '0x8a3F5b2C1d4E6f7A9b0C2d4E6f8A0b1C3d5E7f9' },
];
