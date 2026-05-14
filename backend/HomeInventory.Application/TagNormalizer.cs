namespace HomeInventory.Application.Services;

public interface ITagNormalizer
{
    string Normalize(string tagName);
}

public class TagNormalizer : ITagNormalizer
{
    public string Normalize(string tagName)
    {
        if (string.IsNullOrWhiteSpace(tagName))
            return string.Empty;

        return tagName.Trim().ToUpperInvariant();
    }
}