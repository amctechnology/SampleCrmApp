using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SalesforceCloudCore.Models;

namespace SalesforceCloudCore.Controllers {
    [AllowAnonymous]
    public class IncomingRoutingController : Controller {
        private AppRoutingConfig appRoutingConfig;
        private static HttpClient httpClient;
        public IncomingRoutingController (AppRoutingConfig appRoutingConfig) {
            httpClient = new HttpClient ();
            this.appRoutingConfig = appRoutingConfig;
        }

        [HttpPost]
        public async Task<IActionResult> Index ([FromBody] PushTopic PushTopic) {
            try {
                HttpContent HttpContent = null;
                AuthenticationResponse AuthenticationResponse = await this.Authenticate (PushTopic);
                if (AuthenticationResponse.access_token == null) {
                    return StatusCode (401, "Authentication with Salesforce failed!");
                } else {
                    Payload Payload = new Payload ();
                    Payload.config = new RoutingConfig (PushTopic.Config.appId, PushTopic.Config.davinciAccountId, PushTopic.Config.davinciProfileId, PushTopic.Config.davinciUsername, PushTopic.Config.davinciPassword);
                    if (PushTopic.EventType == "presence") {
                        SalesforceObjects.Presence Presence = JsonConvert.DeserializeObject<SalesforceObjects.Presence> (JsonConvert.SerializeObject (PushTopic.SObject));
                        SalesforceObjects.ServicePresenceStatus ServicePresenceStatus = await this.RetrievePresenceName (AuthenticationResponse, Presence);
                        Dictionary<string, object> User = await this.RetrieveUser (AuthenticationResponse, Presence);
                        Payload.presence = new Presence (ServicePresenceStatus.MasterLabel, User["Name"].ToString (), Presence.UserId);
                        string Content = JsonConvert.SerializeObject (Payload);
                        HttpContent = new StringContent (Content, Encoding.UTF8, "application/json");
                    } else if (PushTopic.EventType == "pending_service_routing") {
                        SalesforceObjects.PendingServiceRouting PendingServiceRouting = JsonConvert.DeserializeObject<SalesforceObjects.PendingServiceRouting> (JsonConvert.SerializeObject (PushTopic.SObject));
                        string SObjectPrefix = PendingServiceRouting.WorkItemId.Substring (0, 3);
                        Dictionary<string, string> PrefixList = await this.RetrieveSObjects (AuthenticationResponse);
                        string SObjectType = PrefixList.Where (Prefix => Prefix.Key == SObjectPrefix).FirstOrDefault ().Value;
                        WorkItem WorkItem = new WorkItem (PendingServiceRouting.WorkItemId, SObjectType);
                        PendingWork PendingWork = new PendingWork (PendingServiceRouting.Id, PendingServiceRouting.CreatedDate.ToString (), PendingServiceRouting.LastModifiedDate.ToString (), "create", WorkItem);
                        Payload.pendingWork = PendingWork;
                        string Content = JsonConvert.SerializeObject (Payload);
                        HttpContent = new StringContent (Content, Encoding.UTF8, "application/json");
                    } else if (PushTopic.EventType == "agent_work") {

                    }
                    var response = httpClient.PostAsync (appRoutingConfig.cloudRoutingUri, HttpContent);
                }
            } catch (Exception ex) {
                return StatusCode (500, ex.Message);
            }
            return Ok ();
        }
        public async Task<AuthenticationResponse> Authenticate (PushTopic PushTopic) {
            try {
                HttpRequestMessage Authenticate =
                    new HttpRequestMessage (HttpMethod.Post, "https://login.salesforce.com/services/oauth2/token");
                var AuthString = "grant_type=password&client_id=" + PushTopic.Config.ClientId + "&client_secret=" + PushTopic.Config.ClientSecret + "&username=" + PushTopic.Config.ClientUsername + "&password=" + PushTopic.Config.ClientAuth;
                var httpContent = new StringContent (AuthString, Encoding.UTF8, "application/x-www-form-urlencoded");
                Authenticate.Content = httpContent;
                HttpResponseMessage AuthenticateResponse =
                    await httpClient.SendAsync (Authenticate);
                AuthenticationResponse Auth = JsonConvert.DeserializeObject<AuthenticationResponse> (
                    await AuthenticateResponse.Content.ReadAsStringAsync ());
                return Auth;
            } catch (Exception ex) {
                throw ex;
            }
        }
        public async Task<SalesforceObjects.ServicePresenceStatus> RetrievePresenceName (AuthenticationResponse Auth, SalesforceObjects.Presence presence) {
            try {
                HttpRequestMessage RetrievePresenceName =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/ServicePresenceStatus/" + presence.ServicePresenceStatusId);
                RetrievePresenceName.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrievePresenceNameResponse =
                    await httpClient.SendAsync (RetrievePresenceName);
                SalesforceObjects.ServicePresenceStatus ServicePresenceStatus = JsonConvert.DeserializeObject<SalesforceObjects.ServicePresenceStatus> (
                    await RetrievePresenceNameResponse.Content.ReadAsStringAsync ());
                return ServicePresenceStatus;
            } catch (Exception ex) {
                throw ex;
            }
        }
        public async Task<Dictionary<string, string>> RetrieveSObjects (AuthenticationResponse Auth) {
            try {
                HttpRequestMessage RetrieveSObjects =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/");
                RetrieveSObjects.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrieveSObjectsResponse =
                    await httpClient.SendAsync (RetrieveSObjects);
                Dictionary<string, object> SObjectsPayload = JsonConvert.DeserializeObject<Dictionary<string, object>> (
                    await RetrieveSObjectsResponse.Content.ReadAsStringAsync ());
                Dictionary<string, object>[] SObjects = JsonConvert.DeserializeObject<Dictionary<string, object>[]> (
                    SObjectsPayload["sobjects"].ToString ());
                return this.GeneratePrefixList (SObjects);
            } catch (Exception ex) {
                throw ex;
            }
        }
        public Dictionary<string, string> GeneratePrefixList (Dictionary<string, object>[] SObjects) {
            Dictionary<string, string> PrefixList = new Dictionary<string, string> ();
            foreach (var SObject in SObjects) {
                try {
                    PrefixList.Add (SObject["keyPrefix"].ToString (), SObject["name"].ToString ());
                } catch (Exception ex) { }
            }
            return PrefixList;
        }
        public async Task<Dictionary<string, object>> RetrieveSObject (AuthenticationResponse Auth, string Type, string Id) {
            try {
                HttpRequestMessage RetrieveSObject =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/" + Type + "/" + Id);
                RetrieveSObject.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrieveSObjectResponse =
                    await httpClient.SendAsync (RetrieveSObject);
                Dictionary<string, object> SObject = JsonConvert.DeserializeObject<Dictionary<string, object>> (
                    await RetrieveSObjectResponse.Content.ReadAsStringAsync ());
                return SObject;
            } catch (Exception ex) {
                throw ex;
            }
        }
        public async Task<Dictionary<string, object>> RetrieveUser (AuthenticationResponse Auth, SalesforceObjects.Presence presence) {
            try {
                HttpRequestMessage RetrieveUser =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/User/" + presence.UserId);
                RetrieveUser.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrieveUserResponse =
                    await httpClient.SendAsync (RetrieveUser);
                Dictionary<string, object> User = JsonConvert.DeserializeObject<Dictionary<string, object>> (
                    await RetrieveUserResponse.Content.ReadAsStringAsync ());
                return User;
            } catch (Exception ex) {
                throw ex;
            }
        }
        public void Log (string type, string controller, string details) {
            Console.Write ("\n" + type + " received on " + controller + " controller " + DateTime.Now.ToString ("MM/dd/yyyy HH:mm:ss tt") + "\n");
            JObject parsed = JObject.Parse (details);

            foreach (var pair in parsed) {
                Console.WriteLine ("{0}: {1}", pair.Key, pair.Value);
            }
            Console.Write ("\n");
        }
        public class AuthenticationResponse {
            public string access_token { get; set; }
            public string instance_url { get; set; }
            public string id { get; set; }
            public string token_type { get; set; }
            public string issued_at { get; set; }
            public string signature { get; set; }
        }

    }
}