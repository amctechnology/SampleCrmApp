export interface ICreateNewParams {
  entityName: string;
  caseFields?: {
    AccountId?: string;
    ContactId?: string;
    Origin?: string;
    Status?: string;
    Description?: string;
  };
  opportunityFields?: {
    AccountId?: string;
    StageName?: string;
    CloseDate?: string;
    Description?: string;
  };
  leadFields?: {
    AccountId?: string;
    ContactId?: string;
    Phone?: string;
    Description?: string;
  };
}

