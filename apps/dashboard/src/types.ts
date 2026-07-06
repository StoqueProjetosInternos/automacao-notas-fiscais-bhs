/**
 * Define as tipagens estruturadas do frontend para manter consistência com o backend.
 */

export interface NoteData {
  documentType?: string;
  status?: string;
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
  additionalInfo?: Record<string, unknown>;
  rawText?: string;
  
  apportionment?: ApportionmentItem[];
  accountingFields?: AccountingFields;
  
  // Suporte a campos de legado que podem existir nos JSONs salvos
  valorTotal?: number;
  [key: string]: unknown;
}

export interface AccountingFields {
  cr?: string;
  crDescription?: string;
  naturezaCode?: string;
  naturezaDescription?: string;
  contract?: string;
  [key: string]: unknown;
}

export interface ApportionmentItem {
  description?: string;
  quantity?: number;
  unitValue?: number;
  value?: number;
  cr?: string;
  naturezaCode?: string;
  contract?: string;
  serialNumber?: string;
  [key: string]: unknown;
}

export interface Note {
  id: string;
  fileName: string;
  data: NoteData;
  files: {
    json: string;
    pdf: string | null;
    txt: string | null;
  };
}
