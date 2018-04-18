(function (AMCSalesforceBridge) {
    var isSalesforceAPILoaded = false;
    var listenerEventsQueue = [];
    var salesforceAppWindow;


    var lightning_enabled = false;
    var salesforceBridgeAPIMethodNames = {
        SCREEN_POP: "SalesforceBridgeAPIScreenPop",
        SEARCH: "SalesforceBridgeAPISearch",
        CAD_SEARCH: "SalesforceBridgeAPICADSearch",
        CAD_SEARCH_AND_SCREEN_POP: "SalesforceBridgeAPICADSearchAndScreenPop",
        SEARCH_AND_SCREEN_POP: "SalesforceBridgeAPISearchAndScreenPop",
        SET_SP_HT: "SalesforceBridgeAPISET_SP_HT",
        SET_SP_WTH: "SalesforceBridgeAPISET_SP_WTH",
        GET_SP_LAYOUT: "SalesforceBridgeAPIGET_SP_LAYOUT",
        ENB_CLICK_TO_DIAL: "SalesforceBridgeAPIENB_CLICK_TO_DIAL",
        DSB_CLICK_TO_DIAL: "SalesforceBridgeAPIDSB_CLICK_TO_DIAL",
        CLICK_TO_DIAL_EVENT: "SalesforceBridgeAPICLICK_TO_DIAL_EVENT",
        GET_CALL_CENTER_SETTINGS: "SalesforceBridgeAPIGET_CALL_CENTER_SETTINGS",
        GET_PAGE_INFO: "SalesforceBridgeAPIGET_PAGE_INFO",
        ON_FOCUS_EVENT: "SalesforceBridgeAPION_FOCUS_EVENT",
        SAVE_ACTIVITY: "SalesforceBridgeSaveActivity",
        IS_VISIBLE: "SalesforceBridgeIsVisible",
        SET_VISIBLE: "SalesforceBridgeSetVisible",
        USER_INFO: "SalesforceBridgeUSER_INFO",
        LOGS: "SalesforceBridgeLOGS"
    };

    var LogType = {VERBOSE : "Verbose", WARNING : "Warning", ERROR : "Error", INFORMATION : "Information"};

    logMessage(LogType.VERBOSE, "Loading Salesforce Bridge File");

    if (window.addEventListener) {
        window.addEventListener("message", listener, false);
    } else {
        window.attachEvent("onmessage", listener);
    }

    $(document).ready(waitForSalesforceAPIToLoad);
    function waitForSalesforceAPIToLoad() {       
        if (window.sforce && window.sforce.interaction && window.sforce.console && window.sforce.opencti) {
            initialize();
        } else {
            setTimeout(waitForSalesforceAPIToLoad, 200);
        }
    }
    function initialize() {
        VerifyMode();
        if (lightning_enabled) {
            sforce.opencti.onClickToDial({
                listener: clickToDialListener
            });
        } else {
            sforce.interaction.cti.onClickToDial(clickToDialListener);
        }

        if (lightning_enabled) {
            sforce.opencti.onNavigationChange({
                listener: onFocusListener
            });
        } else {
            sforce.interaction.onFocus(onFocusListener);
        }
        isSalesforceAPILoaded = true;
        processListenerQueueEvents();
        logMessage(LogType.VERBOSE,"Salesforce API loaded. Is Lightning Enabled : "+lightning_enabled);
    }

    var salesforcePluginWindow = null;
    var clickToDialListener = function (responseFromSalesForce) {
        logMessage(LogType.INFORMATION, "Received Click to Dial Eventb from Salesforce. Details : "+JSON.stringify(responseFromSalesForce));
        if (salesforcePluginWindow != null) {
            var entity = {};
            var number = "";
            if (lightning_enabled) {
                entity.object = responseFromSalesForce.objectType;
                entity.objectId = responseFromSalesForce.recordId;
                number = responseFromSalesForce.number;
            } else {
                entity = JSON.parse(responseFromSalesForce.result);
                number = entity.number;
            }
            getEntityDetails(entity.object, entity.objectId, function (res) {
                if (res) {
                    var msg = {
                        message: salesforceBridgeAPIMethodNames.CLICK_TO_DIAL_EVENT,
                        operation: salesforceBridgeAPIMethodNames.CLICK_TO_DIAL_EVENT,
                        response: {
                            number: number,
                            records: res
                        },
                    }
                    salesforcePluginWindow.postMessage(JSON.stringify(msg), "*");
                }
            });
        }
    };

    function processListenerQueueEvents()
    {
        for(var i in listenerEventsQueue)
        {
            listener(listenerEventsQueue[i]);
        }
        listenerEventsQueue = [];
    }

    var onFocusListener = function (responseFromSalesForce) {
        logMessage(LogType.INFORMATION, "Received OnFocus Event from Salesforce. Details : "+JSON.stringify(responseFromSalesForce));
        if (salesforcePluginWindow != null) {
            var entity = {};
            if (lightning_enabled) {
                entity.object = responseFromSalesForce.objectType;
                entity.objectId = responseFromSalesForce.recordId;
            } else if (responseFromSalesForce.result) {
                entity = JSON.parse(responseFromSalesForce.result);
            }
            getEntityDetails(entity.object, entity.objectId, function (res) {
                if (res) {
                    var msg = {
                        message: salesforceBridgeAPIMethodNames.ON_FOCUS_EVENT,
                        operation: salesforceBridgeAPIMethodNames.ON_FOCUS_EVENT,
                        response: res,
                    }
                    //window.parent.postMessage(JSON.stringify(msg), "*");
                    salesforcePluginWindow.postMessage(JSON.stringify(msg), "*");
                }
            });
        }
    };

    function logMessage(logType, message)
    {
        var msg = {
            operation: salesforceBridgeAPIMethodNames.LOGS,
            response : {logMessage : message, logType : logType}
        };
        if(salesforceAppWindow)
            salesforceAppWindow.postMessage(JSON.stringify(msg), "*");
    }

    function getEntityDetails(object, objectId, callback) {
        if (!object || !objectId) {
            callback([]);
            return;
        }

        var layoutCallback = function (response) {
            var layout = null;
            if (lightning_enabled) {
                layout = response;
            } else {
                layout = {
                    returnValue: JSON.parse(response.result)
                };
            }
            if (layout && layout.returnValue && layout.returnValue.Inbound && layout.returnValue.Inbound.objects && layout.returnValue.Inbound.objects[object]) {
                var fields = "";
                for (var i = 0; i < layout.returnValue.Inbound.objects[object].length; i++) {
                    fields += layout.returnValue.Inbound.objects[object][i].apiName;
                    if (i < layout.returnValue.Inbound.objects[object].length - 1) {
                        fields += ",";
                    }
                }

                var query = "" +
                    "fields=" + fields +
                    "&SFObject=" + object +
                    "&key=Id" +
                    "&Value=" + objectId;
                var cadCallback = function (response) {
                    if (lightning_enabled) {
                        if (response.returnValue && response.returnValue.runApex) {
                            callback(JSON.parse(response.returnValue.runApex));
                        }
                    } else {
                        callback(JSON.parse(response.result));
                    }
                };
                if (lightning_enabled) {
                    var cadSearchRequest = {}; //apexClass: 'UserInfo', callback: amcOpenCti.getPageInfoCallback };
                    cadSearchRequest.apexClass = 'AMCOpenCTINS.ObjectRetrieval';
                    cadSearchRequest.methodName = 'getObject';
                    cadSearchRequest.methodParams = query;
                    cadSearchRequest.callback = cadCallback;
                    sforce.opencti.runApex(cadSearchRequest);
                } else {
                    sforce.interaction.runApex("AMCOpenCTINS.ObjectRetrieval", "getObject", query, cadCallback);
                }
            }
        };
        if (lightning_enabled) {
            sforce.opencti.getSoftphoneLayout({
                callback: layoutCallback
            });
        } else {
            sforce.interaction.cti.getSoftphoneLayout(layoutCallback);
        }
    }



    function VerifyMode() {
        var fullUrl = document.location.href;
        var tagsarray = fullUrl.split("&");
        for (var itr1 in tagsarray) {
            if (tagsarray[itr1].indexOf("mode") > 0) {
                var splitframeOrigin = tagsarray[itr1].split("=");
                if (splitframeOrigin.length == 2) {
                    if (splitframeOrigin[1] == "Lightning") {
                        lightning_enabled = true;
                    }
                }
            }
        }
    }

    function search(operation, objectId, objectType, cadString, queryString,
        interactionDirection, cadValue, filterKey, objectFields) {
        try {
            var msg = {
                type: popType,
                message: "screenPop",
                objectId: objectId,
                objectType: objectType,
                cadString: cadString,
                filterKey: filterKey,
                cadValue: cadValue,
                queryString: queryString,
                interactionDirection: interactionDirection,
                callMode: callMode,
            }
            window.parent.postMessage(JSON.stringify(msg), "*");
        } catch (err) {
            console.log("Error in search. Exception Details : " + err.message);
        }
    }

    function cadSearch(operation, objectId, objectType, cadString, queryString,
        interactionDirection, cadValue, filterKey, objectFields) {
        try {
            var msg = {
                type: popType,
                message: "screenPop",
                objectId: objectId,
                objectType: objectType,
                cadString: cadString,
                filterKey: filterKey,
                cadValue: cadValue,
                queryString: queryString,
                interactionDirection: interactionDirection,
                callMode: callMode,
            }
            window.parent.postMessage(JSON.stringify(msg), "*");
        } catch (err) {
            console.log("Error in cadSearch. Exception Details : " + err.message);
        }
    }

    function searchAndScreenpop(operation, objectId, objectType, cadString, queryString,
        interactionDirection, cadValue, filterKey, objectFields) {
        try {
            var msg = {
                type: popType,
                message: "screenPop",
                objectId: objectId,
                objectType: objectType,
                cadString: cadString,
                filterKey: filterKey,
                cadValue: cadValue,
                queryString: queryString,
                interactionDirection: interactionDirection,
                callMode: callMode,
            }
            window.parent.postMessage(JSON.stringify(msg), "*");
        } catch (err) {
            console.log("Error in searchAndScreenpop. Exception Details : " + err.message);
        }
    }


    function screenPop(popType, objectId, objectType, cadString, filterKey, cadValue, queryString, interactionDirection, callMode) {
        try {
            console.log("Start : screenPop");
            var msg = {
                type: popType,
                message: "screenPop",
                objectId: objectId,
                objectType: objectType,
                cadString: cadString,
                filterKey: filterKey,
                cadValue: cadValue,
                queryString: queryString,
                interactionDirection: interactionDirection,
                callMode: callMode,
            }
            window.parent.postMessage(JSON.stringify(msg), "*");
            console.log("End : screenPop");
        } catch (err) {
            console.log("Error in screenPop. Exception details: " + err.message);
        }
    }

    var getLoginUserInfo = function (event, parseData) {
        try {
            if (lightning_enabled) {
                var getLoginUserInfo = {};
                getLoginUserInfo.apexClass = 'UserInfo';
                getLoginUserInfo.methodName = 'getUserName';
                getLoginUserInfo.methodParams = '';
                getLoginUserInfo.callback = function (response) { getLoginUserInfoCallback(response, event, parseData) };

                sforce.opencti.runApex(getLoginUserInfo);
            } else {
                sforce.interaction.runApex("UserInfo", "getUserName", "", function (response) { getLoginUserInfoCallback(response, event, parseData) });
            }
        } catch (err) { }
    }

    var getLoginUserInfoCallback = function (response, event, parseData) {
        if (lightning_enabled) {
            if (response.errors) {
                for (var i = 0; i < response.errors.length; i++) {
                    //amcEvents.handleVoiceError("Failed to get UserName Code - " + response.errors[i].code + " : Description: " + response.errors[i].description);
                    console.log("Failed to get UserName Code - " + response.errors[i].code + " : Description: " + response.errors[i].description);
                }

            }
            else {
                if (response.success == true) {
                    //var returnObject = response.returnValue;
                    //_salesforceWorkTop = returnObject.runApex;

                    parseData = {};
                    parseData.response = {};
                    parseData.response.data = {userinfo : response.returnValue.runApex};
                    var msg = {
                        operation: parseData.operation,
                        response: parseData,
                        request: parseData,
                    };
                    event.source.postMessage(JSON.stringify(msg), event.origin);
                    //getCallCenterSettings();
                }
                else {
                    console.log("Failed to get UserName");
                }
            }
        } else {
            if (response.error) {
                console.log("Failed to get UserName - " + response.error);
            } else {
                //_salesforceWorkTop = response.result;

                parseData = {};
                parseData.response = {};
                parseData.response.data = {userinfo : response.result};
                var msg = {
                    operation: parseData.operation,
                    response: parseData,
                    request: parseData,
                };
                event.source.postMessage(JSON.stringify(msg), event.origin);
                //getCallCenterSettings();
            }
        }
    }

    function listener(event) {
        try {
            var options = event.data;
            if (options.indexOf('{"defer') != -1) {
                return;
            }
            var parseData = JSON.parse(options);
            // salesforcePluginWindow = event.source;
            if (parseData != undefined) {
                if (!isSalesforceAPILoaded)
                {
                    listenerEventsQueue.push(event);
                    return;
                }
                if (parseData.operation === salesforceBridgeAPIMethodNames.SCREEN_POP) {
                    salesforcePluginWindow = event.source;
                    var callback = function (response) {
                        if (lightning_enabled) {
                            parseData.response = {};
                            parseData.response.data = {
                                success: response.success,
                                errors: response.errors
                            };
                        } else {
                            parseData.response = {};
                            parseData.response.data = {};
                            parseData.response.data.success = response.result;
                            parseData.response.data.errors = null;
                            if (response.error) {
                                parseData.response.data.errors = [response.error];
                            }
                        }
                        var msg = {
                            operation: parseData.operation,
                            response: parseData
                        };
                        event.source.postMessage(JSON.stringify(msg), event.origin);
                    };

                    if (lightning_enabled) {
                        var screenPopObject = {};
                        screenPopObject.type = sforce.opencti.SCREENPOP_TYPE.SOBJECT;
                        screenPopObject.callback = callback;

                        var params = {
                            recordId: parseData.objectId
                        };
                        screenPopObject.params = params;
                        sforce.opencti.screenPop(screenPopObject);
                    } else {
                        sforce.interaction.screenPop("/" + parseData.objectId, true, callback);
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SEARCH) {
                    salesforcePluginWindow = event.source;
                    if (lightning_enabled) {
                        var screenPopObject = {};

                        screenPopObject.callback = function (response) {
                            response.result = JSON.stringify(response.returnValue);
                            parseData.response = {};
                            parseData.response.data = response;
                            var msg = {
                                operation: parseData.operation,
                                response: parseData
                                // request: parseData,
                            };
                            event.source.postMessage(JSON.stringify(msg), event.origin);
                        };
                        screenPopObject.searchParams = parseData.queryString;
                        screenPopObject.queryParams = parseData.cadString;
                        screenPopObject.deferred = true;

                        if (parseData.interactionDirection.toLowerCase() == 'inbound') {

                            screenPopObject.callType = sforce.opencti.CALL_TYPE.INBOUND;
                        } else if (parseData.interactionDirection.toLowerCase() == 'internal') {

                            screenPopObject.callType = sforce.opencti.CALL_TYPE.INTERNAL;

                        } else if (parseData.interactionDirection.toLowerCase() == 'outbound') {

                            screenPopObject.callType = sforce.opencti.CALL_TYPE.OUTBOUND;
                        }

                        sforce.opencti.searchAndScreenPop(screenPopObject);
                    } else {
                        sforce.interaction.searchAndGetScreenPopUrl(parseData.queryString, parseData.cadString, parseData.interactionDirection, function (response) {
                            parseData.response = {};
                            parseData.response.data = response;
                            var msg = {
                                operation: parseData.operation,
                                response: parseData
                                // request: parseData,
                            };
                            event.source.postMessage(JSON.stringify(msg), event.origin);
                        });

                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SEARCH_AND_SCREEN_POP) {
                    salesforcePluginWindow = event.source;
                    var deferred = typeof parseData.screenpop === 'boolean' ? !parseData.screenpop : false;
                    if (lightning_enabled) {
                        var screenPopObject = {};

                        screenPopObject.callback = function (response) {
                            response.result = JSON.stringify(response.returnValue);
                            parseData.response = {};
                            parseData.response.data = response;
                            var msg = {
                                operation: parseData.operation,
                                response: parseData
                                // request: parseData,
                            };
                            event.source.postMessage(JSON.stringify(msg), event.origin);
                        };
                        screenPopObject.searchParams = parseData.queryString;
                        screenPopObject.queryParams = parseData.cadString;
                        screenPopObject.deferred = deferred;

                        if (parseData.interactionDirection.toLowerCase() == 'inbound') {

                            screenPopObject.callType = sforce.opencti.CALL_TYPE.INBOUND;
                        } else if (parseData.interactionDirection.toLowerCase() == 'internal') {

                            screenPopObject.callType = sforce.opencti.CALL_TYPE.INTERNAL;

                        } else if (parseData.interactionDirection.toLowerCase() == 'outbound') {

                            screenPopObject.callType = sforce.opencti.CALL_TYPE.OUTBOUND;
                        }

                        sforce.opencti.searchAndScreenPop(screenPopObject);
                    } else {
                        if (deferred) {
                            sforce.interaction.searchAndGetScreenPopUrl(parseData.queryString, parseData.cadString, parseData.interactionDirection, function (response) {
                                parseData.response = {};
                                parseData.response.data = response;
                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData
                                    //request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            }); //queryString, callType, cadString
                        } else {
                            sforce.interaction.searchAndScreenPop(parseData.queryString, parseData.cadString, parseData.interactionDirection, function (response) {
                                parseData.response = {};
                                parseData.response.data = response;
                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData
                                    //request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            }); //queryString, callType, cadString
                        }
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.CAD_SEARCH) {
                    salesforcePluginWindow = event.source;
                    var query = "" +
                        "fields=" + parseData.objectFields +
                        "&SFObject=" + parseData.objectType +
                        "&key=" + parseData.filterKey +
                        "&Value=" + parseData.cadValue;
                    if (lightning_enabled) {
                        var cadSearchRequest = {}; //apexClass: 'UserInfo', callback: amcOpenCti.getPageInfoCallback };
                        cadSearchRequest.apexClass = 'AMCOpenCTINS.ObjectRetrieval';
                        cadSearchRequest.methodName = 'getObject';
                        cadSearchRequest.methodParams = query;
                        cadSearchRequest.callback = function (response) {
                            if (response.returnValue) {
                                response.result = response.returnValue.runApex;
                            } else {
                                response.response = [];
                            }
                            parseData.response = {};
                            parseData.response.data = response;
                            var msg = {
                                operation: parseData.operation,
                                response: parseData
                                //request: parseData,
                            };
                            event.source.postMessage(JSON.stringify(msg), event.origin);
                        };

                        sforce.opencti.runApex(cadSearchRequest);
                    } else {
                        sforce.interaction.runApex("AMCOpenCTINS.ObjectRetrieval", "getObject", query, function (response) {
                            parseData.response = {};
                            parseData.response.data = response;
                            var msg = {
                                operation: parseData.operation,
                                response: parseData
                                // request: parseData,
                            };
                            event.source.postMessage(JSON.stringify(msg), event.origin);
                        });
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.CAD_SEARCH_AND_SCREEN_POP) {
                    salesforcePluginWindow = event.source;

                    var callback = function (res) {
                        var results = null;
                        if(lightning_enabled){
                            result = JSON.parse(res.returnValue.runApex);
                        }else{
                            result = JSON.parse(res.result);
                        }

                        if (result.length > 0) {
                            if (lightning_enabled) {
                                var screenPopObject = {};
                                screenPopObject.type = sforce.opencti.SCREENPOP_TYPE.SOBJECT;
                                screenPopObject.callback = null;

                                var params = {
                                    recordId: result[0].Id
                                };
                                screenPopObject.params = params;
                                sforce.opencti.screenPop(screenPopObject);
                            } else {
                                sforce.interaction.screenPop("/" + result[0].Id, true, null);
                            }
                        } else {
                            if (lightning_enabled) {
                                var screenPopObject = {};
                                screenPopObject.searchParams = parseData.cadValue;
                                screenPopObject.queryParams = "";
                                screenPopObject.deferred = false;
                                screenPopObject.callType = sforce.opencti.CALL_TYPE.INBOUND;
                                sforce.opencti.searchAndScreenPop(screenPopObject);
                            } else {
                                sforce.interaction.searchAndScreenPop(parseData.cadValue, "", 'Inbound', null);
                            }
                        }
                    };

                    var query = "" +
                        "fields=id"  +
                        "&SFObject=" + parseData.objectType +
                        "&key=" + parseData.filterKey +
                        "&Value=" + parseData.cadValue;
                    if (lightning_enabled) {
                        
                        var cadSearchRequest = {}; //apexClass: 'UserInfo', callback: amcOpenCti.getPageInfoCallback };
                        cadSearchRequest.apexClass = 'AMCOpenCTINS.ObjectRetrieval';
                        cadSearchRequest.methodName = 'getObject';
                        cadSearchRequest.methodParams = query;
                        cadSearchRequest.callback = callback;
                        sforce.opencti.runApex(cadSearchRequest);
                    } else {
                        sforce.interaction.runApex("AMCOpenCTINS.ObjectRetrieval", "getObject", query, callback);
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.ENB_CLICK_TO_DIAL) {
                    salesforcePluginWindow = event.source;
                    if (lightning_enabled) {
                        sforce.opencti.enableClickToDial({
                            callback: function (response) {
                                parseData.response = {};
                                parseData.response.data = {
                                    success: response.success,
                                    errors: null
                                };
                                if (response.errors) {
                                    parseData.response.data.errors = [];
                                    for (var i in response.errors) {
                                        parseData.response.data.errors.push(response.errors[i].description);
                                    }
                                }
                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData,
                                    request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            }
                        });
                    } else {
                        sforce.interaction.cti.enableClickToDial(function (response) {
                            parseData.response = {};
                            parseData.response.data = {
                                success: response.result,
                                errors: null
                            };
                            if (response.error) {
                                parseData.response.data.errors = [response.error];
                            }

                            var msg = {
                                operation: parseData.operation,
                                response: parseData,
                                request: parseData,
                            };
                            event.source.postMessage(JSON.stringify(msg), event.origin);
                        }); //queryString, callType, cadString
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.DSB_CLICK_TO_DIAL) {
                    salesforcePluginWindow = event.source;
                    if (lightning_enabled) {
                        sforce.opencti.disableClickToDial({
                            callback: function (response) {
                                parseData.response = {};
                                parseData.response.data = {
                                    success: response.success,
                                    errors: null
                                };
                                if (response.errors) {
                                    parseData.response.data.errors = [];
                                    for (var i in response.errors) {
                                        parseData.response.data.errors.push(response.errors[i].description);
                                    }
                                }
                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData,
                                    request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            }
                        });
                    } else {
                        sforce.interaction.cti.disableClickToDial(function (response) {
                            parseData.response = {};
                            parseData.response.data = {
                                success: response.result,
                                errors: null
                            };
                            if (response.error) {
                                parseData.response.data.errors = [response.error];
                            }

                            var msg = {
                                operation: parseData.operation,
                                response: parseData,
                                request: parseData,
                            };
                            event.source.postMessage(JSON.stringify(msg), event.origin);
                        }); //queryString, callType, cadString
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SET_SP_HT) {
                    salesforcePluginWindow = event.source;
                    if (parseData.request.data.height) {
                        if (lightning_enabled) {
                            var setSoftphoneHeightObject = {};
                            setSoftphoneHeightObject.heightPX = parseData.request.data.height;
                            setSoftphoneHeightObject.callback = function (response) {
                                parseData.response = {};
                                parseData.response.data = {
                                    success: response.success,
                                    errors: null
                                };
                                if (response.errors) {
                                    parseData.response.data.errors = [];
                                    for (var i in response.errors) {
                                        parseData.response.data.errors.push(response.errors[i].description);
                                    }
                                }
                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData,
                                    request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            };
                            sforce.opencti.setSoftphonePanelHeight(setSoftphoneHeightObject);
                        } else {
                            sforce.interaction.cti.setSoftphoneHeight(parseData.request.data.height, function (response) {
                                parseData.response = {};
                                parseData.response.data = {
                                    success: response.result,
                                    errors: null
                                };
                                if (response.error) {
                                    parseData.response.data.errors = [response.error];
                                }

                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData,
                                    request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            }); //queryString, callType, cadString
                        }
                    } else {
                        parseData.response = {};
                        parseData.response.data = {
                            success: false,
                            errors: ["No height parameter passed!"]
                        };
                        var msg = {
                            operation: parseData.operation,
                            response: parseData,
                            request: parseData,
                        };
                        event.source.postMessage(JSON.stringify(msg), event.origin);
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SET_SP_WTH) {
                    salesforcePluginWindow = event.source;
                    if (parseData.request.data.width) {
                        if (lightning_enabled) {
                            var setSoftphoneWidthObject = {};
                            setSoftphoneWidthObject.widthPX = parseData.request.data.width;
                            setSoftphoneWidthObject.callback = function (response) {
                                parseData.response = {};
                                parseData.response.data = {
                                    success: response.success,
                                    errors: null
                                };
                                if (response.errors) {
                                    parseData.response.data.errors = [];
                                    for (var i in response.errors) {
                                        parseData.response.data.errors.push(response.errors[i].description);
                                    }
                                }

                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData,
                                    request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            };
                            sforce.opencti.setSoftphonePanelWidth(setSoftphoneWidthObject);
                        } else {
                            sforce.interaction.cti.setSoftphoneWidth(parseData.request.data.width, function (response) {
                                parseData.response = {};
                                parseData.response.data = {
                                    success: response.result,
                                    errors: null
                                };
                                if (response.error) {
                                    parseData.response.data.errors = [response.error];
                                }

                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData,
                                    request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            }); //queryString, callType, cadString
                        }
                    } else {
                        parseData.response = {};
                        parseData.response.data = {
                            success: false,
                            errors: ["No width parameter passed!"]
                        };
                        var msg = {
                            operation: parseData.operation,
                            response: parseData,
                            request: parseData,
                        };
                        event.source.postMessage(JSON.stringify(msg), event.origin);
                    }

                } else if (parseData.operation === salesforceBridgeAPIMethodNames.GET_SP_LAYOUT) {
                    salesforcePluginWindow = event.source;
                    if (lightning_enabled) {
                        sforce.opencti.getSoftphoneLayout({
                            callback: function (response) {
                                parseData.response = {};
                                parseData.response.data = response;
                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData,
                                    request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            }
                        });
                    } else {
                        sforce.interaction.cti.getSoftphoneLayout(function (response) {
                            parseData.response = {};
                            parseData.response.data = {
                                returnValue: JSON.parse(response.result)
                            };
                            var msg = {
                                operation: parseData.operation,
                                response: parseData,
                                request: parseData,
                            };
                            event.source.postMessage(JSON.stringify(msg), event.origin);
                        }); //queryString, callType, cadString
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.GET_CALL_CENTER_SETTINGS) {
                    salesforcePluginWindow = event.source;
                    if (lightning_enabled) {
                        sforce.opencti.getCallCenterSettings({
                            callback: function (response) {
                                parseData.response = {};
                                parseData.response.data = response;
                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData,
                                    // request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            }
                        });
                    } else {
                        sforce.interaction.cti.getCallCenterSettings(function (response) {
                            parseData.response = {};
                            parseData.response.data = {
                                returnValue: JSON.parse(response.result)
                            };
                            var msg = {
                                operation: parseData.operation,
                                response: parseData,
                                // request: parseData,
                            };
                            event.source.postMessage(JSON.stringify(msg), event.origin);
                        }); //queryString, callType, cadString
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.GET_PAGE_INFO) {
                    salesforcePluginWindow = event.source;
                    var pageInfoCallback = function (response) {
                        var entity = {};
                        var url = "";
                        if (lightning_enabled) {
                            entity.object = response.returnValue.objectType;
                            entity.objectId = response.returnValue.recordId;
                        } else if (response.result) {
                            entity = JSON.parse(response.result);
                            url = entity.url;
                        }
                        getEntityDetails(entity.object, entity.objectId, function (res) {
                            if (res) {
                                parseData.response = {};
                                parseData.response.data = {
                                    url: url,
                                    records: res
                                };
                                var msg = {
                                    operation: parseData.operation,
                                    response: parseData,
                                    // request: parseData,
                                };
                                event.source.postMessage(JSON.stringify(msg), event.origin);
                            }
                        });
                    };
                    if (lightning_enabled) {
                        sforce.opencti.getAppViewInfo({
                            callback: pageInfoCallback
                        });
                    } else {
                        sforce.interaction.getPageInfo(pageInfoCallback); //queryString, callType, cadString
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SAVE_ACTIVITY) {
                    var objectType = parseData.objectType;
                    var params = parseData.params || {}; //FieldName: FieldValue; Note that the Id of the entity will be here if passed
                    var callback = function (response) {
                        var success = false;
                        var entity = null;
                        var errors = null;
                        if (lightning_enabled) {
                            success = response.success;
                            if (response.errors) {
                                errors = [];
                                for (var i in response.errors) {
                                    errors.push(response.errors[i].description);
                                }
                            }
                            if (success && response.returnValue && response.returnValue.recordId) {
                                entity = {
                                    Id: response.returnValue.recordId,
                                    Type: objectType
                                };
                            }
                        } else {
                            if (response.error) {
                                success = false;
                                errors = [response.error];
                            } else {
                                success = true;
                                entity = {
                                    Id: response.result,
                                    Type: objectType
                                };
                            }
                        }
                        parseData.response = {};
                        parseData.response.data = {
                            success: success,
                            entity: entity,
                            errors: errors
                        };
                        var msg = {
                            operation: parseData.operation,
                            response: parseData,
                            request: parseData,
                        };
                        event.source.postMessage(JSON.stringify(msg), event.origin);
                    };
                    if (lightning_enabled) {
                        var request = parseData.params;
                        request.entityApiName = objectType;
                        sforce.opencti.saveLog({
                            value: request,
                            callback: callback
                        });
                    } else {
                        var paramString = "";
                        for (var key in params) {
                            if (params[key]) {
                                paramString += "&" + key + "=" + params[key];
                            }
                        }
                        paramString.slice(1); //remove leading '&'

                        sforce.interaction.saveLog(objectType, paramString, callback);
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.IS_VISIBLE) {
                    var callback = function (response) {
                        var visible = null;
                        var success = false;
                        var errors = null;
                        if (lightning_enabled) {
                            success = response.success;
                            if (response.errors) {
                                errors = [];
                                for (var i in response.errors) {
                                    errors.push(response.errors[i].description);
                                }
                            }
                            if (success) {
                                visible = response.returnValue.visible;
                            }
                        } else {
                            if (response.error) {
                                success = false;
                                errors = [response.error];
                            } else {
                                success = true;
                                visible = response.result;
                            }
                        }
                        parseData.response = {};
                        parseData.response.data = {
                            success: success,
                            visible: visible,
                            errors: errors
                        };
                        var msg = {
                            operation: parseData.operation,
                            response: parseData,
                            request: parseData,
                        };
                        event.source.postMessage(JSON.stringify(msg), event.origin);
                    };

                    if (lightning_enabled) {
                        sforce.opencti.isSoftphonePanelVisible({
                            callback: callback
                        });
                    } else {
                        sforce.interaction.isVisible(callback);
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.SET_VISIBLE) {
                    var callback = function (response) {
                        var success = false;
                        var errors = null;
                        if (lightning_enabled) {
                            success = response.success;
                            if (response.errors) {
                                errors = [];
                                for (var i in response.errors) {
                                    errors.push(response.errors[i].description);
                                }
                            }
                        } else {
                            if (response.error) {
                                success = false;
                                errors = [response.error];
                            } else {
                                success = true;
                            }
                        }
                        parseData.response = {};
                        parseData.response.data = {
                            success: success,
                            errors: errors
                        };
                        var msg = {
                            operation: parseData.operation,
                            response: parseData,
                            request: parseData,
                        };
                        event.source.postMessage(JSON.stringify(msg), event.origin);
                    };

                    if (lightning_enabled) {
                        sforce.opencti.setSoftphonePanelVisibility({
                            visible: parseData.request.data.visible,
                            callback: callback
                        });
                    } else {
                        sforce.interaction.setVisible(parseData.request.data.visible, callback);
                    }
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.USER_INFO) {
                    getLoginUserInfo(event, parseData);
                } else if (parseData.operation === salesforceBridgeAPIMethodNames.LOGS) {
                    salesforceAppWindow = event.source;
                }
            }
        } catch (err) {
            console.log("Error in listener. Exception details: " + err.message);
        }
    }
}(window.AMCSalesforceBridge = window.AMCSalesforceBridge || {}));