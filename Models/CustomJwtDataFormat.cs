using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;

namespace Salesforce.Models {
    class CustomJwtDataFormat : ISecureDataFormat<AuthenticationTicket> {
        private struct JsonClaim {
            public string type;
            public string value;
        }

        private static readonly string AuthProvider = Environment.GetEnvironmentVariable("AUTH_PROVIDER_URL");
        private HttpClient client;
        public CustomJwtDataFormat() {
            client = new HttpClient();
        }
        public AuthenticationTicket Unprotect(string protectedText) => Unprotect(protectedText, null);
        
        public AuthenticationTicket Unprotect(string protectedText, string purpose) {
            try
            {
                client.DefaultRequestHeaders.Add("Cookie", "access_token=" + protectedText);
                var claimsResponse = client.GetAsync(AuthProvider + "/api/session/claims").Result;
                if(claimsResponse.IsSuccessStatusCode) {
                    JsonClaim[] jsonClaims = JsonConvert.DeserializeObject<JsonClaim[]>(claimsResponse.Content.ReadAsStringAsync().Result);
                    var claims = new List<Claim>();
                    foreach(var claim in jsonClaims) {
                        claims.Add(new Claim(claim.type, claim.value));
                    }
                    var ClaimsIdentity = new ClaimsIdentity(claims);
                    var Principal = new ClaimsPrincipal(ClaimsIdentity);
                    return new AuthenticationTicket(Principal, new AuthenticationProperties(), "Cookie");
                }
            }
            catch (Exception e)
            {
                //Log here
            }
            return null;
        }

        public string Protect(AuthenticationTicket data) {
            throw new NotImplementedException();
        }
        public string Protect(AuthenticationTicket data, string purpose) {
            throw new NotImplementedException();
        }
    }
}