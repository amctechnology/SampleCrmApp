using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Runtime.Serialization.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Salesforce.Models;
using Salesforce.Models;

namespace DynamicsApp.Controllers {
    public class IncomingRoutingController : Controller {
        private static HttpClient httpClient;
        private AppRoutingConfig appRoutingConfig;
        public IncomingRoutingController (AppRoutingConfig appRoutingConfig) {
            httpClient = new HttpClient ();
            this.appRoutingConfig = appRoutingConfig;
        }

        [HttpPost]
        public IActionResult Index ([FromBody] Payload payload) {
            try {
                if (payload.agentWork != null) {
                    Log ("Agent Work", "Incoming Routing", JsonConvert.SerializeObject (payload.agentWork));
                } else if (payload.pendingWork != null) {
                    Log ("Pending Work", "Incoming Routing", JsonConvert.SerializeObject (payload.pendingWork));
                } else if (payload.presence != null) {
                    Log ("Presence", "Incoming Routing", JsonConvert.SerializeObject (payload.presence));
                }
                string content = JsonConvert.SerializeObject (payload);
                HttpContent httpContent = new StringContent (content, Encoding.UTF8, "application/json");
                var response = httpClient.PostAsync (appRoutingConfig.cloudRoutingUri, httpContent);
            } catch (HttpRequestException ex) {
                return StatusCode (500, ex.Message);
            }
            return Ok ();
        }
        public void Log (string type, string controller, string details) {
            Console.Write ("\n" + type + " received on " + controller + " controller " + DateTime.Now.ToString ("MM/dd/yyyy HH:mm:ss tt") + "\n");
            JObject parsed = JObject.Parse (details);

            foreach (var pair in parsed) {
                Console.WriteLine ("{0}: {1}", pair.Key, pair.Value);
            }
            Console.Write ("\n");
        }
    }
}