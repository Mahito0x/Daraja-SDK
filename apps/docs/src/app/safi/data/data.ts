export interface MpesaTransaction {
  receiptNo: string;
  completionTime: string; // "YYYY-MM-DD HH:mm:ss"
  details: string;
  status: string;
  paidIn: number;
  withdrawn: number;
  balance: number;
}

export interface MpesaSummaryItem {
  category: string;
  paidIn: number;
  paidOut: number;
}

export interface MpesaStatementData {
  customerName: string;
  mobileNumber: string;
  email: string;
  statementPeriod: string;
  requestDate: string;
  summary: MpesaSummaryItem[];
  totals: {
    paidIn: number;
    paidOut: number;
  };
  transactions: MpesaTransaction[];
}

export const mockMpesaStatement: MpesaStatementData = {
  customerName: "ALEX WANYONYI KIPROP",
  mobileNumber: "0711223344",
  email: "alex.kiprop.dev@gmail.com",
  statementPeriod: "01 Jan 2026 - 29 Sep 2026",
  requestDate: "29 Sep 2026",
  summary: [
    { category: "SEND MONEY", paidIn: 0.0, paidOut: 45600.0 },
    { category: "RECEIVED MONEY", paidIn: 128500.0, paidOut: 0.0 },
    { category: "AGENT DEPOSIT", paidIn: 35000.0, paidOut: 0.0 },
    { category: "AGENT WITHDRAWAL", paidIn: 0.0, paidOut: 22000.0 },
    { category: "LIPA NA M-PESA (PAYBILL)", paidIn: 0.0, paidOut: 31400.0 },
    { category: "LIPA NA M-PESA (BUY GOODS)", paidIn: 0.0, paidOut: 18900.0 },
    { category: "OTHERS", paidIn: 15200.0, paidOut: 11500.0 },
  ],
  totals: {
    paidIn: 178700.0,
    paidOut: 129400.0,
  },
  transactions: [
    // --- SEPTEMBER 2026 ---
    {
      receiptNo: "XYZ9988AAA",
      completionTime: "2026-09-28 14:10:22",
      details: "Customer Transfer of Funds Charge",
      status: "Completed",
      paidIn: 0,
      withdrawn: 12.0,
      balance: 1420.5,
    },
    {
      receiptNo: "XYZ9988AAB",
      completionTime: "2026-09-28 14:10:22",
      details: "Customer Transfer to -254799***888 BRIAN JUMA",
      status: "Completed",
      paidIn: 0,
      withdrawn: 1500.0,
      balance: 1432.5,
    },
    {
      receiptNo: "XYZ8877BBC",
      completionTime: "2026-09-25 09:30:15",
      details: "Funds received from -0722***111 SARAH MUTUA",
      status: "Completed",
      paidIn: 4500.0,
      withdrawn: 0,
      balance: 2932.5,
    },
    {
      receiptNo: "XYZ7766CCD",
      completionTime: "2026-09-20 18:15:40",
      details: "PayBill to 522522 - SPORTPESA Acc. 987654",
      status: "Completed",
      paidIn: 0,
      withdrawn: 1000.0,
      balance: 1532.5,
    },
    {
      receiptNo: "XYZ6655DDE",
      completionTime: "2026-09-12 11:05:00",
      details: "Customer Bundle Purchase to SAFARICOM POSTPAID BUNDLES",
      status: "Completed",
      paidIn: 0,
      withdrawn: 500.0,
      balance: 2532.5,
    },
    {
      receiptNo: "XYZ5544EEF",
      completionTime: "2026-09-05 08:22:10",
      details: "Agent Deposit cash by self",
      status: "Completed",
      paidIn: 5000.0,
      withdrawn: 0,
      balance: 3032.5,
    },

    // --- AUGUST 2026 ---
    {
      receiptNo: "ABC5544EEF",
      completionTime: "2026-08-29 16:45:10",
      details: "Merchant Payment to 315502 - JAVA COFFEE HOUSE",
      status: "Completed",
      paidIn: 0,
      withdrawn: 1800.0,
      balance: 3032.5,
    },
    {
      receiptNo: "ABC4433FFG",
      completionTime: "2026-08-18 10:20:33",
      details: "Funds received from -0733***222 DANIEL OCHIENG",
      status: "Completed",
      paidIn: 8000.0,
      withdrawn: 0,
      balance: 4832.5,
    },
    {
      receiptNo: "ABC3322GGH",
      completionTime: "2026-08-10 13:50:11",
      details: "Agent Withdrawal at Westgate Mall Station",
      status: "Completed",
      paidIn: 0,
      withdrawn: 5000.0,
      balance: 3292.5,
    },
    {
      receiptNo: "ABC2211HHI",
      completionTime: "2026-08-04 15:12:00",
      details: "Customer Transfer to -254711***333 KEVIN OUMA",
      status: "Completed",
      paidIn: 0,
      withdrawn: 2500.0,
      balance: 8292.5,
    },

    // --- JULY 2026 ---
    {
      receiptNo: "DEF2211HHI",
      completionTime: "2026-07-27 17:11:00",
      details: "Customer Transfer to -254711***444 MERCHEDEZ CHEBET",
      status: "Completed",
      paidIn: 0,
      withdrawn: 2500.0,
      balance: 8292.5,
    },
    {
      receiptNo: "DEF1100IIJ",
      completionTime: "2026-07-14 08:40:50",
      details: "Funds received from -0700***555 ESTHER WANJIKU",
      status: "Completed",
      paidIn: 3000.0,
      withdrawn: 0,
      balance: 10792.5,
    },
    {
      receiptNo: "DEF0099JJK",
      completionTime: "2026-07-02 12:00:00",
      details: "PayBill to 888880 - EQUITY BANK",
      status: "Completed",
      paidIn: 0,
      withdrawn: 4500.0,
      balance: 7792.5,
    },

    // --- JUNE 2026 ---
    {
      receiptNo: "GHI9988JJK",
      completionTime: "2026-06-22 12:00:15",
      details: "PayBill to 888880 - EQUITY BANK LOAN",
      status: "Completed",
      paidIn: 0,
      withdrawn: 4000.0,
      balance: 7792.5,
    },
    {
      receiptNo: "GHI8877KKL",
      completionTime: "2026-06-05 15:30:22",
      details: "Agent Deposit cash by self",
      status: "Completed",
      paidIn: 10000.0,
      withdrawn: 0,
      balance: 11792.5,
    },
    {
      receiptNo: "GHI7766LLM",
      completionTime: "2026-06-01 09:10:00",
      details: "Funds received from -0722***111 SARAH MUTUA",
      status: "Completed",
      paidIn: 12500.0,
      withdrawn: 0,
      balance: 1792.5,
    },

    // --- MAY 2026 ---
    {
      receiptNo: "JKL7766LLM",
      completionTime: "2026-05-19 19:25:40",
      details: "Customer Transfer to -254722***333 KEVIN OUMA",
      status: "Completed",
      paidIn: 0,
      withdrawn: 3500.0,
      balance: 1792.5,
    },
    {
      receiptNo: "JKL6655MMN",
      completionTime: "2026-05-10 14:11:20",
      details: "Merchant Payment to 315502 - NAIVAS SUPERMARKET",
      status: "Completed",
      paidIn: 0,
      withdrawn: 3200.0,
      balance: 5292.5,
    },

    // --- APRIL 2026 ---
    {
      receiptNo: "MNO6655MMN",
      completionTime: "2026-04-11 11:14:05",
      details: "Funds received via Standard Bank",
      status: "Completed",
      paidIn: 15000.0,
      withdrawn: 0,
      balance: 5292.5,
    },
    {
      receiptNo: "MNO5544NOO",
      completionTime: "2026-04-03 16:40:00",
      details: "Agent Withdrawal at CBD Station",
      status: "Completed",
      paidIn: 0,
      withdrawn: 6000.0,
      balance: 9700.5,
    },

    // --- MARCH 2026 ---
    {
      receiptNo: "PQR5544NOO",
      completionTime: "2026-03-15 08:50:18",
      details: "Buy Goods and Services to Naivas Supermarket",
      status: "Completed",
      paidIn: 0,
      withdrawn: 4200.0,
      balance: 9700.5,
    },
    {
      receiptNo: "PQR4433OPP",
      completionTime: "2026-03-08 13:20:10",
      details: "Funds received from -0733***222 DANIEL OCHIENG",
      status: "Completed",
      paidIn: 11000.0,
      withdrawn: 0,
      balance: 13900.5,
    },

    // --- FEBRUARY 2026 ---
    {
      receiptNo: "STU4433OPP",
      completionTime: "2026-02-10 16:30:00",
      details: "Funds received from -0722***111 SARAH MUTUA",
      status: "Completed",
      paidIn: 6000.0,
      withdrawn: 0,
      balance: 13900.5,
    },
    {
      receiptNo: "STU3322PQR",
      completionTime: "2026-02-02 11:15:30",
      details: "Customer Transfer to -254799***888 BRIAN JUMA",
      status: "Completed",
      paidIn: 0,
      withdrawn: 3000.0,
      balance: 7900.5,
    },

    // --- JANUARY 2026 ---
    {
      receiptNo: "VWX3322PQR",
      completionTime: "2026-01-05 10:00:00",
      details: "Agent Deposit cash",
      status: "Completed",
      paidIn: 10000.0,
      withdrawn: 0,
      balance: 7900.5,
    },
    {
      receiptNo: "VWX2211QRS",
      completionTime: "2026-01-01 18:30:00",
      details: "Merchant Payment to 315502 - QUICKMART",
      status: "Completed",
      paidIn: 0,
      withdrawn: 1500.0,
      balance: 4900.5,
    },
  ],
};
