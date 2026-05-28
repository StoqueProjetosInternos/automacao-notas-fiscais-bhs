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
    issueDate?: string;
  };
  barcode?: string; 
  additionalInfo?: Record<string, any>;
  rawText?: string;
}
