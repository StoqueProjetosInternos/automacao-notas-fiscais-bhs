export interface ApportionmentItem {
  description?: string;
  quantity?: number;
  unitValue?: number;
  value?: number;
  cr?: string;
  crDescription?: string;
  naturezaCode?: string;
  naturezaDescription?: string;
  contract?: string;
  serialNumber?: string;
}

export interface BoletoData {
  documentType?: string;
  beneficiary?: {
    name?: string;
  };
  payer?: {
    name?: string;
    cnpjCpf?: string;
  };
  supplier?: {
    name?: string;
    cnpjCpf?: string;
    partnerCode?: string;
  };
  financial?: {
    dueDate?: string;
    originalValue?: number;
    chargedValue?: number;
    issueDate?: string;
    competenceDate?: string;
    taxes?: {
      iss?: number;
      irrf?: number;
      pis?: number;
      cofins?: number;
      csll?: number;
    };
  };
  documentIdentifiers?: {
    ourNumber?: string;
    documentNumber?: string;
    clientAccount?: string;
    issueDate?: string;
  };
  barcode?: string; 
  additionalInfo?: Record<string, any>;
  accountingFields?: {
    cr?: string;
    crDescription?: string;
    naturezaCode?: string;
    naturezaDescription?: string;
    contract?: string;
  };
  apportionment?: ApportionmentItem[];
  rawText?: string;
  zeevValidation?: {
    isWithinIdealDeadline?: boolean;  // Vencimento >= 10 dias corridos de hoje E emissão <= 2 dias úteis de hoje
    isIssuedAfterDay25?: boolean;     // Se a emissão foi após o dia 25 do mês
    suggestedPaymentRule?: "IDEAL" | "ALTERNATIVE"; // IDEAL se prazos cumpridos, ALTERNATIVE se fora
    isInstallmentPay?: boolean;       // Identifica se há menção a parcelamento
    installmentsCount?: number;       // Quantidade de parcelas se houver
  };
}

