using HomeInventory.Domain;
using HomeInventory.Repository;
using HomeInventory.WebApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace HomeInventory.WebApi.Tests;

public class ItemsControllerTests
{
    private readonly Mock<IItemRepository> _mockRepo;
    private readonly IMemoryCache _cache;
    private readonly ItemsController _controller;

    public ItemsControllerTests()
    {
        _mockRepo = new Mock<IItemRepository>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _controller = new ItemsController(_mockRepo.Object, _cache);
    }

    [Fact]
    public async Task GetItems_ReturnsOkResult_WithItems()
    {
        // Arrange
        var items = new List<Item>
        {
            new Item { Id = Guid.NewGuid(), Name = "Test Item", Description = "Test Desc", ItemTypeId = Guid.NewGuid() }
        };
        _mockRepo.Setup(repo => repo.GetItemsWithDependenciesAsync()).ReturnsAsync(items);

        // Act
        var result = await _controller.GetItems();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        dynamic value = okResult.Value!;
        Assert.NotNull(value.Data);
        Assert.Equal(1, value.TotalCount);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenItemDoesNotExist()
    {
        // Arrange
        _mockRepo.Setup(repo => repo.GetItemWithTypeAsync(It.IsAny<Guid>())).ReturnsAsync((Item?)null);

        // Act
        var result = await _controller.GetById(Guid.NewGuid());

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction_WithItem()
    {
        // Arrange
        var item = new Item { Name = "New Item", Description = "New Desc", ItemTypeId = Guid.NewGuid() };
        _mockRepo.Setup(repo => repo.AddAsync(It.IsAny<Item>())).Returns(Task.CompletedTask);

        // Act
        var result = await _controller.Create(item);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(_controller.GetById), createdResult.ActionName);
    }
}
