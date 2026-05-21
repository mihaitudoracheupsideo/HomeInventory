namespace HomeInventory.WebApi;

public class SyncResponse<T>
{
    public IEnumerable<T> Data { get; set; } = Array.Empty<T>();
    public DateTime SyncTimestamp { get; set; } = DateTime.UtcNow;
}