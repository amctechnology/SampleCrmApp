import { Bridge } from '@amc-technology/applicationangularframework';
import { bind } from 'bind-decorator';
import { IScreenpopEvent } from '@amc-technology/applicationangularframework/dist/util/IScreenpopEvent';
declare var sforce: any;

class BridgeSalesforce extends Bridge {

  constructor() {
    super();
    this.initialize();
    // TODO: INTERN
    // subscribe to event 'search' and pass the callback as screenpopHandler
    // We need to subscribe because home-salesforce.ts is sending the event 'search' from searchAndScreenpop after a new interaction starts
    // This can be done by uncommenting the below line.
    // this.eventService.subscribe('search', this.screenpopHandler);

    }

  async afterScriptsLoad(): Promise<any> {
    this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Bridge Scripts Loaded');
    await super.afterScriptsLoad();
    // TODO: INTERN Listen for click to dial!
    // To do this, we need to use Salesforce's api in order to get notified
    // when the user clicks a contact's number inside the Salesforce CRM.
    // This can be done by uncommenting the below line (Study this)
    // What the below line is doing is telling Salesforce to let us know when a user clicks a number,
    // by calling our method clickToDialListener

    // sforce.opencti.onClickToDial({ listener: this.clickToDialListener });

    this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : App running in Lightning');
  }

  @bind
  clickToDialListener(event) {
    // TODO: INTERN This method gets called as the callback when a user clicks a number in Salesforce CRM.
    // What we need to do in this method, is use the eventService to send an event 'clickToDial' to home-salesforce.ts
    // In home-salesforce.ts, we are subscribed to this event, and when we receive an event,
    // it will call the davinci api imported in home-salesforce.ts to trigger the click to dial
    // Uncommenting the below line will allow this click to dial event from salesforce to be sent to the home component.
    //  this.eventService.sendEvent('clickToDial', event);
  }

  @bind
  async screenpopHandler(event: IScreenpopEvent): Promise<any> {
    this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Received Screen Pop Handler Event. Info : ' + JSON.stringify(event));
    try {
      // TODO: INTERN WRITE CODE HERE
      // Here, we've captured an event that can be used with salesforce's api to trigger a screenpop
      // To initiate the screenpop, we'll need to call salesforce's api with the below call
       sforce.opencti.searchAndScreenPop({
         callType: 'inbound',
         callback: (results, err) => {
           if (err) {
             console.log('Error: ' + err);
           } else {
             console.log('Results: ' + results);
           }
         },
         deferred: false,
         queryParams: undefined,
         searchParams: event.phoneNumbers[0].replace(/\D/g, '')
       });

           } catch (error) {
      this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Screen Pop Handler. Error Information : '
        + JSON.stringify(error));
      throw error;
    }
  }

  @bind
  enableClickToDialHandler(clickToDialEnabled: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = response => {
        if (response.success || response.result) {
          this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Click to Dial Enable/Disable Successful. Paramter - Enabled : '
            + clickToDialEnabled);
          resolve();
        } else {
          this.eventService.sendEvent('logError', 'Salesforce - Bridge : ERROR : Click to Dial Enable/Disable. Parameter - Enabled : '
            + clickToDialEnabled + 'Error Info : ' + JSON.stringify(response));
          reject(response.errors || response.error);
        }
      };
      this.eventService.sendEvent('logDebug', 'Salesforce - Bridge : Enabling Click to Dial. Parameter - Enabled : ' + clickToDialEnabled);
      if (clickToDialEnabled) {
        sforce.opencti.enableClickToDial({ callback: callback });
      } else {
        sforce.opencti.disableClickToDial({ callback: callback });
      }
    });
  }

  protected setSoftphoneHeight(heightInPixels: number) {
    return new Promise<void>((resolve, reject) => {
      // Salesforce allows a MAX of 700 pixels height
      const AdjustedheightInPixelsLightning = ((heightInPixels > 650) ? 650 : heightInPixels);
      sforce.opencti.setSoftphonePanelHeight({
        heightPX: AdjustedheightInPixelsLightning + 50,
        callback: response => {
          if (response.errors) {
            this.eventService.sendEvent('logError', 'Salesforce - Bridge: ERROR : Set Softphone Height. Error Information : '
              + JSON.stringify(response));
            reject(response.errors);
          } else {
            resolve();
          }
        }
      });
    });
  }

  protected setSoftphoneWidth(widthInPixels: number) {
    return new Promise<void>((resolve, reject) => {
      if (true) {
      } else {
        sforce.interaction.cti.setSoftphoneWidth(widthInPixels, response => {
          if (response.error) {
            this.eventService.sendEvent('logError', 'Salesforce - Bridge: ERROR : Set Softphone Width. Error Information : '
              + JSON.stringify(response));
            reject(response.error);
          } else {
            resolve();
          }
        });
      }
    });
  }
}

const bridge = new BridgeSalesforce();
