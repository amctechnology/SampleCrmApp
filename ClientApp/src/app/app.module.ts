import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AMCSalesforceHomeComponent } from './amcsalesforcehome/amcsalesforcehome.component';
import { ActivityComponent } from './activity/activity.component';
import { CreateComponent } from './create/create.component';
import { RecentComponent } from './recent/recent.component';
import { SearchInformationComponent } from './search-information/search-information.component';


@NgModule({
  declarations: [
    AppComponent,
    AMCSalesforceHomeComponent,
    ActivityComponent,
    CreateComponent,
    RecentComponent,
    SearchInformationComponent,

  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: '', component: AMCSalesforceHomeComponent, pathMatch: 'full' }
    ])
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
