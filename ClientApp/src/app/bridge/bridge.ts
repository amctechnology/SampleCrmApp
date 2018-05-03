import { Bridge } from '@amc/applicationangularframework';
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
    }

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
                    screenpopRecords = await this.trySearchAndScreenpop(phoneNumber, InteractionDirectionTypes.Inbound, event.cadString);
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

    private trySearchAndScreenpop(queryString: string, callDirection: InteractionDirectionTypes, cadString: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.isLightning) {
                const screenPopObject = {
                    callback: result => {
                        resolve(result.returnValue);
                    },
                    searchParams: queryString,
                    queryParams: cadString,
                    deferred: false,
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

                sforce.interaction.searchAndScreenPop(queryString, cadString, salesforceCallDirection, result => {
                    resolve(safeJSONParse(result.result));
                });
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

}

const bridge = new MyBridge();
