using System;

namespace HomeInventory.Domain
{
    public class Location
    {
        public Guid Id { get; set; }
        public Guid ItemId { get; set; }
        public Guid LocationItemId { get; set; }
        public DateTime AddedAt { get; set; }
        public bool Current { get; set; }

        // Navigation properties
        public virtual Item Item { get; set; }
        public virtual Item LocationItem { get; set; }
    }
}