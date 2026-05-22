using HomeInventory.Domain;
using HomeInventory.Domain.Entities;
using HomeInventory.Domain.Entities.Alerts;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) 
        : base(options) { }

    public DbSet<Item> Item { get; set; }
    public DbSet<ItemType> ItemType { get; set; }
    public DbSet<Location> Location { get; set; }
    public DbSet<LocationHistory> LocationHistory { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<ItemTag> ItemTags { get; set; }
    public DbSet<AlertDefinition> AlertDefinitions { get; set; }
    public DbSet<AlertOccurrence> AlertOccurrences { get; set; }
    public DbSet<AlertNotificationSettings> AlertNotificationSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Guid ca primary key
        modelBuilder.Entity<Item>()
            .HasKey(i => i.Id);

        modelBuilder.Entity<Item>()
            .HasQueryFilter(item => !item.Deleted);

        modelBuilder.Entity<ItemType>()
            .HasKey(ot => ot.Id);

        modelBuilder.Entity<ItemType>()
            .HasQueryFilter(itemType => !itemType.Deleted);

        modelBuilder.Entity<Location>()
            .HasKey(l => l.Id);

        modelBuilder.Entity<LocationHistory>()
            .HasKey(lh => lh.Id);

        // Tag configuration
        modelBuilder.Entity<Tag>()
            .HasKey(t => t.Id);

        modelBuilder.Entity<Tag>()
            .HasQueryFilter(tag => !tag.Deleted);

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

        modelBuilder.Entity<Item>()
            .HasIndex(i => i.UpdatedAt);

        modelBuilder.Entity<Item>()
            .HasIndex(i => i.Deleted);

        modelBuilder.Entity<ItemType>()
            .HasIndex(it => it.Name);

        modelBuilder.Entity<ItemType>()
            .HasIndex(itemType => itemType.UpdatedAt);

        modelBuilder.Entity<ItemType>()
            .HasIndex(itemType => itemType.Deleted);

        modelBuilder.Entity<Tag>()
            .HasIndex(tag => tag.UpdatedAt);

        modelBuilder.Entity<Tag>()
            .HasIndex(tag => tag.Deleted);

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

        // Location relationships
        modelBuilder.Entity<Location>()
            .HasOne(l => l.Item)
            .WithMany()
            .HasForeignKey(l => l.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Location>()
            .HasOne(l => l.LocationItem)
            .WithMany()
            .HasForeignKey(l => l.LocationItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for Location
        modelBuilder.Entity<Location>()
            .HasIndex(l => l.ItemId);

        modelBuilder.Entity<Location>()
            .HasIndex(l => l.LocationItemId);

        modelBuilder.Entity<Location>()
            .HasIndex(l => l.AddedAt);

        modelBuilder.Entity<Location>()
            .HasIndex(l => new { l.ItemId, l.Current });

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

        modelBuilder.Entity<AlertDefinition>()
            .HasKey(definition => definition.Id);

        modelBuilder.Entity<AlertDefinition>()
            .HasIndex(definition => new { definition.SourceModule, definition.Name })
            .IsUnique();

        modelBuilder.Entity<AlertDefinition>()
            .HasIndex(definition => definition.IsEnabled);

        modelBuilder.Entity<AlertDefinition>()
            .Property(definition => definition.Name)
            .HasMaxLength(120);

        modelBuilder.Entity<AlertDefinition>()
            .Property(definition => definition.SourceModule)
            .HasMaxLength(80);

        modelBuilder.Entity<AlertDefinition>()
            .Property(definition => definition.MessageTemplate)
            .HasMaxLength(500);

        modelBuilder.Entity<AlertOccurrence>()
            .HasKey(occurrence => occurrence.Id);

        modelBuilder.Entity<AlertOccurrence>()
            .HasOne(occurrence => occurrence.AlertDefinition)
            .WithMany(definition => definition.Occurrences)
            .HasForeignKey(occurrence => occurrence.AlertDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AlertOccurrence>()
            .HasIndex(occurrence => new { occurrence.AlertDefinitionId, occurrence.PeriodKey })
            .IsUnique();

        modelBuilder.Entity<AlertOccurrence>()
            .HasIndex(occurrence => new { occurrence.Status, occurrence.DueAtUtc });

        modelBuilder.Entity<AlertOccurrence>()
            .HasIndex(occurrence => new { occurrence.AlertDefinitionId, occurrence.Status });

        modelBuilder.Entity<AlertNotificationSettings>()
            .HasKey(settings => settings.Id);

        modelBuilder.Entity<AlertNotificationSettings>()
            .Property(settings => settings.FromEmail)
            .HasMaxLength(256);

        modelBuilder.Entity<AlertNotificationSettings>()
            .Property(settings => settings.FromName)
            .HasMaxLength(120);

        modelBuilder.Entity<AlertNotificationSettings>()
            .Property(settings => settings.RecipientsJson)
            .HasMaxLength(4000);

        modelBuilder.Entity<AlertNotificationSettings>()
            .Property(settings => settings.SmtpHost)
            .HasMaxLength(256);

        modelBuilder.Entity<AlertNotificationSettings>()
            .Property(settings => settings.SmtpUsername)
            .HasMaxLength(256);

        modelBuilder.Entity<AlertNotificationSettings>()
            .Property(settings => settings.SmtpPasswordProtected)
            .HasMaxLength(4000);

        modelBuilder.Entity<AlertNotificationSettings>()
            .Property(settings => settings.SubjectTemplate)
            .HasMaxLength(200);

        modelBuilder.Entity<AlertNotificationSettings>()
            .Property(settings => settings.HtmlTemplate)
            .HasMaxLength(12000);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<ISyncEntity>())
        {
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.Deleted = true;
                entry.Entity.UpdatedAt = DateTime.UtcNow;
                continue;
            }

            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        foreach (var entry in ChangeTracker.Entries<AlertDefinition>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = DateTime.UtcNow;
            }

            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        foreach (var entry in ChangeTracker.Entries<AlertOccurrence>())
        {
            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        foreach (var entry in ChangeTracker.Entries<AlertNotificationSettings>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = DateTime.UtcNow;
            }

            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
