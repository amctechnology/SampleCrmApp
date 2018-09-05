import { TestBed, inject } from '@angular/core/testing';
import { AMCSalesforceHomeComponent } from './amcsalesforcehome.component';
import { SearchRecords } from '@amc/application-api';

describe('Home', () => {
  it('formatCrmResults', () => {
    const home = new AMCSalesforceHomeComponent();
    const crmResults = {
      '00Q3600000AS3QD': {
        'object': 'Lead',
        'displayName': 'Lead',
        'Name': 'Ms Kristen Akin'
      }
    };
    const searchRecords = home.formatCrmResults(crmResults);
    expect(searchRecords instanceof SearchRecords).toBe(true);
    expect(searchRecords.toJSON().length === 1);
    expect(searchRecords.toJSON()[0].id === '00Q3600000AS3QD');
    expect(searchRecords.toJSON()[0].fields.Name);
  });
});
