using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Authentication;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;

namespace Salesforce.Models {
    class CustomJwtDataFormat : ISecureDataFormat<AuthenticationTicket> {
        private static readonly string AuthProvider = Environment.GetEnvironmentVariable("AUTH_PROVIDER_URL");
        private static readonly bool isDevelopmentEnvironment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
        private HttpClient client;
        private SecurityKey PublicSecurityKey;       
        public CustomJwtDataFormat() {
            var httpClientHandler = new HttpClientHandler();
            if(isDevelopmentEnvironment) {
                httpClientHandler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true;
            }

            client = new HttpClient(httpClientHandler);
            UpdatePublicKey();
        }
        private void UpdatePublicKey()
        {
            var publicKey = client.GetAsync(AuthProvider + "/api/Session/PublicKey").Result;
            if (!publicKey.IsSuccessStatusCode) {
                throw new Exception("Failed to retrieve public key from auth service!!!", new Exception(publicKey.ToString()));
            }
            var RSAParameters = JsonConvert.DeserializeObject<System.Security.Cryptography.RSAParameters>(publicKey.Content.ReadAsStringAsync().Result);
            PublicSecurityKey = new RsaSecurityKey(RSAParameters);
        }
        public AuthenticationTicket Unprotect(string protectedText) => Unprotect(protectedText, null);
        
        public AuthenticationTicket Unprotect(string Token, string purpose) {
            try
            {
                if(Token == null) {
                    throw new ArgumentNullException();
                }

                var TokenHandler = new JwtSecurityTokenHandler();
                var JwtToken = TokenHandler.ReadToken(Token) as JwtSecurityToken;

                if (JwtToken == null)
                    return null;
                var ValidationParameters = new TokenValidationParameters()
                {
                    RequireExpirationTime = true,
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    IssuerSigningKey = PublicSecurityKey,
                    ClockSkew = new TimeSpan()
                };

                SecurityToken SecurityToken;

                ClaimsPrincipal Principal = null;
                try {
                    Principal = TokenHandler.ValidateToken(Token, ValidationParameters, out SecurityToken);                    
                }
                catch (Microsoft.IdentityModel.Tokens.SecurityTokenInvalidSignatureException) {
                    // TODO: log error
                    UpdatePublicKey();

                    //Try again with updated key
                    ValidationParameters.IssuerSigningKey = PublicSecurityKey;
                    Principal = TokenHandler.ValidateToken(Token, ValidationParameters, out SecurityToken);                    
                }

                if(Principal != null) {
                    return new AuthenticationTicket(Principal, new AuthenticationProperties(), "Cookie");
                }
            }
            catch (Exception)
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