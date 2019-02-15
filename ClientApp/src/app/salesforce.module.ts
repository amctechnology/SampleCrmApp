import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { SalesforceComponent } from './salesforce.component';
import { HomeSalesforceComponent } from './home/home-salesforce.component';
import { ActivitySalesforceComponent } from './activity/activity-salesforce.component';
import { CreateSalesforceComponent } from './create/create-salesforce.component';
import { SearchInformationSalesforceComponent } from './search-information/search-information-salesforce.component';
import { LoggerService } from './logger.service';
import { StorageService } from './storage.service';
import { ConfigurationService } from './configuration.service';


@NgModule({
  declarations: [
    SalesforceComponent,
    HomeSalesforceComponent,
    ActivitySalesforceComponent,
    CreateSalesforceComponent,
    SearchInformationSalesforceComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: HomeSalesforceComponent, pathMatch: 'full' }
    ])
  ],
  providers: [ConfigurationService,
    {
      provide: APP_INITIALIZER,
      useFactory: (configService: ConfigurationService, loggerService: LoggerService) =>
        async () => {
          await configService.loadConfigurationData();
          loggerService.intialize();
        },
      deps: [ConfigurationService, LoggerService],
      multi: true
    },
    LoggerService,
    StorageService],
  bootstrap: [SalesforceComponent]
})
export class AppModule { }
