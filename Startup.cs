using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.AspNetCore.SpaServices.Webpack;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Microsoft.AspNetCore.NodeServices.Util;
using Microsoft.AspNetCore.SpaServices.Util;
using Microsoft.AspNetCore.NodeServices.Npm;
using Microsoft.AspNetCore.Authentication.Cookies;
using System;
using Salesforce.Models;
using System.Net;

namespace Salesforce
{
    public class Startup
    {
        private static CustomJwtDataFormat CustomJwtDataFormat = new CustomJwtDataFormat();

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();

            services.AddAuthentication(options => {
                options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            }).AddCookie(options => {
                options.Cookie.Expiration = TimeSpan.FromDays(14);
                options.Cookie.Name = "access_token";
                options.Cookie.Domain = Environment.GetEnvironmentVariable("AUTH_COOKIE_DOMAIN");
                options.TicketDataFormat = CustomJwtDataFormat;
            });

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist";
            });

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();

                app.UseWebpackDevMiddleware(new WebpackDevMiddlewareOptions
                {
                    HotModuleReplacement = true,
                    ProjectPath = Path.Combine(Directory.GetCurrentDirectory(), "ClientApp")
                });
            } else {
                // Check auth of user
                app.Use(async (context, next) => {
                    var authTicket = CustomJwtDataFormat.Unprotect(context.Request.Cookies["access_token"]);

                    if (authTicket != null && authTicket.Principal.IsInRole("Agent")) {
                        await next.Invoke();
                    } else {
                        context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    }
                });
            }

            

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseMvc(routes =>
            {
                routes.MapSpaFallbackRoute(
                  name: "spa-fallback",
                  defaults: new { controller = "Home", action = "Index" });
            });
        }
    }
}
