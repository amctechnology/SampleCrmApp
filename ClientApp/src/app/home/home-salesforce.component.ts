import { Component, OnInit } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { Application } from '@amc-technology/applicationangularframework';
import { bind } from 'bind-decorator';
import { LoggerService } from '../logger.service';
@Component({
  selector: 'app-home',
  templateUrl: './home-salesforce.component.html'
})
export class HomeSalesforceComponent extends Application implements OnInit {
  public searchLayout: api.SearchLayouts;

  constructor(private loggerService: LoggerService) {
    super(loggerService.logger);
  }

  protected getSearchLayout(): Promise<api.SearchLayouts> {
    throw new Error('Method not implemented.');
  }

  async ngOnInit() {
    try {
      await this.loadConfig();
      let salesforceOrg = 'https://na132.salesforce.com';
      if (this.appConfig['variables']['salesforceOrg'] !== undefined && this.appConfig['variables']['salesforceOrg'] !== null &&
        String(this.appConfig['variables']['salesforceOrg']).length > 0) {
          salesforceOrg = String(this.appConfig['variables']['salesforceOrg']);
        }

        this.bridgeScripts = this.bridgeScripts.concat([
          this.getBridgeURL(),
          salesforceOrg + '/support/api/48.0/interaction.js',
          salesforceOrg + '/support/console/48.0/integration.js',
        salesforceOrg + '/support/api/48.0/lightning/opencti_min.js'
      ]);

      await super.ngOnInit();
      // TODO: INTERN Subscribe to ClickTodial Event Here Here!
      // subscribe to clickToDial using bridgeEventsService
      // pass the subscription the method clickToDialHandler, then fill out
      // the implmentation of clickToDialHandler
      // The below line can achieve this
      // this.bridgeEventsService.subscribe('clickToDial', this.clickToDialHandler);
      this.searchLayout = await this.getSearchLayout();
      api.registerOnLogout(this.removeLocalStorageOnLogout);
      this.logger.logDebug('Salesforce - Home : END : Fetching Salesforce App Configuration');
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Fetching Configuration. Error Information : '
      + JSON.stringify(error));
    }
  }

  protected saveActivity(activity: api.Activity): Promise<string> {
    throw new Error('Method not implemented.');
  }
  protected formatCrmResults(crmResults: any): api.SearchRecords {
    throw new Error('Method not implemented.');
  }

  @bind
  protected removeLocalStorageOnLogout(): Promise<any> {
    this.enableClickToDial(false);
    localStorage.clear();
    return new Promise((resolve, reject) => { });
  }

  protected async onInteraction(interaction: api.IInteraction): Promise<api.SearchRecords> {
    try {
      let isNewScenarioId = true;

      // TODO: INTERN Notice how onInteraction (called at the start of a call) calls searchAndScreenpop to begin the process
      const searchRecord = await this.searchAndScreenpop(interaction, isNewScenarioId);
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : On Interaction. More Info : ' + JSON.stringify(error));
    }
    this.logger.logDebug('Salesforce - Home : END : Interaction recieved: ' + JSON.stringify(interaction));
    return;
  }

  // TODO: INTERN Modify this method
  private async searchAndScreenpop(interaction: api.IInteraction, isNewScenarioId: boolean) {
    try {
      // TODO: INTERN WRITE CODE HERE
      let event = null;
      // Generate screenpop event using this.generateEventForScreenpop(interaction) and assign to event variable

      // This is updating the event to tell the framework to search. No need to modify.
      event['search'] = true;
      // Call await this.bridgeEventService.sendEvent('search', event) and assign it to a variable
      // Calling the above will send the event to bridge-salesforce.ts
      // If bridge-salesforce.ts is subscribed to an event called 'search', it will catch the event and process it
      // So, we must also go to the bridge-salesforce.ts file and subscribe to 'search' - See TODO: on bridge-salesforce.ts
      // return the variable
      return null;
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Search and Screen pop. Interaction Info : ' + JSON.stringify(interaction)
        + '. Error Information : ' + JSON.stringify(error));
    }
  }


  protected isToolbarVisible(): Promise<boolean> {
    return this.bridgeEventsService.sendEvent('isToolbarVisible');
  }

  // TODO: INTERN Modify this method
  // This method will be passed to the subscription for clickToDial
  @bind
  protected clickToDialHandler(event: any) {
    try {
      this.logger.logDebug('Salesforce - Home : START: Click to Dial Event : ' + JSON.stringify(event));
      // Grab the phone number from event.entity.number
      // Then use api.clickToDial to place the call
      // api.clickToDial(event.entity.number);
      this.logger.logDebug('Salesforce - Home : END: Click to Dial Event : ' + JSON.stringify(event));
    } catch (error) {
      this.logger.logError('Salesforce - Home : ERROR : Click to Dial Event. Event Info : ' + JSON.stringify(event)
        + '. Error Info : ' + JSON.stringify(error));
    }
  }
}
