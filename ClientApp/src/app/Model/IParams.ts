export interface IParams {
  entityName: string;
  caseFields?: {
    AccountId?: string;
    ContactId?: string;
    Origin?: string;
    Status?: string;
    Comments?: string;
  };
  opportunityFields?: {
    AccountId?: string;
    StageName?: string;
    CloseDate?: string;
  };

}

