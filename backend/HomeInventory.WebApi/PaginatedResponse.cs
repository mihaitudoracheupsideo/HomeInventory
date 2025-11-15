namespace HomeInventory.WebApi;

public class PaginatedResponse<T>
{
    public IEnumerable<T> Data { get; set; } = new List<T>();
    public int TotalCount { get; set; }
}