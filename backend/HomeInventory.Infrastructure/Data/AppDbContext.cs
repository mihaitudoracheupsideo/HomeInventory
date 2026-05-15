using HomeInventory.Domain;
using HomeInventory.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) 
        : base(options) { }

    public DbSet<Item> Item { get; set; }
    public DbSet<ItemType> ItemType { get; set; }
    public DbSet<LocationHistory> LocationHistory { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<ItemTag> ItemTags { get; set; }

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

        // Tag configuration
        modelBuilder.Entity<Tag>()
            .HasKey(t => t.Id);

        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.NormalizedName)
            .IsUnique();

        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.Name);

        // ItemTag configuration (junction table)
        modelBuilder.Entity<ItemTag>()
            .HasKey(it => new { it.ItemId, it.TagId });

        modelBuilder.Entity<ItemTag>()
            .HasOne(it => it.Item)
            .WithMany(i => i.ItemTags)
            .HasForeignKey(it => it.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ItemTag>()
            .HasOne(it => it.Tag)
            .WithMany(t => t.ItemTags)
            .HasForeignKey(it => it.TagId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for performance
        modelBuilder.Entity<Item>()
            .HasIndex(i => i.Name);

        modelBuilder.Entity<ItemType>()
            .HasIndex(it => it.Name);

        // Item relationships
        modelBuilder.Entity<Item>()
            .HasOne(i => i.Parent)
            .WithMany(i => i.Children)
            .HasForeignKey(i => i.ParentItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for hierarchy
        modelBuilder.Entity<Item>()
            .HasIndex(i => i.ParentItemId);

        modelBuilder.Entity<Item>()
            .HasIndex(i => i.Path);

        modelBuilder.Entity<Item>()
            .HasIndex(i => i.Depth);

        modelBuilder.Entity<Item>()
            .HasIndex(i => i.NodeIndex);

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

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Item>())
        {
            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
        return await base.SaveChangesAsync(cancellationToken);
    }
}
