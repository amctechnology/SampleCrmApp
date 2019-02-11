import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HomeSalesforceAppComponent } from './home/home-salesforce-app.component';
import { ActivitySalesforceAppComponent } from './activity/activity-salesforce-app.component';
import { CreateSalesforceAppComponent } from './create/create-salesforce-app.component';
import { SearchInformationSalesforceAppComponent } from './search-information/search-information-salesforce-app.component';
import { LoggerService } from './logger.service';
import { StorageService } from './storage.service';
import { ConfigurationService } from './configuration.service';


@NgModule({
  declarations: [
    AppComponent,
    HomeSalesforceAppComponent,
    ActivitySalesforceAppComponent,
    CreateSalesforceAppComponent,
    SearchInformationSalesforceAppComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: HomeSalesforceAppComponent, pathMatch: 'full' }
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
  bootstrap: [AppComponent]
})
export class AppModule { }
