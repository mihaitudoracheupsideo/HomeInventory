namespace HomeInventory.Domain.Entities;

public interface ISyncEntity
{
    DateTime UpdatedAt { get; set; }
    bool Deleted { get; set; }
}