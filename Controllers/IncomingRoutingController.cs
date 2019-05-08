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
        private const string CLIENT_ID = "3MVG9oNqAtcJCF.Flzk4LQzXBamstCErrRDeF6K2e9fnHetMBwW8VHXxj8Gn5Leqx4zus.aCOcBQR6ld_cM7n";
        private const string CLIENT_SECRET = "F8C05DF2D80077D5D59F9A64BEAC16EC0997C2144C50D111F2B551808094ADF3";
        private const string CLIENT_USERNAME = "mvandenesse@amctechnology.com";
        private const string CLIENT_PASSWORD = "Interns2019CHjJDszbMIk6VdZJW6L01oORr";
        private static HttpClient httpClient;
        public IncomingRoutingController () {
            httpClient = new HttpClient ();
        }

        [HttpPost]
        public async Task<IActionResult> Index ([FromBody] PushTopic PushTopic) {
            try {
                HttpContent HttpContent = null;
                if (PushTopic.EventType == "presence") {
                    SalesforceObjects.Presence Presence = JsonConvert.DeserializeObject<SalesforceObjects.Presence> (JsonConvert.SerializeObject (PushTopic.SObject));
                    AuthenticationResponse AuthenticationResponse = await this.Authenticate ();
                    if (AuthenticationResponse.access_token == null) {
                        return StatusCode (401, "Authentication with Salesforce failed!");
                    } else {
                        SalesforceObjects.ServicePresenceStatus ServicePresenceStatus = await this.RetrievePresenceName (AuthenticationResponse, Presence);
                        Dictionary<string, string> User = await this.RetrieveUser (AuthenticationResponse, Presence);
                        Payload Payload = new Payload ();
                        Payload.presence = new Presence (ServicePresenceStatus.MasterLabel, User["Name"], Presence.UserId);
                        Payload.config = new RoutingConfig (PushTopic.Config.appId, PushTopic.Config.davinciAccountId, PushTopic.Config.davinciProfileId, PushTopic.Config.davinciUsername, PushTopic.Config.davinciPassword);
                        string Content = JsonConvert.SerializeObject (Payload);
                        HttpContent = new StringContent (Content, Encoding.UTF8, "application/json");
                    }
                } else if (PushTopic.EventType == "pending_service_routing") {

                } else if (PushTopic.EventType == "agent_work") {

                }
                var response = httpClient.PostAsync ("3", HttpContent);
            } catch (Exception ex) {
                return StatusCode (500, ex.Message);
            }
            return Ok ();
        }
        public async Task<AuthenticationResponse> Authenticate () {
            try {
                HttpRequestMessage Authenticate =
                    new HttpRequestMessage (HttpMethod.Post, "https://login.salesforce.com/services/oauth2/token");
                var AuthString = "grant_type=password&client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET + "&username=" + CLIENT_USERNAME + "&password=" + CLIENT_PASSWORD;
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
        public async Task<Dictionary<string, string>> RetrieveUser (AuthenticationResponse Auth, SalesforceObjects.Presence presence) {
            try {
                HttpRequestMessage RetrieveUser =
                    new HttpRequestMessage (HttpMethod.Get, Auth.instance_url + "/services/data/v45.0/sobjects/User/" + presence.UserId);
                RetrieveUser.Headers.Authorization = new AuthenticationHeaderValue ("Bearer", Auth.access_token);
                HttpResponseMessage RetrieveUserResponse =
                    await httpClient.SendAsync (RetrieveUser);
                Dictionary<string, string> User = JsonConvert.DeserializeObject<Dictionary<string, string>> (
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