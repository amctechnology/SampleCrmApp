namespace Salesforce.Models
{
    public interface IAMCLogger
    {
        void PushLogs(string message);
        
        int GetLoglevel();

    }
}
