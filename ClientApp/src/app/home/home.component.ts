import { Component, OnInit } from '@angular/core';
import * as api from '@amc/application-api';
import { Application } from '@amc/applicationangularframework';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent extends Application {
  constructor() {
    super();
    this.appName = 'Salesforce';
    this.bridgeScripts = this.bridgeScripts.concat([
      window.location.origin + '/bridge.bundle.js',
      'https://c.na1.visual.force.com/support/api/42.0/interaction.js',
      'https://na15.salesforce.com/support/console/42.0/integration.js',
      'https://gs0.lightning.force.com/support/api/42.0/lightning/opencti_min.js'
    ]);
  }

  formatCrmResults(crmResults: any): api.SearchRecords {
    return null;
  }
}
