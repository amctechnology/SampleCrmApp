using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SalesforceCloudCore.Models;

namespace SalesforceCloudCore.Controllers
{
     public class LoggerController : Controller,IAMCLogger
    {
        ILogger<LoggerController> _logger;
        public LoggerController(ILogger<LoggerController> logger)
        {
            if (logger != null)
            {
                _logger = logger;
            }
        }


        [HttpGet]
        public int GetLoglevel()
        {
           
            if(_logger.IsEnabled(LogLevel.Trace))
            {
               return Convert.ToInt32(LogLevel.Trace);
            }
            
            if(_logger.IsEnabled(LogLevel.Debug))
            {
                return Convert.ToInt32(LogLevel.Debug);
            }

            if(_logger.IsEnabled(LogLevel.Information))
            {
                 return Convert.ToInt32(LogLevel.Information);
            }
            if(_logger.IsEnabled(LogLevel.Warning))
            {
                 return Convert.ToInt32(LogLevel.Warning);
            }
            if(_logger.IsEnabled(LogLevel.Error))
            {
                 return Convert.ToInt32(LogLevel.Error);
            }

            if(_logger.IsEnabled(LogLevel.Critical))
            {
                 return Convert.ToInt32(LogLevel.Critical);
            }
            return Convert.ToInt32(LogLevel.None);

        }
       
        [HttpPost]
        public void PushLogs(string message)
        
        {

            if(_logger.IsEnabled(LogLevel.Trace))
            {
                _logger.LogTrace(message);
                return;
            }

            if(_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug(message);
                return;
            }
            
            if(_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(message);
            }

            if(_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(message);
                return;
            }

            if(_logger.IsEnabled(LogLevel.Error))
            {
                _logger.LogError(message);
                return;
            }

            if(_logger.IsEnabled(LogLevel.Critical))
            {
                _logger.LogCritical(message);
                return;
            }
        } 
    }
}