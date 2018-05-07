import { Bridge, BridgeEventsService } from '@amc/applicationangularframework';
import { InteractionDirectionTypes } from '@amc/application-api';
import { bind } from 'bind-decorator';
import { safeJSONParse } from '../utils';

declare var sforce: any;

class MyBridge extends Bridge {
    private isLightning = false;

    constructor() {
        super();
        this.appName = 'Salesforce';
        this.VerifyMode();
        this.initialize();
        this.eventService.subscribe('getUserInfo', this.getUserInfo);
    }

    async afterScriptsLoad(): Promise<any> {
        await super.afterScriptsLoad();
        if (this.isLightning) {
            sforce.opencti.onClickToDial({listener: this.clickToDialListener});
            sforce.opencti.onNavigationChange({listener: this.onFocusListener});
        } else {
            sforce.interaction.cti.onClickToDial(this.clickToDialListener);
            sforce.interaction.onFocus(this.onFocusListener);
        }
    }

    @bind
    async onFocusListener(event) {
        let id = '';
        const entity = {
            object: '',
            displayName: '',
            Name: ''
        };
        if (this.isLightning) {
            entity.object = event.objectType;
            entity.displayName = event.objectType;
            id = event.recordId;
            entity.Name = event.recordName;
        } else {
            const temp = JSON.parse(event.result);
            entity.object = temp.object;
            entity.displayName = temp.displayName;
            id = temp.objectId;
            entity.Name = temp.objectName;
        }

        this.eventService.sendEvent('onFocus', {[id]: entity});
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

    // TODO: finish implementing this. CAD search
    @bind
    async screenpopHandler(event): Promise<any> {
        this.eventService.sendEvent('logVerbose', 'screenpopHandler START: ' + event);
        try {
            let screenpopRecords = null;
            if (event.id && event.type) {
                screenpopRecords = await this.tryScreenpop(event.id);
            }
            // if (screenpopRecords == null && event.cadFields.length > 0) {
            //     for (const i of event.cadFields) {
            //         screenpopRecords = await this.tryCadSearch(event.cadFields[0].entity, event.cadFields[0].value, event.cadFields[0].field);
            //         if (screenpopRecords != null) { break; }
            //     }
            // }
            if (screenpopRecords == null && event.phoneNumbers.length > 0) {
                for (const phoneNumber of event.phoneNumbers) {
                    // TODO: update this so that interaction direction is more flexible
                    screenpopRecords = await this.trySearch(phoneNumber, InteractionDirectionTypes.Inbound, event.cadString);
                    if (screenpopRecords != null) { break; }
                }
            }
            // // If we could not screenpop then preform a searchAndScreenpop to open a new page
            // if (screenpopRecords == null) {
            //     screenpopRecords = await this.trySearchAndScreenpop('-1234567890', 'Inbound', '');
            // }
            // this.eventService.sendEvent('logVerbose', 'screenpopHandler END. records=' + screenpopRecords);

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

}

const bridge = new MyBridge();
