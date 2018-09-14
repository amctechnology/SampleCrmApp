export interface IParams {
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
  };

}

