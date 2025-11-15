using HomeInventory.Domain;
using Microsoft.EntityFrameworkCore;

namespace HomeInventory.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) 
        : base(options) { }

    public DbSet<Item> Item { get; set; }
    public DbSet<ItemType> ItemType { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Guid ca primary key
        modelBuilder.Entity<Item>()
            .HasKey(i => i.Id);

        modelBuilder.Entity<ItemType>()
            .HasKey(ot => ot.Id);

        // Indexes for performance
        modelBuilder.Entity<Item>()
            .HasIndex(i => i.Name);

        modelBuilder.Entity<ItemType>()
            .HasIndex(it => it.Name);
    }
}
