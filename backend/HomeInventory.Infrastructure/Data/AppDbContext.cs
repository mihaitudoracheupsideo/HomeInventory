using HomeInventory.Domain;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) 
        : base(options) { }

    public DbSet<Item> Item { get; set; }
    public DbSet<ItemType> ItemType { get; set; }
    public DbSet<LocationHistory> LocationHistory { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Guid ca primary key
        modelBuilder.Entity<Item>()
            .HasKey(i => i.Id);

        modelBuilder.Entity<ItemType>()
            .HasKey(ot => ot.Id);

        modelBuilder.Entity<LocationHistory>()
            .HasKey(lh => lh.Id);

        // Indexes for performance
        modelBuilder.Entity<Item>()
            .HasIndex(i => i.Name);

        modelBuilder.Entity<ItemType>()
            .HasIndex(it => it.Name);

        // Item relationships
        modelBuilder.Entity<Item>()
            .HasOne(i => i.CurrentLocationItem)
            .WithMany(i => i.StoredItems)
            .HasForeignKey(i => i.CurrentLocationItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // LocationHistory relationships
        modelBuilder.Entity<LocationHistory>()
            .HasOne(lh => lh.Item)
            .WithMany(i => i.LocationHistory)
            .HasForeignKey(lh => lh.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LocationHistory>()
            .HasOne(lh => lh.LocationItem)
            .WithMany()
            .HasForeignKey(lh => lh.LocationItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for LocationHistory
        modelBuilder.Entity<LocationHistory>()
            .HasIndex(lh => lh.ItemId);

        modelBuilder.Entity<LocationHistory>()
            .HasIndex(lh => lh.AddedAt);

        modelBuilder.Entity<LocationHistory>()
            .HasIndex(lh => new { lh.ItemId, lh.AddedAt });
    }
}
