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
    this.bridgeScripts.push(window.location.origin + '/bridge.bundle.js');
  }

  formatCrmResults(crmResults: any): api.SearchRecords {
    return null;
  }
}
