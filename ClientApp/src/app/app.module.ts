import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AMCSalesforceHomeComponent } from './amcsalesforcehome/amcsalesforcehome.component';
import { ActivityComponent } from './activity/activity.component';
import { CreateComponent } from './create/create.component';
import { SearchInformationComponent } from './search-information/search-information.component';
import { LoggerService } from './logger.service';
import { StorageService } from './storage.service';
import { ConfigurationService } from './configuration.service';


@NgModule({
  declarations: [
    AppComponent,
    AMCSalesforceHomeComponent,
    ActivityComponent,
    CreateComponent,
    SearchInformationComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: AMCSalesforceHomeComponent, pathMatch: 'full' }
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
