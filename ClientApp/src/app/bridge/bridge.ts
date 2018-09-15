import { Bridge, BridgeEventsService } from '@amc/applicationangularframework';
import { InteractionDirectionTypes } from '@amc/application-api';
import { bind } from 'bind-decorator';
import { safeJSONParse } from '../utils';
import { Subject } from 'rxjs/Subject';
import { OnInit } from '@angular/core';
import { IActivity } from './../Model/IActivity';
import { IActivityDetails } from './../Model/IActivityDetails';
import { IParams } from './../Model/IParams';

declare var sforce: any;

class SalesforceBridge extends Bridge {
  private isLightning = false;
  private currentEvent: any;
  activity: IActivity = null;


  constructor() {
    super();
    this.currentEvent = null;
    this.appName = 'Salesforce';
    this.VerifyMode();
    this.initialize();
    this.eventService.subscribe('getUserInfo', this.getUserInfo);
    this.eventService.subscribe('getSearchLayout', this.getSearchLayout);
    this.eventService.subscribe('isToolbarVisible', this.isToolbarVisible);
    // subscribe for activities to be saved
    this.eventService.subscribe('saveActivity', this.saveActivity);
    // create new entity
    this.eventService.subscribe('createNewEntity', this.createNewEntity);


  }

  async afterScriptsLoad(): Promise<any> {
    await super.afterScriptsLoad();
    if (this.isLightning) {
      sforce.opencti.onClickToDial({ listener: this.clickToDialListener });
      sforce.opencti.onNavigationChange({ listener: this.onFocusListener });
    } else {
      sforce.interaction.cti.onClickToDial(this.clickToDialListener);
      sforce.interaction.onFocus(this.onFocusListener);
    }
  }

  @bind
  isToolbarVisible() {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        sforce.opencti.isSoftphonePanelVisible({
          callback: response => {
            if (response.errors) {
              reject(response.errors);
            } else {
              resolve(response.returnValue.visible);
            }
          }
        });
      } else {
        sforce.interaction.isVisible(response => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response.result);
          }
        });
      }
    });
  }

  @bind
  getSearchLayout() {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        sforce.opencti.getSoftphoneLayout({
          callback: response => resolve(response.returnValue)
        });
      } else {
        sforce.interaction.cti.getSoftphoneLayout(response => resolve(safeJSONParse(response.result)));
      }
    });
  }
// Use for registering changes on screen within CRM
  @bind
  async onFocusListener(event) {
    if ( event !== this.currentEvent) {
      this.currentEvent = event;

    const entity = {
      objectType: '',
      displayName: '',
      objectName: '',
      objectId: '',
      url: ''
    };
    if (this.isLightning) {
      entity.objectType = event.objectType;
      entity.displayName = event.objectType;
      entity.objectId = event.recordId;
      entity.objectName = event.recordName;
      entity.url = event.url;
      if ( entity.objectId === '') {
        return 1;
      }
    } else {
      const temp = JSON.parse(event.result);
      entity.objectType = temp.object;
      entity.displayName = temp.displayName;
      entity.objectId = temp.objectId;
      entity.objectName = temp.objectName;
      entity.url = temp.url;
      if ( entity.objectId === '') {
        return 1;
      }
    }
    entity.objectName = this.parseWhat(entity);
    this.eventService.sendEvent('setActivityDetails', entity);
    }
  }

  protected parseWhat(entity): string {
    if (entity.objectType === 'Case') {
      return 'Case ' + entity.objectName;
    }
    return entity.objectName;
  }

  @bind
  async clickToDialListener(event) {
    let entity = {
      object: '',
      objectId: '',
      number: ''
    };
    if (this.isLightning) {
      entity.object = event.objectType;
      entity.objectId = event.recordId;
      entity.number = event.number;
    } else {
      entity = JSON.parse(event.result);
    }

    const records = await this.trySearch(entity.number, InteractionDirectionTypes.Outbound, '', false);
    this.eventService.sendEvent('clickToDial', {
      number: entity.number,
      records: records
    });
  }

  @bind
  async getUserInfo() {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        sforce.opencti.runApex({
          apexClass: 'UserInfo',
          methodName: 'getUserName',
          methodParams: '',
          callback: result => {
            resolve(result.returnValue.runApex);
          }
        });
      } else {
        sforce.interaction.runApex(
          'UserInfo',
          'getUserName',
          '',
          result => {
            resolve(result.result);
          }
        );
      }
    });
  }

  @bind
  async screenpopHandler(event): Promise<any> {
    this.eventService.sendEvent('logVerbose', 'screenpopHandler START: ' + event);
    try {
      let screenpopRecords = null;
      if (event.id && event.type) {
        screenpopRecords = await this.tryScreenpop(event.id);
      }
      if (screenpopRecords == null && event.phoneNumbers.length > 0) {
        screenpopRecords = await this.trySearch(event.phoneNumbers[0], InteractionDirectionTypes.Inbound, event.cadString);
      }
      return screenpopRecords;
    } catch (e) {
      this.eventService.sendEvent('logError', 'screenpopHandler ERROR=' + e);
      throw e;
    }
  }

  private tryScreenpop(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        const screenPopObject = {
          type: sforce.opencti.SCREENPOP_TYPE.SOBJECT,
          callback: result => {
            resolve(result.returnValue);
          },
          params: {
            recordId: id
          }
        };
        sforce.opencti.screenPop(screenPopObject);
      } else {
        sforce.interaction.screenPop('/' + id, true, result => {
          resolve(safeJSONParse(result.result));
        });
      }
    });
  }

  private trySearch(queryString: string, callDirection: InteractionDirectionTypes, cadString: string, shouldScreenpop: boolean = true)
    : Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isLightning) {
        const screenPopObject = {
          callback: result => {
            resolve(result.returnValue);
          },
          searchParams: queryString,
          queryParams: cadString,
          deferred: !shouldScreenpop,
          callType: null
        };

        switch (callDirection) {
          case InteractionDirectionTypes.Inbound:
            screenPopObject.callType = sforce.opencti.CALL_TYPE.INBOUND;
            break;
          case InteractionDirectionTypes.Outbound:
            screenPopObject.callType = sforce.opencti.CALL_TYPE.OUTBOUND;
            break;
          case InteractionDirectionTypes.Internal:
            screenPopObject.callType = sforce.opencti.CALL_TYPE.INTERNAL;
            break;
        }
        sforce.opencti.searchAndScreenPop(screenPopObject);
      } else {
        let salesforceCallDirection = '';
        switch (callDirection) {
          case InteractionDirectionTypes.Inbound:
            salesforceCallDirection = 'inbound';
            break;
          case InteractionDirectionTypes.Outbound:
            salesforceCallDirection = 'outbound';
            break;
          case InteractionDirectionTypes.Internal:
            salesforceCallDirection = 'internal';
            break;
        }

        const callback = result => {
          resolve(safeJSONParse(result.result));
        };
        if (shouldScreenpop) {
          sforce.interaction.searchAndScreenPop(queryString, cadString, salesforceCallDirection, callback);
        } else {
          sforce.interaction.searchAndGetScreenPopUrl(queryString, cadString, salesforceCallDirection, callback);
        }
      }
    });
  }
  callback(response) {
    if (response.success) {
       console.log('API method call executed successfully! returnValue:', response.returnValue);
    } else {
       console.error('Something went wrong! Errors:', response.errors);
    }
   }
  private VerifyMode() {
    const fullUrl = document.location.href;
    const parameters = fullUrl.split('&');
    for (const itr1 in parameters) {
      if (parameters[itr1].indexOf('mode') >= 0) {
        const parameter = parameters[itr1].split('=');
        if (parameter.length === 2) {
          if (parameter[1] === 'Lightning') {
            this.isLightning = true;
          }
        }
      }
    }
  }

  @bind
  enableClickToDialHandler(clickToDialEnabled: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = result => {
        if (result.success || result.result) {
          resolve();
        } else {
          reject(result.errors || result.error);
        }
      };
      if (this.isLightning) {
        if (clickToDialEnabled) {
          sforce.opencti.enableClickToDial({ callback: callback });
        } else {
          sforce.opencti.disableClickToDial({ callback: callback });
        }
      } else {
        if (clickToDialEnabled) {
          sforce.interaction.cti.enableClickToDial(callback);
        } else {
          sforce.interaction.cti.disableClickToDial(callback);
        }
      }
    });
  }

  protected setSoftphoneHeight(heightInPixels: number) {
    return new Promise<void>((resolve, reject) => {
      if (this.isLightning) {
        sforce.opencti.setSoftphonePanelHeight({
          heightPX: heightInPixels,
          callback: response => {
            if (response.errors) {
              reject(response.errors);
            } else {
              resolve();
            }
          }
        });
      } else {
        sforce.interaction.cti.setSoftphoneHeight(heightInPixels, response => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve();
          }
        });
      }
    });
  }

  protected setSoftphoneWidth(widthInPixels: number) {
    return new Promise<void>((resolve, reject) => {
      if (this.isLightning) {
        sforce.opencti.setSoftphonePanelWidth({
          widthPX: widthInPixels,
          callback: response => {
            if (response.errors) {
              reject(response.errors);
            } else {
              resolve();
            }
          }
        });
      } else {
        sforce.interaction.cti.setSoftphoneWidth(widthInPixels, response => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve();
          }
        });
      }
    });
  }
  @bind
  protected saveActivity(activity: IActivity): Promise<any> {
    if (this.isLightning) {
      return new Promise((resolve, reject) => {
        const activityObject: object = {
          value: {
            entityApiName: 'Task',
            WhoId: activity.WhoObject.objectId,
            WhatId: activity.WhatObject.objectId,
            CallType: activity.CallType,
            CallDurationInSeconds: activity.CallDurationInSeconds,
            Subject: activity.Subject,
            Description: activity.Description,
            Status: activity.Status,
            ActivityDate: activity.ActivityDate
          },
          callback: result => {
            try {
              activity.ActivityId = result.returnValue.recordId;
            } catch (e) {
              console.log('Save could not complete: ' + JSON.stringify(result.errors['0'].details.fieldErrors));
            }
            resolve(this.eventService.sendEvent('saveActivityResponse', activity));
          }
        };
        if (activity.ActivityId) {
          activityObject['value']['Id'] = activity.ActivityId;
        }
        sforce.opencti.saveLog(activityObject);
      });
    }
    return new Promise((resolve, reject) => {
      let activityString = '';
      activityString = 'WhoId=' + activity.WhoObject.objectId + '&WhatId=' + activity.WhatObject.objectId + '&CallType=' +
      activity.CallType + '&CallDurationInSeconds=' + activity.CallDurationInSeconds + '&Subject=' +
      activity.Subject + '&Description=' + activity.Description + '&Status=' + activity.Status +
      '&ActivityDate=' + activity.ActivityDate;
      if (activity.ActivityId) {
        activityString = activityString + '&Id=' + activity.ActivityId;
      }
      sforce.interaction.saveLog('Task', activityString, result => {
        activity.ActivityId = result.result;
        console.log('Activity ID = ' + result.result);
        resolve(this.eventService.sendEvent('saveActivityResponse', activity));
      });
    });
  }
  @bind
  protected createNewEntity(params: IParams) {
    let URL = '';
    if (this.isLightning) {
      const screenPopObject: IScreenPopObject = {
        type: sforce.opencti.SCREENPOP_TYPE.NEW_RECORD_MODAL,
        params: {
          entityName: params.entityName
        },
        callback: result => {
          console.log(result);
        }
      };
      if (params.entityName === 'Case') {
        screenPopObject.params.defaultFieldValues = params.caseFields;
      } else if ( params.entityName === 'Opportunity') {
        screenPopObject.params.defaultFieldValues = params.opportunityFields;
      }
      sforce.opencti.screenPop(screenPopObject);
    } else {
    if (params.entityName === 'Case') {
    } else if (params.entityName === 'Lead') {
      URL = '/00Q/e';
    } else if (params.entityName === 'Account') {
        URL = '/001/e';
    } else if (params.entityName === 'Contact') {
        URL = '/003/e';
    }
    sforce.interaction.screenPop(URL, true, function(result)  {
      console.log(result);
    });
  }

  }



}

const bridge = new SalesforceBridge();

interface IScreenPopObject {
  type: string;
  params: {
          entityName: string;
          defaultFieldValues?: Object;
        };
  callback: any;
}

